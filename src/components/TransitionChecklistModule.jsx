/*
 * Transition & Separation Checklist — for service members leaving the
 * service AND DoD civilians leaving federal service.
 *
 * Everything is tailored from two inputs:
 *   1. Onboarding profile  — branch + component (military vs DoD Civilian).
 *   2. In-tab questionnaire — separation type + benefits track.
 *
 * The milestone list is a single predicate-filtered table (same shape as
 * App.jsx's CHECKLIST_FILTERS) so a task only renders when EVERY tailoring
 * dimension that applies to it matches the user. Output is grouped into a
 * vertical T-minus timeline. Checkbox state + the two questionnaire answers
 * persist via the same encrypted secureLocalStore used everywhere else.
 *
 * Accuracy posture: this is a planning aid, not benefits counseling. Every
 * statutory window (BDD 180–90 days, SGLI→VGLI 1 yr + 120 days, TAMP 180
 * days, etc.) is the published rule as of 2026-05, but the member's actual
 * dates and entitlements are set by their TAP counselor, finance office,
 * and the VA. The disclaimer banner says exactly that.
 *
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import { PlanningAidDisclaimer } from './CalculatorResultLabel';
import SyncStatusIndicator from './SyncStatusIndicator';
import NotificationModeSelector from './NotificationModeSelector';

const STORAGE_KEY = 'pcs_transition_checklist';

// Branch-specific Transition Assistance Program (TAP) name + official
// portal. Space Force is serviced by the Air Force A&FRC network; Coast
// Guard runs under DHS but the TAP statute still applies.
const BRANCH_TAP = {
  Army:          { program: 'SFL-TAP (Soldier for Life – Transition Assistance Program)', url: 'https://www.sfl-tap.army.mil/' },
  Navy:          { program: 'Navy Transition Assistance Program (TAP)',                   url: 'https://www.mynavyhr.navy.mil/Career-Management/Transition-Assistance/' },
  'Marine Corps':{ program: 'Marine Corps Transition Readiness Program (TRP)',            url: 'https://www.usmc-mccs.org/services/career/transition-readiness/' },
  'Air Force':   { program: 'Airman & Family Readiness Center TAP',                       url: 'https://www.afpc.af.mil/Career-Management/Transition-Assistance-Program/' },
  'Space Force': { program: 'Military & Family Readiness Center TAP (USSF)',              url: 'https://www.afpc.af.mil/Career-Management/Transition-Assistance-Program/' },
  'Coast Guard': { program: 'Coast Guard Transition Assistance Program',                  url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources/Health-Safety-and-Work-Life-CG-11/Office-of-Work-Life-CG-111/Transition-Assistance-Program-TAP/' },
};
function tapFor(branch) {
  return BRANCH_TAP[branch] || BRANCH_TAP.Army;
}

// T-minus phases, ordered furthest-out → after separation. Each milestone
// declares its phase; the timeline renders phases in this order.
const PHASE_ORDER = [
  '12+ Months Out',
  '180 Days Out',
  '90 Days Out',
  '60 Days Out',
  '30 Days Out',
  'Final Week',
  'After Separation',
];

const PRIORITY_STYLE = {
  High:   { bg: '#C62828', label: 'High' },
  Medium: { bg: '#C2410C', label: 'Medium' }, // darkened for WCAG AA on white chip text
  Low:    { bg: '#455A64', label: 'Low' },
};

// Master milestone table. `applies(ctx)` is a predicate over the tailoring
// context built in the component. Keep ids stable — they are the persisted
// checkbox keys.
//
// ctx = { isCivilian, branch, tap, isRetirement, isMedical, vaTrack,
//         careerTrack, hasDependents, isOverseas }
const MILESTONES = [
  // ---- 12+ Months Out ---------------------------------------------------
  { id: 'tap-initial', phase: '12+ Months Out', priority: 'High',
    title: 'Attend initial counseling & pre-separation briefing',
    desc: (c) => `Start ${c.tap.program} no later than 365 days before your date of separation. Pre-separation counseling and DD Form 2648 are mandatory for benefits eligibility.`,
    url: (c) => c.tap.url, urlLabel: 'Open your branch TAP portal',
    applies: (c) => !c.isCivilian },
  { id: 'ret-application', phase: '12+ Months Out', priority: 'High',
    title: 'Submit your retirement application / request orders',
    desc: () => 'Most services accept retirement requests 12–9 months out. Confirm your high-3, years of service, and any RCSBP/SBP (Survivor Benefit Plan) election deadlines with your retirement services office.',
    url: () => 'https://www.dfas.mil/retiredmilitary/', urlLabel: 'DFAS Retired Military',
    applies: (c) => !c.isCivilian && c.isRetirement },
  { id: 'civ-opm-retire-start', phase: '12+ Months Out', priority: 'High',
    title: 'Begin FERS retirement planning with HR / OPM',
    desc: () => 'Request a retirement estimate and counseling from your servicing HR office. Verify creditable service, high-3 average, unused sick leave credit, and survivor annuity elections well ahead of your separation date.',
    url: () => 'https://www.opm.gov/retirement-center/', urlLabel: 'OPM Retirement Center',
    applies: (c) => c.isCivilian && c.isRetirement },
  { id: 'va-document-conditions', phase: '12+ Months Out', priority: 'High',
    title: 'Document every service-connected condition now',
    desc: () => 'Get every injury, exposure, and chronic condition into your service treatment record before you out-process. Undocumented conditions are far harder to claim later. Build a personal symptom log with dates.',
    url: () => 'https://www.va.gov/disability/how-to-file-claim/', urlLabel: 'VA — How to file a claim',
    applies: (c) => c.vaTrack },
  { id: 'ptdy-terminal-leave', phase: '12+ Months Out', priority: 'Medium',
    title: 'Plan terminal leave and job/house-hunting PTDY',
    desc: () => 'Map how much terminal (final) leave you will take vs. sell back, and whether you qualify for permissive TDY (up to 20 days, or up to 30/60 for some overseas/retirement cases) for job and house hunting.',
    applies: (c) => !c.isCivilian },

  // ---- 180 Days Out -----------------------------------------------------
  { id: 'tap-curriculum', phase: '180 Days Out', priority: 'High',
    title: 'Complete TAP core curriculum + your chosen track',
    desc: (c) => `Finish the ${c.tap.program} core (resilient transition, MOC crosswalk, financial planning, VA benefits) plus at least one track: Employment, Education, Vocational, or Entrepreneurship.`,
    url: (c) => c.tap.url, urlLabel: 'Branch TAP portal',
    applies: (c) => !c.isCivilian },
  { id: 'va-bdd-file', phase: '180 Days Out', priority: 'High',
    title: 'File your VA claim under Benefits Delivery at Discharge (BDD)',
    desc: () => 'BDD lets you file 180–90 days before separation so a decision can land near your discharge date. You must file within this window to use BDD — after 89 days it becomes a standard post-separation claim.',
    url: () => 'https://www.va.gov/disability/how-to-file-claim/when-to-file/pre-discharge-claim/', urlLabel: 'VA — Pre-discharge (BDD) claim',
    applies: (c) => c.vaTrack },
  { id: 'skillbridge', phase: '180 Days Out', priority: 'Medium',
    title: 'Apply for DoD SkillBridge (industry internship)',
    desc: () => 'SkillBridge places you in a civilian employer internship for up to your last 180 days while you keep military pay and benefits. Requires command approval — start the request early.',
    url: () => 'https://skillbridge.osd.mil/', urlLabel: 'DoD SkillBridge',
    applies: (c) => !c.isCivilian && c.careerTrack },
  { id: 'civ-sf52', phase: '180 Days Out', priority: 'High',
    title: 'Notify HR and submit your separation request (SF-52)',
    desc: () => 'Give your servicing HR office written notice. For resignation, submit the SF-52; for retirement, confirm your application package and the effective date are locked in.',
    url: () => 'https://www.opm.gov/', urlLabel: 'OPM',
    applies: (c) => c.isCivilian },
  { id: 'health-records-180', phase: '180 Days Out', priority: 'High',
    title: 'Request full copies of your medical & dental records',
    desc: () => 'Get complete copies (paper + digital) of your medical and dental records while you still have base access. The VA exam and any future claim depend on them.',
    applies: (c) => !c.isCivilian },

  // ---- 90 Days Out ------------------------------------------------------
  { id: 'va-bdd-late', phase: '90 Days Out', priority: 'High',
    title: 'Last call: lock in your BDD claim before day 89',
    desc: () => 'If you have not filed yet, do it now — the BDD window closes at 90 days out. Attend every scheduled Compensation & Pension (C&P) exam; a missed C&P exam can deny the claim.',
    url: () => 'https://www.va.gov/disability/how-to-file-claim/', urlLabel: 'VA disability claims',
    applies: (c) => c.vaTrack },
  { id: 'tricare-transition', phase: '90 Days Out', priority: 'High',
    title: 'Plan your health-coverage bridge',
    desc: (c) => c.isRetirement
      ? 'Retirees keep TRICARE — enroll in TRICARE Prime or Select (or TRICARE For Life with Medicare at 65) and confirm your retiree DEERS record. Compare with VA health care and any spouse employer plan.'
      : 'Separating members get TRICARE for the day-of-discharge only. Look at the Transitional Assistance Management Program (TAMP, up to 180 days for qualifying involuntary separations), the Continued Health Care Benefit Program (CHCBP), VA health care, or ACA marketplace coverage.',
    url: () => 'https://www.tricare.mil/Plans/Eligibility/LosingMilitaryHealthCoverage', urlLabel: 'TRICARE — losing coverage',
    applies: (c) => !c.isCivilian },
  { id: 'civ-fehb-fegli', phase: '90 Days Out', priority: 'High',
    title: 'Decide what happens to FEHB, FEGLI, and TSP',
    desc: (c) => c.isRetirement
      ? 'To carry FEHB and FEGLI into retirement you generally must have been enrolled for the 5 years before you retire. Confirm eligibility, and decide whether to leave your TSP in place, roll it over, or begin withdrawals.'
      : 'On resignation, FEHB ends but you can elect Temporary Continuation of Coverage (TCC) for up to 18 months, plus a 31-day free extension. Plan your TSP rollover or leave-in-place decision.',
    url: () => 'https://www.opm.gov/healthcare-insurance/', urlLabel: 'OPM — Healthcare & Insurance',
    applies: (c) => c.isCivilian },
  { id: 'gi-bill-transfer', phase: '90 Days Out', priority: 'Medium',
    title: 'Confirm or transfer your Post-9/11 GI Bill',
    desc: () => 'GI Bill transfer to a spouse or child must be requested while still serving and carries a service obligation — do it before you separate. Verify your remaining months of entitlement.',
    url: () => 'https://www.va.gov/education/', urlLabel: 'VA — Education & GI Bill',
    applies: (c) => !c.isCivilian && c.hasDependents },
  { id: 'hhg-schedule', phase: '90 Days Out', priority: 'High',
    title: 'Schedule your final (separation/retirement) HHG move',
    desc: (c) => c.isRetirement
      ? 'Retirees get a final move to a Home of Selection (HOS) anywhere in the U.S., and generally up to 1 year to use it. Schedule transportation in DPS and keep weight tickets if doing a PPM.'
      : 'Separatees rate a move to their Home of Record or place of entry, normally to be used within 180 days. Book early — summer is peak season.',
    url: () => 'https://www.travel.dod.mil/Programs/Personal-Property/', urlLabel: 'DoD Personal Property / DPS',
    applies: (c) => !c.isCivilian },

  // ---- 60 Days Out ------------------------------------------------------
  { id: 'dd214-draft', phase: '60 Days Out', priority: 'High',
    title: 'Review your draft DD-214 line by line',
    desc: () => 'Verify dates of service, rank, awards/decorations, MOS, foreign service, and character of service on the draft DD-214. Errors are painful to fix after separation and affect VA and state benefits.',
    applies: (c) => !c.isCivilian },
  { id: 'civ-sf50-leave', phase: '60 Days Out', priority: 'Medium',
    title: 'Confirm final SF-50 and lump-sum leave payout',
    desc: () => 'Verify your separation/retirement SF-50, your last duty day, and your projected lump-sum annual-leave payment. Confirm any debts or overpayments are resolved.',
    applies: (c) => c.isCivilian },
  { id: 'va-evidence', phase: '60 Days Out', priority: 'High',
    title: 'Gather supporting evidence for your VA claim',
    desc: () => 'Collect private treatment records, buddy/lay statements, and any nexus letters that connect a condition to your service. The more complete the file, the cleaner the rating decision.',
    url: () => 'https://www.va.gov/disability/how-to-file-claim/evidence-needed/', urlLabel: 'VA — Evidence needed',
    applies: (c) => c.vaTrack },
  { id: 'oconus-clearance', phase: '60 Days Out', priority: 'Medium',
    title: 'Start OCONUS out-processing & area clearance',
    desc: () => 'Overseas separations need extra lead time: passport/visa close-out, SOFA de-registration, customs for the HHG shipment, and host-nation utility/lease termination. Begin clearance now.',
    applies: (c) => !c.isCivilian && c.isOverseas },

  // ---- 30 Days Out ------------------------------------------------------
  { id: 'outprocess', phase: '30 Days Out', priority: 'High',
    title: 'Work the installation out-processing checklist',
    desc: () => 'Clear finance, the CIF (turn in issued gear), medical, dental, security/SSO, the library, and housing. Each office signs your clearing papers; missing one can hold up your final pay.',
    applies: (c) => !c.isCivilian },
  { id: 'final-medical-dental', phase: '30 Days Out', priority: 'Medium',
    title: 'Use your remaining medical & dental coverage',
    desc: () => 'Schedule final dental cleanings/work and any outstanding medical appointments while still covered. Fill 90-day prescription refills before your coverage changes.',
    applies: (c) => !c.isCivilian },
  { id: 'retiree-id-deers', phase: '30 Days Out', priority: 'High',
    title: 'Update DEERS and get retiree/dependent ID cards',
    desc: () => 'Retirees and their dependents need new Uniformed Services ID (USID) cards and an updated DEERS record to keep TRICARE, commissary, and exchange access. Book the RAPIDS/ID office appointment early.',
    url: () => 'https://idco.dmdc.osd.mil/idco/', urlLabel: 'RAPIDS ID Card Office Online',
    applies: (c) => !c.isCivilian && c.isRetirement },
  { id: 'address-change', phase: '30 Days Out', priority: 'Low',
    title: 'File change of address (USPS, IRS, SSA, bank)',
    desc: () => 'Submit USPS mail forwarding and update your address with the IRS, Social Security, your bank, DFAS/myPay (or OPM Services Online), and any state agencies so final pay and tax docs reach you.',
    url: () => 'https://moversguide.usps.com/', urlLabel: 'USPS change of address',
    applies: () => true },

  // ---- Final Week -------------------------------------------------------
  { id: 'dd214-collect', phase: 'Final Week', priority: 'High',
    title: 'Collect your DD-214 (member copy) and store it safely',
    desc: () => 'Pick up your signed DD-214 at separation — member copy 4 is the one most agencies want. Store encrypted copies; you will need it for VA, state benefits, employment, and the GI Bill for the rest of your life.',
    applies: (c) => !c.isCivilian },
  { id: 'final-pay', phase: 'Final Week', priority: 'High',
    title: 'Confirm final pay, leave sell-back, and travel voucher',
    desc: () => 'Verify your final/terminal-leave pay on myPay, your leave sell-back, and that your separation travel voucher (DD 1351-2) is ready to file. Watch for any pay debts that could surprise you later.',
    applies: (c) => !c.isCivilian },
  { id: 'cac-vic', phase: 'Final Week', priority: 'High',
    title: 'Plan for CAC deactivation — get your Veteran ID',
    desc: () => 'Your CAC stops working at separation. Apply for the VA-issued Veteran Health Identification Card or the Veteran ID Card (VIC) for proof of service, and enroll in VA.gov / Login.gov access now.',
    url: () => 'https://www.va.gov/records/get-veteran-id-cards/', urlLabel: 'VA — Get a Veteran ID card',
    applies: (c) => !c.isCivilian },
  { id: 'civ-clearout', phase: 'Final Week', priority: 'High',
    title: 'Turn in badge/equipment and lock in benefits continuation',
    desc: () => 'Return your PIV/badge, government laptop, and property. Confirm your FEHB 31-day extension and TCC election (if separating), or your FEHB-into-retirement transfer, and your final TSP instructions.',
    applies: (c) => c.isCivilian },

  // ---- After Separation -------------------------------------------------
  { id: 'va-healthcare-enroll', phase: 'After Separation', priority: 'High',
    title: 'Enroll in VA health care',
    desc: () => 'Apply for VA health care — recent combat veterans have an enhanced enrollment window, and the PACT Act expanded eligibility for toxic-exposure conditions. Enroll even if you are unsure; it preserves access.',
    url: () => 'https://www.va.gov/health-care/apply/application/', urlLabel: 'VA — Apply for health care',
    applies: (c) => c.vaTrack || !c.isCivilian },
  { id: 'sgli-vgli', phase: 'After Separation', priority: 'High',
    title: 'Convert SGLI to VGLI before the window closes',
    desc: () => 'You can convert SGLI to Veterans Group Life Insurance (VGLI) within 1 year and 120 days of separation — and within the first 240 days no health questions are asked. Do not let the deadline pass.',
    url: () => 'https://www.va.gov/life-insurance/options-eligibility/vgli/', urlLabel: 'VA — VGLI',
    applies: (c) => !c.isCivilian },
  { id: 'travel-voucher-file', phase: 'After Separation', priority: 'High',
    title: 'File your separation travel & relocation voucher',
    desc: () => 'Submit your DD 1351-2 travel voucher (and PPM/weight-ticket packet, if applicable) promptly after the move — typically within a few days of completion — to get reimbursed for your final move.',
    url: () => 'https://www.travel.dod.mil/', urlLabel: 'travel.dod.mil',
    applies: (c) => !c.isCivilian },
  { id: 'va-disability-track', phase: 'After Separation', priority: 'High',
    title: 'Track your VA claim and set up direct deposit',
    desc: () => 'Follow your claim status on VA.gov, respond to any requests for evidence quickly, and add direct-deposit banking so compensation pays on time once a rating is granted.',
    url: () => 'https://www.va.gov/claim-or-appeal-status/', urlLabel: 'VA — Check claim status',
    applies: (c) => c.vaTrack },
  { id: 'civ-opm-annuity', phase: 'After Separation', priority: 'High',
    title: 'Confirm your first OPM annuity / interim payment',
    desc: () => 'After your agency sends your retirement package to OPM, you will receive interim payments while OPM finalizes the claim. Set up OPM Services Online and verify FEHB premiums are deducting correctly.',
    url: () => 'https://www.servicesonline.opm.gov/', urlLabel: 'OPM Services Online',
    applies: (c) => c.isCivilian && c.isRetirement },
  { id: 'state-benefits', phase: 'After Separation', priority: 'Low',
    title: 'Claim state veteran benefits',
    desc: () => 'Many states offer property-tax exemptions, free/discounted vehicle registration, a veteran designation on your driver license, tuition benefits, and hiring preference. Check your state veterans affairs office.',
    url: () => 'https://www.va.gov/statedva.htm', urlLabel: 'VA — State veterans affairs offices',
    applies: (c) => !c.isCivilian },
  { id: 'career-onestop', phase: 'After Separation', priority: 'Medium',
    title: 'Activate your civilian job search',
    desc: () => 'Use your federal hiring preference where it applies, post your resume, and tap veteran employment programs (DOL VETS, Hiring Our Heroes, USAJOBS for federal roles). Translate your experience into civilian terms.',
    url: () => 'https://www.dol.gov/agencies/vets/veterans', urlLabel: 'DOL — Veterans’ employment',
    applies: (c) => c.careerTrack || c.isCivilian },

  // ---- Medical separation (IDES / MEB / PEB) — only when separation type
  //      is Medical. Sourced from the DoD IDES program + VA disability. ----
  { id: 'med-ides-peblo', phase: '12+ Months Out', priority: 'High',
    title: 'Meet your PEBLO and learn the IDES process',
    desc: () => 'A medical separation runs through the Integrated Disability Evaluation System (IDES): MEB → PEB → VA rating, all from one set of exams. Your Physical Evaluation Board Liaison Officer (PEBLO) is your case manager — get their contact and the projected timeline early.',
    url: () => 'https://www.health.mil/Military-Health-Topics/Conditions-and-Treatments/Physical-Disability-Board-of-Review', urlLabel: 'DoD — Disability evaluation',
    applies: (c) => c.isMedical },
  { id: 'med-meb-narsum', phase: '12+ Months Out', priority: 'High',
    title: 'Make sure the MEB narrative captures EVERY condition',
    desc: () => 'The Medical Evaluation Board (MEB) narrative summary (NARSUM) lists the conditions referred to the board. Review it with your provider — anything left off is far harder to claim later. Request copies of all supporting records.',
    applies: (c) => c.isMedical },
  { id: 'med-cp-exams', phase: '180 Days Out', priority: 'High',
    title: 'Complete your single set of VA C&P exams',
    desc: () => 'Under IDES you do ONE set of VA Compensation & Pension (C&P) exams that feed both the PEB fitness decision and your VA disability rating. Attend every exam — a missed C&P exam stalls the whole case.',
    url: () => 'https://www.va.gov/disability/va-claim-exam/', urlLabel: 'VA — Claim exam (C&P)',
    applies: (c) => c.isMedical },
  { id: 'med-ratings', phase: '90 Days Out', priority: 'High',
    title: 'Understand your DoD fitness finding vs your VA rating',
    desc: () => 'The PEB decides only whether each condition makes you unfit for duty (and assigns a DoD disability % for the unfitting ones); the VA rates ALL service-connected conditions. A combined DoD rating of 30%+ on the unfitting conditions generally means medical RETIREMENT; below 30% is usually separation with severance.',
    url: () => 'https://www.va.gov/disability/about-disability-ratings/', urlLabel: 'VA — About disability ratings',
    applies: (c) => c.isMedical },
  { id: 'med-appeal', phase: '90 Days Out', priority: 'High',
    title: 'Decide whether to accept or appeal the PEB findings',
    desc: () => 'You can accept the PEB findings, submit a rebuttal, or request a formal board hearing. Talk to your service’s military disability counsel BEFORE signing — they’re free and represent you, not the command.',
    applies: (c) => c.isMedical },
  { id: 'med-tdrl', phase: '60 Days Out', priority: 'Medium',
    title: 'Know TDRL vs PDRL (if medically retired)',
    desc: () => 'Some conditions place you on the Temporary Disability Retired List (TDRL) with periodic re-exams before a final decision; stable conditions go to the Permanent Disability Retired List (PDRL). Confirm which applies and your re-exam schedule.',
    applies: (c) => c.isMedical },
  { id: 'med-crdp-crsc', phase: 'After Separation', priority: 'High',
    title: 'Apply for CRSC / confirm CRDP if medically retired',
    desc: () => 'Medically retired veterans may have retired pay offset by VA compensation. Combat-Related Special Compensation (CRSC) and Concurrent Retirement & Disability Pay (CRDP) can restore some or all of it — CRSC requires an application through your branch.',
    url: () => 'https://www.dfas.mil/RetiredMilitary/disability/crsc/', urlLabel: 'DFAS — CRSC / CRDP',
    applies: (c) => c.isMedical },
  { id: 'med-pay-start', phase: 'After Separation', priority: 'High',
    title: 'Confirm disability severance / retired pay and VA start date',
    desc: () => 'Verify with DFAS whether you received disability severance pay or medical retired pay, and confirm when VA compensation begins (severance pay may be recouped from VA pay for the same condition). Keep every disposition document.',
    url: () => 'https://www.dfas.mil/retiredmilitary/', urlLabel: 'DFAS — Retired military pay',
    applies: (c) => c.isMedical },
];

// Always-relevant official anchors, shown under the timeline.
const RESOURCES = [
  { name: 'DoD TAP (DoDTAP)',           desc: 'Official DoD Transition Assistance Program hub and eForms.',          url: 'https://www.dodtap.mil/' },
  { name: 'VA.gov',                     desc: 'Disability, health care, education, home loan, and life insurance.', url: 'https://www.va.gov/' },
  { name: 'Military OneSource — Transition', desc: 'Free transition counseling, MilTax, and relocation support.',    url: 'https://www.militaryonesource.mil/resources/tools-apps/transition-assistance/' },
  { name: 'OPM Retirement Center',      desc: 'Federal civilian (FERS/CSRS) retirement and insurance.',             url: 'https://www.opm.gov/retirement-center/' },
  { name: 'eBenefits / VA claim status',desc: 'Track claims, appeals, and download VA letters.',                   url: 'https://www.va.gov/claim-or-appeal-status/' },
];

// ---------------------------------------------------------------------------

export default function TransitionChecklistModule({ theme, profile }) {
  const isCivilian = profile?.component === 'DoD Civilian';

  // In-tab questionnaire answer: how the user is leaving service.
  const [separationType, setSeparationType] = useState(isCivilian ? 'resignation' : 'ets');
  const [checks, setChecks] = useState({});

  // Hydrate persisted state once.
  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, null).then(saved => {
      if (!mounted || !saved) return;
      if (saved.separationType) setSeparationType(saved.separationType);
      if (saved.checks && typeof saved.checks === 'object') setChecks(saved.checks);
    });
    return () => { mounted = false; };
  }, []);

  const isRetirement = separationType === 'retirement' || separationType === 'fers_retirement';
  const isMedical = separationType === 'medical';
  // Every separating/retiring service member is a veteran, so the VA track
  // (disability/BDD, VA health, SGLI→VGLI) always applies to military
  // audiences; DoD civilians off-board federal service and don't get the
  // military VA items. The career track applies to everyone.
  const vaTrack = !isCivilian;
  const ctx = {
    isCivilian,
    branch: profile?.branch || 'Army',
    tap: tapFor(profile?.branch),
    isRetirement,
    isMedical,
    vaTrack,
    careerTrack: true,
    hasDependents: !!(profile?.hasDependents || profile?.hasChildren),
    isOverseas: !!profile?.isOverseas,
  };

  const visible = MILESTONES.filter(m => m.applies(ctx));
  const grouped = PHASE_ORDER
    .map(phase => ({ phase, items: visible.filter(m => m.phase === phase) }))
    .filter(g => g.items.length > 0);

  const total = visible.length;
  const done = visible.filter(m => checks[m.id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Outstanding (unchecked) milestones feed the device-notification + the
  // Command Center priority feed, carrying each milestone's own priority.
  const outstandingAlerts = visible
    .filter(m => !checks[m.id])
    .map(m => ({ id: m.id, title: m.title, priority: m.priority }));

  const toggle = (id) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    secureLocalStore.set(STORAGE_KEY, { separationType, checks: next });
    AuditLogger.record('transition_checklist_change', { id, complete: !!next[id] });
  };

  const chooseSeparation = (value) => {
    setSeparationType(value);
    secureLocalStore.set(STORAGE_KEY, { separationType: value, checks });
  };

  // Audience-aware separation-type options.
  const separationOptions = isCivilian
    ? [
        { value: 'resignation',     label: 'Resignation / separation' },
        { value: 'fers_retirement', label: 'FERS retirement' },
      ]
    : [
        { value: 'ets',        label: 'Separation (ETS / end of contract)' },
        { value: 'retirement', label: 'Retirement (20+ years)' },
        { value: 'medical',    label: 'Medical (MEB / PEB)' },
      ];

  const headingKicker = isCivilian ? 'Federal Civilian Off-Boarding' : 'Military Transition';
  const audienceBranch = isCivilian ? `DoD Civilian · ${ctx.branch}` : ctx.branch;

  return (
    <div className="pet-page">
      <div className="pet-header">
        <div>
          <div className="assistance-kicker">{headingKicker}</div>
          <h2>Transition &amp; Separation</h2>
          <p>
            {isCivilian
              ? 'A tailored off-boarding timeline for DoD civilians leaving federal service — OPM retirement, FEHB/FEGLI, TSP, and final-pay milestones.'
              : `A tailored timeline for leaving the service. Built for ${ctx.tap.program.split(' (')[0]} and your VA, finance, and out-processing deadlines.`}
          </p>
        </div>
        <SyncStatusIndicator />
      </div>

      {/* Questionnaire — the fork that tailors the timeline. */}
      <section
        aria-label="Transition questionnaire"
        style={{ background: '#F4F7FB', border: '1px solid #DCE4EE', borderRadius: 14, padding: 16, marginBottom: 16 }}
      >
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.12em', marginBottom: 4 }}>
          TAILOR MY CHECKLIST
        </div>
        <p style={{ fontSize: 12, color: '#43526B', margin: '0 0 12px', lineHeight: 1.5 }}>
          Showing milestones for <strong>{audienceBranch}</strong>. Choose how you're leaving below and the timeline updates instantly.
        </p>

        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 12px' }}>
          <legend style={{ fontSize: 12, fontWeight: 800, color: '#1F2A3C', marginBottom: 6 }}>
            {isCivilian ? 'How are you leaving federal service?' : 'How are you leaving the service?'}
          </legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {separationOptions.map(opt => {
              const active = separationType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => chooseSeparation(opt.value)}
                  aria-pressed={active}
                  className="pcs-tab"
                  style={{
                    borderRadius: 999,
                    padding: '8px 15px',
                    border: `1.5px solid ${active ? theme.primary : '#D4DCE8'}`,
                    background: active ? theme.primary : '#FFF',
                    color: active ? '#FFF' : '#43526B',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      {/* Progress */}
      <div className="pcs-progress-card">
        <div className="pcs-progress-card__row">
          <strong>Overall Progress</strong>
          <span>{done}/{total} milestones · {pct}%</span>
        </div>
        <div className="pcs-progress-card__bar">
          <div style={{ width: `${pct}%`, background: pct === 100 ? '#2E7D32' : theme.accent }} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <NotificationModeSelector theme={theme} checklistId="transition-checklist" checklistLabel="Transition" alerts={outstandingAlerts} />
      </div>

      {/* Vertical T-minus timeline */}
      <div aria-label="Transition timeline" style={{ marginTop: 16 }}>
        {grouped.map(({ phase, items }) => {
          const phaseDone = items.filter(m => checks[m.id]).length;
          return (
            <section key={phase} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: theme.primary, flexShrink: 0, boxShadow: `0 0 0 4px ${theme.accent}22` }} aria-hidden="true" />
                <h3 style={{ fontSize: 13, fontWeight: 900, color: '#16202F', margin: 0, letterSpacing: '.02em' }}>{phase}</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7A90' }}>{phaseDone}/{items.length}</span>
              </div>

              <div style={{ borderLeft: `2px solid ${theme.accent}33`, marginLeft: 5, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(m => {
                  const checked = !!checks[m.id];
                  const pr = PRIORITY_STYLE[m.priority] || PRIORITY_STYLE.Low;
                  const url = typeof m.url === 'function' ? m.url(ctx) : m.url;
                  const urlLabel = m.urlLabel || 'Open official resource';
                  return (
                    <div
                      key={m.id}
                      style={{
                        position: 'relative',
                        background: checked ? '#F1F8F2' : '#FFFFFF',
                        border: `1px solid ${checked ? '#A5D6A7' : '#E2E8F1'}`,
                        borderRadius: 12,
                        padding: 14,
                        transition: 'background 160ms ease, border-color 160ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`${checked ? 'Mark incomplete' : 'Mark complete'}: ${m.title}`}
                          onClick={() => toggle(m.id)}
                          style={{
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            border: `2px solid ${checked ? '#2E7D32' : '#B6C2D2'}`,
                            background: checked ? '#2E7D32' : '#FFF',
                            color: '#FFF',
                            cursor: 'pointer',
                            fontSize: 15,
                            fontWeight: 900,
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span aria-hidden="true">{checked ? '✓' : ''}</span>
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 900,
                                letterSpacing: '.08em',
                                color: '#FFF',
                                background: pr.bg,
                                padding: '2px 7px',
                                borderRadius: 6,
                                textTransform: 'uppercase',
                              }}
                            >
                              {pr.label} priority
                            </span>
                            <strong style={{
                              fontSize: 13.5,
                              color: '#16202F',
                              textDecoration: checked ? 'line-through' : 'none',
                              opacity: checked ? 0.7 : 1,
                            }}>
                              {m.title}
                            </strong>
                          </div>
                          <p style={{ fontSize: 12, color: '#43526B', lineHeight: 1.55, margin: '0 0 6px' }}>
                            {typeof m.desc === 'function' ? m.desc(ctx) : m.desc}
                          </p>
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${urlLabel} (opens in a new tab)`}
                              style={{ fontSize: 12, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}
                            >
                              {urlLabel} →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div style={{ margin: '4px 0 16px' }}>
        <PlanningAidDisclaimer />
      </div>

      <section className="pet-resources" aria-label="Transition resources">
        <h3>Official Transition Resources</h3>
        {RESOURCES.map(resource => (
          <a key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.name} (opens in a new tab)`}>
            <strong>{resource.name}</strong>
            <span>{resource.desc}</span>
          </a>
        ))}
      </section>
    </div>
  );
}
