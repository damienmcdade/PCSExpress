/*
 * Transition Documentation — the separation/retirement "paperwork roster"
 * for the Transition tab, mirroring PCS Operations' Paperwork tab but scoped
 * to leaving the service. A categorized checklist of the documents a member
 * or DoD civilian must gather/secure, each with why it matters and (where
 * applicable) where to get it. No uploads — the member keeps the originals;
 * this only tracks which ones are in hand. Tailored from the onboarding
 * profile (military vs DoD Civilian). Check-off state persists in the same
 * encrypted secureLocalStore used across the app.
 *
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import SyncStatusIndicator from './SyncStatusIndicator';
import NotificationModeSelector from './NotificationModeSelector';

const STORAGE_KEY = 'pcs_transition_documents';

// Document groups whose missing items are high-priority (lose access at
// separation, or gate VA/benefits). Everything else is Medium.
const HIGH_PRIORITY_GROUPS = new Set(['Service Record & Separation', 'VA & Medical']);

// Each doc: { id, title, desc, url?, urlLabel?, civilianOnly?, militaryOnly? }
const DOC_GROUPS = [
  {
    group: 'Service Record & Separation',
    items: [
      { id: 'dd214', title: 'DD-214 (Certificate of Release or Discharge)', militaryOnly: true,
        desc: 'The single most important document of your military career — needed for VA, state benefits, employment, and the GI Bill for life. Verify member copy 4; store encrypted copies.',
        url: 'https://www.va.gov/records/get-military-service-records/', urlLabel: 'VA — Get / correct your DD-214' },
      { id: 'orders', title: 'Separation / retirement orders', militaryOnly: true,
        desc: 'Your authoritative orders set your separation date, terminal leave, and final-move entitlement. Keep signed copies.' },
      { id: 'sf50', title: 'Final SF-50 (Notification of Personnel Action)', civilianOnly: true,
        desc: 'Documents your separation/retirement action and creditable federal service. Request from your servicing HR office.' },
      { id: 'awards', title: 'Award certificates & evaluations / fitness reports', militaryOnly: true,
        desc: 'Collect citations, NCOERs/OERs/EPRs, and training certificates — useful for VA claims, civilian resumes, and the records correction board.' },
      { id: 'pointstmt', title: 'Retirement points statement (Reserve/Guard)', militaryOnly: true,
        desc: 'Confirms your qualifying years and points toward a reserve retirement / gray-area benefits.' },
    ],
  },
  {
    group: 'VA & Medical',
    items: [
      { id: 'medrec', title: 'Complete medical & dental records', militaryOnly: true,
        desc: 'Get full paper + digital copies while you still have base access. Every VA claim and future care decision depends on them.' },
      { id: 'strcopy', title: 'Service Treatment Record (STR) copy', militaryOnly: true,
        desc: 'Your STR is the evidentiary backbone of a VA disability claim. Request a certified copy before out-processing.' },
      { id: 'vaclaim', title: 'VA disability claim package (BDD if pre-discharge)', militaryOnly: true,
        desc: 'Keep your submitted claim, evidence list, and C&P exam notices together. File BDD 180–90 days before separation.',
        url: 'https://www.va.gov/disability/how-to-file-claim/', urlLabel: 'VA — File a claim' },
      { id: 'immun', title: 'Immunization & exposure records (PACT Act)',
        desc: 'Document deployments and toxic-exposure history (burn pits, etc.) — the PACT Act expanded presumptive conditions.',
        url: 'https://www.va.gov/resources/the-pact-act-and-your-va-benefits/', urlLabel: 'VA — PACT Act' },
    ],
  },
  {
    group: 'Pay, Finance & Retirement',
    items: [
      { id: 'les', title: 'Final LES / final pay & leave statement', militaryOnly: true,
        desc: 'Verify terminal-leave pay, leave sell-back, and any pay debts before you separate. Download from myPay.' },
      { id: 'travelvoucher', title: 'Separation travel voucher (DD 1351-2) + receipts', militaryOnly: true,
        desc: 'Keep lodging, mileage, and (if PPM) weight-ticket receipts to file your final-move reimbursement.' },
      { id: 'tsp', title: 'TSP / retirement account statements',
        desc: 'Record balances and your rollover vs leave-in-place decision. Civilians: confirm FERS annuity election and FEHB-into-retirement eligibility.',
        url: 'https://www.tsp.gov/', urlLabel: 'TSP.gov' },
      { id: 'opmretire', title: 'OPM retirement application & confirmation', civilianOnly: true,
        desc: 'Keep your submitted retirement package and OPM Services Online confirmation; interim annuity payments follow.',
        url: 'https://www.opm.gov/retirement-center/', urlLabel: 'OPM Retirement Center' },
      { id: 'sbp', title: 'SBP / RCSBP election (Survivor Benefit Plan)', militaryOnly: true,
        desc: 'Your survivor-annuity election is a one-time, deadline-bound decision at retirement. Keep the signed election form.' },
    ],
  },
  {
    group: 'Identification, Insurance & Access',
    items: [
      { id: 'deers', title: 'Updated DEERS record + retiree/dependent IDs', militaryOnly: true,
        desc: 'Retirees and dependents need new Uniformed Services ID cards to keep TRICARE, commissary, and exchange access.',
        url: 'https://idco.dmdc.osd.mil/idco/', urlLabel: 'RAPIDS ID Card Office Online' },
      { id: 'sgli', title: 'SGLI → VGLI conversion paperwork', militaryOnly: true,
        desc: 'Convert SGLI to VGLI within 1 year + 120 days of separation (no health questions in the first 240 days).',
        url: 'https://www.va.gov/life-insurance/options-eligibility/vgli/', urlLabel: 'VA — VGLI' },
      { id: 'tricare', title: 'Health-coverage transition documents', militaryOnly: true,
        desc: 'Keep your TRICARE/TAMP/CHCBP enrollment or VA health-care confirmation so coverage doesn’t lapse.',
        url: 'https://www.tricare.mil/Plans/Eligibility/LosingMilitaryHealthCoverage', urlLabel: 'TRICARE — losing coverage' },
      { id: 'fehb', title: 'FEHB / FEGLI continuation election', civilianOnly: true,
        desc: 'Document your FEHB-into-retirement carryover (5-year rule) or Temporary Continuation of Coverage (TCC) election.',
        url: 'https://www.opm.gov/healthcare-insurance/', urlLabel: 'OPM — Healthcare & Insurance' },
      { id: 'vetid', title: 'Veteran ID (VHIC / Veteran ID Card)', militaryOnly: true,
        desc: 'Your CAC deactivates at separation — apply for VA-issued proof of service.',
        url: 'https://www.va.gov/records/get-veteran-id-cards/', urlLabel: 'VA — Get a Veteran ID card' },
    ],
  },
  {
    group: 'Personal & Legal',
    items: [
      { id: 'vitalrecs', title: 'Vital records (birth, marriage, SSN cards)',
        desc: 'Gather originals for you and dependents — needed for VA dependents, school enrollment, and civilian onboarding.' },
      { id: 'poa', title: 'Powers of attorney / will / legal documents',
        desc: 'Update or revoke deployment-era POAs; refresh your will. Base legal assistance is free while you still have access.',
        url: 'https://legalassistance.law.af.mil/', urlLabel: 'Armed Forces Legal Assistance locator' },
      { id: 'transcripts', title: 'Education transcripts (JST / CCAF / college)',
        desc: 'Order your Joint Services Transcript and any college transcripts for GI Bill use and civilian credentialing.',
        url: 'https://jst.doded.mil/', urlLabel: 'Joint Services Transcript' },
    ],
  },
  {
    group: 'Medical Separation (IDES / MEB / PEB)',
    medicalOnly: true,
    items: [
      { id: 'med-narsum', title: 'MEB narrative summary (NARSUM) + DD Form 2807/2808', militaryOnly: true,
        desc: 'The Medical Evaluation Board packet that lists your referred conditions. Review every condition is captured and keep a full copy.',
        url: 'https://www.health.mil/Military-Health-Topics/Conditions-and-Treatments/Physical-Disability-Board-of-Review', urlLabel: 'DoD — Disability evaluation' },
      { id: 'med-cp-results', title: 'VA C&P exam results (IDES proposed ratings)', militaryOnly: true,
        desc: 'Your single set of Compensation & Pension exam results that feed both the PEB and your VA rating. Confirm each claimed condition was examined.',
        url: 'https://www.va.gov/disability/va-claim-exam/', urlLabel: 'VA — Claim exam' },
      { id: 'med-peb-findings', title: 'PEB findings letter + your election (accept / appeal)', militaryOnly: true,
        desc: 'The Physical Evaluation Board fitness determination and disability percentage, plus your signed election. Consult military disability counsel before signing.' },
      { id: 'med-disposition', title: 'Disability disposition — TDRL/PDRL orders or DD-214 severance entry', militaryOnly: true,
        desc: 'Your medical-retirement (TDRL/PDRL) orders or the severance-pay entry on the DD-214. Determines pay, TRICARE, and re-exam obligations.' },
      { id: 'med-crsc-app', title: 'CRSC application / CRDP confirmation (if medically retired)', militaryOnly: true,
        desc: 'Paperwork to restore retired pay offset by VA compensation. CRSC requires a branch application; keep the determination letters.',
        url: 'https://www.dfas.mil/RetiredMilitary/disability/crsc/', urlLabel: 'DFAS — CRSC / CRDP' },
    ],
  },
];

export default function TransitionDocumentsModule({ theme, profile }) {
  const isCivilian = profile?.component === 'DoD Civilian';
  const [checks, setChecks] = useState({});
  // Read the separation type chosen on the Checklist sub-tab so the medical
  // (IDES) document group only appears for a medical (MEB/PEB) separation.
  const [isMedical, setIsMedical] = useState(false);

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, {}).then(saved => {
      if (mounted) setChecks(saved || {});
    });
    secureLocalStore.get('pcs_transition_checklist', null).then(saved => {
      if (mounted && saved?.separationType === 'medical') setIsMedical(true);
    });
    return () => { mounted = false; };
  }, []);

  // Filter each group's items to the audience, then drop empty groups.
  const visibleGroups = DOC_GROUPS
    .filter(g => (g.medicalOnly ? isMedical : true))
    .map(g => ({
      group: g.group,
      items: g.items.filter(it => (it.civilianOnly ? isCivilian : true) && (it.militaryOnly ? !isCivilian : true)),
    }))
    .filter(g => g.items.length > 0);

  const allIds = visibleGroups.flatMap(g => g.items.map(it => it.id));
  const done = allIds.filter(id => checks[id]).length;
  const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;

  // Unsecured documents feed the device-notification + Command Center feed.
  const outstandingAlerts = visibleGroups.flatMap(g =>
    g.items
      .filter(it => !checks[it.id])
      .map(it => ({ id: it.id, title: it.title, priority: HIGH_PRIORITY_GROUPS.has(g.group) ? 'High' : 'Medium' })),
  );

  const toggle = async (id) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    await secureLocalStore.set(STORAGE_KEY, next);
    AuditLogger.record('transition_document_change', { id, complete: !!next[id] });
  };

  return (
    <div className="pet-page">
      <div className="pet-header">
        <div>
          <div className="assistance-kicker">Documentation</div>
          <h2>Separation Document Roster</h2>
          <p>
            {isCivilian
              ? 'The records to secure before you off-board federal service. Check each off as you have it in hand — nothing is uploaded.'
              : 'The records to secure before you out-process. Check each off as you collect it yourself — PCS Express never stores or transmits your documents.'}
          </p>
        </div>
        <SyncStatusIndicator />
      </div>

      <div className="pcs-progress-card">
        <div className="pcs-progress-card__row">
          <strong>Documents Secured</strong>
          <span>{done}/{allIds.length} · {pct}%</span>
        </div>
        <div className="pcs-progress-card__bar">
          <div style={{ width: `${pct}%`, background: pct === 100 ? '#2E7D32' : theme.accent }} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <NotificationModeSelector theme={theme} checklistId="transition-documents" checklistLabel="Transition Documents" alerts={outstandingAlerts} />
      </div>

      {visibleGroups.map(({ group, items }) => (
        <section key={group} style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{group}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(it => {
              const checked = !!checks[it.id];
              return (
                <div
                  key={it.id}
                  style={{
                    background: checked ? '#F1F8F2' : '#FFFFFF',
                    border: `1px solid ${checked ? '#A5D6A7' : '#E2E8F1'}`,
                    borderRadius: 12,
                    padding: 13,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${checked ? 'Mark not secured' : 'Mark secured'}: ${it.title}`}
                    onClick={() => toggle(it.id)}
                    style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                      border: `2px solid ${checked ? '#2E7D32' : '#B6C2D2'}`,
                      background: checked ? '#2E7D32' : '#FFF', color: '#FFF',
                      cursor: 'pointer', fontSize: 15, fontWeight: 900, lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span aria-hidden="true">{checked ? '✓' : ''}</span>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 13.5, color: '#16202F', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.7 : 1 }}>{it.title}</strong>
                    <p style={{ fontSize: 12, color: '#43526B', lineHeight: 1.5, margin: '4px 0 0' }}>{it.desc}</p>
                    {it.url && (
                      <a href={it.url} target="_blank" rel="noopener noreferrer" aria-label={`${it.urlLabel || 'Official resource'} (opens in a new tab)`} style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>
                        {it.urlLabel || 'Official resource'} →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p style={{ fontSize: 11, color: '#6B7A90', lineHeight: 1.5, marginTop: 16 }}>
        Planning aid only. PCS Express does not accept, store, or transmit document uploads — keep your originals and verify requirements with your separation/retirement services office, finance, and the VA.
      </p>
    </div>
  );
}
