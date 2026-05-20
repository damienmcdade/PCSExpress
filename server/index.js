#!/usr/bin/env node
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  sanitizeForPrompt,
  isAllowedPushEndpoint,
  isValidPushSubscription,
} from './lib/security.js'

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

// CSP is conditional on whether the user has opted into Google
// Translate. The default policy is strict — no 'unsafe-eval', no
// 'unsafe-inline' in script-src, none of the translate.google.com
// hosts. The relaxed policy adds those allowances ONLY when the
// request carries a `googtrans` cookie set by the client-side
// runtime when the user picks a non-English language during
// onboarding. That cookie cannot exist on the first page load and
// only persists for users who actively chose a translation, so
// 90 %+ of requests get the strict policy.
//
// Why the relaxations exist at all:
//   - 'unsafe-eval'  — Google's translate.google.com/translate_a/
//     element.js calls eval() internally for its translation engine.
//   - 'unsafe-inline' — the widget injects inline <script> blocks.
//   - translate.google.com / translate.googleapis.com /
//     translate.googleusercontent.com / www.gstatic.com / www.google.com
//     — script / xhr / iframe origins the widget loads from.
//   - fonts.googleapis.com / fonts.gstatic.com — fonts for the widget.
//
// Removing the widget entirely would lose translation coverage for
// any string outside the in-app dictionary (useAppLanguageRuntime),
// so the right trade is to enforce strict CSP for the default case
// and only relax for the explicit opt-in. The user has to set their
// language preference twice: first stores the cookie + reloads, the
// reload then comes back with the relaxed CSP and the widget loads.
const CSP_STRICT_BASE = [
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

const CSP_TRANSLATE_RELAXED = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://translate.googleapis.com https://translate.googleusercontent.com https://www.gstatic.com https://www.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://nominatim.openstreetmap.org https://router.project-osrm.org https://*.tile.openstreetmap.org https://translate.googleapis.com https://translate-pa.googleapis.com https://translate.googleusercontent.com",
  "frame-src 'self' https://maps.google.com https://www.google.com https://translate.google.com https://translate.googleusercontent.com https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ')

// Detect whether the request comes from a Google-Translate-opted-in
// session. The client-side runtime sets `googtrans=/auto/<lang>` on
// the cookie store before loading the widget; that same cookie is
// what triggers the relaxed CSP on subsequent navigations / reloads.
function wantsTranslateRelaxedCsp(req) {
  const cookieHeader = req.headers.cookie || ''
  if (!cookieHeader) return false
  // Match googtrans=/<source>/<target> where target is one of the
  // 11 non-English locales the runtime supports. Anything else
  // (including /auto/en) falls back to strict CSP.
  // Eight African locales (sw, ha, yo, am, zu, ig, so, af) ride on
  // Google Translate alongside the curated 11. Adding them here keeps
  // the CSP relaxation gated on the same opt-in signal regardless of
  // which locale the user chose.
  return /(?:^|;\s*)googtrans=\/[^/]+\/(es|de|fr|ko|ja|tl|ar|zh|it|pt|vi|sw|ha|yo|am|zu|ig|so|af)\b/.test(cookieHeader)
}

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
  // Conditional CSP — strict by default, relaxed only for the
  // Google Translate opt-in cookie set by useGoogleTranslateRuntime.
  // The `Vary: Cookie` response header tells caches not to share a
  // strict-CSP response with a translate-enabled client (or vice
  // versa), avoiding the Vercel / Railway edge cache mixing the two.
  res.setHeader('Content-Security-Policy', wantsTranslateRelaxedCsp(req) ? CSP_TRANSLATE_RELAXED : CSP_STRICT_BASE)
  res.setHeader('Vary', 'Cookie')
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
// Origins always allowed in addition to the CORS_ORIGINS env var:
//   - capacitor://localhost  (iOS Capacitor WebView default scheme)
//   - https://localhost      (Android Capacitor WebView with androidScheme:"https")
//   - http://localhost:5173  (Vite dev server)
//   - http://localhost:3001  (local Express)
// These are necessary so the iOS/Android shells can call /api/* on
// the Railway origin even though their WebView origin is "localhost".
const ALWAYS_ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://localhost:3001',
])
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    if (ALWAYS_ALLOWED_ORIGINS.has(origin)) return cb(null, true)
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

// === WEB PUSH READINESS ===
// Until VAPID_PUBLIC_KEY is set in env, /api/push-config returns null
// and the client treats push as unavailable. The operator generates
// the keypair once (web-push generate-vapid-keys), pins the public
// key to VAPID_PUBLIC_KEY and the private key to VAPID_PRIVATE_KEY,
// then push subscribe / dispatch work end to end. See
// docs/PUSH_SETUP.md.
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

// In-memory subscription store. Per-deploy ephemeral — fine for a
// readiness baseline; persistent storage (Redis, Postgres) is the
// next step when push is actually wired. We deliberately don't tie
// subscriptions to user identity so the server stays metadata-only.
const PUSH_SUBSCRIPTIONS = new Map()

app.get('/api/push-config', (req, res) => {
  res.status(200).json({ vapidPublicKey: VAPID_PUBLIC_KEY || null })
})

// Per-IP rate limit for /api/push-subscribe + /api/push-unsubscribe.
// Tight budget — a legitimate client only needs to subscribe once
// per device; anything beyond a handful per minute is automation /
// spam trying to fill the Map.
const _pushHits = new Map() // ip -> { count, windowStart }
const PUSH_RATE_LIMIT = 5
const PUSH_RATE_WINDOW_MS = 60_000
registerRateLimitMap(_pushHits, PUSH_RATE_WINDOW_MS)

function pushRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _pushHits.get(ip)
  if (!entry || now - entry.windowStart > PUSH_RATE_WINDOW_MS) {
    _pushHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= PUSH_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' })
  }
  entry.count += 1
  return next()
}

// Push endpoint validation is in server/lib/security.js so the
// security-critical checks are unit-testable without booting Express.
// PUSH_SUBSCRIPTIONS_MAX stays here because it's tied to the
// in-memory Map sized below.
const PUSH_SUBSCRIPTIONS_MAX = 10_000

app.post('/api/push-subscribe', pushRateLimit, express.json({ limit: '4kb' }), (req, res) => {
  const sub = req.body
  if (!isValidPushSubscription(sub)) {
    return res.status(400).json({ error: 'invalid-subscription' })
  }
  // Evict the oldest entry if we'd otherwise exceed the cap. Map
  // iteration order in V8 is insertion order, so .keys().next()
  // returns the earliest-inserted endpoint.
  if (!PUSH_SUBSCRIPTIONS.has(sub.endpoint) && PUSH_SUBSCRIPTIONS.size >= PUSH_SUBSCRIPTIONS_MAX) {
    const oldest = PUSH_SUBSCRIPTIONS.keys().next().value
    if (oldest) PUSH_SUBSCRIPTIONS.delete(oldest)
  }
  // Store ONLY the fields we need (endpoint + keys). Drops anything
  // else the client tried to attach — defence against an attacker
  // sneaking in extra metadata fields that a future dispatcher might
  // mistakenly forward.
  PUSH_SUBSCRIPTIONS.set(sub.endpoint, {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  })
  return res.status(200).json({ ok: true, count: PUSH_SUBSCRIPTIONS.size })
})

app.post('/api/push-unsubscribe', pushRateLimit, express.json({ limit: '4kb' }), (req, res) => {
  const endpoint = req.body?.endpoint
  if (typeof endpoint !== 'string' || !isAllowedPushEndpoint(endpoint)) {
    return res.status(400).json({ error: 'invalid-endpoint' })
  }
  PUSH_SUBSCRIPTIONS.delete(endpoint)
  return res.status(200).json({ ok: true })
})

// Escape hatch: wipe every form of client-side storage for the origin
// via the Clear-Site-Data response header. Used to evict the stale
// service worker left over from an earlier deploy that has been serving
// a broken cached bundle to returning visitors. The header takes effect
// before the browser dispatches the response to any service-worker
// fetch handler, so it works even when the SW is otherwise intercepting
// every navigation request. The response auto-redirects to / so the
// user immediately picks up the fresh bundle on a clean origin.
//
// NOT cleared: cookies — preserves the language-preference cookie set
// by useAppLanguageRuntime. Anyone hitting this URL accepts losing
// localStorage progress; surface that warning in the HTML body.
app.get('/api/reset-site-cache', (req, res) => {
  res.setHeader('Clear-Site-Data', '"cache", "storage"')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<title>PCS Express — Resetting</title>
<meta http-equiv="refresh" content="2;url=/" />
<style>body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0A1628;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}main{max-width:480px}h1{font-size:20px;margin:0 0 12px}p{opacity:.8;line-height:1.5}a{color:#3498db}</style>
</head><body><main>
<h1>Cache cleared</h1>
<p>Service worker, Cache Storage, and local storage for this origin have been wiped. You'll be redirected to a fresh load in 2 seconds.</p>
<p><a href="/">Continue now</a></p>
</main></body></html>`)
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

// Rate-limit map registry — every in-memory per-IP hit Map registers
// itself here so the periodic cleanup below can prune expired entries
// across all limiters in one pass. Without this, long-running servers
// accumulate one Map entry per unique source IP and never release the
// memory; the audit on 2026-05-18 flagged this as a slow-leak risk.
const _rateLimitRegistry = []; // [{ map, windowMs }]
function registerRateLimitMap(map, windowMs) {
  _rateLimitRegistry.push({ map, windowMs });
}
// Sweep every 5 minutes — drops entries whose window expired more than
// 2x the window duration ago (gives stragglers time to roll over).
setInterval(() => {
  const now = Date.now();
  for (const { map, windowMs } of _rateLimitRegistry) {
    for (const [ip, entry] of map) {
      if (now - entry.windowStart > windowMs * 2) map.delete(ip);
    }
  }
}, 5 * 60_000).unref?.();

// Per-IP rate limit for the base-review validator. The endpoint
// performs schema/PII validation but no persistence — limiting it
// blocks enumeration / DoS abuse. Matches NIST SP 800-53 SC-5 and
// OWASP ASVS V4 (5.4) defense-in-depth tier alongside the upstream
// nginx limit.
const _baseReviewHits = new Map();
registerRateLimitMap(_baseReviewHits, 60_000);
const BASE_REVIEW_LIMIT = 30;
const BASE_REVIEW_WINDOW_MS = 60_000;
function baseReviewRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const entry = _baseReviewHits.get(ip);
  if (!entry || now - entry.windowStart > BASE_REVIEW_WINDOW_MS) {
    _baseReviewHits.set(ip, { count: 1, windowStart: now });
    return next();
  }
  if (entry.count >= BASE_REVIEW_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  entry.count += 1;
  return next();
}

app.post('/api/base-reviews/validate', baseReviewRateLimit, (req, res) => {
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
registerRateLimitMap(_aiHits, AI_RATE_WINDOW_MS);

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
registerRateLimitMap(_vetBizHits, 60_000)

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

// USASpending.gov is a free, no-key federal public API. We use it as
// the primary source for the Active Listings tab when SAM_API_KEY is
// unset. The API returns recipients of federal contracts filtered by
// business_categories (e.g., service_disabled_veteran_owned_business,
// veteran_owned_business). Each returned recipient is a real,
// VERIFIED veteran-owned business that has done federal work - cross-
// checked against SBA / SAM.gov records via their UEI.
async function fetchUsaSpendingVetBusinesses(city, state) {
  if (!city) return []
  const body = {
    filters: {
      time_period: [
        // Last 24 months of awards - keeps results current.
        { start_date: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10) },
      ],
      award_type_codes: ['A', 'B', 'C', 'D'], // contract award types
      recipient_locations: state
        ? [{ country: 'USA', city, state }]
        : [{ country: 'USA', city }],
      // Both filters keyed; USASpending accepts business_categories
      // as the canonical filter for veteran ownership.
      business_categories: ['service_disabled_veteran_owned_business', 'veteran_owned_business'],
    },
    fields: ['Recipient Name', 'Recipient UEI', 'recipient_id', 'Award Amount', 'Description'],
    page: 1,
    limit: 100,
    sort: 'Award Amount',
    order: 'desc',
  }
  const signal = AbortSignal.timeout(15_000)
  const r = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!r.ok) throw new Error(`usaspending ${r.status}`)
  const data = await r.json()
  const rows = Array.isArray(data?.results) ? data.results : []
  // Aggregate by recipient UEI - a single business may have many
  // awards. We surface each business once with their largest award
  // count + total dollars to give the user context.
  const byUei = new Map()
  for (const row of rows) {
    const uei = row['Recipient UEI'] || row.recipient_id || row['Recipient Name']
    if (!uei) continue
    if (!byUei.has(uei)) byUei.set(uei, { uei, name: row['Recipient Name'] || 'Veteran-owned business', awards: 0, totalAwardUsd: 0, lastDescription: '' })
    const entry = byUei.get(uei)
    entry.awards += 1
    entry.totalAwardUsd += Number(row['Award Amount']) || 0
    if (row['Description'] && !entry.lastDescription) entry.lastDescription = String(row['Description']).slice(0, 200)
  }
  return [...byUei.values()].sort((a, b) => b.totalAwardUsd - a.totalAwardUsd)
}

function shapeUsaSpendingBusiness(entry, city, state) {
  const samUrl = entry.uei && /^[A-Z0-9]{12}$/i.test(entry.uei)
    ? `https://sam.gov/entity/${encodeURIComponent(entry.uei)}/view`
    : `https://sam.gov/search/?index=ei&page=1&pageSize=25&sort=-modifiedDate&q=${encodeURIComponent(entry.name)}`
  return {
    id: `usaspending-${entry.uei}`,
    name: entry.name,
    address: '',
    city: city || '',
    state: state || '',
    zip: '',
    businessTypes: ['Veteran-Owned Business (USASpending verified)'],
    naicsCode: '',
    naicsDesc: entry.lastDescription || `Verified federal contractor with ${entry.awards} contract${entry.awards > 1 ? 's' : ''} awarded.`,
    industry: 'business',
    url: '',
    phone: '',
    contact: '',
    samUrl,
    distanceMiles: null,
    awards: entry.awards,
    totalAwardUsd: Math.round(entry.totalAwardUsd),
    source: 'USAspending.gov',
  }
}

app.get('/api/vet-businesses', vetBizRateLimit, async (req, res) => {
  const city = sanitizeQueryParam(req.query.city)
  const state = sanitizeQueryParam(req.query.state, 16)
  const zip = sanitizeQueryParam(req.query.zip, 10)
  if (!city && !zip) {
    return res.status(400).json({ error: 'city or zip is required', businesses: [], fallback: true })
  }

  // OCONUS short-circuit. USASpending hardcodes country='USA' in the
  // recipient-location filter, and SAM.gov's physicalAddress.state
  // accepts US two-letter codes only. For an overseas gaining
  // installation, both upstream sources return empty. Instead of
  // surfacing zero results, return a curated card list pointing the
  // user to:
  //   - DoD contracting veteran-owned firms that serve OCONUS bases
  //     via the SBA VetCert + SAM.gov national directories
  //   - Google Maps search restricted to the host-nation locality
  //     so on-the-ground service providers (auto repair, movers,
  //     restaurants, etc.) appear with photos, hours, and reviews
  if (isOconusMarket(state)) {
    const where = [city, state].filter(Boolean).join(', ') || 'your gaining installation'
    const ev = encodeURIComponent
    const businesses = [
      {
        id: `oconus-sba-vetcert`,
        name: `SBA VetCert — DoD-contracting veteran-owned firms serving ${where}`,
        address: '', city: city || '', state: state || '', zip: '',
        businessTypes: ['VOSB / SDVOSB'],
        naicsCode: '', naicsDesc: '',
        industry: 'all',
        url: 'https://veterans.certify.sba.gov/',
        phone: '',
        contact: '',
        samUrl: 'https://veterans.certify.sba.gov/',
        synthetic: true,
        description: `Official SBA portal of certified veteran-owned and service-disabled veteran-owned firms eligible for DoD set-aside contracts — many serve OCONUS installations through prime / subcontractor relationships. Filter by NAICS code or state to find firms with established overseas delivery records.`,
      },
      {
        id: `oconus-sam-search`,
        name: `SAM.gov — search veteran-owned entities by NAICS for ${where}`,
        address: '', city: city || '', state: state || '', zip: '',
        businessTypes: ['Federal entity registry'],
        naicsCode: '', naicsDesc: '',
        industry: 'all',
        url: 'https://sam.gov/search/?index=ent',
        phone: '',
        contact: '',
        samUrl: 'https://sam.gov/search/?index=ent',
        synthetic: true,
        description: `Official federal entity registry. Search by NAICS code, location, and business-type flags (veteran-owned, SDVOSB) to find active contractors. Use the entity-detail view to confirm physical address, points of contact, and active DoD awards.`,
      },
      {
        id: `oconus-google-maps`,
        name: `Veteran-owned businesses on Google Maps near ${where}`,
        address: '', city: city || '', state: state || '', zip: '',
        businessTypes: ['Local search'],
        naicsCode: '', naicsDesc: '',
        industry: 'all',
        url: `https://www.google.com/maps/search/?api=1&query=${ev(`veteran-owned businesses near ${where}`)}`,
        phone: '',
        contact: '',
        samUrl: `https://www.google.com/maps/search/?api=1&query=${ev(`veteran-owned businesses near ${where}`)}`,
        synthetic: true,
        description: `Google Maps search restricted to ${where} for businesses that self-identify as veteran-owned or veteran-operated. Surfaces on-the-ground service providers (movers, auto repair, restaurants, real estate) with photos, hours, and reviews — useful for the host-nation footprint US installations build up over time.`,
      },
      {
        id: `oconus-vets-google-svc`,
        name: `Local services on Google Maps near ${where}`,
        address: '', city: city || '', state: state || '', zip: '',
        businessTypes: ['Local search'],
        naicsCode: '', naicsDesc: '',
        industry: 'service',
        url: `https://www.google.com/maps/search/?api=1&query=${ev(`military spouse business near ${where}`)}`,
        phone: '',
        contact: '',
        samUrl: `https://www.google.com/maps/search/?api=1&query=${ev(`military spouse business near ${where}`)}`,
        synthetic: true,
        description: `Companion search for military-spouse-owned businesses operating near ${where}. Many OCONUS communities have a robust spouse-business ecosystem (childcare, photography, virtual assistant, tutoring) that doesn't appear in SAM.gov but is discoverable through Google Maps with photos and reviews.`,
      },
    ]
    return res.status(200).json({
      businesses,
      fallback: false,
      source: 'oconus-curated',
      fetchedAt: Date.now(),
    })
  }

  // CONUS Google Maps discovery cards — appended to both the
  // USASpending and SAM.gov result sets. USASpending / SAM.gov match
  // on the EXACT installation city only, which misses veteran-owned
  // firms one zip code over. Google Maps "veteran-owned businesses
  // near {city}" naturally surfaces results in the ~50-mile retail
  // area around the gaining installation, giving the user broader
  // discovery alongside the federal-contracting records.
  const where = [city, state].filter(Boolean).join(', ') || city || state || 'your installation'
  const ev2 = encodeURIComponent
  const conusGoogleMapsCards = [
    {
      id: `conus-google-maps-vetbiz`,
      name: `Veteran-owned businesses on Google Maps near ${where}`,
      address: '', city, state: state || '', zip: '',
      businessTypes: ['Local search (~50 mi)'],
      naicsCode: '', naicsDesc: '',
      industry: 'all',
      url: `https://www.google.com/maps/search/?api=1&query=${ev2(`veteran-owned business near ${where}`)}`,
      phone: '',
      contact: '',
      samUrl: `https://www.google.com/maps/search/?api=1&query=${ev2(`veteran-owned business near ${where}`)}`,
      synthetic: true,
      description: `Google Maps search for businesses that self-identify as veteran-owned or veteran-operated in the ~50-mile area around ${where}. Surfaces on-the-ground service providers (auto repair, movers, restaurants, real estate, contractors) with photos, hours, and reviews — complements the SAM.gov / USASpending federal-contracting records above.`,
    },
    {
      id: `conus-google-maps-sdvosb`,
      name: `Service-disabled veteran-owned firms on Google Maps near ${where}`,
      address: '', city, state: state || '', zip: '',
      businessTypes: ['Local search (~50 mi)'],
      naicsCode: '', naicsDesc: '',
      industry: 'service',
      url: `https://www.google.com/maps/search/?api=1&query=${ev2(`SDVOSB service disabled veteran owned business near ${where}`)}`,
      phone: '',
      contact: '',
      samUrl: `https://www.google.com/maps/search/?api=1&query=${ev2(`SDVOSB service disabled veteran owned business near ${where}`)}`,
      synthetic: true,
      description: `Companion search for SDVOSB (Service-Disabled Veteran-Owned Small Business) certified firms in the ~50-mile area. SDVOSBs qualify for special DoD set-aside contracts; many also serve the local economy directly.`,
    },
    {
      id: `conus-google-maps-spouse`,
      name: `Military-spouse businesses on Google Maps near ${where}`,
      address: '', city, state: state || '', zip: '',
      businessTypes: ['Local search (~50 mi)'],
      naicsCode: '', naicsDesc: '',
      industry: 'service',
      url: `https://www.google.com/maps/search/?api=1&query=${ev2(`military spouse business near ${where}`)}`,
      phone: '',
      contact: '',
      samUrl: `https://www.google.com/maps/search/?api=1&query=${ev2(`military spouse business near ${where}`)}`,
      synthetic: true,
      description: `Military-spouse-owned local businesses in the ~50-mile area around ${where}. Many spouse-owned firms (childcare, photography, virtual assistant, real-estate, fitness, tutoring) don't appear in SAM.gov but are discoverable through Google Maps with photos and reviews.`,
    },
  ]

  // USASpending.gov fallback path: no SAM_API_KEY is required. Real
  // veteran-owned federal contractors filtered to the installation's
  // city. When SAM_API_KEY IS configured we fall through to the
  // richer SAM.gov entity data below.
  if (!SAM_API_KEY) {
    const cacheKey = `usaspending|${city}|${state}|${zip}`
    const cached = VET_BIZ_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < VET_BIZ_TTL_MS) {
      return res.status(200).json({ businesses: cached.businesses, fallback: cached.businesses.length === 0, source: 'cache', fetchedAt: cached.fetchedAt })
    }
    try {
      const entries = await fetchUsaSpendingVetBusinesses(city, state)
      const entityRecords = entries.slice(0, 25).map(e => shapeUsaSpendingBusiness(e, city, state))
      // Always include Google Maps discovery cards so the user gets a
      // ~50-mile-radius supplement to USASpending's exact-city match.
      const businesses = [...entityRecords, ...conusGoogleMapsCards]
      VET_BIZ_CACHE.set(cacheKey, { businesses, fetchedAt: Date.now() })
      return res.status(200).json({ businesses, fallback: entityRecords.length === 0, source: 'usaspending.gov+google-maps', fetchedAt: Date.now() })
    } catch (err) {
      console.error(`[vet-businesses] usaspending ${err.message}`)
      // Even on upstream error, return the Google Maps discovery cards
      // so the user has something actionable instead of an empty tab.
      return res.status(200).json({ businesses: conusGoogleMapsCards, fallback: true, reason: 'upstream-error', source: 'google-maps-only' })
    }
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
    const entityRecords = veteranOnly.slice(0, 25)
    // Append Google Maps discovery cards for the ~50-mile area so the
    // user gets supplemental local businesses alongside the SAM.gov
    // federal-contractor records.
    const businesses = [...entityRecords, ...conusGoogleMapsCards]
    VET_BIZ_CACHE.set(cacheKey, { businesses, fetchedAt: Date.now() })
    return res.status(200).json({ businesses, fallback: entityRecords.length === 0, source: 'sam.gov+google-maps', fetchedAt: Date.now() })
  } catch (err) {
    console.error(`[vet-businesses] ${err.message}`)
    // Even on upstream error, return the Google Maps discovery cards.
    return res.status(200).json({ businesses: conusGoogleMapsCards, fallback: true, reason: 'network-error', source: 'google-maps-only' })
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
registerRateLimitMap(_housingHits, 60_000)

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

// OSM Overpass: ALL named residential places near the geocoded
// installation - apartment communities, named single-family
// communities, townhouse rows, semi-detached duplex communities,
// plus place=neighbourhood / suburb / quarter (named neighborhoods).
// Building type is preserved so the frontend can categorize each
// card by housing type instead of lumping everything into
// "Apartment community".
// OSM building tags we query for housing. `building=house` and
// `building=residential` are intentionally excluded - millions of
// unnamed buildings per metro overflow Overpass timeouts even with
// a name filter. We keep the larger named structures that map well
// to property types and let the synthetic search-CTA cards cover
// the missing types (Single Family / Condo / etc.) via Apartments.com
// deep links.
const HOUSING_BUILDING_TAGS = {
  'building=apartments':         { type: 'Apartment community', propertyType: 'Apartment community' },
  'building=terrace':            { type: 'Townhouse community', propertyType: 'Townhouse' },
  'building=semidetached_house': { type: 'Duplex community',    propertyType: 'Duplex' },
  'building=detached':           { type: 'Single-family community', propertyType: 'Single Family' },
}
const PLACE_TAGS = {
  'place=neighbourhood': { type: 'Neighborhood',  propertyType: 'Neighborhood' },
  'place=suburb':        { type: 'Suburb',        propertyType: 'Neighborhood' },
  'place=quarter':       { type: 'District',      propertyType: 'Neighborhood' },
}

async function overpassApartmentsFetch(lat, lng, radiusMeters) {
  // Two query batches run in PARALLEL so a slow mirror doesn't
  // serialize building + place lookups. Each batch independently
  // cascades through the mirror list via overpassQuery. Partial
  // failures are tolerated — if one batch returns elements and the
  // other doesn't, we still surface useful results.
  // Batch A: named residential BUILDINGS (apartments / terrace /
  // detached / etc.) with a name tag.
  const buildingFilters = Object.keys(HOUSING_BUILDING_TAGS).map(t => {
    const [k, v] = t.split('=')
    return `node["${k}"="${v}"]["name"](around:${radiusMeters},${lat},${lng});way["${k}"="${v}"]["name"](around:${radiusMeters},${lat},${lng});`
  }).join('')
  // Batch B: named PLACES (neighborhoods / suburbs).
  const placeFilters = Object.keys(PLACE_TAGS).map(t => {
    const [k, v] = t.split('=')
    return `node["${k}"="${v}"](around:${radiusMeters},${lat},${lng});`
  }).join('')

  const runBatch = async (filters, tag) => {
    try {
      const data = await overpassQuery(`[out:json][timeout:8];(${filters});out center tags;`)
      return Array.isArray(data?.elements) ? data.elements : []
    } catch (err) {
      console.error(`[overpass-housing] ${tag} batch failed: ${err.message}`)
      return []
    }
  }
  const [buildings, places] = await Promise.all([
    runBatch(buildingFilters, 'buildings'),
    runBatch(placeFilters, 'places'),
  ])
  return { elements: [...buildings, ...places] }
}

function shapeOsmApartmentComplex(el, originLat, originLng, originCity, originState, userLang) {
  const tags = el.tags || {}
  // Proper-noun resolution: prefer the user's onboarding language,
  // then English/international names, finally the local-language
  // `name` tag. OSM proper nouns for buildings and neighborhoods are
  // typically the names locals and signage actually use, so falling
  // back to them is correct UX even when the rest of the app is in
  // another language. UI strings (descriptions, button labels) are
  // separately translated by AppLanguageRuntime.
  const name = pickOsmName(tags, userLang)
  if (!isUsableOsmName(name, 'apartments')) return null

  // Resolve property type from whichever recognized housing/place tag
  // the element carries. Defaults to "Apartment community" when no
  // explicit building tag matches.
  let typeMeta = { type: 'Apartment community', propertyType: 'Apartment community' }
  for (const [tag, meta] of Object.entries({ ...HOUSING_BUILDING_TAGS, ...PLACE_TAGS })) {
    const [k, v] = tag.split('=')
    if (tags[k] === v) { typeMeta = meta; break }
  }

  const elLat = el.lat ?? el.center?.lat
  const elLng = el.lon ?? el.center?.lon
  if (typeof elLat !== 'number' || typeof elLng !== 'number') return null
  const distance = haversineMiles(originLat, originLng, elLat, elLng)
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const addrCity = tags['addr:city'] || originCity || ''
  const addrState = tags['addr:state'] || originState || ''
  const addrZip = tags['addr:postcode'] || ''

  const oconus = isOconusMarket(addrState)
  const featureBits = []
  if (tags['building:levels']) featureBits.push(`${tags['building:levels']}-story`)
  if (tags['units'] || tags['building:units']) featureBits.push(`${tags['units'] || tags['building:units']} units`)
  if (tags.year_built) featureBits.push(`built ${tags.year_built}`)
  const featureSentence = featureBits.length ? ` ${featureBits.join(' · ')}.` : ''
  const description = `${typeMeta.type} located approximately ${distance} mi from your gaining installation.${featureSentence} Floorplans, square footage, and current rent vary by unit — verify availability with the listing source before scheduling a tour.`

  // Listing-source URL. CONUS uses Google search restricted to U.S.
  // rental aggregators (apartments.com, zillow, trulia, etc.). OCONUS
  // uses Google search restricted to DoD-sanctioned worldwide military
  // housing networks (AHRN, MilitaryByOwner, MilitaryHousing.us). We
  // do NOT generate apartments.com/ahrn.com deep-link URLs because
  // both sites are single-page applications whose routes do not
  // accept open query parameters and either 404 or land on a homepage.
  const ev = encodeURIComponent
  const cityState = [addrCity, addrState].filter(Boolean).join(' ')
  const aggregatorSites = oconus
    ? 'site:ahrn.com OR site:militarybyowner.com OR site:homes.mil'
    : 'site:apartments.com OR site:zillow.com OR site:trulia.com OR site:realtor.com OR site:rent.com OR site:apartmentlist.com'
  const searchQuery = name && cityState
    ? `"${name}" ${cityState} ${aggregatorSites}`
    : street && cityState
      ? `"${street}" ${cityState} apartments for rent ${aggregatorSites}`
      : cityState
        ? `apartments for rent ${cityState} ${aggregatorSites}`
        : `${name} ${aggregatorSites}`
  const apartmentsSearch = `https://www.google.com/search?q=${ev(searchQuery)}`

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
    propertyType: typeMeta.propertyType,
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

// A US state is either a 2-letter postal abbreviation, DC, or one of
// the geographic territories (PR, GU, VI, MP, AS). Military mail
// routing codes (AE, AP, AA) are NOT geocodable and are intentionally
// excluded — installations that historically used them have been
// updated to carry real city/country data instead.
const US_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC','PR','GU','VI','MP','AS',
])
function isOconusMarket(state) {
  if (!state) return false
  const s = String(state).trim().toUpperCase()
  if (s.length === 2 && US_STATE_CODES.has(s)) return false
  return true
}

// Synthetic search-portal cards. OSM only carries reliable name +
// address data for apartment complexes; single-family homes, condos,
// townhouses, and small multifamily units rarely have OSM coverage.
// For those we emit "card-shaped" search portals that route to the
// correct working aggregator for the market region.
//
// CONUS (50 states + DC, PR, GU, VI, MP, AS): six property-type cards
// linking to Google-restricted searches across U.S. rental aggregators
// (apartments.com, zillow, trulia, realtor.com, rent.com,
// apartmentlist.com).
//
// OCONUS (everywhere else, including USAREUR, USFK, USFJ, etc.): four
// honest directory cards linking to DoD-sanctioned worldwide military
// housing networks. We do NOT fabricate property-type deep-links here
// because none of the OCONUS aggregators support open URL parameters
// for type-filtering; both AHRN.com and MilitaryByOwner are single-
// page applications whose search has to be performed from inside the
// site. Synthesizing "looks-real" URLs that land on homepages or 404s
// is the exact bug we are fixing.
function syntheticTypeCards(city, state, zip) {
  if (!city && !state) return []
  const ev = encodeURIComponent
  const cityState = `${city}${state ? ', ' + state : ''}`
  const oconus = isOconusMarket(state)

  if (oconus) {
    // DoD-sanctioned portal landing pages (homes.mil, ahrn.com,
    // militarybyowner.com, militaryinstallations) — each opens at a
    // discovery page where the user types the installation. Query-
    // param deep linking isn't supported uniformly across these
    // sites, so we keep their canonical landing URLs and let the
    // adjacent Google Maps card handle the immediate-search case.
    const directory = [
      {
        propertyType: 'DoD official',
        name: 'HOMES.mil — DoD privatized housing',
        description: 'Official Department of Defense privatized housing portal. Search on-installation and partner housing worldwide, including OCONUS communities. Government-managed; no advertising; no broker fees.',
        url: 'https://www.homes.mil/',
      },
      {
        propertyType: 'AHRN.com',
        name: `AHRN — search rentals near ${city || 'your installation'}`,
        description: 'Automated Housing Referral Network. DoD-sanctioned global housing marketplace for military families, with strong OCONUS coverage in Germany, Italy, Japan, Korea, and the United Kingdom. Type the installation name in the search bar to view active listings.',
        url: 'https://www.ahrn.com/find-a-home',
      },
      {
        propertyType: 'MilitaryByOwner',
        name: `MilitaryByOwner — homes for rent near ${city || 'your installation'}`,
        description: 'For-rent and for-sale homes posted directly by military landlords. Covers stateside and overseas installations. Use the installation search on the landing page to filter by base.',
        url: 'https://www.militarybyowner.com/find-rentals/',
      },
      {
        propertyType: 'MilitaryINSTALLATIONS',
        name: `MilitaryINSTALLATIONS — ${city || 'installation'} resources`,
        description: 'Department of Defense installation directory with housing, school liaison, and family-readiness contacts for every base worldwide. Authoritative source for on-installation housing waitlists and points of contact.',
        url: `https://installations.militaryonesource.mil/search?keyword=${ev(city || state)}`,
      },
      {
        propertyType: 'Google Maps',
        name: `Off-base rentals on Google Maps near ${city || 'your installation'}`,
        description: 'Curated Google Maps search for apartments, rental agencies, and landlord listings in the host-nation area around your gaining installation. Opens with the locality pre-filtered so you see real properties, photos, and reviews — useful when the DoD-sanctioned portals do not surface the unit type you need.',
        url: `https://www.google.com/maps/search/?api=1&query=${ev(`apartments for rent near ${city || ''} ${state || ''}`.trim())}`,
      },
    ]
    return directory.map((entry, idx) => ({
      id: `oconus-directory-${idx}-${ev(city || state)}`,
      name: entry.name,
      address: '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      beds: null,
      baths: null,
      sqft: null,
      propertyType: entry.propertyType,
      distanceMiles: null,
      description: entry.description,
      price: null,
      directionsUrl: entry.url,
      apartmentsSearchUrl: entry.url,
      listingUrl: entry.url,
      mapUrl: entry.url,
      website: '',
      phone: '',
      source: 'DoD verified directory',
      synthetic: true,
    }))
  }

  // CONUS branch: six property-type search portals.
  const aggregatorSites = 'site:apartments.com OR site:zillow.com OR site:trulia.com OR site:realtor.com OR site:rent.com OR site:apartmentlist.com'
  const TYPES = [
    { propertyType: 'Single Family', query: 'single-family homes for rent',  blurb: 'single-family homes' },
    { propertyType: 'Condo',         query: 'condominiums for rent',         blurb: 'condominium units' },
    { propertyType: 'Townhouse',     query: 'townhomes for rent',            blurb: 'townhome rentals' },
    { propertyType: 'Duplex',        query: 'duplex units for rent',         blurb: 'duplex rentals' },
    { propertyType: 'Triplex',       query: 'triplex units for rent',        blurb: 'triplex rentals' },
    { propertyType: 'Quadplex',      query: 'quadplex or fourplex for rent', blurb: 'quadplex and fourplex rentals' },
  ]
  return TYPES.map(t => {
    const googleSearchUrl = `https://www.google.com/search?q=${ev(`${t.query} ${cityState} ${aggregatorSites}`)}`
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${ev(`${t.query} ${cityState}`)}`
    return {
      id: `synthetic-${t.propertyType.toLowerCase().replace(/\s+/g, '-')}-${ev(cityState)}`,
      name: `${t.propertyType} rentals near ${city}`,
      address: '',
      city,
      state: state || '',
      zip: zip || '',
      beds: null,
      baths: null,
      sqft: null,
      propertyType: t.propertyType,
      distanceMiles: null,
      description: `Curated search for ${t.blurb} near ${cityState}. The card opens a Google search restricted to Apartments.com, Zillow, Trulia, Realtor.com, Rent.com, and ApartmentList so you see only active listings. Confirm availability, lease terms, pet policy, and move-in dates with the listing source.`,
      price: null,
      directionsUrl: googleSearchUrl,
      apartmentsSearchUrl: googleMapsUrl,
      listingUrl: googleSearchUrl,
      mapUrl: googleMapsUrl,
      website: '',
      phone: '',
      source: 'Aggregated rental search',
      synthetic: true,
    }
  })
}

app.get('/api/housing-listings', housingRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 60)
  const state = String(req.query.state || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 16)
  const zip = String(req.query.zip || '').trim().replace(/[^A-Za-z0-9\-]/g, '').slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  const userLang = String(req.query.lang || 'en').toLowerCase().replace(/[^a-z]/g, '').slice(0, 5) || 'en'
  if (!city && !zip && !address) {
    return res.status(400).json({ error: 'city, zip, or address is required', listings: [], fallback: true })
  }

  // Cache key includes userLang so different-language users do not
  // share the same cache entry (each language gets its own name set).
  const cacheKey = `${city}|${state}|${zip}|${address}|${userLang}`
  const cached = HOUSING_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < HOUSING_TTL_MS) {
    return res.status(200).json({ listings: cached.listings, fallback: cached.listings.length === 0, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  // RapidAPI rentals — optional, paid, slow. We race it against an
  // 8s wall-clock budget. If RapidAPI doesn't return in time, we drop
  // it entirely and return only the synthetic Google-Maps search-
  // portal cards (which require no API call and resolve in <50ms).
  // The frontend's 25s outer timeout was firing because RapidAPI's
  // own 15s timeout meant cold-start scenarios saw a 20+ second
  // response. 8s here makes the endpoint feel snappy and the
  // synthetic cards alone are already actionable for every market.
  const RAPIDAPI_BUDGET_MS = 8_000
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
      const signal = AbortSignal.timeout(RAPIDAPI_BUDGET_MS - 500)
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

  // Hard wall-clock cap — synthetic cards alone are always actionable.
  const rapidApiResults = await Promise.race([
    rapidApiPromise,
    new Promise(resolve => setTimeout(() => {
      console.error('[housing-listings] rapidapi budget exceeded; returning synthetic-only')
      resolve([])
    }, RAPIDAPI_BUDGET_MS)),
  ])
  // Result ordering, top to bottom:
  //   1. RapidAPI priced rentals — real addresses with bed/bath/sqft
  //      (only when RAPIDAPI_KEY is configured).
  //   2. Google Maps source-portal cards.
  //      - CONUS: property-type Google searches across U.S. rental
  //        aggregators.
  //      - OCONUS: DoD-verified directory entry points (HOMES.mil,
  //        AHRN, MilitaryByOwner, MilitaryINSTALLATIONS).
  // Google Maps is the canonical POI data source — no OSM/Overpass
  // call so the response returns in <1s for every market.
  const syntheticResults = syntheticTypeCards(city, state, zip)
  const combined = [
    ...rapidApiResults,
    ...syntheticResults,
  ].slice(0, 40)
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

// === HOUSING MARKET STATS (FRED + HUD USER) ===
// Public-data market context for the gaining installation's PCS market.
// Two free U.S. government data sources, both keyed (free registration):
//   1. FRED (Federal Reserve Economic Data, stlouisfed.org)
//      - MORTGAGE30US: 30-year fixed-rate mortgage average (weekly)
//      - MSPUS:        Median Sales Price of Houses Sold (national, Q)
//      - CSUSHPISA:    S&P/Case-Shiller National Home Price Index (M)
//   2. HUD User (huduser.gov) Fair Market Rents
//      - FY 40th-percentile FMRs by metro / county
//      - Sets the BAH-comparison baseline service members care about
// Both endpoints degrade silently when the corresponding API key env
// var is unset; the frontend hides the panel section in that case.
// CONUS-only: HUD FMRs do not cover OCONUS installations. OCONUS
// requests return mortgageRate (still useful as a national constant)
// but an empty fairMarketRent block.
const FRED_API_KEY = process.env.FRED_API_KEY || ''
const HUD_API_KEY = process.env.HUD_API_KEY || ''
const MARKET_STATS_CACHE = new Map()
const MARKET_STATS_TTL_MS = 6 * 60 * 60 * 1000   // 6h
const MARKET_STATS_RATE_LIMIT = 30
const MARKET_STATS_RATE_WINDOW_MS = 60_000
const _marketStatsHits = new Map()
registerRateLimitMap(_marketStatsHits, 60_000)

function marketStatsRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _marketStatsHits.get(ip)
  if (!entry || now - entry.windowStart > MARKET_STATS_RATE_WINDOW_MS) {
    _marketStatsHits.set(ip, { count: 1, windowStart: now })
    return next()
  }
  if (entry.count >= MARKET_STATS_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.', stats: null, fallback: true })
  }
  entry.count += 1
  return next()
}

// FRED latest observation. Returns { value:number, asOf:'YYYY-MM-DD' }
// or null on any failure / missing key. We sort desc and ask for one
// row so a single round-trip pulls the freshest data point.
async function fredLatestObservation(seriesId) {
  if (!FRED_API_KEY) return null
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(FRED_API_KEY)}&file_type=json&sort_order=desc&limit=1`
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) { console.error(`[market-stats] fred ${seriesId} ${r.status}`); return null }
    const data = await r.json()
    const obs = Array.isArray(data?.observations) ? data.observations[0] : null
    if (!obs || obs.value === '.' || obs.value == null) return null
    const value = Number(obs.value)
    if (!Number.isFinite(value)) return null
    return { value, asOf: obs.date, seriesId }
  } catch (err) {
    console.error(`[market-stats] fred ${seriesId} ${err.message}`)
    return null
  }
}

// HUD User FMR: pull all county/metro rows for a state, pick the row
// whose town_name / county_name / metro_name best matches the user's
// city. statedata returns a heterogeneous shape (metroareas + counties)
// so we walk both. Returns null when no key, not US, or no match.
async function hudFmrForCityState(city, state) {
  if (!HUD_API_KEY) return null
  if (isOconusMarket(state)) return null
  const s = String(state || '').trim().toUpperCase()
  if (s.length !== 2 || !US_STATE_CODES.has(s)) return null
  try {
    const url = `https://www.huduser.gov/hudapi/public/fmr/statedata/${encodeURIComponent(s)}`
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${HUD_API_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) { console.error(`[market-stats] hud ${s} ${r.status}`); return null }
    const data = await r.json()
    const year = data?.data?.year || null
    const counties = Array.isArray(data?.data?.counties) ? data.data.counties : []
    const metros = Array.isArray(data?.data?.metroareas) ? data.data.metroareas : []
    const cityLc = String(city || '').toLowerCase().trim()
    // Score every candidate; pick the highest-scoring match. Exact
    // town_name match wins over county/metro substring matches.
    const score = (row) => {
      const town = String(row.town_name || '').toLowerCase()
      const county = String(row.county_name || '').toLowerCase()
      const metro = String(row.metro_name || row.area_name || '').toLowerCase()
      if (cityLc && town === cityLc) return 100
      if (cityLc && town.includes(cityLc)) return 80
      if (cityLc && metro.includes(cityLc)) return 60
      if (cityLc && county.includes(cityLc)) return 50
      return 0
    }
    const all = [...metros, ...counties]
    if (!all.length) return null
    let best = null
    let bestScore = -1
    for (const row of all) {
      const sc = score(row)
      if (sc > bestScore) { bestScore = sc; best = row }
    }
    if (!best || bestScore <= 0) {
      // Fall back to first metro (state average) when nothing matched
      best = metros[0] || counties[0]
      if (!best) return null
    }
    const num = (v) => {
      const n = Number(v)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    return {
      areaName: best.town_name || best.metro_name || best.area_name || best.county_name || `${s} (state)`,
      year,
      efficiency: num(best.Efficiency ?? best.efficiency ?? best.fmr_0),
      oneBedroom: num(best['One-Bedroom'] ?? best.one_bedroom ?? best.fmr_1),
      twoBedroom: num(best['Two-Bedroom'] ?? best.two_bedroom ?? best.fmr_2),
      threeBedroom: num(best['Three-Bedroom'] ?? best.three_bedroom ?? best.fmr_3),
      fourBedroom: num(best['Four-Bedroom'] ?? best.four_bedroom ?? best.fmr_4),
      matchType: bestScore >= 80 ? 'city' : bestScore >= 50 ? 'metro' : 'state-avg',
    }
  } catch (err) {
    console.error(`[market-stats] hud ${s} ${err.message}`)
    return null
  }
}

app.get('/api/market-stats', marketStatsRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 60)
  const state = String(req.query.state || '').trim().replace(/[^A-Za-z0-9 .'\-]/g, '').slice(0, 16)
  const zip = String(req.query.zip || '').trim().replace(/[^A-Za-z0-9\-]/g, '').slice(0, 10)
  if (!city && !state && !zip) {
    return res.status(400).json({ error: 'city, state, or zip is required', stats: null, fallback: true })
  }
  const cacheKey = `${city}|${state}|${zip}`
  const cached = MARKET_STATS_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < MARKET_STATS_TTL_MS) {
    return res.status(200).json({ stats: cached.stats, oconusHousing: cached.oconusHousing || null, fallback: false, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  const [mortgageRate, medianHomePrice, homePriceIndex, fairMarketRent] = await Promise.all([
    fredLatestObservation('MORTGAGE30US'),
    fredLatestObservation('MSPUS'),
    fredLatestObservation('CSUSHPISA'),
    hudFmrForCityState(city, state),
  ])

  const stats = {
    mortgageRate30Yr: mortgageRate, // { value, asOf, seriesId } or null
    medianHomePrice,                 // national, quarterly
    homePriceIndex,                  // S&P/Case-Shiller (Jan 2000 = 100)
    fairMarketRent,                  // by bedroom count (HUD, CONUS only)
  }
  // OCONUS housing affordability is governed by Overseas Housing
  // Allowance (OHA) for military and Living Quarters Allowance (LQA)
  // for civilians, not HUD Fair Market Rent. We surface a small set of
  // canonical DoD/DSSR resources so the OCONUS user sees actionable
  // guidance instead of an empty FMR card.
  const oconusHousing = isOconusMarket(state) ? {
    title: `OCONUS housing allowances apply at ${city ? `${city}, ${state}` : state}`,
    body:  'HUD Fair Market Rent only covers U.S. localities. Overseas housing affordability is determined by your component’s OCONUS allowance:',
    resources: [
      { name: 'DoD Overseas Housing Allowance (OHA) rates',                url: 'https://www.defensetravel.dod.mil/site/oha.cfm',                          who: 'Military',                description: 'Official DTMO lookup for OHA rate, utility/recurring maintenance, and MIHA-Miscellaneous components at the gaining overseas locality.' },
      { name: 'DoD Move-In Housing Allowance (MIHA) overview',             url: 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/',       who: 'Military',                description: 'MIHA-Rent, MIHA-Security, and MIHA-Miscellaneous one-time payments to help cover overseas move-in costs.' },
      { name: 'DSSR §130 — Living Quarters Allowance (LQA)',               url: 'https://aoprals.state.gov/content.asp?content_id=171&menu_id=92',         who: 'DoD Civilian',            description: 'Department of State Standardized Regulations Section 130 — the LQA rules and rate tables for U.S. government civilians stationed overseas.' },
      { name: 'DSSR §240 — Temporary Quarters Subsistence Allowance (TQSA)', url: 'https://aoprals.state.gov/content.asp?content_id=204&menu_id=92',       who: 'DoD Civilian',            description: 'DSSR Section 240 — TQSA covers up to 90 days of overseas temporary lodging while you search for permanent quarters.' },
      { name: 'HOMES.mil — Gaining installation Housing Office',           url: 'https://www.homes.mil',                                                   who: 'All',                     description: 'DoD Housing Office portal — start here for current on-base wait times and approved off-base rental coordination.' },
      { name: 'AHRN.com — Automated Housing Referral Network',             url: 'https://www.ahrn.com',                                                    who: 'All',                     description: 'DoD-sponsored off-base rental search and listing service. Pre-screened landlords, military-friendly lease language, in-country at most OCONUS bases.' },
    ],
  } : null
  const hasAnyData = Object.values(stats).some(v => v && (v.value != null || v.areaName)) || !!oconusHousing
  if (hasAnyData) {
    MARKET_STATS_CACHE.set(cacheKey, { stats, oconusHousing, fetchedAt: Date.now() })
  }
  res.status(200).json({
    stats,
    oconusHousing,
    fallback: !hasAnyData,
    sources: {
      fred: FRED_API_KEY ? (mortgageRate ? 'ok' : 'error') : 'no-api-key',
      hud:  HUD_API_KEY  ? (fairMarketRent ? 'ok' : (isOconusMarket(state) ? 'oconus-not-covered' : 'no-match')) : 'no-api-key',
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
registerRateLimitMap(_jobsHits, 60_000)

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

  // OCONUS supplement. Live boards (USAJOBS, The Muse, RemoteOK) bias
  // toward U.S. positions; OCONUS spouses near Ramstein/Camp Humphreys/
  // Yokota benefit more from NATO civilian, DoDCIVS overseas hiring,
  // and host-nation labor-agency portals. These appear as additional
  // listing cards alongside whatever the live boards returned.
  let oconusSupplement = []
  if (isOconusMarket(state)) {
    const where = city ? `${city}, ${state}` : state
    oconusSupplement = [
      { source: 'OCONUS Resource', title: 'USAJOBS — Overseas filter',                            url: 'https://www.usajobs.gov/Search/Results?l=&p=Outside%20the%20United%20States', company: 'OPM / USAJOBS',                       location: 'Outside the United States',         description: 'Federal job listings restricted to positions located outside the United States — includes DoD civilian, State Department, and other agency overseas roles. Use this filter for the most up-to-date overseas openings.', postedAt: '' },
      { source: 'OCONUS Resource', title: 'DCPAS — DoD Civilian Overseas Employment',             url: 'https://www.dcpas.osd.mil/career-resources/overseas-employment',              company: 'DoD Civilian Personnel Advisory Service', location: 'Worldwide (DoD)',                   description: 'Official DoD guide to civilian employment overseas — Family Member Preference (FMP) eligibility, Priority Placement Program (PPP-S) for spouses, and PCS-linked hiring paths.',                                       postedAt: '' },
      { source: 'OCONUS Resource', title: 'Military Spouse Preference (PPP-S)',                   url: 'https://www.dcpas.osd.mil/career-resources/military-spouse-preference',       company: 'DCPAS / DoD',                         location: 'Worldwide (military spouse)',       description: 'Apply your DoD military-spouse preference when competing for federal civilian positions at the gaining overseas installation. Required step for many OCONUS spouse hires.',                                          postedAt: '' },
      { source: 'OCONUS Resource', title: 'NATO International Civilian Jobs',                     url: 'https://www.nato.int/cps/en/natohq/employment.htm',                           company: 'NATO Headquarters',                   location: 'Brussels / Mons (SHAPE) / Naples',  description: 'NATO HQ civilian employment portal — open to citizens of all NATO member nations. Useful for spouses near Brussels, SHAPE/Mons, and JFC Naples.',                                                                       postedAt: '' },
      { source: 'OCONUS Resource', title: `Host-nation labor office near ${where}`,               url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`labor ministry job center near ${where}`)}`, company: 'Host nation labor ministry', location: where,                              description: 'Quick Google Maps deep-link to the official host-nation labor ministry office (e.g., Germany Arbeitsagentur, Italy Centro per l’Impiego, Japan Hello Work, Korea Worknet) near your gaining installation.',           postedAt: '' },
    ]
  }
  const finalListings = oconusSupplement.length
    ? [...oconusSupplement, ...listings].slice(0, 50)
    : listings

  // Skip caching empty results so transient upstream failures (e.g.,
  // RemoteOK 403 from datacenter IPs) do not poison the cache.
  if (finalListings.length > 0) {
    JOBS_CACHE.set(cacheKey, { listings: finalListings, sources, fetchedAt: Date.now() })
  }

  res.status(200).json({
    listings: finalListings,
    sources,
    fallback: finalListings.length === 0,
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
registerRateLimitMap(_religiousHits, 60_000)

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

function shapeOsmReligious(el, originLat, originLng, userLang) {
  const tags = el.tags || {}
  if (tags.amenity !== 'place_of_worship') return null
  const rawName = pickOsmName(tags, userLang) || ''
  if (!isUsableOsmName(rawName, 'place of worship')) return null
  const name = rawName
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
  const query = `[out:json][timeout:8];(node["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng});way["amenity"="place_of_worship"](around:${radiusMeters},${lat},${lng}););out center tags;`
  return overpassQuery(query)
}

app.get('/api/religious-services', religiousRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().slice(0, 80)
  const state = String(req.query.state || '').trim().slice(0, 16)
  const zip = String(req.query.zip || '').trim().slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  const radiusMiles = Math.max(5, Math.min(50, parseInt(req.query.radiusMiles, 10) || 25))
  const userLang = String(req.query.lang || 'en').toLowerCase().replace(/[^a-z]/g, '').slice(0, 5) || 'en'

  const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
  if (!geocodeQuery) {
    return res.status(400).json({ error: 'address, city, or zip is required', services: [], fallback: true })
  }

  const cacheKey = `${geocodeQuery}|${radiusMiles}|${userLang}`
  const cached = RELIGIOUS_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < RELIGIOUS_TTL_MS) {
    return res.status(200).json({ services: cached.services, origin: cached.origin, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  // Geocoding is best-effort — synthetic Google Maps cards don't
  // need lat/lng and must render even when Nominatim can't resolve
  // the OCONUS market.
  let origin = null
  try {
    origin = await geocodeNominatim({ address, city, state, zip })
  } catch (err) {
    console.error(`[religious] geocode ${err.message}`)
  }

  // Google Maps denomination cards are the canonical Religious
  // Services directory. Each card deep-links to a Google Maps
  // search restricted to the locality so users see service times,
  // contact info, and directions in one tap.
  const cards = syntheticReligiousCards(city, state)

  if (cards.length === 0) {
    return res.status(200).json({ services: [], origin, fallback: true, reason: 'no-locality', source: 'google-maps-search' })
  }

  RELIGIOUS_CACHE.set(cacheKey, { services: cards, origin, fetchedAt: Date.now() })

  res.status(200).json({
    services: cards,
    origin,
    radiusMiles,
    source: 'google-maps-search',
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
registerRateLimitMap(_schoolHits, 60_000)

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

function shapeOsmSchool(el, originLat, originLng, userLang) {
  const tags = el.tags || {}
  let matchTag = null
  for (const tag of Object.keys(SCHOOL_TAG_MAP)) {
    const [k, v] = tag.split('=')
    if (tags[k] === v) { matchTag = tag; break }
  }
  if (!matchTag) return null
  const meta = SCHOOL_TAG_MAP[matchTag]
  const rawName = pickOsmName(tags, userLang) || ''
  if (!isUsableOsmName(rawName, meta.type)) return null
  const name = rawName
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
  const query = `[out:json][timeout:8];(${filters});out center tags;`
  return overpassQuery(query)
}

app.get('/api/schools-nearby', schoolRateLimit, async (req, res) => {
  const city = String(req.query.city || '').trim().slice(0, 80)
  const state = String(req.query.state || '').trim().slice(0, 16)
  const zip = String(req.query.zip || '').trim().slice(0, 10)
  const address = String(req.query.address || '').trim().slice(0, 160)
  const radiusMiles = Math.max(5, Math.min(50, parseInt(req.query.radiusMiles, 10) || 25))
  const userLang = String(req.query.lang || 'en').toLowerCase().replace(/[^a-z]/g, '').slice(0, 5) || 'en'

  const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
  if (!geocodeQuery) {
    return res.status(400).json({ error: 'address, city, or zip is required', categories: SCHOOL_CATEGORIES, schools: [], fallback: true })
  }

  const cacheKey = `${geocodeQuery}|${radiusMiles}|${userLang}`
  const cached = SCHOOL_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < SCHOOL_TTL_MS) {
    return res.status(200).json({ categories: SCHOOL_CATEGORIES, schools: cached.schools, origin: cached.origin, source: 'cache', fetchedAt: cached.fetchedAt })
  }

  // Geocoding is best-effort — synthetic Google Maps cards work
  // from city/state alone and must surface even when Nominatim
  // can't resolve an OCONUS market.
  let origin = null
  try {
    origin = await geocodeNominatim({ address, city, state, zip })
  } catch (err) {
    console.error(`[schools] geocode ${err.message}`)
  }

  // Google Maps category cards are the canonical school directory.
  // Each card deep-links to a Google Maps search for the category
  // restricted to the locality so users see real schools with
  // ratings, contact info, and zoning details.
  const cards = syntheticSchoolCards(city, state)

  if (cards.length === 0) {
    return res.status(200).json({ categories: SCHOOL_CATEGORIES, schools: [], origin, fallback: true, reason: 'no-locality', source: 'google-maps-search' })
  }

  SCHOOL_CACHE.set(cacheKey, { schools: cards, origin, fetchedAt: Date.now() })

  res.status(200).json({
    categories: SCHOOL_CATEGORIES,
    schools: cards,
    origin,
    radiusMiles,
    source: 'google-maps-search',
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
// Family Fun category list. Expanded per user direction to include
// arcades, amusement parks, playgrounds, shopping malls, community
// centers, water parks, paintball, airsoft, race tracks, and other
// hands-on family activities.
const FAMILY_CATEGORIES = [
  { id: 'parks', label: 'Parks & Outdoors', emoji: '🌲', description: 'Parks, playgrounds, gardens, trails, nature reserves, and national parks.' },
  { id: 'amusement', label: 'Amusement, Theme & Water Parks', emoji: '🎢', description: 'Theme parks, water parks, family arcades.' },
  { id: 'movies', label: 'Movie Theaters', emoji: '🎦', description: 'Family-friendly cinemas.' },
  { id: 'museums', label: 'Museums', emoji: '🏛️', description: 'Children’s, science, history, and military museums plus public memorials.' },
  { id: 'sports', label: 'Active Play & Sports', emoji: '🏟️', description: 'Pools, ice rinks, bowling, mini-golf, climbing, paintball, airsoft, kart and motorsport tracks.' },
  { id: 'culture', label: 'Arts, Libraries & Community', emoji: '🎨', description: 'Arts centers, libraries, community centers, public art.' },
  { id: 'family', label: 'Zoos & Aquariums', emoji: '🦓', description: 'Live animal venues - zoos, aquariums, animal sanctuaries.' },
  { id: 'shopping', label: 'Shopping & Markets', emoji: '🛍️', description: 'Shopping malls, family marketplaces, kid-friendly retail districts.' },
]

// Synthetic Google-search category cards. When OSM returns 0
// activities (sparse OCONUS region, Overpass timeout, or genuinely
// empty 50-mile radius) the frontend would otherwise show an empty-
// state banner. We instead emit one search-portal card per category
// linking to a Google Maps search restricted to the user's market
// region. Maps works worldwide and the searches return real local
// businesses, so users always have an actionable starting point.
// Synthetic Google Maps search-portal cards for Schools. Always
// available; surfaced when OSM returns empty or times out.
function syntheticSchoolCards(city, state) {
  if (!city && !state) return []
  const ev = encodeURIComponent
  const where = [city, state].filter(Boolean).join(', ')
  const CARDS = [
    { categoryId: 'public_elementary',  type: 'Public elementary schools',  query: `public elementary schools near ${where}` },
    { categoryId: 'public_middle',      type: 'Public middle schools',      query: `public middle schools near ${where}` },
    { categoryId: 'public_high',        type: 'Public high schools',        query: `public high schools near ${where}` },
    { categoryId: 'private',            type: 'Private schools',            query: `private schools near ${where}` },
    { categoryId: 'charter',            type: 'Charter schools',            query: `charter schools near ${where}` },
    { categoryId: 'dodea',              type: 'DoDEA schools (overseas)',   query: `DoDEA schools near ${where}` },
    { categoryId: 'preschool',          type: 'Preschools & daycare',       query: `preschools and daycare near ${where}` },
  ]
  return CARDS.map((c, idx) => ({
    id: `school-search-${c.categoryId}-${idx}-${ev(where).slice(0,30)}`,
    categoryId: c.categoryId,
    type: c.type,
    name: `${c.type} near ${city || state}`,
    address: '',
    city: city || '',
    state: state || '',
    distanceMiles: null,
    description: `Curated Google Maps search for ${c.type.toLowerCase()} in the ${where} area. Opens with the locality pre-filtered so you see real schools with ratings, contact info, and zoning details — verify enrollment requirements directly with the district.`,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${ev(c.query)}`,
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${ev(c.query)}`,
    website: '',
    phone: '',
    source: 'Curated Google Maps search',
    synthetic: true,
  }))
}

// Synthetic Google Maps search-portal cards for Religious Services.
// Covers the major faiths/denominations users have asked about.
function syntheticReligiousCards(city, state) {
  if (!city && !state) return []
  const ev = encodeURIComponent
  const where = [city, state].filter(Boolean).join(', ')
  const CARDS = [
    { categoryId: 'catholic',      type: 'Catholic churches',       query: `Catholic churches near ${where}` },
    { categoryId: 'protestant',    type: 'Protestant churches',     query: `Protestant churches near ${where}` },
    { categoryId: 'baptist',       type: 'Baptist churches',        query: `Baptist churches near ${where}` },
    { categoryId: 'methodist',     type: 'Methodist churches',      query: `Methodist churches near ${where}` },
    { categoryId: 'lds',           type: 'LDS / Latter-day Saints', query: `LDS Latter-day Saints church near ${where}` },
    { categoryId: 'orthodox',      type: 'Orthodox churches',       query: `Orthodox Christian churches near ${where}` },
    { categoryId: 'jewish',        type: 'Synagogues',              query: `Synagogues near ${where}` },
    { categoryId: 'muslim',        type: 'Mosques',                 query: `Mosques near ${where}` },
    { categoryId: 'hindu',         type: 'Hindu temples',           query: `Hindu temples near ${where}` },
    { categoryId: 'buddhist',      type: 'Buddhist temples',        query: `Buddhist temples near ${where}` },
    { categoryId: 'chapel',        type: 'Installation chapels',    query: `military chapel near ${where}` },
  ]
  return CARDS.map((c, idx) => ({
    id: `religious-search-${c.categoryId}-${idx}-${ev(where).slice(0,30)}`,
    categoryId: c.categoryId,
    type: c.type,
    name: `${c.type} near ${city || state}`,
    address: '',
    city: city || '',
    state: state || '',
    denomination: c.categoryId,
    distanceMiles: null,
    description: `Curated Google Maps search for ${c.type.toLowerCase()} in the ${where} area. Opens with the locality pre-filtered so you see service times, denomination, contact info, and directions in one tap.`,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${ev(c.query)}`,
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${ev(c.query)}`,
    website: '',
    phone: '',
    source: 'Curated Google Maps search',
    synthetic: true,
  }))
}

function syntheticFamilyCards(city, state) {
  if (!city && !state) return []
  const ev = encodeURIComponent
  const where = [city, state].filter(Boolean).join(', ')
  // Each entry maps a Family Fun category to a Google Maps search
  // query that surfaces real, current listings in the user's market.
  // The text intentionally avoids fabricated specifics (hours, rating)
  // and instead frames the card as a curated search portal.
  const CARDS = [
    { categoryId: 'parks',     type: 'Parks & playgrounds search', query: `parks and playgrounds near ${where}` },
    { categoryId: 'amusement', type: 'Theme & water parks search', query: `amusement and water parks near ${where}` },
    { categoryId: 'movies',    type: 'Movie theaters search',      query: `movie theaters near ${where}` },
    { categoryId: 'museums',   type: 'Museums search',             query: `museums and historic sites near ${where}` },
    { categoryId: 'sports',    type: 'Sports & recreation search', query: `bowling, climbing, ice rinks, and pools near ${where}` },
    { categoryId: 'culture',   type: 'Arts & libraries search',    query: `libraries, art galleries, and community centers near ${where}` },
    { categoryId: 'family',    type: 'Zoos & aquariums search',    query: `zoos and aquariums near ${where}` },
    { categoryId: 'shopping',  type: 'Shopping & markets search',  query: `family-friendly shopping districts near ${where}` },
  ]
  return CARDS.map((c, idx) => ({
    id: `family-search-${c.categoryId}-${idx}-${ev(where).slice(0,30)}`,
    categoryId: c.categoryId,
    type: c.type,
    name: `${c.type} near ${city || state}`,
    address: '',
    city: city || '',
    state: state || '',
    distanceMiles: null,
    description: `Curated Google Maps search for ${c.categoryId === 'parks' ? 'family-friendly parks and playgrounds' : c.categoryId === 'amusement' ? 'theme parks and family entertainment venues' : c.categoryId === 'movies' ? 'cinemas, including chains and independent theaters' : c.categoryId === 'museums' ? 'museums, memorials, and historic sites' : c.categoryId === 'sports' ? 'active-play and indoor sports venues' : c.categoryId === 'culture' ? 'arts, library, and community spaces' : c.categoryId === 'family' ? 'zoos, aquariums, and animal experiences' : 'shopping districts and family markets'} near ${where}. Opens Google Maps with the area pre-filtered so you see real local venues, hours, ratings, and directions in one tap.`,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${ev(c.query)}`,
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${ev(c.query)}`,
    website: '',
    phone: '',
    source: 'Curated Google Maps search',
    synthetic: true,
  }))
}

// OSM tag mappings. Expanded with the categories the user requested.
const OSM_TAG_MAP = {
  // Parks & Outdoors
  'leisure=park': { categoryId: 'parks', type: 'Park' },
  'leisure=nature_reserve': { categoryId: 'parks', type: 'Nature reserve' },
  'leisure=playground': { categoryId: 'parks', type: 'Playground' },
  'leisure=garden': { categoryId: 'parks', type: 'Garden' },
  'leisure=dog_park': { categoryId: 'parks', type: 'Dog park' },
  'tourism=picnic_site': { categoryId: 'parks', type: 'Picnic site' },
  'tourism=viewpoint': { categoryId: 'parks', type: 'Viewpoint' },
  'boundary=national_park': { categoryId: 'parks', type: 'National park' },
  // Amusement & Theme Parks (incl. water parks + arcades)
  'tourism=theme_park': { categoryId: 'amusement', type: 'Theme park' },
  'leisure=water_park': { categoryId: 'amusement', type: 'Water park' },
  'tourism=amusement_arcade': { categoryId: 'amusement', type: 'Arcade' },
  'leisure=amusement_arcade': { categoryId: 'amusement', type: 'Arcade' },
  // Movie Theaters
  'amenity=cinema': { categoryId: 'movies', type: 'Cinema' },
  // Museums
  'tourism=museum': { categoryId: 'museums', type: 'Museum' },
  'historic=monument': { categoryId: 'museums', type: 'Monument' },
  'historic=memorial': { categoryId: 'museums', type: 'Memorial' },
  // Active Play & Sports - expanded per user direction
  'leisure=swimming_pool': { categoryId: 'sports', type: 'Swimming pool' },
  'leisure=ice_rink': { categoryId: 'sports', type: 'Ice rink' },
  'amenity=ice_rink': { categoryId: 'sports', type: 'Ice rink' },
  'leisure=bowling_alley': { categoryId: 'sports', type: 'Bowling alley' },
  'leisure=miniature_golf': { categoryId: 'sports', type: 'Mini-golf' },
  'sport=climbing': { categoryId: 'sports', type: 'Climbing gym' },
  // Paintball + airsoft (OSM tags `sport=paintball` / `sport=airsoft`
  // appear on leisure=pitch, leisure=sports_centre, or as
  // dedicated nodes)
  'sport=paintball': { categoryId: 'sports', type: 'Paintball' },
  'sport=airsoft': { categoryId: 'sports', type: 'Airsoft' },
  'sport=laser_tag': { categoryId: 'sports', type: 'Laser tag' },
  // Race tracks (motorsport / karting)
  'leisure=motorsport': { categoryId: 'sports', type: 'Motorsport track' },
  'leisure=kart_track': { categoryId: 'sports', type: 'Kart track' },
  'landuse=raceway': { categoryId: 'sports', type: 'Raceway' },
  'sport=motor': { categoryId: 'sports', type: 'Motorsport' },
  'sport=karting': { categoryId: 'sports', type: 'Karting' },
  // Generic trampoline parks + escape rooms tag on amenity / leisure
  'leisure=trampoline_park': { categoryId: 'sports', type: 'Trampoline park' },
  'leisure=escape_game': { categoryId: 'sports', type: 'Escape room' },
  // Arts, Libraries & Community
  'amenity=arts_centre': { categoryId: 'culture', type: 'Arts center' },
  'amenity=library': { categoryId: 'culture', type: 'Library' },
  'tourism=artwork': { categoryId: 'culture', type: 'Public art' },
  'amenity=community_centre': { categoryId: 'culture', type: 'Community center' },
  // Zoos & Aquariums
  'tourism=zoo': { categoryId: 'family', type: 'Zoo' },
  'tourism=aquarium': { categoryId: 'family', type: 'Aquarium' },
  // Shopping & Markets (restored per user direction)
  'shop=mall': { categoryId: 'shopping', type: 'Shopping mall' },
  'amenity=marketplace': { categoryId: 'shopping', type: 'Marketplace' },
  // Historic family attractions (free castles, forts, archaeological
  // sites - great family education stops)
  'historic=castle': { categoryId: 'museums', type: 'Castle' },
  'historic=fort': { categoryId: 'museums', type: 'Historic fort' },
  'historic=archaeological_site': { categoryId: 'museums', type: 'Archaeological site' },
  'historic=ruins': { categoryId: 'museums', type: 'Historic ruins' },
  // Outdoor recreation expanded
  'leisure=horse_riding': { categoryId: 'sports', type: 'Horse riding' },
  'leisure=disc_golf_course': { categoryId: 'sports', type: 'Disc golf' },
  'leisure=skatepark': { categoryId: 'sports', type: 'Skate park' },
  'leisure=fitness_station': { categoryId: 'sports', type: 'Outdoor fitness' },
  'leisure=fishing': { categoryId: 'parks', type: 'Fishing area' },
  'leisure=swimming_area': { categoryId: 'parks', type: 'Swimming area' },
  // Farms / petting zoos (popular family destinations)
  'tourism=farm': { categoryId: 'family', type: 'Farm visit' },
  'tourism=wine_cellar': { categoryId: 'family', type: 'Vineyard' },
}

const FAMILY_CACHE = new Map()
const FAMILY_TTL_MS = 24 * 60 * 60 * 1000
const FAMILY_RATE_LIMIT = 20
const FAMILY_RATE_WINDOW_MS = 60_000
const _familyHits = new Map()
registerRateLimitMap(_familyHits, 60_000)
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

// OSM is community-edited. A small fraction of POIs are tagged with
// placeholder names like "c", "B", "1", or just the type word
// (e.g., name="Park" on a leisure=park node). These produce visually
// junk cards. Reject anything that does not look like a real name.
// Pick the OSM name tag that best matches the user's preferred
// language. OSM's `name` tag holds the canonical (usually LOCAL-
// language) name - so a museum in Vicenza, Italy will be tagged
// `name=Museo Civico` in Italian. Users PCSing to that area with a
// preferred language of Spanish/English/Korean/etc. should NOT see
// the local-language name. OSM publishes language-specific variants
// as `name:en`, `name:es`, `name:de`, etc. Coverage is best for
// English; Spanish / German / French / Korean / Japanese / Chinese
// / Italian / Portuguese / Arabic / Vietnamese vary by region.
// Fallback order: name:{userLang} -> name:en -> name -> ''.
function pickOsmName(tags, userLang) {
  if (!tags) return ''
  const lang = String(userLang || 'en').toLowerCase()
  if (lang && tags[`name:${lang}`]) return tags[`name:${lang}`]
  if (tags['name:en']) return tags['name:en']
  return tags.name || ''
}

function isUsableOsmName(name, type) {
  if (!name) return false
  const trimmed = String(name).trim()
  if (trimmed.length < 3) return false
  // All digits or symbols, no letters.
  if (!/[a-z]/i.test(trimmed)) return false
  // Just the generic type word (e.g., "Park" / "School" / "Museum").
  const t = String(type || '').toLowerCase().trim()
  if (t && trimmed.toLowerCase() === t) return false
  return true
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180
  const R = 3958.8 // earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 10) / 10
}

async function geocodeNominatimOnce(query) {
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

// Geocode-cascade. Nominatim is finicky about non-U.S. address formats:
// "Pyeongtaek, South Korea, 17977" returns [], "Pyeongtaek, South Korea"
// returns a valid hit. So we try the most-specific query first, then
// progressively strip components until something matches or we run
// out of variants. The function accepts either a single string query
// (existing callers) or a structured { address, city, state, zip }
// payload (preferred — produces the best OCONUS coverage).
async function geocodeNominatim(input) {
  // Backwards-compatible single-string path.
  if (typeof input === 'string') {
    if (!input) return null
    const single = await geocodeNominatimOnce(input)
    if (single) return single
    // Also try without trailing comma+token if the caller jammed a zip
    // onto the end (matches the legacy "city, state, zip" pattern).
    const parts = input.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length >= 3) {
      return geocodeNominatimOnce(parts.slice(0, -1).join(', '))
    }
    return null
  }
  // Structured path — try variants in order of specificity.
  const { address, city, state, zip } = input || {}
  // Defensive guard: military mail routing codes (AE, AP, AA) and
  // "APO" / "FPO" placeholder cities are NOT geocodable. Treat them
  // as if no state/city was supplied; the caller will see null and
  // surface the unknown-installation message rather than resolving
  // to a random foreign city.
  const stateUp = String(state || '').trim().toUpperCase()
  const cityUp = String(city || '').trim().toUpperCase()
  const isMilitaryMailState = stateUp === 'AE' || stateUp === 'AP' || stateUp === 'AA'
  const isMilitaryMailCity = cityUp === 'APO' || cityUp === 'FPO' || cityUp === 'DPO'
  const safeState = isMilitaryMailState ? '' : state
  const safeCity = isMilitaryMailCity ? '' : city
  const variants = []
  if (address) variants.push(address)
  if (safeCity && safeState && zip) variants.push(`${safeCity}, ${safeState}, ${zip}`)
  if (safeCity && safeState) variants.push(`${safeCity}, ${safeState}`)
  if (zip && safeState) variants.push(`${zip}, ${safeState}`)
  // Bare zip-only lookups are skipped when state is missing — too many
  // zips collide across countries (e.g., "36100" matches both Vicenza
  // Italy and an Algerian village). Require some country context.
  if (safeCity) variants.push(safeCity)
  // Dedupe while preserving order.
  const seen = new Set()
  for (const v of variants) {
    if (!v || seen.has(v)) continue
    seen.add(v)
    try {
      const hit = await geocodeNominatimOnce(v)
      if (hit) return hit
    } catch (err) {
      // One variant fails — keep trying the next. Only surface the
      // error if every variant fails (caller will throw separately).
      console.error(`[geocode] variant "${v}" failed: ${err.message}`)
    }
  }
  return null
}

// Public Overpass API mirrors. Order matters for the sequential
// fallback path - the first to respond wins. We rotate by minute so
// no single mirror takes the entire datacenter's traffic at startup,
// and so kumi (which has been flaky) does not blanket-fail every
// query if it is the static first choice.
// Overpass mirrors. Ordered by recent observed reliability (live
// diagnostic on 2026-05-15: private.coffee 200/8s, overpass-api.de
// returns 406 for most requests, kumi.systems regularly hangs).
// private.coffee leads; kumi remains last because it hangs without
// responding which costs us the full per-mirror budget.
const OVERPASS_MIRRORS_POOL = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
function overpassMirrors() {
  // Rotate the FIRST two by minute so private.coffee and overpass-api.de
  // share leader duty; kumi stays last because it eats budget when down.
  const offset = Math.floor(Date.now() / 60_000) % 2
  const leaders = offset === 0
    ? [OVERPASS_MIRRORS_POOL[0], OVERPASS_MIRRORS_POOL[1]]
    : [OVERPASS_MIRRORS_POOL[1], OVERPASS_MIRRORS_POOL[0]]
  return [...leaders, OVERPASS_MIRRORS_POOL[2]]
}

// Per-mirror abort: 9s. With 3 mirrors that gives ~27s worst case,
// which fits inside the 22s family-activities budget for at least 2
// mirror attempts. The in-query Overpass `timeout:` setting also caps
// at 8s for the family/schools/religious endpoints.
const OVERPASS_FETCH_TIMEOUT_MS = 9_000

// Mirrors with persistent 4xx in the last 60s are temporarily skipped.
// Keeps overpass-api.de's "406 Not Acceptable" responses from costing
// us a fetch round-trip every request.
const _mirrorBlocklist = new Map() // url -> { reason, until: epochMs }
function shouldSkipMirror(url) {
  const entry = _mirrorBlocklist.get(url)
  if (!entry) return false
  if (Date.now() >= entry.until) { _mirrorBlocklist.delete(url); return false }
  return true
}
function blockMirror(url, reason, durationMs = 60_000) {
  _mirrorBlocklist.set(url, { reason, until: Date.now() + durationMs })
}

async function overpassQuery(query) {
  let lastErr = null
  for (const url of overpassMirrors()) {
    if (shouldSkipMirror(url)) {
      console.error(`[overpass] skipping blocked mirror ${url}`)
      continue
    }
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
        // Block 4xx mirrors for 60s — they will keep returning the
        // same error and waste budget. Retry on transient 5xx / 429
        // by trying the next mirror.
        if (r.status >= 400 && r.status < 500) {
          blockMirror(url, `${r.status}`, 60_000)
          console.error(`[overpass] ${url} ${r.status} — blocking for 60s`)
          continue
        }
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
      // Timeouts are NOT blocklisted — a slow mirror right now may be
      // fast on the next request, and blocking it would mean every
      // subsequent parallel batch in the same endpoint call returns
      // empty without attempting any mirror. Only durable 4xx errors
      // (handled above) get the blocklist treatment.
      continue
    }
  }
  throw lastErr || new Error('overpass all mirrors failed')
}

async function overpassFetch(lat, lng, radiusMeters) {
  // OSM tag filters batched into independent queries that run in
  // parallel. Splitting work this way means a single slow mirror does
  // not serialize three queries on top of each other. Each batch has
  // its own mirror cascade via overpassQuery; partial batch failures
  // are tolerated as long as at least one batch returns elements.
  //
  // Note: the OSM tile usage policy asks for "polite" usage but their
  // Overpass-specific policy explicitly permits concurrent requests
  // from a server-side aggregator with proper User-Agent. We rate-
  // limit per client IP upstream so total throughput stays modest.
  const allTags = Object.keys(OSM_TAG_MAP)
  const BATCH_SIZE = 9
  const batches = []
  for (let i = 0; i < allTags.length; i += BATCH_SIZE) batches.push(allTags.slice(i, i + BATCH_SIZE))

  const batchPromises = batches.map(async (batch) => {
    try {
      const filters = batch.map(tag => {
        const [k, v] = tag.split('=')
        return `node["${k}"="${v}"](around:${radiusMeters},${lat},${lng});way["${k}"="${v}"](around:${radiusMeters},${lat},${lng});`
      }).join('')
      const query = `[out:json][timeout:8];(${filters});out center tags;`
      const data = await overpassQuery(query)
      return Array.isArray(data?.elements) ? data.elements : []
    } catch (err) {
      console.error(`[overpass-family] batch failed: ${err.message}`)
      return []
    }
  })
  const results = await Promise.all(batchPromises)
  const merged = results.flat()
  return { elements: merged }
}

function shapeOsmElement(el, originLat, originLng, userLang) {
  const tags = el.tags || {}
  let matchTag = null
  for (const tag of Object.keys(OSM_TAG_MAP)) {
    const [k, v] = tag.split('=')
    if (tags[k] === v) { matchTag = tag; break }
  }
  if (!matchTag) return null
  const meta = OSM_TAG_MAP[matchTag]
  const rawName = pickOsmName(tags, userLang) || ''
  if (!isUsableOsmName(rawName, meta.type)) return null
  const name = rawName
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
  const userLang = String(req.query.lang || 'en').toLowerCase().replace(/[^a-z]/g, '').slice(0, 5) || 'en'

  // Build the geocode query - prefer the user-supplied address, fall
  // back to the installation market.
  const geocodeQuery = address || [city, state, zip].filter(Boolean).join(', ')
  if (!geocodeQuery) {
    return res.status(400).json({ error: 'address, city, or zip is required', categories: FAMILY_CATEGORIES, activities: [], fallback: true })
  }

  const cacheKey = `${geocodeQuery}|${radiusMiles}|${userLang}`
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

  // Geocoding is now best-effort. Google Maps category cards are
  // built from city/state strings — they don't need lat/lng — so a
  // Nominatim failure or 'not found' on OCONUS markets (where
  // Nominatim has spotty coverage outside the U.S.) MUST NOT block
  // the response. We still try to attach origin lat/lng so the front
  // end can show the right map marker, but an empty/null origin is
  // perfectly acceptable.
  let origin = null
  try {
    origin = await geocodeNominatim({ address, city, state, zip })
  } catch (err) {
    console.error(`[family-activities] geocode ${err.message}`)
    // fall through — synthetic cards still work without origin
  }

  // Google Maps search-portal cards are the canonical Family Fun
  // data source. Each card deep-links to a Google Maps search for
  // the category restricted to the installation's locality, so users
  // see real venues with ratings/hours/directions in one tap.
  const cards = syntheticFamilyCards(city, state)

  if (cards.length === 0) {
    return res.status(200).json({
      categories: FAMILY_CATEGORIES,
      activities: [],
      origin,
      fallback: true,
      reason: 'no-locality',
      source: 'google-maps-search',
    })
  }

  FAMILY_CACHE.set(cacheKey, { activities: cards, origin, fetchedAt: Date.now() })

  res.status(200).json({
    categories: FAMILY_CATEGORIES,
    activities: cards,
    origin,
    radiusMiles,
    source: 'google-maps-search',
    fetchedAt: Date.now(),
  })
})

// === JTR REGULATORY ASSISTANT (FREE-TEXT GATEWAY) ===
// The curated Q&A KB lives on the frontend in JTRAssistantModule and
// covers the great majority of common JTR/FTR/DSSR questions. This
// optional endpoint exists so an operator can later wire in a vetted
// LLM gateway (Anthropic / OpenAI / a private deployment) for the
// rare free-text fallback. When no JTR_ASSISTANT_PROVIDER env var is
// set we explicitly return 501 so the frontend shows the "not
// configured" fallback message and steers the user to the gaining
// finance office instead. This deployment never proxies queries to an
// AI provider that isn't intentionally configured.
const _jtrHits = new Map()
registerRateLimitMap(_jtrHits, 60_000)
function jtrAssistantRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const entry = _jtrHits.get(ip)
  if (!entry || now - entry.start > 60_000) {
    _jtrHits.set(ip, { start: now, count: 1 })
    return next()
  }
  if (entry.count >= 10) return res.status(429).json({ error: 'rate-limited' })
  entry.count += 1
  next()
}
// System prompt for the AI Assistant. Establishes scope, citation
// expectations, OPSEC refusal posture, and the in-app navigation
// vocabulary so the model can answer "where do I find X?" questions
// using the PCS Express category names.
const AI_ASSISTANT_SYSTEM_PROMPT = `You are the PCS Express AI Assistant. You answer questions for
U.S. service members, Reserve / Guard members, and DoD civilians
moving through a Permanent Change of Station (PCS). You also know
PCS Express's own information architecture and can point users to
the right tab.

Scope you answer:
- Joint Travel Regulations (JTR), Federal Travel Regulation (FTR),
  Department of State Standardized Regulations (DSSR).
- IRS guidance relevant to military / civilian PCS (CZTE under
  IRC §112, Form 2555 FEIE for OCONUS civilians, IRS Pub 3).
- TRICARE / TRICARE Overseas Program (TOP) basics.
- PCS Express app navigation. Mission groups are: Command Center
  (home dashboard), PCS Operations (Checklist · Paperwork · Timeline),
  Movement & Logistics (Home Locator · BAH/OHA/LQA · PPM Estimator ·
  Budget · Shipment Tracker · Inventory & Claims · JTR Assistant ·
  Move Aid · VA Loan), Family Readiness (Family · Education ·
  Translation · Faith & Chaplains), Holistic Health (Medical Care ·
  Behavioral Health · Spiritual Care · Fitness), and Mission Resources
  (Base Insights · Maps · Help Hub · Veteran Support). Compliance
  opens from the 🔒 button at the bottom of Command Center.

Rules:
1. Cite a JTR/FTR/DSSR/IRS section for every regulation answer.
   Cite the in-app surface (e.g., "Movement & Logistics → Shipment
   Tracker") for every app-navigation answer.
2. Refuse anything outside scope (politics, medical advice,
   classified topics, current-news questions, anything not PCS-
   or travel-regulation-adjacent). Suggest the appropriate official
   resource instead.
3. Treat the conversation as UNCLASSIFIED. If the user pastes what
   looks like CUI, FOUO, GBL numbers, exact unit IDs, or specific
   operational dates, refuse to use it in the answer and remind
   them this channel is unclassified.
4. Never ask for or store personal information.
5. When you give dollar figures, weights, or day counts that come
   from a regulation, note that DTMO/GSA publish the current rates
   and the user should verify the live number on the official site.
6. Be concise. Two-to-six sentences for most answers. Bullet lists
   when there's a sequence of steps.
7. Action suggestions (optional). When opening a specific PCS Express
   tab or asking an obvious follow-up would meaningfully help, append
   AT MOST 3 action markers on their own lines at the END of your
   answer. Format exactly:
     [action: open_tab <tab_id>]
     [action: ask_followup <short question text>]
   Valid tab_ids: home, pcs-operations, home-relocation, family-readiness,
   medical-readiness, mission-resources, checklist, documents, education,
   translation, religion, base-intelligence, nav, resources, jtr-assistant,
   bah-calculator, ppm-estimator, budget-tracker, shipment-tracker,
   inventory-claims, home-locator.
   The client strips these markers from the visible text and renders
   tap-to-execute buttons. Only include them when truly useful.`;

app.post('/api/jtr-assistant', jtrAssistantRateLimit, async (req, res) => {
  // Auto-detect provider. If ANTHROPIC_API_KEY is set we use
  // Anthropic; if OPENAI_API_KEY is set we use OpenAI. An explicit
  // JTR_ASSISTANT_PROVIDER env var takes precedence so operators
  // can force a specific provider during testing.
  const explicit = String(process.env.JTR_ASSISTANT_PROVIDER || '').trim().toLowerCase()
  const provider = explicit
    || (process.env.ANTHROPIC_API_KEY ? 'anthropic' : '')
    || (process.env.OPENAI_API_KEY ? 'openai' : '')
  // sanitizeForPrompt is imported from ./lib/security.js — strips
  // ASCII control chars + collapses whitespace + length-caps so a
  // smuggled newline + "Ignore previous instructions" can't escape
  // the surrounding template into a new directive to the LLM.
  const q = sanitizeForPrompt(req.body?.q, 1000)
  const rawHistory = Array.isArray(req.body?.history) ? req.body.history : []
  const language = String(req.body?.language || 'en').trim().slice(0, 8).toLowerCase().replace(/[^a-z-]/g, '')
  const wantStream = !!req.body?.stream
  // Compact user-context blob from the client. Already filtered down
  // to non-PII attributes (branch, rank, component, phase, day count,
  // open-task count, top task labels). Sanitized identically to `q`
  // so a malicious userContext can't inject a new system instruction.
  const userContext = sanitizeForPrompt(req.body?.userContext, 1000)
  if (!q) return res.status(400).json({ error: 'q is required' })

  if (!provider) {
    return res.status(501).json({
      error: 'not-configured',
      answer: 'The live AI Assistant is not configured on this deployment yet. The PCS Express app falls back to a curated JTR/FTR/DSSR knowledge base — your question may still get a citation-backed answer there. For anything outside that scope, escalate to your gaining installation Finance Office or open the JTR Assistant tab inside Movement & Logistics.',
      source: 'not-configured',
    })
  }

  // ANTHROPIC branch — claude-haiku is the default model; operators
  // can override via ANTHROPIC_MODEL. History is capped at the last
  // 10 turns, with content trimmed to 1500 chars per message so we
  // stay inside reasonable token budgets.
  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(501).json({
        error: 'anthropic-no-key',
        answer: 'JTR_ASSISTANT_PROVIDER is set to anthropic but ANTHROPIC_API_KEY is missing on this deployment.',
        source: 'anthropic-no-key',
      })
    }
    const messages = rawHistory
      .slice(-10)
      .map(m => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        // Sanitize history content the same way as `q` — strips
        // control chars and collapses whitespace so a smuggled
        // newline + "new instruction" pattern in an old message
        // can't escape its role envelope on resubmission.
        content: sanitizeForPrompt(m?.text, 1500),
      }))
      .filter(m => m.content.length > 0)
    // Append the current question if it isn't already the last user
    // message in the trimmed history.
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== q) {
      messages.push({ role: 'user', content: q })
    }
    try {
      // Per-request system prompt — base + user language. Anthropic
      // already detects the language naturally, but pinning it
      // explicitly keeps replies consistent for users who type a
      // mixed-language question.
      const langLine = language && language !== 'en'
        ? `\n\nThe user's preferred app language is ${language}. Respond in that language unless the user explicitly asks for another.`
        : '';
      const ctxLine = userContext
        ? `\n\nThe user's current PCS context (non-PII, drawn from their on-device profile): ${userContext}. Use this to tailor answers ("you have N open tasks in the X phase") and cite the relevant tab in PCS Express when appropriate.`
        : '';
      const anthropicBody = {
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: AI_ASSISTANT_SYSTEM_PROMPT + langLine + ctxLine,
        messages,
        ...(wantStream ? { stream: true } : {}),
      };
      // Streaming branch — proxy Anthropic's SSE to the client. The
      // client can read chunks via fetch + ReadableStream and append
      // deltas to the active message for a typing-feel response.
      if (wantStream) {
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'accept': 'text/event-stream',
          },
          body: JSON.stringify(anthropicBody),
          signal: AbortSignal.timeout(30_000),
        });
        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => '');
          console.error(`[jtr-assistant] anthropic stream ${upstream.status} ${detail.slice(0, 200)}`);
          return res.status(502).json({ error: 'upstream', source: 'anthropic' });
        }
        res.status(200);
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Source', `anthropic / ${process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'}`);
        // Pipe the upstream SSE bytes through verbatim. The Anthropic
        // stream is already a well-formed SSE protocol; the client
        // parses `data: {...}` events directly.
        try {
          for await (const chunk of upstream.body) {
            res.write(chunk);
          }
        } catch (err) {
          console.error(`[jtr-assistant] anthropic stream pipe ${err.message}`);
        }
        return res.end();
      }
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(anthropicBody),
        signal: AbortSignal.timeout(20_000),
      })
      if (!r.ok) {
        const detail = await r.text().catch(() => '')
        console.error(`[jtr-assistant] anthropic ${r.status} ${detail.slice(0, 200)}`)
        return res.status(502).json({ error: 'upstream', source: 'anthropic' })
      }
      const data = await r.json()
      const answer = (Array.isArray(data?.content) ? data.content : [])
        .map(c => c?.text || '')
        .join('')
        .trim()
      return res.status(200).json({
        answer: answer || 'No answer returned.',
        source: `anthropic / ${process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'}`,
      })
    } catch (err) {
      if (err?.name === 'AbortError') {
        return res.status(504).json({ error: 'timeout', source: 'anthropic' })
      }
      console.error(`[jtr-assistant] anthropic ${err.message}`)
      return res.status(502).json({ error: 'upstream', source: 'anthropic' })
    }
  }

  // OPENAI branch — left as a ready-to-flip stub. Operators can wire
  // a similar /chat/completions call when needed.
  if (provider === 'openai') {
    return res.status(501).json({
      error: 'openai-not-wired',
      answer: 'OPENAI provider is recognized but the upstream call has not been wired in. See server/index.js or set JTR_ASSISTANT_PROVIDER=anthropic.',
      source: 'openai',
    })
  }

  return res.status(501).json({
    error: 'provider-unknown',
    answer: `Unknown JTR_ASSISTANT_PROVIDER=${provider}. Supported: anthropic, openai.`,
    source: provider,
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
