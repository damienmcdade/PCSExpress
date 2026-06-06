// Rigorous tests for the shared JTR knowledge base + search.
// Ensures the AI assistant is loaded with official, well-formed info and
// that realistic JTR queries resolve to the correct entry.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JTR_KB, searchJtrKb, bestJtrMatch, tokenize, scoreKbItem } from '../../src/data/jtrKnowledgeBase.js';

// Official-source markers every citation must reference.
const OFFICIAL = /JTR|FTR|DSSR|IRC|IRS|DTMO|DTR|CFR|USC/i;

test('KB: structural integrity — every entry is well-formed and officially cited', () => {
  assert.ok(JTR_KB.length >= 25, `expected a broad KB, got ${JTR_KB.length}`);
  const ids = new Set();
  for (const e of JTR_KB) {
    assert.ok(typeof e.id === 'string' && e.id, `missing id: ${JSON.stringify(e).slice(0, 60)}`);
    assert.ok(!ids.has(e.id), `duplicate id: ${e.id}`);
    ids.add(e.id);
    assert.ok(typeof e.q === 'string' && e.q.length > 8, `bad q on ${e.id}`);
    assert.ok(typeof e.a === 'string' && e.a.length > 40, `bad/short answer on ${e.id}`);
    assert.ok(Array.isArray(e.tags) && e.tags.length >= 2, `too few tags on ${e.id}`);
    assert.ok(e.tags.every(t => typeof t === 'string' && t === t.toLowerCase()), `tags must be lowercase strings on ${e.id}`);
    assert.ok(typeof e.citation === 'string' && OFFICIAL.test(e.citation), `citation not official on ${e.id}: ${e.citation}`);
  }
});

test('KB: covers the major JTR/FTR/DSSR PCS topics', () => {
  const ids = new Set(JTR_KB.map(e => e.id));
  for (const must of [
    'ppm-max', 'tle-cap', 'dla', 'pov-ship', 'oconus-bah', 'pet-allowance',
    'weight-allowance', 'malt-mileage', 'claim-window',
    // expanded coverage
    'tqse-civilian', 'tqsa-civilian', 'sit-storage', 'nts-storage',
    'advance-pay', 'dependent-travel', 'reserve-guard-pcs', 'ppm-tax',
    'weight-tickets', 'separation-retirement-travel', 'pcs-travel-per-diem',
    'unaccompanied-baggage', 'cola',
  ]) {
    assert.ok(ids.has(must), `KB is missing expected topic: ${must}`);
  }
});

// Battery of realistic user phrasings → the entry id the top hit must be.
const QUERY_BATTERY = [
  ['how do I maximize my dity move payout', 'ppm-max'],
  ['is my ppm taxable', 'ppm-tax'],
  ['how do I get weight tickets for my ppm', 'weight-tickets'],
  ['how many days of TLE do I get', 'tle-cap'],
  ['difference between tle and tla', 'tle-vs-tla'],
  ['what is dislocation allowance', 'dla'],
  ['can I get an advance on my pay for a pcs', 'advance-pay'],
  ['when can I ship my car overseas', 'pov-ship'],
  ['do I get BAH in Germany', 'oconus-bah'],
  ['what is overseas COLA', 'cola'],
  ['pet shipment reimbursement for my dog', 'pet-allowance'],
  ['house hunting trip before pcs', 'hht-civilian'],
  ['real estate closing cost reimbursement civilian', 'real-estate-allowance'],
  ['tqse temporary quarters civilian', 'tqse-civilian'],
  ['tqsa overseas civilian temporary lodging', 'tqsa-civilian'],
  ['how is my household goods weight allowance calculated', 'weight-allowance'],
  ['malt mileage rate for pcs', 'malt-mileage'],
  ['how long can my hhg stay in storage in transit', 'sit-storage'],
  ['non temporary storage nts', 'nts-storage'],
  ['unaccompanied baggage express shipment', 'unaccompanied-baggage'],
  ['when can my dependents travel concurrent', 'dependent-travel'],
  ['early return of dependents', 'early-return-dependents'],
  ['do reserve or national guard get pcs entitlements', 'reserve-guard-pcs'],
  ['travel and move when I retire home of selection', 'separation-retirement-travel'],
  ['per diem for pcs travel days en route', 'pcs-travel-per-diem'],
  ['combat zone tax exclusion', 'czte'],
  ['foreign earned income exclusion civilian overseas', 'feie-civilian'],
  ['how long to file a damage claim against the movers', 'claim-window'],
];

test('search: every realistic query resolves to the correct entry as the top hit', () => {
  for (const [query, expectedId] of QUERY_BATTERY) {
    const ranked = searchJtrKb(query);
    assert.ok(ranked.length > 0, `no results for: "${query}"`);
    assert.equal(ranked[0].id, expectedId, `"${query}" → got ${ranked[0].id}, expected ${expectedId}`);
  }
});

test('bestJtrMatch: confident match for in-scope queries, null for out-of-scope', () => {
  // In-scope → returns the right entry above threshold.
  assert.equal(bestJtrMatch('how many days of TLE')?.id, 'tle-cap');
  assert.equal(bestJtrMatch('pet shipment allowance')?.id, 'pet-allowance');
  // Out-of-scope / low-signal → null (so the chip falls through, not a wrong answer).
  assert.equal(bestJtrMatch('what is the weather tomorrow'), null);
  assert.equal(bestJtrMatch(''), null);
  assert.equal(bestJtrMatch('asdfqwer zzz'), null);
});

test('search: empty query returns the full KB (browse mode)', () => {
  assert.equal(searchJtrKb('').length, JTR_KB.length);
});

test('search helpers: tokenize + scoreKbItem behave', () => {
  assert.deepEqual(tokenize('PPM, DITY!  move'), ['ppm', 'dity', 'move']);
  const ppm = JTR_KB.find(e => e.id === 'ppm-max');
  // A tag hit (3) + body hit (2) for the same token scores >= 3.
  assert.ok(scoreKbItem(ppm, ['ppm']) >= 3);
  assert.equal(scoreKbItem(ppm, ['nonexistenttoken']), 0);
});
