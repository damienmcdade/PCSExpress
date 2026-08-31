/*
 * Guard for checklist task identity.
 *
 * Completion, reminders and Mission-Lane snoozes were keyed positionally as
 * `${phase}-${index}` against the array getTailoredChecklist() returns — an
 * array applyChecklistFilters() deletes items out of the MIDDLE of, based on
 * hasPets / hasChildren / moveType / isOverseas / component / ordersType. Add
 * a pet, or ship one new task string, and every index after the edit shifted:
 * completed tasks silently re-opened and, past PHASE_WINDOWS[phase].overdueAt,
 * rendered in red as "PAST DUE — Complete immediately."
 *
 * These tests pin the two properties that fix it: keys survive an insertion or
 * a filtered-out item, and the one-time migration preserves existing progress.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checklistTaskKey,
  slugifyTask,
  parseLegacyChecklistKey,
  migrateChecklistKeyMap,
  buildChecklistKeyIndex,
  CHECKLIST_KEY_SEPARATOR,
} from '../../src/lib/checklistKeys.js';
import { BRANCH_PCS_CHECKLISTS } from '../../src/data/branchChecklists.js';
import { DOD_CIVILIAN_CHECKLIST } from '../../src/data/dodCivilianChecklist.js';

const ALL_CHECKLISTS = { ...BRANCH_PCS_CHECKLISTS, 'DoD Civilian': DOD_CIVILIAN_CHECKLIST };

// ── Key shape and stability ──────────────────────────────────────────

test('the key is derived from the task text, not its position', () => {
  const a = checklistTaskKey('30 Days Out', 'Schedule the pack-out date with TMO');
  const b = checklistTaskKey('30 Days Out', 'Schedule the pack-out date with TMO');
  assert.equal(a, b);
  assert.notEqual(a, checklistTaskKey('30 Days Out', 'Something else entirely'));
});

test('the same task in two phases gets two distinct keys', () => {
  assert.notEqual(
    checklistTaskKey('Move Week', 'Confirm your travel itinerary'),
    checklistTaskKey('In-Processing', 'Confirm your travel itinerary'),
  );
});

test('phase names containing hyphens survive the round trip unambiguously', () => {
  // "In-Processing" is exactly what made the legacy `${phase}-${index}` key
  // ambiguous to parse. The "::" separator removes the ambiguity.
  const key = checklistTaskKey('In-Processing', 'Report to the gaining unit S-1');
  assert.ok(key.startsWith(`In-Processing${CHECKLIST_KEY_SEPARATOR}`));
  assert.equal(parseLegacyChecklistKey(key), null, 'a text key must never parse as a positional one');
});

test('keys are bounded in length even for very long task strings', () => {
  const key = checklistTaskKey('90 Days Out', 'x'.repeat(2000));
  assert.ok(key.length < 120, `key length ${key.length}`);
});

test('slug keeps a readable prefix plus a full-text hash', () => {
  const slug = slugifyTask('Schedule the pack-out date with TMO');
  assert.match(slug, /^schedule-the-pack-out-date-with-tmo~[a-z0-9]+$/);
});

test('tasks sharing a long common prefix do not collide', () => {
  const long = 'Y'.repeat(60);
  assert.notEqual(checklistTaskKey('p', `${long}A`), checklistTaskKey('p', `${long}B`));
});

test('no key collisions across every shipped checklist', () => {
  const seen = new Map();
  let count = 0;
  for (const phases of Object.values(ALL_CHECKLISTS)) {
    for (const [phase, tasks] of Object.entries(phases)) {
      for (const task of tasks) {
        count += 1;
        const key = checklistTaskKey(phase, task);
        const prior = seen.get(key);
        assert.ok(prior === undefined || prior === task, `collision on ${key}: ${prior} <-> ${task}`);
        seen.set(key, task);
      }
    }
  }
  assert.ok(count > 500, `expected the full task corpus, saw ${count}`);
});

// ── The bug this replaces ────────────────────────────────────────────

test('a filtered-out item no longer shifts the identity of the tasks after it', () => {
  const unfiltered = ['Book lodging', 'Schedule pet shipment with the vet', 'Turn in quarters'];
  // applyChecklistFilters drops the pet task once hasPets flips to false.
  const filtered = ['Book lodging', 'Turn in quarters'];

  // Positional keying: "Turn in quarters" was index 2, becomes index 1.
  assert.notEqual(`Move Week-${unfiltered.indexOf('Turn in quarters')}`, `Move Week-${filtered.indexOf('Turn in quarters')}`);
  // Text keying: unchanged.
  assert.equal(
    checklistTaskKey('Move Week', unfiltered[2]),
    checklistTaskKey('Move Week', filtered[1]),
  );
});

test('inserting a new task upstream does not re-open the tasks below it', () => {
  const before = ['A', 'B', 'C'];
  const after = ['A', 'NEW', 'B', 'C'];
  const done = new Set(before.map(t => checklistTaskKey('90 Days Out', t)));
  for (const task of ['A', 'B', 'C']) {
    assert.ok(done.has(checklistTaskKey('90 Days Out', task)), `${task} re-opened`);
  }
  assert.ok(!done.has(checklistTaskKey('90 Days Out', after[1])), 'the new task should start unchecked');
});

// ── Legacy key parsing ───────────────────────────────────────────────

test('parseLegacyChecklistKey splits on the LAST hyphen', () => {
  assert.deepEqual(parseLegacyChecklistKey('In-Processing-4'), { phase: 'In-Processing', index: 4 });
  assert.deepEqual(parseLegacyChecklistKey('90 Days Out-12'), { phase: '90 Days Out', index: 12 });
});

test('parseLegacyChecklistKey rejects anything that is not positional', () => {
  for (const k of ['', null, undefined, 'no-digits', 'phase-', '-3', 'Move Week::slug~abc']) {
    assert.equal(parseLegacyChecklistKey(k), null, `should not parse: ${k}`);
  }
});

// ── The migration ────────────────────────────────────────────────────

const TAILORED = {
  '90 Days Out': ['Book lodging', 'Start the weight estimate', 'Schedule pack-out'],
  'In-Processing': ['Report to S-1', 'Enroll in TRICARE'],
};

test('migration maps each stored index to the task it currently addresses', () => {
  const legacy = { '90 Days Out-0': true, '90 Days Out-2': true, 'In-Processing-1': true };
  const { next, migrated, unresolved } = migrateChecklistKeyMap(legacy, TAILORED);
  assert.equal(migrated, 3);
  assert.equal(unresolved, 0);
  assert.equal(next[checklistTaskKey('90 Days Out', 'Book lodging')], true);
  assert.equal(next[checklistTaskKey('90 Days Out', 'Schedule pack-out')], true);
  assert.equal(next[checklistTaskKey('In-Processing', 'Enroll in TRICARE')], true);
  // The unchecked middle task stays unchecked.
  assert.equal(next[checklistTaskKey('90 Days Out', 'Start the weight estimate')], undefined);
});

test('migration never destroys progress it cannot resolve', () => {
  const legacy = { '90 Days Out-99': true, 'Retired Phase-0': true };
  const { next, migrated, unresolved } = migrateChecklistKeyMap(legacy, TAILORED);
  assert.equal(migrated, 0);
  assert.equal(unresolved, 2);
  assert.equal(next['90 Days Out-99'], true);
  assert.equal(next['Retired Phase-0'], true);
});

test('migration is idempotent — a second pass changes nothing', () => {
  const legacy = { '90 Days Out-0': true, 'In-Processing-1': true };
  const first = migrateChecklistKeyMap(legacy, TAILORED);
  const second = migrateChecklistKeyMap(first.next, TAILORED);
  assert.equal(second.migrated, 0);
  assert.deepEqual(second.next, first.next);
});

test('migration preserves non-boolean values (reminder timestamps, snooze dates)', () => {
  const legacy = { '90 Days Out-0': '2026-09-01T09:00', 'In-Processing-0': '2026-09-15' };
  const { next } = migrateChecklistKeyMap(legacy, TAILORED);
  assert.equal(next[checklistTaskKey('90 Days Out', 'Book lodging')], '2026-09-01T09:00');
  assert.equal(next[checklistTaskKey('In-Processing', 'Report to S-1')], '2026-09-15');
});

test('migration tolerates a missing / malformed stored map', () => {
  for (const input of [null, undefined, 'nope', 42, []]) {
    assert.deepEqual(migrateChecklistKeyMap(input, TAILORED).next, {});
  }
});

// ── Reminder label lookup ────────────────────────────────────────────

test('buildChecklistKeyIndex recovers a task label from its key', () => {
  const index = buildChecklistKeyIndex(TAILORED);
  const key = checklistTaskKey('In-Processing', 'Enroll in TRICARE');
  assert.deepEqual(index.get(key), { phase: 'In-Processing', task: 'Enroll in TRICARE' });
  assert.equal(index.get('nonexistent'), undefined);
});
