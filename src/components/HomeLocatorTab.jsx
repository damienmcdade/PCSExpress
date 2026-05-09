/*
 * Purpose: Official public military housing locator for the gaining installation with installation-aware housing profiles and source links.
 * Third-party dependencies: React.
 */

import { useMemo, useState } from 'react';

const INSTALLATION_MARKETS = {
  'Aberdeen Proving Ground': { city: 'Aberdeen', state: 'MD', zip: '21005' },
  'Altus AFB': { city: 'Altus', state: 'OK', zip: '73523' },
  'Anniston Army Depot': { city: 'Anniston', state: 'AL', zip: '36201' },
  'Barksdale Air Force Base': { city: 'Bossier City', state: 'LA', zip: '71110' },
  'Barksdale AFB': { city: 'Bossier City', state: 'LA', zip: '71110' },
  'Camp Lejeune': { city: 'Jacksonville', state: 'NC', zip: '28547' },
  'Marine Corps Base Camp Lejeune': { city: 'Jacksonville', state: 'NC', zip: '28547' },
  'Camp Pendleton': { city: 'Oceanside', state: 'CA', zip: '92055' },
  'Camp Humphreys': { city: 'Pyeongtaek', state: 'South Korea', zip: '17977' },
  'Coast Guard Base Alameda': { city: 'Alameda', state: 'CA', zip: '94501' },
  'Davis-Monthan AFB': { city: 'Tucson', state: 'AZ', zip: '85707' },
  'Dyess AFB': { city: 'Abilene', state: 'TX', zip: '79607' },
  'Edwards AFB': { city: 'Edwards', state: 'CA', zip: '93524' },
  'Eglin AFB': { city: 'Niceville', state: 'FL', zip: '32542' },
  'Ellsworth Air Force Base': { city: 'Rapid City', state: 'SD', zip: '57706' },
  'Fairchild AFB': { city: 'Spokane', state: 'WA', zip: '99011' },
  'Fort Belvoir': { city: 'Fort Belvoir', state: 'VA', zip: '22060' },
  'Fort Bliss': { city: 'El Paso', state: 'TX', zip: '79916' },
  'Fort Bragg': { city: 'Fayetteville', state: 'NC', zip: '28310', alias: 'Fort Liberty' },
  'Fort Liberty': { city: 'Fayetteville', state: 'NC', zip: '28310' },
  'Fort Campbell': { city: 'Clarksville', state: 'TN', zip: '37042' },
  'Fort Carson': { city: 'Colorado Springs', state: 'CO', zip: '80913' },
  'Fort Cavazos': { city: 'Killeen', state: 'TX', zip: '76544' },
  'Fort Hood': { city: 'Killeen', state: 'TX', zip: '76544', alias: 'Fort Cavazos' },
  'Fort Drum': { city: 'Watertown', state: 'NY', zip: '13602' },
  'Fort Eisenhower': { city: 'Augusta', state: 'GA', zip: '30905' },
  'Fort Gordon': { city: 'Augusta', state: 'GA', zip: '30905', alias: 'Fort Eisenhower' },
  'Fort Gregg-Adams': { city: 'Petersburg', state: 'VA', zip: '23801' },
  'Fort Lee': { city: 'Petersburg', state: 'VA', zip: '23801', alias: 'Fort Gregg-Adams' },
  'Fort Huachuca': { city: 'Sierra Vista', state: 'AZ', zip: '85613' },
  'Fort Irwin': { city: 'Barstow', state: 'CA', zip: '92310' },
  'Fort Jackson': { city: 'Columbia', state: 'SC', zip: '29207' },
  'Fort Knox': { city: 'Fort Knox', state: 'KY', zip: '40121' },
  'Fort Leavenworth': { city: 'Leavenworth', state: 'KS', zip: '66027' },
  'Fort Leonard Wood': { city: 'Waynesville', state: 'MO', zip: '65583' },
  'Fort Meade': { city: 'Fort Meade', state: 'MD', zip: '20755' },
  'Fort Moore': { city: 'Columbus', state: 'GA', zip: '31905' },
  'Fort Novosel': { city: 'Daleville', state: 'AL', zip: '36322' },
  'Fort Rucker': { city: 'Daleville', state: 'AL', zip: '36322', alias: 'Fort Novosel' },
  'Fort Riley': { city: 'Junction City', state: 'KS', zip: '66442' },
  'Fort Sam Houston': { city: 'San Antonio', state: 'TX', zip: '78234' },
  'Fort Sill': { city: 'Lawton', state: 'OK', zip: '73503' },
  'Fort Stewart': { city: 'Hinesville', state: 'GA', zip: '31314' },
  'Goodfellow AFB': { city: 'San Angelo', state: 'TX', zip: '76908' },
  'Hill AFB': { city: 'Ogden', state: 'UT', zip: '84056' },
  'Hurlburt Field': { city: 'Mary Esther', state: 'FL', zip: '32544' },
  'Joint Base Andrews': { city: 'Camp Springs', state: 'MD', zip: '20762' },
  'Joint Base Charleston': { city: 'North Charleston', state: 'SC', zip: '29404' },
  'Joint Base Elmendorf-Richardson': { city: 'Anchorage', state: 'AK', zip: '99505' },
  'Joint Base Langley-Eustis': { city: 'Hampton', state: 'VA', zip: '23665' },
  'Joint Base Lewis-McChord': { city: 'Tacoma', state: 'WA', zip: '98433' },
  'Joint Base McGuire-Dix-Lakehurst': { city: 'Trenton', state: 'NJ', zip: '08641' },
  'Joint Base Pearl Harbor-Hickam': { city: 'Honolulu', state: 'HI', zip: '96818' },
  'Joint Base San Antonio': { city: 'San Antonio', state: 'TX', zip: '78234' },
  'Kadena AB': { city: 'Okinawa', state: 'Japan', zip: '96368' },
  'Keesler AFB': { city: 'Biloxi', state: 'MS', zip: '39534' },
  'Kirtland Air Force Base': { city: 'Albuquerque', state: 'NM', zip: '87117' },
  'Little Rock AFB': { city: 'Jacksonville', state: 'AR', zip: '72099' },
  'Luke AFB': { city: 'Glendale', state: 'AZ', zip: '85309' },
  'MacDill AFB': { city: 'Tampa', state: 'FL', zip: '33621' },
  'Malmstrom Air Force Base': { city: 'Great Falls', state: 'MT', zip: '59402' },
  'MCAS Beaufort': { city: 'Beaufort', state: 'SC', zip: '29904' },
  'MCAS Cherry Point': { city: 'Havelock', state: 'NC', zip: '28533' },
  'MCAS Miramar': { city: 'San Diego', state: 'CA', zip: '92145' },
  'MCAS New River': { city: 'Jacksonville', state: 'NC', zip: '28540' },
  'MCAS Yuma': { city: 'Yuma', state: 'AZ', zip: '85369' },
  'MCB Quantico': { city: 'Quantico', state: 'VA', zip: '22134' },
  'Marine Corps Base Quantico': { city: 'Quantico', state: 'VA', zip: '22134' },
  'Minot AFB': { city: 'Minot', state: 'ND', zip: '58705' },
  'Moody AFB': { city: 'Valdosta', state: 'GA', zip: '31699' },
  'Mountain Home AFB': { city: 'Mountain Home', state: 'ID', zip: '83648' },
  'Naval Air Station Corpus Christi': { city: 'Corpus Christi', state: 'TX', zip: '78419' },
  'NAS Corpus Christi': { city: 'Corpus Christi', state: 'TX', zip: '78419' },
  'Naval Air Station Jacksonville': { city: 'Jacksonville', state: 'FL', zip: '32212' },
  'NAS Jacksonville': { city: 'Jacksonville', state: 'FL', zip: '32212' },
  'Naval Air Station Lemoore': { city: 'Lemoore', state: 'CA', zip: '93246' },
  'NAS Lemoore': { city: 'Lemoore', state: 'CA', zip: '93246' },
  'Naval Air Station Oceana': { city: 'Virginia Beach', state: 'VA', zip: '23460' },
  'NAS Oceana': { city: 'Virginia Beach', state: 'VA', zip: '23460' },
  'Naval Air Station Pensacola': { city: 'Pensacola', state: 'FL', zip: '32508' },
  'NAS Pensacola': { city: 'Pensacola', state: 'FL', zip: '32508' },
  'Naval Air Station Whidbey Island': { city: 'Oak Harbor', state: 'WA', zip: '98278' },
  'NAS Whidbey Island': { city: 'Oak Harbor', state: 'WA', zip: '98278' },
  'Naval Base Coronado': { city: 'San Diego', state: 'CA', zip: '92155' },
  'Naval Base Kitsap': { city: 'Silverdale', state: 'WA', zip: '98315' },
  'Naval Base Point Loma': { city: 'San Diego', state: 'CA', zip: '92106' },
  'Naval Base San Diego': { city: 'San Diego', state: 'CA', zip: '92136' },
  'Naval Base Ventura County': { city: 'Port Hueneme', state: 'CA', zip: '93043' },
  'Naval Station Great Lakes': { city: 'North Chicago', state: 'IL', zip: '60088' },
  'Naval Station Mayport': { city: 'Jacksonville', state: 'FL', zip: '32228' },
  'Naval Station Newport': { city: 'Newport', state: 'RI', zip: '02841' },
  'Naval Station Norfolk': { city: 'Norfolk', state: 'VA', zip: '23511' },
  'Naval Station Rota': { city: 'Rota', state: 'Spain', zip: '11530' },
  'Nellis AFB': { city: 'Las Vegas', state: 'NV', zip: '89191' },
  'Offutt AFB': { city: 'Bellevue', state: 'NE', zip: '68113' },
  'Osan Air Base': { city: 'Pyeongtaek', state: 'South Korea', zip: '17759' },
  'Patrick SFB': { city: 'Cocoa Beach', state: 'FL', zip: '32925' },
  'Peterson SFB': { city: 'Colorado Springs', state: 'CO', zip: '80914' },
  'Ramstein AB': { city: 'Ramstein-Miesenbach', state: 'Germany', zip: '66877' },
  'Redstone Arsenal': { city: 'Huntsville', state: 'AL', zip: '35808' },
  'Robins AFB': { city: 'Warner Robins', state: 'GA', zip: '31098' },
  'Schriever SFB': { city: 'Colorado Springs', state: 'CO', zip: '80912' },
  'Scott AFB': { city: "O'Fallon", state: 'IL', zip: '62225' },
  'Seymour Johnson AFB': { city: 'Goldsboro', state: 'NC', zip: '27531' },
  'Shaw Air Force Base': { city: 'Sumter', state: 'SC', zip: '29152' },
  'Tinker AFB': { city: 'Oklahoma City', state: 'OK', zip: '73145' },
  'Travis AFB': { city: 'Fairfield', state: 'CA', zip: '94535' },
  'Travis Air Force Base': { city: 'Fairfield', state: 'CA', zip: '94535' },
  'Tyndall AFB': { city: 'Panama City', state: 'FL', zip: '32403' },
  'USAG Bavaria': { city: 'Grafenwoehr', state: 'Germany', zip: '92655' },
  'USAG Humphreys': { city: 'Pyeongtaek', state: 'South Korea', zip: '17977' },
  'USAG Stuttgart': { city: 'Stuttgart', state: 'Germany', zip: '70569' },
  'USAG Wiesbaden': { city: 'Wiesbaden', state: 'Germany', zip: '65189' },
  'Vandenberg SFB': { city: 'Lompoc', state: 'CA', zip: '93437' },
  'Whiteman AFB': { city: 'Knob Noster', state: 'MO', zip: '65305' },
  'Wright-Patterson AFB': { city: 'Dayton', state: 'OH', zip: '45433' },
  'Yokota AB': { city: 'Fussa', state: 'Japan', zip: '197-0001' },
};

const BRANCH_HOUSING_SOURCES = {
  Army: {
    name: 'Army housing support',
    url: 'https://installations.militaryonesource.mil/',
    domain: 'site:army.mil OR site:home.army.mil OR site:installations.militaryonesource.mil',
  },
  Navy: {
    name: 'Navy Housing',
    url: 'https://ffr.cnic.navy.mil/Navy-Housing/',
    domain: 'site:ffr.cnic.navy.mil OR site:navylife.mil OR site:installations.militaryonesource.mil',
  },
  'Marine Corps': {
    name: 'Marine Corps housing support',
    url: 'https://installations.militaryonesource.mil/',
    domain: 'site:marines.mil OR site:installations.militaryonesource.mil',
  },
  'Air Force': {
    name: 'Department of the Air Force Housing',
    url: 'https://www.housing.af.mil/',
    domain: 'site:housing.af.mil OR site:installations.militaryonesource.mil',
  },
  'Space Force': {
    name: 'Department of the Air Force Housing',
    url: 'https://www.housing.af.mil/',
    domain: 'site:housing.af.mil OR site:spaceforce.mil OR site:installations.militaryonesource.mil',
  },
  'Coast Guard': {
    name: 'Coast Guard Housing Program',
    url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources-CG-1/Health-Safety-and-Work-Life-CG-11/Office-of-Work-Life-CG-111/Housing-Program/',
    domain: 'site:uscg.mil OR site:dcms.uscg.mil OR site:installations.militaryonesource.mil',
  },
};

const OFFICIAL_SOURCES = [
  {
    name: 'HOMES.mil / HEAT',
    url: 'https://www.homes.mil/homes/DispatchServlet/HomesEntry',
    note: 'Official DoD housing entry point and Housing Early Assistance Tool. Search by gaining installation once opened.',
  },
  {
    name: 'HOMES.mil housing types',
    url: 'https://www.homes.mil/heat/DispatchServlet/HeatTypesOfHousing',
    note: 'Official housing type definitions for privatized housing, MHO-managed housing, RPP housing, and community housing.',
  },
  {
    name: 'MilitaryINSTALLATIONS Housing',
    url: 'https://installations.militaryonesource.mil/',
    note: 'Official public installation housing office, local support, and contact directory.',
  },
];

const BASE_PROFILES = [
  {
    type: 'Single Family Home',
    category: 'Family housing',
    beds: '3-5',
    baths: '2-3',
    sqft: '1,300-2,600',
    proximity: 'On installation or nearby community',
    note: 'Best fit for families needing more storage, yard space, pet flexibility, or a longer lease near the gaining installation.',
  },
  {
    type: 'Townhome',
    category: 'Family housing',
    beds: '2-4',
    baths: '1.5-2.5',
    sqft: '950-1,950',
    proximity: 'Installation housing area or adjacent community',
    note: 'Useful when the household needs multiple bedrooms but wants a smaller footprint than a detached house.',
  },
  {
    type: 'Apartment or Duplex',
    category: 'Community housing',
    beds: '1-3',
    baths: '1-2',
    sqft: '650-1,500',
    proximity: 'Near gates, schools, hospitals, or commute corridors',
    note: 'Often a practical option for short timelines, smaller households, and areas with limited privatized housing availability.',
  },
  {
    type: 'Temporary Lodging',
    category: 'Arrival housing',
    beds: 'Studio-2',
    baths: '1-2',
    sqft: 'Varies',
    proximity: 'On installation or nearby official lodging area',
    note: 'Use while waiting for household goods, final lease approval, housing assignment, or school-zone confirmation.',
  },
  {
    type: 'Unaccompanied Housing',
    category: 'Member housing',
    beds: 'Studio-1',
    baths: 'Shared or private',
    sqft: 'Varies by installation',
    proximity: 'On installation where available',
    note: 'Eligibility, room type, wait-list status, and inspection standards are controlled by the local housing office.',
  },
];

const BRANCH_PROFILE_NOTES = {
  Army: 'Army users should verify family housing, barracks, RPP, and local housing office rules through MilitaryINSTALLATIONS or HOMES.mil.',
  Navy: 'Navy users should use the Housing Service Center and HOMES.mil to match family, unaccompanied, and community housing needs.',
  'Marine Corps': 'Marine Corps users should verify installation housing office guidance and privatized housing partner rules before signing.',
  'Air Force': 'Air Force users should use the Military Housing Office, HEAT, and HOMES.mil for family, dorm, and community housing support.',
  'Space Force': 'Space Force users should use the servicing Department of the Air Force housing office, HEAT, and HOMES.mil.',
  'Coast Guard': 'Coast Guard users should verify local housing availability through the servicing housing office because inventory varies by station.',
};

const clean = value => String(value || '').trim();
const normalize = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function getProfileInstallation(profile) {
  const raw = clean(profile?.gainingInstallation || profile?.installation || profile?.base);
  return raw ? raw.split(',')[0].trim() : '';
}

function findKnownMarket(input) {
  const target = normalize(input);
  if (!target) return null;
  const direct = Object.entries(INSTALLATION_MARKETS).find(([name]) => normalize(name) === target);
  if (direct) return { installation: direct[0], ...direct[1] };
  const fuzzy = Object.entries(INSTALLATION_MARKETS).find(([name]) => {
    const candidate = normalize(name);
    return target.includes(candidate) || candidate.includes(target);
  });
  return fuzzy ? { installation: fuzzy[0], ...fuzzy[1] } : null;
}

function getMarket(profile, manual) {
  const manualText = clean(manual);
  const selectedInstallation = manualText || getProfileInstallation(profile);
  const known = findKnownMarket(selectedInstallation);
  if (known) {
    const installation = known.alias || known.installation;
    const location = [known.city, known.state, known.zip].filter(Boolean).join(', ');
    return {
      installation,
      label: `${installation} - ${location}`,
      location,
      query: `${installation} ${known.city} ${known.state} ${known.zip}`,
      known: true,
    };
  }
  return {
    installation: selectedInstallation || 'Manual location',
    label: selectedInstallation || 'Enter gaining installation, address, city, or ZIP',
    location: selectedInstallation,
    query: selectedInstallation,
    known: false,
  };
}

function buildHousingLinks(market, branchSource, activeProfile) {
  const install = market.installation;
  const location = market.query || install;
  const type = activeProfile.type;
  const beds = activeProfile.beds;
  const branchDomain = branchSource.domain || 'site:installations.militaryonesource.mil';

  return [
    {
      name: `${type} near ${install}`,
      desc: `Search official and military housing pages for ${type.toLowerCase()} options near ${market.location || install}.`,
      url: googleSearchUrl(`${install} ${type} housing ${beds} ${branchDomain}`),
      tag: 'Selected profile',
      terms: `${install} ${type} housing ${beds}`,
    },
    {
      name: 'HOMES.mil current rental search',
      desc: `Open the official DoD housing entry point and search for "${install}" with your bedroom and housing-type preference.`,
      url: 'https://www.homes.mil/homes/DispatchServlet/HomesEntry',
      tag: 'Official listings',
      terms: `${install} ${type} ${beds}`,
    },
    {
      name: 'Installation housing office',
      desc: `Find housing office contacts, eligibility, local rules, wait-list guidance, pet policies, and temporary housing support for ${install}.`,
      url: googleSearchUrl(`${install} housing MilitaryINSTALLATIONS site:installations.militaryonesource.mil/military-installation`),
      tag: 'Official contacts',
      terms: `${install} housing office`,
    },
    {
      name: branchSource.name,
      desc: `Open or search the official branch housing source tied to the branch selected during onboarding.`,
      url: googleSearchUrl(`${location} ${type} housing ${branchDomain}`),
      tag: 'Branch source',
      terms: `${location} ${type} housing`,
    },
    {
      name: 'Temporary lodging and arrival options',
      desc: `Search official sources for lodging, arrival housing, and temporary housing guidance near ${install}.`,
      url: googleSearchUrl(`${install} temporary lodging housing site:installations.militaryonesource.mil OR site:militaryonesource.mil OR site:.mil`),
      tag: 'Arrival planning',
      terms: `${install} temporary lodging housing`,
    },
  ];
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E6EDF3', borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: '#6B7280', letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#1F2937', marginTop: 3 }}>{value}</div>
    </div>
  );
}

export default function HomeLocatorTab({ theme = {}, profile = {} }) {
  const [manual, setManual] = useState('');
  const [selected, setSelected] = useState(0);
  const market = useMemo(() => getMarket(profile, manual), [profile, manual]);
  const branch = clean(profile?.branch) || 'Army';
  const branchSource = BRANCH_HOUSING_SOURCES[branch] || BRANCH_HOUSING_SOURCES.Army;
  const activeProfile = BASE_PROFILES[selected] || BASE_PROFILES[0];
  const links = useMemo(() => buildHousingLinks(market, branchSource, activeProfile), [market, branchSource, activeProfile]);
  const colors = {
    primary: theme.primary || '#244247',
    secondary: theme.secondary || '#152F36',
    accent: theme.accent || '#C99A3D',
    text: '#0D1821',
    muted: '#56697C',
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: colors.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${colors.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>INSTALLATION-AWARE HOUSING LOCATOR</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>{market.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          Select a housing profile to see in-app planning options and official-source searches tailored to the gaining installation. Availability, exact floor plans, wait lists, lease terms, pet rules, and eligibility must be confirmed through HOMES.mil, the installation housing office, or the official branch housing source.
        </div>
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: colors.muted, letterSpacing: '.08em', textTransform: 'uppercase' }}>Manual location search</label>
        <input
          value={manual}
          onChange={event => {
            setManual(event.target.value);
            setSelected(0);
          }}
          placeholder="Base, address, city, or ZIP if not found locally"
          style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 9, border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: 13 }}
        />
        <div style={{ fontSize: 10, color: colors.muted, lineHeight: 1.5, marginTop: 8 }}>
          The search uses your manual entry first. When left blank, it uses the gaining installation from onboarding.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        {BASE_PROFILES.map((item, index) => {
          const active = index === selected;
          return (
            <button
              key={item.type}
              onClick={() => setSelected(index)}
              style={{
                textAlign: 'left',
                background: active ? `${colors.primary}12` : '#FFF',
                border: `1.5px solid ${active ? colors.primary : '#E0E6EE'}`,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
                boxShadow: active ? '0 10px 22px rgba(20,45,72,0.12)' : 'none',
              }}
            >
              <div style={{ fontSize: 11, color: colors.accent, fontWeight: 900, marginBottom: 3 }}>{item.category}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: active ? colors.primary : colors.text, marginBottom: 3 }}>{item.type}</div>
              <div style={{ fontSize: 10, color: colors.muted }}>{item.beds} beds | {item.baths} baths | {item.sqft} sq ft</div>
            </button>
          );
        })}
      </div>

      <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.primary, letterSpacing: '.08em', marginBottom: 6 }}>SELECTED HOUSING OPTION</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: colors.text, marginBottom: 12 }}>{activeProfile.type}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
          <StatBox label="Bedrooms" value={activeProfile.beds} />
          <StatBox label="Bathrooms" value={activeProfile.baths} />
          <StatBox label="Approx. sq. ft." value={activeProfile.sqft} />
          <StatBox label="Proximity" value={activeProfile.proximity} />
        </div>
        <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.6, marginBottom: 8 }}>{activeProfile.note}</div>
        <div style={{ fontSize: 11, color: colors.primary, lineHeight: 1.6, fontWeight: 800 }}>
          {BRANCH_PROFILE_NOTES[branch] || BRANCH_PROFILE_NOTES.Army}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: colors.text, marginBottom: 8 }}>Relevant housing search cards</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {links.map(card => (
            <a key={card.name} href={card.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#F8FAFC', border: '1px solid #E6EDF3', borderLeft: `4px solid ${colors.primary}`, borderRadius: 10, padding: 12, color: colors.text }}>
              <div style={{ fontSize: 10, color: colors.accent, fontWeight: 900, letterSpacing: '.08em', marginBottom: 5, textTransform: 'uppercase' }}>{card.tag}</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: colors.text }}>{card.name}</div>
              <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginTop: 4 }}>{card.desc}</div>
              <div style={{ marginTop: 8, fontSize: 10, color: colors.primary, fontWeight: 900 }}>Search terms: {card.terms}</div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: colors.text, marginBottom: 8 }}>Official housing source shortcuts</div>
        {[branchSource, ...OFFICIAL_SOURCES].map((source) => (
          <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${colors.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: colors.text }}>{source.name}</div>
                <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginTop: 3 }}>{source.note || 'Official housing source tied to the selected branch or installation.'}</div>
              </div>
              <div style={{ alignSelf: 'center', padding: '7px 10px', borderRadius: 9, background: colors.primary, color: '#FFF', fontSize: 11, fontWeight: 900 }}>Open</div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#0D3B66', background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
        PCS Express shows planning profiles and official-source search paths instead of storing real-time private housing inventory. Use the selected cards to verify current listings, eligibility, wait lists, pet policies, commute distance, lease terms, and move-in dates through the official source before making housing decisions.
      </div>
    </div>
  );
}
