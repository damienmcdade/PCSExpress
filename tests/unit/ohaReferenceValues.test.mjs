/*
 * OHA locked example-value tests.
 *
 * Each case pins a known scenario to an expected rent-cap the maintainer
 * hand-verified against the DTMO OHA Rate Lookup on a specific date.
 * Cases with `expected: null` are PLACEHOLDERS — they skip until verified.
 *
 * To verify a case:
 *   1) Open https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/
 *   2) Look up the case by country / locality / pay grade / dependency,
 *      snapshot the quarter (OHA rates publish quarterly: Jan/Apr/Jul/Oct).
 *   3) Replace `expected: null` with the dollar amount.
 *   4) Update docs/REFERENCE_VALUES_TODO.md with the verified-on date + URL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getOHARate } from '../../src/lib/ohaCalculator.js';

const CASES = [
  {
    name: 'Ramstein (Kaiserslautern), E-5, with dependents',
    region: 'Germany (Kaiserslautern / Ramstein)',
    payGrade: 'E-5',
    withDeps: true,
    expected: null,
  },
  {
    name: 'Camp Humphreys, E-7, with dependents',
    region: 'South Korea (Camp Humphreys)',
    payGrade: 'E-7',
    withDeps: true,
    expected: null,
  },
  {
    name: 'Okinawa (Kadena / Foster), O-4, with dependents',
    region: 'Japan (Okinawa — Kadena / Camp Foster)',
    payGrade: 'O-4',
    withDeps: true,
    expected: null,
  },
  {
    name: 'NSA Bahrain, E-6, no dependents',
    region: 'Bahrain (NSA Bahrain)',
    payGrade: 'E-6',
    withDeps: false,
    expected: null,
  },
  {
    name: 'Guam (Andersen / NS Guam), O-3, with dependents',
    region: 'Guam (Andersen AFB / NS Guam)',
    payGrade: 'O-3',
    withDeps: true,
    expected: null,
  },
];

for (const c of CASES) {
  test(`OHA reference — ${c.name}`, { skip: c.expected === null ? 'TODO: human-verify against DTMO OHA Rate Lookup; see docs/REFERENCE_VALUES_TODO.md' : false }, () => {
    const actual = getOHARate(c.region, c.payGrade, c.withDeps);
    assert.equal(actual, c.expected, `${c.name}: expected ${c.expected}, got ${actual}`);
  });
}
