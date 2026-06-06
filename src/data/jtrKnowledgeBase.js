/*
 * PCS Express — shared JTR / FTR / DSSR / IRS knowledge base.
 *
 * Single source of truth for the curated, citation-backed answers used by
 * BOTH the JTR Assistant tab (JTRAssistantModule) and the floating AI
 * Assistant chip (AIAssistantChip). Plain data + pure search helpers, no
 * React imports, so it can be unit-tested directly in Node.
 *
 * Accuracy posture: every entry cites an official regulation (JTR / FTR /
 * DSSR / IRC / IRS Pub / DTMO). Specific dollar figures appear ONLY where
 * verified against official sources (pet caps, MALT, weight allowances);
 * otherwise the answer states the rule structure and points the member to
 * the live DTMO / finance source for the exact current amount. Do NOT add
 * fabricated dollar amounts — cite the section and defer to the official
 * lookup.
 *
 * Each entry: { id, q, a, tags[], citation }.
 */

export const JTR_KB = [
  {
    id: 'ppm-max',
    q: 'How do I maximize my PPM (Personally Procured Move) payout?',
    a: `PPM (formerly DITY) reimburses 100 % of the Best Value Cost the government would have paid for the same shipment, up to your weight allowance, when you move yourself. To maximize the payout:
1) Weigh empty, then weigh fully loaded — keep both certified weight tickets. Without them you do not get paid.
2) Stay at or below your authorized weight allowance for your grade and dependency status — overweight pounds are not reimbursed.
3) Track every direct moving expense (rental truck, fuel, packing materials, tolls, hired labor, tow dolly). These reduce your taxable income on the PPM payment via IRS Form 3903.
4) Submit through DPS within 45 days of arrival.`,
    tags: ['ppm','dity','max','payout','reimbursement','weight','hhg'],
    citation: 'JTR §050302 / DTMO PPM Worksheet / IRS Form 3903',
  },
  {
    id: 'tle-cap',
    q: 'How many days of TLE / TLA am I entitled to?',
    a: `Temporary Lodging Expense (TLE) covers up to 14 days for CONUS PCS — combined between losing and gaining duty stations.
TLA (Temporary Lodging Allowance) covers up to 60 days OCONUS (extensible to 100). Both reimburse the lodging cost up to the locality per-diem ceiling plus a percentage of M&IE based on family size.`,
    tags: ['tle','tla','temporary lodging','per diem','m&ie','allowance'],
    citation: 'JTR §050501 (TLE) / §050502 (TLA)',
  },
  {
    id: 'dla',
    q: 'What is Dislocation Allowance (DLA) and how much will I get?',
    a: `DLA is a one-time payment that partially reimburses miscellaneous PCS expenses (utility deposits, cleaning, supplies). It is paid automatically on PCS to/from any duty station. The amount is set by grade and dependency status — roughly two months of the With-Dependents BAH at the sponsor's rank (or the without-dependents amount for unaccompanied moves). CY2026 DLA rates rose about 3.8% over CY2025. DTMO publishes the exact dollar table each year — confirm your grade's figure there.`,
    tags: ['dla','dislocation','allowance','reimbursement','miscellaneous'],
    citation: 'JTR §050601 / DTMO MAP 72-25(I) (CY2026)',
  },
  {
    id: 'dla-partial-advance',
    q: 'Can I get Partial DLA or an advance DLA before I move?',
    a: `Partial DLA (a small fixed amount) may be authorized when you are ordered to vacate/occupy government family housing without a PCS. Advance DLA: you can request your full DLA in advance of the move through finance so the cash is in hand for deposits and out-of-pocket costs — it's then settled on your PCS voucher. Ask your finance office (or use myPay advance requests where supported).`,
    tags: ['dla','partial','advance','advance dla','deposit','finance'],
    citation: 'JTR §050601 / 37 USC §452',
  },
  {
    id: 'advance-pay',
    q: 'Can I get advance pay for a PCS?',
    a: `Yes. PCS advance pay (often called "advance basic pay") lets you draw up to ~3 months of basic pay to cover relocation costs, repaid through payroll deduction over up to 12 months (extendable to 24 with command approval). You can also advance DLA, advance per diem (travel), and advance OHA/housing for OCONUS. Apply through your finance office before departure. Borrow only what you need — it's a debt repaid from future paychecks.`,
    tags: ['advance pay','advance','pay','pcs','loan','finance','relocation','basic pay'],
    citation: 'JTR Ch 2 / 37 USC §1006',
  },
  {
    id: 'pov-ship',
    q: 'When can I ship my POV at government expense?',
    a: `One POV may be shipped at government expense on OCONUS PCS (e.g., Korea, Japan, Germany). CONUS-to-CONUS PCS does not authorize POV shipment — you drive or pay yourself. Use DD Form 788 and the Vehicle Processing Center (VPC) network at vpcus.com to schedule the drop. Second-POV shipment may be authorized at specific overseas locations with prior approval.`,
    tags: ['pov','vehicle','ship','vpc','dd 788','oconus','car'],
    citation: 'JTR §053201 / 32 CFR 102.2',
  },
  {
    id: 'oconus-bah',
    q: 'Do I get BAH overseas?',
    a: `No — BAH does not apply OCONUS. Service members assigned overseas receive Overseas Housing Allowance (OHA) at the locality rent ceiling, plus the Utility/Recurring Maintenance Allowance and a one-time Move-In Housing Allowance (MIHA-Rent / MIHA-Security / MIHA-Miscellaneous). DoD civilians receive Living Quarters Allowance (LQA) under DSSR §130. Look up the OHA rate at travel.dod.mil. (Puerto Rico, Guam, and the U.S. Virgin Islands are non-foreign OCONUS areas — they get OHA, not BAH; Alaska and Hawaii are BAH locations.)`,
    tags: ['bah','oha','miha','lqa','overseas','oconus','housing','puerto rico','guam'],
    citation: 'JTR §100301 (OHA) / DSSR §130 (LQA)',
  },
  {
    id: 'cola',
    q: 'What is OCONUS COLA and how is it different from OHA?',
    a: `Overseas Cost-of-Living Allowance (COLA) offsets higher prices for goods and services (NOT housing) at high-cost OCONUS locations. It's based on the location's COLA index, your grade, years of service, and dependents, and is adjusted periodically by DTMO. OHA covers housing/rent; COLA covers everyday living costs. There is also a separate CONUS COLA for a handful of high-cost U.S. locations. Look up your location's COLA on the DTMO site.`,
    tags: ['cola','cost of living','overseas','oconus','allowance','conus cola'],
    citation: 'JTR Ch 9 (Overseas COLA) / DTMO COLA',
  },
  {
    id: 'pet-allowance',
    q: 'Is there a pet shipment allowance?',
    a: `Yes — for one cat or dog. The JTR authorizes reimbursement up to $550 for a CONUS PCS and up to $2,000 for an OCONUS PCS; OCONUS moves to a high-risk-for-rabies country where contracted/commercial pet transport is unavailable can be reimbursed up to $4,000 (requires Secretarial-process approval). Reimbursement is a single cap per move (not per pet) and covers qualifying costs — microchipping, vaccinations, rabies titers, quarantine, boarding, and required health certificates. Submit through your travel voucher (DD 1351-2).`,
    tags: ['pet','animal','shipment','allowance','reimbursement','quarantine','dog','cat'],
    citation: 'JTR §050107 / DTMO Pet Transportation Allowance',
  },
  {
    id: 'hht-civilian',
    q: 'Can I take a House Hunting Trip (HHT) before PCS?',
    a: `Civilian-only entitlement under the Federal Travel Regulation §302-5. HHT is a CONUS-only round trip for the employee and one accompanying family member to search for housing at the gaining locality, up to 10 days. Military service members do NOT get HHT — they use the regular DLA + TLE package instead. OCONUS DoD civilians do not get HHT; coordinate with the gaining Housing Office (HOMES.mil) for off-base reconnaissance.`,
    tags: ['hht','house hunting','civilian','ftr','conus'],
    citation: 'FTR §302-5',
  },
  {
    id: 'real-estate-allowance',
    q: 'Is selling / buying a home reimbursable on a civilian PCS?',
    a: `Yes — DoD civilians may claim the Real Estate Expense Allowance under FTR §302-11 for selling a primary residence at the losing locality and buying at the gaining locality. Reimbursable: broker commissions, closing costs, title insurance, attorney fees. Caps and percentages apply. Service members do NOT have a comparable benefit; military RE costs are out-of-pocket.`,
    tags: ['real estate','civilian','reimbursement','closing','broker','ftr','home sale'],
    citation: 'FTR §302-11',
  },
  {
    id: 'tqse-civilian',
    q: 'What is TQSE and how many days do civilians get?',
    a: `Temporary Quarters Subsistence Expense (TQSE) reimburses a DoD civilian for lodging and meals in temporary quarters around a CONUS PCS. Two methods: TQSE-Actual Expense (up to 60 days, extendable to 120 with approval) reimburses actual costs up to a daily ceiling; TQSE-Lump Sum pays a fixed amount based on the locality per diem and is not itemized. You choose the method before travel — lump sum is simpler, actual can pay more for long, expensive stays. OCONUS civilians use TQSA instead.`,
    tags: ['tqse','temporary quarters','subsistence','civilian','ftr','lodging'],
    citation: 'FTR §302-6',
  },
  {
    id: 'tqsa-civilian',
    q: 'What is TQSA for OCONUS DoD civilians?',
    a: `Temporary Quarters Subsistence Allowance (TQSA) covers a DoD civilian's temporary lodging and meals when arriving at (or departing from) an overseas post before permanent housing is set up. Under the DSSR it's generally up to 90 days after arrival and up to 30 days before final departure, paid at a declining percentage of the post per-diem rate based on family size. It is the OCONUS counterpart to TQSE; LQA covers permanent quarters afterward.`,
    tags: ['tqsa','temporary quarters','subsistence','civilian','oconus','dssr','lqa'],
    citation: 'DSSR §120 / §122',
  },
  {
    id: 'weight-allowance',
    q: 'How is my HHG weight allowance calculated?',
    a: `Weight allowance is set by rank and dependency status, per the JTR Table of Weight Allowances (formerly Table 5-37). Examples: E-5 with dependents = 9,000 lbs; E-9 with dependents = 15,000 lbs; O-1 with dependents = 12,000 lbs; O-6 with dependents = 18,000 lbs. DoD civilians get a flat 18,000 lbs regardless of grade under FTR §302-7. Pro-gear (books, instruments, tools of trade) is exempt up to 2,000 lbs sponsor + 500 lbs spouse and does NOT count against the allowance.`,
    tags: ['weight','allowance','hhg','rank','dependents','pro-gear'],
    citation: 'JTR (Table of Weight Allowances) / FTR §302-7',
  },
  {
    id: 'weight-tickets',
    q: 'How do I get certified weight tickets for a PPM?',
    a: `For a PPM you need an EMPTY weight (vehicle/trailer, you, no cargo) and a FULL weight (fully loaded) from a certified scale — the difference is your net moving weight. Use any state-certified/CAT scale (truck stops, moving companies, landfills, farm co-ops). Each ticket must show the date, weigh-master signature/certification, your name, and the vehicle. No certified tickets = no PPM payment. Keep the originals and upload them with your PPM claim in DPS.`,
    tags: ['weight ticket','ppm','dity','certified scale','empty','full','dps'],
    citation: 'JTR §050302 / DTMO PPM Worksheet',
  },
  {
    id: 'ppm-tax',
    q: 'Is my PPM (DITY) payment taxable?',
    a: `The PPM incentive is taxable income to the extent it exceeds your documented moving expenses, and DoD withholds federal tax (the 22% supplemental-wage rate) from that profit before paying you. Your qualified moving expenses (truck, fuel, supplies, tolls, labor) offset the taxable amount — claim them with IRS Form 3903 and keep every receipt. You receive a W-2 reflecting the taxable portion. State tax treatment varies; the installation Tax Center / VITA can help.`,
    tags: ['ppm','dity','tax','taxable','withholding','form 3903','22'],
    citation: 'IRS Form 3903 / IRS Pub 521 / DFAS',
  },
  {
    id: 'sit-storage',
    q: 'How long can my household goods sit in storage (SIT)?',
    a: `Storage-in-Transit (SIT) is temporary government-paid storage while you're between residences during a PCS. The standard authorization is up to 90 days, extendable to a maximum of 180 days with approval (request the extension through your transportation office before it expires). SIT can be at origin or destination. Anything beyond the authorized window converts to your expense, so confirm dates in DPS.`,
    tags: ['sit','storage in transit','storage','hhg','dps','90 days','180 days'],
    citation: 'JTR §0512 / DTR Part IV',
  },
  {
    id: 'nts-storage',
    q: 'What is Non-Temporary Storage (NTS)?',
    a: `Non-Temporary Storage (NTS) is long-term storage of household goods at government expense — typically authorized for an OCONUS or dependent-restricted/unaccompanied tour when you can't take everything with you, in lieu of shipping. The stored weight counts against your total weight allowance. Arrange it through your transportation office; it's released and shipped to your next duty station when you PCS again.`,
    tags: ['nts','non-temporary storage','storage','oconus','unaccompanied','dependent restricted'],
    citation: 'JTR §0513 / DTR Part IV',
  },
  {
    id: 'unaccompanied-baggage',
    q: 'What is Unaccompanied Baggage (UB) / express shipment?',
    a: `Unaccompanied Baggage (UB), also called an express or "pro-gear/essentials" shipment, is a small portion of your HHG (clothing, kitchen basics, cribs, professional gear) shipped FASTER than the main household goods so you have necessities on arrival — especially OCONUS. It's a sub-allowance within your total weight allowance (a few hundred to ~1,000 lbs depending on tour/location). Flag it when you set up your move in DPS.`,
    tags: ['unaccompanied baggage','ub','express shipment','pro-gear','oconus','hhg'],
    citation: 'JTR §0511 / DTR Part IV',
  },
  {
    id: 'dependent-travel',
    q: 'When can my dependents travel on a PCS (concurrent vs delayed)?',
    a: `Dependents travel on the same PCS entitlement as the sponsor. "Concurrent travel" means they move with you on the same orders/timeframe — the default for most CONUS moves. For some OCONUS moves, concurrent travel must be approved (housing, medical/EFMP clearance, command sponsorship); until then it's "delayed travel" and they follow later. Their travel (MALT or air), per diem, and TLE/TLA are reimbursed once authorized. Check command-sponsorship and EFMP screening early for OCONUS.`,
    tags: ['dependent travel','dependents','concurrent','concurrent travel','delayed travel','family','oconus','command sponsorship'],
    citation: 'JTR §0504 / Service component policy',
  },
  {
    id: 'early-return-dependents',
    q: 'What is Early Return of Dependents (ERD)?',
    a: `Early Return of Dependents (ERD) is government-funded travel to send your dependents back from an OCONUS tour to a designated CONUS location before the tour ends — for hardship, safety, medical, command-directed, or other authorized reasons. It can be member-requested or command-directed, and the circumstances affect HHG, allowances, and whether it's at government or member expense. Coordinate through your chain of command, finance, and the transportation office.`,
    tags: ['erd','early return','dependents','oconus','hardship','family'],
    citation: 'JTR §0506 / Service component policy',
  },
  {
    id: 'reserve-guard-pcs',
    q: 'Do Reserve / National Guard members get PCS entitlements?',
    a: `It depends on the orders. Title 10 active-duty orders of 180+ days (and many 20+ week schoolhouse/mobilization orders) carry the full PCS package: HHG, DLA, per diem, TLE, BAH at the duty ZIP, and TRICARE Prime. Short Title 10 orders (≤30 days, AT/ADT) and Title 32 / State Active Duty generally do NOT — they're TDY-style or state-funded with limited or no PCS benefits. Read the orders' entitlement lines and confirm with your unit and finance; in PCS Express set your component + orders type so the checklist filters benefits correctly.`,
    tags: ['reserve','national guard','guard','title 10','title 32','agr','mobilization','pcs'],
    citation: 'JTR Ch 7 (Reserve/Guard) / 10 USC §12301',
  },
  {
    id: 'separation-retirement-travel',
    q: 'What travel and move do I get when I separate or retire?',
    a: `Separating members rate a final move to their Home of Record or place of entry into service (and travel/per diem to get there), generally to be used within ~180 days. Retirees rate a move to a Home of Selection (HOS) — anywhere in the U.S. (and some non-foreign areas) — with up to 1 year to use it (extensions possible). Both get HHG transportation, MALT + per diem for the trip, and NTS where authorized. Schedule it in DPS; see the Transition tab for the full separation/retirement timeline.`,
    tags: ['separation','retirement','retire','home of selection','hos','home of record','final move','travel'],
    citation: 'JTR §0506 / Ch 5',
  },
  {
    id: 'pcs-travel-per-diem',
    q: 'How is per diem paid for PCS travel (en route)?',
    a: `PCS travel by POV is paid as MALT (a flat per-mile rate, distance from the Defense Table of Official Distances) PLUS a flat per diem for each authorized travel day — a set lodging-plus-M&IE amount for the member, with reduced flat rates for dependents by age. Authorized travel days are based on official distance (roughly one day per ~400 miles). It is NOT the GSA locality per diem used for TDY. Keep your itinerary; file on the DD 1351-2.`,
    tags: ['per diem','travel','en route','travel days','dd 1351-2','flat rate'],
    citation: 'JTR §0503 / §020205',
  },
  {
    id: 'czte',
    q: 'How does the Combat Zone Tax Exclusion work?',
    a: `Active-duty pay earned while serving in a designated Combat Zone is excluded from federal income tax under IRC §112. Enlisted members exclude all pay; officers exclude up to the maximum enlisted pay + Imminent Danger Pay. The exclusion is automatic on the W-2 (Box 12 code Q) and extends to bonuses, leave, and re-enlistment payments earned in-zone. State income tax treatment varies; verify with the installation Tax Center.`,
    tags: ['czte','combat zone','tax','exclusion','irc 112','irs'],
    citation: 'IRC §112 / IRS Pub 3 / 26 USC §112',
  },
  {
    id: 'feie-civilian',
    q: 'Can OCONUS DoD civilians claim the Foreign Earned Income Exclusion (FEIE)?',
    a: `Potentially. IRS Form 2555 lets U.S. citizens working abroad exclude up to roughly $120,000 of foreign earned income if they meet the bona fide residence or physical presence test. The interaction with LQA, the Foreign Tax Credit, and the bona fide residence requirement is non-trivial — consult the installation Tax Center or VITA volunteer. LQA itself is not taxable. Wages may or may not qualify depending on whether you're paid as a U.S. government employee.`,
    tags: ['feie','foreign earned income','form 2555','civilian','oconus','tax'],
    citation: 'IRS Pub 54 / IRS Form 2555 / 26 USC §911',
  },
  {
    id: 'malt-mileage',
    q: 'What is the POV mileage rate (MALT) for PCS travel?',
    a: `MALT (Monetary Allowance in Lieu of Transportation) reimburses POV travel during a PCS at the published JTR rate per authorized mile. The CY2026 MALT rate is $0.205/mile (unchanged from CY2025), set annually by DTMO and significantly lower than the IRS business rate — always confirm the current figure on the DTMO mileage page before filing. Distance is calculated on the Defense Table of Official Distances (DTOD), not your odometer.`,
    tags: ['malt','mileage','pov','reimbursement','dtod','travel'],
    citation: 'JTR §020205 / DTMO MAP 73-25(I) (CY2026)',
  },
  {
    id: 'tle-vs-tla',
    q: 'TLE vs TLA — what is the difference?',
    a: `TLE = Temporary Lodging Expense (CONUS). Up to 14 days combined across losing and gaining. Lodging up to per-diem + percentage of M&IE based on family. TLA = Temporary Lodging Allowance (OCONUS). Up to 60 days at the gaining station (extensible to 100). Same flavor, different scope.`,
    tags: ['tle','tla','difference','temporary lodging','conus','oconus'],
    citation: 'JTR §050501 (TLE) / §050502 (TLA)',
  },
  {
    id: 'claim-window',
    q: 'How long do I have to file a damage claim against the TSP?',
    a: `Soft target: 75 days from delivery to file an itemized claim via DPS for full Best Replacement Value (FRV) coverage. Hard deadline: 9 months from delivery, after which the TSP only owes Depreciated Replacement Value. Annotate damage on the DD 1840R at delivery, then supplement via DPS within the window.`,
    tags: ['claim','damage','dps','tsp','dd 1840','frv','window','broken'],
    citation: 'JTR §054305 / DTR Part IV Chapter 401',
  },
];

// ── Pure search helpers (shared by both assistant surfaces) ──────────────

// Common words carry no topic signal and, left in, let an out-of-scope
// question ("what is the weather") accumulate body-substring points and
// cross the confidence threshold. Filtered from query tokens.
const STOPWORDS = new Set([
  'the','is','a','an','of','to','for','my','do','i','how','what','can','when',
  'and','in','on','at','with','does','are','me','you','your','will','get','it',
  'be','am','as','or','if','that','this','these','those','about','into','from',
]);

export function tokenize(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !STOPWORDS.has(t));
}

export function scoreKbItem(item, qTokens, qStr = '') {
  const haystack = `${item.q} ${item.a} ${item.tags.join(' ')} ${item.citation}`.toLowerCase();
  let s = 0;
  for (const t of qTokens) {
    if (haystack.includes(t)) s += 2;
    if (item.tags.includes(t)) s += 3;
  }
  // Phrase bonus: a multi-word tag (e.g. 'weight ticket', 'house hunting')
  // matched as a contiguous phrase in the query is a strong specific signal,
  // so the dedicated entry beats a generic one that merely shares a token.
  if (qStr) {
    for (const tag of item.tags) {
      if (tag.includes(' ') && qStr.includes(tag)) s += 4;
    }
  }
  return s;
}

// Ranked list of matching entries (score > 0), best first. Empty query
// returns the whole KB (browse mode). Used by the JTR Assistant tab.
export function searchJtrKb(query, kb = JTR_KB) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return kb.slice();
  const qStr = String(query || '').toLowerCase();
  return kb
    .map(it => ({ ...it, _score: scoreKbItem(it, qTokens, qStr) }))
    .filter(it => it._score > 0)
    .sort((a, b) => b._score - a._score);
}

// Single best match above a confidence threshold (one tag hit + one body
// hit ≈ 4), or null. Used by the AI chip's offline fallback.
export function bestJtrMatch(query, kb = JTR_KB, threshold = 4) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return null;
  const qStr = String(query || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of kb) {
    const score = scoreKbItem(item, qTokens, qStr);
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= threshold ? best : null;
}
