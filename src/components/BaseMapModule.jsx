import { useEffect, useMemo, useState } from 'react';
import { osmBoundingBoxEmbedUrl, publicMapEmbedUrl, publicMapSearchUrl } from '../lib/mapEmbedUrl';
import { findKnownMarket } from '../data/installationMarkets';

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
  // Build the most specific Google Maps query possible. Pulling
  // city/state/country from INSTALLATION_MARKETS lets the embed land
  // on the correct installation immediately — without it, ambiguous
  // names like "Fort Bragg" resolve to the wrong place (e.g., the
  // coastal town in CA instead of Fort Liberty / Fort Bragg NC).
  const knownMarket = useMemo(() => findKnownMarket(installation), [installation]);
  const mapQuery = useMemo(() => {
    if (!installation) return 'military installation';
    const parts = [installation];
    if (knownMarket?.city) parts.push(knownMarket.city);
    if (knownMarket?.state) parts.push(knownMarket.state);
    if (knownMarket?.country && knownMarket.country !== 'United States') parts.push(knownMarket.country);
    return parts.join(', ');
  }, [installation, knownMarket]);
  const mapSearchUrl = useMemo(() => publicMapSearchUrl(mapQuery), [mapQuery]);
  const cards = useMemo(() => sourceCards(installation, branch), [installation, branch]);

  // Geocode via Nominatim and render an OSM embed centered on the
  // installation. This replaces the Google classic embed which had
  // intermittent zoom and consent-wall issues. CSP already allows
  // https://nominatim.openstreetmap.org for the route planner.
  // Geocode the installation through Nominatim. The previous query was
  // just "<installation> military installation" which sometimes pulled
  // a state-level or wrong-base result. We now first try a curated
  // city/state lookup from installationMarkets (when matched), then
  // fall back to the raw installation name. Multiple candidates are
  // requested so we can pick the most likely one by name match.
  const [geo, setGeo] = useState({ status: 'idle', lat: null, lng: null });
  useEffect(() => {
    if (!installation) {
      setGeo({ status: 'idle', lat: null, lng: null });
      return;
    }
    let cancelled = false;
    setGeo(s => ({ ...s, status: 'loading' }));

    // Build geocode candidates in priority order. Most specific
    // first so ambiguous installation names (Fort Bragg, Camp Lejeune,
    // etc.) resolve to the correct location.
    const market = knownMarket;
    const installationAlias = market?.alias || market?.installation || installation;
    const candidates = [];
    if (market && market.city && market.state) {
      if (market.postal) {
        candidates.push(`${installationAlias}, ${market.city}, ${market.state} ${market.postal}`);
      }
      candidates.push(`${installationAlias}, ${market.city}, ${market.state}${market.country ? `, ${market.country}` : ''}`);
      candidates.push(`${installationAlias}, ${market.city}, ${market.state}`);
      candidates.push(`${installationAlias}, ${market.city}`);
    } else if (market && market.country) {
      candidates.push(`${installationAlias}, ${market.country}`);
    }
    candidates.push(`${installation} military installation`);
    candidates.push(installation);

    // Try each candidate sequentially; first hit wins.
    (async () => {
      for (const q of candidates) {
        if (cancelled) return;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
            headers: { Accept: 'application/json' },
          });
          if (!r.ok) continue;
          const data = await r.json();
          const hit = Array.isArray(data) && data[0];
          if (hit) {
            if (cancelled) return;
            setGeo({ status: 'ready', lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) });
            return;
          }
        } catch {}
      }
      if (!cancelled) setGeo({ status: 'not-found', lat: null, lng: null });
    })();
    return () => { cancelled = true; };
  }, [installation, knownMarket]);

  const embedUrl = useMemo(() => {
    // Google Maps is the canonical base-map provider. Prefer a
    // lat/lng-pinned Google embed once Nominatim resolves the
    // installation — that's the only form that guarantees the map is
    // centered on the correct installation. Until then, fall back to
    // a fully-qualified market query (installation + city + state +
    // country) so Google can disambiguate (e.g., Fort Bragg, NC vs.
    // Fort Bragg, CA).
    if (geo.status === 'ready') {
      return `https://maps.google.com/maps?q=${geo.lat},${geo.lng}&z=13&output=embed`;
    }
    return publicMapEmbedUrl(mapQuery);
  }, [geo, mapQuery]);

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
