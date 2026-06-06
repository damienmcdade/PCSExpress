/*
 * Veteran-owned business discovery tab, extracted from App.jsx into its own
 * lazy() chunk (perf Tier 1b PR-C). Shared official-source helpers come from
 * ../lib/installationSources. Verbatim move.
 */
import { useState, useEffect } from 'react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import TabBar from './TabBar';
import { apiUrl, fetchWithTimeout } from '../config/apiConfig';
import { resolveMarket } from '../data/installationMarkets';
import { getInstallationSearchLocation, veteranBusinessBubbleLinks, veteranBusinessDiscoveryCards } from '../lib/installationSources';

function VeteranBusinessesTab({ theme, profile }) {
  const [filter, setFilter] = useState('All');
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const searchLocation = getInstallationSearchLocation(instName);
  const bubbleLinks = veteranBusinessBubbleLinks(instName).filter(link => link.url);
  const discoveryCards = veteranBusinessDiscoveryCards(instName);
  const displayBiz = discoveryCards.filter(card => card.url);
  const filtered = filter === 'All' ? displayBiz : displayBiz.filter(b => b.category === filter);
  const visibleCards = filtered.length ? filtered : displayBiz;

  // Live veteran-owned business lookup (SAM.gov via backend proxy).
  // The endpoint returns { businesses, fallback, reason } and never
  // throws an error status the user sees - empty businesses + fallback
  // means "show the existing static source-link cards below."
  const liveMarket = resolveMarket(profile);
  const [liveBiz, setLiveBiz] = useState({ status: 'idle', businesses: [], fallback: false, reason: '' });
  // 'all' | 'business' | 'service' - splits SAM.gov entities by primary
  // NAICS classification returned from the backend.
  const [industryFilter, setIndustryFilter] = useState('all');
  // Sub-tab inside the Veterans category: live SAM.gov listings vs
  // the SBA/VA static resource cards. User explicitly asked to keep
  // these split.
  const [vetTab, setVetTab] = useState('listings');
  const [vetRefreshNonce, setVetRefreshNonce] = useState(0);
  useEffect(() => {
    if (!liveMarket.matched || (!liveMarket.city && !liveMarket.zip)) {
      setLiveBiz({ status: 'no-market', businesses: [], fallback: true, reason: 'unknown-installation' });
      return;
    }
    let cancelled = false;
    setLiveBiz(s => ({ ...s, status: 'loading' }));
    const params = new URLSearchParams();
    if (liveMarket.city) params.set('city', liveMarket.city);
    if (liveMarket.state) params.set('state', liveMarket.state);
    if (liveMarket.zip) params.set('zip', liveMarket.zip);
    fetchWithTimeout(apiUrl(`/api/vet-businesses?${params.toString()}`), { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : { businesses: [], fallback: true, reason: `http-${r.status}` })
      .then(data => {
        if (cancelled) return;
        setLiveBiz({
          status: 'ready',
          businesses: Array.isArray(data?.businesses) ? data.businesses : [],
          fallback: !!data?.fallback,
          reason: data?.reason || '',
        });
      })
      .catch(err => {
        if (cancelled) return;
        setLiveBiz({ status: 'ready', businesses: [], fallback: true, reason: `network-${err?.message || 'error'}` });
      });
    return () => { cancelled = true; };
    // vetRefreshNonce is bumped by pull-to-refresh; including it in
    // the deps re-runs the existing fetch untouched.
  }, [liveMarket.city, liveMarket.state, liveMarket.zip, liveMarket.matched, vetRefreshNonce]);

  const { indicator: vetRefreshIndicator } = usePullToRefresh(async () => {
    setVetRefreshNonce(n => n + 1);
    await new Promise(r => setTimeout(r, 1200));
  });

  const NATIONAL_DIRS = [
    { name: 'SBA Veteran-Owned Businesses', icon: 'SBA', desc: 'Official SBA veteran entrepreneurship, training, funding, and contracting guidance.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses' },
    { name: 'VetCert Small Business Search', icon: 'VOSB', desc: 'Official SBA certification portal and search for verified VOSB and SDVOSB firms.', url: 'https://veterans.certify.sba.gov/' },
    { name: 'Veterans Business Outreach Centers', icon: 'VBOC', desc: 'Official SBA VBOC locator for free entrepreneurship counseling and training.', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program' },
    { name: 'VA OSDBU', icon: 'VA', desc: 'Official VA small and veteran business program information.', url: 'https://www.va.gov/osdbu/index.asp' },
    { name: 'SAM.gov Entity Information', icon: 'SAM', desc: 'Official federal entity search and public registration information.', url: 'https://sam.gov/entity-information' },
  ];

  return (
    <div style={{ padding: 16 }}>
      {vetRefreshIndicator}
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Veteran Owned & Veteran Operated Businesses</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 12 }}>
        {instName ? <>Veteran-owned business discovery near <strong>{searchLocation}</strong></> : 'Complete onboarding to tailor veteran-owned business discovery to your installation.'}
      </div>

      {/* Active Listings / SBA Resources sub-tabs */}
      <TabBar ariaLabel="Veteran business sections" className="pcs-tabbar--flush">
        {[
          { id: 'listings', label: 'Active Listings' },
          { id: 'resources', label: 'SBA Resources' },
        ].map(t => {
          const isActive = vetTab === t.id;
          return (
            <button
              key={t.id}
              id={`vet-tab-${t.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`vet-panel-${t.id}`}
              data-active={isActive || undefined}
              onClick={() => setVetTab(t.id)}
              className={`pcs-tab ${isActive ? 'is-active' : ''}`}
              style={{
                padding: '8px 16px', borderRadius: 20,
                border: `1.5px solid ${isActive ? theme.primary : '#D6E0EA'}`,
                background: isActive ? theme.primary : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#243447',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </TabBar>

      {vetTab === 'resources' && (<div role="tabpanel" id="vet-panel-resources" aria-labelledby="vet-tab-resources">
      {/* National directory quick links */}
      <div style={{ background: theme.secondary, borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 10, letterSpacing: '.08em' }}>NATIONAL DIRECTORIES & RESOURCES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {NATIONAL_DIRS.map((d, i) => (
            <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FFF', lineHeight: 1.3 }}>{d.name}</div>
            </a>
          ))}
        </div>
      </div>

      </div>)}

      {vetTab === 'listings' && (<div role="tabpanel" id="vet-panel-listings" aria-labelledby="vet-tab-listings">
      {/* Live veteran-owned business listings (SAM.gov proxy) */}
      {liveBiz.status === 'loading' && (
        <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: '#56697C' }}>
          Looking up verified veteran-owned businesses near {searchLocation || 'your gaining installation'}...
        </div>
      )}
      {liveBiz.status === 'ready' && liveBiz.businesses.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em' }}>
            VETERAN-OWNED BUSINESSES NEAR {searchLocation?.toUpperCase() || 'YOUR INSTALLATION'} ({liveBiz.businesses.length})
          </div>
          {/* Industry filter: All / Business (goods) / Service. The
              backend tags each entity from its primary NAICS code. */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${liveBiz.businesses.length})` },
              { id: 'business', label: `Business · Goods (${liveBiz.businesses.filter(b => b.industry === 'business').length})` },
              { id: 'service', label: `Service (${liveBiz.businesses.filter(b => b.industry === 'service').length})` },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setIndustryFilter(opt.id)}
                className={`pcs-chip ${industryFilter === opt.id ? 'is-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: 18,
                  border: `1.5px solid ${industryFilter === opt.id ? theme.primary : '#D6E0EA'}`,
                  background: industryFilter === opt.id ? theme.primary : '#FFFFFF',
                  color: industryFilter === opt.id ? '#FFFFFF' : '#243447',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div data-dynamic-card="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {liveBiz.businesses.filter(b => industryFilter === 'all' || b.industry === industryFilter).map(biz => (
              <a
                key={biz.id}
                href={biz.samUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block' }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{biz.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  <span style={{ background: biz.industry === 'service' ? '#E0F2FE' : '#ECFDF5', color: biz.industry === 'service' ? '#075985' : '#065F46', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {biz.industry === 'service' ? 'Service' : 'Business'}
                  </span>
                  {biz.businessTypes?.slice(0, 2).map((bt, i) => (
                    <span key={i} style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{bt}</span>
                  ))}
                </div>
                {biz.naicsDesc && (
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.4, marginBottom: 4 }}>{biz.naicsDesc}</div>
                )}
                {(biz.address || biz.city) && (
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45, marginBottom: 4 }}>
                    {[biz.address, [biz.city, biz.state, biz.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                  </div>
                )}
                {biz.phone && <div style={{ fontSize: 11, color: '#56697C', marginBottom: 6 }}>{biz.phone}</div>}
                <span className="card-cta" style={{ '--cta-color': theme.primary, marginTop: 8, fontSize: 10 }}>View on SAM.gov</span>
              </a>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5, marginTop: 8 }}>
            Listings are pulled from the federal SAM.gov directory and filtered for veteran-owned and service-disabled veteran-owned businesses. Confirm a business is still active on SAM.gov before any contract or purchase.
          </div>
        </section>
      )}
      {liveBiz.status === 'ready' && liveBiz.businesses.length === 0 && liveBiz.fallback && (() => {
        // No live SAM.gov results. Instead of an empty banner, show a
        // grid of search-CTA cards that DO populate without an API
        // key - each card deep-links to a real veteran-owned business
        // directory pre-filtered by the gaining installation's city.
        const loc = encodeURIComponent(searchLocation || 'United States');
        const ctaCards = [
          { name: `Verified veteran-owned businesses near ${searchLocation || 'your installation'}`, url: `https://veterans.certify.sba.gov/?Keywords=&Location=${loc}`, type: 'SBA VetCert', desc: 'Search the official SBA VetCert registry for verified VOSB and SDVOSB firms in your area.' },
          { name: `SAM.gov entities near ${searchLocation || 'your installation'}`, url: `https://sam.gov/search/?index=ei&page=1&pageSize=25&sort=-modifiedDate&q=${loc}&sfm[entity-information][isCalculated]=true`, type: 'SAM.gov', desc: 'Search active federal SAM.gov entity records by location. Filter for veteran-owned business types after opening.' },
          { name: `Veteran-owned businesses on Google`, url: `https://www.google.com/search?q=${encodeURIComponent(`veteran owned businesses near ${searchLocation || 'me'} site:sba.gov OR site:sam.gov OR site:va.gov`)}`, type: 'Google', desc: 'Google search restricted to SBA, SAM, and VA sources for veteran-owned businesses in the area.' },
          { name: 'Veterans Business Outreach Centers near you', url: `https://www.google.com/search?q=${encodeURIComponent(`VBOC ${searchLocation || ''} site:sba.gov`)}`, type: 'VBOC', desc: 'Find your local VBOC for free veteran entrepreneurship counseling, training, and referrals.' },
          { name: 'VA OSDBU resources', url: 'https://www.va.gov/osdbu/', type: 'VA', desc: 'Official VA Office of Small and Disadvantaged Business Utilization - veteran-owned business assistance.' },
        ];
        return (
          <section style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Search verified veteran-owned businesses
            </div>
            <div data-dynamic-card="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {ctaCards.map(c => (
                <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block' }}>
                  <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>{c.type}</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginTop: 6, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.4 }}>{c.desc}</div>
                  <span className="card-cta" style={{ '--cta-color': theme.primary, marginTop: 8 }}>Open search</span>
                </a>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5, marginTop: 8 }}>
              These deep-link directly into the official SBA VetCert, SAM.gov, and VA OSDBU search interfaces with your gaining installation pre-filled. Verify each business's certification status before contracting.
            </div>
          </section>
        );
      })()}

      </div>)}

      {vetTab === 'resources' && (<>
      {/* Active category link bubbles */}
      {bubbleLinks.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', marginBottom: 8, letterSpacing: '.06em' }}>ACTIVE CATEGORY LINKS</div>
          <TabBar ariaLabel="Veteran resources" className="pcs-tabbar--flush">
            {bubbleLinks.map(bubble => {
              const isActive = filter === bubble.category;
              return (
              <a
                key={bubble.category}
                role="tab"
                aria-selected={isActive}
                data-active={isActive || undefined}
                href={bubble.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setFilter(bubble.category)}
                aria-label={`Open ${bubble.label}`}
                style={{
                  flexShrink: 0,
                  minWidth: 136,
                  maxWidth: 210,
                  padding: '9px 12px',
                  borderRadius: 16,
                  border: `1.5px solid ${isActive ? theme.primary : '#D6E0EA'}`,
                  background: isActive ? theme.primary : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#243447',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 800,
                  whiteSpace: 'normal',
                  lineHeight: 1.25,
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 6px 14px rgba(0,0,0,0.14)' : 'none',
                }}
              >
                <span style={{ display: 'block', marginBottom: 4 }}>{bubble.label}</span>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, opacity: 0.82 }}>Open active source</span>
              </a>
              );
            })}
          </TabBar>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45 }}>
            Each bubble opens an official SBA, VA, or SAM.gov resource. The Search, Food, and Home Services cards now use the same verified-source pattern as the SBA and VA cards.
          </div>
        </div>
      )}

      {visibleCards.map((biz, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{biz.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{biz.name}</div>
              <span style={{ background: '#F3F4F6', color: '#56697C', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{biz.category}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{biz.desc}</div>
          <a href={biz.url} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>
            Open Source
          </a>
        </div>
      ))}
      </>)}
    </div>
  );
}

export default VeteranBusinessesTab;
