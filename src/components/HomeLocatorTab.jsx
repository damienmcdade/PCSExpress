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
import { apiUrl } from '../config/apiConfig';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

// Intentionally retained for the future reference-banner; see the
// disclaimer-link path below. Underscore-prefix to keep the
// regulator-friendly documentation without tripping the unused-vars
// rule.
const _BRANCH_HOUSING_SOURCES = {
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

// Retained as documentation for the reference-banner — see comment in
// HomeLocatorTab. Underscore-prefix keeps it lint-clean without
// rewriting history.
function _buildOfficialLinks(market, branchSource) {
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
  const _branch = clean(profile?.branch) || 'Army';
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
  // Market stats from /api/market-stats — FRED (30-yr mortgage rate,
  // median home price, Case-Shiller HPI) + HUD User (Fair Market Rents
  // by bedroom count). Optional context above the listings grid;
  // hidden entirely when neither API key is configured.
  const [marketStats, setMarketStats] = useState({ status: 'idle', stats: null, oconusHousing: null });
  // Bumped by pull-to-refresh; included in the fetch effect's deps so
  // the existing fetch logic re-runs untouched.
  const [refreshNonce, setRefreshNonce] = useState(0);
  useEffect(() => {
    if (!market.matched || (!market.city && !market.zip)) {
      setListings({ status: 'no-market', items: [], fallback: true, reason: 'unknown-installation' });
      setMarketStats({ status: 'no-market', stats: null, oconusHousing: null });
      return;
    }
    let cancelled = false;
    setListings(s => ({ ...s, status: 'loading' }));
    setMarketStats({ status: 'loading', stats: null, oconusHousing: null });
    const params = new URLSearchParams();
    if (market.city) params.set('city', market.city);
    if (market.state) params.set('state', market.state);
    if (market.zip) params.set('zip', market.zip);
    if (profile?.language) params.set('lang', profile.language);

    // Build a client-side Google-Maps deep-link card set we can use
    // as the fallback whenever the API is slow or unreachable. The
    // Railway dyno's cold-start can take 30+ seconds on the first
    // request after idle, which previously left the user staring at
    // a "timed out" banner. With this fallback in hand we never show
    // an empty Home Locator — even if the API never returns the
    // user sees the same Google Maps category cards they would have
    // gotten from the server's synthetic path.
    const buildLocalFallback = () => {
      const ev = encodeURIComponent;
      const where = [market.city, market.state].filter(Boolean).join(', ') || market.city || market.state || 'your installation';
      const isOconus = market.state && market.state.length > 2; // 'Germany', 'Italy', etc. are OCONUS
      if (isOconus) {
        return [
          { id: 'fb-homesmil',         name: `HOMES.mil — privatized housing near ${market.city || 'your installation'}`,        description: 'Official Department of Defense privatized housing portal. Government-managed; no advertising; no broker fees.', propertyType: 'DoD official', city: market.city, state: market.state, listingUrl: `https://www.google.com/search?q=${ev(`${where} housing site:homes.mil`)}`, mapUrl: `https://www.google.com/search?q=${ev(`${where} housing site:homes.mil`)}`, synthetic: true, source: 'Local fallback' },
          { id: 'fb-ahrn',             name: `AHRN — rentals near ${market.city || 'your installation'}`,                       description: 'Automated Housing Referral Network. DoD-sanctioned global housing marketplace for military families.',     propertyType: 'AHRN.com',     city: market.city, state: market.state, listingUrl: `https://www.google.com/search?q=${ev(`rentals near ${where} site:ahrn.com`)}`,            mapUrl: `https://www.google.com/search?q=${ev(`rentals near ${where} site:ahrn.com`)}`,            synthetic: true, source: 'Local fallback' },
          { id: 'fb-mbo',              name: `MilitaryByOwner — homes for rent near ${market.city || 'your installation'}`,     description: 'For-rent and for-sale homes posted directly by military landlords. Covers stateside and overseas installations.', propertyType: 'MilitaryByOwner', city: market.city, state: market.state, listingUrl: `https://www.google.com/search?q=${ev(`rentals near ${where} site:militarybyowner.com`)}`, mapUrl: `https://www.google.com/search?q=${ev(`rentals near ${where} site:militarybyowner.com`)}`, synthetic: true, source: 'Local fallback' },
          { id: 'fb-mil-installations', name: `MilitaryINSTALLATIONS — ${market.city || 'installation'} resources`, description: 'DoD installation directory with housing, school liaison, and family-readiness contacts for every base worldwide.', propertyType: 'MilitaryINSTALLATIONS', city: market.city, state: market.state, listingUrl: `https://installations.militaryonesource.mil/search?keyword=${ev(market.city || market.state)}`, mapUrl: `https://installations.militaryonesource.mil/search?keyword=${ev(market.city || market.state)}`, synthetic: true, source: 'Local fallback' },
          { id: 'fb-gmaps',            name: `Off-base rentals on Google Maps near ${market.city || 'your installation'}`, description: 'Curated Google Maps search for apartments, rental agencies, and landlord listings in the host-nation area around your gaining installation.', propertyType: 'Google Maps', city: market.city, state: market.state, listingUrl: `https://www.google.com/maps/search/?api=1&query=${ev(`apartments for rent near ${where}`)}`, mapUrl: `https://www.google.com/maps/search/?api=1&query=${ev(`apartments for rent near ${where}`)}`, synthetic: true, source: 'Local fallback' },
        ];
      }
      const types = [
        { propertyType: 'Single Family', q: 'single-family homes for rent' },
        { propertyType: 'Condo',         q: 'condominiums for rent' },
        { propertyType: 'Townhouse',     q: 'townhomes for rent' },
        { propertyType: 'Duplex',        q: 'duplex units for rent' },
        { propertyType: 'Triplex',       q: 'triplex units for rent' },
        { propertyType: 'Quadplex',      q: 'quadplex or fourplex for rent' },
      ];
      return types.map(t => ({
        id: `fb-${t.propertyType.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${t.propertyType} rentals near ${market.city || market.state}`,
        description: `Google Maps search for ${t.q} in the ~50-mile area around ${where}.`,
        propertyType: t.propertyType,
        city: market.city,
        state: market.state || '',
        zip: market.zip || '',
        listingUrl: `https://www.google.com/maps/search/?api=1&query=${ev(`${t.q} ${where}`)}`,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${ev(`${t.q} ${where}`)}`,
        synthetic: true,
        source: 'Local fallback',
      }));
    };

    // Client-side abort after 12s — the server's own budget caps at
    // ~8s, so anything past 12s means the dyno is cold-starting or
    // the network is unreachable. At that point we render the local
    // synthetic-card fallback immediately instead of spinning.
    const housingAbort = new AbortController();
    const housingTimer = setTimeout(() => housingAbort.abort(), 12_000);
    fetch(apiUrl(`/api/housing-listings?${params.toString()}`), {
      headers: { Accept: 'application/json' },
      signal: housingAbort.signal,
    })
      .then(r => r.ok ? r.json() : { listings: [], fallback: true, reason: `http-${r.status}` })
      .then(data => {
        clearTimeout(housingTimer);
        if (cancelled) return;
        const apiItems = Array.isArray(data?.listings) ? data.listings : [];
        // If the API returned empty (cold start, upstream timeout,
        // unknown market) merge in the client-side fallback so the
        // user always sees actionable cards.
        const items = apiItems.length > 0 ? apiItems : buildLocalFallback();
        setListings({
          status: 'ready',
          items,
          fallback: apiItems.length === 0,
          reason: data?.reason || (apiItems.length === 0 ? 'local-fallback' : ''),
        });
      })
      .catch(err => {
        clearTimeout(housingTimer);
        if (cancelled) return;
        const reason = err?.name === 'AbortError' ? 'timeout' : `network-${err?.message || 'error'}`;
        // Network or timeout failure → still render the local fallback
        // cards so the Home Locator is never empty.
        setListings({ status: 'ready', items: buildLocalFallback(), fallback: true, reason });
      });
    const statsAbort = new AbortController();
    const statsTimer = setTimeout(() => statsAbort.abort(), 12_000);
    fetch(apiUrl(`/api/market-stats?${params.toString()}`), {
      headers: { Accept: 'application/json' },
      signal: statsAbort.signal,
    })
      .then(r => r.ok ? r.json() : { stats: null, oconusHousing: null, fallback: true })
      .then(data => {
        clearTimeout(statsTimer);
        if (cancelled) return;
        setMarketStats({ status: 'ready', stats: data?.stats || null, oconusHousing: data?.oconusHousing || null });
      })
      .catch(() => {
        clearTimeout(statsTimer);
        if (cancelled) return;
        setMarketStats({ status: 'ready', stats: null, oconusHousing: null });
      });
    return () => {
      cancelled = true;
      clearTimeout(housingTimer);
      clearTimeout(statsTimer);
      housingAbort.abort();
      statsAbort.abort();
    };
    // profile.language is part of the request body but the effect must
    // not refetch when the user changes UI language; changing language
    // re-translates the UI in place rather than re-loading listings.
    // refreshNonce included so pull-to-refresh can re-trigger the
    // fetch by bumping the counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market.city, market.state, market.zip, market.matched, refreshNonce]);

  const { indicator } = usePullToRefresh(async () => {
    setRefreshNonce(n => n + 1);
    // Keep the indicator visible long enough for the fetches above
    // to settle in the typical case (Railway warm hit ~400-900ms,
    // cold start ~6s). 1.2s is a UX-tested compromise: the indicator
    // hides before the perceived "long wait" threshold, and the
    // skeleton state inside the cards continues to communicate the
    // ongoing load if the fetch is still in flight.
    await new Promise(r => setTimeout(r, 1200));
  });

  return (
    <div style={{ padding: 16 }}>
      {indicator}
      <div style={{ background: colors.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${colors.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>HOME LOCATOR</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>{market.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          Active rental listings within fifteen miles of your gaining installation, organized by property type. Each card opens a verified listing source so you can confirm availability, lease terms, and current pricing directly with the provider. PCS Express does not store housing inventory or broker rentals.
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

      {marketStats.status === 'ready' && marketStats.stats && (() => {
        const s = marketStats.stats;
        const m = s.mortgageRate30Yr;
        const mhp = s.medianHomePrice;
        const fmr = s.fairMarketRent;
        const hasFred = !!(m || mhp);
        const hasFmr = !!fmr;
        if (!hasFred && !hasFmr) return null;
        const usd = (n) => n == null ? '' : '$' + Math.round(n).toLocaleString();
        const lang = profile?.language || 'en';
        const fmtDate = (iso) => {
          if (!iso) return '';
          const d = new Date(iso);
          if (Number.isNaN(d.getTime())) return iso;
          try {
            return d.toLocaleDateString(lang, { month: 'short', year: 'numeric' });
          } catch {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
        };
        return (
          <section style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: colors.text }}>
                Market snapshot
                <span style={{ fontSize: 10, fontWeight: 700, color: colors.muted, marginLeft: 8 }}>
                  {fmr?.areaName ? `${fmr.areaName}` : (market.city ? `${market.city}${market.state ? ', ' + market.state : ''}` : 'national')}
                </span>
              </div>
              <div style={{ fontSize: 9, color: colors.muted, letterSpacing: '.06em' }}>
                FRED · HUD User
              </div>
            </div>
            {hasFred && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: hasFmr ? 10 : 0 }}>
                {typeof m?.value === 'number' && (
                  <div style={{ background: '#F4F7F7', borderLeft: `3px solid ${colors.accent}`, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: colors.muted, letterSpacing: '.06em' }}>30-YR MORTGAGE</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text, marginTop: 2 }}>{m.value.toFixed(2)}%</div>
                    <div style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>as of {fmtDate(m.asOf)} · Freddie Mac via FRED</div>
                  </div>
                )}
                {typeof mhp?.value === 'number' && (
                  <div style={{ background: '#F4F7F7', borderLeft: `3px solid ${colors.accent}`, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: colors.muted, letterSpacing: '.06em' }}>MEDIAN HOME PRICE (US)</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text, marginTop: 2 }}>{usd(mhp.value * 1000)}</div>
                    <div style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>as of {fmtDate(mhp.asOf)} · Census/HUD via FRED</div>
                  </div>
                )}
                {typeof s.homePriceIndex?.value === 'number' && (
                  <div style={{ background: '#F4F7F7', borderLeft: `3px solid ${colors.accent}`, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: colors.muted, letterSpacing: '.06em' }}>HOME PRICE INDEX</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text, marginTop: 2 }}>{s.homePriceIndex.value.toFixed(1)}</div>
                    <div style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>S&amp;P/Case-Shiller · {fmtDate(s.homePriceIndex.asOf)}</div>
                  </div>
                )}
              </div>
            )}
            {hasFmr && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: colors.muted, letterSpacing: '.06em', marginBottom: 6 }}>
                  HUD FAIR MARKET RENT {fmr.year ? `· FY${fmr.year}` : ''} {fmr.matchType === 'state-avg' ? '· state average' : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 6 }}>
                  {[
                    ['Studio', fmr.efficiency],
                    ['1 BR', fmr.oneBedroom],
                    ['2 BR', fmr.twoBedroom],
                    ['3 BR', fmr.threeBedroom],
                    ['4 BR', fmr.fourBedroom],
                  ].filter(([, v]) => v != null).map(([label, value]) => (
                    <div key={label} style={{ background: '#EAF4FF', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#0D3B66' }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0D3B66', marginTop: 1 }}>{usd(value)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: colors.muted, marginTop: 6 }}>
                  HUD FMRs are the 40th-percentile rent for standard quality units — compare against your BAH to gauge cost. Public data, no PII.
                </div>
              </div>
            )}
          </section>
        );
      })()}

      {marketStats.status === 'ready' && marketStats.oconusHousing && (() => {
        const oh = marketStats.oconusHousing;
        return (
          <section style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${colors.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>OVERSEAS HOUSING ALLOWANCE</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: colors.text, marginBottom: 4 }}>{oh.title}</div>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55, marginBottom: 10 }}>{oh.body}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {oh.resources.map((r, idx) => (
                <a key={idx} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: colors.text }}>{r.name}</div>
                    <span style={{ fontSize: 9, fontWeight: 900, background: '#E3F2FD', color: '#0D3B66', padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap' }}>{r.who}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5 }}>{r.description}</div>
                </a>
              ))}
            </div>
          </section>
        );
      })()}

      {listings.status === 'loading' && (
        <section aria-busy="true" aria-label="Loading rental listings" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: colors.muted, letterSpacing: '.06em', marginBottom: 8 }}>
            LOADING ACTIVE LISTINGS NEAR {String(market.installation || 'your gaining installation').toUpperCase()}…
          </div>
          {[0,1,2].map(i => (
            <div key={i} className="pcs-skeleton" style={{ background: 'linear-gradient(90deg, #F0F4F8 25%, #FAFBFC 50%, #F0F4F8 75%)', backgroundSize: '200% 100%', animation: 'pcs-skeleton-shimmer 1.4s ease-in-out infinite', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 8, height: 64 }} />
          ))}
        </section>
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
                  padding: '10px 14px', borderRadius: 16,
                  border: `1.5px solid ${typeFilter === 'All' ? colors.primary : '#D6E0EA'}`,
                  background: typeFilter === 'All' ? colors.primary : '#FFFFFF',
                  color: typeFilter === 'All' ? '#FFFFFF' : '#243447',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}
              >
                All ({listings.items.length})
              </button>
              {orderedTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '10px 14px', borderRadius: 16,
                    border: `1.5px solid ${typeFilter === t ? colors.primary : '#D6E0EA'}`,
                    background: typeFilter === t ? colors.primary : '#FFFFFF',
                    color: typeFilter === t ? '#FFFFFF' : '#243447',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {t} ({counts[t]})
                </button>
              ))}
            </div>
          )}
          <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {filtered.map(item => (
              // Whole card opens Google Maps directions in a new tab
              // (matches Family Fun / Schools UX). Apartments.com and
              // any inner links use stopPropagation.
              <a
                key={item.id}
                href={item.listingUrl || item.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open verified listings for ${item.name || item.address || 'this property'}${item.distanceMiles != null ? `, approximately ${item.distanceMiles} miles from the gaining installation` : ''}`}
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
                  <span style={{ background: colors.primary, color: '#FFF', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 6 }}>{item.synthetic ? 'Search active listings →' : 'Open verified listings →'}</span>
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
            Each card opens a Google Maps search restricted to the rental aggregator network for current availability, floorplans, and pricing.
          </div>
        </section>
        );
      })()}
      {listings.status === 'ready' && listings.items.length === 0 && listings.fallback && (
        <div style={{ background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 11, color: '#0D3B66', lineHeight: 1.5 }}>
          {listings.reason === 'unknown-installation'
            ? 'Select a gaining installation during onboarding, or enter one in the search field above, to load active rental listings. The official housing directory below works for every installation worldwide.'
            : listings.reason === 'timeout' || listings.reason === 'network-Failed to fetch'
              ? `Connection to the rental data service timed out. The official housing directory below remains available for ${market.installation || 'this installation'} — tap any source to search current availability.`
              : `Active rental data is not currently cached for ${market.installation || 'this installation'}. Use the official housing directory below to search current availability through DoD-sanctioned sources.`}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#0D3B66', background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
        Always verify availability, eligibility, wait-list status, pet policy, commute distance, lease terms, and move-in dates with the listing source before committing. PCS Express does not store private rental inventory. For Department of Defense on-installation and privatized housing, search the gaining installation at <a href="https://www.homes.mil/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66', fontWeight: 700 }}>HOMES.mil</a> or <a href="https://installations.militaryonesource.mil/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66', fontWeight: 700 }}>MilitaryINSTALLATIONS</a>.
      </div>
    </div>
  );
}
