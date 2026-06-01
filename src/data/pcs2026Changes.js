/*
 * pcs2026Changes.js — 2026 PCS policy-change awareness data.
 *
 * Planning-awareness summaries for an in-app card so service members and
 * families are not blindsided by the structural PCS changes landing in 2026.
 * These are plain-English digests of public DoD / DTMO / press reporting as
 * of 2026-05; they are NOT a substitute for official guidance. Policy and
 * dates can shift — ALWAYS confirm with your gaining/losing Personal
 * Property Office, your orders, and the official sources linked in each
 * entry before making a financial or scheduling decision.
 *
 * Shape: { id, title, summary, impact, sourceUrl }
 *   - summary: 1-2 plain-English sentences describing the change.
 *   - impact:  who it affects and what to do.
 *   - sourceUrl: a real, public source for the claim.
 */

export const PCS_2026_CHANGES = Object.freeze([
  {
    id: 'ghc-homesafe-terminated',
    title: 'HomeSafe / Global Household Goods Contract (GHC) ended',
    summary:
      'In June 2025 U.S. Transportation Command terminated the GHC with HomeSafe Alliance for cause, ending the single-contractor experiment. Household-goods moves revert to the legacy Tender of Service system run through local installation Personal Property Offices.',
    impact:
      'Affects everyone shipping HHG. Work your move through your installation Personal Property Office (PPO) and DPS (move.mil) — not HomeSafe. Moves already in progress under HomeSafe are being completed; new shipments use the legacy process.',
    sourceUrl:
      'https://www.militarytimes.com/news/pentagon-congress/2025/06/20/dod-terminates-troubled-homesafe-contract-for-military-moves/',
  },
  {
    id: 'personal-property-activity',
    title: 'New DoD Personal Property Activity stands up (Scott AFB, May 1, 2026)',
    summary:
      'The temporary PCS Joint Task Force is being made permanent as the Personal Property Activity, which stands up May 1, 2026 at Scott AFB, Illinois and reports directly to the Secretary of Defense. It consolidates the Defense Personal Property Program under a single accountable command (first commander: Maj. Gen. Lance Curtis).',
    impact:
      'Aimed at clearer accountability and faster problem resolution across the services. If a move issue stalls, expect a single chain to escalate to rather than service-by-service handoffs.',
    sourceUrl:
      'https://www.stripes.com/theaters/us/2026-01-23/hegseth-personal-property-activity-permanent-20504176.html',
  },
  {
    id: 'orders-210-days',
    title: 'PCS orders now issued up to 210 days in advance',
    summary:
      'Orders lead time is being extended so families can receive PCS orders up to about 210 days ahead, instead of the roughly 60 days that had become common under recent funding pressure.',
    impact:
      'More runway to plan: schedule HHG pickup early, research housing/schools, line up finances, and book pets/POV shipment sooner. Start your timeline as soon as orders arrive — peak-season slots fill fast.',
    sourceUrl:
      'https://www.military.com/spouse/military-relocation/pcs-moves/3-big-pcs-changes-are-coming-once-heres-what-service-members-need-know-peak-season.html',
  },
  {
    id: 'discretionary-move-reduction',
    title: 'Planned reduction of discretionary PCS moves (ramping to FY2030)',
    summary:
      'DoD directed the services to cut discretionary PCS move budgets — staggered roughly 10% in FY2027, 30% in FY2028, 40% in FY2029, and 50% by FY2030. Discretionary moves include some career-development and education-related relocations; operational moves are not targeted.',
    impact:
      'Some non-operational moves may be deferred, consolidated, or denied over the next few years. If a desired move is discretionary, confirm funding and authorization with your branch assignment manager before committing.',
    sourceUrl:
      'https://www.military.com/spouse/military-relocation/pcs-moves/3-big-pcs-changes-are-coming-once-heres-what-service-members-need-know-peak-season.html',
  },
  {
    id: 'fy2026-rate-bumps',
    title: 'FY2026 / CY2026 entitlement rate updates',
    summary:
      'CY2026 brings refreshed PCS entitlement figures: Dislocation Allowance (DLA) rose about 3.8% over 2025; the MALT POV mileage rate is $0.205/mile (unchanged from 2025); and the PCS pet reimbursement caps are $550 CONUS, $2,000 OCONUS, and up to $4,000 for high-risk-rabies OCONUS moves.',
    impact:
      'Affects every PCS budget. Use the current figures when estimating DLA, mileage, and pet costs, and confirm your exact grade-based DLA amount on the DTMO rate table before filing your voucher (DD 1351-2).',
    sourceUrl:
      'https://www.travel.dod.mil/Travel-Transportation-Rates/Dislocation-Allowance/',
  },
]);

export default PCS_2026_CHANGES;
