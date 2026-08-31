/*
 * Apple Guideline 5.1.2(i) consent gate.
 *
 * Two things are asserted here:
 *   1. shared/aiConsent.js reads the signal the way the shipped clients send
 *      it — header (the only carrier that survives the cross-origin Capacitor
 *      → Railway hop) and cookie (same-origin web fallback).
 *   2. The Vercel AI handlers actually REFUSE to call a provider when consent
 *      is absent. The Railway twins are guarded by the same two lines in
 *      server/index.js; that file boots a listener on import, so it is covered
 *      by the source assertion at the bottom rather than by invocation.
 *
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AI_CONSENT_HEADER,
  AI_CONSENT_COOKIE,
  AI_CONSENT_STATUS,
  AI_PROVIDERS,
  aiConsentRequiredBody,
  hasAiConsent,
} from '../../shared/aiConsent.js';
import aiHandler from '../../api/ai.js';
import jtrHandler from '../../api/jtr-assistant.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    json(obj) { this.body = obj; return this; },
    end() { return this; },
  };
}

// ── shared helper ────────────────────────────────────────────────────

test('hasAiConsent: accepts the header the native client sends', () => {
  assert.equal(hasAiConsent({ headers: { [AI_CONSENT_HEADER]: '1' } }), true);
});

test('hasAiConsent: accepts the same-origin web cookie among other cookies', () => {
  assert.equal(
    hasAiConsent({ headers: { cookie: `googtrans=/auto/es; ${AI_CONSENT_COOKIE}=1; other=x` } }),
    true,
  );
});

test('hasAiConsent: no signal, junk values, and a cleared cookie all mean no consent', () => {
  assert.equal(hasAiConsent({ headers: {} }), false);
  assert.equal(hasAiConsent({}), false);
  assert.equal(hasAiConsent({ headers: { [AI_CONSENT_HEADER]: 'yes' } }), false);
  assert.equal(hasAiConsent({ headers: { cookie: `${AI_CONSENT_COOKIE}=` } }), false);
  // A cookie whose NAME merely ends with ours must not be mistaken for it.
  assert.equal(hasAiConsent({ headers: { cookie: `not_${AI_CONSENT_COOKIE}=1` } }), false);
});

test('hasAiConsent: a newer client version still counts as consent', () => {
  // Deliberately lenient so bumping the disclosure version cannot brick
  // already-installed App Store binaries — see shared/aiConsent.js.
  assert.equal(hasAiConsent({ headers: { [AI_CONSENT_HEADER]: '2' } }), true);
});

test('the refusal body names both providers so the client can repeat them', () => {
  const body = aiConsentRequiredBody();
  assert.equal(body.needsAiConsent, true);
  assert.deepEqual(body.providers, AI_PROVIDERS);
  assert.ok(/Anthropic/.test(body.providers.join(' ')));
  assert.ok(/OpenAI/.test(body.providers.join(' ')));
});

// ── Vercel handlers ──────────────────────────────────────────────────

const CONSENTLESS = { origin: 'https://pcsexpress.app', 'x-forwarded-for': 'consent-test-ip' };

test('/api/ai refuses to transmit without consent, and calls no provider', async () => {
  const realFetch = global.fetch;
  let upstreamCalls = 0;
  global.fetch = async () => { upstreamCalls += 1; throw new Error('should never be reached'); };
  const prevKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  try {
    const res = makeRes();
    await aiHandler({ method: 'POST', body: { system: 'translate', user: 'hello' }, headers: { ...CONSENTLESS, 'x-forwarded-for': 'consent-ai-1' } }, res);
    assert.equal(res.statusCode, AI_CONSENT_STATUS);
    assert.equal(res.body.needsAiConsent, true);
    assert.equal(upstreamCalls, 0);
  } finally {
    global.fetch = realFetch;
    if (prevKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prevKey;
  }
});

test('/api/jtr-assistant refuses to transmit without consent, and calls no provider', async () => {
  const realFetch = global.fetch;
  let upstreamCalls = 0;
  global.fetch = async () => { upstreamCalls += 1; throw new Error('should never be reached'); };
  const prevKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  try {
    const res = makeRes();
    await jtrHandler({ method: 'POST', body: { q: 'how much is DLA' }, headers: { ...CONSENTLESS, 'x-forwarded-for': 'consent-jtr-1' } }, res);
    assert.equal(res.statusCode, AI_CONSENT_STATUS);
    assert.equal(res.body.needsAiConsent, true);
    assert.equal(upstreamCalls, 0);
  } finally {
    global.fetch = realFetch;
    if (prevKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prevKey;
  }
});

test('the consent gate sits ahead of the PII gate (no consent, no inspection needed)', async () => {
  const res = makeRes();
  await jtrHandler(
    { method: 'POST', body: { q: 'email me at someone@example.com' }, headers: { ...CONSENTLESS, 'x-forwarded-for': 'consent-jtr-2' } },
    res,
  );
  assert.equal(res.statusCode, AI_CONSENT_STATUS);
});

// ── Railway twins ────────────────────────────────────────────────────

test('both server/index.js AI routes are guarded too (the shipped app talks to Railway, not Vercel)', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'server/index.js'), 'utf8');
  // One guard per AI route. If a third AI route is ever added to the Express
  // server this count fails and forces the author to guard it.
  const guards = src.match(/if \(!hasAiConsent\(req\)\)/g) || [];
  assert.equal(guards.length, 2, 'expected exactly one consent guard per AI route in server/index.js');
  // The header must stay in the CORS allowlist or the Capacitor preflight
  // fails and every native AI call breaks.
  assert.match(src, /allowedHeaders:\s*\['Content-Type',\s*'Authorization',\s*AI_CONSENT_HEADER\]/);
});

test('every AI provider call site in the repo lives behind a consent guard', () => {
  for (const file of ['api/ai.js', 'api/jtr-assistant.js', 'server/index.js']) {
    const src = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    assert.match(src, /hasAiConsent/, `${file} must import and use the consent gate`);
  }
});
