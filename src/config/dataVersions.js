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
    label: 'BAH rate table',
    effective: '2026-01-01',
    source: 'DTMO published 2026 BAH tables',
    url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/',
  },
  oha: {
    // OHA tables are republished by DTMO on a quarterly cycle (Jan / Apr / Jul / Oct).
    // The `effective` date pins which quarterly drop our hardcoded rent caps reflect.
    label: 'OHA / MIHA rate tables',
    effective: '2026-01-01',
    cadence: 'quarterly',
    source: 'DTMO published OHA country tables (Q1 2026)',
    url: 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/',
  },
  lqa: {
    // LQA / TQSA ceilings live in the DSSR and are republished on an annual cycle
    // (with intermittent off-cycle adjustments for currency / cost-of-living swings).
    label: 'LQA / TQSA (DoD Civilian OCONUS)',
    effective: '2026-01-01',
    cadence: 'annual',
    source: 'DSSR §920 (Department of State) + DCPAS LQA Worksheet',
    url: 'https://allowances.state.gov/Default.asp',
  },
  ppm: {
    label: 'PPM (DITY) calculator',
    effective: '2026-01-01',
    source: 'JTR §050302 + DTMO PPM Worksheet',
    url: 'https://www.travel.dod.mil/Allowances/Dislocation-Allowance/',
  },
  ppm_config: {
    // Planning estimates for truck / fuel / labor / GCC inputs to the PPM calc.
    // These are NOT JTR-mandated entitlement rates — they are model inputs the
    // tool uses to project rental and labor costs. Versioned separately from
    // the `ppm` entry above so refreshing market estimates does not appear to
    // imply the entitlement formula itself changed.
    label: 'PPM planning estimates (truck / fuel / labor / GCC)',
    effective: '2026-01-01',
    source: 'Planning estimates aligned to JTR §050302 + DTMO GCC methodology; market inputs (fuel, truck, labor) are national averages',
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
