/*
 * AI Assistant — modal + trigger components.
 *
 * The Modal hosts the chat UI: safety header (988 + OneSource),
 * OPSEC banner, conversation pane, free-text input. Routes through
 * /api/jtr-assistant. When the backend returns 501 (no provider
 * configured), the modal falls back to a local curated JTR / FTR /
 * DSSR knowledge base so users get a useful citation-backed answer
 * even when the LLM is offline.
 *
 * The Trigger is just a button. Render it wherever the user expects
 * to find help (sidebar footer above Security, home-page footer
 * above Security, etc.).
 *
 * Multi-turn memory: every request sends the prior conversation as
 * a `history` array so a configured LLM provider can reason about
 * context. The curated-KB fallback ignores history (it's a
 * keyword-search responder, not a chat model).
 *
 * Safety-critical decisions baked in:
 *   1. Crisis line (988 then 1) + OneSource pinned as a header in
 *      every AI conversation. We swap the SOS button for an AI
 *      button; we do not remove safety access.
 *   2. OPSEC banner permanent above the input.
 *   3. Input length capped at 1000 chars matching backend validator.
 *   4. Submit disabled while a request is in flight or input empty.
 *   5. Conversation state is wiped on modal close; nothing is
 *      persisted beyond an audit metadata event.
 */

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config/apiConfig';
import { AuditLogger } from '../security/SecurityExtensions';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Curated knowledge base — same content as JTRAssistantModule's KB but
// kept inline here so the modal works fully offline / without the LLM
// provider being configured. When this list grows, refactor both
// callers to import a shared module.
const CURATED_KB = [
  { tags: ['ppm','dity','max','payout','reimbursement','weight','hhg'], citation: 'JTR §050302 / DTMO PPM Worksheet / IRS Form 3903',
    q: 'How do I maximize my PPM (Personally Procured Move) payout?',
    a: 'PPM reimburses 100% of the Best Value Cost the government would have paid for the same shipment, up to your weight allowance, when you move yourself. To maximize:\n1) Weigh empty, then fully loaded — keep both certified weight tickets.\n2) Stay at or below your authorized weight allowance.\n3) Track every direct moving expense (rental truck, fuel, packing materials, tolls, hired labor).\n4) Submit through DPS within 45 days of arrival.' },
  { tags: ['tle','tla','temporary lodging','per diem','m&ie','allowance'], citation: 'JTR §050501 (TLE) / §050502 (TLA)',
    q: 'How many days of TLE / TLA am I entitled to?',
    a: 'TLE covers up to 14 days for CONUS PCS combined between losing and gaining duty stations. TLA covers up to 60 days OCONUS (extensible to 100). Both reimburse lodging cost up to the locality per-diem ceiling plus a percentage of M&IE based on family size.' },
  { tags: ['dla','dislocation','allowance','reimbursement','miscellaneous'], citation: 'JTR §050601',
    q: 'What is Dislocation Allowance (DLA) and how much will I get?',
    a: 'DLA is a one-time payment that partially reimburses miscellaneous PCS expenses. Paid automatically on PCS. Amount equals roughly 2 months of the With-Dependents BAH at sponsor rank (or E-4 if without dependents). DTMO publishes exact figures yearly.' },
  { tags: ['pov','vehicle','ship','vpc','dd 788','oconus'], citation: 'JTR §053201 / 32 CFR 102.2',
    q: 'When can I ship my POV at government expense?',
    a: 'One POV may be shipped at government expense on OCONUS PCS (Korea, Japan, Germany, etc.). CONUS-to-CONUS PCS does NOT authorize POV shipment. Use DD Form 788 and the Vehicle Processing Center (VPC) network at vpcus.com.' },
  { tags: ['bah','oha','miha','lqa','overseas','oconus','housing'], citation: 'JTR §100301 (OHA) / DSSR §130 (LQA)',
    q: 'Do I get BAH overseas?',
    a: 'No — BAH does not apply OCONUS. Service members receive Overseas Housing Allowance (OHA), Utility/Recurring Maintenance Allowance, and a one-time Move-In Housing Allowance (MIHA). DoD civilians get Living Quarters Allowance (LQA) under DSSR §130. Look up OHA at travel.dod.mil.' },
  { tags: ['pet','animal','shipment','allowance','reimbursement','quarantine'], citation: 'JTR §053703',
    q: 'Is there a pet shipment allowance?',
    a: 'Yes. For OCONUS PCS, reimbursement up to $2,000 per family ($550 CONUS) for pet shipment — boarding, transit, quarantine, mandatory health certificates, approved pet transport. Submit via the travel voucher (DD 1351-2).' },
  { tags: ['hht','house hunting','civilian','ftr','conus'], citation: 'FTR §302-5',
    q: 'Can I take a House Hunting Trip (HHT) before PCS?',
    a: 'Civilian-only entitlement under FTR §302-5. HHT is CONUS-only — a round trip for employee and one accompanying family member, up to 10 days. Military members do NOT get HHT; they use DLA + TLE. OCONUS DoD civilians do not get HHT.' },
  { tags: ['real estate','civilian','reimbursement','closing','broker','ftr'], citation: 'FTR §302-11',
    q: 'Is selling / buying a home reimbursable on a civilian PCS?',
    a: 'Yes — DoD civilians may claim the Real Estate Expense Allowance under FTR §302-11 for selling the losing primary residence and buying at the gaining locality. Reimbursable: broker commissions, closing costs, title insurance, attorney fees. Caps apply. Military do NOT have a comparable benefit.' },
  { tags: ['czte','combat zone','tax','exclusion','irc 112','irs'], citation: 'IRC §112 / IRS Pub 3 / 26 USC §112',
    q: 'How does the Combat Zone Tax Exclusion work?',
    a: 'Active-duty pay earned in a designated Combat Zone is excluded from federal income tax under IRC §112. Enlisted members exclude all pay; officers exclude up to the maximum enlisted pay + Imminent Danger Pay. Automatic on the W-2 (Box 12 code Q).' },
  { tags: ['feie','foreign earned income','form 2555','civilian','oconus','tax'], citation: 'IRS Pub 54 / IRS Form 2555 / 26 USC §911',
    q: 'Can OCONUS DoD civilians claim the Foreign Earned Income Exclusion (FEIE)?',
    a: 'Potentially. IRS Form 2555 lets U.S. citizens working abroad exclude up to ~$120,000 of foreign earned income if they meet the bona fide residence or physical presence test. Interaction with LQA is non-trivial — consult the installation Tax Center or VITA volunteer.' },
  { tags: ['weight','allowance','hhg','rank','dependents','pro-gear'], citation: 'JTR Table 5-37 / FTR §302-7',
    q: 'How is my HHG weight allowance calculated?',
    a: 'Set by rank and dependency status per JTR Table 5-37. E-5 with deps = 9,000 lbs; E-9 with deps = 15,000; O-1 with deps = 12,000; O-6 with deps = 18,000. Civilians get a flat 18,000 lbs under FTR §302-7. Pro-gear (books, instruments, tools of trade) exempt up to 2,000 lbs sponsor + 500 spouse.' },
  { tags: ['malt','mileage','pov','reimbursement','dtod','travel'], citation: 'JTR §020205 / DTMO mileage page',
    q: 'What is the POV mileage rate (MALT) for PCS travel?',
    a: 'MALT reimburses POV travel at the published JTR rate per authorized mile. Set annually by DTMO. Significantly lower than IRS business rate. Distance is from the Defense Table of Official Distances (DTOD), not your odometer.' },
  { tags: ['claim','damage','dps','tsp','dd 1840','frv','window'], citation: 'JTR §054305 / DTR Part IV Chapter 401',
    q: 'How long do I have to file a damage claim against the TSP?',
    a: 'Soft target: 75 days from delivery to file via DPS for full Best Replacement Value (FRV) coverage. Hard deadline: 9 months from delivery (TSP only owes Depreciated Replacement Value after that). Annotate damage on DD 1840R at delivery, supplement via DPS within the window.' },
  // ── App-feature entries — answer "where do I find X in the app"
  // style questions. Citations point to the in-app surface, not
  // to a regulation. Keeps the AI Assistant useful for product
  // navigation, not just travel-reg lookup.
  { tags: ['ship','shipment','tracker','track','hhg','gbl','dps','movement','logistics'], citation: 'In-app: Movement & Logistics → Shipment Tracker',
    q: 'Where do I track my HHG shipment in the app?',
    a: 'Movement & Logistics → Shipment Tracker. The 10-stage milestone ladder mirrors the JTR DPS lifecycle (counseling → TSP assigned → pre-move survey → packing → loaded → in transit → arrival call → delivered → claim filed → claim settled). Enter your GBL/TCN, TSP, and spread windows. Overdue stages flash amber. Optional browser-push alerts.' },
  { tags: ['inventory','worksheet','dd 1840','claim','items','rooms','add item'], citation: 'In-app: Movement & Logistics → Inventory & Claims',
    q: 'How do I record an HHG inventory in the app?',
    a: 'Movement & Logistics → Inventory & Claims. Walk every room before pack-out, add each item (name, room, declared value, condition, notes). Switch to "post-delivery" phase at arrival and re-walk. Export the DD 1840R-ready PDF for DPS damage claims. Text-only — PCS Express does not accept uploads.' },
  { tags: ['binder','paperwork','documents','export','pdf','checklist'], citation: 'In-app: PCS Operations → Paperwork',
    q: 'How do I export the PCS Binder?',
    a: 'PCS Operations → Paperwork. Check each document off as you collect the physical paperwork yourself. Tap "Export PCS Binder Checklist (PDF)" to generate a printable list for your gaining S1 / HR / VA. PCS Express never accepts, stores, or transmits document uploads.' },
  { tags: ['budget','inflation','cost','expense','tracker','money','fuel','lodging'], citation: 'In-app: Movement & Logistics → Budget',
    q: 'Where is the inflation-adjusted PCS budget?',
    a: 'Movement & Logistics → Budget. Each expense row shows a 2026 planning range built from BLS CPI (gasoline, lodging, food) and GSA per-diem ceilings. Enter your actual cost; if it exceeds the high estimate, a callout suggests coordinating supplemental reimbursement with finance.' },
  { tags: ['chaplain','spiritual','faith','worship','installation chaplain'], citation: 'In-app: Family Readiness → Faith & Chaplains',
    q: 'Where do I find the chaplain at my gaining installation?',
    a: 'Family Readiness → Faith & Chaplains. Lists every on-base chapel office at the gaining installation with denomination, address, service times, and a tap-to-call number. Branch Chaplain Corps reference card sits below in case the installation isn\'t curated yet.' },
  { tags: ['oha','rate','overseas housing','lookup','dtmo'], citation: 'In-app: Movement & Logistics → BAH / OHA Calculator',
    q: 'How do I look up the OHA rate for my OCONUS base?',
    a: 'Movement & Logistics → BAH / OHA Calculator. If your profile is OCONUS the calculator switches to OHA mode and surfaces DTMO/OHA rate lookup, MIHA, COLA, DSSR §130 LQA, DSSR §240 TQSA, HOMES.mil, and AHRN as a single resource grid.' },
  { tags: ['translation','language','interpreter','free','onesource','dlfilc','jko'], citation: 'In-app: Family Readiness → Translation → Free Resources',
    q: 'Where do I find free translation help for OCONUS?',
    a: 'Family Readiness → Translation → Free Resources tab. Lists DoD-funded translation resources gated to your component: Military OneSource interpreter referrals, DLIFLC public modules, JKO language courses, JLU, Rosetta Stone via branch portal, Yellow Ribbon (Reserve/Guard), Federal EAP (Civilians), DSSR §240 language reimbursement (OCONUS Civilians), TRICARE/TOP/FEHB interpreter lines.' },
  { tags: ['mission lanes','today','this week','before you report','tasks'], citation: 'In-app: Command Center → Mission Lanes',
    q: 'What are the Mission Lanes on the Command Center?',
    a: 'The Today / This Week / Before You Report card on the home dashboard pulls UNCHECKED items from your tailored PCS checklist and buckets them by current phase / next phase / future phases. Checking an item in PCS Operations → Checklist removes it from the lanes automatically.' },
  { tags: ['compliance','security','encryption','data','privacy','aes','lock'], citation: 'In-app: Command Center → 🔒 Security & data handling',
    q: 'How do I open the Compliance / Security page?',
    a: 'Tap the 🔒 "Security & data handling" button at the bottom of Command Center (or in the desktop sidebar footer). The modal shows where your data lives (on your phone), how it\'s protected (AES-256), what we never collect, and the public-standard alignments (NIST, DISA, OWASP).' },
  { tags: ['ai','assistant','jtr assistant','help','chat','question'], citation: 'In-app: AI Assistant button',
    q: 'How does the AI Assistant work?',
    a: 'Tap the 🤖 AI Assistant button (above Security in the sidebar or home footer). Ask any PCS, JTR/FTR/DSSR, or PCS Express navigation question. If the live AI provider isn\'t configured, the assistant falls back to a curated knowledge base. The crisis line (988 then 1) and Military OneSource (1-800-342-9647) stay pinned at the top of every conversation.' },
  { tags: ['pcs operations','checklist','phases','tasks'], citation: 'In-app: PCS Operations',
    q: 'Where is the PCS Checklist?',
    a: 'PCS Operations is the mission group that hosts Checklist, Paperwork, and the Dynamic Timeline. The phased Checklist runs Orders Received → 90 Days Out → 60 Days Out → 30 Days Out → Move Week → In-Processing. It\'s tailored to your branch, component, orders type, and family situation, so unrelated tasks are hidden automatically.' },
  { tags: ['fitness','gym','workout','diet','meal','holistic'], citation: 'In-app: Holistic Health → Fitness',
    q: 'Where do I find gym + PCS-fitness tips in the app?',
    a: 'Holistic Health → Fitness tab. Three sections: On-Base Gym & Fitness (MWR / H2F / Fit-to-Fight), Staying Fit During PCS Travel (hotel-room workouts + drive-day movement basics), and Diet & Meal Tips for Traveling (Performance Triad nutrition, MyPlate, TRICARE nutrition counseling, cooler-pack meal planning).' },
  { tags: ['pet','quarantine','japan','germany','rabies','aphis','country'], citation: 'In-app: Family Readiness → Pets',
    q: 'Where do I see country-specific pet import rules?',
    a: 'Family Readiness → Family → Pets. The country-rules banner surfaces automatically when your gaining installation is OCONUS — covers Germany (TRACES), Japan (180-day FAVN), Hawaii (Direct Airport Release), Korea (AQIS), UK GB AHC, and 12 other countries with realistic lead times and USDA APHIS links.' },
  { tags: ['veteran','va','support','vet'], citation: 'In-app: Mission Resources → Veteran Support',
    q: 'Where do I find veteran resources in the app?',
    a: 'Mission Resources → Veteran Support. Veteran-owned business directories, public veteran resources, and local search around your gaining location. The Family Readiness group also surfaces VA-side benefits (GI Bill, VA Loan, Vet Center) where relevant.' },

  // ── Help Hub / Mission Resources topics — match the Resources tab's
  // section vocabulary (healthcare, family, financial, pcs, education,
  // careers, portals) so users asking "where do I find X" get the
  // right official link AND the right in-app surface.

  { tags: ['crisis','suicide','988','onesource','help','emergency','safety'], citation: 'Veterans Crisis Line / Military OneSource',
    q: 'Who do I call in a crisis?',
    a: 'Military Crisis Line: dial 988, then press 1. Available 24/7 for service members, veterans, and their families. Text 838255. Chat: veteranscrisisline.net. Military OneSource: 1-800-342-9647 for non-emergency counseling, financial, legal, and relocation support. Both numbers are pinned at the top of every PCS Express AI Assistant conversation.' },

  { tags: ['tricare','health','insurance','medical','enrollment','dental','overseas'], citation: 'In-app: Mission Resources → Help Hub → Healthcare / tricare.mil',
    q: 'How do I enroll in TRICARE or find a provider?',
    a: 'Mission Resources → Help Hub → Healthcare tab lists TRICARE (tricare.mil), MHS GENESIS Patient Portal (my.mhsgenesis.health.mil) for records and appointments, TRICARE Pharmacy via Express Scripts, TRICARE Dental Program, TRICARE For Life (Medicare-wraparound), and TRICARE Overseas / TOP for OCONUS beneficiaries. For PCS, update DEERS first (milConnect), then re-enroll TRICARE Prime at the gaining region.' },

  { tags: ['onesource','military onesource','counseling','legal','financial','24/7'], citation: 'In-app: Mission Resources → Help Hub → Family / militaryonesource.mil',
    q: 'What does Military OneSource cover?',
    a: 'Military OneSource (1-800-342-9647 / militaryonesource.mil) — 24/7 free support for service members, spouses, dependents, and survivors. Confidential non-medical counseling (12 sessions per issue per year), financial counseling, legal consultations, tax filing (MilTax), relocation services, and SECO career coaching for spouses. Find it under Mission Resources → Help Hub → Family.' },

  { tags: ['mypay','dfas','les','allotment','w-2','pay statement'], citation: 'In-app: Mission Resources → Help Hub → Financial / mypay.dfas.mil',
    q: 'How do I view my LES or update an allotment?',
    a: 'myPay (mypay.dfas.mil) is the DFAS portal for active duty, reserve, retiree, and federal civilian pay. View Leave & Earnings Statements (LES), download W-2s, start/stop allotments, change federal & state tax withholding, update bank info. Listed in Mission Resources → Help Hub → Financial.' },

  { tags: ['scra','servicemembers civil relief act','lease','interest rate','foreclosure'], citation: 'JAG / SCRA / In-app: Mission Resources → Help Hub → PCS',
    q: 'How does SCRA help when I receive PCS orders?',
    a: 'The Servicemembers Civil Relief Act lets you break a residential lease with 30-day notice once you have PCS orders to a new duty station 35+ miles away. Caps pre-service debt interest at 6%. Protects from default judgment, foreclosure, and certain credit/insurance actions during active duty. Send a copy of your orders + written notice; the landlord must release you. Listed in Mission Resources → Help Hub → PCS. JAG can review specific cases.' },

  { tags: ['va loan','home loan','va home loan','zero down','funding fee','coe'], citation: 'In-app: Mission Resources → Help Hub → PCS / va.gov',
    q: 'How do I use the VA home loan benefit?',
    a: 'Zero-down home loan for service members, veterans, and eligible surviving spouses (va.gov/housing-assistance/home-loans). Request a Certificate of Eligibility (COE) on VA.gov — most COEs issue instantly. No PMI. One-time VA funding fee (1.4-3.6% of loan), waived for veterans with 10%+ service-connected disability. Reusable benefit. Listed in Mission Resources → Help Hub → PCS.' },

  { tags: ['gi bill','post-9/11','transfer','dependents','education benefits','toe'], citation: 'In-app: Mission Resources → Help Hub → Education / va.gov/education',
    q: 'How do I use my GI Bill or transfer it to dependents?',
    a: 'Apply at va.gov/education. Post-9/11 GI Bill: 36 months of tuition + Monthly Housing Allowance + book stipend. Transfer to dependents (TOE) requires 6 years of service and 4 more years committed — request via milConnect BEFORE you separate. Check remaining entitlement on VA.gov. Listed in Mission Resources → Help Hub → Education.' },

  { tags: ['mycaa','spouse','scholarship','career','education','seco'], citation: 'In-app: Mission Resources → Help Hub → Education / Careers',
    q: 'What scholarships are available for military spouses?',
    a: 'MyCAA (Military Spouse Career Advancement Accounts) provides up to $4,000/year for spouses of E-1 to E-5, W-1 to W-2, or O-1 to O-2 pursuing portable career credentials. Apply via militaryonesource.mil. MySECO (myseco.militaryonesource.mil) adds career coaching, scholarship search, and the Military Spouse Employment Partnership job board. Listed in Help Hub → Education AND Careers.' },

  { tags: ['tap','transition','sepration','retirement','dodtap','transition gps'], citation: 'In-app: Mission Resources → Help Hub → Careers / dodtap.mil',
    q: 'When do I start TAP (Transition Assistance Program)?',
    a: 'Mandatory pre-separation TAP must start 365 days before separation/retirement (180 minimum). Five mandatory tracks: Pre-separation Counseling, DoD Career Readiness Standards, MOS Crosswalk, Financial Planning, VA Benefits Briefing. Schedule via dodtap.mil or your branch portal (Army: tapevents.mil). Listed in Mission Resources → Help Hub → Careers.' },

  { tags: ['usajobs','federal','civilian','veteran preference','vra','30%'], citation: 'In-app: Mission Resources → Help Hub → Careers / usajobs.gov',
    q: 'How do I claim veteran preference on USAJobs?',
    a: 'usajobs.gov adds 5 (TP) or 10 (CP/CPS) points to your civil service exam score depending on disability rating. Eligible categories: 5-Point (3+ years active duty, campaign medal, or peace-time vet); 10-Point (VA-rated disability, Purple Heart, certain campaigns). Use VRA appointment for non-competitive hire if you have 30%+ disability or recent separation. Listed in Mission Resources → Help Hub → Careers.' },

  { tags: ['milconnect','dmdc','deers','id card','records','benefits'], citation: 'In-app: Mission Resources → Help Hub → Portals / milconnect.dmdc.osd.mil',
    q: 'How do I update DEERS / get a new ID card?',
    a: 'milConnect (milconnect.dmdc.osd.mil) is the DMDC portal for DEERS updates (add dependents, change address, beneficiary updates), benefit summaries, GI Bill transfers, and TRICARE plan info. ID card replacements are scheduled via ID Card Office Online (idco.dmdc.osd.mil). Listed in Mission Resources → Help Hub → Portals.' },

  { tags: ['dps','move.mil','schedule','self counsel','tsp','household goods'], citation: 'In-app: Mission Resources → Help Hub → PCS / dps.move.mil',
    q: 'How do I schedule my HHG move on DPS?',
    a: 'Defense Personal Property System (dps.move.mil) is the DoD portal for scheduling household goods moves, tracking shipments, and filing claims. Submit your application 60+ days before move date. Self-counsel option available. Get GBL/TCN. Inside PCS Express, track the live milestones in Movement & Logistics → Shipment Tracker. Listed in Mission Resources → Help Hub → PCS.' },

  { tags: ['military installations','find base','installation','gaining','services'], citation: 'In-app: Mission Resources → Help Hub → PCS / installations.militaryonesource.mil',
    q: 'How do I look up services at my gaining installation?',
    a: 'installations.militaryonesource.mil lists every DoD installation worldwide with on-post housing, childcare wait-list, family support office, fitness centers, dental clinics, dining, MWR, and chapel info. Search by base name. Inside PCS Express, the same data drives Mission Resources → Base Insights for verified family reviews. Listed in Help Hub → PCS.' },

  { tags: ['operation homefront','emergency','financial assistance','family'], citation: 'In-app: Mission Resources → Help Hub → Family / operationhomefront.org',
    q: 'Where can I get emergency financial assistance during PCS?',
    a: 'Operation Homefront (operationhomefront.org/critical-financial-assistance/) — emergency rent, utilities, food assistance, and back-to-school programs for active duty, post-9/11 wounded warriors, and their families. Air Force Aid Society, Army Emergency Relief, Navy-Marine Corps Relief Society, and Coast Guard Mutual Assistance all have similar PCS hardship grants. Listed in Mission Resources → Help Hub → Family.' },

  { tags: ['dodea','school','dependent','dod school','overseas school','dod education'], citation: 'In-app: Family Readiness → Education / dodea.edu',
    q: 'How do I enroll my child in DoDEA schools?',
    a: 'DoDEA (dodea.edu) operates ~160 DoD schools for military dependents at OCONUS installations + select stateside bases (e.g., Quantico, Fort Bragg). Enrollment opens after sponsor orders confirmed. Required: PCS orders, birth certificate, immunization records, prior school transcript. Listed in Family Readiness → Education AND Mission Resources → Help Hub → Education.' },

  { tags: ['va benefits','disability','claim','compensation','intent to file'], citation: 'In-app: Mission Resources → Veteran Support / va.gov/disability',
    q: 'How do I file a VA disability claim?',
    a: 'va.gov/disability — file online via VA.gov, by mail (VA Form 21-526EZ), or in person. Submit Intent to File first to lock in effective date while you gather evidence. Use VSO (DAV, VFW, American Legion) free of charge for representation. eBenefits replaced by VA.gov. Average processing 100-130 days. Listed in Mission Resources → Veteran Support.' },

  { tags: ['hpsp','health professions','medical school','scholarship'], citation: 'Service-specific HPSP / In-app: Help Hub → Education',
    q: 'What is HPSP and who qualifies?',
    a: 'Health Professions Scholarship Program (HPSP) — full tuition + monthly stipend for medical, dental, veterinary, optometry, pharmacy, and clinical psychology students in exchange for a year-for-year service commitment as a military officer (minimum 3 years). Service-specific portals: Army (recruiting.army.mil), Navy, Air Force. Listed in Mission Resources → Help Hub → Education.' },

  { tags: ['army','navy','air force','marines','coast guard','space force','branch'], citation: 'In-app: throughout (branch-tailored content)',
    q: 'Does PCS Express tailor content per branch?',
    a: 'Yes. Pick your branch during onboarding (Army, Navy, Air Force, Marines, Coast Guard, Space Force) and the checklist, paperwork, finance offices, evaluation forms, leave forms, and personnel portals retune automatically. Switch any time from Profile (sidebar footer → Profile). Theme colors also shift per branch.' },

  { tags: ['offline','pwa','install','add to home screen','works offline'], citation: 'In-app: PWA install nudge / PCS Express docs',
    q: 'Does PCS Express work offline?',
    a: 'Yes. The app caches its UI shell, your encrypted profile, and your checklist locally. Most features keep working without network — the AI Assistant falls back to the curated KB, calculators run locally, checklists/reminders are local-first. Map tiles cache once visited. The offline banner appears automatically when you lose connection. Install as a PWA (Add to Home Screen on iOS Safari / Install prompt on Chrome/Edge/Android) for the smoothest offline experience.' },

  { tags: ['privacy','data','security','encryption','what do you collect','no upload'], citation: 'In-app: Command Center → 🔒 Security & data handling',
    q: 'What data does PCS Express collect or send to servers?',
    a: 'Effectively none. Your profile, checklist, reminders, and audit log live encrypted (AES-256-GCM, key in IndexedDB, never extractable) on your device. The AI Assistant sends only your question (and a minimal non-PII context blob: branch / rank / phase / open-task count) — never your name, email, address, or document content. PCS Express does not accept document or photo uploads anywhere. Full detail in Command Center → 🔒 Security & data handling.' },
];

// Parse an "In-app: <Group> → <Subtab>" hint out of an assistant
// message body or source field and map it to the deep-link route IDs
// used by the rest of the app. Returns { tab, sub, label } or null.
const INAPP_GROUP_MAP = {
  'command center':         { tab: 'home' },
  'pcs operations':         { tab: 'pcs-operations' },
  'movement & logistics':   { tab: 'home-relocation' },
  'movement and logistics': { tab: 'home-relocation' },
  'home relocation':        { tab: 'home-relocation' },
  'family readiness':       { tab: 'family-readiness' },
  'holistic health':        { tab: 'medical-readiness' },
  'medical readiness':      { tab: 'medical-readiness' },
  'mission resources':      { tab: 'mission-resources' },
};
const INAPP_SUBTAB_MAP = {
  // Movement & Logistics
  'home locator':       'home-locator',
  'bah calculator':     'bah-calculator',
  'oha calculator':     'bah-calculator',
  'bah / oha':          'bah-calculator',
  'bah / oha / lqa':    'bah-calculator',
  'lqa calculator':     'bah-calculator',
  'ppm estimator':      'ppm-estimator',
  'budget tracker':     'budget-tracker',
  'budget':             'budget-tracker',
  'shipment tracker':   'shipment-tracker',
  'inventory & claims': 'inventory-claims',
  'inventory':          'inventory-claims',
  'jtr assistant':      'jtr-assistant',
  'move aid':           'move-aid',
  'va loan':            'va-loan',
  // PCS Operations
  'checklist':          'checklist',
  'paperwork':          'documents',
  'documents':          'documents',
  'timeline':           'timeline',
  // Family Readiness
  'family':             'family',
  'education':          'education',
  'translation':        'translation',
  'faith & chaplains':  'faith',
  'faith':              'faith',
  'chaplains':          'faith',
  // Holistic Health
  'medical care':       'medical',
  'behavioral health':  'behavioral',
  'behavioral health & counseling': 'behavioral',
  'spiritual care':     'spiritual',
  'fitness':            'fitness',
  // Mission Resources
  'base insights':      'base-insights',
  'maps':               'maps',
  'help hub':           'help-hub',
  'veteran support':    'veteran',
};
// Parse `[action: <verb> <args>]` markers out of an assistant message.
// Claude is taught (in the system prompt, both server and Vercel
// function) to optionally append these as a final line so the user
// can tap-execute instead of re-typing a follow-up. Two verbs:
//
//   [action: open_tab <tab_id>]       → renders an "Open <Label>" button
//   [action: ask_followup <text>]     → renders an "Ask: <text>" button
//
// Returns { cleanText, actions }. Actions are stripped from the
// visible text so the markers don't leak into the chat UI when the
// model decides to include them.
const TAB_LABELS = {
  'home':              'Command Center',
  'pcs-operations':    'PCS Operations',
  'home-relocation':   'Movement & Logistics',
  'family-readiness':  'Family Readiness',
  'medical-readiness': 'Holistic Health',
  'mission-resources': 'Mission Resources',
  'checklist':         'Checklist',
  'documents':         'Paperwork',
  'education':         'Education',
  'translation':       'Translation',
  'religion':          'Faith & Chaplains',
  'base-intelligence': 'Base Insights',
  'nav':               'Maps',
  'resources':         'Help Hub',
  'jtr-assistant':     'JTR Assistant',
  'bah-calculator':    'BAH / OHA Calculator',
  'ppm-estimator':     'PPM Estimator',
  'budget-tracker':    'Budget Tracker',
  'shipment-tracker':  'Shipment Tracker',
  'inventory-claims':  'Inventory & Claims',
  'home-locator':      'Home Locator',
};
// The system prompt instructs the model to emit at most 3 markers.
// We enforce the cap here too so a jailbroken or runaway model can't
// render 50 buttons in the chat surface.
const MAX_AI_ACTIONS = 3;
export function parseAIActions(text) {
  if (typeof text !== 'string' || !text) return { cleanText: '', actions: [] };
  const actions = [];
  const cleanText = text.replace(
    /\[action:\s*(open_tab|ask_followup)\s+([^\]]+)\]/gi,
    (_, verb, argsRaw) => {
      const args = String(argsRaw).trim();
      if (actions.length >= MAX_AI_ACTIONS) return '';
      if (verb.toLowerCase() === 'open_tab') {
        if (TAB_LABELS[args]) actions.push({ verb: 'open_tab', tab: args, label: TAB_LABELS[args] });
      } else if (verb.toLowerCase() === 'ask_followup') {
        // Truncate questions so a runaway model can't generate a
        // 2,000-char follow-up button. Keep first 200 chars.
        const q = args.slice(0, 200);
        if (q.length > 0) actions.push({ verb: 'ask_followup', q });
      }
      return '';
    }
  ).replace(/\n{3,}/g, '\n\n').trim();
  return { cleanText, actions };
}

export function parseInappCitation(message) {
  if (!message) return null;
  const candidates = [];
  if (typeof message.source === 'string') candidates.push(message.source);
  if (typeof message.text === 'string')   candidates.push(message.text);
  for (const c of candidates) {
    // Matches both en-dash and arrow separator variants we use in the
    // curated KB ("In-app: Movement & Logistics → Shipment Tracker")
    // and freer LLM phrasing like "In-app: Family Readiness > Family".
    const m = c.match(/In-app:\s*([^→>\n]+?)\s*(?:→|>|->)\s*([^.\n]+?)(?:[.\n]|$)/i);
    if (!m) continue;
    const groupKey = String(m[1] || '').trim().toLowerCase();
    const subKey   = String(m[2] || '').trim().toLowerCase().replace(/[.,]$/, '');
    const group = INAPP_GROUP_MAP[groupKey];
    if (!group) continue;
    const sub = INAPP_SUBTAB_MAP[subKey] || null;
    return { tab: group.tab, sub, label: `${m[1].trim()} → ${m[2].trim().replace(/[.,]$/, '')}` };
  }
  return null;
}

// Build a printable HTML transcript of the conversation and open it
// in a new window with the print dialog cued. The user prints to PDF
// the same way they export PCS Binder and Inventory worksheets.
// No external PDF library — keeps the dependency footprint flat.
export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function exportConversationAsPdf(messages, language) {
  if (!messages || messages.length === 0) return;
  const rows = messages.map(m => {
    const roleLabel = m.role === 'user' ? 'You' : m.role === 'system' ? 'System' : 'AI Assistant';
    const roleColor = m.role === 'user' ? '#0D3B66' : m.role === 'system' ? '#7A4A00' : '#1B5E20';
    const sourceLine = m.source ? `<div style="font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#56697C;margin-top:6px">source: ${escapeHtml(m.source)}</div>` : '';
    return `
      <div style="margin-bottom:14px">
        <div style="font-size:10px;font-weight:900;color:${roleColor};letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">${roleLabel}</div>
        <div style="font-size:12px;color:#0D1821;line-height:1.6;white-space:pre-wrap">${escapeHtml(m.text)}</div>
        ${sourceLine}
      </div>
    `;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>PCS Express — AI Assistant transcript</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0D1821; padding: 24px; max-width: 720px; margin: 0 auto; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .meta { font-size: 11px; color: #56697C; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #E0E6EE; }
  .opsec { background: #FFF8E1; border: 1px solid #FFE082; border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #7A4A00; margin-bottom: 14px; }
  .stamp { margin-top: 22px; padding-top: 10px; border-top: 1px solid #E0E6EE; font-size: 10px; color: #56697C; }
</style>
</head><body>
  <h1>AI Assistant transcript</h1>
  <div class="meta">
    Generated: ${escapeHtml(new Date().toISOString())}<br />
    Language: ${escapeHtml(language || 'en')}<br />
    Messages: ${messages.length}
  </div>
  <div class="opsec">
    This transcript reflects an unclassified PCS planning conversation. Verify all dollar amounts, day counts, and weight figures against the official DTMO / GSA / IRS publication before claiming.
  </div>
  ${rows}
  <div class="stamp">
    PCS Express AI Assistant. The conversation was not stored on any PCS Express server — this transcript is the only copy.
  </div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) { URL.revokeObjectURL(url); alert('Pop-up blocked. Allow pop-ups for PCS Express to export the transcript.'); return; }
  setTimeout(() => { try { w.focus(); w.print(); } catch {} URL.revokeObjectURL(url); }, 600);
}

export function searchKB(query) {
  const tokens = String(query || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const item of CURATED_KB) {
    const haystack = `${item.q} ${item.a} ${item.tags.join(' ')} ${item.citation}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (haystack.includes(t)) score += 2;
      if (item.tags.includes(t)) score += 3;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 4 ? best : null; // require at least one tag hit + one body hit
}

// AIAssistantTrigger was extracted to ./AIAssistantTrigger.jsx so the
// main bundle no longer eager-loads this 900-line modal + KB. The
// trigger is the small surface users see at boot; the modal — this
// file — is lazy-loaded by App.jsx and mounts only after the trigger
// is clicked.

// ── Modal. Renders only when `open` is true. Controlled by parent.
// `language` is forwarded to /api/jtr-assistant so the LLM responds
// in the user's preferred app language. `initialQuestion` (or a
// global `open-ai-assistant` CustomEvent with detail.question) pre-
// fills the input so callers like "Explain this phase" buttons in
// PCS Operations can drop the user into the chat with the question
// already typed.
// Render the user's PCS context as a short JSON-shaped string the
// backend can include in the LLM system prompt. Keeps a compact, easy
// shape so the model can quote it back as citations without us having
// to teach it a schema. The curated-KB fallback also reads it directly
// to answer "what's overdue" / "what should I do this week" without
// needing a configured LLM provider.
export function formatUserContextForPrompt(ctx) {
  if (!ctx) return null;
  const parts = [
    `branch=${ctx.branch || '—'}`,
    `rank=${ctx.rank || '—'}`,
    `component=${ctx.component || '—'}`,
    `ordersType=${ctx.ordersType || '—'}`,
    `moveType=${ctx.moveType || '—'}`,
    ctx.isOverseas ? 'OCONUS=yes' : 'CONUS=yes',
    ctx.hasDependents ? 'dependents=yes' : null,
    ctx.hasChildren ? 'children=yes' : null,
    ctx.hasPets ? 'pets=yes' : null,
    ctx.daysUntilTarget !== null ? `daysUntilReportDate=${ctx.daysUntilTarget}` : null,
    ctx.currentPhase ? `currentPhase=${ctx.currentPhase}` : null,
    ctx.openTaskCount > 0 ? `openTasksInPhase=${ctx.openTaskCount}` : null,
  ].filter(Boolean).join(', ');
  return parts;
}

// Curated answers for the highest-traffic context-aware questions.
// Used by the KB fallback (no LLM provider configured) so the user
// gets a tailored answer even without an API key.
export function curatedContextAnswer(question, ctx) {
  if (!ctx) return null;
  const q = question.toLowerCase();
  const overdueAsk    = /overdue|past due|behind|missed/i.test(q);
  const thisWeekAsk   = /this week|next.*step|what.*do.*now|what.*next|today/i.test(q);
  if (overdueAsk && ctx.openTaskCount > 0 && ctx.currentPhase) {
    const sample = (ctx.openTaskLabels || []).slice(0, 5).map(t => `• ${t}`).join('\n');
    return `You have ${ctx.openTaskCount} open task${ctx.openTaskCount === 1 ? '' : 's'} in the "${ctx.currentPhase}" phase${ctx.daysUntilTarget !== null ? ` with ${ctx.daysUntilTarget} day${ctx.daysUntilTarget === 1 ? '' : 's'} until your report date` : ''}.\n\nTop items to clear next:\n${sample}\n\nOpen PCS Operations → Checklist to tick them off. (Citations: your profile's tailored ${ctx.branch || 'service'} checklist for the ${ctx.currentPhase} phase.)`;
  }
  if (thisWeekAsk && ctx.openTaskCount > 0 && ctx.currentPhase) {
    const sample = (ctx.openTaskLabels || []).slice(0, 3).map(t => `• ${t}`).join('\n');
    return `Focus this week (you're in the "${ctx.currentPhase}" phase):\n${sample}\n\nThese are pulled from your profile-tailored checklist. Open PCS Operations to mark them complete.`;
  }
  return null;
}

export function AIAssistantModal({ open, onClose, isDesktop, language = 'en', userContext = null }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Local-only fallback path used whenever the live API can't be
  // reached (Railway 404, upstream 5xx, network timeout, DNS failure,
  // request aborted). Tries — in order — a context-aware curated
  // answer for the user's own checklist state, a curated KB hit by
  // tag/keyword, then a graceful pointer to the JTR Assistant tab.
  // ALWAYS produces a message so the user never sees a dead-end.
  const answerFromLocalSources = (q, curated, reason) => {
    if (curated) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: curated + `\n\n_(Live AI temporarily unreachable — answered from your local checklist data.)_`,
        source: 'context-aware-offline',
      }]);
      return;
    }
    const hit = searchKB(q);
    if (hit) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `${hit.a}\n\n[Citation: ${hit.citation}]\n\n_(Live AI temporarily unreachable — answered from the curated PCS Express knowledge base.)_`,
        source: 'curated-kb-offline',
      }]);
      return;
    }
    setMessages(prev => [...prev, {
      role: 'system',
      text: `Live AI is temporarily unreachable (${reason}) and no curated entry matches that exact question. Try rephrasing, browse the full curated library inside Movement & Logistics → JTR Assistant, or check Mission Resources → Help Hub for the official source.`,
    }]);
  };

  // Reset conversation every time the modal opens so nothing persists
  // across user sessions or chip toggles.
  useEffect(() => {
    if (open) {
      setMessages([]);
      setQuestion('');
      AuditLogger.record('ai_assistant_opened', {});
      // Focus the input so keyboard users land in the right place.
      setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 50);
    }
  }, [open]);

  // Listen for an app-wide "open-ai-assistant" event. Callers can
  // dispatch `new CustomEvent('open-ai-assistant', { detail:
  // { question: '...' } })` to open the modal pre-filled.
  useEffect(() => {
    const handler = (e) => {
      const q = e?.detail?.question;
      if (typeof q === 'string' && q.trim()) {
        setQuestion(q.trim().slice(0, 1000));
        setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 50);
      }
    };
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  useEffect(() => () => { try { abortRef.current?.abort(); } catch {} }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const submit = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    const nextHistory = [...messages, { role: 'user', text: q }];
    setMessages(nextHistory);
    setBusy(true);

    // Hoisted so the catch block can pass `curated` to
    // answerFromLocalSources on abort / network failure paths.
    // Short curated answer when running in KB-fallback mode without an
    // LLM provider. Lets "what's overdue" / "what's next" feel
    // immediate even when there's no API key configured.
    const curated = curatedContextAnswer(q, userContext);

    try {
      abortRef.current = new AbortController();
      const timer = setTimeout(() => abortRef.current?.abort(), 30_000);
      // Multi-turn memory: send the full conversation history (capped
      // at the last 12 messages) so a configured LLM provider can
      // reason about context. The backend may ignore `history` until
      // the operator wires in a real provider that supports it.
      const history = nextHistory.slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', text: m.text }));
      const userContextStr = formatUserContextForPrompt(userContext);
      // Request streaming first. If the backend can't / won't stream
      // (curated-KB fallback or non-Anthropic providers) it returns a
      // standard JSON response and we fall through to the existing
      // non-streaming code path.
      const r = await fetch(apiUrl('/api/jtr-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
        body: JSON.stringify({ q, history, language, stream: true, userContext: userContextStr }),
        signal: abortRef.current.signal,
      });
      const contentType = r.headers.get('content-type') || '';
      // Streaming SSE path. Anthropic emits content_block_delta events
      // whose `delta.text` carries the next text fragment. We append
      // each fragment to a placeholder assistant message so the UI
      // shows a live "typing" effect without re-rendering the entire
      // chat for every chunk.
      if (r.ok && contentType.includes('text/event-stream') && r.body) {
        const source = r.headers.get('x-source') || 'anthropic';
        // Reserve the assistant slot.
        setMessages(prev => [...prev, { role: 'assistant', text: '', source }]);
        const decoder = new TextDecoder('utf-8');
        const reader = r.body.getReader();
        let buffer = '';
        let acc = '';
         
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // SSE frames are separated by a blank line. Each frame may
          // contain one or more `data: {...}` lines.
          let nlIdx;
          while ((nlIdx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, nlIdx);
            buffer = buffer.slice(nlIdx + 2);
            for (const line of frame.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const obj = JSON.parse(payload);
                // Anthropic event flavors of interest:
                //   content_block_delta → delta.text fragments
                //   message_delta       → final stop_reason etc.
                if (obj?.type === 'content_block_delta' && obj?.delta?.text) {
                  acc += obj.delta.text;
                  setMessages(prev => {
                    const copy = prev.slice();
                    const last = copy[copy.length - 1];
                    if (last && last.role === 'assistant') {
                      copy[copy.length - 1] = { ...last, text: acc };
                    }
                    return copy;
                  });
                }
              } catch {
                // Ignore non-JSON keepalive / comment frames.
              }
            }
          }
        }
        clearTimeout(timer);
        return;
      }
      clearTimeout(timer);

      if (r.status === 501) {
        // Provider not configured. Try the context-aware curated
        // answer first ("what's overdue?", "what's next this week?")
        // because those questions use the user's own checklist state
        // and are usually more valuable than a generic KB hit. Fall
        // back to KB search for everything else.
        if (curated) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: curated,
            source: 'context-aware',
          }]);
          setBusy(false);
          return;
        }
        const hit = searchKB(q);
        if (hit) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: `${hit.a}\n\n[Citation: ${hit.citation}]\n\nNote: live AI is not configured in this deployment yet. This answer was matched from the curated JTR / FTR / DSSR knowledge base.`,
            source: 'curated-kb',
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'system',
            text: 'Live AI is not configured in this deployment, and the curated knowledge base did not have a matching entry. Open the JTR Assistant tab inside Movement & Logistics for the full curated library, or escalate this question to your gaining installation Finance Office.',
          }]);
        }
      } else if (!r.ok) {
        // Backend unreachable (Railway 404, 5xx upstream, etc.) — fall
        // through to the same curated path the 501 branch uses so the
        // assistant always produces SOMETHING useful instead of a
        // generic "try again later" dead end.
        answerFromLocalSources(q, curated, /*reason=*/ `backend returned HTTP ${r.status}`);
      } else {
        const data = await r.json();
        const answer = String(data?.answer || '').trim();
        const src = data?.source ? String(data.source) : '';
        setMessages(prev => [...prev, { role: 'assistant', text: answer || 'No answer returned.', source: src }]);
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        // Time-budget exceeded — still try to answer locally before
        // giving up. A 30s wait followed by "try a shorter question"
        // is the worst possible UX.
        answerFromLocalSources(q, curated, /*reason=*/ 'request timed out');
      } else {
        // Network / DNS / TLS / fetch failure — same fallback path.
        answerFromLocalSources(q, curated, /*reason=*/ 'network error');
      }
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 24, 33, 0.65)',
        zIndex: 400,
        display: 'flex',
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isDesktop ? 32 : 0,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: isDesktop ? 640 : 480,
          maxHeight: isDesktop ? '85vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isDesktop ? 18 : '18px 18px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E0E6EE', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span aria-hidden="true" style={{ fontSize: 18 }}>🤖</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821' }}>AI Assistant</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', letterSpacing: '.06em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>PCS Express helper · JTR · FTR · DSSR</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => exportConversationAsPdf(messages, language)}
              disabled={messages.length === 0}
              aria-label="Save conversation as printable PDF"
              title="Save conversation as PDF"
              style={{
                background: messages.length === 0 ? 'rgba(0,0,0,0.06)' : '#0D3B66',
                border: '1px solid ' + (messages.length === 0 ? 'rgba(0,0,0,0.08)' : '#0D3B66'),
                color: messages.length === 0 ? '#56697C' : '#FFFFFF',
                fontSize: 11,
                cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                padding: '4px 10px',
                borderRadius: 8,
                fontWeight: 800,
                opacity: messages.length === 0 ? 0.6 : 1,
              }}
            >
              💾 PDF
            </button>
            <button onClick={onClose} aria-label="Close AI Assistant" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: '#56697C', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>✕</button>
          </div>
        </div>

        {/* Crisis-line safety header — preserved on every AI session.
            The chip changed from SOS to AI; the safety net did not. */}
        <div style={{ background: '#7F1D1D', color: '#FFFFFF', padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#FECACA', letterSpacing: '.10em', textTransform: 'uppercase' }}>In crisis?</div>
          <a href="tel:988" aria-label="Call 988 then 1, Military Crisis Line" style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 900, textDecoration: 'underline' }}>988 then 1</a>
          <a href="tel:18003429647" aria-label="Call 1-800-342-9647, Military OneSource" style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textDecoration: 'underline', opacity: 0.95 }}>OneSource 1-800-342-9647</a>
        </div>

        <div style={{ background: '#FFF8E1', color: '#7A4A00', padding: '8px 14px', fontSize: 11, lineHeight: 1.5, borderBottom: '1px solid #FFE082' }}>
          <strong>OPSEC:</strong> never enter classified, FOUO, CUI, sponsor names, GBL numbers, exact unit IDs, or specific operational dates. Treat this as an unclassified planning conversation.
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#F8FAFC' }}>
          {messages.length === 0 && (
            <div style={{ color: '#56697C', fontSize: 12, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>Ask anything about PCS Express — every mission group, every tool, and the travel regulations behind them (JTR / FTR / DSSR). Every answer cites where it came from.</p>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821', marginTop: 8, marginBottom: 4 }}>Try:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Where do I track my HHG shipment in the app?</li>
                <li>How do I export the PCS Binder?</li>
                <li>How do I look up the OHA rate for my OCONUS base?</li>
                <li>Where do I find free translation help?</li>
                <li>How do I maximize my PPM payout?</li>
                <li>Do I get BAH overseas?</li>
              </ul>
            </div>
          )}
          {messages.map((m, idx) => {
            const nav = m.role === 'assistant' ? parseInappCitation(m) : null;
            const parsed = m.role === 'assistant' ? parseAIActions(m.text) : { cleanText: m.text, actions: [] };
            const renderText = m.role === 'assistant' ? parsed.cleanText : m.text;
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{
                  maxWidth: '85%',
                  background: m.role === 'user' ? '#0D3B66' : m.role === 'system' ? '#FFF8E1' : '#FFFFFF',
                  color: m.role === 'user' ? '#FFFFFF' : '#0D1821',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: m.role === 'user' ? 'none' : `1px solid ${m.role === 'system' ? '#FFE082' : '#E0E6EE'}`,
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {renderText}
                  {m.source && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', marginTop: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>source: {m.source}</div>
                  )}
                  {parsed.actions.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {parsed.actions.map((a, ai) => {
                        if (a.verb === 'open_tab') {
                          return (
                            <button
                              key={ai}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('pcs-navigate', { detail: { tab: a.tab } }));
                                onClose();
                              }}
                              aria-label={`Open ${a.label}`}
                              style={{ padding: '5px 10px', borderRadius: 999, background: '#1B5E20', color: '#FFFFFF', border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                            >
                              <span aria-hidden="true">↗</span> Open {a.label}
                            </button>
                          );
                        }
                        if (a.verb === 'ask_followup') {
                          return (
                            <button
                              key={ai}
                              onClick={() => { setQuestion(a.q); inputRef.current?.focus(); }}
                              aria-label={`Ask follow-up: ${a.q}`}
                              style={{ padding: '5px 10px', borderRadius: 999, background: '#FFFFFF', color: '#0D3B66', border: '1px solid #0D3B66', fontSize: 10, fontWeight: 800, cursor: 'pointer', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              <span aria-hidden="true">?</span> {a.q}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                  {nav && (
                    <button
                      onClick={() => {
                        // Hand routing back to App.jsx via a custom
                        // event. App listens for `pcs-navigate` and
                        // handles the tab change + sub-tab one-shot
                        // mechanism. We just close the modal once
                        // the navigation is requested.
                        window.dispatchEvent(new CustomEvent('pcs-navigate', { detail: { tab: nav.tab, sub: nav.sub || null } }));
                        onClose();
                      }}
                      aria-label={`Open ${nav.label}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 999, background: '#0D3B66', color: '#FFFFFF', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      <span aria-hidden="true">↗</span> Open {nav.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <div className="pcs-skeleton" style={{ background: 'linear-gradient(90deg, #F0F4F8 25%, #FAFBFC 50%, #F0F4F8 75%)', backgroundSize: '200% 100%', animation: 'pcs-skeleton-shimmer 1.4s ease-in-out infinite', borderRadius: 12, padding: '10px 12px', minWidth: 180, height: 40 }} />
            </div>
          )}
        </div>

        <div style={{ padding: 10, borderTop: '1px solid #E0E6EE', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything — app features, JTR/FTR/DSSR, OCONUS…"
              aria-label="Type your question to the AI Assistant"
              rows={2}
              maxLength={1000}
              style={{ flex: 1, border: '1px solid #D8DEE7', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#111827', background: '#FFFFFF', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              onClick={submit}
              disabled={busy || !question.trim()}
              aria-label="Send question to AI Assistant"
              style={{ padding: '10px 14px', background: busy || !question.trim() ? '#BDBDBD' : '#0D3B66', color: '#FFF', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: busy || !question.trim() ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              {busy ? '…' : 'Send'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#56697C' }}>
            <span>{question.length}/1000 chars · Enter to send · Shift+Enter for newline · Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export keeps the old single-component import working for
// callers that still wrap chip + modal together (none today, but
// guards against future imports breaking).
export default AIAssistantModal;
