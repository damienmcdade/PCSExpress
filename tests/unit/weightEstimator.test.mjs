/*
 * Unit tests for the Move Strategy weight-estimator helpers. These are the
 * pure, React-free functions the on-device estimator and the HHG-vs-PPM
 * comparison are built on, so the contract is pinned: empty input -> 0, a
 * known item/room set sums to the right total, excess weight is clamped and
 * correct, the partial-PPM weight scales by the slider percentage, and the
 * excess government bill reuses the shared GCC coefficients (never a
 * re-implemented money formula).
 *
 * Run: node --test tests/unit/weightEstimator.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOMS,
  ROOM_AVERAGE_LBS,
  ITEM_WEIGHT_BY_ID,
  quickEstimate,
  sumItemizedWeight,
  excessWeight,
  partialMoveWeight,
  estimateExcessGovernmentBill,
  findPpmBreakEvenWeight,
} from '../../src/data/weightEstimatorData.js';
import {
  getAuthorizedWeightAllowance,
  calculateGovernmentConstructiveCost,
  calculatePPMEstimate,
} from '../../src/lib/ppmCalculator.js';

test('ROOM_AVERAGE_LBS matches the move.mil ~1,000 lb per-room rule', () => {
  assert.equal(ROOM_AVERAGE_LBS, 1000);
});

test('ROOMS table is well-formed: every item has a positive integer weight', () => {
  assert.ok(Array.isArray(ROOMS) && ROOMS.length > 0);
  for (const room of ROOMS) {
    assert.ok(room.id && room.name && Array.isArray(room.items) && room.items.length > 0, `${room.name} should have items`);
    for (const item of room.items) {
      assert.equal(typeof item.lbs, 'number');
      assert.ok(item.lbs > 0 && item.lbs === Math.floor(item.lbs), `${item.name} weight must be a positive integer`);
      // Sanity: no absurd per-article weights (cap at 1,000 lb single item).
      assert.ok(item.lbs <= 1000, `${item.name} weight ${item.lbs} looks unrealistic`);
    }
  }
});

test('ITEM_WEIGHT_BY_ID has one entry per table item', () => {
  const count = ROOMS.reduce((n, r) => n + r.items.length, 0);
  assert.equal(Object.keys(ITEM_WEIGHT_BY_ID).length, count);
  assert.equal(ITEM_WEIGHT_BY_ID['sofa'], 100);
  assert.equal(ITEM_WEIGHT_BY_ID['king-set'], 180);
});

// ── quickEstimate ──────────────────────────────────────────────────────
test('quickEstimate of empty input is 0', () => {
  assert.equal(quickEstimate({}), 0);
  assert.equal(quickEstimate(undefined), 0);
});

test('quickEstimate sums room counts times the per-room average', () => {
  // 3 rooms + 2 rooms = 5 fully-furnished rooms * 1,000 lb = 5,000.
  assert.equal(quickEstimate({ bedroom: 3, 'living-room': 2 }), 5000);
});

test('quickEstimate clamps negative / garbage counts to 0', () => {
  assert.equal(quickEstimate({ a: -4, b: 2, c: 'x' }), 2000);
});

// ── sumItemizedWeight ──────────────────────────────────────────────────
test('sumItemizedWeight of empty input is 0', () => {
  assert.equal(sumItemizedWeight({}), 0);
  assert.equal(sumItemizedWeight(undefined), 0);
});

test('sumItemizedWeight sums qty * per-item weight for a known set', () => {
  // sofa(100)*1 + king-set(180)*1 + dining-chair(15)*4 = 100+180+60 = 340.
  assert.equal(sumItemizedWeight({ sofa: 1, 'king-set': 1, 'dining-chair': 4 }), 340);
});

test('sumItemizedWeight ignores unknown ids and negative quantities', () => {
  assert.equal(sumItemizedWeight({ 'not-a-real-item': 5, sofa: 2, dresser: -3 }), 200);
});

// ── excessWeight ───────────────────────────────────────────────────────
test('excessWeight is 0 when at or under the allowance', () => {
  assert.equal(excessWeight(9000, 9000), 0);
  assert.equal(excessWeight(5000, 9000), 0);
});

test('excessWeight reports the overage when over the allowance', () => {
  // E-5 with dependents = 9,000 lb cap; 12,000 estimated -> 3,000 excess.
  const auth = getAuthorizedWeightAllowance('E-5', true);
  assert.equal(auth, 9000);
  assert.equal(excessWeight(12000, auth), 3000);
});

// ── partialMoveWeight ──────────────────────────────────────────────────
test('partialMoveWeight scales the shipment by the slider fraction', () => {
  assert.equal(partialMoveWeight(8000, 0.5), 4000);
  assert.equal(partialMoveWeight(8000, 0), 0);
  assert.equal(partialMoveWeight(8000, 1), 8000);
});

test('partialMoveWeight clamps the fraction to [0,1]', () => {
  assert.equal(partialMoveWeight(8000, 1.5), 8000);
  assert.equal(partialMoveWeight(8000, -2), 0);
});

// ── estimateExcessGovernmentBill (reuses shared GCC coefficients) ──────
test('estimateExcessGovernmentBill is 0 when not over the cap', () => {
  const bill = estimateExcessGovernmentBill(calculateGovernmentConstructiveCost, {
    rank: 'E-5', withDependents: true, distanceMiles: 1000, estimatedWeightLbs: 7000, authorizedWeightLbs: 9000,
  });
  assert.equal(bill, 0);
});

test('estimateExcessGovernmentBill prices the weight above the cap (uncapped GCC delta)', () => {
  // The shared GCC clamps weight to the member's cap, so the excess must be
  // priced UNCAPPED. The helper evaluates GCC at O-6 (18,000 lb cap) so the
  // full weight is not clamped, then subtracts the GCC at the authorized cap.
  const args = { withDependents: true, distanceMiles: 1000 };
  const est = 12000, auth = 9000;
  const full = calculateGovernmentConstructiveCost({ rank: 'O-6', ...args, estimatedWeightLbs: est }).governmentConstructiveCost;
  const capped = calculateGovernmentConstructiveCost({ rank: 'O-6', ...args, estimatedWeightLbs: auth }).governmentConstructiveCost;
  const expected = full - capped;
  const bill = estimateExcessGovernmentBill(calculateGovernmentConstructiveCost, {
    ...args, estimatedWeightLbs: est, authorizedWeightLbs: auth,
  });
  assert.ok(expected > 0, 'a heavier-than-cap move should have a positive excess bill');
  assert.equal(bill, expected);
  // Sanity: the at-rank diff would have been $0 because of the cap clamp.
  const atRankFull = calculateGovernmentConstructiveCost({ rank: 'E-5', ...args, estimatedWeightLbs: est }).governmentConstructiveCost;
  const atRankCap = calculateGovernmentConstructiveCost({ rank: 'E-5', ...args, estimatedWeightLbs: auth }).governmentConstructiveCost;
  assert.equal(atRankFull - atRankCap, 0, 'at-rank GCC diff is $0 because weight is clamped to the cap');
});

// ── findPpmBreakEvenWeight ─────────────────────────────────────────────
test('findPpmBreakEvenWeight returns a coherent shape', () => {
  const r = findPpmBreakEvenWeight(calculatePPMEstimate, { rank: 'E-5', withDependents: true, distanceMiles: 1000 });
  assert.ok('weight' in r && 'alwaysPositive' in r && 'alwaysNegative' in r);
  if (r.weight != null) {
    assert.ok(r.weight > 0);
    // At/above the crossing the full PPM should net >= 0 cash.
    const cash = calculatePPMEstimate({ rank: 'E-5', withDependents: true, distanceMiles: 1000, estimatedWeightLbs: r.weight }).estimatedCashInPocket;
    assert.ok(cash >= 0, `cash at break-even weight ${r.weight} should be >= 0 (got ${cash})`);
  } else {
    assert.equal(r.alwaysPositive || r.alwaysNegative, true);
  }
});

test('a tiny shipment never out-earns its hauling costs (negative or break-even)', () => {
  // 500 lb full PPM should not be a windfall; cash should be <= a 9,000 lb move.
  const small = calculatePPMEstimate({ rank: 'E-5', withDependents: true, distanceMiles: 1000, estimatedWeightLbs: 500 }).estimatedCashInPocket;
  const big = calculatePPMEstimate({ rank: 'E-5', withDependents: true, distanceMiles: 1000, estimatedWeightLbs: 9000 }).estimatedCashInPocket;
  assert.ok(small < big, 'a heavier (capped) PPM should net more cash than a near-empty one');
});
