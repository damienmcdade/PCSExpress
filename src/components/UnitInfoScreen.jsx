/*
 * Purpose: Public-only unit information category with lookup links, history, social media, and contact guidance.
 * Third-party dependencies: React only.
 */

import { useMemo, useState } from 'react';

const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const norm = (value) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

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
    contacts: unit?.contacts || [],
    sourceStatus: unit?.sourceStatus || (unit ? 'Known local public profile' : 'Manual unit entry: verify via public sources'),
  };
}

export default function UnitInfoScreen({ profile, theme, unit }) {
  const [activeUnitTab, setActiveUnitTab] = useState('overview');
  const [manualUnit, setManualUnit] = useState(profile?.unit || '');
  const [manualBase, setManualBase] = useState(profile?.gainingInstallation || '');

  const workingUnit = useMemo(() => {
    const typedUnit = manualUnit.trim();
    const typedBase = manualBase.trim();
    const useManual = typedUnit && norm(typedUnit) !== norm(unit?.name || profile?.unit);
    const profileWithManual = { ...profile, unit: typedUnit || profile?.unit, gainingInstallation: typedBase || profile?.gainingInstallation };
    return normalizeUnit(useManual ? null : unit, profileWithManual);
  }, [unit, profile, manualUnit, manualBase]);

  const baseName = manualBase || profile?.gainingInstallation || 'gaining installation';
  const unitName = workingUnit?.name || manualUnit;
  const hasVerifiedPublicProfile = workingUnit && !workingUnit.sourceStatus?.includes('Generated') && !workingUnit.sourceStatus?.includes('Manual');
  const hasVerifiedContacts = hasVerifiedPublicProfile && workingUnit.contacts.length > 0;
  const publicQueries = unitName ? [
    { label: 'Google official unit page', query: `${unitName} ${baseName} official site` },
    { label: 'Official unit page search', query: `${unitName} ${baseName} official site:.mil OR site:.gov` },
    { label: 'Official/public social media search', query: `${unitName} official Facebook Instagram X site:.mil OR site:.gov OR site:facebook.com OR site:instagram.com OR site:x.com` },
    { label: 'Official unit history search', query: `${unitName} official history lineage site:.mil OR site:.gov` },
    { label: 'Public unit connection search', query: `${unitName} ${baseName} staff duty S1 public contact site:.mil OR site:.gov` },
  ] : [];

  if (!workingUnit) {
    return (
      <div className="unit-page">
        <h2>Unit Information</h2>
        <div className="unit-alert">
          <strong>No gaining unit selected yet</strong>
          <span>Enter a unit below, then use the public-source lookup links to verify official pages, history, social media, and contact methods.</span>
        </div>
        <LookupForm theme={theme} manualUnit={manualUnit} setManualUnit={setManualUnit} manualBase={manualBase} setManualBase={setManualBase} />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Unit History' },
    { id: 'connection', label: 'Unit Connection' },
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

      {activeUnitTab === 'history' && (
        <section className="unit-card">
          <h3>Unit History</h3>
          <p>{workingUnit.history}</p>
          <a className="unit-secondary-action" href={googleSearch(`${workingUnit.name} official unit history lineage`)} target="_blank" rel="noopener noreferrer">Search Public Unit History</a>
        </section>
      )}

      {activeUnitTab === 'connection' && (
        <section className="unit-card">
          <h3>Unit Connection & Social Media</h3>
          <p>Use publicly listed official channels only. Avoid personal numbers unless your sponsor or official orders provide them.</p>
          <SocialLinks social={hasVerifiedPublicProfile ? workingUnit.social : {}} theme={theme} unitName={workingUnit.name} />
          {hasVerifiedContacts && (
            <div className="unit-list">
              {workingUnit.contacts.map(contact => <a key={contact.url || contact.label} href={contact.url} target="_blank" rel="noopener noreferrer">{contact.label}</a>)}
            </div>
          )}
          {!hasVerifiedContacts && (
            <p className="unit-muted">Official U.S. government or military publicly available information is not available for this unit at this time.</p>
          )}
          <div className="unit-list">
            {safeContactTypes.map(item => (
              <a key={item} href={googleSearch(`${workingUnit.name} ${baseName} ${item} site:.mil OR site:.gov`)} target="_blank" rel="noopener noreferrer">{item}</a>
            ))}
          </div>
          <a className="unit-secondary-action" href={googleSearch(`${workingUnit.name} ${baseName} S1 staff duty public contact site:.mil OR site:.gov`)} target="_blank" rel="noopener noreferrer">Search Official Public Contact Methods</a>
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
