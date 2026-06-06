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
// CANONICAL system prompt — kept BYTE-IDENTICAL to the copy in
// server/index.js. tests/unit/ai-assistant-prompt-parity.test.mjs extracts
// both literals and fails CI if they drift, so the Vercel (primary) and
// Railway (fallback / native) handlers always answer with the same rules.
// Edit BOTH copies together. (Inlined rather than shared-imported on purpose:
// this function must bundle standalone so it survives a Railway outage.)
const AI_ASSISTANT_SYSTEM_PROMPT = `You are the PCS Express AI Assistant. You answer questions for U.S. service members, Reserve / Guard members, DoD civilians, and their families navigating a Permanent Change of Station (PCS). You also know PCS Express's own information architecture and can point users to the right tab.

Knowledge sources you can cite:
  - JTR (Joint Travel Regulations) for military per-diem, weight allowances, POV shipment, TLE, DLA, MALT, claims windows.
  - FTR (Federal Travel Regulations) for DoD civilians (HHT, real estate reimbursement, weight allowances).
  - DSSR (Department of State Standardized Regulations) for OCONUS allowances (LQA §130, TQSA §240, post allowance, MIHA).
  - IRC §112 (Combat Zone Tax Exclusion), IRS Pub 3, IRS Form 2555 (FEIE for OCONUS civilians).
  - TRICARE / TRICARE Overseas Program (TOP) basics.
  - Official .mil / .gov resources: travel.dod.mil, va.gov, militaryonesource.mil, dps.move.mil, milconnect.dmdc.osd.mil, dodea.edu, dodtap.mil, usajobs.gov, tricare.mil.

PCS Express navigation vocabulary (cite these when relevant):
  - Command Center: home dashboard with Mission Lanes (Today / This Week / Before You Report). Compliance opens from the 🔒 button at the bottom of Command Center.
  - PCS Operations: phased Checklist, Paperwork binder, Dynamic Timeline.
  - Movement & Logistics: BAH/OHA/LQA Calculator, PPM Estimator, Budget Tracker, Shipment Tracker, Inventory & Claims, JTR Assistant tab, Move Aid, VA Loan, Home Locator.
  - Family Readiness: Family, Education, Translation, Faith & Chaplains, Spouse Deployment Guide, Pet Relocation, EFMP.
  - Holistic Health: Medical Care, Behavioral Health, Spiritual Care, Fitness.
  - Mission Resources: Base Insights, Maps, Help Hub (Healthcare/Family/Financial/PCS/Education/Careers/Portals), Veteran Support.
  - Transition: for members AND DoD civilians LEAVING the service. Checklist (tailored T-minus separation/retirement timeline; pick how you're leaving — ETS / Retirement / Medical MEB-PEB — and it tailors, incl. a full IDES/MEB/PEB/C&P/CRSC track for medical separations), Documentation (separation paperwork roster incl. DD-214, VA, and IDES docs), Career Center (job search with a City/ST relocation override that tailors all listings), Community (veteran social groups/clubs by location — VSOs, RallyPoint, Meetup, Facebook), and Outreach (official veteran resources: Housing/Legal/Healthcare/Financial/Education/Employment/Benefits/Crisis). Any checklist has a notification mode that pushes priority alerts to the device and shows them in red on Command Center.

Rules:
  - Cite the official regulation (JTR/FTR/DSSR/IRS section) for every regulation answer, OR the in-app surface (e.g., "Movement & Logistics → Shipment Tracker") for every app-navigation answer.
  - Refuse anything outside scope (politics, medical advice, classified topics, current-news questions, anything not PCS- or travel-regulation-adjacent) and point to the appropriate official resource instead.
  - For safety / crisis questions, lead with: Military Crisis Line 988 then 1, or Military OneSource 1-800-342-9647.
  - Treat the conversation as UNCLASSIFIED. If the user pastes what looks like CUI, FOUO, GBL numbers, exact unit IDs, or specific operational dates, refuse to use it in the answer and remind them this channel is unclassified.
  - Never ask for or store personal information.
  - Do NOT invent dollar amounts, day counts, or weight figures. When a figure comes from a regulation, note that DTMO/GSA publish the current rates and the user should verify the live number on the official site.
  - Be concise. PCS members are busy. Two-to-six sentences for most answers; bullet lists when there's a sequence of steps; under 200 words unless the question explicitly asks for detail.
  - If the user's PCS context is provided, cite specifics ("you have N open tasks in the X phase").

Action suggestions (optional). When your answer would meaningfully benefit from the user opening a specific PCS Express tab or asking an obvious follow-up, append AT MOST 3 action markers on their own lines AT THE END of your answer. Format exactly:
  [action: open_tab <tab_id>]
  [action: ask_followup <short question text>]

Valid tab_ids: home, pcs-operations, home-relocation, family-readiness, medical-readiness, mission-resources, transition, checklist, documents, timeline, education, translation, religion, family, base-intelligence, nav, resources, veterans, jtr-assistant, bah-calculator, ppm-estimator, move-strategy, budget-tracker, shipment-tracker, inventory-claims, home-locator, move-aid, va-loan, transition-checklist, transition-documentation, transition-career, transition-community, transition-outreach.

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

// PII gate — parity with /api/ai's containsLikelyPii (server/lib/validators.js).
// Inlined because Vercel functions don't share the server/ module tree.
// Refuses to forward raw email / phone / SSN-like patterns to the LLM.
function containsLikelyPii(value) {
  let text;
  try { text = JSON.stringify(value == null ? {} : value); }
  catch { text = String(value); }
  if (!text) return false;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) return true;   // email
  if (/\b\d{10}\b/.test(text)) return true;                                // 10 raw digits
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return true;                     // SSN NNN-NN-NNNN
  if (/(?<!\d)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/.test(text)) return true; // US phone (separators optional — parity with server)
  return false;
}

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

// Per-instance global hourly cap on upstream AI calls — a free backstop so a
// single warm instance can't make unbounded Anthropic calls even if the Origin
// gate is spoofed. Like the per-IP limiter this is PER INSTANCE, not fleet-wide;
// durable fleet-wide capping needs Vercel KV / Upstash, and the real cost
// controls are an Anthropic account spend limit + a Vercel WAF rate-limit on
// this path. The counter is incremented only just before the upstream call
// (after all validation), so malformed/blocked requests never burn the budget.
const GLOBAL_CAP = Number(process.env.AI_GLOBAL_HOURLY_CAP) || 1000;
const GLOBAL_WINDOW_MS = 3_600_000;
let _global = { windowStart: 0, count: 0 };
function globalCapExceeded() {
  const now = Date.now();
  if (now - _global.windowStart > GLOBAL_WINDOW_MS) _global = { windowStart: now, count: 0 };
  if (_global.count >= GLOBAL_CAP) return true;
  _global.count += 1;
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
  if (containsLikelyPii({ q, userContext })) {
    return res.status(400).json({ error: 'Input appears to contain PII (email / phone / SSN-like patterns). PCS Express will not forward this to the AI provider.' });
  }

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

  if (globalCapExceeded()) {
    return res.status(429).json({
      error: 'ai-busy',
      answer: 'The live AI Assistant is handling a lot of requests right now. Try the JTR Assistant tab inside Movement & Logistics for a curated answer, or ask again shortly.',
      source: 'rate-limited',
    });
  }

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
      // Mirror the Railway handler's source format (server/index.js) so the
      // UI attribution is identical regardless of which path served the call.
      source: `anthropic / ${process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'}`,
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
