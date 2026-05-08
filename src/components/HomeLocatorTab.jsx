/*
 * Purpose: Official public military housing locator for the gaining installation with interactive housing profile bubbles and VA loan checklist support.
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

const BRANCH_HOUSING_SOURCES = {
  Army: { name: 'Army Housing / MilitaryINSTALLATIONS', url: 'https://installations.militaryonesource.mil/' },
  Navy: { name: 'Navy Housing', url: 'https://ffr.cnic.navy.mil/Navy-Housing/' },
  'Marine Corps': { name: 'Marine Corps Housing / MilitaryINSTALLATIONS', url: 'https://installations.militaryonesource.mil/' },
  'Air Force': { name: 'Department of the Air Force Housing', url: 'https://www.housing.af.mil/' },
  'Space Force': { name: 'Department of the Air Force Housing', url: 'https://www.housing.af.mil/' },
  'Coast Guard': { name: 'Coast Guard Housing Program', url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources-CG-1/Health-Safety-and-Work-Life-CG-11/Office-of-Work-Life-CG-111/Housing-Program/' },
};

const OFFICIAL_SOURCES = [
  { name: 'HOMES.mil / HEAT', url: 'https://www.homes.mil/homes/DispatchServlet/HomesEntry', note: 'Official DoD housing entry point and Housing Early Assistance Tool.' },
  { name: 'MilitaryINSTALLATIONS Housing', url: 'https://installations.militaryonesource.mil/', note: 'Official public installation housing and support information.' },
];

const HOUSING_PROFILES = {
  Army: [
    { type: 'Single Family Home', beds: '2-5', baths: '1.5-3', sqft: '1,050-2,400', proximity: 'On or near post', note: 'Common family housing profile shown on official installation housing pages.' },
    { type: 'Townhome', beds: '2-4', baths: '1.5-2.5', sqft: '950-1,900', proximity: 'On post or adjoining communities', note: 'Often used for junior and mid-grade family housing where inventory exists.' },
    { type: 'Apartment or Duplex', beds: '1-3', baths: '1-2', sqft: '650-1,450', proximity: 'Near housing office or surrounding community', note: 'Used for smaller households, waiting-list options, or community housing searches.' },
    { type: 'Unaccompanied Housing', beds: 'Studio-1', baths: 'Shared or private', sqft: 'Varies by installation', proximity: 'On post', note: 'Availability and eligibility are managed by the local housing office.' },
  ],
  Navy: [
    { type: 'Townhome', beds: '2-4', baths: '1.5-2.5', sqft: '950-1,950', proximity: 'On or near installation', note: 'Navy Housing Service Centers help match priorities to available local options.' },
    { type: 'Apartment or Flat', beds: '1-3', baths: '1-2', sqft: '650-1,500', proximity: 'Near fleet concentration areas', note: 'Common for community housing, overseas locations, and unaccompanied personnel.' },
    { type: 'Single Family Home', beds: '3-5', baths: '2-3', sqft: '1,300-2,500', proximity: 'Installation housing area or nearby community', note: 'Availability depends on grade, family composition, and local inventory.' },
    { type: 'Unaccompanied Housing', beds: 'Studio-1', baths: 'Shared or private', sqft: 'Varies by installation', proximity: 'On installation', note: 'Navy UH supports single and unaccompanied Sailors where available.' },
  ],
  'Marine Corps': [
    { type: 'Single Family Home', beds: '2-5', baths: '1.5-3', sqft: '1,100-2,500', proximity: 'On or near base', note: 'Common family housing profile near Marine Corps installations.' },
    { type: 'Townhome', beds: '2-4', baths: '1.5-2.5', sqft: '950-1,900', proximity: 'Base housing area or local community', note: 'Often available through installation housing offices or public-private housing partners.' },
    { type: 'Apartment or Duplex', beds: '1-3', baths: '1-2', sqft: '650-1,450', proximity: 'Near base gates or local communities', note: 'Useful for smaller households or community housing planning.' },
    { type: 'Bachelor / Unaccompanied Housing', beds: 'Studio-1', baths: 'Shared or private', sqft: 'Varies by installation', proximity: 'On base', note: 'Managed locally for eligible Marines.' },
  ],
  'Air Force': [
    { type: 'Single Family Home', beds: '2-5', baths: '1.5-3', sqft: '1,100-2,500', proximity: 'On or near base', note: 'Department of the Air Force housing pages show family, unaccompanied, and community housing options.' },
    { type: 'Townhome', beds: '2-4', baths: '1.5-2.5', sqft: '950-1,900', proximity: 'Base housing area or nearby community', note: 'Common at many installations depending on current inventory.' },
    { type: 'Apartment or Tower Unit', beds: '1-4', baths: '1-2', sqft: '700-1,800', proximity: 'Often on base overseas or in nearby communities', note: 'Some official overseas pages list apartment-style tower units.' },
    { type: 'Unaccompanied Housing', beds: 'Studio-1', baths: 'Shared or private', sqft: 'Varies by installation', proximity: 'On base', note: 'Managed through the Military Housing Office.' },
  ],
  'Space Force': [
    { type: 'Single Family Home', beds: '2-5', baths: '1.5-3', sqft: '1,100-2,500', proximity: 'On or near installation', note: 'Guardians use Department of the Air Force housing channels at supported installations.' },
    { type: 'Townhome', beds: '2-4', baths: '1.5-2.5', sqft: '950-1,900', proximity: 'Installation housing area or local community', note: 'Availability is confirmed through the servicing housing office.' },
    { type: 'Apartment or Flat', beds: '1-3', baths: '1-2', sqft: '650-1,450', proximity: 'Near installation or local community', note: 'Useful for community housing planning near Space Force assignments.' },
    { type: 'Unaccompanied Housing', beds: 'Studio-1', baths: 'Shared or private', sqft: 'Varies by installation', proximity: 'On installation', note: 'Managed by the servicing housing office.' },
  ],
  'Coast Guard': [
    { type: 'Single Family Home', beds: '2-4', baths: '1.5-2.5', sqft: '1,000-2,100', proximity: 'Near unit or station', note: 'Coast Guard housing availability varies heavily by assignment location.' },
    { type: 'Townhome', beds: '2-4', baths: '1.5-2.5', sqft: '900-1,800', proximity: 'Near base or local community', note: 'Often considered where local housing is constrained.' },
    { type: 'Apartment or Duplex', beds: '1-3', baths: '1-2', sqft: '600-1,400', proximity: 'Near station or sector', note: 'Common for smaller households and high-cost areas.' },
    { type: 'Unaccompanied Housing', beds: 'Studio-1', baths: 'Shared or private', sqft: 'Varies by unit', proximity: 'At or near unit', note: 'Eligibility and availability are confirmed locally.' },
  ],
};

const VA_STEPS = [
  'Confirm eligibility for a VA-backed home loan or VA direct loan through VA.gov.',
  'Request a Certificate of Eligibility, or ask a lender to request it through VA systems.',
  'Compare at least three lenders using the same loan type, price point, and estimated closing date.',
  'Ask each lender for the VA funding fee estimate, interest rate, APR, lender credits, and closing costs.',
  'Get preapproval before making offers near the gaining installation.',
  'Confirm the home meets VA occupancy, appraisal, property condition, and loan requirements.',
  'Review the closing disclosure before signing and keep copies outside the app.',
];

const LENDERS = [
  { name: 'VA Home Loan Overview', url: 'https://www.va.gov/housing-assistance/home-loans/', note: 'Official VA overview for VA-backed and VA direct home loan benefits.' },
  { name: 'VA Home Buying Process', url: 'https://www.va.gov/housing-assistance/home-loans/home-buying-process', note: 'Step-by-step VA guidance for buying with a VA-backed loan.' },
  { name: 'VA Lender Resources', url: 'https://www.benefits.va.gov/homeloans/lenders.asp', note: 'Official VA lender resources and program information. This is not a private lender endorsement.' },
  { name: 'CFPB Mortgage Tools', url: 'https://www.consumerfinance.gov/owning-a-home/', note: 'Official federal tools for comparing mortgage costs and loan estimates.' },
];

function getMarket(profile, manual) {
  const manualText = manual.trim();
  if (manualText) return { label: manualText, query: manualText };
  const install = (profile?.gainingInstallation || '').split(',')[0].trim();
  const known = INSTALLATION_MARKETS[install];
  if (known) return { label: `${install} - ${known.city}, ${known.state}`, query: `${install} ${known.city} ${known.state} ${known.zip}` };
  return { label: install || 'Enter gaining installation, address, city, or ZIP', query: install || '' };
}

function officialSearchUrl() {
  return 'https://installations.militaryonesource.mil/';
}

export default function HomeLocatorTab({ theme, profile }) {
  const [manual, setManual] = useState('');
  const [selected, setSelected] = useState(0);
  const [vaDone, setVaDone] = useState(() => new Set(JSON.parse(localStorage.getItem('pcs_va_loan_steps') || '[]')));
  const market = useMemo(() => getMarket(profile, manual), [profile, manual]);
  const branch = profile?.branch || 'Army';
  const branchSource = BRANCH_HOUSING_SOURCES[branch] || BRANCH_HOUSING_SOURCES.Army;
  const profiles = HOUSING_PROFILES[branch] || HOUSING_PROFILES.Army;
  const activeProfile = profiles[selected] || profiles[0];

  const toggleVa = index => {
    setVaDone(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      localStorage.setItem('pcs_va_loan_steps', JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>OFFICIAL HOUSING LOOKUP</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>{market.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.76)', lineHeight: 1.6 }}>
          Housing profiles are tailored to the branch selected during onboarding and linked to official public military housing sources. Verify real-time availability, eligibility, wait lists, pet rules, and lease terms directly with the installation housing office.
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: '#56697C', letterSpacing: '.08em' }}>MANUAL LOCATION</label>
        <input value={manual} onChange={e => { setManual(e.target.value); setSelected(0); }} placeholder="Base, address, city, or ZIP if not found locally" style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: 13 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 14 }}>
        {profiles.map((item, index) => {
          const active = index === selected;
          return (
            <button key={item.type} onClick={() => setSelected(index)} style={{ textAlign: 'left', background: active ? `${theme.primary}12` : '#FFF', border: `1.5px solid ${active ? theme.primary : '#E0E6EE'}`, borderRadius: 999, padding: '12px 14px', cursor: 'pointer', boxShadow: active ? '0 10px 22px rgba(20,45,72,0.12)' : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: active ? theme.primary : '#0D1821', marginBottom: 3 }}>{item.type}</div>
              <div style={{ fontSize: 10, color: '#56697C' }}>{item.beds} beds · {item.baths} baths</div>
            </button>
          );
        })}
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.14em', marginBottom: 6 }}>SELECTED HOUSING PROFILE</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#0D1821', marginBottom: 12 }}>{activeProfile.type}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
          {[
            ['Beds', activeProfile.beds],
            ['Bathrooms', activeProfile.baths],
            ['Approx. Sq. Ft.', activeProfile.sqft],
            ['Proximity', activeProfile.proximity],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#F8FAFC', border: '1px solid #E6EDF3', borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#6B7280', letterSpacing: '.1em' }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1F2937', marginTop: 3 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.6 }}>{activeProfile.note}</div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821', marginBottom: 8 }}>Official housing action cards</div>
        {[
          { name: 'Current DoD Housing Search', desc: 'Open HOMES.mil / HEAT for official current housing availability and housing office support.', url: 'https://www.homes.mil/homes/DispatchServlet/HomesEntry' },
          { name: 'Installation Housing Office', desc: `Open MilitaryINSTALLATIONS for ${market.label} housing office contacts, programs, and local guidance.`, url: 'https://installations.militaryonesource.mil/' },
          { name: branchSource.name, desc: 'Open the branch housing source tied to the branch selected during onboarding.', url: branchSource.url },
        ].filter(card => card.url).map(card => (
          <a key={card.name} href={card.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', border: '1px solid #E6EDF3', borderLeft: `4px solid ${theme.primary}`, borderRadius: 10, padding: 12, marginTop: 8, background: '#F8FAFC' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821' }}>{card.name}</div>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginTop: 3 }}>{card.desc}</div>
          </a>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#0D3B66', background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, marginBottom: 12, lineHeight: 1.5 }}>
        Official public housing pages do not provide one universal live listing feed. PCS Express shows branch-specific housing profiles and sends users to official public military housing systems for current availability.
      </div>

      {[branchSource, ...OFFICIAL_SOURCES, { name: 'Official Public Web Cross-Check', url: officialSearchUrl(market.query, branch), note: 'Searches public official .mil, Military OneSource, and HOMES.mil pages for the selected location.' }].map((source) => (
        <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{source.name}</div>
              <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginTop: 3 }}>{source.note}</div>
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
            <a href={lender.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 900, color: theme.primary }}>Open official guidance →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
