/*
 * Drift guard for the AI Assistant system prompt.
 *
 * /api/jtr-assistant is served by TWO handlers: the Vercel function
 * (api/jtr-assistant.js, primary) and the Express route (server/index.js,
 * native + Railway fallback). Each inlines its own AI_ASSISTANT_SYSTEM_PROMPT
 * literal — deliberately, so the Vercel function bundles standalone and keeps
 * answering during a Railway outage. The hazard is that the two copies drift
 * and users get different behavior depending which path serves the request.
 *
 * This test extracts both literals and asserts they are BYTE-IDENTICAL, so any
 * future edit to one copy that isn't mirrored to the other fails CI. If you
 * intentionally change the prompt, change BOTH files identically.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// Pull the contents of the `AI_ASSISTANT_SYSTEM_PROMPT = \`...\`;` template
// literal out of a source file without executing it. The prompt is the only
// backtick literal assigned to that identifier, so a non-greedy match between
// the opening backtick and the terminating "`;" is unambiguous.
function extractPrompt(relPath) {
  const src = readFileSync(join(ROOT, relPath), 'utf8');
  const m = src.match(/AI_ASSISTANT_SYSTEM_PROMPT\s*=\s*`([\s\S]*?)`;/);
  assert.ok(m, `AI_ASSISTANT_SYSTEM_PROMPT literal not found in ${relPath}`);
  return m[1];
}

test('AI Assistant system prompt is byte-identical across both handlers', () => {
  const vercel = extractPrompt('api/jtr-assistant.js');
  const railway = extractPrompt('server/index.js');

  assert.ok(vercel.length > 500, 'Vercel prompt looks too short to be the real prompt');
  assert.ok(railway.length > 500, 'Railway prompt looks too short to be the real prompt');

  if (vercel !== railway) {
    // Surface the first divergence to make the fix obvious.
    let i = 0;
    while (i < vercel.length && i < railway.length && vercel[i] === railway[i]) i++;
    const around = (s) => JSON.stringify(s.slice(Math.max(0, i - 40), i + 40));
    assert.fail(
      `System prompts drifted at index ${i}.\n` +
      `  api/jtr-assistant.js: ${around(vercel)}\n` +
      `  server/index.js:      ${around(railway)}\n` +
      'Edit BOTH copies identically.'
    );
  }
  assert.equal(vercel, railway);
});

test('both prompts share the same valid tab_ids line (sanity)', () => {
  const vercel = extractPrompt('api/jtr-assistant.js');
  // A representative, behavior-critical substring that must always be present.
  assert.match(vercel, /Valid tab_ids: home, pcs-operations/);
  assert.match(vercel, /Military Crisis Line 988/);
  assert.match(vercel, /UNCLASSIFIED/);
});
