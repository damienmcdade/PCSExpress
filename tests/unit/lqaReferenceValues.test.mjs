/*
 * LQA locked example-value tests.
 *
 * Each case pins a known (post, grade-group, family-size) scenario to an
 * expected annual LQA ceiling the maintainer hand-verified against the
 * DSSR §920 country tables on a specific date. Cases with `expected: null`
 * are PLACEHOLDERS — they skip until verified.
 *
 * To verify a case:
 *   1) Open https://aoprals.state.gov/Web920/dssr.asp (DSSR Section 920).
 *   2) Look up the case by country / post / quarters group / family size,
 *      snapshot the effective date.
 *   3) Replace `expected: null` with the annual ceiling in USD.
 *   4) Update docs/REFERENCE_VALUES_TODO.md with the verified-on date + URL.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAnnualLQA } from '../../src/lib/lqaCalculator.js';

const CASES = [
  {
    name: 'Stuttgart, Group 2, 3-4 person',
    post: 'Germany (Stuttgart)',
    group: 'g2',
    familySize: 4,
    expected: null,
  },
  {
    name: 'Tokyo / Yokota, Group 1, 2 person',
    post: 'Japan (Tokyo / Yokota)',
    group: 'g1',
    familySize: 2,
    expected: null,
  },
  {
    name: 'Okinawa, Group 3, 1 person',
    post: 'Japan (Okinawa)',
    group: 'g3',
    familySize: 1,
    expected: null,
  },
  {
    name: 'RAF Lakenheath, Group 2, 7+ person',
    post: 'United Kingdom (RAF Lakenheath / Mildenhall)',
    group: 'g2',
    familySize: 7,
    expected: null,
  },
  {
    name: 'Rota, Group 4, 3-4 person',
    post: 'Spain (Rota / Moron)',
    group: 'g4',
    familySize: 4,
    expected: null,
  },
];

for (const c of CASES) {
  test(`LQA reference — ${c.name}`, { skip: c.expected === null ? 'TODO: human-verify against DSSR §920 country tables; see docs/REFERENCE_VALUES_TODO.md' : false }, () => {
    const actual = calculateAnnualLQA({ post: c.post, group: c.group, familySize: c.familySize });
    assert.equal(actual, c.expected, `${c.name}: expected ${c.expected}, got ${actual}`);
  });
}
