/*
 * Purpose: User-facing security category explaining local-first controls, no-document-upload posture, and DoD/DISA-style safeguards.
 * Third-party dependencies: React.
 */

import { useMemo } from 'react';

const CONTROL_GROUPS = [
  {
    title: 'No Document Upload Surface',
    status: 'Active',
    items: [
      'Document attachment controls were removed from PCS document checklists.',
      'Resume file upload was removed; users may paste text manually if they choose.',
      'Native iOS secure-document bridge and Android file provider exposure were removed from the build path.',
      'Checklist squares remain available so users can track progress without adding documents to the app.',
    ],
  },
  {
    title: 'Local-First User Data',
    status: 'Active',
    items: [
      'PCS profile, checklist progress, employment skills, translation saves, route notes, and housing filter preferences are stored on the device.',
      'The app does not intentionally transmit user files or documents to PCS Express servers.',
      'Users are instructed not to enter classified, CUI, restricted, operational, or non-public government information.',
    ],
  },
  {
    title: 'Browser And Server Hardening',
    status: 'Active',
    items: [
      'Content Security Policy limits scripts to the app origin and blocks embedded object content.',
      'Permissions Policy disables camera, microphone, geolocation, payment, USB, and Bluetooth from browser contexts.',
      'Frame, content type, referrer, cross-origin, and transport security headers reduce common browser attack paths.',
    ],
  },
  {
    title: 'Operational Safeguards',
    status: 'Active',
    items: [
      'Privacy Shield obscures the app when it backgrounds on supported platforms.',
      'Startup recovery prevents persistent blank-screen failure from corrupted local profile state.',
      'Audit logging records key local actions such as checklist and milestone changes where supported.',
      'Public-data warnings tell users that displayed base, unit, and resource content must remain official/public only.',
    ],
  },
];

const ALIGNMENT = [
  ['DISA STIG style browser hardening', 'Security headers, restricted browser permissions, reduced cross-origin exposure'],
  ['DoD public-data handling posture', 'No classified, CUI, restricted, mission, roster, or non-public operational data should be entered'],
  ['NIST SSDF / 800-218 style controls', 'Least functionality, local-first storage, dependency-conscious builds, and documented security review'],
  ['Zero-trust principle', 'No trust in uploaded documents because uploads are removed entirely'],
  ['Section 508 support direction', 'Checklist controls remain tap targets and preserve progress without requiring file operations'],
];

export default function SecurityCategoryTab({ theme }) {
  const updated = useMemo(() => new Date().toLocaleString(), []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 5 }}>SECURITY POSTURE</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Local-first, no document uploads</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          PCS Express is hardened to reduce sensitive-data exposure by removing document upload capability, keeping user progress local, limiting browser permissions, and displaying only official/public information where available.
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Security summary generated locally: {updated}</div>
      </div>

      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#7A4A00', marginBottom: 4 }}>User responsibility</div>
        <div style={{ fontSize: 11, color: '#7A4A00', lineHeight: 1.6 }}>
          Do not enter classified information, controlled unclassified information, restricted government data, deployment details, rosters, internal phone lists, mission details, or private medical/legal documents into the app.
        </div>
      </div>

      {CONTROL_GROUPS.map(group => (
        <div key={group.title} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{group.title}</div>
            <span style={{ alignSelf: 'flex-start', background: '#E8F5E9', color: '#1B5E20', border: '1px solid #A5D6A7', borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 900 }}>{group.status}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {group.items.map(item => (
              <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: '#E8F5E9', color: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 11, color: '#34495E', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821', marginBottom: 10 }}>DoD / DISA-style alignment</div>
        {ALIGNMENT.map(([name, detail]) => (
          <div key={name} style={{ borderTop: '1px solid #F1F5F9', padding: '9px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary }}>{name}</div>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{detail}</div>
          </div>
        ))}
        <div style={{ marginTop: 10, fontSize: 10, color: '#7A4A00', lineHeight: 1.5 }}>
          This alignment is a hardening posture, not a formal DoD authorization to operate, DISA certification, or government endorsement.
        </div>
      </div>
    </div>
  );
}
