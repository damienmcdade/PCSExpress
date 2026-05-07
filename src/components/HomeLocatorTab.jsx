/*
 * Purpose: Gaining-installation home locator using public Zillow, Redfin, Homes.mil, and Google lookup paths with VA loan checklist support.
 * Third-party dependencies: React.
 */

import { useMemo, useState } from 'react';

const INSTALLATION_MARKETS = {
  'Fort Liberty': { city: 'Fayetteville', state: 'NC', zip: '28310' },
  'Fort Cavazos': { city: 'Killeen', state: 'TX', zip: '76544' },
  'Fort Campbell': { city: 'Clarksville', state: 'TN', zip: '37042' },
  'Fort Carson': { city: 'Colorado Springs', state: 'CO', zip: '80913' },
  'Fort Drum': { city: 'Watertown', state: 'NY', zip: '13602' },
  'Fort Eisenhower': { city: 'Augusta', state: 'GA', zip: '30905' },
  'Fort Hood': { city: 'Killeen', state: 'TX', zip: '76544' },
  'Fort Jackson': { city: 'Columbia', state: 'SC', zip: '29207' },
  'Fort Leonard Wood': { city: 'Waynesville', state: 'MO', zip: '65583' },
  'Fort Moore': { city: 'Columbus', state: 'GA', zip: '31905' },
  'Fort Riley': { city: 'Junction City', state: 'KS', zip: '66442' },
  'Fort Stewart': { city: 'Hinesville', state: 'GA', zip: '31314' },
  'Joint Base Lewis-McChord': { city: 'Tacoma', state: 'WA', zip: '98433' },
  'Camp Humphreys': { city: 'Pyeongtaek', state: 'South Korea', zip: '17977' },
  'Naval Station Norfolk': { city: 'Norfolk', state: 'VA', zip: '23511' },
  'Naval Base San Diego': { city: 'San Diego', state: 'CA', zip: '92136' },
  'Joint Base San Antonio': { city: 'San Antonio', state: 'TX', zip: '78234' },
  'Joint Base Langley-Eustis': { city: 'Hampton', state: 'VA', zip: '23665' },
  'Wright-Patterson AFB': { city: 'Dayton', state: 'OH', zip: '45433' },
  'Travis AFB': { city: 'Fairfield', state: 'CA', zip: '94535' },
  'Nellis AFB': { city: 'Las Vegas', state: 'NV', zip: '89191' },
  'Eglin AFB': { city: 'Niceville', state: 'FL', zip: '32542' },
  'MacDill AFB': { city: 'Tampa', state: 'FL', zip: '33621' },
  'Peterson SFB': { city: 'Colorado Springs', state: 'CO', zip: '80914' },
  'Schriever SFB': { city: 'Colorado Springs', state: 'CO', zip: '80912' },
  'Camp Pendleton': { city: 'Oceanside', state: 'CA', zip: '92055' },
  'MCAS Miramar': { city: 'San Diego', state: 'CA', zip: '92145' },
  'Coast Guard Base Alameda': { city: 'Alameda', state: 'CA', zip: '94501' },
};

const TYPE_KEYWORDS = {
  'Single Family': 'single family house',
  'Condo': 'condo',
  'Apartment': 'apartment',
  'Townhouse': 'townhouse',
};

const LANDLORD_KEYWORDS = {
  'Private Landlord': 'private landlord for rent by owner',
  'Corporate Landlord': 'property management apartments',
  'Government Housing': 'military housing office privatized housing Homes.mil',
};

const VA_STEPS = [
  'Confirm eligibility for a VA-backed home loan or VA direct loan through VA.gov.',
  'Request a Certificate of Eligibility (COE), or ask a lender to request it through VA systems.',
  'Compare at least three lenders using the same loan type, price point, and estimated closing date.',
  'Ask each lender for the VA funding fee estimate, interest rate, APR, lender credits, and closing costs.',
  'Get preapproval before making offers near the gaining installation.',
  'Confirm the home meets VA occupancy, appraisal, property condition, and loan requirements.',
  'Review the closing disclosure before signing and keep copies outside the app.',
];

const LENDERS = [
  { name: 'Veterans United Home Loans', note: 'VA-specialized lender. Verify current community reviews before applying.' },
  { name: 'Navy Federal Credit Union', note: 'Military-focused credit union. Membership required; verify current rates and reviews.' },
  { name: 'USAA', note: 'Military-family financial institution. Compare VA loan fees and service ratings.' },
  { name: 'Rocket Mortgage', note: 'Large national lender. Compare VA terms against military-focused lenders.' },
  { name: 'PenFed Credit Union', note: 'Credit union option for military families. Verify membership, fees, and current reviews.' },
];

function getMarket(profile, manual) {
  const manualText = manual.trim();
  if (manualText) return { label: manualText, query: manualText };
  const install = (profile?.gainingInstallation || '').split(',')[0].trim();
  const known = INSTALLATION_MARKETS[install];
  if (known) return { label: `${install} - ${known.city}, ${known.state}`, query: `${known.city} ${known.state} ${known.zip}` };
  return { label: install || 'Enter gaining installation, address, city, or ZIP', query: install || '' };
}

function urlFor(source, query, type, landlord) {
  const q = encodeURIComponent([query, TYPE_KEYWORDS[type], LANDLORD_KEYWORDS[landlord]].filter(Boolean).join(' '));
  if (source === 'zillow-rent') return `https://www.zillow.com/homes/for_rent/${encodeURIComponent(query)}_rb/`;
  if (source === 'zillow-buy') return `https://www.zillow.com/homes/${encodeURIComponent(query)}_rb/`;
  if (source === 'redfin') return `https://www.redfin.com/stingray/do/location-autocomplete?location=${encodeURIComponent(query)}`;
  if (source === 'homesmil') return `https://www.homes.mil/homes/DispatchServlet/HomesEntry`;
  return `https://www.google.com/search?q=${q}`;
}

export default function HomeLocatorTab({ theme, profile }) {
  const [manual, setManual] = useState('');
  const [type, setType] = useState('Single Family');
  const [landlord, setLandlord] = useState('Private Landlord');
  const [mode, setMode] = useState('Rent');
  const [vaDone, setVaDone] = useState(() => new Set(JSON.parse(localStorage.getItem('pcs_va_loan_steps') || '[]')));
  const market = useMemo(() => getMarket(profile, manual), [profile, manual]);

  const toggleVa = index => {
    setVaDone(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      localStorage.setItem('pcs_va_loan_steps', JSON.stringify([...next]));
      return next;
    });
  };

  const sourceCards = [
    { id: 'zillow-rent', name: 'Zillow Rentals', desc: 'Open live rental listings and apply Zillow filters for price, beds, pet policy, and home type.' },
    { id: 'zillow-buy', name: 'Zillow Homes', desc: 'Open live for-sale results and refine by price, bedrooms, home type, and commute.' },
    { id: 'redfin', name: 'Redfin Search', desc: 'Use Redfin for city, ZIP, neighborhood, and address searches with listing filters.' },
    { id: 'homesmil', name: 'Homes.mil / Government Housing', desc: 'Official public military housing search path for privatized or government housing options.' },
    { id: 'google', name: 'Google Cross-Check', desc: 'Search the selected market, home type, and landlord category across public web results.' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>GAINING INSTALLATION HOUSING</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>{market.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.76)', lineHeight: 1.6 }}>
          Housing searches are tailored to the gaining installation from onboarding. If the base is missing, enter an address, base, city, or ZIP to create Zillow, Redfin, Homes.mil, and Google lookup paths.
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: '#56697C', letterSpacing: '.08em' }}>MANUAL LOCATION</label>
        <input value={manual} onChange={e => setManual(e.target.value)} placeholder="Base, address, city, or ZIP if not found locally" style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: 13 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#56697C', marginBottom: 8 }}>USE</div>
          {['Rent', 'Buy'].map(v => <button key={v} onClick={() => setMode(v)} style={{ marginRight: 6, marginBottom: 6, padding: '7px 10px', borderRadius: 999, border: `1.5px solid ${mode === v ? theme.primary : '#CBD5E1'}`, background: mode === v ? theme.primary : '#FFF', color: mode === v ? '#FFF' : '#34495E', fontSize: 11, fontWeight: 800 }}>{v}</button>)}
        </div>
        <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#56697C', marginBottom: 8 }}>LANDLORD</div>
          {Object.keys(LANDLORD_KEYWORDS).map(v => <button key={v} onClick={() => setLandlord(v)} style={{ marginRight: 6, marginBottom: 6, padding: '7px 10px', borderRadius: 999, border: `1.5px solid ${landlord === v ? '#6A4C1B' : '#CBD5E1'}`, background: landlord === v ? '#6A4C1B' : '#FFF', color: landlord === v ? '#FFF' : '#34495E', fontSize: 10, fontWeight: 800 }}>{v}</button>)}
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#56697C', marginBottom: 8 }}>HOME TYPE FILTER</div>
        {Object.keys(TYPE_KEYWORDS).map(v => <button key={v} onClick={() => setType(v)} style={{ marginRight: 6, marginBottom: 6, padding: '7px 10px', borderRadius: 999, border: `1.5px solid ${type === v ? theme.primary : '#CBD5E1'}`, background: type === v ? theme.primary : '#FFF', color: type === v ? '#FFF' : '#34495E', fontSize: 11, fontWeight: 800 }}>{v}</button>)}
      </div>

      <div style={{ fontSize: 11, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: 10, marginBottom: 12, lineHeight: 1.5 }}>
        Listings change constantly. PCS Express opens live public search sources rather than storing private listing data. Verify pricing, availability, commute, school district, pet policies, lease terms, and military clauses directly with the source or landlord.
      </div>

      {sourceCards.map(card => (
        <a key={card.id} href={urlFor(card.id, market.query, type, landlord)} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${card.id.includes('zillow') ? '#006AFF' : card.id === 'redfin' ? '#C82021' : card.id === 'homesmil' ? '#2E7D32' : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{card.name}</div>
              <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginTop: 3 }}>{card.desc}</div>
              <div style={{ marginTop: 8, fontSize: 10, color: '#7A4A00' }}>{mode} · {type} · {landlord}</div>
            </div>
            <div style={{ alignSelf: 'center', padding: '7px 10px', borderRadius: 9, background: theme.primary, color: '#FFF', fontSize: 11, fontWeight: 900 }}>Open</div>
          </div>
        </a>
      ))}

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>VA Home Loan checklist</div>
        <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 12 }}>Use this checklist to walk through the VA-backed home loan process. Official VA guidance says borrowers need a COE and must meet VA and lender credit, income, occupancy, and loan requirements.</div>
        {VA_STEPS.map((step, index) => (
          <button key={step} onClick={() => toggleVa(index)} style={{ width: '100%', display: 'flex', gap: 10, textAlign: 'left', background: '#FFF', border: 'none', borderTop: '1px solid #F1F5F9', padding: '10px 0', cursor: 'pointer' }}>
            <span style={{ width: 23, height: 23, borderRadius: 7, border: `2px solid ${vaDone.has(index) ? '#2E7D32' : '#CBD5E1'}`, background: vaDone.has(index) ? '#2E7D32' : '#FFF', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{vaDone.has(index) ? '✓' : ''}</span>
            <span style={{ fontSize: 11, color: '#34495E', lineHeight: 1.5 }}>{step}</span>
          </button>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <a href="https://www.va.gov/housing-assistance/home-loans/" target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, textAlign: 'center', padding: '9px', borderRadius: 9, background: '#0D47A1', color: '#FFF', textDecoration: 'none', fontSize: 11, fontWeight: 900 }}>VA Home Loans</a>
          <a href="https://www.va.gov/housing-assistance/home-loans/how-to-request-coe" target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, textAlign: 'center', padding: '9px', borderRadius: 9, background: '#1565C0', color: '#FFF', textDecoration: 'none', fontSize: 11, fontWeight: 900 }}>Request COE</a>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginTop: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821', marginBottom: 8 }}>VA lender research shortlist</div>
        <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 10 }}>Community ratings change frequently. Use these as starting points, then verify current reviews, NMLS licensing, rates, APR, fees, and closing costs before applying.</div>
        {LENDERS.map(lender => (
          <div key={lender.name} style={{ borderTop: '1px solid #F1F5F9', padding: '10px 0' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821' }}>{lender.name}</div>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{lender.note}</div>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(lender.name + ' VA loan community reviews NMLS')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 900, color: theme.primary }}>Check current community ratings →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
