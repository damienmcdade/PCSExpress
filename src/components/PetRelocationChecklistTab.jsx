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
  { name: 'DOT Flying With Pets', desc: 'Official U.S. Department of Transportation passenger guidance for flying with animals.', url: 'https://www.transportation.gov/airconsumer/plane-talk-traveling-animals' },
];

// Country-specific pet import rules surfaced when the gaining
// installation is OCONUS. Lead-time field is the practical "start NOW"
// trigger — most rules require months of advance planning.
const COUNTRY_PET_RULES = {
  Germany:        { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',        desc: 'EU TRACES + EU pet passport, rabies vaccine, ISO-compliant microchip, and EU Annex IV veterinary health certificate endorsed by USDA APHIS within 10 days of travel.',                       keywords: ['germany','ramstein','spangdahlem','stuttgart','wiesbaden','grafenwoehr','grafenwöhr','vilseck','baumholder','ansbach','kaiserslautern'] },
  Italy:          { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',          desc: 'EU TRACES + EU pet passport, ISO microchip, rabies vaccine 21+ days before entry, and USDA-endorsed EU Annex IV certificate. Naples and Sigonella reception bases have on-base vets.',  keywords: ['italy','vicenza','aviano','sigonella','naples','livorno','del din','ederle','darby'] },
  Spain:          { lead: '3-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',          desc: 'EU TRACES + EU pet passport, ISO microchip, rabies vaccine 21+ days before entry. Rota / Morón intake usually within 24-48 hours of arrival.',                                           keywords: ['spain','rota','moron','morón'] },
  'United Kingdom':{lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',             desc: 'UK no longer accepts the EU Pet Passport. Pets enter via Great Britain Pet Travel Scheme: ISO microchip, rabies vaccine 21+ days, EU Annex IV equivalent or GB Animal Health Certificate, tapeworm treatment for dogs 24-120 hrs pre-travel.', keywords: ['lakenheath','mildenhall','alconbury','croughton','united kingdom','england','uk'] },
  Japan:          { lead: '7-8 months',    url: 'https://www.aphis.usda.gov/pet-travel',          desc: 'Japan AQS: ISO microchip, two rabies vaccines, FAVN (rabies antibody titer) at an approved lab, then a mandatory 180-day waiting period BEFORE arrival. Advance notification at least 40 days before entry. Starting late = on-arrival quarantine.', keywords: ['japan','okinawa','kadena','misawa','yokota','camp zama','yokosuka','sasebo','atsugi','iwakuni','futenma','foster','butler','courtney','hansen','schwab','kinser'] },
  'South Korea':  { lead: '3-4 months',    url: 'https://www.aphis.usda.gov/pet-travel',          desc: 'Republic of Korea AQIS: ISO microchip, two rabies vaccines, FAVN titer ≥0.5 IU/mL within 24 months of entry, English-language health certificate endorsed by USDA APHIS within 10 days of travel. Most pets clear at Incheon without quarantine when the titer is current.', keywords: ['humphreys','daegu','yongsan','osan','kunsan','korea','casey','hovey','walker','henry','carroll','busan'] },
  Hawaii:         { lead: '6+ months',     url: 'https://hdoa.hawaii.gov/ai/aqs/aqs-info/',             desc: 'Hawaii Direct Airport Release (5-day-or-less) program: ISO microchip, two rabies vaccines, FAVN titer ≥0.5 IU/mL processed at an approved lab, application + fees submitted 30+ days before arrival. Miss the requirements and pets go into 120-day quarantine at Halawa.',  keywords: ['hawaii','schofield','shafter','jbphh','pearl harbor','hickam','kaneohe','barbers point'] },
  Guam:           { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',           desc: 'Guam Quarantine Branch: ISO microchip, rabies vaccine 30+ days but ≤12 months before entry, FAVN titer ≥0.5 IU/mL processed at an approved lab. Pets meeting all requirements typically clear without quarantine.',                                       keywords: ['guam','andersen','nb guam'] },
  Belgium:        { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',        desc: 'EU TRACES + EU pet passport, ISO microchip, rabies vaccine 21+ days, USDA-endorsed EU Annex IV health certificate. SHAPE / Brussels intake usually within a day.',                          keywords: ['belgium','shape','brussels','chievres','daumerie'] },
  Netherlands:    { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',    desc: 'EU TRACES + EU pet passport, ISO microchip, rabies vaccine 21+ days, USDA-endorsed EU Annex IV health certificate. Brunssum / JFC headquarters intake.',                                   keywords: ['netherlands','brunssum'] },
  Poland:         { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',         desc: 'EU TRACES + EU pet passport, ISO microchip, rabies vaccine 21+ days, USDA-endorsed EU Annex IV health certificate. Poznan / Powidz intake.',                                                 keywords: ['poland','poznan','powidz','kosciuszko'] },
  Greece:         { lead: '3-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',         desc: 'EU TRACES + EU pet passport, ISO microchip, rabies vaccine 21+ days, USDA-endorsed EU Annex IV health certificate. Souda Bay (Crete) intake.',                                              keywords: ['greece','souda','crete'] },
  Turkey:         { lead: '3-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',         desc: 'Turkish veterinary import permit, ISO microchip, rabies vaccine 30+ days, English/Turkish health certificate endorsed by USDA APHIS within 10 days of travel. Coordinate with Incirlik AB vet clinic.', keywords: ['turkey','incirlik'] },
  Bahrain:        { lead: '3-4 months',    url: 'https://www.aphis.usda.gov/pet-travel',        desc: 'Bahrain Public Health Directorate import permit, ISO microchip, rabies vaccine 30 days–12 months, FAVN titer for some breeds, USDA-endorsed health certificate within 7 days of travel.',  keywords: ['bahrain','nsa bahrain'] },
  Qatar:          { lead: '3-4 months',    url: 'https://www.aphis.usda.gov/pet-travel',          desc: 'Qatar Ministry of Municipality import permit, ISO microchip, rabies vaccine 30 days–12 months, USDA-endorsed health certificate within 7 days of travel.',                                  keywords: ['qatar','al udeid'] },
  Greenland:      { lead: '4-6 months',    url: 'https://www.aphis.usda.gov/pet-travel',                desc: 'Greenland / Pituffik (formerly Thule) Space Base: very limited animal hosting capacity. Coordinate directly with the gaining unit before bringing any pet — many positions are unaccompanied.', keywords: ['greenland','pituffik','thule'] },
  Australia:      { lead: '6-9 months',    url: 'https://www.aphis.usda.gov/pet-travel',      desc: 'Australia DAFF: ISO microchip, two rabies vaccines, RNATT (rabies antibody titer) at an approved lab + 180-day waiting period, internal/external parasite treatments, then a minimum 30-day post-arrival quarantine at Mickleham (Melbourne) at owner expense.', keywords: ['australia'] },
};
function detectPetCountryRule(profile) {
  const raw = String(profile?.gainingInstallation || '').toLowerCase();
  if (!raw) return null;
  for (const [country, rule] of Object.entries(COUNTRY_PET_RULES)) {
    if (rule.keywords.some(kw => raw.includes(kw))) return { country, ...rule };
  }
  return null;
}

export default function PetRelocationChecklistTab({ theme, profile }) {
  const [activePhase, setActivePhase] = useState(Object.keys(PHASES)[0]);
  const [checks, setChecks] = useState({});
  const isOconus = !!profile?.isOverseas;
  const countryRule = detectPetCountryRule(profile);

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

      {countryRule && (
        <section style={{ background: '#FFF8E1', border: '1.5px solid #FFE082', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#7A4A00', letterSpacing: '.12em', marginBottom: 4 }}>
            HOST-NATION PET IMPORT RULES · {String(countryRule.country).toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#4A2A00' }}>{countryRule.country}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7A4A00', background: '#FFE082', padding: '2px 8px', borderRadius: 8 }}>
              Plan {countryRule.lead} ahead
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#4A2A00', lineHeight: 1.55, marginBottom: 8 }}>
            {countryRule.desc}
          </div>
          <a href={countryRule.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>
            Open USDA APHIS / host-nation rule page →
          </a>
        </section>
      )}

      <div className="pet-phase-tabs" role="tablist" aria-label="Pet relocation phases">
        {Object.keys(PHASES).map(phase => {
          const tasks = PHASES[phase].map((_, index) => `${phase}-${index}`);
          const phaseDone = tasks.filter(key => checks[key]).length;
          const active = activePhase === phase;
          const slug = phase.replace(/\s+/g, '-');
          return (
            <button
              key={phase}
              id={`pet-tab-${slug}`}
              role="tab"
              aria-controls={`pet-panel-${slug}`}
              onClick={() => setActivePhase(phase)}
              aria-label={`Open ${phase} pet relocation phase`}
              aria-selected={active}
              className={`pcs-tab ${active ? 'is-active' : ''}`}
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

      <div className="pet-task-list" role="tabpanel" id={`pet-panel-${activePhase.replace(/\s+/g, '-')}`} aria-labelledby={`pet-tab-${activePhase.replace(/\s+/g, '-')}`}>
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
        {RESOURCES.filter(resource => resource.url).map(resource => (
          <a key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.name}`}>
            <strong>{resource.name}</strong>
            <span>{resource.desc}</span>
          </a>
        ))}
      </section>
    </div>
  );
}
