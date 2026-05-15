import { useEffect, useMemo, useState } from 'react';
import { publicMapEmbedUrl, publicMapSearchUrl } from '../lib/mapEmbedUrl';

const OFFICIAL_INSTALLATION_DIRECTORY = 'https://installations.militaryonesource.mil/';
const MILITARY_ONESOURCE_OVERVIEW = 'https://www.militaryonesource.mil/resources/network/militaryinstallations/';
const DOD_INSTALLATION_RESOURCE = 'https://www.defense.gov/Contact/Help-Center/Article/Article/2742641/military-installation/military-installation-resources/';

// Local installation coordinates and facility markers were intentionally removed.
// The map now resolves the selected installation through public map search and
// official U.S. Government or military installation resources at runtime.
export const ALL_BASES = [];

const BRANCH_SOURCES = {
  Army: 'https://www.army.mil/',
  Navy: 'https://www.navy.mil/',
  'Marine Corps': 'https://www.marines.mil/',
  'Air Force': 'https://www.af.mil/',
  'Space Force': 'https://www.spaceforce.mil/',
  'Coast Guard': 'https://www.uscg.mil/',
};

const clean = (value) => String(value || '').trim();

function getSelectedInstallation(profile) {
  const raw = clean(profile?.gainingInstallation || profile?.installation || profile?.base);
  if (!raw) return '';
  return raw.split(',')[0].trim();
}

function getSelectedBranch(profile) {
  return clean(profile?.branch || profile?.serviceBranch || profile?.militaryBranch || profile?.component);
}

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function sourceCards(installation, branch) {
  const label = installation || 'selected gaining installation';
  const branchSource = BRANCH_SOURCES[branch];
  return [
    {
      title: 'MilitaryINSTALLATIONS',
      detail: 'Official DoD and Military OneSource installation directory for overviews, contacts, programs, services, maps, and directions.',
      url: OFFICIAL_INSTALLATION_DIRECTORY,
      type: 'Official directory',
    },
    {
      title: 'Military OneSource overview',
      detail: 'Official explanation of how the MilitaryINSTALLATIONS directory supports PCS moves and installation research.',
      url: MILITARY_ONESOURCE_OVERVIEW,
      type: 'Official guidance',
    },
    {
      title: 'DoD installation resource',
      detail: 'Official Defense.gov pointer to installation resources, check-in information, contacts, and community information.',
      url: DOD_INSTALLATION_RESOURCE,
      type: 'Official resource',
    },
    {
      title: `${branch || 'Branch'} official site search`,
      detail: `Searches official .mil and Military OneSource pages for current public information about ${label}.`,
      url: googleSearchUrl(`${label} official installation site:.mil OR site:militaryonesource.mil`),
      type: 'Official-source search',
    },
    ...(branchSource ? [{
      title: `${branch} public website`,
      detail: `Official public ${branch} website for branch-level installation and readiness information.`,
      url: branchSource,
      type: 'Official branch site',
    }] : []),
    {
      title: 'Public map search',
      detail: `Opens a public map search for ${label}. Restricted gates, internal facilities, and force-protection details are not stored or displayed by PCS Express.`,
      url: publicMapSearchUrl(label),
      type: 'Public map',
    },
  ];
}

export default function BaseMapModule({ theme = {}, profile = {} }) {
  const profileInstallation = getSelectedInstallation(profile);
  const branch = getSelectedBranch(profile);
  const [installationInput, setInstallationInput] = useState(profileInstallation);
  const [submittedInstallation, setSubmittedInstallation] = useState(profileInstallation);

  useEffect(() => {
    setInstallationInput(profileInstallation);
    setSubmittedInstallation(profileInstallation);
  }, [profileInstallation]);

  const installation = clean(submittedInstallation || installationInput || profileInstallation);
  const displayInstallation = installation || 'Enter a gaining installation';
  const mapQuery = installation ? `${installation} military installation` : 'military installation';
  const embedUrl = useMemo(() => publicMapEmbedUrl(mapQuery), [mapQuery]);
  const mapSearchUrl = useMemo(() => publicMapSearchUrl(mapQuery), [mapQuery]);
  const cards = useMemo(() => sourceCards(installation, branch), [installation, branch]);

  const colors = {
    primary: theme.primary || '#21424A',
    accent: theme.accent || '#C69A48',
    text: theme.text || '#172026',
    muted: theme.muted || '#667085',
    border: '#D8E0E7',
    surface: '#FFFFFF',
    soft: '#F4F7F7',
  };

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 14,
    boxShadow: '0 10px 22px rgba(18, 32, 38, 0.08)',
  };

  const buttonStyle = {
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    background: colors.primary,
    color: '#FFFFFF',
    fontWeight: 800,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  };

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...cardStyle, background: colors.soft }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 }}>
            Official public base map
          </p>
          <h3 style={{ margin: 0, color: colors.primary, fontSize: 22, lineHeight: 1.2 }}>
            {displayInstallation}
          </h3>
          <p style={{ margin: 0, color: colors.text, lineHeight: 1.55 }}>
            This map uses public map search plus official U.S. Government and military installation resources. PCS Express does not store or display restricted, internal, force-protection, CUI, or non-public facility map data.
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedInstallation(installationInput);
        }}
        style={{
          ...cardStyle,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 10,
          alignItems: 'end',
        }}
      >
        <label style={{ display: 'grid', gap: 6, color: colors.text, fontWeight: 800 }}>
          Installation or base
          <input
            value={installationInput}
            onChange={(event) => setInstallationInput(event.target.value)}
            placeholder="Example: Fort Liberty"
            aria-label="Installation or base"
            style={{
              width: '100%',
              minHeight: 42,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '0 12px',
              fontSize: 15,
              color: colors.text,
              background: '#FFFFFF',
            }}
          />
        </label>
        <button type="submit" style={buttonStyle}>
          Update map
        </button>
      </form>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <iframe
          key={embedUrl}
          title={`Public map view for ${displayInstallation}`}
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', height: 420, border: 0, display: 'block', background: '#EDF2F4' }}
          allowFullScreen
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: 12, borderTop: `1px solid ${colors.border}` }}>
          <a href={mapSearchUrl} target="_blank" rel="noopener noreferrer" style={buttonStyle}>
            Open public map
          </a>
          <a href={OFFICIAL_INSTALLATION_DIRECTORY} target="_blank" rel="noopener noreferrer" style={{ ...buttonStyle, background: colors.accent, color: '#101820' }}>
            Open MilitaryINSTALLATIONS
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {cards.map((card) => (
          <a
            key={`${card.title}-${card.url}`}
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...cardStyle, color: colors.text, textDecoration: 'none', display: 'grid', gap: 8 }}
          >
            <span style={{ color: colors.accent, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0 }}>
              {card.type}
            </span>
            <strong style={{ color: colors.primary, fontSize: 16 }}>{card.title}</strong>
            <span style={{ color: colors.muted, fontSize: 13, lineHeight: 1.45 }}>{card.detail}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
