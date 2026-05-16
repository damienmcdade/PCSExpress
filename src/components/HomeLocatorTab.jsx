/*
 * Purpose: Official public military housing link hub for the gaining installation.
 * Renders a Google Maps embed centered on the housing market (city/zip) so
 * users can see the area in view before they open the official housing
 * sources below. The map honors the same z=13 zoom level as Base Map so
 * the gaining installation footprint is visible by default instead of
 * Google's wider default geocoding view.
 * Third-party dependencies: React.
 */

import { useEffect, useMemo, useState } from 'react';
import { resolveMarket } from '../data/installationMarkets';

const BRANCH_HOUSING_SOURCES = {
  Army: {
    name: 'Army Housing Directory',
    url: 'https://home.army.mil/imcom/customers/housing-directory',
    domains: 'site:home.army.mil OR site:army.mil OR site:installations.militaryonesource.mil',
  },
  Navy: {
    name: 'Navy Housing',
    url: 'https://ffr.cnic.navy.mil/Navy-Housing/',
    domains: 'site:ffr.cnic.navy.mil OR site:navylife.mil OR site:installations.militaryonesource.mil',
  },
  'Marine Corps': {
    name: 'Marine Corps Housing Search',
    url: 'https://installations.militaryonesource.mil/',
    domains: 'site:marines.mil OR site:installations.militaryonesource.mil',
  },
  'Air Force': {
    name: 'Department of the Air Force Housing',
    url: 'https://www.housing.af.mil/',
    domains: 'site:housing.af.mil OR site:installations.militaryonesource.mil',
  },
  'Space Force': {
    name: 'Department of the Air Force Housing',
    url: 'https://www.housing.af.mil/',
    domains: 'site:housing.af.mil OR site:spaceforce.mil OR site:installations.militaryonesource.mil',
  },
  'Coast Guard': {
    name: 'Coast Guard Housing Program',
    url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources-CG-1/Health-Safety-and-Work-Life-CG-11/Office-of-Work-Life-CG-111/Housing-Program/',
    domains: 'site:uscg.mil OR site:dcms.uscg.mil OR site:installations.militaryonesource.mil',
  },
};

const clean = value => String(value || '').trim();

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildOfficialLinks(market, branchSource) {
  const installation = market.installation;
  const query = market.query || installation;
  const domains = branchSource.domains || 'site:installations.militaryonesource.mil';
  return [
    {
      name: 'HOMES.mil / HEAT',
      desc: `Official DoD housing entry point. Open HOMES.mil and search for ${installation}.`,
      url: 'https://www.homes.mil/homes/DispatchServlet/HomesEntry',
    },
    {
      name: 'MilitaryINSTALLATIONS Housing Office',
      desc: `Official installation directory for housing office contacts and local housing support near ${installation}.`,
      url: 'https://installations.militaryonesource.mil/',
    },
    {
      name: branchSource.name,
      desc: `Official branch housing information for the branch selected during onboarding.`,
      url: branchSource.url,
    },
    {
      name: 'Official housing information search',
      desc: `Searches official U.S. military and government sources for housing information tied to ${installation}.`,
      url: googleSearchUrl(`${query} housing office ${domains}`),
    },
    {
      name: 'Temporary lodging and arrival housing',
      desc: `Searches official sources for temporary lodging, arrival housing, and PCS housing support near ${installation}.`,
      url: googleSearchUrl(`${query} temporary lodging housing site:installations.militaryonesource.mil OR site:militaryonesource.mil OR site:.mil`),
    },
    {
      name: 'BAH rate lookup',
      desc: `Official DoD housing allowance lookup. Use the ZIP code for the gaining installation or local housing area.`,
      url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/',
    },
  ];
}

export default function HomeLocatorTab({ theme = {}, profile = {} }) {
  const [manual, setManual] = useState('');
  const market = useMemo(() => resolveMarket(profile, manual), [profile, manual]);
  const branch = clean(profile?.branch) || 'Army';
  // BRANCH_HOUSING_SOURCES + buildOfficialLinks() are retained for
  // future use (e.g., a reference banner in the disclaimer) but the
  // static official-housing cards section was removed per user
  // direction - this tab is now fully dynamic.
  const colors = {
    primary: theme.primary || '#244247',
    secondary: theme.secondary || '#152F36',
    accent: theme.accent || '#C99A3D',
    text: '#0D1821',
    muted: '#56697C',
  };

  // Live rental listings from the /api/housing-listings RapidAPI proxy.
  // Empty + fallback=true means "no key configured or no upstream
  // results" - in that case we render the existing official housing
  // link cards below as the verified fallback path.
  const [listings, setListings] = useState({ status: 'idle', items: [], fallback: false, reason: '' });
  const [typeFilter, setTypeFilter] = useState('All');
  useEffect(() => {
    if (!market.matched || (!market.city && !market.zip)) {
      setListings({ status: 'no-market', items: [], fallback: true, reason: 'unknown-installation' });
      return;
    }
    let cancelled = false;
    setListings(s => ({ ...s, status: 'loading' }));
    const params = new URLSearchParams();
    if (market.city) params.set('city', market.city);
    if (market.state) params.set('state', market.state);
    if (market.zip) params.set('zip', market.zip);
    fetch(`/api/housing-listings?${params.toString()}`, { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : { listings: [], fallback: true, reason: `http-${r.status}` })
      .then(data => {
        if (cancelled) return;
        setListings({
          status: 'ready',
          items: Array.isArray(data?.listings) ? data.listings : [],
          fallback: !!data?.fallback,
          reason: data?.reason || '',
        });
      })
      .catch(err => {
        if (cancelled) return;
        setListings({ status: 'ready', items: [], fallback: true, reason: `network-${err?.message || 'error'}` });
      });
    return () => { cancelled = true; };
  }, [market.city, market.state, market.zip, market.matched]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: colors.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${colors.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>HOME LOCATOR</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>{market.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          Browse housing near the gaining installation by type — apartment community, single-family home, condo, townhouse, duplex, triplex, or quadplex. Tap any card for directions; the "Live units" button surfaces the matching listings on Apartments.com, Zillow, Trulia, and Realtor.com so you see real availability and pricing. The official housing sources below are the verified backup for HOMES.mil, MilitaryINSTALLATIONS, branch housing, and BAH lookup.
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: colors.muted, letterSpacing: '.08em', textTransform: 'uppercase' }}>Manual location search</label>
        <input
          value={manual}
          onChange={event => setManual(event.target.value)}
          placeholder="Base, address, city, or ZIP"
          style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: 13 }}
        />
        <div style={{ fontSize: 10, color: colors.muted, lineHeight: 1.5, marginTop: 8 }}>
          Leave this blank to use the gaining installation from onboarding.
        </div>
      </div>

      {listings.status === 'loading' && (
        <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: colors.muted }}>
          Looking up active rental listings near {market.installation || 'your gaining installation'}...
        </div>
      )}
      {listings.status === 'ready' && listings.items.length > 0 && (() => {
        // Build the type-filter chip list from whatever property types
        // come back. OSM apartment complexes are tagged "Apartment
        // community"; a configured RapidAPI key adds "Single Family",
        // "Condo", "Townhouse", etc. when those listings come through.
        // Anything without a propertyType collapses into "Other".
        const counts = listings.items.reduce((m, it) => {
          const t = it.propertyType || 'Other';
          m[t] = (m[t] || 0) + 1;
          return m;
        }, {});
        const orderedTypes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const filtered = typeFilter === 'All' ? listings.items : listings.items.filter(it => (it.propertyType || 'Other') === typeFilter);
        return (
        <section style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: colors.text, marginBottom: 8 }}>
            Housing near {market.installation} <span style={{ fontWeight: 600, color: colors.muted, marginLeft: 6 }}>({listings.items.length})</span>
          </div>
          {orderedTypes.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <button
                onClick={() => setTypeFilter('All')}
                style={{
                  padding: '6px 12px', borderRadius: 16,
                  border: `1.5px solid ${typeFilter === 'All' ? colors.primary : '#D6E0EA'}`,
                  background: typeFilter === 'All' ? colors.primary : '#FFFFFF',
                  color: typeFilter === 'All' ? '#FFFFFF' : '#243447',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                }}
              >
                All ({listings.items.length})
              </button>
              {orderedTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '6px 12px', borderRadius: 16,
                    border: `1.5px solid ${typeFilter === t ? colors.primary : '#D6E0EA'}`,
                    background: typeFilter === t ? colors.primary : '#FFFFFF',
                    color: typeFilter === t ? '#FFFFFF' : '#243447',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {t} ({counts[t]})
                </button>
              ))}
            </div>
          )}
          <div data-dynamic-card="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {filtered.map(item => (
              // Whole card opens Google Maps directions in a new tab
              // (matches Family Fun / Schools UX). Apartments.com and
              // any inner links use stopPropagation.
              <a
                key={item.id}
                href={item.listingUrl || item.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open verified housing listings for ${item.name || item.address || 'this property'}${item.distanceMiles != null ? ` (${item.distanceMiles} miles away)` : ''}`}
                style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${colors.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: colors.text, display: 'block', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: colors.text, lineHeight: 1.3, flex: 1 }}>
                    {item.name || item.address || `${item.propertyType || 'Listing'} near ${item.city || ''}`}
                  </div>
                  {item.distanceMiles != null && (
                    <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{item.distanceMiles} mi</span>
                  )}
                </div>
                {(item.address || item.city) && (
                  <div style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>
                    {[item.address, [item.city, item.state, item.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {item.propertyType && (
                    <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{item.propertyType}</span>
                  )}
                  {item.beds != null && (
                    <span style={{ background: '#F3F4F6', color: '#243447', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{item.beds} bd</span>
                  )}
                  {item.baths != null && (
                    <span style={{ background: '#F3F4F6', color: '#243447', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{item.baths} ba</span>
                  )}
                  {item.sqft != null && (
                    <span style={{ background: '#F3F4F6', color: '#243447', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{item.sqft.toLocaleString()} sqft</span>
                  )}
                  {item.price && (
                    <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>${item.price.toLocaleString()}/mo</span>
                  )}
                </div>
                {item.description && (
                  <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginBottom: 8 }}>
                    {item.description.length > 180 ? item.description.slice(0, 180) + '...' : item.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: colors.primary, color: '#FFF', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 6 }}>Open verified listings →</span>
                  {item.website && (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ textDecoration: 'none', background: '#FFFFFF', color: colors.primary, border: `1px solid ${colors.primary}`, fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 5 }}
                    >
                      Property website
                    </a>
                  )}
                  {item.phone && (
                    <span style={{ background: '#FFFFFF', color: colors.primary, border: `1px solid ${colors.primary}`, fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 5 }}>{item.phone}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
          <div style={{ fontSize: 10, color: colors.muted, lineHeight: 1.5, marginTop: 8 }}>
            Apartment communities are from OpenStreetMap. Tap any card for directions, or tap "Live units" to open Apartments.com for current availability, bed/bath/sqft, and pricing at that address. PCS Express does not store private housing inventory.
          </div>
        </section>
        );
      })()}
      {listings.status === 'ready' && listings.items.length === 0 && listings.fallback && (
        <div style={{ background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 11, color: '#0D3B66', lineHeight: 1.5 }}>
          {listings.reason === 'no-api-key'
            ? 'Live rentals will turn on soon. In the meantime, the official housing sources below let you search HOMES.mil, MilitaryINSTALLATIONS, and your branch housing portal.'
            : listings.reason === 'unknown-installation'
              ? 'Set a gaining installation in onboarding (or type one above) to see active rentals. The official housing sources below work for any base.'
              : `We do not have active rentals cached for ${market.installation || 'this installation'} yet. The official housing sources below let you search current availability.`}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#0D3B66', background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
        Verify availability, eligibility, wait lists, pet rules, commute distance, lease terms, and move-in dates through the listing source before making housing decisions. PCS Express does not store private housing inventory. For DoD-managed and on-installation housing options, search the gaining installation at <a href="https://www.homes.mil/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66', fontWeight: 700 }}>HOMES.mil</a> or <a href="https://installations.militaryonesource.mil/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66', fontWeight: 700 }}>MilitaryINSTALLATIONS</a>.
      </div>
    </div>
  );
}
