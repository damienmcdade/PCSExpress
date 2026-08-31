/*
 * Guard for cross-provider failover on the STREAMING branches of the Railway
 * AI routes (server/index.js).
 *
 * The failover added during the 2026-08-31 Anthropic outage landed only in the
 * non-streaming branch of /api/ai and /api/jtr-assistant — while all three
 * clients request stream:true (TranslationModule.jsx, JTRAssistantModule.jsx,
 * AIAssistantChip.jsx). The streaming branch returned a bare 502, so the code
 * path the app actually takes had no failover at all and the same outage would
 * have recurred identically on native (src/config/apiConfig.js routes every
 * Capacitor build straight to Railway, bypassing Vercel).
 *
 * server/index.js boots an Express app and binds a port on import, so this is a
 * source-structure assertion rather than a live request test: for each
 * streaming `!upstream.ok` branch, prove the failover predicate and the
 * fallback provider call appear BEFORE the 502.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SERVER = readFileSync(join(ROOT, 'server/index.js'), 'utf8');

// The two streaming guards, identified by their distinctive log lines.
const STREAM_BRANCHES = [
  { name: '/api/ai', marker: '[API] Anthropic stream error:' },
  { name: '/api/jtr-assistant', marker: '[jtr-assistant] anthropic stream ${upstream.status}' },
];

// The guard block: from `if (!upstream.ok ...` up to the 502 it falls back to.
function branchBody(marker) {
  const at = SERVER.indexOf(marker);
  assert.notEqual(at, -1, `streaming branch marker not found: ${marker}`);
  const start = SERVER.lastIndexOf('if (!upstream.ok', at);
  assert.notEqual(start, -1, `no !upstream.ok guard before: ${marker}`);
  const end = SERVER.indexOf('res.status(502)', at);
  assert.notEqual(end, -1, `no 502 terminator after: ${marker}`);
  return SERVER.slice(start, end);
}

for (const { name, marker } of STREAM_BRANCHES) {
  test(`${name} streaming branch checks the failover predicate before giving up`, () => {
    const body = branchBody(marker);
    assert.match(body, /outOfCredit/, `${name}: no credit-exhaustion check in the streaming branch`);
    assert.match(body, /upstreamDown/, `${name}: no upstream-down check in the streaming branch`);
    assert.match(body, /credit\|billing\|balance\|quota/, `${name}: credit predicate must match the RAW upstream body`);
  });

  test(`${name} streaming branch serves the fallback provider before returning 502`, () => {
    const body = branchBody(marker);
    assert.match(body, /OPENAI_API_KEY/, `${name}: fallback key never read in the streaming branch`);
    assert.match(body, /aiViaOpenAI\(/, `${name}: fallback provider never called in the streaming branch`);
    assert.match(body, /res\.status\(200\)\.json\(/, `${name}: fallback answer must be served as non-streaming JSON`);
  });

  test(`${name} streaming branch reads the upstream body so the predicate can match`, () => {
    const body = branchBody(marker);
    assert.match(body, /upstream\.text\(\)/, `${name}: credit exhaustion arrives in the 400 body, which must be read`);
  });
}

test('the fallback provider is shared with the non-streaming branches (one implementation)', () => {
  const defs = SERVER.match(/async function aiViaOpenAI\(/g) || [];
  assert.equal(defs.length, 1, 'aiViaOpenAI must be defined exactly once');
  const calls = SERVER.match(/aiViaOpenAI\(fallbackKey/g) || [];
  assert.equal(calls.length, 4, 'expected 4 call sites: streaming + non-streaming on each of the two AI routes');
});

test('every AI client requests streaming — which is why the streaming branch is the one that matters', () => {
  for (const rel of [
    'src/components/TranslationModule.jsx',
    'src/components/JTRAssistantModule.jsx',
    'src/components/AIAssistantChip.jsx',
  ]) {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    assert.match(src, /stream:\s*true/, `${rel} no longer requests streaming — re-check the failover placement`);
  }
});

test('clients content-type-detect, so a JSON fallback on a streamed request is readable', () => {
  for (const rel of [
    'src/components/TranslationModule.jsx',
    'src/components/JTRAssistantModule.jsx',
    'src/components/AIAssistantChip.jsx',
  ]) {
    const src = readFileSync(join(ROOT, rel), 'utf8');
    assert.match(src, /content-type/i, `${rel} must branch on content-type to read a non-streamed fallback`);
    assert.match(src, /text\/event-stream/, `${rel} must gate the SSE reader on the streaming content type`);
  }
});
