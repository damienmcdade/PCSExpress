/*
 * Security helpers used by both the Express server (server/index.js)
 * and the Vercel serverless function (api/jtr-assistant.js). Extracted
 * to a standalone ESM module in Phase 16.1 so the security-critical
 * code paths are unit-testable in isolation without booting an HTTP
 * server.
 *
 * NOTE on dual usage: the Vercel serverless function currently
 * inlines its own copy of sanitizeForPrompt (api/jtr-assistant.js).
 * That duplication is intentional — Vercel functions need to be
 * self-contained for cold-start performance and to avoid pulling in
 * the entire server tree at deploy time. If this module ever grows
 * a dependency that's also needed by the serverless function, fold
 * the two by importing this file from the function (Vercel bundles
 * imports automatically).
 */

import { createHash, timingSafeEqual } from 'node:crypto';

// Strip ASCII control characters (0x00–0x1F, 0x7F) and collapse all
// whitespace runs to a single space before any user-supplied text
// reaches the LLM system prompt. Defends against prompt-injection
// vectors that smuggle newlines + "Ignore previous instructions"
// to escape the surrounding ${...} template into a new directive.
export function sanitizeForPrompt(s, maxLen) {
  return String(s == null ? '' : s)
    .replace(/[\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, Math.max(0, maxLen | 0));
}

// Allowlist of legitimate Web Push service hostnames. Subscriptions
// whose endpoint URL doesn't resolve to one of these get rejected,
// blocking the spam vector where an attacker POSTs a subscription
// pointing at an arbitrary host so a future dispatcher would make
// authenticated requests to attacker infrastructure.
export const PUSH_ENDPOINT_HOST_ALLOWLIST = [
  'fcm.googleapis.com',                   // Chrome / Edge / Android (FCM v1)
  'updates.push.services.mozilla.com',    // Firefox
  'web.push.apple.com',                   // Safari (macOS + iOS 16.4+)
  'wns2-bn3p.notify.windows.com',         // Edge legacy (WNS)
];

export function isAllowedPushEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length < 12 || endpoint.length > 1024) return false;
  let u;
  try { u = new URL(endpoint); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  return PUSH_ENDPOINT_HOST_ALLOWLIST.some(allowed => u.hostname === allowed || u.hostname.endsWith('.' + allowed));
}

// Truncate + redact upstream error bodies before they hit platform
// logs. Keeps enough signal to debug (status + first 50 chars) without
// leaking the LLM provider's internal error-keys / hint text into the
// Vercel / Railway log stream where a reader could correlate them to
// queries or pivot on the response shape.
export function redactUpstreamError(body) {
  const s = String(body == null ? '' : body)
    .replace(/[\x00-\x1F\x7F]+/g, ' ')
    .replace(/"(message|hint|error_type|type|param)"\s*:\s*"[^"]*"/gi, '"$1":"<redacted>"')
    .slice(0, 50);
  return s;
}

export function isValidPushSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  if (!isAllowedPushEndpoint(sub.endpoint)) return false;
  const keys = sub.keys;
  if (!keys || typeof keys !== 'object') return false;
  // p256dh ≈ 87 base64url chars, auth ≈ 22. Allow slack on both ends.
  if (typeof keys.p256dh !== 'string' || keys.p256dh.length < 40 || keys.p256dh.length > 200) return false;
  if (typeof keys.auth   !== 'string' || keys.auth.length   < 10 || keys.auth.length   > 100) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(keys.p256dh)) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(keys.auth))   return false;
  return true;
}

// Shape + sanitize an operator-supplied push message into exactly the
// fields the service-worker `push` handler reads ({ title, body, tab,
// tag }). Everything is control-char-stripped, whitespace-collapsed,
// and length-capped — the payload is delivered to every subscribed
// device by the OS push service, so an un-clipped title/body would
// either be silently truncated by the platform or (worse) let a
// smuggled newline split the notification. `tab` becomes part of the
// `/?go=<tab>` deep link the notificationclick handler navigates to,
// so it's hard-restricted to a slug charset — no path, query, or
// scheme characters can ride through into the URL. Defaults mirror the
// service worker's own fallbacks so an empty field degrades cleanly.
export function buildPushPayload(input) {
  const o = input && typeof input === 'object' ? input : {};
  const clip = (v, n) => String(v == null ? '' : v)
    .replace(/[\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);
  const title = clip(o.title, 100) || 'PCS Express';
  const body  = clip(o.body, 250)  || 'You have a new PCS update.';
  const tab   = clip(o.tab, 40).replace(/[^A-Za-z0-9 _-]/g, '');
  const tag   = clip(o.tag, 40).replace(/[^A-Za-z0-9 _:-]/g, '') || 'pcs-push';
  return { title, body, tab, tag };
}

// Constant-time secret comparison for the push-dispatch admin token.
// Hash both sides to a fixed-width digest first so (a) timingSafeEqual
// never throws on a length mismatch and (b) the comparison leaks
// nothing about the secret's length. Empty / non-string inputs always
// fail — an unset PUSH_DISPATCH_KEY must never authenticate anyone.
export function secretsMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length === 0 || b.length === 0) return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
