/*
 * Pure input-validation helpers extracted from server/index.js so they
 * can be unit-tested in isolation without booting the Express server
 * (which would open a port and write to stdout at import time).
 *
 * Two functions live here:
 *
 *   containsLikelyPii(value)
 *     Best-effort PII detector. JSON-serializes the input then scans
 *     for email addresses, raw 10-digit phone numbers, formatted phone
 *     numbers, and SSN-shaped strings. Used by /api/ai and
 *     /api/base-reviews/validate to reject payloads with raw PII before
 *     anything reaches an LLM or persistence layer.
 *
 *   sanitizeQueryParam(value, maxLen?)
 *     Coerces a query-string value to a length-capped string of
 *     [A-Za-z0-9 .'-]. Used by every GET endpoint that proxies upstream
 *     (vet-businesses, housing-listings, market-stats, job-listings,
 *     religious-services, schools-nearby, family-activities) so user
 *     input cannot smuggle quote chars, ampersands, or URL fragments
 *     into the upstream URL or cache key.
 *
 * Both functions are total — they never throw and always return a
 * well-typed result, even for malformed / circular / huge inputs.
 */

export function containsLikelyPii(value) {
  // JSON.stringify throws on circular references — wrap so a hostile
  // body can't crash the validator and 500 the endpoint.
  let text;
  try {
    text = JSON.stringify(value == null ? {} : value);
  } catch {
    // Fall back to a string coercion that surfaces obvious patterns
    // even when the structure has cycles.
    text = String(value);
  }
  if (!text) return false;
  // Email (case-insensitive).
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) return true;
  // 10 raw digits in a row (works for "5551234567").
  if (/\b\d{10}\b/.test(text)) return true;
  // SSN shape NNN-NN-NNNN.
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return true;
  // Common formatted US phone shapes: "(555) 123-4567", "555-123-4567",
  // "555.123.4567", "+1 555 123 4567". The leading (?<!\d) and trailing
  // (?!\d) lookarounds prevent false-positives inside long numeric IDs
  // like "123456789012" where a 10-digit substring would otherwise hit.
  const phoneCandidate = text.match(/(?<!\d)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/);
  if (phoneCandidate) {
    const digits = phoneCandidate[0].replace(/\D/g, '');
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))) return true;
  }
  return false;
}

export function sanitizeQueryParam(value, maxLen = 60) {
  // Strip anything other than letters, digits, spaces, hyphen, period,
  // apostrophe. Forward-only validation — SAM.gov + most upstreams
  // reject exotic characters anyway, but defense-in-depth prevents
  // accidental URL injection into the upstream query.
  return String(value == null ? '' : value).trim().replace(/[^A-Za-z0-9 .'-]/g, '').slice(0, Math.max(0, maxLen | 0));
}
