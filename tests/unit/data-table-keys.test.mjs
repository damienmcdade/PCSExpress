/*
 * Data-integrity tests for cross-table join keys.
 *
 * The schools and veteran-business tables are looked up by the canonical
 * installation name the profile stores (a MILITARY_DUTY_STATIONS `name`).
 * Several curated datasets were keyed by an older/short name that never
 * matched, so the records were silently unreachable. These tests lock in
 * the fixes:
 *   - the school alias map's source keys + target station names all exist;
 *   - the renamed VET_BIZ_CITY keys now resolve to real station names.
 *
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { INSTALLATION_SCHOOLS } from '../../src/data/installationSchools.js';
import { MILITARY_DUTY_STATIONS } from '../../src/data/militaryDutyStations.js';
import { VET_BIZ_CITY } from '../../src/data/vetBizCities.js';

const STATION_NAMES = new Set(MILITARY_DUTY_STATIONS.map(s => s.name));

// Mirror of SCHOOL_KEY_ALIASES in App.jsx: canonical station name -> the
// school-data key(s) it should resolve to. Kept in sync deliberately so a
// drift in either place fails this test.
const SCHOOL_KEY_ALIASES = {
  'Naval Air Station Jacksonville': ['NAS Jacksonville'],
  'USAG Bavaria (Grafenwöhr)': ['USAG Bavaria'],
  'USAG Italy (Vicenza)': ['USAG Italy'],
  'USAG Italy (Livorno)': ['USAG Italy'],
  'Naval Base Kitsap': ['NS Bremerton'],
  'Naval Base Coronado': ['NAS North Island'],
  'Naval Base San Diego': ['NS San Diego'],
  'Naval Air Station Lemoore': ['NAS Lemoore'],
  'Naval Station Everett': ['NS Everett'],
  'Joint Base Langley-Eustis': ['Langley AFB'],
  'Joint Base San Antonio': ['Lackland AFB', 'Randolph AFB'],
  'MCB Hawaii Kaneohe Bay': ['MCAS Kaneohe Bay'],
  'USAG Japan (Camp Zama)': ['Camp Zama'],
  'Naval Station Rota': ['NS Rota'],
};

test('every school alias maps a real station name to populated school data', () => {
  for (const [stationName, keys] of Object.entries(SCHOOL_KEY_ALIASES)) {
    assert.ok(STATION_NAMES.has(stationName), `alias station "${stationName}" must be a real duty station`);
    const merged = keys.flatMap(k => INSTALLATION_SCHOOLS[k] || []);
    assert.ok(merged.length > 0, `alias for "${stationName}" must resolve to non-empty school data (${keys.join(', ')})`);
  }
});

test('Joint Base San Antonio merges both Lackland and Randolph school datasets', () => {
  const merged = ['Lackland AFB', 'Randolph AFB'].flatMap(k => INSTALLATION_SCHOOLS[k] || []);
  const lackland = INSTALLATION_SCHOOLS['Lackland AFB'] || [];
  const randolph = INSTALLATION_SCHOOLS['Randolph AFB'] || [];
  assert.equal(merged.length, lackland.length + randolph.length);
  assert.ok(merged.length > 0);
});

test('renamed VET_BIZ_CITY keys resolve to real station names', () => {
  const renamed = [
    'Naval Air Station Jacksonville',
    'Naval Air Station Lemoore',
    'Cavalier Space Force Station',
    'USCG Sector New York',
    'USAG Bavaria (Grafenwöhr)',
    'USAG Italy (Vicenza)',
  ];
  for (const key of renamed) {
    assert.ok(key in VET_BIZ_CITY, `VET_BIZ_CITY must contain "${key}"`);
    assert.ok(STATION_NAMES.has(key), `VET_BIZ_CITY key "${key}" must match a duty station name`);
  }
});

test('the old (pre-rename) VET_BIZ_CITY keys are gone', () => {
  for (const stale of ['Cavalier Space Station', 'Coast Guard Sector New York', 'USAG Italy Vicenza']) {
    assert.ok(!(stale in VET_BIZ_CITY), `stale VET_BIZ_CITY key "${stale}" should have been renamed`);
  }
});
