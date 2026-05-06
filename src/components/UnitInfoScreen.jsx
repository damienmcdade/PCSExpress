/*
 * Purpose: Public unit information screen for official/public unit profile, history, contact, and lookup resources.
 * Third-party dependencies: React.
 */

import { useMemo, useState } from 'react'

const officialSearchUrl = (query) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${query} official public site:.mil OR site:.gov`)}`

const safeContacts = (unit, profile) => {
  const base = (profile?.gainingInstallation || '').split(',')[0].trim()
  const unitName = unit?.name || profile?.unit || 'gaining unit'
  const fallback = [
    { label: 'MilitaryINSTALLATIONS directory', url: 'https://installations.militaryonesource.mil/' },
    { label: 'Official unit or command page lookup', url: officialSearchUrl(`${unitName} ${base}`) },
    { label: 'Public affairs / DVIDS lookup', url: `https://www.google.com/search?q=${encodeURIComponent(`${unitName} ${base} DVIDS public affairs`)}` },
    { label: 'Public staff duty / quarterdeck lookup', url: `https://www.google.com/search?q=${encodeURIComponent(`${unitName} ${base} staff duty quarterdeck public contact`)}` },
  ]
  return Array.isArray(unit?.contacts) && unit.contacts.length ? unit.contacts : fallback
}

function ResourceLink({ item, color }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', marginBottom: 10 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${color}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 3 }}>{item.label}</div>
        <div style={{ fontSize: 11, color: '#56697C', wordBreak: 'break-word' }}>{item.url}</div>
      </div>
    </a>
  )
}

export default function UnitInfoScreen({ profile, theme, unit }) {
  const [activeUnitTab, setActiveUnitTab] = useState('overview')
  const unitName = unit?.name || profile?.unit || ''
  const baseName = (profile?.gainingInstallation || '').split(',')[0].trim()
  const contacts = useMemo(() => safeContacts(unit, profile), [unit, profile])
  const socialLinks = unit?.social
    ? Object.entries(unit.social).filter(([, value]) => value).map(([network, value]) => {
        const handle = String(value).replace('@', '')
        const urls = {
          facebook: `https://www.facebook.com/${handle}`,
          twitter: `https://www.twitter.com/${handle}`,
          instagram: `https://www.instagram.com/${handle}`,
          linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(handle)}`,
        }
        return { label: `${network[0].toUpperCase()}${network.slice(1)} public page`, url: urls[network] || officialSearchUrl(`${unitName} ${network}`) }
      })
    : []

  if (!unitName) {
    return (
      <div className="tab-content">
        <h2 style={{ color: theme.primary }}>Unit Information</h2>
        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#E65100' }}>No unit selected yet</div>
          <div style={{ fontSize: 11, color: '#7A4A00', marginTop: 6 }}>
            Select or manually enter an actual gaining unit during onboarding to view public unit information and official lookup links.
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Unit History' },
    { id: 'connection', label: 'Unit Connection' },
    { id: 'lookup', label: 'Public Lookup' },
  ]

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary }}>{unitName}</h2>
      <div style={{ background: `${theme.primary}12`, border: `1px solid ${theme.primary}30`, borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: theme.primary, letterSpacing: '.08em', marginBottom: 5 }}>PUBLIC UNIT PROFILE</div>
        <div style={{ fontSize: 12, color: '#34495E', lineHeight: 1.5 }}>
          PCS Express displays official public U.S. government, military, and public-source unit information only. If official public information is unavailable, use the lookup links below to verify details directly.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveUnitTab(t.id)} style={{ padding: '8px 12px', borderRadius: 20, border: `1.5px solid ${activeUnitTab === t.id ? theme.primary : '#E0E6EE'}`, background: activeUnitTab === t.id ? theme.primary : '#FFFFFF', color: activeUnitTab === t.id ? '#FFFFFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: activeUnitTab === t.id ? 800 : 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeUnitTab === 'overview' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', marginBottom: 5 }}>UNIT</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821', marginBottom: 12 }}>{unitName}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', marginBottom: 5 }}>BRANCH / INSTALLATION</div>
          <div style={{ fontSize: 12, color: '#34495E', lineHeight: 1.5 }}>{unit?.branch || profile?.branch || 'Military'}{baseName ? ` at ${baseName}` : ''}</div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#56697C' }}>Source status: {unit?.sourceStatus || 'Official/public lookup profile'}</div>
        </div>
      )}

      {activeUnitTab === 'history' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>Unit History</div>
          <div style={{ fontSize: 12, color: '#34495E', lineHeight: 1.6 }}>
            {unit?.history || `Official U.S. government or military publicly available history is not available for ${unitName} at this time. Use Public Lookup to verify official command history, lineage, and public affairs releases.`}
          </div>
        </div>
      )}

      {activeUnitTab === 'connection' && (
        <div>
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 11, color: '#7A4A00', lineHeight: 1.5 }}>
            Unit Connection combines official public contact pathways and public social media lookup. Internal rosters, private leadership contact lists, duty schedules, and non-public mission information are not displayed.
          </div>
          {[...contacts, ...socialLinks].map((item, idx) => <ResourceLink key={idx} item={item} color={theme.primary} />)}
          {!contacts.length && !socialLinks.length && (
            <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 14, fontSize: 12, color: '#56697C' }}>
              Official U.S. government or military publicly available information is not available for this unit at this time.
            </div>
          )}
        </div>
      )}

      {activeUnitTab === 'lookup' && (
        <div>
          {[
            { label: 'Official .mil / .gov unit search', url: officialSearchUrl(`${unitName} ${baseName}`) },
            { label: 'DVIDS public affairs search', url: `https://www.dvidshub.net/search?q=${encodeURIComponent(`${unitName} ${baseName}`)}` },
            { label: 'MilitaryINSTALLATIONS base directory', url: 'https://installations.militaryonesource.mil/' },
            { label: 'Public social media search', url: `https://www.google.com/search?q=${encodeURIComponent(`${unitName} ${baseName} official social media`)}` },
          ].map((item, idx) => <ResourceLink key={idx} item={item} color={theme.accent} />)}
        </div>
      )}
    </div>
  )
}
