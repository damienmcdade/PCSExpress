/*
 * Unit tests for BAH calculator pure functions. Uses Node 22's
 * built-in `node:test` so we don't need a runner dependency.
 *
 * Run: npm run test:unit  (or `node --test tests/unit/`)
 *
 * These tests focus on contract guarantees that the in-app calculator
 * relies on. They are deliberately quick and don't touch the DOM.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBAHRate,
  getMHAForInstallation,
  isOCONUS,
  formatCurrencyBAH,
  BAH_PAY_GRADES,
  BAH_INSTALLATIONS,
} from '../../src/lib/bahCalculator.js';

test('BAH_PAY_GRADES exposes the standard 24 ranks (E-1..E-9, W-1..W-5, O-1..O-10)', () => {
  assert.equal(BAH_PAY_GRADES.length, 24);
  assert.equal(BAH_PAY_GRADES[0], 'E-1');
  assert.equal(BAH_PAY_GRADES[BAH_PAY_GRADES.length - 1], 'O-10');
});

test('BAH_INSTALLATIONS includes at least one well-known base', () => {
  assert.ok(BAH_INSTALLATIONS.length > 0, 'installations list is non-empty');
  assert.ok(BAH_INSTALLATIONS.some(name => /Fort Liberty|Camp Pendleton/i.test(name)));
});

test('getBAHRate returns a positive number for a known CONUS installation + grade', () => {
  const inst = BAH_INSTALLATIONS.find(n => /Liberty|Bragg|Pendleton|San Diego/i.test(n));
  assert.ok(inst, 'need a known CONUS installation for this test');
  const rate = getBAHRate(inst, 'E-5', true);
  assert.equal(typeof rate, 'number');
  assert.ok(rate > 0, 'rate should be a positive number');
});

test('getBAHRate with-dependents is >= without-dependents for the same grade', () => {
  const inst = BAH_INSTALLATIONS.find(n => /Liberty|Bragg|Pendleton|San Diego/i.test(n));
  const withDeps = getBAHRate(inst, 'E-7', true);
  const withoutDeps = getBAHRate(inst, 'E-7', false);
  assert.ok(withDeps >= withoutDeps, 'with-dependents rate must be >= without-dependents');
});

test('getBAHRate returns null for unknown installation or grade', () => {
  assert.equal(getBAHRate('Nowhere Imagined', 'E-5', true), null);
  const inst = BAH_INSTALLATIONS[0];
  assert.equal(getBAHRate(inst, 'X-99', true), null);
});

test('getMHAForInstallation returns a string MHA or null', () => {
  const inst = BAH_INSTALLATIONS.find(n => /Liberty|Bragg/i.test(n));
  const mha = getMHAForInstallation(inst);
  assert.equal(typeof mha, 'string');
  assert.equal(getMHAForInstallation('Nowhere Imagined'), null);
});

test('isOCONUS flips true for known OCONUS bases', () => {
  assert.equal(isOCONUS('Ramstein Air Base, Germany'), true);
  assert.equal(isOCONUS('Camp Humphreys, Korea'), true);
  assert.equal(isOCONUS('Yokosuka Naval Base, Japan'), true);
});

test('isOCONUS returns false for CONUS bases', () => {
  assert.equal(isOCONUS('Fort Liberty, NC'), false);
  assert.equal(isOCONUS('San Diego, CA'), false);
});

test('formatCurrencyBAH renders USD with no fractional digits', () => {
  assert.equal(formatCurrencyBAH(2500), '$2,500');
  assert.equal(formatCurrencyBAH(0), '$0');
  assert.equal(formatCurrencyBAH(null), '—');
  assert.equal(formatCurrencyBAH(undefined), '—');
});
