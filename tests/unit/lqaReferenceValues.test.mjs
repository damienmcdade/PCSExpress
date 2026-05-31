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

// Family-size snapping: a head-count that isn't an exact FAMILY_BUCKETS
// value (3, 5, 8+) must snap to the correct tier instead of falling
// through to the 1.00 multiplier.
test('LQA family-size snaps non-bucket counts to the right tier', () => {
  const base = { post: 'Germany (Kaiserslautern / Ramstein)', group: 'g2' };
  const fam2 = calculateAnnualLQA({ ...base, familySize: 2 });
  const fam3 = calculateAnnualLQA({ ...base, familySize: 3 });
  const fam4 = calculateAnnualLQA({ ...base, familySize: 4 });
  const fam5 = calculateAnnualLQA({ ...base, familySize: 5 });
  const fam6 = calculateAnnualLQA({ ...base, familySize: 6 });
  const fam9 = calculateAnnualLQA({ ...base, familySize: 9 });
  const fam7 = calculateAnnualLQA({ ...base, familySize: 7 });
  assert.ok(fam3 > fam2, 'family of 3 must exceed family of 2 (was equal when it fell to 1.00)');
  assert.equal(fam3, fam4, 'family of 3 and 4 share the "3–4" bucket');
  assert.equal(fam5, fam6, 'family of 5 and 6 share the "5–6" bucket');
  assert.ok(fam5 > fam4, 'the 5–6 tier exceeds the 3–4 tier');
  assert.equal(fam9, fam7, 'family of 9 snaps to the 7+ bucket');
});
