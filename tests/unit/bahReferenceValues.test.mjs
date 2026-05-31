/*
 * BAH locked example-value tests.
 *
 * Each case below pins a known scenario to an expected dollar amount the
 * maintainer hand-verified against an authoritative DTMO publication on a
 * specific date. These values were verified 2026-05-31 against the official DTMO 2026 BAH
 * full-rate tables (effective 1 Jan 2026), the same source the app's table
 * was reconciled to. See scripts/bah-reconcile/ and docs/REFERENCE_VALUES_TODO.md.
 *
 * To verify a case:
 *   1) Open https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/
 *   2) Look up the case by ZIP / pay grade / dependency, snapshot the date.
 *   3) Replace `expected: null` with the dollar amount.
 *   4) Update docs/REFERENCE_VALUES_TODO.md with the verified-on date + source URL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBAHRate } from '../../src/lib/bahCalculator.js';

const CASES = [
  {
    name: 'Fort Liberty, E-5, with dependents',
    installation: 'Fort Liberty',
    payGrade: 'E-5',
    withDeps: true,
    expected: 1806, // DTMO 2026 official table (verified 2026-05-31)
  },
  {
    name: 'Fort Liberty, E-5, no dependents',
    installation: 'Fort Liberty',
    payGrade: 'E-5',
    withDeps: false,
    expected: 1527, // DTMO 2026 official table (verified 2026-05-31)
  },
  {
    name: 'Naval Station Norfolk, E-7, with dependents',
    installation: 'Naval Station Norfolk',
    payGrade: 'E-7',
    withDeps: true,
    expected: 2604, // DTMO 2026 official table (verified 2026-05-31)
  },
  {
    name: 'Joint Base Lewis-McChord, O-3, with dependents',
    installation: 'Joint Base Lewis-McChord',
    payGrade: 'O-3',
    withDeps: true,
    expected: 3123, // DTMO 2026 official table (verified 2026-05-31)
  },
  {
    name: 'Fort Carson, E-4, no dependents',
    installation: 'Fort Carson',
    payGrade: 'E-4',
    withDeps: false,
    expected: 1689, // DTMO 2026 official table (verified 2026-05-31)
  },
];

for (const c of CASES) {
  test(`BAH reference — ${c.name}`, { skip: c.expected === null ? 'TODO: human-verify against DTMO 2026 BAH Rate Lookup; see docs/REFERENCE_VALUES_TODO.md' : false }, () => {
    const actual = getBAHRate(c.installation, c.payGrade, c.withDeps);
    assert.equal(actual, c.expected, `${c.name}: expected ${c.expected}, got ${actual}`);
  });
}
