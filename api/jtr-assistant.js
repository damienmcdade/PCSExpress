/*
 * Vercel serverless function: /api/jtr-assistant
 *
 * Mirrors the same endpoint in server/index.js, but runs directly on
 * Vercel so the live AI Assistant keeps working even during a Railway
 * outage. This Vercel function is the PRIMARY handler for
 * /api/jtr-assistant: Vercel's filesystem-routing precedence means it
 * serves the request, AND vercel.json now explicitly excludes
 * `jtr-assistant` from the Railway proxy rewrite (negative lookahead)
 * so the routing is unambiguous and robust rather than relying on
 * precedence alone. The identical endpoint still exists on Railway
 * (reached by native / direct API callers and as a fallback); the two
 * do not conflict.
 *
 * Non-streaming on purpose: keeps the function simple, sidesteps any
 * Vercel runtime / Anthropic SSE pass-through gotchas, and the client
 * (AIAssistantChip.jsx) already has a working non-streaming response
 * path. The user-visible difference is no per-token typing animation
 * on Vercel; the answer arrives in a single chunk once Anthropic
 * finishes generating.
 *
 * Required env var on Vercel for live AI:
 *   ANTHROPIC_API_KEY
 *
 * Without it, returns HTTP 501. The client falls back to the curated
 * KB / context-aware answer path that's already shipped.
 *
 * Optional env vars:
 *   ANTHROPIC_MODEL — override default model
 *
 * Security parity with server/index.js:
 *   - Origin gate: rejects requests whose Origin isn't an allowed web /
 *     native origin (and no-Origin requests that can't prove same-origin
 *     via Referer), so this can't be driven as an open billing endpoint.
 *   - Rate limit: best-effort 10 req/min/IP in-memory (per warm instance;
 *     see note at the limiter — durable limiting needs Vercel KV/Upstash).
 *   - q, userContext, and every history message are sanitized via
 *     sanitizeForPrompt() to strip ASCII control chars and collapse
 *     whitespace before being inlined into the system prompt.
 *   - Hard length caps on q (1000), userContext (1000), each
 *     history message (1500), language (8 chars, [a-z-] only).
 *   - 30-second timeout on the upstream Anthropic call via
 *     AbortSignal.timeout.
 *   - No request body is logged. The function is stateless — Vercel
 *     does not persist q, history, or userContext.
 */

// Match the curated system prompt language used by server/index.js.
// Kept verbatim so the assistant behaves identically across whichever
// surface (Railway / Vercel) ends up handling the request.
const AI_ASSISTANT_SYSTEM_PROMPT = `You are the PCS Express AI Assistant. You help U.S. service members, civilians, and their families navigate Permanent Change of Station moves.

Knowledge sources you can cite:
  - JTR (Joint Travel Regulations) for military per-diem, weight allowances, POV shipment, TLE, DLA, MALT, claims windows.
  - FTR (Federal Travel Regulations) for DoD civilians (HHT, real estate reimbursement, weight allowances).
  - DSSR (Department of State Standardized Regulations) for OCONUS allowances (LQA §130, TQSA §240, post allowance, MIHA).
  - IRC §112 (Combat Zone Tax Exclusion), IRS Pub 3, IRS Form 2555 (FEIE for OCONUS civilians).
  - Official .mil / .gov resources: travel.dod.mil, va.gov, militaryonesource.mil, dps.move.mil, milconnect.dmdc.osd.mil, dodea.edu, dodtap.mil, usajobs.gov, tricare.mil.

PCS Express navigation vocabulary (cite these when relevant):
  - Command Center: home dashboard with Mission Lanes (Today / This Week / Before You Report).
  - PCS Operations: phased Checklist, Paperwork binder, Dynamic Timeline.
  - Movement & Logistics: BAH/OHA Calculator, PPM Estimator, Budget Tracker, Shipment Tracker, Inventory & Claims, JTR Assistant tab, Move Aid, VA Loan, Home Locator.
  - Family Readiness: Family, Education, Translation, Faith & Chaplains, Spouse Deployment Guide, Pet Relocation, EFMP.
  - Holistic Health: Medical Care, Behavioral Health, Spiritual Care, Fitness.
  - Mission Resources: Base Insights, Maps, Help Hub (Healthcare/Family/Financial/PCS/Education/Careers/Portals), Veteran Support.

Rules:
  - Cite the official regulation OR the in-app surface (e.g., "Movement & Logistics → Shipment Tracker").
  - For safety / crisis questions, lead with: Military Crisis Line 988 then 1, or Military OneSource 1-800-342-9647.
  - Do NOT invent dollar amounts, day counts, or weight figures. Direct the user to the live source if you don't have it verified.
  - Be concise. PCS members are busy. Aim for under 200 words unless the question explicitly asks for detail.
  - If the user's PCS context is provided, cite specifics ("you have N open tasks in the X phase").

Action suggestions (optional). When your answer would meaningfully benefit from the user opening a specific PCS Express tab or asking an obvious follow-up, append AT MOST 3 action markers on their own lines AT THE END of your answer. Format exactly:
  [action: open_tab <tab_id>]
  [action: ask_followup <short question text>]

Valid tab_ids: home, pcs-operations, home-relocation, family-readiness, medical-readiness, mission-resources, checklist, documents, education, translation, religion, base-intelligence, nav, resources, jtr-assistant, bah-calculator, ppm-estimator, budget-tracker, shipment-tracker, inventory-claims, home-locator.

Examples:
  Answer body ending here.
  [action: open_tab bah-calculator]
  [action: ask_followup How is OHA different from BAH?]

The client strips these markers from the visible text and renders tap-to-execute buttons. Only include them when truly useful — at most 3, never as a substitute for a real answer.`;

const sanitizeForPrompt = (s, maxLen) => String(s || '')
  .replace(/[\x00-\x1F\x7F]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLen);

// 64 KB matches the Express per-endpoint cap on /api/jtr-assistant so
// both surfaces enforce the same ceiling. The Vercel platform default
// is far more generous (multi-MB), which is enough payload room to
// burn parsing CPU even though q / userContext / history are
// re-trimmed downstream — defense-in-depth.
const MAX_BODY_BYTES = 64 * 1024;

// Origin gate — parity with server/index.js. Without this the function is
// an unauthenticated Anthropic-billing endpoint (a bare `curl -X POST`
// reaches Anthropic on our key). Web app calls carry Origin/Referer for
// pcsexpress.app; native shells hit Railway directly, not this function.
const ALWAYS_ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://localhost:3001',
]);
const DEFAULT_WEB_ORIGINS = new Set([
  'https://pcsexpress.app',
  'https://www.pcsexpress.app',
]);
const EXTRA_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
function isOriginAllowed(origin) {
  return ALWAYS_ALLOWED_ORIGINS.has(origin) || DEFAULT_WEB_ORIGINS.has(origin) || EXTRA_ORIGINS.includes(origin);
}
function isSameOriginByReferer(req) {
  const ref = req.headers?.referer || req.headers?.referrer;
  if (!ref) return false;
  try { return isOriginAllowed(new URL(ref).origin); } catch { return false; }
}
function passesOriginGate(req) {
  const origin = req.headers?.origin;
  if (origin) return isOriginAllowed(origin);
  // No Origin header (some same-origin POSTs / older browsers): accept only
  // when the Referer proves same-origin. A bare request with neither is
  // rejected — that's the abuse path.
  return isSameOriginByReferer(req);
}

// Best-effort in-memory rate limit (10 req/min/IP), mirroring the Express
// limiter. NOTE: Vercel Fluid Compute reuses instances but does not share
// memory across them, so this throttles a single warm instance, not the
// whole fleet — durable limiting needs Vercel KV / Upstash. It still blunts
// the common single-source flood. Map is pruned opportunistically.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const _hits = new Map(); // ip -> { windowStart, count }
function clientIp(req) {
  // Prefer headers the Vercel edge SETS and the client cannot overwrite.
  // `x-vercel-forwarded-for` / `x-real-ip` are platform-controlled, whereas
  // a raw client-supplied `x-forwarded-for` can be rotated per request to
  // dodge the per-IP limiter — so it's the last resort, not the first.
  const h = req.headers || {};
  const vercel = h['x-vercel-forwarded-for'];
  if (typeof vercel === 'string' && vercel) return vercel.split(',')[0].trim();
  if (h['x-real-ip']) return String(h['x-real-ip']);
  const xff = h['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return 'unknown';
}
function rateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  if (_hits.size > 5000) { // opportunistic prune so the Map can't grow unbounded
    for (const [k, v] of _hits) { if (now - v.windowStart > RATE_WINDOW_MS) _hits.delete(k); }
  }
  const entry = _hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    _hits.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  if (!passesOriginGate(req)) {
    return res.status(403).json({ error: 'origin-not-allowed' });
  }

  if (rateLimited(req)) {
    return res.status(429).json({ error: 'rate-limited' });
  }

  // Reject oversized payloads before doing any work. Content-Length is
  // advisory but Vercel sets it on parsed JSON bodies; if a client
  // strips it we still cap on the post-parse JSON-stringify size below.
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'payload-too-large' });
  }
  if (req.body && typeof req.body === 'object') {
    let bodyBytes = 0;
    try { bodyBytes = JSON.stringify(req.body).length; } catch { bodyBytes = 0; }
    if (bodyBytes > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'payload-too-large' });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error: 'not-configured',
      answer: 'The live AI Assistant is not configured on this deployment yet. The PCS Express app falls back to a curated JTR/FTR/DSSR knowledge base — your question may still get a citation-backed answer there. For anything outside that scope, escalate to your gaining installation Finance Office or open the JTR Assistant tab inside Movement & Logistics.',
      source: 'not-configured',
    });
  }

  // Vercel parses req.body automatically when Content-Type is JSON
  // and the function isn't configured with rawBody. Guard anyway in
  // case a client posts with the wrong content type.
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const q = sanitizeForPrompt(body.q, 1000);
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const language = String(body.language || 'en').trim().slice(0, 8).toLowerCase().replace(/[^a-z-]/g, '');
  const userContext = sanitizeForPrompt(body.userContext, 1000);
  if (!q) return res.status(400).json({ error: 'q is required' });

  const messages = rawHistory
    .slice(-10)
    .map(m => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeForPrompt(m?.text, 1500),
    }))
    .filter(m => m.content.length > 0);
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== q) {
    messages.push({ role: 'user', content: q });
  }

  const langLine = language && language !== 'en'
    ? `\n\nThe user's preferred app language is ${language}. Respond in that language unless the user explicitly asks for another.`
    : '';
  const ctxLine = userContext
    ? `\n\nThe user's current PCS context (non-PII, drawn from their on-device profile): ${userContext}. Use this to tailor answers ("you have N open tasks in the X phase") and cite the relevant tab in PCS Express when appropriate.`
    : '';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: AI_ASSISTANT_SYSTEM_PROMPT + langLine + ctxLine,
        messages,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      // Truncate + redact upstream body before logging so platform logs
      // don't leak provider-internal error keys / hint text. 50 chars
      // is enough to spot patterns without becoming a soft exfil channel.
      const safeDetail = String(detail || '')
        .replace(/[\x00-\x1F\x7F]+/g, ' ')
        .replace(/"(message|hint|error_type|type|param)"\s*:\s*"[^"]*"/gi, '"$1":"<redacted>"')
        .slice(0, 50);
      console.error(`[jtr-assistant] anthropic ${upstream.status} ${safeDetail}`);
      return res.status(502).json({
        error: 'upstream-error',
        answer: `The live AI provider returned an error (HTTP ${upstream.status}). Try the JTR Assistant tab inside Movement & Logistics for a curated answer, or check Mission Resources → Help Hub for the official source.`,
        source: 'upstream-error',
      });
    }

    const data = await upstream.json();
    const text = (Array.isArray(data?.content) ? data.content : [])
      .filter(b => b?.type === 'text')
      .map(b => String(b.text || ''))
      .join('')
      .trim();

    return res.status(200).json({
      answer: text || 'No answer returned from the AI provider.',
      source: 'anthropic',
    });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return res.status(504).json({
        error: 'timeout',
        answer: 'The AI provider took too long to respond. Try a shorter question, or open the JTR Assistant tab for the curated library.',
        source: 'timeout',
      });
    }
    console.error('[jtr-assistant]', err?.message || err);
    return res.status(502).json({
      error: 'network-error',
      answer: 'Could not reach the AI provider. The curated knowledge base inside the JTR Assistant tab is still available.',
      source: 'network-error',
    });
  }
}
