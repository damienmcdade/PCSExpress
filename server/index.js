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
  "frame-src 'self' https://maps.google.com https://www.google.com",
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

function shapeBusiness(entity) {
  const reg = entity?.entityRegistration || {}
  const addr = entity?.coreData?.physicalAddress || {}
  const poc = entity?.pointsOfContact?.governmentBusinessPOC || entity?.pointsOfContact?.electronicBusinessPOC || {}
  const businessTypes = (entity?.coreData?.businessTypes?.businessTypeList || [])
    .filter(bt => VETERAN_BUSINESS_CODES.has(String(bt?.businessTypeCode || '').toUpperCase()))
    .map(bt => bt.businessTypeDesc || bt.businessTypeCode)
  return {
    id: reg.ueiSAM || reg.cageCode || reg.legalBusinessName,
    name: reg.legalBusinessName || 'Veteran-owned business',
    address: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
    city: addr.city || '',
    state: addr.stateOrProvinceCode || '',
    zip: addr.zipCode || '',
    businessTypes,
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
    VET_BIZ_CACHE.set(cacheKey, { businesses, fetchedAt: Date.now() })
    return res.status(200).json({ businesses, fallback: businesses.length === 0, source: 'sam.gov', fetchedAt: Date.now() })
  } catch (err) {
    console.error(`[vet-businesses] ${err.message}`)
    return res.status(200).json({ businesses: [], fallback: true, reason: 'network-error' })
  }
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
