/*
 * Smoke test: every data module under src/data/ must import without
 * side effects and expose a non-empty named export of the expected
 * shape.
 *
 * Exists because of a real incident (commit 4fc0cfd): an
 * over-aggressive sed-based extraction in Phase 17.1 caught a
 * module-level `const PCS_CHECKLIST = getBranchChecklist('Army')`
 * statement that referenced a binding from a DIFFERENT file. The
 * ReferenceError fired at module-evaluation time the moment the
 * browser loaded the chunk — invisible to the Vite build and to
 * unit tests that don't import the file, but instantly broke
 * pcsexpress.app for every user.
 *
 * The contract this test enforces:
 *
 *   1. Each data file imports without throwing (no module-scope
 *      function calls that touch other modules' bindings).
 *   2. The expected named export is present.
 *   3. The export resolves to a non-empty value (catches typos and
 *      empty re-exports).
 *
 * Run: npm test (chained from `node:test` runner).
 *
 * Adding a new src/data/*.js? Add the matching entry here too so
 * the smoke test catches over-extractions on the next refactor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const DATA_MODULES = [
  { path: '../../src/data/branchChecklists.js',     name: 'BRANCH_PCS_CHECKLISTS',  kind: 'object' },
  { path: '../../src/data/militaryDutyStations.js', name: 'MILITARY_DUTY_STATIONS', kind: 'array'  },
  { path: '../../src/data/installationSchools.js',  name: 'INSTALLATION_SCHOOLS',   kind: 'object' },
  { path: '../../src/data/vetBizCities.js',         name: 'VET_BIZ_CITY',           kind: 'object' },
  { path: '../../src/data/dodCivilianChecklist.js', name: 'DOD_CIVILIAN_CHECKLIST', kind: 'object' },
  { path: '../../src/data/installationMarkets.js',  name: null,                     kind: 'any'    },
];

for (const m of DATA_MODULES) {
  test(`data module loads without throwing: ${m.path}`, async () => {
    let mod;
    try {
      mod = await import(m.path);
    } catch (err) {
      assert.fail(`Import of ${m.path} threw at module-evaluation time: ${err?.message || err}\nThis is exactly the failure mode that broke pcsexpress.app in commit 4fc0cfd — a data module did module-scope work that referenced an undefined binding.`);
    }
    if (m.name) {
      assert.ok(m.name in mod, `Expected named export "${m.name}" from ${m.path}, got: ${Object.keys(mod).join(', ')}`);
      const value = mod[m.name];
      if (m.kind === 'array') {
        assert.ok(Array.isArray(value), `${m.name} should be an array`);
        assert.ok(value.length > 0, `${m.name} should be non-empty`);
      } else if (m.kind === 'object') {
        assert.equal(typeof value, 'object');
        assert.ok(value !== null, `${m.name} should not be null`);
        assert.ok(Object.keys(value).length > 0, `${m.name} should have at least one key`);
      }
    }
  });
}
