/*
 * Unit tests for pure LQA calculator helpers (no external reference
 * values — those live in lqaReferenceValues.test.mjs).
 *
 * Run: npm run test:unit
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookupFamilyMult, FAMILY_BUCKETS } from '../../src/lib/lqaCalculator.js';

// FAMILY_BUCKETS values are UPPER bounds (4 = "3–4", 6 = "5–6", 7 = "7+").
// Family sizes that fall BETWEEN bucket bounds (3, 5) must snap up to the
// right multiplier, not fall through to 1.00 — the bug the component had
// when it used an exact-value lookup instead of this range-snap helper.
test('lookupFamilyMult snaps in-between family sizes up to the right bucket', () => {
  assert.equal(lookupFamilyMult(3), 1.10, 'family of 3 → "3–4" bucket (1.10), not 1.00');
  assert.equal(lookupFamilyMult(5), 1.20, 'family of 5 → "5–6" bucket (1.20)');
});

test('lookupFamilyMult matches exact bucket bounds', () => {
  assert.equal(lookupFamilyMult(1), 0.90);
  assert.equal(lookupFamilyMult(2), 1.00);
  assert.equal(lookupFamilyMult(4), 1.10);
  assert.equal(lookupFamilyMult(6), 1.20);
  assert.equal(lookupFamilyMult(7), 1.30);
});

test('lookupFamilyMult clamps below 1 and above the top bucket', () => {
  assert.equal(lookupFamilyMult(0), 0.90);   // floor to the smallest bucket
  assert.equal(lookupFamilyMult(99), 1.30);  // 7+ bucket
  assert.equal(lookupFamilyMult(undefined), 0.90);
});

test('FAMILY_BUCKETS multipliers are monotonic non-decreasing by size', () => {
  for (let i = 1; i < FAMILY_BUCKETS.length; i++) {
    assert.ok(FAMILY_BUCKETS[i].mult >= FAMILY_BUCKETS[i - 1].mult);
  }
});
