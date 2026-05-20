/*
 * Single source of truth for "as of when" each hardcoded data table
 * in PCS Express was sourced from the official authority. Imported
 * by every calculator / lookup table that surfaces a freshness
 * footer so the user knows how current the figures they're acting
 * on actually are.
 *
 * When the official tables change (typically each January 1st for
 * DTMO / GSA / IRS), update the effective date here and the
 * underlying data file. The single-edit contract means no calculator
 * page lies about its freshness because the dev forgot to bump a
 * second string.
 *
 * Format: ISO date string (YYYY-MM-DD) + the official source URL.
 */

export const DATA_VERSIONS = {
  bah: {
    label: 'BAH / OHA rate table',
    effective: '2026-01-01',
    source: 'DTMO published 2026 BAH tables',
    url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/',
  },
  ppm: {
    label: 'PPM (DITY) calculator',
    effective: '2026-01-01',
    source: 'JTR §050302 + DTMO PPM Worksheet',
    url: 'https://www.travel.dod.mil/Allowances/Dislocation-Allowance/',
  },
  malt: {
    label: 'MALT (POV mileage) rate',
    effective: '2026-01-01',
    source: 'DTMO Mileage Rates',
    url: 'https://www.travel.dod.mil/Allowances/Mileage-Rates/',
  },
  perDiem: {
    label: 'Per diem / lodging ceilings',
    effective: '2026-01-01',
    source: 'GSA + DTMO per diem',
    url: 'https://www.gsa.gov/travel/plan-book/per-diem-rates',
  },
  weightAllowance: {
    label: 'HHG weight allowance',
    effective: '2026-01-01',
    source: 'JTR Table 5-37 + FTR §302-7',
    url: 'https://www.travel.dod.mil/',
  },
  budget: {
    label: 'PCS expense range tables',
    effective: '2026-01-01',
    source: 'BLS CPI + GSA per diem + DTMO',
    url: 'https://www.bls.gov/cpi/',
  },
};

export function formatEffective(versionKey) {
  const v = DATA_VERSIONS[versionKey];
  if (!v) return '';
  return v.effective;
}
