/*
 * Vercel serverless function: /api/ai
 *
 * Vercel twin of the Express /api/ai route in server/index.js, so the
 * in-app Translation feature keeps working during a Railway outage. Like
 * api/jtr-assistant.js this is the PRIMARY handler on Vercel (vercel.json
 * excludes `ai` from the Railway proxy rewrite); the identical Railway
 * route remains for native/direct callers and as a fallback.
 *
 * Contract parity with server/index.js /api/ai:
 *   - Body: { system: string, user: string, stream?: boolean }
 *   - Returns: { text } on success (NON-streaming — the client's callAI in
 *     TranslationModule.jsx detects content-type and reads `data.text`).
 *   - Model: claude-sonnet-4-6, max_tokens 256 (short translation calls).
 *
 * Security parity:
 *   - Origin gate (no UA trust); 20 req/min/IP best-effort + per-instance
 *     global hourly cap; 64 KB body cap; PII gate on { system, user };
 *     4000-char cap per field; 15s upstream timeout; upstream error redaction;
 *     ANTHROPIC_API_KEY server-side only. No request body logged.
 */

const AI_MAX_LEN = 4000;
const MAX_BODY_BYTES = 64 * 1024;

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
  return isSameOriginByReferer(req);
}

// PII gate — byte-identical regexes to server/lib/validators.js containsLikelyPii.
function containsLikelyPii(value) {
  let text;
  try { text = JSON.stringify(value == null ? {} : value); }
  catch { text = String(value); }
  if (!text) return false;
  if (/[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,255}\.[A-Z]{2,}/i.test(text)) return true;
  if (/\b\d{10}\b/.test(text)) return true;
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return true;
  if (/(?<!\d)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/.test(text)) return true;
  return false;
}

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const _hits = new Map();
function clientIp(req) {
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
  if (_hits.size > 5000) { for (const [k, v] of _hits) { if (now - v.windowStart > RATE_WINDOW_MS) _hits.delete(k); } }
  const entry = _hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) { _hits.set(ip, { windowStart: now, count: 1 }); return false; }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

const GLOBAL_CAP = Number(process.env.AI_GLOBAL_HOURLY_CAP) || 1000;
const GLOBAL_WINDOW_MS = 3_600_000;
let _global = { windowStart: 0, count: 0 };
// Read-only: is the hourly budget already spent? Mirrors server/index.js's
// aiGlobalCapReached — checking WITHOUT incrementing so malformed / blocked /
// PII-gated requests that never reach Anthropic can't burn the budget (a
// zero-cost DoS). The counter is only advanced by globalCapConsume()
// immediately before the billed upstream call.
function globalCapReached() {
  const now = Date.now();
  if (now - _global.windowStart > GLOBAL_WINDOW_MS) _global = { windowStart: now, count: 0 };
  return _global.count >= GLOBAL_CAP;
}
function globalCapConsume() {
  const now = Date.now();
  if (now - _global.windowStart > GLOBAL_WINDOW_MS) _global = { windowStart: now, count: 0 };
  _global.count += 1;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }
  if (!passesOriginGate(req)) {
    return res.status(403).json({ error: 'origin required for AI endpoints' });
  }
  if (rateLimited(req)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'payload-too-large' });
  }
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  try { if (JSON.stringify(body).length > MAX_BODY_BYTES) return res.status(413).json({ error: 'payload-too-large' }); } catch { /* noop */ }

  const { system, user } = body;
  if (typeof system !== 'string' || typeof user !== 'string') {
    return res.status(400).json({ error: 'system and user must be strings' });
  }
  if (!system || !user) {
    return res.status(400).json({ error: 'Missing system or user parameter' });
  }
  if (system.length > AI_MAX_LEN || user.length > AI_MAX_LEN) {
    return res.status(413).json({ error: `Input too long. Each field is capped at ${AI_MAX_LEN} characters.` });
  }
  if (containsLikelyPii({ system, user })) {
    return res.status(400).json({ error: 'Input appears to contain PII (email / phone / SSN-like patterns). PCS Express will not forward this to the translation provider.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (globalCapReached()) {
    return res.status(429).json({ error: 'The assistant is at capacity right now. Please try again shortly.' });
  }

  try {
    // Count this request against the hourly budget only now, immediately
    // before the billed upstream call (after all validation/PII gates).
    globalCapConsume();
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      const safeDetail = String(detail || '')
        .replace(/[\x00-\x1F\x7F]+/g, ' ')
        .replace(/"(message|hint|error_type|type|param)"\s*:\s*"[^"]*"/gi, '"$1":"<redacted>"')
        .slice(0, 50);
      console.error(`[ai] anthropic ${upstream.status} ${safeDetail}`);
      return res.status(502).json({ error: 'Anthropic API error' });
    }
    const data = await upstream.json();
    return res.status(200).json({ text: data.content?.[0]?.text || 'No response' });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return res.status(504).json({ error: 'timeout' });
    }
    console.error('[ai]', err?.message || err);
    return res.status(503).json({ error: 'Service unavailable' });
  }
}
