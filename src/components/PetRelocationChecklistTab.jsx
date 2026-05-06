/*
 * Purpose: Pet relocation checklist and live resource links aligned with PCS checklist patterns.
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import SyncStatusIndicator from './SyncStatusIndicator';

const STORAGE_KEY = 'pcs_pet_relocation_checks';

const PHASES = {
  'Orders Received': [
    'Confirm whether pets are authorized on orders and gaining-location housing rules.',
    'Review JTR pet expense reimbursement limits for CONUS or OCONUS moves.',
    'Call the gaining installation veterinary treatment facility or housing office.',
  ],
  '90 Days Out': [
    'Book a USDA-APHIS accredited veterinarian for health certificate planning.',
    'Confirm rabies vaccine, microchip, titer test, and country import timeline.',
    'Reserve airline pet space or pet transport, especially for summer embargo periods.',
  ],
  '30 Days Out': [
    'Collect vaccine records, microchip number, prescriptions, and special diet notes.',
    'Buy airline-approved crate and practice crate acclimation.',
    'Confirm lodging accepts pets along your PCS route.',
  ],
  'Move Week': [
    'Pack food, water, leash, medication, cleaning supplies, and records in carry-on reach.',
    'Keep printed and digital copies of health certificate and import permits.',
    'Photograph pet, crate, and documents before departure.',
  ],
  Arrival: [
    'Register pet with installation housing or local municipality if required.',
    'Schedule local vet follow-up and update microchip contact information.',
    'Submit eligible pet relocation receipts with PCS travel claim guidance from finance.',
  ],
};

const RESOURCES = [
  { name: 'USDA APHIS Pet Travel', desc: 'Official country-by-country export and health certificate requirements.', url: 'https://www.aphis.usda.gov/pet-travel' },
  { name: 'JTR Pet Transportation Allowance', desc: 'Official DoD travel regulation source for pet expense reimbursement.', url: 'https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/' },
  { name: 'Military OneSource Pet PCS', desc: 'PCS planning guidance for moving with pets and family logistics.', url: 'https://www.militaryonesource.mil/moving-pcs/plan-to-move/moving-with-pets/' },
  { name: 'Air Mobility Command Pet Travel', desc: 'Patriot Express pet movement policies and space-available guidance.', url: 'https://www.amc.af.mil/AMC-Travel-Site/AMC-Pet-Travel-Page/' },
  { name: 'CDC Dog Import Rules', desc: 'Current U.S. dog import rules for return travel into the United States.', url: 'https://www.cdc.gov/importation/dogs/' },
  { name: 'International Air Transport Association', desc: 'Airline live animal transport standards and traveler guidance.', url: 'https://www.iata.org/en/programs/cargo/live-animals/pets/' },
];

export default function PetRelocationChecklistTab({ theme, profile }) {
  const [activePhase, setActivePhase] = useState(Object.keys(PHASES)[0]);
  const [checks, setChecks] = useState({});
  const isOconus = !!profile?.isOverseas;

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, {}).then(saved => {
      if (mounted) setChecks(saved || {});
    });
    return () => { mounted = false; };
  }, []);

  const allTasks = Object.entries(PHASES).flatMap(([phase, tasks]) => tasks.map((_, index) => `${phase}-${index}`));
  const done = allTasks.filter(key => checks[key]).length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  const toggleTask = async (phase, index) => {
    const key = `${phase}-${index}`;
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    await secureLocalStore.set(STORAGE_KEY, next);
    AuditLogger.record('pet_relocation_checklist_change', { phase, index, complete: !!next[key] });
  };

  return (
    <div className="pet-page">
      <div className="pet-header">
        <div>
          <div className="assistance-kicker">Pets</div>
          <h2>Pet Relocation Checklist</h2>
          <p>{isOconus ? 'OCONUS moves need earlier health certificate, import, and transportation planning.' : 'CONUS moves still need lodging, crate, vet, and reimbursement documentation.'}</p>
        </div>
        <SyncStatusIndicator />
      </div>

      <div className="pcs-progress-card">
        <div className="pcs-progress-card__row">
          <strong>Overall Progress</strong>
          <span>{done}/{allTasks.length} tasks · {pct}%</span>
        </div>
        <div className="pcs-progress-card__bar">
          <div style={{ width: `${pct}%`, background: pct === 100 ? '#2E7D32' : theme.accent }} />
        </div>
      </div>

      <div className="pet-phase-tabs" role="tablist" aria-label="Pet relocation phases">
        {Object.keys(PHASES).map(phase => {
          const tasks = PHASES[phase].map((_, index) => `${phase}-${index}`);
          const phaseDone = tasks.filter(key => checks[key]).length;
          const active = activePhase === phase;
          return (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              aria-label={`Open ${phase} pet relocation phase`}
              aria-pressed={active}
              style={{
                borderColor: active ? theme.primary : '#E0E6EE',
                background: active ? theme.primary : '#FFF',
                color: active ? '#FFF' : '#56697C',
              }}
            >
              {phase} ({phaseDone}/{tasks.length})
            </button>
          );
        })}
      </div>

      <div className="pet-task-list">
        {PHASES[activePhase].map((task, index) => {
          const key = `${activePhase}-${index}`;
          const checked = !!checks[key];
          return (
            <button
              key={task}
              className={`pet-task ${checked ? 'is-done' : ''}`}
              onClick={() => toggleTask(activePhase, index)}
              aria-label={`${checked ? 'Mark incomplete' : 'Mark complete'}: ${task}`}
              aria-description="Updates pet relocation checklist progress"
            >
              <span>{checked ? '✓' : ''}</span>
              <strong>{task}</strong>
            </button>
          );
        })}
      </div>

      <section className="pet-resources" aria-label="Pet relocation resources">
        <h3>Active Pet Relocation Links</h3>
        {RESOURCES.map(resource => (
          <a key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.name}`}>
            <strong>{resource.name}</strong>
            <span>{resource.desc}</span>
          </a>
        ))}
      </section>
    </div>
  );
}
