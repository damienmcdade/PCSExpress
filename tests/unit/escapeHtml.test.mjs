/*
 * Tests for the shared escapeHtml helper used by the binder / inventory /
 * AI-transcript print exporters. Beyond the standard escaping, this pins
 * the falsy-value contract: a literal 0 or false must be preserved, not
 * collapsed to an empty string (an inventory item worth $0 must print 0).
 *
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../../src/lib/escapeHtml.js';

test('escapes the five HTML-significant characters', () => {
  assert.equal(escapeHtml(`<a href="x" foo='y'>&`), '&lt;a href=&quot;x&quot; foo=&#39;y&#39;&gt;&amp;');
});

test('a script payload is neutralized', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('the number 0 is preserved (regression: String(s||"") dropped it)', () => {
  assert.equal(escapeHtml(0), '0');
});

test('false is preserved', () => {
  assert.equal(escapeHtml(false), 'false');
});

test('null and undefined become empty string', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('a plain string with no special chars is unchanged', () => {
  assert.equal(escapeHtml('Fort Liberty NC'), 'Fort Liberty NC');
});
