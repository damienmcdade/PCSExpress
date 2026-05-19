/*
 * Interactive demo tour for PCS Express.
 *
 * Plain-language pass: every step explains one feature in 1–2 short
 * sentences plus a bullet list of what to look at. No crypto jargon
 * ("non-extractable CryptoKey", "envelope shape"), no military shorthand
 * the user might not know yet ("MEDDAC", "MILPDS"). Branch-specific
 * form numbers stay (DA 31, NAVPERS) because those are the words users
 * are trained on.
 *
 * The demo profile that backs this tour: SFC Marcus Thompson, Army
 * National Guard, Fort Liberty → USAG Humphreys, OCONUS PCS in 75 days,
 * spouse + 3 kids + pets, moving himself (PPM).
 */

import { useState } from 'react';
import './DemoTour.css';

const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PCS Express',
    description: "You're in demo mode as SFC Marcus Thompson — Army National Guard, moving from Fort Liberty to USAG Humphreys overseas in 75 days, with spouse, 3 kids, pets, and moving yourself (PPM).",
    content: 'This quick tour shows the main features. You can skip it any time.\n\nTap Next to start.',
    action: null,
  },
  {
    id: 'home-tminus',
    title: 'Your countdown clock',
    description: 'The Home screen shows how many days until you need to report. Each line tells you what to do next.',
    content: 'You\'ll see things like:\n• 90 days out — Book your household goods pickup\n• 75 days out — Ask for house-hunting leave\n• 60 days out — Get your medical and dental records\n• Move week — Be home when the movers come\n\nThe color changes as you get closer:\n• Green — You\'ve already arrived\n• Yellow / amber — Under a month to go\n• Red — Final week',
    action: 'Go to Home',
    target: 'home',
  },
  {
    id: 'home-component',
    title: 'Tips just for Guard members',
    description: "Because Marcus is in the National Guard, the Home screen shows a card with tips Active Duty users don't see.",
    content: 'For Guard members:\n• Check whether your orders are Title 10 (federal) or Title 32 (state, paid by feds)\n• Call your State HQ before you leave if you need to update state benefits\n• Sign up for TRICARE Reserve Select within 60 days so your family doesn\'t lose coverage\n• Update your driver\'s license, taxes, and voter registration if you\'re moving to a new state for 6+ months\n\nReservists and AGR see similar cards tailored to their situation.',
    action: 'Go to Home',
    target: 'home',
  },
  {
    id: 'zero-upload',
    title: 'Your data stays on your phone',
    description: 'PCS Express never asks for copies of your orders, IDs, or any other files.',
    content: "Here's how it works:\n• Everything you type is scrambled with strong encryption (AES-256) and saved only on this device.\n• Even if someone steals your phone, they can't read it.\n• We never see your data. There's no PCS Express server that stores anything.\n• Nothing to hack means nothing to leak.\n\nThere's a small 🔒 button in the bottom corner that says \"Just saved\" or \"Saved 30s ago\" — that's just confirming your changes are saved. Tap it for details.",
    action: null,
    target: 'home',
  },
  {
    id: 'translation',
    title: '12 languages',
    description: 'Pick your language during onboarding and the whole app switches.',
    content: 'Supported: English, Spanish, German, French, Korean, Japanese, Tagalog, Arabic, Chinese, Italian, Portuguese, Vietnamese.\n\nNavigation, headings, and labels are translated word-for-word. Longer how-to text may stay in English on some screens — when that happens, a small banner reminds you to check the English original or the official source before acting on it.\n\nTo change languages later, tap More → Reset / Re-onboard and pick a new one.',
    action: null,
    target: 'home',
  },
  {
    id: 'documents',
    title: 'PCS Documents & Binder',
    description: "All the forms you need, sorted into 7 tabs — only the ones that apply to you — plus a one-tap photo capture per document for the new PCS Binder export.",
    content: 'For Marcus (Army Guard, moving overseas) you\'ll see:\n• Unit: PCS orders, leave form (DA 31), soldier record brief\n• Family & Admin: emergency data (DD 93), SGLI beneficiary, family care plan, school records\n• OCONUS: passports, no-fee passport letter (DD 1056), country clearance, International Driving Permit, POV shipment authorization\n• Household Goods: weight tickets (PPM only), inventory, pro-gear list\n• Travel & Finance: travel voucher (with foreign-currency receipts), lodging receipts, mileage log\n• Housing: OHA / MIHA authorization and Utility / Recurring Maintenance Allowance paperwork — BAH does not apply overseas, so Marcus coordinates with the gaining housing office instead.\n• Medical: records transfer, immunizations, TRICARE Overseas Program (TOP) enrollment via International SOS\n\nNEW — PCS Binder:\n• Tap "Attach photo / scan" under any document to capture orders, school records, pet shot records, or vehicle title with your phone\'s camera.\n• Attachments are compressed and encrypted (AES-256) on the device. Nothing uploads anywhere.\n• When everything is gathered, tap "Export PCS Binder as printable PDF" — the app stitches every doc + every photo into one PDF you hand to the gaining S1 / HR / VA.\n\nCheck each item off as you gather it. We don\'t want copies — just a checkmark and an optional photo for your own records.',
    action: 'Go to Documents',
    target: 'documents',
  },
  {
    id: 'checklist',
    title: 'PCS Checklist',
    description: 'A full task list, one phase at a time, written for your branch.',
    content: 'Six phases:\n• Orders Received\n• 90 Days Out\n• 60 Days Out\n• 30 Days Out\n• Move Week\n• In-Processing\n\nThere are about 100 tasks per branch. Each task uses the words your branch uses — Soldiers see "IPPS-A", Sailors see "NSIPS", Marines see "MOL", Airmen and Guardians see "myPers", Coast Guard sees "Direct Access".\n\nTasks that don\'t apply to you (pet stuff, school stuff, OCONUS-only items) are hidden automatically.',
    action: 'Go to Checklist',
    target: 'checklist',
  },
  {
    id: 'home-relocation',
    title: 'Home & Money',
    description: 'BAH / OHA / LQA / PPM estimators, an inflation-adjusted budget, a live HHG shipment tracker, the new digital inventory vault, and the JTR Assistant — all in one tab.',
    content: 'For Marcus going overseas, the Home Relocation tab has eight sub-tabs:\n• Home Locator — real rental listings, off-base or on, with OCONUS housing-office contacts\n• OHA Calculator — rate by country, rank, and family size (BAH doesn\'t apply overseas). OHA / MIHA / COLA / LQA / TQSA resources are all linked here.\n• PPM Estimator — Marcus picked PPM at onboarding. The estimator warns him that PPM is generally not authorized at most OCONUS bases per JTR §050302, so he should confirm with the gaining PPSO.\n• Budget Tracker — NEW: every expense row now shows a 2026 inflation-adjusted planning range built from BLS CPI (fuel, lodging, food) and GSA per-diem ceilings. If Marcus enters a fuel cost above the high estimate, the app flags it red and tells him to coordinate supplemental reimbursement with finance.\n• Shipment Tracker — NEW (see next step)\n• Inventory & Claims — NEW digital vault (see next step)\n• JTR Assistant — NEW (see next step)\n• Move Aid + VA Loan — financial assistance organizations + the OCONUS-aware VA Home Loan guidance.',
    action: 'Go to Home Relocation',
    target: 'home-relocation',
  },
  {
    id: 'shipment-tracker',
    title: 'HHG Shipment Tracker — real-time transparency',
    description: 'The Defense Personal Property System (DPS) doesn’t publish a tracking API. PCS Express gives you a 10-stage milestone ladder with overdue alerts so the shipment is never a black box.',
    content: 'Inside Home Relocation → Shipment Tracker:\n• Enter your GBL / TCN, TSP name, contact phone, and your spread windows.\n• Hit "Start tracking" and tap "Mark done" as each milestone clears: counseling → TSP assigned → pre-move survey → packing → loaded → in transit → arrival call → delivered → claim filed → claim settled.\n• Every stage has a published JTR service-level window — if a stage runs past the window, the app flags it amber and tells Marcus to escalate to the gaining PPSO or the TSP.\n• Opt in to browser push notifications for overdue alerts.\n• All shipment metadata is encrypted (AES-256) on the device. Nothing is sent to a PCS Express server. Deep links route directly to dps.move.mil and the customer portal so the next official action is always one tap away.',
    action: 'Go to Home Relocation',
    target: 'home-relocation',
  },
  {
    id: 'inventory-vault',
    title: 'Digital Inventory & Claims Vault',
    description: 'Replaces the paper DD 1840 / 1840R workflow with a photo-first inventory you can hand to a claim adjuster — without uploading anything.',
    content: 'Inside Home Relocation → Inventory & Claims:\n• Walk every room before pack-out and capture each item: name, room, declared replacement value, condition, optional photo.\n• Switch to the "post-delivery" phase at arrival and re-walk the same rooms. Anything you flag Damaged or Poor gets highlighted.\n• Tap "Export DD 1840R-ready claim worksheet" — the app builds a printable PDF with every room, every item, every photo, totals, and a damage summary. Browser Print → Save as PDF, attach to the DPS claim.\n• Filing window: 75 days for full Best Replacement Value, hard deadline 9 months.\n• Photos are compressed to ~720px and stored encrypted (AES-256) on the device. They never upload. Even if the device is lost, the AES key is non-extractable and the data stays unreadable.',
    action: 'Go to Home Relocation',
    target: 'home-relocation',
  },
  {
    id: 'jtr-assistant',
    title: 'JTR Assistant — the regs in plain language',
    description: 'Curated, citation-backed answers to the JTR / FTR / DSSR questions families ask most often. Searchable. Cite-able. Honest about what it doesn’t know.',
    content: 'Inside Home Relocation → JTR Assistant:\n• 14 hand-written answers covering PPM payout, TLE vs TLA, Dislocation Allowance, POV shipment, OCONUS OHA / MIHA / LQA, pet allowance, civilian House Hunting Trip, real-estate reimbursement, Combat Zone Tax Exclusion, Form 2555 FEIE, weight allowance by rank, POV mileage (MALT), and the claim window. Each answer carries the JTR / FTR / DSSR section number.\n• Local keyword search — no network call, no upload.\n• Optional "Ask anything" field that can route a free-text question to an AI gateway when a JTR_ASSISTANT_PROVIDER is configured (Anthropic, OpenAI, or a private model). Until then it returns a clear "Not configured" message and points you at the gaining finance office.\n• Permanent OPSEC banner above the input — never paste classified, FOUO, GBL numbers, or specific dates.\n• Authoritative resource links to the official JTR, FTR, DSSR, and IRS Pub 3 (Armed Forces Tax Guide) at the bottom of the tab.',
    action: 'Go to Home Relocation',
    target: 'home-relocation',
  },
  {
    id: 'base-intel',
    title: 'Base Intel',
    description: 'What real military families say about your new base.',
    content: 'For USAG Humphreys you\'ll see:\n• Verified reviews from service members and dependents\n• Reviews are tagged "Military Family Verified" when we can confirm with a .mil email\n• Honest empty state if no one has reviewed a base yet — we never make up fake reviews\n• Categories: Housing, Schools, Childcare',
    action: 'Go to Base Intelligence',
    target: 'base-intelligence',
  },
  {
    id: 'family-readiness',
    title: 'Family Readiness',
    description: 'Sub-tabs for deployment, EFMP, jobs, immigration, pets, and schools.',
    content: "Marcus has pets, so the Pets tab is important:\n• APHIS / USDA paperwork for getting pets overseas\n• Vet checklist (rabies shot, microchip)\n• Korea's pet rules (Korea usually doesn\'t require quarantine if your paperwork is in order)\n• How to book pets on the flight\n\nThe Employment tab has spouse job help — SECO and MyCAA.",
    action: 'Go to Family Readiness',
    target: 'family',
  },
  {
    id: 'compliance',
    title: 'Compliance — your data, your phone',
    description: 'A plain-language page that shows exactly how PCS Express keeps your information safe.',
    content: 'Open the Compliance tab to see, in plain language:\n• Where your data lives — on your phone, nowhere else. No PCS Express server stores your profile.\n• How it\'s protected — scrambled with AES-256 encryption before it\'s saved. Even if your phone is lost, the data is unreadable.\n• Why you don\'t see an "account" — there isn\'t one. No login, no password, no inbox to hack.\n• What we never collect — copies of your orders, IDs, passports, medical records, or photos. The PCS Binder photos you capture stay on the device.\n• Who can see what — a small badge at the top shows whether AES-256 encryption is active in your browser right now.\n• What independent standards we follow — NIST, DISA, OWASP guidance for the curious. The page also has a "report a vulnerability" link if you spot something we should fix.\n\nThis is also the page a CISO, an acquisitions officer, or a defense-prime evaluator can scan in 60 seconds to confirm the app meets their bar — same content, different audience.',
    action: 'Go to Compliance',
    target: 'compliance',
  },
  {
    id: 'finish',
    title: 'That\'s the tour',
    description: 'You\'ve seen the main features.',
    content: "Ready to set up your own profile?\n\n1. Close this tour.\n2. In the More menu, tap Reset / Re-onboard.\n3. Enter your real branch, installations, and Report-NLT date.\n4. Your data is encrypted on this device — we never see it.\n\nIf any text looks weird in a non-English language, a small banner in the app explains: shorter labels translate exactly, longer explanations may stay in English.\n\nWelcome aboard. Safe travels.",
    action: 'Close Demo',
    target: null,
  },
];

export function DemoTour({ onTabChange, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = DEMO_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < DEMO_STEPS.length - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  const handleAction = () => {
    if (step.action === 'Close Demo') { onClose(); return; }
    if (step.target && onTabChange) onTabChange(step.target);
  };

  const progress = ((currentStep + 1) / DEMO_STEPS.length) * 100;

  return (
    <div className="demo-overlay" data-no-language-runtime>
      <div className="demo-modal">
        <div className="demo-header">
          <h2>{step.title}</h2>
          <button className="demo-close" onClick={onClose} aria-label="Close demo tour">✕</button>
        </div>

        <div className="demo-content">
          <p className="demo-description">{step.description}</p>
          <pre className="demo-text">{step.content}</pre>
        </div>

        <div className="demo-footer">
          <div className="demo-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{currentStep + 1} / {DEMO_STEPS.length}</span>
          </div>

          <div className="demo-buttons">
            <button onClick={handlePrev} disabled={currentStep === 0} className="btn-secondary">← Back</button>
            {step.action && <button onClick={handleAction} className="btn-primary">{step.action}</button>}
            <button onClick={handleNext} className="btn-primary">
              {currentStep === DEMO_STEPS.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>

          <button onClick={onClose} className="btn-skip">Skip Tour</button>
        </div>
      </div>
    </div>
  );
}

export default DemoTour;
