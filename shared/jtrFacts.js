/*
 * PCS Express — verified entitlement figures, shared by every AI surface.
 *
 * WHY THIS EXISTS: the AI Assistant system prompt forbids inventing figures,
 * but an instruction alone is not grounding. Asked "E-5 with a spouse and two
 * kids — what is my HHG weight allowance?" the model returned 12,000 / 8,000 /
 * 8,000 lbs on three consecutive runs, each with a different invented "JTR
 * Table" number, while the app's own PPM Estimator used the correct 9,000. A
 * member who packs to 12,000 against a 9,000 lb allowance is billed for the
 * 3,000 lb overage. Same failure on TLE ("10 days" vs the app's 21) and the
 * PPM incentive ("about 95%" vs the app's 100%, raised in 2021).
 *
 * Two mitigations are built here and applied on BOTH jtr-assistant handlers
 * (api/jtr-assistant.js on Vercel, and the Express route in server/index.js
 * that every shipped iOS/Android build talks to directly — see
 * src/config/apiConfig.js):
 *
 *   1. VERIFIED_FIGURES_PROMPT_BLOCK is appended to the system prompt so the
 *      model quotes the app's own numbers instead of recalling its own.
 *   2. resolveVerifiedFigureAnswer() intercepts the figure-shaped questions
 *      that were measured wrong and answers them deterministically from these
 *      tables, without reaching a provider at all. Deterministic beats
 *      "usually right": the same question must not produce three answers.
 *
 * SINGLE SOURCE OF TRUTH: the weight tables and the PPM rates are IMPORTED
 * from src/lib/ppmCalculator.js — the same module the PPM Estimator computes
 * with — so the assistant and the calculator can never disagree. The remaining
 * figures are asserted against src/data/jtrKnowledgeBase.js prose by
 * tests/unit/jtrFacts.test.mjs, which fails if either copy drifts.
 *
 * This module is plain data + pure functions with no Node/browser/React
 * dependency, so it bundles into the Vercel functions, runs under Express, and
 * unit-tests directly.
 */

import {
  HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS,
  HHG_WEIGHT_ALLOWANCE_WITHOUT_DEPENDENTS_LBS,
  PPM_CONFIG,
} from '../src/lib/ppmCalculator.js';

/**
 * Every figure PCS Express has verified against an official source. Anything
 * NOT in here is a figure the app has not verified — the assistant must state
 * the rule structure and defer to DTMO rather than produce a number.
 */
export const VERIFIED_FIGURES = Object.freeze({
  hhgWithDependentsLbs: HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS,
  hhgWithoutDependentsLbs: HHG_WEIGHT_ALLOWANCE_WITHOUT_DEPENDENTS_LBS,
  civilianFlatWeightLbs: 18000,
  proGearSponsorLbs: 2000,
  proGearSpouseLbs: 500,
  ppmIncentivePercentOfGcc: Math.round(PPM_CONFIG.incentiveRate * 100),
  ppmFederalWithholdingPercent: Math.round(PPM_CONFIG.federalTaxWithholdingRate * 100),
  tleDaysConus: 21,
  tlaDaysOconus: 60,
  tlaDaysOconusExtended: 100,
  maltRatePerMileUsd: 0.205,
  petCapConusUsd: 550,
  petCapOconusUsd: 2000,
  petCapHighRabiesRiskUsd: 4000,
  sitDaysStandard: 90,
  sitDaysMax: 180,
  claimNoticeDays: 180,
  claimFullValueMonths: 9,
});

/**
 * Citations exactly as PCS Express states them elsewhere in the app. Note the
 * weight-allowance citation deliberately carries NO table number: the JTR
 * renamed the old Table 5-37 to the "Table of Weight Allowances", and every
 * wrong answer measured in production invented a plausible-looking number
 * ("Table 5-7", "Table 5-2"). Never emit a numbered table.
 */
export const VERIFIED_CITATIONS = Object.freeze({
  weightAllowance: 'JTR, Table of Weight Allowances (civilians: FTR §302-7)',
  tle: 'JTR §050501 (TLE) / §050502 (TLA)',
  ppmIncentive: 'JTR §050302 / DTR 4500.9-R Part IV (Best Value / 100% GCC)',
  malt: 'JTR §020205 / DTMO MAP 73-25(I) (CY2026)',
});

/**
 * Standing caveat appended to every intercepted answer. PCS Express is a
 * planning aid, not a finance authority, and is not affiliated with or
 * endorsed by the DoD — so an entitlement figure is always pointed back at the
 * member's own transportation/finance office.
 */
const VERIFY_LINE = 'Confirm against your orders and your transportation office (PPSO/TMO) or DTMO before you rely on it — PCS Express is a planning aid, not a finance authority.';

const PAYGRADES = Object.keys(HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS);

const fmtLbs = (n) => `${n.toLocaleString('en-US')} lbs`;

function weightTableLines() {
  return PAYGRADES
    .map(g => `    ${g}: ${HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS[g].toLocaleString('en-US')} with dependents / ${HHG_WEIGHT_ALLOWANCE_WITHOUT_DEPENDENTS_LBS[g].toLocaleString('en-US')} without`)
    .join('\n');
}

/**
 * Appended to the AI Assistant system prompt on BOTH handlers. Built from the
 * constants above so a change to the app's tables propagates to the prompt
 * with no second copy to keep in sync.
 *
 * Kept out of the AI_ASSISTANT_SYSTEM_PROMPT literal on purpose: that literal
 * is byte-compared across the two handlers by
 * tests/unit/ai-assistant-prompt-parity.test.mjs, and appending a shared
 * import instead of editing two literals removes the drift hazard entirely.
 */
export const VERIFIED_FIGURES_PROMPT_BLOCK = `

VERIFIED FIGURES — these are the numbers PCS Express itself uses in its calculators. They override anything you recall. Quote them EXACTLY.

  HHG weight allowance, in pounds (JTR Table of Weight Allowances):
${weightTableLines()}
    DoD civilians: a flat ${VERIFIED_FIGURES.civilianFlatWeightLbs.toLocaleString('en-US')} lbs regardless of grade (FTR §302-7).
    Pro-gear is exempt on top of the allowance: up to ${VERIFIED_FIGURES.proGearSponsorLbs.toLocaleString('en-US')} lbs sponsor + ${VERIFIED_FIGURES.proGearSpouseLbs} lbs spouse.

  TLE (CONUS): up to ${VERIFIED_FIGURES.tleDaysConus} days combined across the losing and gaining stations (raised from 14 effective 27 Nov 2024).
  TLA (OCONUS): up to ${VERIFIED_FIGURES.tlaDaysOconus} days, extensible to ${VERIFIED_FIGURES.tlaDaysOconusExtended}.
  PPM / DITY incentive: ${VERIFIED_FIGURES.ppmIncentivePercentOfGcc}% of the Government Constructive Cost (raised from 95% in 2021). The temporary 130% rate expired 30 Sep 2025.
  PPM federal withholding on the taxable profit: ${VERIFIED_FIGURES.ppmFederalWithholdingPercent}% (IRS supplemental-wage flat rate).
  MALT (PCS POV mileage): $${VERIFIED_FIGURES.maltRatePerMileUsd.toFixed(3)} per authorized mile for CY2026.
  Pet shipment reimbursement cap, per move (one cat or dog): $${VERIFIED_FIGURES.petCapConusUsd} CONUS / $${VERIFIED_FIGURES.petCapOconusUsd.toLocaleString('en-US')} OCONUS / $${VERIFIED_FIGURES.petCapHighRabiesRiskUsd.toLocaleString('en-US')} high-rabies-risk with Secretarial-process approval.
  SIT (storage in transit): ${VERIFIED_FIGURES.sitDaysStandard} days standard, extensible to ${VERIFIED_FIGURES.sitDaysMax}.
  Loss/damage claim: report in DPS within ${VERIFIED_FIGURES.claimNoticeDays} days of delivery; file within ${VERIFIED_FIGURES.claimFullValueMonths} months for full replacement value (12 months for pickups on/after 15 May 2026).

Figure rules (these outrank the general rules above):
  - A number you state MUST come from this block verbatim. If the question needs a figure that is not here, say plainly that PCS Express has not verified that figure, describe the rule instead, and send the member to DTMO / their finance office. Refusing to give a number is always better than giving a wrong one.
  - NEVER cite a numbered JTR table (there is no "Table 5-2" or "Table 5-7" to quote). Cite "${VERIFIED_CITATIONS.weightAllowance}" for weight allowances, and the section number only for everything else.
  - Weight allowances depend on dependency status. If the member has not said whether they have dependents, give both figures rather than guessing.
  - Close any entitlement figure by telling the member to confirm it with their transportation office (PPSO/TMO) or DTMO. Never present a figure as authoritative and never suggest DoD endorses PCS Express.`;

// ── Deterministic intercept ─────────────────────────────────────────────
//
// A figure-shaped question is answered from the tables above and never reaches
// a provider, so the same question cannot produce three different answers.
// Every matcher requires BOTH a topic term and a figure-seeking term; anything
// less specific falls through to the (now grounded) model.

const RANK_RE = /\b([EWOewo])[\s-]?(\d{1,2})\b/;
const HAS_DEPENDENTS_RE = /\b(spouse|wife|husband|married|kids?|child|children|dependents?|family|son|daughter)\b/i;
const NO_DEPENDENTS_RE = /\b(no dependents|without dependents|no kids|no children|single|unaccompanied|geo[\s-]?bachelor|geographic bachelor)\b/i;
const CIVILIAN_RE = /\b(dod civilian|civilian employee|as a civilian|gs-?\d{1,2}|ftr)\b/i;
const FIGURE_RE = /\b(how (much|many)|how big|what('| i)?s? my|allowance|allowed|entitle\w*|limit|cap|maximum|max|number of|days|percent|percentage|rate|pounds|lbs)\b|%/i;

function normalizeRank(q) {
  const m = RANK_RE.exec(q);
  if (!m) return null;
  const rank = `${m[1].toUpperCase()}-${String(Number(m[2]))}`;
  return PAYGRADES.includes(rank) ? rank : null;
}

function dependencyStatus(q) {
  if (NO_DEPENDENTS_RE.test(q)) return false;
  if (HAS_DEPENDENTS_RE.test(q)) return true;
  return null; // unstated — answer with both figures rather than guessing
}

function weightAnswer(q) {
  const isWeightTopic = /\b(weight|hhg|household goods|pounds|lbs)\b/i.test(q)
    && /\b(allowance|allowed|entitle\w*|limit|cap|maximum|max|how (much|many)|ship)\b/i.test(q);
  if (!isWeightTopic) return null;

  if (CIVILIAN_RE.test(q) && !RANK_RE.test(q)) {
    return `DoD civilians get a flat ${fmtLbs(VERIFIED_FIGURES.civilianFlatWeightLbs)} HHG weight allowance regardless of grade — there is no rank-tiered table on the civilian side (FTR §302-7). Professional books, papers and equipment are exempt on top of that. ${VERIFY_LINE}`;
  }

  const rank = normalizeRank(q);
  if (!rank) return null;

  const withDeps = VERIFIED_FIGURES.hhgWithDependentsLbs[rank];
  const withoutDeps = VERIFIED_FIGURES.hhgWithoutDependentsLbs[rank];
  const status = dependencyStatus(q);
  const proGear = `Pro-gear (professional books, papers and equipment) is exempt on top of that — up to ${fmtLbs(VERIFIED_FIGURES.proGearSponsorLbs)} for you and ${VERIFIED_FIGURES.proGearSpouseLbs} lbs for your spouse — and does not count against the allowance. Anything you ship above the allowance is billed to you at your own expense.`;

  if (status === true) {
    return `Your HHG weight allowance as an ${rank} with dependents is ${fmtLbs(withDeps)}. ${proGear} Citation: ${VERIFIED_CITATIONS.weightAllowance}. ${VERIFY_LINE}`;
  }
  if (status === false) {
    return `Your HHG weight allowance as an ${rank} without dependents is ${fmtLbs(withoutDeps)}. ${proGear} Citation: ${VERIFIED_CITATIONS.weightAllowance}. ${VERIFY_LINE}`;
  }
  return `Your HHG weight allowance depends on dependency status. For an ${rank} it is ${fmtLbs(withDeps)} with dependents and ${fmtLbs(withoutDeps)} without. ${proGear} Citation: ${VERIFIED_CITATIONS.weightAllowance}. ${VERIFY_LINE}`;
}

function tleAnswer(q) {
  const isTleTopic = /\b(tle|tla|temporary lodging)\b/i.test(q);
  if (!isTleTopic || !FIGURE_RE.test(q)) return null;
  return `TLE (Temporary Lodging Expense, CONUS) covers up to ${VERIFIED_FIGURES.tleDaysConus} days, combined across your losing and gaining duty stations — raised from 14 days effective 27 Nov 2024. OCONUS you get TLA (Temporary Lodging Allowance) instead: up to ${VERIFIED_FIGURES.tlaDaysOconus} days, extensible to ${VERIFIED_FIGURES.tlaDaysOconusExtended}. Both reimburse lodging up to the locality per-diem ceiling plus a share of M&IE based on family size. Citation: ${VERIFIED_CITATIONS.tle}. ${VERIFY_LINE}`;
}

function ppmIncentiveAnswer(q) {
  const isPpmTopic = /\b(ppm|dity|personally procured|government constructive cost|gcc)\b/i.test(q);
  // Deliberately narrow: "how do I maximize my PPM payout?" is a strategy
  // question the curated KB and the model answer better, and must NOT be
  // swallowed by this rate-figure intercept.
  const isRateQuestion = /\b(percent|percentage|rate|how much|what (share|portion)|reimburse\w*)\b/i.test(q) || /%/.test(q);
  if (!isPpmTopic || !isRateQuestion) return null;
  return `A PPM (formerly DITY) pays ${VERIFIED_FIGURES.ppmIncentivePercentOfGcc}% of the Government Constructive Cost — what the government would have paid to move the same shipment — up to your weight allowance. It was raised from 95% to ${VERIFIED_FIGURES.ppmIncentivePercentOfGcc}% in 2021, and the temporary 130% rate applied only to moves between 15 May and 30 Sep 2025. Certified empty and full weight tickets are required or the claim is not paid, and ${VERIFIED_FIGURES.ppmFederalWithholdingPercent}% federal tax is withheld from the profit above your documented expenses. Citation: ${VERIFIED_CITATIONS.ppmIncentive}. ${VERIFY_LINE} PCS Express's PPM Estimator (Movement & Logistics) runs this math against your own weight and distance.`;
}

function maltAnswer(q) {
  const isMaltTopic = /\b(malt|mileage rate|cents per mile|per[\s-]?mile|monetary allowance in lieu)\b/i.test(q);
  if (!isMaltTopic || !FIGURE_RE.test(q)) return null;
  return `MALT (Monetary Allowance in Lieu of Transportation) for PCS travel by POV is $${VERIFIED_FIGURES.maltRatePerMileUsd.toFixed(3)} per authorized mile for CY2026, unchanged from CY2025. It is set by DTMO and is much lower than the IRS business mileage rate. Distance comes from the Defense Table of Official Distances (DTOD), not your odometer. Citation: ${VERIFIED_CITATIONS.malt}. ${VERIFY_LINE}`;
}

/**
 * Returns { answer, source } for a question PCS Express can answer exactly
 * from its own verified tables, or null to let the (grounded) model answer.
 *
 * Callers must run this AFTER every existing gate — origin, rate limit, AI
 * consent, body caps, PII — so the security posture is unchanged; the only
 * difference is that a matched question is answered locally instead of being
 * transmitted to a provider.
 */
export function resolveVerifiedFigureAnswer(question) {
  const q = String(question || '');
  if (!q.trim()) return null;
  const answer = weightAnswer(q) || tleAnswer(q) || ppmIncentiveAnswer(q) || maltAnswer(q);
  return answer ? { answer, source: 'pcs-express-verified' } : null;
}
