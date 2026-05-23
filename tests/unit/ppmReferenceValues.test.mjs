/*
 * PPM locked example-value tests.
 *
 * Each case pins a known scenario to the expected PPM dollar values the
 * maintainer hand-verified against the official DPS / PPPO PPM estimate
 * on a specific date. Cases with `expected: null` are PLACEHOLDERS — they
 * skip until verified.
 *
 * IMPORTANT: PPM math involves both a JTR-mandated entitlement formula
 * (95% of GCC, 22% federal tax withholding) AND market-input planning
 * estimates (fuel, truck rental, labor). When verifying, decide which
 * field you are pinning:
 *   - `grossIncentive`               — verify against DPS / PPPO official estimate
 *   - `netIncentiveAfterTaxes`       — verify against your last LES + tax run
 *   - `estimatedCashInPocket`        — planning figure; expect drift with market inputs
 *
 * To verify a case:
 *   1) Run the official DPS PPM estimator at https://dps.move.mil/.
 *   2) Snapshot the dollar values it returns for the same inputs.
 *   3) Replace `expected: null` with the matching dollar value for the field listed.
 *   4) Update docs/REFERENCE_VALUES_TODO.md with the verified-on date + URL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePPMEstimate } from '../../src/lib/ppmCalculator.js';

const CASES = [
  {
    name: 'E-5 / 6 YOS / 850 mi / 7,500 lb — gross incentive (95% GCC)',
    inputs: { rank: 'E-5', yearsOfService: 6, distanceMiles: 850, estimatedWeightLbs: 7500 },
    field: 'grossIncentive',
    expected: null,
  },
  {
    name: 'E-5 / 6 YOS / 850 mi / 7,500 lb — net incentive after 22% withholding',
    inputs: { rank: 'E-5', yearsOfService: 6, distanceMiles: 850, estimatedWeightLbs: 7500 },
    field: 'netIncentiveAfterTaxes',
    expected: null,
  },
  {
    name: 'E-7 / 14 YOS / 1500 mi / 13,000 lb — gross incentive (95% GCC)',
    inputs: { rank: 'E-7', yearsOfService: 14, distanceMiles: 1500, estimatedWeightLbs: 13000 },
    field: 'grossIncentive',
    expected: null,
  },
  {
    name: 'O-3 / 8 YOS / 1200 mi / 12,000 lb — gross incentive (95% GCC)',
    inputs: { rank: 'O-3', yearsOfService: 8, distanceMiles: 1200, estimatedWeightLbs: 12000 },
    field: 'grossIncentive',
    expected: null,
  },
  {
    name: 'E-4 / 3 YOS / 400 mi / 5,000 lb — authorized weight cap (lbs)',
    inputs: { rank: 'E-4', yearsOfService: 3, distanceMiles: 400, estimatedWeightLbs: 5000 },
    field: 'authorizedWeightLbs',
    expected: null,
  },
];

for (const c of CASES) {
  test(`PPM reference — ${c.name}`, { skip: c.expected === null ? 'TODO: human-verify against DPS / official PPPO estimate; see docs/REFERENCE_VALUES_TODO.md' : false }, () => {
    const result = calculatePPMEstimate(c.inputs);
    const actual = result[c.field];
    assert.equal(actual, c.expected, `${c.name}: expected ${c.expected}, got ${actual}`);
  });
}
