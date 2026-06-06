/*
 * Intrusive tests for the server-side request validators that gate
 * every public GET (sanitizeQueryParam) and the PII-sensitive POST
 * endpoints (/api/ai, /api/base-reviews/validate). Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { containsLikelyPii, sanitizeQueryParam, safeHttpUrl } from '../../server/lib/validators.js';

// ── containsLikelyPii ────────────────────────────────────────────────

test('pii: detects raw email anywhere in payload', () => {
  assert.equal(containsLikelyPii({ msg: 'reach me at jane@example.com' }), true);
  assert.equal(containsLikelyPii({ deep: { nested: { email: 'a.b+c@host.io' } } }), true);
});

test('pii: detects uppercase email (case-insensitive regex)', () => {
  assert.equal(containsLikelyPii('JANE@EXAMPLE.COM'), true);
});

test('pii: rejects payloads without email-like strings', () => {
  assert.equal(containsLikelyPii({ msg: 'normal text, no contact info' }), false);
  assert.equal(containsLikelyPii({ msg: '@nope no domain' }), false);
  assert.equal(containsLikelyPii({ msg: 'not@an.invalid email .' }), true); // valid-looking match
});

test('pii: detects raw 10-digit phone (no formatting)', () => {
  assert.equal(containsLikelyPii('call 5551234567'), true);
});

test('pii: detects formatted US phone "(555) 123-4567"', () => {
  // Regression: the original regex was \b\d{10}\b only, which missed
  // every formatted phone in real-world submissions. The detector now
  // also accepts the common formatted shapes.
  assert.equal(containsLikelyPii('call me at (555) 123-4567'), true);
});

test('pii: detects formatted US phone "555-123-4567"', () => {
  assert.equal(containsLikelyPii('555-123-4567'), true);
});

test('pii: detects formatted US phone "555.123.4567"', () => {
  assert.equal(containsLikelyPii('Fax: 555.123.4567'), true);
});

test('pii: detects international-leading "+1 555 123 4567"', () => {
  assert.equal(containsLikelyPii('+1 555 123 4567'), true);
});

test('pii: does NOT false-positive on long numeric IDs', () => {
  // 12-digit string would not match either the raw-10 regex (\b makes
  // sure it's a 10-digit word) nor the formatted patterns.
  assert.equal(containsLikelyPii({ id: '123456789012' }), false);
});

test('pii: detects SSN shape NNN-NN-NNNN', () => {
  assert.equal(containsLikelyPii('SSN 123-45-6789'), true);
});

test('pii: SSN-shaped string inside JSON value detected', () => {
  assert.equal(containsLikelyPii({ note: 'ssn=987-65-4320' }), true);
});

test('pii: null / undefined / empty object → false', () => {
  assert.equal(containsLikelyPii(null), false);
  assert.equal(containsLikelyPii(undefined), false);
  assert.equal(containsLikelyPii({}), false);
  assert.equal(containsLikelyPii([]), false);
});

test('pii: primitives without PII → false', () => {
  assert.equal(containsLikelyPii('hello world'), false);
  assert.equal(containsLikelyPii(42), false);
  assert.equal(containsLikelyPii(true), false);
});

test('pii: circular reference does NOT throw (graceful fallback)', () => {
  const circular = { name: 'x' };
  circular.self = circular;
  // The function must not throw even though JSON.stringify on a
  // circular object normally does.
  assert.doesNotThrow(() => containsLikelyPii(circular));
});

test('pii: deeply nested email inside arrays detected', () => {
  assert.equal(containsLikelyPii({ list: [{ contact: ['user@example.com'] }] }), true);
});

test('pii: BigInt in payload does NOT crash (JSON.stringify normally throws on BigInt)', () => {
  // JSON.stringify(BigInt) throws TypeError. The fallback should catch it.
  assert.doesNotThrow(() => containsLikelyPii({ x: 10n }));
});

// ── sanitizeQueryParam ──────────────────────────────────────────────

test('query: passes through safe alphanumeric input untouched', () => {
  assert.equal(sanitizeQueryParam('Fort Bragg'), 'Fort Bragg');
});

test('query: passes through allowlist punctuation (apostrophe / period / hyphen)', () => {
  assert.equal(sanitizeQueryParam("O'Hare Air Force Base"), "O'Hare Air Force Base");
  assert.equal(sanitizeQueryParam('Mt. Vernon'), 'Mt. Vernon');
  assert.equal(sanitizeQueryParam('Wright-Patterson'), 'Wright-Patterson');
});

test('query: strips < > brackets (XSS gate)', () => {
  assert.equal(sanitizeQueryParam('<script>alert(1)</script>'), 'scriptalert1script');
});

test('query: strips quote chars (URL injection gate)', () => {
  assert.equal(sanitizeQueryParam('Bragg" OR "1"="1'), 'Bragg OR 11');
});

test('query: strips ampersand (URL-parameter injection)', () => {
  assert.equal(sanitizeQueryParam('Bragg&admin=true'), 'Braggadmintrue');
});

test('query: strips equal sign (URL-parameter injection)', () => {
  assert.equal(sanitizeQueryParam('city=Bragg'), 'cityBragg');
});

test('query: strips path-traversal sequences', () => {
  assert.equal(sanitizeQueryParam('../../etc/passwd'), '....etcpasswd');
});

test('query: strips ASCII control characters', () => {
  assert.equal(sanitizeQueryParam('Bragg\x00\x07\x1F'), 'Bragg');
});

test('query: strips NULL byte even when surrounded by safe chars', () => {
  assert.equal(sanitizeQueryParam('A\x00B'), 'AB');
});

test('query: trims leading/trailing whitespace before allowlist filter', () => {
  assert.equal(sanitizeQueryParam('   Fort Bragg   '), 'Fort Bragg');
});

test('query: caps at default 60 chars', () => {
  const long = 'A'.repeat(500);
  assert.equal(sanitizeQueryParam(long).length, 60);
});

test('query: respects custom max length', () => {
  assert.equal(sanitizeQueryParam('A'.repeat(500), 10).length, 10);
});

test('query: zero / negative max length returns empty string', () => {
  assert.equal(sanitizeQueryParam('Bragg', 0), '');
  assert.equal(sanitizeQueryParam('Bragg', -5), '');
});

test('query: undefined / null → empty string (no NPE)', () => {
  assert.equal(sanitizeQueryParam(undefined), '');
  assert.equal(sanitizeQueryParam(null), '');
});

test('query: numeric / boolean input coerced to string', () => {
  assert.equal(sanitizeQueryParam(42), '42');
  assert.equal(sanitizeQueryParam(true), 'true');
});

test('query: object input coerced to "[object Object]" then sanitized', () => {
  // [object Object] → strip [ and ] → "object Object" (space survives).
  assert.equal(sanitizeQueryParam({ malicious: 'payload' }), 'object Object');
});

test('query: emoji / unicode stripped (allowlist is ASCII-only)', () => {
  assert.equal(sanitizeQueryParam('Bragg 🚀'), 'Bragg ');
  assert.equal(sanitizeQueryParam('Würzburg'), 'Wrzburg');
});

test('query: CRLF injection (header injection) stripped', () => {
  // \r\n in a query value would normally be dangerous if reflected
  // into upstream HTTP headers. Allowlist excludes both.
  assert.equal(sanitizeQueryParam('Bragg\r\nSet-Cookie: evil=1'), 'BraggSet-Cookie evil1');
});

test('query: combination of multiple attacks all neutralized in one pass', () => {
  const evil = '<script>x</script>\x00&admin=true\r\n"OR"';
  const out = sanitizeQueryParam(evil);
  assert.ok(!out.includes('<'));
  assert.ok(!out.includes('>'));
  assert.ok(!out.includes('&'));
  assert.ok(!out.includes('"'));
  assert.ok(!out.includes('='));
  assert.ok(!out.includes('\n'));
  assert.ok(!out.includes('\x00'));
});

// ── safeHttpUrl: gate third-party aggregator destination URLs ──────────
test('safeHttpUrl: passes well-formed http(s) URLs', () => {
  assert.equal(safeHttpUrl('https://example.com/job/123'), 'https://example.com/job/123');
  assert.equal(safeHttpUrl('http://muse.example.org/x'), 'http://muse.example.org/x');
});

test('safeHttpUrl: rejects javascript: / data: / vbscript: schemes', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl('JavaScript:alert(1)'), '');
  assert.equal(safeHttpUrl('data:text/html,<script>x</script>'), '');
  assert.equal(safeHttpUrl(' \t javascript:alert(1)'), '');
});

test('safeHttpUrl: rejects relative / blank / malformed values', () => {
  assert.equal(safeHttpUrl(''), '');
  assert.equal(safeHttpUrl('   '), '');
  assert.equal(safeHttpUrl('/relative/path'), '');
  assert.equal(safeHttpUrl('not a url'), '');
  assert.equal(safeHttpUrl(null), '');
  assert.equal(safeHttpUrl(undefined), '');
  assert.equal(safeHttpUrl(12345), '');
  assert.equal(safeHttpUrl({}), '');
});

test('safeHttpUrl: never throws on hostile input', () => {
  assert.doesNotThrow(() => safeHttpUrl('http://['));
  assert.doesNotThrow(() => safeHttpUrl('\x00\x01'));
});
