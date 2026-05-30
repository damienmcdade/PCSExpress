/*
 * Intrusive tests for src/lib/mapEmbedUrl.js.
 *
 * These helpers generate iframe src URLs that get rendered straight
 * into the BaseMapModule embed. User-influenced inputs are the label
 * (installation name from profile) and lat/lng (returned by Nominatim
 * for the gaining installation). The risk surface is small but real:
 *
 *   - Label injection: an installation name containing & or # would
 *     break the upstream query string if not URL-encoded.
 *   - Number injection: NaN / Infinity in lat/lng would produce a
 *     malformed bbox that breaks the OSM iframe silently and could
 *     point the marker at the equator + Greenwich.
 *
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  publicMapEmbedUrl,
  publicMapSearchUrl,
  osmBoundingBoxEmbedUrl,
} from '../../src/lib/mapEmbedUrl.js';

// ── publicMapEmbedUrl ───────────────────────────────────────────────

test('publicMapEmbedUrl: builds default-zoom URL for a normal label', () => {
  const url = publicMapEmbedUrl('Fort Bragg');
  assert.equal(url, 'https://maps.google.com/maps?q=Fort%20Bragg&z=13&output=embed');
});

test('publicMapEmbedUrl: encodes ampersand in label (no URL injection)', () => {
  const url = publicMapEmbedUrl('Wright-Patterson AFB & Annex');
  // Critical: the literal & must be encoded so it doesn't become a
  // second URL parameter on maps.google.com.
  assert.ok(!url.includes('& '));
  assert.ok(url.includes('%26'));
});

test('publicMapEmbedUrl: encodes # in label (no URL fragment injection)', () => {
  const url = publicMapEmbedUrl('Base #4');
  assert.ok(!url.includes('#'));
  assert.ok(url.includes('%23'));
});

test('publicMapEmbedUrl: handles apostrophe in installation names', () => {
  // encodeURIComponent leaves apostrophe untouched (it's in the safe
  // set per RFC 3986). That's fine inside the q= value because the
  // upstream Google query parser handles it.
  const url = publicMapEmbedUrl("O'Hare");
  assert.ok(url.includes("q=O'Hare"));
});

test('publicMapEmbedUrl: encodes double-quote (NOT in safe set)', () => {
  const url = publicMapEmbedUrl('Camp "Lejeune"');
  assert.ok(!url.includes('"'));
  assert.ok(url.includes('%22'));
});

test('publicMapEmbedUrl: encodes embedded HTML-attribute-breakout payload', () => {
  // A hostile label cannot break out of the q= parameter value. The
  // literal characters that would let it become an HTML attribute
  // (`"`) MUST be encoded; the structural `=` and `&` of the URL
  // itself are expected to remain. Extract just the q= value and
  // assert no `"` survived inside it.
  const url = publicMapEmbedUrl('Bragg" target="_blank" onload="alert(1)');
  const qValue = url.match(/[?&]q=([^&]+)/)[1];
  assert.ok(!qValue.includes('"'), `q= value contains raw quote: ${qValue}`);
  assert.ok(!qValue.includes('='), `q= value contains raw equals: ${qValue}`);
  assert.ok(qValue.includes('%22'), `quote was not percent-encoded: ${qValue}`);
  assert.ok(qValue.includes('%3D'), `equals was not percent-encoded: ${qValue}`);
});

test('publicMapEmbedUrl: falsy label falls back to "military installation"', () => {
  assert.ok(publicMapEmbedUrl('').includes('military%20installation'));
  assert.ok(publicMapEmbedUrl(null).includes('military%20installation'));
  assert.ok(publicMapEmbedUrl(undefined).includes('military%20installation'));
});

test('publicMapEmbedUrl: clamps zoom to [1, 21]', () => {
  assert.ok(publicMapEmbedUrl('x', 0).includes('z=1'));
  assert.ok(publicMapEmbedUrl('x', -50).includes('z=1'));
  assert.ok(publicMapEmbedUrl('x', 999).includes('z=21'));
});

test('publicMapEmbedUrl: rounds fractional zoom', () => {
  assert.ok(publicMapEmbedUrl('x', 12.4).includes('z=12'));
  assert.ok(publicMapEmbedUrl('x', 12.6).includes('z=13'));
});

test('publicMapEmbedUrl: NaN / Infinity zoom falls back to default 13', () => {
  assert.ok(publicMapEmbedUrl('x', NaN).includes('z=13'));
  assert.ok(publicMapEmbedUrl('x', Infinity).includes('z=13'));
  assert.ok(publicMapEmbedUrl('x', -Infinity).includes('z=13'));
});

test('publicMapEmbedUrl: string zoom is treated as non-finite → default', () => {
  // Number.isFinite("13") is false (no coercion). Defends against a
  // caller that accidentally passes a string from a query param.
  assert.ok(publicMapEmbedUrl('x', '13').includes('z=13'));
});

// ── publicMapSearchUrl ──────────────────────────────────────────────

test('publicMapSearchUrl: encodes label safely', () => {
  const url = publicMapSearchUrl('Fort & Annex');
  assert.ok(url.startsWith('https://www.google.com/maps/search/?api=1&query='));
  assert.ok(url.includes('%26'));
});

test('publicMapSearchUrl: falsy label → military installation', () => {
  assert.ok(publicMapSearchUrl('').includes('military%20installation'));
});

// ── osmBoundingBoxEmbedUrl ─────────────────────────────────────────

test('osm: builds valid bbox URL for normal coordinates', () => {
  const url = osmBoundingBoxEmbedUrl(35.139, -79.005);
  assert.match(url, /^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?bbox=/);
  assert.ok(url.includes('marker=35.139,-79.005'));
});

test('osm: respects custom spanDeg', () => {
  const url = osmBoundingBoxEmbedUrl(0, 0, 0.2);
  // Half = 0.1, bbox = -0.1,-0.1,0.1,0.1
  assert.ok(url.includes('bbox=-0.1,-0.1,0.1,0.1'));
});

test('osm: rejects non-number lat → null', () => {
  assert.equal(osmBoundingBoxEmbedUrl('35.139', -79.005), null);
  assert.equal(osmBoundingBoxEmbedUrl(null, -79.005), null);
  assert.equal(osmBoundingBoxEmbedUrl(undefined, -79.005), null);
});

test('osm: rejects non-number lng → null', () => {
  assert.equal(osmBoundingBoxEmbedUrl(35.139, '-79.005'), null);
  assert.equal(osmBoundingBoxEmbedUrl(35.139, null), null);
});

test('osm: NaN lat/lng → null (no NaN-in-URL leak)', () => {
  // Regression: typeof NaN === "number" so the original guard
  // accepted NaN and produced "bbox=NaN,NaN,NaN,NaN" silently. The
  // hardened guard requires Number.isFinite.
  assert.equal(osmBoundingBoxEmbedUrl(NaN, -79.005), null);
  assert.equal(osmBoundingBoxEmbedUrl(35.139, NaN), null);
  assert.equal(osmBoundingBoxEmbedUrl(NaN, NaN), null);
});

test('osm: Infinity lat/lng → null', () => {
  assert.equal(osmBoundingBoxEmbedUrl(Infinity, 0), null);
  assert.equal(osmBoundingBoxEmbedUrl(0, -Infinity), null);
});

test('osm: extreme finite values still produce a URL (callers clamp)', () => {
  // The helper does not enforce -90<=lat<=90 / -180<=lng<=180 — that
  // is the caller's responsibility (Nominatim always returns valid
  // coords). Verify the helper still produces a URL so a bad upstream
  // doesn't break the embed silently.
  const url = osmBoundingBoxEmbedUrl(89.9, 179.9);
  assert.match(url, /^https:\/\/www\.openstreetmap\.org/);
});
