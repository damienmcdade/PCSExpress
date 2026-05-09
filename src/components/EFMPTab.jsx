/*
 * Purpose: Branch-tailored EFMP PCS checklist using official public military resources.
 * Third-party dependencies: React only.
 */

import { useEffect, useMemo, useState } from 'react';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';

const STORAGE_KEY = 'pcs_efmp_checks';

const BRANCH_EFMP = {
  Army: {
    office: 'Army Community Service EFMP and the nearest Army medical treatment facility EFMP case coordinator',
    forms: ['DD Form 2792', 'DD Form 2792-1 when special education or early intervention applies', 'Enterprise EFMP family member travel screening packet when required'],
    note: 'Army EFMP enrollment is kept current at least every three years or when family needs change.',
    url: 'https://efmp.army.mil/EnterpriseEfmp/',
  },
  Navy: {
    office: 'Fleet and Family Support Center EFMP liaison and military treatment facility EFMP coordinator',
    forms: ['Navy EFMP enrollment package', 'DD Form 2792', 'DD Form 2792-1 when IEP, IFSP, or early intervention applies'],
    note: 'Navy EFMP uses identification/enrollment, assignment review, and family support through FFSC and Navy Medicine.',
    url: 'https://www.mynavyhr.navy.mil/Support-Services/Exceptional-Family-Member/',
  },
  'Marine Corps': {
    office: 'Marine Corps Community Services EFMP office and the installation medical EFMP coordinator',
    forms: ['DD Form 2792', 'DD Form 2792-1', 'NAVMC EFMP forms when directed by the local EFMP office'],
    note: 'Marine Corps EFMP supports families before, during, and after PCS relocation when medical or educational needs exist.',
    url: 'https://www.usmc-mccs.org/services/support/exceptional-family-member-program/',
  },
  'Air Force': {
    office: 'Military and Family Readiness Center EFMP-Family Support and medical EFMP-M staff',
    forms: ['Family Member Travel Screening when directed', 'DD Form 2792', 'DD Form 2792-1 for education or early intervention needs'],
    note: 'Air Force EFMP includes medical screening, assignment coordination, and family support for Airmen and Guardians.',
    url: 'https://www.afpc.af.mil/Exceptional-Family-Member-Program/',
  },
  'Space Force': {
    office: 'Military and Family Readiness Center EFMP-Family Support and medical EFMP-M staff',
    forms: ['Family Member Travel Screening when directed', 'DD Form 2792', 'DD Form 2792-1 for education or early intervention needs'],
    note: 'Guardians use the Air Force EFMP support structure for medical screening, assignments, and family support.',
    url: 'https://www.afpc.af.mil/Exceptional-Family-Member-Program/',
  },
  'Coast Guard': {
    office: 'Coast Guard Special Needs Program point of contact and the receiving medical/support office',
    forms: ['Special needs enrollment or update documents directed by Coast Guard policy', 'Medical and education documentation for assignment review'],
    note: 'Coast Guard families should verify current Special Needs Program procedures through official Coast Guard channels and Military OneSource.',
    url: 'https://www.mycg.uscg.mil/',
  },
};

const CORE_STEPS = [
  {
    phase: 'Before Orders',
    tasks: [
      'Confirm whether any family member has medical, behavioral health, early intervention, IEP, IFSP, 504 plan, adaptive equipment, or accessibility needs.',
      'Collect current medical summaries, specialty-care notes, school plans, therapy plans, and medication lists.',
      'Contact the local EFMP family support office for a family needs assessment and relocation planning.',
    ],
  },
  {
    phase: 'Orders Received',
    tasks: [
      'Notify your command, assignments counselor, or detailer if EFMP status may affect the assignment.',
      'Start branch-required EFMP update, enrollment, or family member travel screening.',
      'Ask the losing and gaining EFMP offices for a warm handoff before travel.',
    ],
  },
  {
    phase: 'Medical & Education Screening',
    tasks: [
      'Complete DD Form 2792 for medical needs when required by your branch.',
      'Complete DD Form 2792-1 for special education or early intervention needs when required.',
      'Request records from specialists, schools, therapy providers, and early intervention services.',
    ],
  },
  {
    phase: 'Gaining Location',
    tasks: [
      'Verify TRICARE network access, specialty-care availability, and prescription continuity near the gaining installation.',
      'Contact gaining school liaison, DoDEA or local district, and early intervention services as applicable.',
      'Review housing accessibility, commute distance, respite care, childcare, and local support resources.',
    ],
  },
  {
    phase: 'Arrival',
    tasks: [
      'Check in with gaining EFMP family support and medical points of contact.',
      'Transfer school, medical, therapy, and care plan records to receiving providers.',
      'Update local emergency, respite, pharmacy, and support contacts inside your PCS binder.',
    ],
  },
];

const OFFICIAL_RESOURCES = [
  { name: 'Military OneSource EFMP', desc: 'DoD EFMP overview, family support, assignment coordination, and EFMP & Me.', url: 'https://www.militaryonesource.mil/special-needs/efmp/how-efmp-benefits-service-members-family/' },
  { name: 'EFMP & Me', desc: 'Official guided tool for EFMP checklists, referrals, and family support actions.', url: 'https://efmpandme.militaryonesource.mil/' },
  { name: 'MilitaryINSTALLATIONS EFMP Contacts', desc: 'Installation-level EFMP, school, medical, and family support contacts.', url: 'https://installations.militaryonesource.mil/' },
  { name: 'TRICARE Special Needs', desc: 'Health benefit information for family members with complex care needs.', url: 'https://www.tricare.mil/Plans/SpecialPrograms/ECHO' },
];

export default function EFMPTab({ theme, profile }) {
  const branch = profile?.branch || 'Army';
  const branchInfo = BRANCH_EFMP[branch] || BRANCH_EFMP.Army;
  const [activePhase, setActivePhase] = useState(CORE_STEPS[0].phase);
  const [checks, setChecks] = useState({});

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, {}).then(saved => {
      if (mounted) setChecks(saved || {});
    });
    return () => { mounted = false; };
  }, []);

  const tasks = useMemo(() => CORE_STEPS.flatMap(section => section.tasks.map((_, index) => `${section.phase}-${index}`)), []);
  const done = tasks.filter(key => checks[key]).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const current = CORE_STEPS.find(section => section.phase === activePhase) || CORE_STEPS[0];

  const toggleTask = async (phase, index) => {
    const key = `${phase}-${index}`;
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    await secureLocalStore.set(STORAGE_KEY, next);
    AuditLogger.record('efmp_checklist_change', { phase, index, complete: !!next[key], branch });
  };

  return (
    <div className="efmp-page">
      <div className="efmp-header">
        <div>
          <div className="assistance-kicker">EFMP</div>
          <h2>Exceptional Family Member PCS Checklist</h2>
          <p>Official public guidance for medical, education, assignment, and family support requirements tailored to {branch} families.</p>
        </div>
      </div>

      <section className="efmp-source-note">
        <strong>Official basis</strong>
        <span>EFMP includes identification and enrollment, assignment coordination, and family support. Enrollment or updates may be mandatory when a family member has qualifying medical or educational needs.</span>
      </section>

      <section className="efmp-branch-card">
        <h3>{branch} EFMP Start Point</h3>
        <p>{branchInfo.note}</p>
        <div className="efmp-field"><span>Start with</span><strong>{branchInfo.office}</strong></div>
        <div className="efmp-list">
          {branchInfo.forms.map(form => <div key={form}>{form}</div>)}
        </div>
        {branchInfo.url && <a href={branchInfo.url} target="_blank" rel="noopener noreferrer" style={{ background: theme.primary }}>Open {branch} EFMP Source</a>}
      </section>

      <div className="pcs-progress-card">
        <div className="pcs-progress-card__row">
          <strong>EFMP PCS Progress</strong>
          <span>{done}/{tasks.length} tasks - {pct}%</span>
        </div>
        <div className="pcs-progress-card__bar">
          <div style={{ width: `${pct}%`, background: pct === 100 ? '#2E7D32' : theme.accent }} />
        </div>
      </div>

      <div className="pet-phase-tabs" role="tablist" aria-label="EFMP PCS phases">
        {CORE_STEPS.map(section => {
          const active = activePhase === section.phase;
          const phaseDone = section.tasks.filter((_, index) => checks[`${section.phase}-${index}`]).length;
          return (
            <button
              key={section.phase}
              onClick={() => setActivePhase(section.phase)}
              aria-label={`Open ${section.phase} EFMP phase`}
              aria-pressed={active}
              style={{
                borderColor: active ? theme.primary : '#E0E6EE',
                background: active ? theme.primary : '#FFF',
                color: active ? '#FFF' : '#56697C',
              }}
            >
              {section.phase} ({phaseDone}/{section.tasks.length})
            </button>
          );
        })}
      </div>

      <div className="pet-task-list">
        {current.tasks.map((task, index) => {
          const checked = !!checks[`${current.phase}-${index}`];
          return (
            <button key={task} className={`pet-task ${checked ? 'is-done' : ''}`} onClick={() => toggleTask(current.phase, index)}>
              <span>{checked ? '✓' : ''}</span>
              <strong>{task}</strong>
            </button>
          );
        })}
      </div>

      <section className="pet-resources" aria-label="Official EFMP resources">
        <h3>Official EFMP Links</h3>
        {OFFICIAL_RESOURCES.filter(resource => resource.url).map(resource => (
          <a key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer">
            <strong>{resource.name}</strong>
            <span>{resource.desc}</span>
          </a>
        ))}
      </section>
    </div>
  );
}
