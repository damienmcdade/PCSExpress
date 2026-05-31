/*
 * LQA / TQSA Calculator — Living Quarters Allowance + Temporary Quarters
 * Subsistence Allowance for DoD Civilians OCONUS. Reference math + data.
 *
 * Authoritative sources (public):
 *   DSSR §130  — LQA (annual rent + utility ceiling, by post & family size & grade group)
 *   DSSR §120  — TQSA (per-diem-equivalent for temporary quarters at arrival/departure)
 *   DCPAS LQA Worksheet & Eligibility Guide
 *   DoD Civilian JTR Chapter 5
 *
 * Mirrors the shape of src/lib/bahCalculator.js: hardcoded data tables plus
 * pure-function helpers. LQACalculatorTab imports from here so the
 * family-multiplier + grade-tier math can be unit-tested independently of JSX.
 *
 * Source / freshness: see DATA_VERSIONS.lqa in src/config/dataVersions.js.
 *
 * LQA grade groups (DSSR §134.16):
 *   Group 1 — GS-15 / SES / equivalents (most senior)
 *   Group 2 — GS-13/14 / O-4 to O-6 equivalents
 *   Group 3 — GS-9 to GS-12 / O-1 to O-3 equivalents
 *   Group 4 — GS-1 to GS-8 / WG / enlisted equivalents (most junior)
 *
 * Family size buckets (DSSR §134.16):
 *   1 person | 2 persons | 3-4 persons | 5-6 persons | 7+ persons
 *   The 5-6 and 7+ buckets layer 10% / 20% multipliers on top of the 3-4 base.
 */

export const GRADE_GROUPS = [
  { value: 'g1', label: 'Group 1 — GS-15 / SES / O-7+', tier: 1.00 },
  { value: 'g2', label: 'Group 2 — GS-13/14 / O-4 to O-6', tier: 0.92 },
  { value: 'g3', label: 'Group 3 — GS-9 to GS-12 / O-1 to O-3', tier: 0.84 },
  { value: 'g4', label: 'Group 4 — GS-1 to GS-8 / WG / E-grades', tier: 0.78 },
];

// LQA annual ceilings (USD) per post for the GROUP 1 / 2-person baseline.
// Family-size and grade-group adjustments are applied dynamically below.
// Source: DSSR §920 country tables (see DATA_VERSIONS.lqa for effective date).
//
// Family multipliers (DSSR §134.16):
//   1 person   : 0.90 of the published 2-person ceiling
//   2 persons  : 1.00 (base reference)
//   3-4 persons: 1.10
//   5-6 persons: 1.20
//   7+ persons : 1.30
//
// Group multipliers are applied to the family-adjusted ceiling.
export const LQA_POSTS = {
  'Germany (Kaiserslautern / Ramstein)': {
    flag: '🇩🇪',
    country: 'Germany',
    installations: ['Ramstein AB', 'Kaiserslautern', 'Landstuhl', 'Baumholder'],
    baseAnnual: 46800,  // 2-person Group 1 ceiling (USD/year)
    tqsaDailyMax: 220,  // First 30 days, occupant only (USD/day)
    notes: 'Kaiserslautern Military Community (KMC) — largest US civilian + military community in Europe. LQA paid in USD; renew annually via SF-1190.',
  },
  'Germany (Stuttgart)': {
    flag: '🇩🇪',
    country: 'Germany',
    installations: ['USAG Stuttgart', 'Patch Barracks', 'Kelley Barracks'],
    baseAnnual: 52800,
    tqsaDailyMax: 245,
    notes: 'Hosts AFRICOM/EUCOM HQ. Stuttgart housing market is competitive — verify quarterly LQA ceiling before signing a lease.',
  },
  'Germany (Grafenwoehr / Vilseck / Ansbach)': {
    flag: '🇩🇪',
    country: 'Germany',
    installations: ['Grafenwoehr', 'Vilseck', 'Tower Barracks', 'Ansbach'],
    baseAnnual: 42000,
    tqsaDailyMax: 200,
    notes: 'Bavaria training communities. Mix of on-post and host-nation housing. DCPAS LQA worksheet required before lease execution.',
  },
  'South Korea (Camp Humphreys)': {
    flag: '🇰🇷',
    country: 'South Korea',
    installations: ['USAG Humphreys', 'Pyeongtaek'],
    baseAnnual: 36000,
    tqsaDailyMax: 195,
    notes: 'Camp Humphreys — largest US overseas installation. SOFA governs housing. Most civilians use on-post or USFK-managed off-post housing.',
  },
  'South Korea (Seoul / Yongsan)': {
    flag: '🇰🇷',
    country: 'South Korea',
    installations: ['Yongsan Garrison', 'Seoul', 'USAG Yongsan-Casey'],
    baseAnnual: 50400,
    tqsaDailyMax: 240,
    notes: 'Yongsan transition to Camp Humphreys is largely complete; civilian presence in Seoul remains for select missions.',
  },
  'Japan (Tokyo / Yokota)': {
    flag: '🇯🇵',
    country: 'Japan',
    installations: ['Yokota AB', 'Tokyo metro', 'Camp Zama'],
    baseAnnual: 65400,
    tqsaDailyMax: 295,
    notes: 'Tokyo metro is among the highest LQA areas worldwide. Verify quarterly DSSR adjustments; Yen-USD swings drive frequent rate changes.',
  },
  'Japan (Okinawa)': {
    flag: '🇯🇵',
    country: 'Japan',
    installations: ['Kadena AB', 'MCB Camp Butler', 'Torii Station'],
    baseAnnual: 45000,
    tqsaDailyMax: 215,
    notes: 'Okinawa housing market is military-heavy. On-base housing usually preferred; off-base requires base-issued housing referral.',
  },
  'Italy (Vicenza / Aviano)': {
    flag: '🇮🇹',
    country: 'Italy',
    installations: ['Caserma Ederle', 'Aviano AB', 'USAG Italy'],
    baseAnnual: 40800,
    tqsaDailyMax: 200,
    notes: 'Vicenza area is a Status of Forces community with established US civilian presence. LQA tracks local euro rents quarterly.',
  },
  'United Kingdom (RAF Lakenheath / Mildenhall)': {
    flag: '🇬🇧',
    country: 'United Kingdom',
    installations: ['RAF Lakenheath', 'RAF Mildenhall', 'RAF Feltwell'],
    baseAnnual: 55200,
    tqsaDailyMax: 245,
    notes: 'East Anglia (Suffolk) base cluster. Civilian Sponsors of Status (CSO) status affects LQA eligibility; verify with HR before transfer.',
  },
  'Belgium (SHAPE / Brussels)': {
    flag: '🇧🇪',
    country: 'Belgium',
    installations: ['SHAPE', 'Chievres AB', 'Brussels'],
    baseAnnual: 49200,
    tqsaDailyMax: 230,
    notes: 'NATO host-nation. SHAPE community is mostly international; Brussels postings have a higher LQA ceiling reflecting metro rents.',
  },
  'Spain (Rota / Moron)': {
    flag: '🇪🇸',
    country: 'Spain',
    installations: ['NS Rota', 'Moron AB'],
    baseAnnual: 38400,
    tqsaDailyMax: 190,
    notes: 'Naval / Air communities in Andalusia. LQA ceilings track Cadiz/Seville rental markets; relatively stable quarter-to-quarter.',
  },
  'Bahrain (NSA Bahrain)': {
    flag: '🇧🇭',
    country: 'Bahrain',
    installations: ['NSA Bahrain', 'Manama'],
    baseAnnual: 60000,
    tqsaDailyMax: 275,
    notes: 'NAVCENT/5th Fleet HQ. High-cost metro; LQA ceiling reflects compound housing market.',
  },
  'Guam (Andersen / Naval Base Guam)': {
    flag: '🇬🇺',
    country: 'Guam',
    installations: ['Andersen AFB', 'Naval Base Guam'],
    baseAnnual: 42000,
    tqsaDailyMax: 215,
    notes: 'U.S. territory but DSSR / TQSA still apply for federal civilians on overseas tour status.',
  },
};

export const POST_KEYS = Object.keys(LQA_POSTS);

export const FAMILY_BUCKETS = [
  { value: 1,  label: '1 person',   mult: 0.90 },
  { value: 2,  label: '2 persons',  mult: 1.00 },
  { value: 4,  label: '3–4 persons', mult: 1.10 },
  { value: 6,  label: '5–6 persons', mult: 1.20 },
  { value: 7,  label: '7+ persons', mult: 1.30 },
];

// TQSA percentage of daily max by day-range (DSSR §123.2):
//   Days 1-30  — 100% (occupant), 75% each family member 12+, 50% under 12
//   Days 31-60 — 80% occupant, 60% each family member 12+, 40% under 12
//   Days 61-90 — 55% occupant, 40% each family member 12+, 25% under 12
export const TQSA_TIERS = [
  { label: 'Days 1-30',  occupant: 1.00, adultDep: 0.75, childDep: 0.50 },
  { label: 'Days 31-60', occupant: 0.80, adultDep: 0.60, childDep: 0.40 },
  { label: 'Days 61-90', occupant: 0.55, adultDep: 0.40, childDep: 0.25 },
];

export function formatCurrencyLQA(n) {
  return n != null ? `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';
}

// Heuristic: guess the LQA post from the gaining installation. Matches
// substring against the installations[] for each post.
export function detectPost(gainingInstallation) {
  const g = String(gainingInstallation || '').toLowerCase();
  if (!g) return null;
  for (const [post, data] of Object.entries(LQA_POSTS)) {
    for (const inst of data.installations) {
      if (g.includes(inst.toLowerCase())) return post;
    }
  }
  return null;
}

// Default the grade group from a profile paygrade. GS-15/SES → g1,
// GS-13/14 → g2, GS-9 to 12 → g3, lower → g4.
export function detectGroup(paygrade) {
  const p = String(paygrade || '').toUpperCase();
  if (/^GS-15$|^SES/.test(p)) return 'g1';
  if (/^GS-(13|14)$/.test(p)) return 'g2';
  if (/^GS-(9|10|11|12)$/.test(p)) return 'g3';
  if (/^GS-/.test(p) || /^WG-/.test(p) || /^WL-/.test(p) || /^WS-/.test(p)) return 'g4';
  return 'g2';
}

function lookupGroupTier(group) {
  return GRADE_GROUPS.find(g => g.value === group)?.tier ?? 1.00;
}

function lookupFamilyMult(familySize) {
  // FAMILY_BUCKETS values are the UPPER bound of each range (4 = "3–4
  // persons", 6 = "5–6", 7 = "7+"). Snap an arbitrary head-count to its
  // bucket so a family of 3 or 5 gets the right multiplier instead of
  // silently falling through to 1.00.
  const n = Math.max(1, Math.floor(Number(familySize) || 1));
  const bucket = FAMILY_BUCKETS.find(b => n <= b.value) || FAMILY_BUCKETS[FAMILY_BUCKETS.length - 1];
  return bucket.mult;
}

// Annual LQA ceiling for (post, grade-group, family-size). Mirrors how the
// component derives the headline number — Math.round on the product of
// baseAnnual × familyMult × groupTier. Returns 0 when post is unknown.
export function calculateAnnualLQA({ post, group, familySize }) {
  const postData = LQA_POSTS[post];
  if (!postData) return 0;
  const familyMult = lookupFamilyMult(familySize);
  const groupTier = lookupGroupTier(group);
  return Math.round((postData.baseAnnual || 0) * familyMult * groupTier);
}

export function calculateMonthlyLQA({ post, group, familySize }) {
  const annual = calculateAnnualLQA({ post, group, familySize });
  return Math.round(annual / 12);
}

// Per-tier TQSA daily totals. Occupant share + per-adult-dep + per-child-dep,
// rounded the same way the component does (round each component, then sum).
// Returns an array shaped { label, occupant, adults, children, total } per tier.
export function calculateTQSARows({ post, adultDeps = 0, childDeps = 0 }) {
  const postData = LQA_POSTS[post];
  const tqsaBase = postData?.tqsaDailyMax || 0;
  // Dependent counts can never be negative or fractional; clamp so a bad
  // caller can't produce a negative daily total (the UI dropdowns are
  // bounded, but this function is exported and reused).
  const safeAdultDeps = Math.max(0, Math.floor(Number(adultDeps) || 0));
  const safeChildDeps = Math.max(0, Math.floor(Number(childDeps) || 0));
  return TQSA_TIERS.map(tier => {
    const occupant = Math.round(tqsaBase * tier.occupant);
    const adults = Math.round(tqsaBase * tier.adultDep) * safeAdultDeps;
    const children = Math.round(tqsaBase * tier.childDep) * safeChildDeps;
    const total = occupant + adults + children;
    return { label: tier.label, occupant, adults, children, total };
  });
}
