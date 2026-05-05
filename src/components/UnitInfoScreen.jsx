/*
 * Purpose: Public-only unit information category with lookup links, history, uniforms, and contact guidance.
 * Third-party dependencies: React only.
 */

import { useMemo, useState } from 'react';

const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const branchUniforms = {
  Army: ['Army Combat Uniform (ACU)', 'Army Green Service Uniform (AGSU)', 'Army Service Uniform (ASU)', 'Army Physical Fitness Uniform (APFU)'],
  Navy: ['Navy Working Uniform Type III', 'Service Khaki', 'Service Dress Blue', 'Navy Physical Training Uniform'],
  'Marine Corps': ['Marine Corps Combat Utility Uniform (MCCUU)', 'Service Alpha / Bravo / Charlie', 'Dress Blue', 'USMC physical training uniform'],
  'Air Force': ['Operational Camouflage Pattern (OCP)', 'Service Dress', 'Blues uniform', 'Air Force physical training gear'],
  'Space Force': ['Operational Camouflage Pattern (OCP)', 'Service Dress / Blues', 'Space Force physical training gear'],
  'Coast Guard': ['Operational Dress Uniform (ODU)', 'Tropical Blue', 'Service Dress Blue', 'Coast Guard physical fitness clothing'],
};

const safeContactTypes = [
  'Official public website contact page',
  'Public affairs office',
  'Installation operator',
  'Publicly listed staff duty or quarterdeck desk',
  'Publicly listed S1 / administrative office',
];

function normalizeUnit(unit, profile) {
  const unitName = unit?.name || profile?.unit || '';
  if (!unitName) return null;
  return {
    id: unit?.id || unitName,
    name: unitName,
    branch: unit?.branch || profile?.branch || 'Military',
    nickname: unit?.nickname || 'Public information pending verification',
    established: unit?.established || 'Verify through official unit history',
    motto: unit?.motto || 'Verify through official unit page',
    website: unit?.website || '',
    social: unit?.social || {},
    history: unit?.history || `${unitName} information should be verified through official public command pages, public affairs releases, lineage pages, and installation directories before use.`,
    uniforms: unit?.uniforms || branchUniforms[unit?.branch || profile?.branch] || ['Daily duty uniform', 'Service uniform', 'Physical training uniform'],
    contacts: unit?.contacts || [],
    sourceStatus: unit?.sourceStatus || (unit ? 'Known local public profile' : 'Manual unit entry: verify via public sources'),
  };
}

export default function UnitInfoScreen({ profile, theme, unit }) {
  const [activeUnitTab, setActiveUnitTab] = useState('overview');
  const [manualUnit, setManualUnit] = useState(profile?.unit || '');
  const [manualBase, setManualBase] = useState(profile?.gainingInstallation || '');

  const workingUnit = useMemo(() => {
    const profileWithManual = { ...profile, unit: manualUnit || profile?.unit, gainingInstallation: manualBase || profile?.gainingInstallation };
    return normalizeUnit(unit, profileWithManual);
  }, [unit, profile, manualUnit, manualBase]);

  const baseName = manualBase || profile?.gainingInstallation || 'gaining installation';
  const unitName = workingUnit?.name || manualUnit;
  const publicQueries = unitName ? [
    { label: 'Google official unit page', query: `${unitName} ${baseName} official site` },
    { label: 'Google public social media', query: `${unitName} official Facebook Instagram X` },
    { label: 'Google unit history', query: `${unitName} official history lineage` },
    { label: 'Google public contact page', query: `${unitName} ${baseName} staff duty S1 public contact` },
  ] : [];

  if (!workingUnit) {
    return (
      <div className="unit-page">
        <h2>Unit Information</h2>
        <div className="unit-alert">
          <strong>No gaining unit selected yet</strong>
          <span>Enter a unit below, then use the public-source lookup links to verify official pages, history, social media, uniforms, and contact methods.</span>
        </div>
        <LookupForm theme={theme} manualUnit={manualUnit} setManualUnit={setManualUnit} manualBase={manualBase} setManualBase={setManualBase} />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'social', label: 'Social Media' },
    { id: 'history', label: 'Unit History' },
    { id: 'uniforms', label: 'Uniforms' },
    { id: 'contact', label: 'Unit Connection' },
    { id: 'lookup', label: 'Public Lookup' },
  ];

  return (
    <div className="unit-page">
      <div className="unit-header" style={{ borderColor: theme.accent }}>
        <div>
          <div className="unit-kicker">Gaining Unit</div>
          <h2>{workingUnit.name}</h2>
          <p>{workingUnit.branch} · {baseName}</p>
        </div>
        <span>{workingUnit.sourceStatus}</span>
      </div>

      <div className="unit-safety-note">
        Public information only. Do not enter or store CUI, classified details, rosters, deployment schedules, watch bills, personal phone numbers, internal emails, floor plans, access-control procedures, or tactical/operational details.
      </div>

      <div className="unit-tabs" role="tablist" aria-label="Unit information tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveUnitTab(tab.id)}
            aria-pressed={activeUnitTab === tab.id}
            style={{
              borderColor: activeUnitTab === tab.id ? theme.primary : '#E0E6EE',
              background: activeUnitTab === tab.id ? theme.primary : '#FFFFFF',
              color: activeUnitTab === tab.id ? '#FFFFFF' : '#56697C',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeUnitTab === 'overview' && (
        <section className="unit-card">
          <Field label="Designation" value={workingUnit.id} />
          <Field label="Nickname" value={workingUnit.nickname} />
          <Field label="Established" value={workingUnit.established} />
          <Field label="Motto" value={workingUnit.motto} />
          {workingUnit.website && <a className="unit-action" href={workingUnit.website} target="_blank" rel="noopener noreferrer" style={{ background: theme.primary }}>{workingUnit.sourceStatus?.includes('Generated') ? 'Open Public Website Lookup' : 'Official Website'}</a>}
          {workingUnit.sourceStatus?.includes('Generated') && (
            <p className="unit-muted">This profile is populated from public-source lookup templates because a verified local unit record is not stored yet. Use the lookup links to confirm details through official public pages.</p>
          )}
        </section>
      )}

      {activeUnitTab === 'social' && (
        <section className="unit-card">
          <h3>Public Social Media</h3>
          <SocialLinks social={workingUnit.social} theme={theme} unitName={workingUnit.name} />
        </section>
      )}

      {activeUnitTab === 'history' && (
        <section className="unit-card">
          <h3>Unit History</h3>
          <p>{workingUnit.history}</p>
          <a className="unit-secondary-action" href={googleSearch(`${workingUnit.name} official unit history lineage`)} target="_blank" rel="noopener noreferrer">Search Public Unit History</a>
        </section>
      )}

      {activeUnitTab === 'uniforms' && (
        <section className="unit-card">
          <h3>Common Uniforms</h3>
          <div className="unit-list">
            {workingUnit.uniforms.map(item => <div key={item}>{item}</div>)}
          </div>
          <p className="unit-muted">Uniform wear is controlled by branch, command, event, location, and local policy. Verify with the gaining unit sponsor or official reporting instructions.</p>
        </section>
      )}

      {activeUnitTab === 'contact' && (
        <section className="unit-card">
          <h3>Unit Connection</h3>
          <p>Use publicly listed official channels only. Avoid personal numbers unless your sponsor or official orders provide them.</p>
          <div className="unit-list">
            {safeContactTypes.map(item => <div key={item}>{item}</div>)}
          </div>
          {workingUnit.contacts.length > 0 && (
            <div className="unit-list">
              {workingUnit.contacts.map(contact => <a key={contact.url || contact.label} href={contact.url} target="_blank" rel="noopener noreferrer">{contact.label}</a>)}
            </div>
          )}
          <a className="unit-secondary-action" href={googleSearch(`${workingUnit.name} ${baseName} S1 staff duty public contact`)} target="_blank" rel="noopener noreferrer">Search Public Contact Methods</a>
        </section>
      )}

      {activeUnitTab === 'lookup' && (
        <section className="unit-card">
          <LookupForm theme={theme} manualUnit={manualUnit} setManualUnit={setManualUnit} manualBase={manualBase} setManualBase={setManualBase} />
          <h3>Public Lookup Links</h3>
          <div className="unit-list">
            {publicQueries.map(item => <a key={item.label} href={googleSearch(item.query)} target="_blank" rel="noopener noreferrer">{item.label}</a>)}
          </div>
        </section>
      )}
    </div>
  );
}

function LookupForm({ theme, manualUnit, setManualUnit, manualBase, setManualBase }) {
  return (
    <div className="unit-lookup-form">
      <label>
        Unit
        <input value={manualUnit} onChange={e => setManualUnit(e.target.value)} placeholder="Enter gaining unit name" />
      </label>
      <label>
        Installation
        <input value={manualBase} onChange={e => setManualBase(e.target.value)} placeholder="Enter gaining installation" />
      </label>
      <a href={googleSearch(`${manualUnit || 'military unit'} ${manualBase || 'installation'} official public information`)} target="_blank" rel="noopener noreferrer" style={{ background: theme.primary }}>
        Search Google Public Sources
      </a>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="unit-field">
      <span>{label}</span>
      <strong>{value || 'Verify through official public source'}</strong>
    </div>
  );
}

function SocialLinks({ social, theme, unitName }) {
  const links = [
    social?.facebook && { label: 'Facebook', url: social.facebook.startsWith('http') ? social.facebook : `https://www.facebook.com/${social.facebook}` },
    social?.twitter && { label: 'X / Twitter', url: social.twitter.startsWith('http') ? social.twitter : `https://www.twitter.com/${social.twitter.replace('@', '')}` },
    social?.instagram && { label: 'Instagram', url: social.instagram.startsWith('http') ? social.instagram : `https://www.instagram.com/${social.instagram}` },
    social?.youtube && { label: 'YouTube', url: social.youtube },
  ].filter(Boolean);

  if (links.length === 0) {
    return (
      <>
        <p>No verified local social links are stored for this unit yet.</p>
        <a className="unit-action" style={{ background: theme.primary }} href={googleSearch(`${unitName} official public social media`)} target="_blank" rel="noopener noreferrer">Search Public Social Media</a>
      </>
    );
  }

  return (
    <div className="unit-list">
      {links.map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
    </div>
  );
}
