#!/usr/bin/env node
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
// Drop X-Powered-By so the Node/Express stack isn't broadcast to every
// response (DISA Web Server STIG: WGSU-AS-000080 alignment).
app.disable('x-powered-by')

// === PORT CONFIGURATION ===
// CRITICAL: Use PORT environment variable provided by Railway
// Railway injects PORT automatically - must listen on 0.0.0.0
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const API_KEY = process.env.ANTHROPIC_API_KEY
const distPath = path.join(__dirname, '..', 'dist')
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://nominatim.openstreetmap.org https://router.project-osrm.org https://*.tile.openstreetmap.org",
  "frame-src 'self' https://maps.google.com https://www.google.com https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ')

console.log('[SERVER] ════════════════════════════════════════════════════════')
console.log('[SERVER] PCS Express - Node.js Backend Server')
console.log('[SERVER] ════════════════════════════════════════════════════════')
console.log(`[SERVER] HOST: ${HOST}`)
console.log(`[SERVER] PORT: ${PORT}`)
console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`[SERVER] DIST: ${distPath}`)
console.log(`[SERVER] FRONTEND: ${fs.existsSync(distPath) ? 'BUILT' : 'MISSING'}`)
console.log('[SERVER] ════════════════════════════════════════════════════════')

// === MIDDLEWARE ===
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', csp)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  next()
})
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    return cb(null, false)
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400,
}))
app.use(express.json({ limit: '1mb' }))

// === HEALTH ENDPOINTS ===
// CRITICAL for Railway: Must respond with 200 OK
app.get('/health', (req, res) => {
  res.status(200).json({ ok: 1, service: 'express', port: PORT })
})

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: 1, service: 'express-api', port: PORT })
})

// === API ROUTES (MUST BE BEFORE STATIC/FRONTEND) ===

// === BASE REVIEWS PUBLIC METADATA ENDPOINTS ===
// IL2-style data handling: these endpoints reject raw PII and expose public
// review metadata only. Raw .mil email addresses, orders, DoD IDs, phone
// numbers, addresses, and documents must be verified upstream and represented
// only as a verification status or non-reversible token hash.
const BASE_REVIEW_SCHEMA = Object.freeze({
  table: 'BaseReviews',
  fields: ['InstallationName', 'Category', 'Rating', 'UserRank', 'MilitaryFamilyVerified', 'VerificationMethod'],
  categories: ['Housing', 'Schools', 'Childcare'],
  piiExcluded: ['raw_email', 'orders', 'dod_id', 'phone', 'home_address', 'documents'],
});

function containsLikelyPii(value) {
  const text = JSON.stringify(value || {});
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) || /\b\d{10}\b/.test(text) || /\b\d{3}-\d{2}-\d{4}\b/.test(text);
}

app.get('/api/base-reviews/schema', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(BASE_REVIEW_SCHEMA);
});

app.post('/api/base-reviews/validate', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { InstallationName, Category, Rating, UserRank } = req.body || {};
  if (containsLikelyPii(req.body)) return res.status(400).json({ error: 'Raw PII is not accepted by this endpoint.' });
  if (!InstallationName || typeof InstallationName !== 'string') return res.status(400).json({ error: 'InstallationName is required.' });
  if (!BASE_REVIEW_SCHEMA.categories.includes(Category)) return res.status(400).json({ error: 'Category must be Housing, Schools, or Childcare.' });
  if (!Number.isFinite(Number(Rating)) || Number(Rating) < 1 || Number(Rating) > 5) return res.status(400).json({ error: 'Rating must be 1 through 5.' });
  if (!/^(E|O|W)-[1-9]0?$/.test(String(UserRank || ''))) return res.status(400).json({ error: 'UserRank must be a paygrade such as E-5 or O-3.' });
  res.status(200).json({ ok: true, message: 'Review metadata passes public-schema validation. Persist with the BaseReviews SQL schema after authenticated verification.' });
});

// In-memory per-IP rate limit for /api/ai. The nginx layer also rate-
// limits (30/min, burst 10) so this is a defense-in-depth tier. Aligned
// with NIST SP 800-53 SC-5 (DoS protection) and OWASP ASVS V4 (5.4).
const _aiHits = new Map(); // ip -> { count, windowStart }
const AI_RATE_LIMIT = 20;          // 20 requests
const AI_RATE_WINDOW_MS = 60_000;  // per 60 seconds

function aiRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const entry = _aiHits.get(ip);
  if (!entry || now - entry.windowStart > AI_RATE_WINDOW_MS) {
    _aiHits.set(ip, { count: 1, windowStart: now });
    return next();
  }
  if (entry.count >= AI_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  entry.count += 1;
  return next();
}

// Strict input validation for /api/ai per DISA Application Security &
// Development STIG (APSC-DV-002400 / 002460: input length, character
// validation). Rejects: non-strings, oversized payloads, anything that
// looks like a credential / SSN / email / phone (already detected by
// the existing containsLikelyPii helper).
const AI_MAX_LEN = 4_000;

app.post('/api/ai', aiRateLimit, async (req, res) => {
  try {
    const { system, user } = req.body || {}

    if (typeof system !== 'string' || typeof user !== 'string') {
      return res.status(400).json({ error: 'system and user must be strings' })
    }
    if (!system || !user) {
      return res.status(400).json({ error: 'Missing system or user parameter' })
    }
    if (system.length > AI_MAX_LEN || user.length > AI_MAX_LEN) {
      return res.status(413).json({ error: `Input too long. Each field is capped at ${AI_MAX_LEN} characters.` })
    }
    if (containsLikelyPii({ system, user })) {
      return res.status(400).json({ error: 'Input appears to contain PII (email / phone / SSN-like patterns). PCS Express will not forward this to the translation provider.' })
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const signal = AbortSignal.timeout(15000)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal,
    })

    if (!response.ok) {
      console.error(`[API] Anthropic error: ${response.status}`)
      return res.status(502).json({ error: 'Anthropic API error' })
    }

    const data = await response.json()
    res.status(200).json({ text: data.content?.[0]?.text || 'No response' })
  } catch (err) {
    console.error(`[API] Error: ${err.message}`)
    res.status(503).json({ error: 'Service unavailable' })
  }
})

// === VETERAN-OWNED BUSINESS LOOKUP (SAM.gov ENTITY API PROXY) ===
// Live proxy to SAM.gov's public Entity API v3 filtered for veteran-owned
// (A5/A6) and service-disabled veteran-owned (QF/27) business types near
// the gaining installation's city/state. Degrades to an empty payload
// with `fallback:true` when SAM_API_KEY is unset so the frontend can show
// its static SBA/SAM source links instead. Falls through gracefully on
// upstream errors for the same reason - no exception ever surfaces to
// the user as a hard failure.
const SAM_API_KEY = process.env.SAM_API_KEY || ''
const SAM_API_BASE = 'https://api.sam.gov/entity-information/v3/entities'
// SAM.gov business type codes that indicate veteran ownership. Pulled
// from the public SBT (Small Business Type) reference list.
const VETERAN_BUSINESS_CODES = new Set(['A5', 'A6', 'QF', '27', 'XX', 'SDVOSB', 'VOSB'])
const VET_BIZ_CACHE = new Map()
const VET_BIZ_TTL_MS = 24 * 60 * 60 * 1000
const VET_BIZ_RATE_LIMIT = 30
const VET_BIZ_RATE_WINDOW_MS = 60_000
const _vetBizHits = new Map()

function vetBizRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _vetBizHits.get(ip)
  if (!entry || now - entry.windowStart > VET_BIZ_RATE_WINDOW_MS) {
    _vetBizHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= VET_BIZ_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', businesses: [], fallback: true })
  }
  entry.count += 1
  return next()
}

function sanitizeQueryParam(value, maxLen = 60) {
  // Strip anything other than letters, digits, spaces, hyphen, period,
  // apostrophe. Forward-only validation - SAM.gov rejects most exotic
  // characters anyway, but defense-in-depth prevents accidental URL
  // injection into the upstream query.
  return String(value || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, maxLen)
}

function isVeteranBusinessEntity(entity) {
  const list = entity?.coreData?.businessTypes?.businessTypeList || []
  return list.some(bt => VETERAN_BUSINESS_CODES.has(String(bt?.businessTypeCode || '').toUpperCase()))
}

// Classify an entity as goods-producing ("business") vs service-providing
// ("service") using the primary NAICS code prefix. Per the U.S. Census
// NAICS structure:
//   Goods / business: 11, 21, 22, 23, 31-33 (mfg), 42 (wholesale), 44-45 (retail)
//   Service:          48-49, 51-56, 61, 62, 71, 72, 81, 92
// Anything we cannot classify falls through to "business" by default.
const GOODS_NAICS_PREFIXES = new Set(['11', '21', '22', '23', '31', '32', '33', '42', '44', '45'])
const SERVICE_NAICS_PREFIXES = new Set(['48', '49', '51', '52', '53', '54', '55', '56', '61', '62', '71', '72', '81', '92'])
function classifyByNaics(naicsCode) {
  const prefix = String(naicsCode || '').slice(0, 2)
  if (SERVICE_NAICS_PREFIXES.has(prefix)) return 'service'
  if (GOODS_NAICS_PREFIXES.has(prefix)) return 'business'
  return 'business'
}

function shapeBusiness(entity) {
  const reg = entity?.entityRegistration || {}
  const addr = entity?.coreData?.physicalAddress || {}
  const poc = entity?.pointsOfContact?.governmentBusinessPOC || entity?.pointsOfContact?.electronicBusinessPOC || {}
  const businessTypes = (entity?.coreData?.businessTypes?.businessTypeList || [])
    .filter(bt => VETERAN_BUSINESS_CODES.has(String(bt?.businessTypeCode || '').toUpperCase()))
    .map(bt => bt.businessTypeDesc || bt.businessTypeCode)
  const naicsList = entity?.coreData?.naicsList || entity?.assertions?.goodsAndServices?.naicsList || []
  const primaryNaics = (naicsList.find(n => n?.primary || n?.naicsPrimary === 'Y') || naicsList[0] || {})
  const naicsCode = primaryNaics.naicsCode || ''
  const naicsDesc = primaryNaics.naicsDescription || primaryNaics.naicsDesc || ''
  return {
    id: reg.ueiSAM || reg.cageCode || reg.legalBusinessName,
    name: reg.legalBusinessName || 'Veteran-owned business',
    address: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
    city: addr.city || '',
    state: addr.stateOrProvinceCode || '',
    zip: addr.zipCode || '',
    businessTypes,
    naicsCode,
    naicsDesc,
    industry: classifyByNaics(naicsCode),
    url: reg.entityUrl || '',
    phone: poc.usPhone || '',
    contact: poc.fullName || '',
    samUrl: reg.ueiSAM ? `https://sam.gov/entity/${encodeURIComponent(reg.ueiSAM)}/view` : 'https://sam.gov/entity-information',
  }
}

app.get('/api/vet-businesses', vetBizRateLimit, async (req, res) => {
  const city = sanitizeQueryParam(req.query.city)
  const state = sanitizeQueryParam(req.query.state, 16)
  const zip = sanitizeQueryParam(req.query.zip, 10)
  if (!city && !zip) {
    return res.status(400).json({ error: 'city or zip is required', businesses: [], fallback: true })
  }

  // No API key configured: tell the client to fall back to static
  // source-link cards. We intentionally do NOT 500 here - the absence
  // of an API key is an expected operational mode (e.g., local dev).
  if (!SAM_API_KEY) {
    return res.status(200).json({ businesses: [], fallback: true, reason: 'no-api-key' })
  }

  const cacheKey = `${city}|${state}|${zip}`
  const cached = VET_BIZ_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < VET_BIZ_TTL_MS) {
    return res.status(200).json({ businesses: cached.businesses, fallback: cached.businesses.length === 0, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  try {
    const params = new URLSearchParams()
    params.set('api_key', SAM_API_KEY)
    params.set('registrationStatus', 'A')
    if (city) params.set('physicalAddress.city', city)
    if (state) params.set('physicalAddress.stateOrProvinceCode', state)
    if (zip) params.set('physicalAddress.zipCode', zip.split('-')[0])
    params.set('includeSections', 'entityRegistration,coreData,pointsOfContact')
    // Conservative page size - keeps payload reasonable for mobile
    // clients and respects the upstream's per-request limits.
    params.set('size', '40')
    const url = `${SAM_API_BASE}?${params.toString()}`
    const signal = AbortSignal.timeout(15000)
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal })
    if (!response.ok) {
      console.error(`[vet-businesses] SAM.gov ${response.status}`)
      return res.status(200).json({ businesses: [], fallback: true, reason: `upstream-${response.status}` })
    }
    const data = await response.json()
    const entities = Array.isArray(data?.entityData) ? data.entityData : []
    const veteranOnly = entities.filter(isVeteranBusinessEntity).map(shapeBusiness)
    // Cap returned results so the UI stays responsive on slow devices.
    const businesses = veteranOnly.slice(0, 25)
    // Only cache non-empty results - empty responses are usually
    // transient upstream failures and we want the next request to
    // retry, not be served the empty cache for 24h.
    if (businesses.length > 0) {
      VET_BIZ_CACHE.set(cacheKey, { businesses, fetchedAt: Date.now() })
    }
    return res.status(200).json({ businesses, fallback: businesses.length === 0, source: 'sam.gov', fetchedAt: Date.now() })
  } catch (err) {
    console.error(`[vet-businesses] ${err.message}`)
    return res.status(200).json({ businesses: [], fallback: true, reason: 'network-error' })
  }
})

// === HOUSING RENTAL LISTINGS (RAPIDAPI PROXY) ===
// Live proxy to a third-party rentals aggregator on RapidAPI. Degrades
// to {listings:[], fallback:true} when RAPIDAPI_KEY is unset so the
// frontend keeps its existing static HOMES.mil / MilitaryINSTALLATIONS
// / branch-housing source-link cards in place. HOMES.mil itself has no
// public API; this endpoint exists to surface civilian rental
// listings near the gaining installation when a paid API key is
// available.
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'realty-mole-property-api.p.rapidapi.com'
const RAPIDAPI_PATH = process.env.RAPIDAPI_PATH || '/rentalListings'
const HOUSING_CACHE = new Map()
const HOUSING_TTL_MS = 6 * 60 * 60 * 1000   // 6h
const HOUSING_RATE_LIMIT = 30
const HOUSING_RATE_WINDOW_MS = 60_000
const _housingHits = new Map()

function housingRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _housingHits.get(ip)
  if (!entry || now - entry.windowStart > HOUSING_RATE_WINDOW_MS) {
    _housingHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= HOUSING_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', listings: [], fallback: true })
  }
  entry.count += 1
  return next()
}

function shapeListing(raw) {
  // RealtyMole-style shape (with defensive lookups for the common
  // alternative aggregators on RapidAPI - the field names differ).
  const address = raw.formattedAddress || raw.addressLine1 || raw.address || ''
  const city = raw.city || raw.addressCity || ''
  const state = raw.state || raw.addressState || raw.stateCode || ''
  const zip = raw.zipCode || raw.postalCode || raw.zip || ''
  const beds = Number(raw.bedrooms ?? raw.beds ?? raw.bedroomCount) || null
  const baths = Number(raw.bathrooms ?? raw.baths ?? raw.bathroomCount) || null
  const sqft = Number(raw.squareFootage ?? raw.sqft ?? raw.livingArea) || null
  const propertyType = raw.propertyType || raw.homeType || raw.type || ''
  const price = Number(raw.price ?? raw.rentPrice ?? raw.rent) || null
  // Description is rarely returned by aggregators; assemble a short
  // human-readable summary from the structured fields when missing.
  const description = raw.description || raw.summary || [
    propertyType,
    beds ? `${beds} bd` : null,
    baths ? `${baths} ba` : null,
    sqft ? `${sqft.toLocaleString()} sqft` : null,
    price ? `$${price.toLocaleString()}/mo` : null,
  ].filter(Boolean).join(' · ')
  return {
    id: raw.id || `${address}|${zip}`,
    address,
    city,
    state,
    zip,
    beds,
    baths,
    sqft,
    propertyType,
    description,
    price,
    listingUrl: raw.listingUrl || raw.url || (address
      ? `https://www.google.com/search?q=${encodeURIComponent(address + ' ' + city + ' ' + state + ' rent')}`
      : ''),
    source: RAPIDAPI_HOST,
  }
}

// OSM Overpass: real apartment complexes (building=apartments with a
// name tag) near the geocoded installation. Each complex is a real
// place with an address and distance; the user taps the card to open
// Google Maps directions and the Apartments.com button to see real
// unit-level availability at that specific address. No API key
// required - OSM is the same free dataset that powers Family Fun and
// the Schools tab.
async function overpassApartmentsFetch(lat, lng, radiusMeters) {
  const query = `[out:json][timeout:20];(node["building"="apartments"]["name"](around:${radiusMeters},${lat},${lng});way["building"="apartments"]["name"](around:${radiusMeters},${lat},${lng});node["building"="residential"]["name"]["apartments"="yes"](around:${radiusMeters},${lat},${lng}););out center tags;`
  return overpassQuery(query)
}

function shapeOsmApartmentComplex(el, originLat, originLng) {
  const tags = el.tags || {}
  const name = tags.name || tags['name:en']
  if (!name) return null
  const elLat = el.lat ?? el.center?.lat
  const elLng = el.lon ?? el.center?.lon
  if (typeof elLat !== 'number' || typeof elLng !== 'number') return null
  const distance = haversineMiles(originLat, originLng, elLat, elLng)
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const addrCity = tags['addr:city'] || ''
  const addrState = tags['addr:state'] || ''
  const addrZip = tags['addr:postcode'] || ''
  const levels = tags['building:levels'] ? `${tags['building:levels']}-story` : ''
  const descParts = []
  if (levels) descParts.push(levels)
  if (tags['units'] || tags['building:units']) descParts.push(`${tags['units'] || tags['building:units']} units`)
  if (tags.year_built) descParts.push(`built ${tags.year_built}`)
  const baseDesc = descParts.length ? descParts.join(' · ') : 'apartment community'
  const description = `${baseDesc} approximately ${distance} mi away. Bed, bath, square footage, and rent vary by unit - tap the Apartments.com button to see current availability for this address.`

  // Apartments.com search-by-address pattern. Falls back to city-level
  // when we have no street address.
  const apartmentsSearch = street && addrCity
    ? `https://www.apartments.com/search/?q=${encodeURIComponent(`${street} ${addrCity} ${addrState}`)}`
    : addrCity
      ? `https://www.apartments.com/${encodeURIComponent(addrCity.toLowerCase().replace(/\s+/g, '-'))}-${(addrState || '').toLowerCase()}/`
      : `https://www.apartments.com/search/?q=${encodeURIComponent(name)}`

  return {
    id: `${el.type}/${el.id}`,
    name,
    address: street,
    city: addrCity,
    state: addrState,
    zip: addrZip,
    beds: null,
    baths: null,
    sqft: null,
    propertyType: 'Apartment community',
    distanceMiles: distance,
    description,
    price: null,
    apartmentsSearchUrl: apartmentsSearch,
    listingUrl: apartmentsSearch,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLng}`,
    mapUrl: `https://www.openstreetmap.org/?mlat=${elLat}&mlon=${elLng}#map=17/${elLat}/${elLng}`,
    website: tags.website || tags['contact:website'] || '',
    phone: tags.phone || tags['contact:phone'] || '',
    lat: elLat,
    lng: elLng,
    source: 'OpenStreetMap',
  }
}

app.get('/api/housing-listings', housingRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 60)
  const state = String(req.query.state || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 16)
  const zip = String(req.query.zip || '').trim().replace(/[^A-Za-z0-9\-]/g, '').slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  if (!city && !zip && !address) {
    return res.status(400).json({ error: 'city, zip, or address is required', listings: [], fallback: true })
  }

  const cacheKey = `${city}|${state}|${zip}|${address}`
  const cached = HOUSING_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < HOUSING_TTL_MS) {
    return res.status(200).json({ listings: cached.listings, fallback: cached.listings.length === 0, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  // Run RapidAPI rentals (priced) and OSM apartment complexes in
  // parallel. RapidAPI is optional - skipped when no key. OSM works
  // always.
  const rapidApiPromise = (async () => {
    if (!RAPIDAPI_KEY) return []
    try {
      const params = new URLSearchParams()
      if (city) params.set('city', city)
      if (state) params.set('state', state)
      if (zip) params.set('zipCode', zip.split('-')[0])
      params.set('limit', '20')
      params.set('status', 'Active')
      const url = `https://${RAPIDAPI_HOST}${RAPIDAPI_PATH}?${params.toString()}`
      const signal = AbortSignal.timeout(15000)
      const r = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        signal,
      })
      if (!r.ok) { console.error(`[housing-listings] ${RAPIDAPI_HOST} ${r.status}`); return [] }
      const data = await r.json()
      const rawList = Array.isArray(data) ? data : (Array.isArray(data?.listings) ? data.listings : (Array.isArray(data?.results) ? data.results : []))
      return rawList.map(shapeListing).filter(l => l.address || l.beds || l.sqft)
    } catch (err) {
      console.error(`[housing-listings] rapidapi ${err.message}`)
      return []
    }
  })()

  const osmPromise = (async () => {
    const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
    if (!geocodeQuery) return []
    let origin
    try {
      origin = await geocodeNominatim(geocodeQuery)
    } catch (err) {
      console.error(`[housing-listings] geocode ${err.message}`)
      return []
    }
    if (!origin) return []
    try {
      const overpassData = await overpassApartmentsFetch(origin.lat, origin.lng, Math.round(15 * 1609.34))
      const elements = Array.isArray(overpassData?.elements) ? overpassData.elements : []
      const seen = new Set()
      const complexes = []
      for (const el of elements) {
        const shaped = shapeOsmApartmentComplex(el, origin.lat, origin.lng)
        if (!shaped) continue
        const key = `${shaped.name}|${Math.round(shaped.lat * 100)}|${Math.round(shaped.lng * 100)}`
        if (seen.has(key)) continue
        seen.add(key)
        complexes.push(shaped)
      }
      complexes.sort((a, b) => a.distanceMiles - b.distanceMiles)
      return complexes
    } catch (err) {
      console.error(`[housing-listings] overpass ${err.message}`)
      return []
    }
  })()

  const [rapidApiResults, osmResults] = await Promise.all([rapidApiPromise, osmPromise])
  // RapidAPI listings (priced units) come first; OSM complexes (real
  // addresses, deep-linked Apartments.com search) follow.
  const combined = [...rapidApiResults, ...osmResults].slice(0, 30)
  // Skip caching empty results so transient upstream failures do not
  // poison the cache for 24 hours.
  if (combined.length > 0) {
    HOUSING_CACHE.set(cacheKey, { listings: combined, fetchedAt: Date.now() })
  }

  res.status(200).json({
    listings: combined,
    fallback: combined.length === 0,
    sources: {
      rapidapi: RAPIDAPI_KEY ? `ok-${rapidApiResults.length}` : 'no-api-key',
      openstreetmap: `ok-${osmResults.length}`,
    },
    fetchedAt: Date.now(),
  })
})

// === JOB LISTINGS (REMOTEOK + USAJOBS) ===
// Two sources combined into a single shape so the frontend can render
// one dynamic-card grid regardless of provenance:
//   1. RemoteOK public JSON feed - no API key required, broad remote
//      roles across engineering, marketing, design, ops, support.
//   2. USAJOBS - federal civilian jobs near the gaining installation.
//      Requires USAJOBS_API_KEY env var (free at developer.usajobs.gov).
//      When unset we skip USAJOBS silently and still serve RemoteOK.
// If both fail or both return empty, the response has {listings:[],
// fallback:true} so the frontend can keep the existing static search-
// portal links visible.
const USAJOBS_API_KEY = process.env.USAJOBS_API_KEY || ''
const USAJOBS_USER_AGENT = process.env.USAJOBS_USER_AGENT || 'damienmcdade17@gmail.com'
const JOBS_CACHE = new Map()
const JOBS_TTL_MS = 60 * 60 * 1000   // 1h - listings move fast
const JOBS_RATE_LIMIT = 30
const JOBS_RATE_WINDOW_MS = 60_000
const _jobsHits = new Map()

function jobsRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _jobsHits.get(ip)
  if (!entry || now - entry.windowStart > JOBS_RATE_WINDOW_MS) {
    _jobsHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= JOBS_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', listings: [], fallback: true })
  }
  entry.count += 1
  return next()
}

function fmtSalary(min, max, period) {
  if (!min && !max) return ''
  const fmt = n => '$' + Math.round(n).toLocaleString()
  const range = min && max && min !== max ? `${fmt(min)} - ${fmt(max)}` : fmt(min || max)
  if (period === 'year' || (min && min >= 20000)) return `${range}/yr`
  if (period === 'hour') return `${range}/hr`
  return range
}

function clip(str, len = 220) {
  const s = String(str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return s.length > len ? s.slice(0, len) + '...' : s
}

async function fetchRemoteOk(keyword) {
  const signal = AbortSignal.timeout(10000)
  // RemoteOK 403s requests from datacenter IPs with non-browser UAs.
  // A standard browser UA is honest about the request (no spoofed
  // device profile) and matches their documented expectations.
  const r = await fetch('https://remoteok.com/api', {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PCSExpress/1.0; +https://github.com/damienmcdade/PCSExpress)',
    },
    signal,
  })
  if (!r.ok) throw new Error(`remoteok ${r.status}`)
  const data = await r.json()
  const kw = String(keyword || '').toLowerCase().trim()
  const jobs = Array.isArray(data) ? data.slice(1) : []
  const filtered = kw ? jobs.filter(j => {
    const hay = `${j.position || ''} ${j.description || ''} ${(j.tags || []).join(' ')} ${j.company || ''}`.toLowerCase()
    return kw.split(/\s+/).every(w => hay.includes(w))
  }) : jobs
  return filtered.slice(0, 30).map(j => ({
    id: `remoteok-${j.id || j.slug || j.position}`,
    title: j.position || 'Remote role',
    company: j.company || '',
    location: j.location || 'Remote',
    salaryDisplay: fmtSalary(j.salary_min, j.salary_max, 'year'),
    salaryMin: j.salary_min || null,
    salaryMax: j.salary_max || null,
    description: clip(j.description),
    url: j.url || j.apply_url || '',
    source: 'RemoteOK',
    remote: true,
    postedAt: j.date || j.epoch ? new Date((j.epoch || 0) * 1000).toISOString() : null,
  }))
}

// The Muse public API - no key required, broader non-tech coverage
// (marketing, customer service, operations, healthcare, etc.) than
// RemoteOK. Useful for military spouses whose target roles often are
// not engineering.
async function fetchTheMuse(keyword, city, state) {
  const params = new URLSearchParams()
  params.set('page', '0')
  if (city) {
    const loc = state ? `${city}, ${state}` : city
    params.set('location', loc)
  }
  // The Muse doesn't expose a free-text keyword filter on the public
  // endpoint; we fetch latest results then filter server-side.
  const url = `https://www.themuse.com/api/public/jobs?${params.toString()}`
  const signal = AbortSignal.timeout(10000)
  const r = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PCSExpress/1.0; +https://github.com/damienmcdade/PCSExpress)',
    },
    signal,
  })
  if (!r.ok) throw new Error(`themuse ${r.status}`)
  const data = await r.json()
  const results = Array.isArray(data?.results) ? data.results : []
  const kw = String(keyword || '').toLowerCase().trim()
  const filtered = kw ? results.filter(j => {
    const hay = `${j.name || ''} ${j.contents || ''} ${(j.categories || []).map(c => c.name).join(' ')} ${(j.levels || []).map(l => l.name).join(' ')}`.toLowerCase()
    return kw.split(/\s+/).every(w => hay.includes(w))
  }) : results
  return filtered.slice(0, 25).map(j => {
    const locName = (j.locations && j.locations[0]?.name) || 'Multiple locations'
    const company = j.company?.name || ''
    const category = (j.categories && j.categories[0]?.name) || ''
    const level = (j.levels && j.levels[0]?.name) || ''
    return {
      id: `themuse-${j.id}`,
      title: j.name || 'Position',
      company,
      location: locName,
      salaryDisplay: '',
      salaryMin: null,
      salaryMax: null,
      description: clip([category, level, j.contents].filter(Boolean).join(' · ')),
      url: j.refs?.landing_page || '',
      source: 'The Muse',
      remote: /remote/i.test(locName),
      postedAt: j.publication_date || null,
    }
  })
}

async function fetchUsajobs(keyword, city, state) {
  if (!USAJOBS_API_KEY) return []
  const params = new URLSearchParams()
  if (keyword) params.set('Keyword', keyword)
  const locName = [city, state].filter(Boolean).join(', ')
  if (locName) params.set('LocationName', locName)
  params.set('ResultsPerPage', '25')
  const url = `https://data.usajobs.gov/api/search?${params.toString()}`
  const signal = AbortSignal.timeout(12000)
  const r = await fetch(url, {
    headers: {
      Host: 'data.usajobs.gov',
      'User-Agent': USAJOBS_USER_AGENT,
      'Authorization-Key': USAJOBS_API_KEY,
      Accept: 'application/json',
    },
    signal,
  })
  if (!r.ok) throw new Error(`usajobs ${r.status}`)
  const data = await r.json()
  const items = data?.SearchResult?.SearchResultItems || []
  return items.map((item, i) => {
    const m = item?.MatchedObjectDescriptor || {}
    const rem = (m.PositionRemuneration && m.PositionRemuneration[0]) || {}
    return {
      id: `usajobs-${m.PositionID || i}`,
      title: m.PositionTitle || 'Federal position',
      company: m.OrganizationName || m.DepartmentName || '',
      location: m.PositionLocationDisplay || '',
      salaryDisplay: fmtSalary(parseFloat(rem.MinimumRange), parseFloat(rem.MaximumRange), rem.RateIntervalCode === 'Per Year' ? 'year' : (rem.RateIntervalCode === 'Per Hour' ? 'hour' : '')),
      salaryMin: parseFloat(rem.MinimumRange) || null,
      salaryMax: parseFloat(rem.MaximumRange) || null,
      description: clip(m.UserArea?.Details?.JobSummary || m.QualificationSummary),
      url: m.PositionURI || '',
      source: 'USAJOBS',
      remote: /remote|telework/i.test(m.PositionLocationDisplay || ''),
      postedAt: m.PublicationStartDate || null,
    }
  })
}

app.get('/api/job-listings', jobsRateLimit, async (req, res) => {
  const keyword = String(req.query.keyword || '').trim().slice(0, 80)
  const city = String(req.query.city || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 60)
  const state = String(req.query.state || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 16)

  const cacheKey = `${keyword}|${city}|${state}`
  const cached = JOBS_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < JOBS_TTL_MS) {
    return res.status(200).json({ listings: cached.listings, fallback: cached.listings.length === 0, sources: cached.sources, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  const results = []
  const sources = { themuse: 'pending', remoteok: 'pending', usajobs: USAJOBS_API_KEY ? 'pending' : 'no-api-key' }

  // Run all three in parallel - one failing should not stop the others.
  const [theMuseResult, remoteOkResult, usaJobsResult] = await Promise.allSettled([
    fetchTheMuse(keyword, city, state),
    fetchRemoteOk(keyword),
    USAJOBS_API_KEY ? fetchUsajobs(keyword, city, state) : Promise.resolve([]),
  ])

  if (theMuseResult.status === 'fulfilled') {
    results.push(...theMuseResult.value)
    sources.themuse = `ok-${theMuseResult.value.length}`
  } else {
    console.error(`[job-listings] themuse ${theMuseResult.reason?.message}`)
    sources.themuse = `error-${theMuseResult.reason?.message || 'unknown'}`
  }

  if (remoteOkResult.status === 'fulfilled') {
    results.push(...remoteOkResult.value)
    sources.remoteok = `ok-${remoteOkResult.value.length}`
  } else {
    console.error(`[job-listings] remoteok ${remoteOkResult.reason?.message}`)
    sources.remoteok = `error-${remoteOkResult.reason?.message || 'unknown'}`
  }

  if (usaJobsResult.status === 'fulfilled') {
    results.push(...usaJobsResult.value)
    if (USAJOBS_API_KEY) sources.usajobs = `ok-${usaJobsResult.value.length}`
  } else {
    console.error(`[job-listings] usajobs ${usaJobsResult.reason?.message}`)
    sources.usajobs = `error-${usaJobsResult.reason?.message || 'unknown'}`
  }

  // De-dupe by url + title
  const seen = new Set()
  const deduped = results.filter(j => {
    const key = `${j.url}|${j.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Prefer local USAJOBS first, then The Muse (often non-tech, often
  // matches a spouse's career path better than tech-heavy RemoteOK),
  // then RemoteOK. Within each source, newest first.
  const sourceRank = { USAJOBS: 0, 'The Muse': 1, RemoteOK: 2 }
  deduped.sort((a, b) => {
    const ar = sourceRank[a.source] ?? 9
    const br = sourceRank[b.source] ?? 9
    if (ar !== br) return ar - br
    const ad = a.postedAt ? Date.parse(a.postedAt) : 0
    const bd = b.postedAt ? Date.parse(b.postedAt) : 0
    return bd - ad
  })

  const listings = deduped.slice(0, 40)
  // Skip caching empty results so transient upstream failures (e.g.,
  // RemoteOK 403 from datacenter IPs) do not poison the cache.
  if (listings.length > 0) {
    JOBS_CACHE.set(cacheKey, { listings, sources, fetchedAt: Date.now() })
  }

  res.status(200).json({
    listings,
    sources,
    fallback: listings.length === 0,
    fetchedAt: Date.now(),
  })
})

// === RELIGIOUS / SPIRITUAL SERVICES (OPENSTREETMAP - NO API KEY) ===
// Places of worship from OSM Overpass within radius of the gaining
// installation. OSM tags include `religion` (christian / muslim /
// jewish / buddhist / hindu / etc.) and optional `denomination` for
// finer-grain Christian sub-traditions.
const RELIGION_LABELS = {
  christian: 'Christian',
  catholic: 'Catholic',
  protestant: 'Protestant',
  muslim: 'Islamic',
  jewish: 'Jewish',
  buddhist: 'Buddhist',
  hindu: 'Hindu',
  sikh: 'Sikh',
  bahai: 'Baha’i',
  jain: 'Jain',
  shinto: 'Shinto',
  taoist: 'Taoist',
  multifaith: 'Multi-faith',
  unitarian_universalist: 'Unitarian Universalist',
  pagan: 'Pagan',
}
const RELIGIOUS_CACHE = new Map()
const RELIGIOUS_TTL_MS = 24 * 60 * 60 * 1000
const RELIGIOUS_RATE_LIMIT = 20
const RELIGIOUS_RATE_WINDOW_MS = 60_000
const _religiousHits = new Map()

function religiousRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _religiousHits.get(ip)
  if (!entry || now - entry.windowStart > RELIGIOUS_RATE_WINDOW_MS) {
    _religiousHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= RELIGIOUS_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', services: [], fallback: true })
  }
  entry.count += 1
  return next()
}

function shapeOsmReligious(el, originLat, originLng) {
  const tags = el.tags || {}
  if (tags.amenity !== 'place_of_worship') return null
  const name = tags.name || tags['name:en'] || 'Place of worship'
  const elLat = el.lat ?? el.center?.lat
  const elLng = el.lon ?? el.center?.lon
  if (typeof elLat !== 'number' || typeof elLng !== 'number') return null
  const distance = haversineMiles(originLat, originLng, elLat, elLng)
  const religionTag = String(tags.religion || '').toLowerCase()
  const denomTag = String(tags.denomination || '').toLowerCase()
  const religionLabel = RELIGION_LABELS[denomTag] || RELIGION_LABELS[religionTag] || (religionTag ? religionTag.charAt(0).toUpperCase() + religionTag.slice(1) : 'Place of worship')
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const cityPart = [tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ')
  const address = [street, cityPart].filter(Boolean).join(', ')
  const descParts = []
  if (tags.description) descParts.push(tags.description)
  if (tags['service_times']) descParts.push(`Service times: ${tags['service_times']}`)
  if (tags.opening_hours) descParts.push(`Hours: ${tags.opening_hours}`)
  const description = descParts.length
    ? descParts.join(' · ')
    : `${religionLabel} place of worship approximately ${distance} mi from search center. Confirm service times and accessibility directly with the congregation.`
  return {
    id: `${el.type}/${el.id}`,
    name,
    religion: religionLabel,
    religionTag: religionTag || 'unknown',
    denomination: denomTag || '',
    distanceMiles: distance,
    address,
    description,
    website: tags.website || tags['contact:website'] || '',
    phone: tags.phone || tags['contact:phone'] || '',
    lat: elLat,
    lng: elLng,
    mapUrl: `https://www.openstreetmap.org/?mlat=${elLat}&mlon=${elLng}#map=16/${elLat}/${elLng}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLng}`,
  }
}

async function overpassReligiousFetch(lat, lng, radiusMeters) {
  const query = `[out:json][timeout:20];(node["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng});way["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng}););out center tags;`
  return overpassQuery(query)
}

app.get('/api/religious-services', religiousRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().slice(0, 80)
  const state = String(req.query.state || '').trim().slice(0, 16)
  const zip = String(req.query.zip || '').trim().slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  const radiusMiles = Math.max(5, Math.min(50, parseInt(req.query.radiusMiles, 10) || 25))

  const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
  if (!geocodeQuery) {
    return res.status(400).json({ error: 'address, city, or zip is required', services: [], fallback: true })
  }

  const cacheKey = `${geocodeQuery}|${radiusMiles}`
  const cached = RELIGIOUS_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < RELIGIOUS_TTL_MS) {
    return res.status(200).json({ services: cached.services, origin: cached.origin, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  let origin
  try {
    origin = await geocodeNominatim(geocodeQuery)
  } catch (err) {
    console.error(`[religious] geocode ${err.message}`)
    return res.status(200).json({ services: [], fallback: true, reason: 'geocode-failed' })
  }
  if (!origin) {
    return res.status(200).json({ services: [], fallback: true, reason: 'address-not-found' })
  }

  let overpassData
  try {
    overpassData = await overpassReligiousFetch(origin.lat, origin.lng, Math.round(radiusMiles * 1609.34))
  } catch (err) {
    console.error(`[religious] overpass ${err.message}`)
    return res.status(200).json({ services: [], origin, fallback: true, reason: 'overpass-failed' })
  }

  const elements = Array.isArray(overpassData?.elements) ? overpassData.elements : []
  const seenIds = new Set()
  const services = []
  for (const el of elements) {
    const shaped = shapeOsmReligious(el, origin.lat, origin.lng)
    if (!shaped) continue
    const key = `${shaped.name}|${Math.round(shaped.lat * 100)}|${Math.round(shaped.lng * 100)}`
    if (seenIds.has(key)) continue
    seenIds.add(key)
    services.push(shaped)
  }
  services.sort((a, b) => a.distanceMiles - b.distanceMiles)
  const limited = services.slice(0, 60)

  // Skip caching empty results so transient Overpass failures do not
  // serve users an empty Spiritual Readiness tab for 24h.
  if (limited.length > 0) {
    RELIGIOUS_CACHE.set(cacheKey, { services: limited, origin, fetchedAt: Date.now() })
  }

  res.status(200).json({
    services: limited,
    origin,
    radiusMiles,
    source: 'openstreetmap',
    fetchedAt: Date.now(),
  })
})

// === SCHOOLS & CHILDCARE (OPENSTREETMAP - NO API KEY REQUIRED) ===
// Same OSM Overpass approach as Family Fun: query amenity=school /
// kindergarten / college / university / childcare within radius of the
// gaining installation. Returns grade-level hints inferred from the
// isced:level / min_age / max_age tags when present.
const SCHOOL_TAG_MAP = {
  'amenity=school': { categoryId: 'k12', type: 'School' },
  'amenity=kindergarten': { categoryId: 'preschool', type: 'Kindergarten / Pre-K' },
  'amenity=childcare': { categoryId: 'childcare', type: 'Childcare' },
  'amenity=college': { categoryId: 'college', type: 'College' },
  'amenity=university': { categoryId: 'college', type: 'University' },
  'amenity=language_school': { categoryId: 'k12', type: 'Language school' },
  'amenity=music_school': { categoryId: 'k12', type: 'Music school' },
}
const SCHOOL_CATEGORIES = [
  { id: 'k12', label: 'K-12 Schools', emoji: '🏫', description: 'Elementary, middle, high, and combined schools.' },
  { id: 'preschool', label: 'Preschool / Kindergarten', emoji: '🧒', description: 'Pre-K, kindergarten, and early-learning programs.' },
  { id: 'childcare', label: 'Childcare', emoji: '🍼', description: 'Daycare and childcare centers.' },
  { id: 'college', label: 'Colleges & Universities', emoji: '🎓', description: 'Higher-education campuses.' },
]
const SCHOOL_CACHE = new Map()
const SCHOOL_TTL_MS = 24 * 60 * 60 * 1000
const SCHOOL_RATE_LIMIT = 20
const SCHOOL_RATE_WINDOW_MS = 60_000
const _schoolHits = new Map()

function schoolRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _schoolHits.get(ip)
  if (!entry || now - entry.windowStart > SCHOOL_RATE_WINDOW_MS) {
    _schoolHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= SCHOOL_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', schools: [], categories: SCHOOL_CATEGORIES, fallback: true })
  }
  entry.count += 1
  return next()
}

// DoDEA + on-installation school detection from OSM tags.
// DoDEA-operated schools usually carry operator="DoDEA" or operator
// strings containing "Department of Defense" / "DoD". Some
// installation-zone schools tag operator:type=military. Names often
// include "DoDEA", "Elementary School" with a base prefix, etc.
function inferMilitarySchool(tags, distance) {
  const operator = String(tags.operator || '').toLowerCase()
  const operatorType = String(tags['operator:type'] || '').toLowerCase()
  const name = String(tags.name || '').toLowerCase()
  if (operator.includes('dodea') || operator.includes('department of defense') || operator.includes('dod ')) return true
  if (operatorType === 'military' || operatorType === 'department of defense') return true
  if (name.includes('dodea') || name.includes('department of defense')) return true
  // Heuristic: a school within ~1.5 mi of the geocoded installation
  // center is almost certainly on-post.
  if (typeof distance === 'number' && distance <= 1.5) return true
  return false
}

function shapeOsmSchool(el, originLat, originLng) {
  const tags = el.tags || {}
  let matchTag = null
  for (const tag of Object.keys(SCHOOL_TAG_MAP)) {
    const [k, v] = tag.split('=')
    if (tags[k] === v) { matchTag = tag; break }
  }
  if (!matchTag) return null
  const meta = SCHOOL_TAG_MAP[matchTag]
  const name = tags.name || tags['name:en'] || meta.type
  const elLat = el.lat ?? el.center?.lat
  const elLng = el.lon ?? el.center?.lon
  if (typeof elLat !== 'number' || typeof elLng !== 'number') return null
  const distance = haversineMiles(originLat, originLng, elLat, elLng)
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const cityPart = [tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ')
  const address = [street, cityPart].filter(Boolean).join(', ')

  // Infer grade range from common OSM tags. ISCED levels map to:
  //   0 pre-primary, 1 primary, 2 lower secondary, 3 upper secondary
  let grades = ''
  if (tags['isced:level']) {
    const levels = String(tags['isced:level']).split(/[,;]/).map(s => s.trim())
    const labels = levels.map(l => {
      if (l === '0') return 'Pre-K'
      if (l === '1') return 'K-5'
      if (l === '2') return '6-8'
      if (l === '3') return '9-12'
      return l
    })
    grades = labels.join(', ')
  } else if (tags['min_age'] || tags['max_age']) {
    grades = `Ages ${tags['min_age'] || '?'}-${tags['max_age'] || '?'}`
  } else if (meta.categoryId === 'preschool') {
    grades = 'Pre-K'
  } else if (meta.categoryId === 'childcare') {
    grades = 'Childcare'
  }

  const operator = tags.operator || ''
  const operatorType = tags['operator:type'] || ''
  const descParts = []
  if (tags.description) descParts.push(tags.description)
  if (operatorType) descParts.push(`${operatorType.charAt(0).toUpperCase() + operatorType.slice(1)} school`)
  else if (operator) descParts.push(`Operated by ${operator}`)
  if (tags.opening_hours) descParts.push(`Hours: ${tags.opening_hours}`)
  const description = descParts.length
    ? descParts.join(' · ')
    : `${meta.type} approximately ${distance} mi from search center. Verify enrollment, grade levels, and ratings on the official source.`

  const isMilitary = inferMilitarySchool(tags, distance)
  return {
    id: `${el.type}/${el.id}`,
    categoryId: meta.categoryId,
    type: meta.type,
    name,
    grades,
    address,
    distanceMiles: distance,
    description,
    operatorType,
    operator: operator || '',
    isMilitary,
    website: tags.website || tags['contact:website'] || '',
    phone: tags.phone || tags['contact:phone'] || '',
    lat: elLat,
    lng: elLng,
    mapUrl: `https://www.openstreetmap.org/?mlat=${elLat}&mlon=${elLng}#map=16/${elLat}/${elLng}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLng}`,
    // NCES SchoolSearch deep link as an authoritative cross-reference.
    ncesUrl: `https://nces.ed.gov/ccd/schoolsearch/school_list.asp?Search=1&SchoolName=${encodeURIComponent(name)}`,
    // Search the web for community ratings of this specific school -
    // returns Google results that include GreatSchools, Niche, and
    // parent-review aggregators. We do not embed third-party ratings
    // directly because they are paywalled / partner-only.
    ratingsSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' school reviews ratings ' + (tags['addr:city'] || ''))}`,
  }
}

async function overpassSchoolsFetch(lat, lng, radiusMeters) {
  const filters = Object.keys(SCHOOL_TAG_MAP).map(tag => {
    const [k, v] = tag.split('=')
    return `node["${k}"="${v}"](around:${radiusMeters},${lat},${lng});way["${k}"="${v}"](around:${radiusMeters},${lat},${lng});`
  }).join('')
  const query = `[out:json][timeout:20];(${filters});out center tags;`
  return overpassQuery(query)
}

app.get('/api/schools-nearby', schoolRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().slice(0, 80)
  const state = String(req.query.state || '').trim().slice(0, 16)
  const zip = String(req.query.zip || '').trim().slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  const radiusMiles = Math.max(5, Math.min(50, parseInt(req.query.radiusMiles, 10) || 25))

  const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
  if (!geocodeQuery) {
    return res.status(400).json({ error: 'address, city, or zip is required', categories: SCHOOL_CATEGORIES, schools: [], fallback: true })
  }

  const cacheKey = `${geocodeQuery}|${radiusMiles}`
  const cached = SCHOOL_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < SCHOOL_TTL_MS) {
    return res.status(200).json({ categories: SCHOOL_CATEGORIES, schools: cached.schools, origin: cached.origin, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  let origin
  try {
    origin = await geocodeNominatim(geocodeQuery)
  } catch (err) {
    console.error(`[schools] geocode ${err.message}`)
    return res.status(200).json({ categories: SCHOOL_CATEGORIES, schools: [], fallback: true, reason: 'geocode-failed' })
  }
  if (!origin) {
    return res.status(200).json({ categories: SCHOOL_CATEGORIES, schools: [], fallback: true, reason: 'address-not-found' })
  }

  let overpassData
  try {
    overpassData = await overpassSchoolsFetch(origin.lat, origin.lng, Math.round(radiusMiles * 1609.34))
  } catch (err) {
    console.error(`[schools] overpass ${err.message}`)
    return res.status(200).json({ categories: SCHOOL_CATEGORIES, schools: [], origin, fallback: true, reason: 'overpass-failed' })
  }

  const elements = Array.isArray(overpassData?.elements) ? overpassData.elements : []
  const seenIds = new Set()
  const schools = []
  for (const el of elements) {
    const shaped = shapeOsmSchool(el, origin.lat, origin.lng)
    if (!shaped) continue
    const key = `${shaped.name}|${Math.round(shaped.lat * 100)}|${Math.round(shaped.lng * 100)}`
    if (seenIds.has(key)) continue
    seenIds.add(key)
    schools.push(shaped)
  }
  // Sort: military / DoDEA / on-installation schools first, then by
  // ascending distance. Front-end may apply additional child-age
  // grade-band reordering on top of this.
  schools.sort((a, b) => {
    if (a.isMilitary !== b.isMilitary) return a.isMilitary ? -1 : 1
    return a.distanceMiles - b.distanceMiles
  })
  const limited = schools.slice(0, 80)

  // Skip caching empty results so transient Overpass failures do not
  // hide schools for 24 hours.
  if (limited.length > 0) {
    SCHOOL_CACHE.set(cacheKey, { schools: limited, origin, fetchedAt: Date.now() })
  }

  res.status(200).json({
    categories: SCHOOL_CATEGORIES,
    schools: limited,
    origin,
    radiusMiles,
    source: 'openstreetmap',
    fetchedAt: Date.now(),
  })
})

// === FAMILY FUN ACTIVITIES (OPENSTREETMAP - NO API KEY REQUIRED) ===
// Uses two free, no-key OSM services:
//   1. Nominatim - geocode the installation city/state (or a manual
//      user-supplied address) to a lat/lng. Already allowed by the app
//      CSP for the existing route planner.
//   2. Overpass API - query for amenities tagged as park / theme park /
//      cinema / museum / zoo / aquarium / playground / bowling alley
//      within a 50-mile (~80km) radius.
//
// Both services are public-good infrastructure operated by the
// OpenStreetMap Foundation. We follow their usage policies: explicit
// User-Agent, server-side caching, request batching, and graceful
// fallback when they return 429/504 or time out.
const FAMILY_CATEGORIES = [
  { id: 'parks', label: 'Parks & Nature', emoji: '🌲', description: 'Local, state, and national parks plus playgrounds, gardens, and trails.' },
  { id: 'amusement', label: 'Amusement & Theme Parks', emoji: '🎢', description: 'Theme parks, water parks, and family entertainment centers.' },
  { id: 'movies', label: 'Movie Theaters', emoji: '🎦', description: 'Cinemas and independent theaters.' },
  { id: 'museums', label: 'Museums & Galleries', emoji: '🏛️', description: 'History, science, art, military museums, and galleries.' },
  { id: 'sports', label: 'Sports & Fitness', emoji: '🏟️', description: 'Pools, gyms, rinks, climbing, mini-golf, bowling, stadiums, sports complexes.' },
  { id: 'culture', label: 'Arts & Culture', emoji: '🎨', description: 'Arts centers, libraries, public art, community centers, theaters.' },
  { id: 'family', label: 'Family Venues', emoji: '🏖️', description: 'Zoos, aquariums, attractions, ice cream shops, dog parks.' },
  { id: 'shopping', label: 'Shopping & Markets', emoji: '🛍️', description: 'Malls, farmers markets, and shopping districts.' },
]

// Maps OSM tag pairs to our internal category + a short type label.
const OSM_TAG_MAP = {
  // Parks & Nature
  'leisure=park': { categoryId: 'parks', type: 'Park' },
  'leisure=nature_reserve': { categoryId: 'parks', type: 'Nature reserve' },
  'leisure=playground': { categoryId: 'parks', type: 'Playground' },
  'leisure=garden': { categoryId: 'parks', type: 'Garden' },
  'leisure=dog_park': { categoryId: 'parks', type: 'Dog park' },
  'tourism=picnic_site': { categoryId: 'parks', type: 'Picnic site' },
  'tourism=viewpoint': { categoryId: 'parks', type: 'Viewpoint' },
  'boundary=national_park': { categoryId: 'parks', type: 'National park' },
  // Amusement & Theme Parks
  'tourism=theme_park': { categoryId: 'amusement', type: 'Theme park' },
  'leisure=water_park': { categoryId: 'amusement', type: 'Water park' },
  'tourism=amusement_arcade': { categoryId: 'amusement', type: 'Arcade' },
  // Movies
  'amenity=cinema': { categoryId: 'movies', type: 'Cinema' },
  'amenity=theatre': { categoryId: 'movies', type: 'Theater' },
  // Museums & Galleries
  'tourism=museum': { categoryId: 'museums', type: 'Museum' },
  'tourism=gallery': { categoryId: 'museums', type: 'Gallery' },
  'historic=monument': { categoryId: 'museums', type: 'Monument' },
  'historic=memorial': { categoryId: 'museums', type: 'Memorial' },
  // Sports & Fitness
  'leisure=sports_centre': { categoryId: 'sports', type: 'Sports center' },
  'leisure=swimming_pool': { categoryId: 'sports', type: 'Swimming pool' },
  'leisure=fitness_centre': { categoryId: 'sports', type: 'Fitness center' },
  'leisure=ice_rink': { categoryId: 'sports', type: 'Ice rink' },
  'amenity=ice_rink': { categoryId: 'sports', type: 'Ice rink' },
  'leisure=bowling_alley': { categoryId: 'sports', type: 'Bowling alley' },
  'leisure=miniature_golf': { categoryId: 'sports', type: 'Mini-golf' },
  'sport=climbing': { categoryId: 'sports', type: 'Climbing gym' },
  'leisure=stadium': { categoryId: 'sports', type: 'Stadium' },
  'leisure=track': { categoryId: 'sports', type: 'Athletic track' },
  // Arts & Culture
  'amenity=arts_centre': { categoryId: 'culture', type: 'Arts center' },
  'amenity=library': { categoryId: 'culture', type: 'Library' },
  'amenity=community_centre': { categoryId: 'culture', type: 'Community center' },
  'tourism=artwork': { categoryId: 'culture', type: 'Public art' },
  // Family Venues
  'tourism=zoo': { categoryId: 'family', type: 'Zoo' },
  'tourism=aquarium': { categoryId: 'family', type: 'Aquarium' },
  'tourism=attraction': { categoryId: 'family', type: 'Attraction' },
  'amenity=ice_cream': { categoryId: 'family', type: 'Ice cream shop' },
  // Shopping & Markets
  'shop=mall': { categoryId: 'shopping', type: 'Shopping mall' },
  'amenity=marketplace': { categoryId: 'shopping', type: 'Marketplace' },
}

const FAMILY_CACHE = new Map()
const FAMILY_TTL_MS = 24 * 60 * 60 * 1000
const FAMILY_RATE_LIMIT = 20
const FAMILY_RATE_WINDOW_MS = 60_000
const _familyHits = new Map()
const OSM_USER_AGENT = process.env.OSM_USER_AGENT || 'PCSExpress/1.0 (https://github.com/damienmcdade/PCSExpress)'

function familyRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _familyHits.get(ip)
  if (!entry || now - entry.windowStart > FAMILY_RATE_WINDOW_MS) {
    _familyHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= FAMILY_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', activities: [], categories: FAMILY_CATEGORIES, fallback: true })
  }
  entry.count += 1
  return next()
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180
  const R = 3958.8 // earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 10) / 10
}

async function geocodeNominatim(query) {
  if (!query) return null
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const signal = AbortSignal.timeout(8000)
  const r = await fetch(url, { headers: { 'User-Agent': OSM_USER_AGENT, Accept: 'application/json' }, signal })
  if (!r.ok) throw new Error(`nominatim ${r.status}`)
  const data = await r.json()
  const hit = Array.isArray(data) && data[0]
  if (!hit) return null
  return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), displayName: hit.display_name }
}

// Public Overpass API mirrors. Order matters for the sequential
// fallback path - the first to respond wins. We rotate by minute so
// no single mirror takes the entire datacenter's traffic at startup,
// and so kumi (which has been flaky) does not blanket-fail every
// query if it is the static first choice.
const OVERPASS_MIRRORS_POOL = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
function overpassMirrors() {
  const offset = Math.floor(Date.now() / 60_000) % OVERPASS_MIRRORS_POOL.length
  return [
    ...OVERPASS_MIRRORS_POOL.slice(offset),
    ...OVERPASS_MIRRORS_POOL.slice(0, offset),
  ]
}

// Per-request abort. Short enough that a hung mirror fails over to
// the next within ~25s, long enough to let the in-query timeout (now
// 20s) plus network round-trip complete. Worst-case across all three
// mirrors: ~75s, but typical case (first mirror healthy) is 1-2s.
const OVERPASS_FETCH_TIMEOUT_MS = 25_000

async function overpassQuery(query) {
  let lastErr = null
  for (const url of overpassMirrors()) {
    try {
      const signal = AbortSignal.timeout(OVERPASS_FETCH_TIMEOUT_MS)
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': OSM_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      })
      if (!r.ok) {
        lastErr = new Error(`overpass ${url} ${r.status}`)
        if (r.status === 429 || r.status === 502 || r.status === 503 || r.status === 504) continue
        throw lastErr
      }
      const data = await r.json()
      // Overpass returns 200 with `remark: "runtime error: Query timed out"`
      // on partial results. Treat as a failure so we try the next
      // mirror instead of caching the partial / empty payload.
      if (data && typeof data.remark === 'string' && /timed out|time limit|cost|memory/i.test(data.remark)) {
        lastErr = new Error(`overpass ${url} remark: ${data.remark}`)
        console.error(`[overpass] ${url} ${data.remark}`)
        continue
      }
      return data
    } catch (err) {
      lastErr = err
      console.error(`[overpass] ${url} ${err.message}`)
      continue
    }
  }
  throw lastErr || new Error('overpass all mirrors failed')
}

async function overpassFetch(lat, lng, radiusMeters) {
  // 36 tag filters at 50mi radius is too large for a single Overpass
  // query under our per-mirror 25s abort. Split into batches of ~12
  // tags each. We run them sequentially against the rotating mirror
  // list (overpassQuery picks a fresh mirror order each call) and
  // merge the elements client-side.
  const allTags = Object.keys(OSM_TAG_MAP)
  const BATCH_SIZE = 12
  const batches = []
  for (let i = 0; i < allTags.length; i += BATCH_SIZE) batches.push(allTags.slice(i, i + BATCH_SIZE))

  const merged = []
  // Process batches sequentially (not in parallel) so we are polite
  // to the OSM mirrors per their usage policy. Any single batch
  // failure is logged but does not abort the others.
  for (const batch of batches) {
    try {
      const filters = batch.map(tag => {
        const [k, v] = tag.split('=')
        return `node["${k}"="${v}"](around:${radiusMeters},${lat},${lng});way["${k}"="${v}"](around:${radiusMeters},${lat},${lng});`
      }).join('')
      const query = `[out:json][timeout:20];(${filters});out center tags;`
      const data = await overpassQuery(query)
      if (Array.isArray(data?.elements)) merged.push(...data.elements)
    } catch (err) {
      console.error(`[overpass-family] batch failed: ${err.message}`)
    }
  }
  return { elements: merged }
}

function shapeOsmElement(el, originLat, originLng) {
  const tags = el.tags || {}
  let matchTag = null
  for (const tag of Object.keys(OSM_TAG_MAP)) {
    const [k, v] = tag.split('=')
    if (tags[k] === v) { matchTag = tag; break }
  }
  if (!matchTag) return null
  const meta = OSM_TAG_MAP[matchTag]
  const name = tags.name || tags['name:en'] || meta.type
  const elLat = el.lat ?? el.center?.lat
  const elLng = el.lon ?? el.center?.lon
  if (typeof elLat !== 'number' || typeof elLng !== 'number') return null
  const distance = haversineMiles(originLat, originLng, elLat, elLng)
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const cityPart = [tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ')
  const address = [street, cityPart].filter(Boolean).join(', ')
  const descParts = []
  if (tags.description) descParts.push(tags.description)
  if (tags.operator) descParts.push(`Operator: ${tags.operator}`)
  if (tags.opening_hours) descParts.push(`Hours: ${tags.opening_hours}`)
  if (tags.website) descParts.push('Visit website for details.')
  const description = descParts.length
    ? descParts.join(' ')
    : `${meta.type} approximately ${distance} mi from search center. Verify hours and details on the linked map page.`
  return {
    id: `${el.type}/${el.id}`,
    categoryId: meta.categoryId,
    type: meta.type,
    name,
    address,
    distanceMiles: distance,
    description,
    website: tags.website || tags['contact:website'] || '',
    phone: tags.phone || tags['contact:phone'] || '',
    lat: elLat,
    lng: elLng,
    mapUrl: `https://www.openstreetmap.org/?mlat=${elLat}&mlon=${elLng}#map=16/${elLat}/${elLng}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLng}`,
  }
}

app.get('/api/family-activities', familyRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().slice(0, 80)
  const state = String(req.query.state || '').trim().slice(0, 16)
  const zip = String(req.query.zip || '').trim().slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  const radiusMiles = Math.max(5, Math.min(75, parseInt(req.query.radiusMiles, 10) || 50))

  // Build the geocode query - prefer the user-supplied address, fall
  // back to the installation market.
  const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
  if (!geocodeQuery) {
    return res.status(400).json({ error: 'address, city, or zip is required', categories: FAMILY_CATEGORIES, activities: [], fallback: true })
  }

  const cacheKey = `${geocodeQuery}|${radiusMiles}`
  const cached = FAMILY_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < FAMILY_TTL_MS) {
    return res.status(200).json({
      categories: FAMILY_CATEGORIES,
      activities: cached.activities,
      origin: cached.origin,
      source: 'cache',
      fetchedAt: cached.fetchedAt,
    })
  }

  let origin
  try {
    origin = await geocodeNominatim(geocodeQuery)
  } catch (err) {
    console.error(`[family-activities] geocode ${err.message}`)
    return res.status(200).json({ categories: FAMILY_CATEGORIES, activities: [], fallback: true, reason: 'geocode-failed' })
  }
  if (!origin) {
    return res.status(200).json({ categories: FAMILY_CATEGORIES, activities: [], fallback: true, reason: 'address-not-found' })
  }

  let overpassData
  try {
    overpassData = await overpassFetch(origin.lat, origin.lng, Math.round(radiusMiles * 1609.34))
  } catch (err) {
    console.error(`[family-activities] overpass ${err.message}`)
    return res.status(200).json({ categories: FAMILY_CATEGORIES, activities: [], origin, fallback: true, reason: 'overpass-failed' })
  }

  const elements = Array.isArray(overpassData?.elements) ? overpassData.elements : []
  const seenIds = new Set()
  const activities = []
  for (const el of elements) {
    const shaped = shapeOsmElement(el, origin.lat, origin.lng)
    if (!shaped) continue
    // De-dupe by name within ~0.3 mi - OSM often has overlapping
    // node/way tags for the same physical place.
    const key = `${shaped.name}|${Math.round(shaped.lat * 100)}|${Math.round(shaped.lng * 100)}`
    if (seenIds.has(key)) continue
    seenIds.add(key)
    activities.push(shaped)
  }
  activities.sort((a, b) => a.distanceMiles - b.distanceMiles)
  const limited = activities.slice(0, 60)

  // Skip caching empty results so transient Overpass failures do not
  // serve users empty Family Fun for 24h.
  if (limited.length > 0) {
    FAMILY_CACHE.set(cacheKey, { activities: limited, origin, fetchedAt: Date.now() })
  }

  res.status(200).json({
    categories: FAMILY_CATEGORIES,
    activities: limited,
    origin,
    radiusMiles,
    source: 'openstreetmap',
    fetchedAt: Date.now(),
  })
})

// === FRONTEND SERVING (AFTER ALL API ROUTES) ===
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  console.log('[SERVER] Frontend: ENABLED')
} else {
  // Frontend not built
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Frontend not built' })
  })

  console.log('[SERVER] Frontend: MISSING (build not run)')
}

// === START SERVER ===
// CRITICAL: Listen on 0.0.0.0 for Railway
const server = app.listen(PORT, HOST, () => {
  console.log('[SERVER] ════════════════════════════════════════════════════════')
  console.log(`[SERVER] ✓ Express server started`)
  console.log(`[SERVER] ✓ Listening on http://${HOST}:${PORT}`)
  console.log(`[SERVER] ✓ Ready to accept requests`)
  console.log('[SERVER] ════════════════════════════════════════════════════════')
})

// Set timeout for keeping alive
server.keepAliveTimeout = 65000
server.headersTimeout = 66000

// === GRACEFUL SHUTDOWN ===
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('[SERVER] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('[SERVER] Server closed')
    process.exit(0)
  })
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason)
})

export default app
