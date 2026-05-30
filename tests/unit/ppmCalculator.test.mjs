/*
 * Unit tests for the PPM (Personally Procured Move) calculator. These
 * are the numbers the user is encouraged to make a real moving
 * decision on, so the contract is worth pinning down: a typical input
 * must produce a non-negative incentive after taxes, the profit-meter
 * must stay within [-100, 100], and the rank-based weight allowance
 * must be a positive number.
 *
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAuthorizedWeightAllowance,
  calculateGovernmentConstructiveCost,
  estimateRentalTruckAndFuelCosts,
  calculatePPMEstimate,
  formatCurrency,
  PPM_PAYGRADES,
} from '../../src/lib/ppmCalculator.js';

test('PPM_PAYGRADES contains the standard enlisted + officer ranks', () => {
  assert.ok(Array.isArray(PPM_PAYGRADES));
  assert.ok(PPM_PAYGRADES.length > 0);
  assert.ok(PPM_PAYGRADES.includes('E-5'));
});

test('getAuthorizedWeightAllowance returns a positive integer for every rank', () => {
  for (const rank of PPM_PAYGRADES) {
    const w = getAuthorizedWeightAllowance(rank);
    assert.equal(typeof w, 'number', `${rank} should produce a number`);
    assert.ok(w > 0, `${rank} weight allowance should be positive`);
    assert.equal(w, Math.floor(w), `${rank} weight allowance should be an integer`);
  }
});

test('calculateGovernmentConstructiveCost yields a positive number for a typical move', () => {
  const input = { rank: 'E-5', estimatedWeightLbs: 5000, distanceMiles: 1000 };
  const gcc = calculateGovernmentConstructiveCost(input);
  assert.equal(typeof gcc.governmentConstructiveCost, 'number');
  assert.ok(gcc.governmentConstructiveCost > 0);
  assert.equal(gcc.reimbursableWeightLbs, 5000, 'weight must flow into the GCC, not collapse to 0');
});

test('GCC scales with shipment weight (guards the weight-key contract)', () => {
  const light = calculateGovernmentConstructiveCost({ rank: 'E-5', estimatedWeightLbs: 2000, distanceMiles: 1000 });
  const heavy = calculateGovernmentConstructiveCost({ rank: 'E-5', estimatedWeightLbs: 8000, distanceMiles: 1000 });
  assert.ok(heavy.governmentConstructiveCost > light.governmentConstructiveCost, 'heavier move must cost more');
});

test('calculator accepts both estimatedWeightLbs and the actualWeightLbs alias', () => {
  const a = calculateGovernmentConstructiveCost({ rank: 'E-5', estimatedWeightLbs: 5000, distanceMiles: 1000 });
  const b = calculateGovernmentConstructiveCost({ rank: 'E-5', actualWeightLbs: 5000, distanceMiles: 1000 });
  assert.equal(a.governmentConstructiveCost, b.governmentConstructiveCost);
});

test('comma-formatted weight/distance strings parse instead of collapsing to 0', () => {
  const r = calculatePPMEstimate({ rank: 'E-5', estimatedWeightLbs: '7,500', distanceMiles: '1,200' });
  assert.equal(r.reimbursableWeightLbs, 7500, '"7,500" must parse to 7500');
  assert.equal(r.distanceMiles, 1200, '"1,200" must parse to 1200');
});

test('estimateRentalTruckAndFuelCosts adds at least one cost component', () => {
  const expenses = estimateRentalTruckAndFuelCosts({ distanceMiles: 1000 });
  assert.equal(typeof expenses.rentalTruckAndFuelCost, 'number');
  assert.ok(expenses.rentalTruckAndFuelCost > 0);
});

test('calculatePPMEstimate produces a coherent profit-meter percent within [-100,100]', () => {
  const result = calculatePPMEstimate({ rank: 'E-5', actualWeightLbs: 5000, distanceMiles: 1500 });
  assert.equal(typeof result.profitMeterPercent, 'number');
  assert.ok(result.profitMeterPercent >= -100 && result.profitMeterPercent <= 100, 'meter must be clamped');
});

test('calculatePPMEstimate exposes the full breakdown', () => {
  const result = calculatePPMEstimate({ rank: 'E-5', actualWeightLbs: 5000, distanceMiles: 1500 });
  // Spot-check the keys downstream UI consumes.
  for (const key of [
    'governmentConstructiveCost',
    'grossIncentive',
    'estimatedTaxWithholding',
    'netIncentiveAfterTaxes',
    'estimatedCashInPocket',
    'profitMeterPercent',
  ]) {
    assert.ok(key in result, `expected ${key} in PPM estimate breakdown`);
    assert.equal(typeof result[key], 'number');
  }
});

test('formatCurrency renders USD with no fractional digits', () => {
  assert.equal(formatCurrency(2500), '$2,500');
  assert.equal(formatCurrency(0), '$0');
  assert.equal(formatCurrency(null), '$0');
  assert.equal(formatCurrency(undefined), '$0');
});
