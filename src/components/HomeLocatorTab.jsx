/*
 * Purpose: Official public military housing link hub for the gaining installation.
 * Third-party dependencies: React.
 */

import { useMemo, useState } from 'react';

const INSTALLATION_MARKETS = {
  'Fort Liberty': { city: 'Fayetteville', state: 'NC', zip: '28310' },
  'Fort Bragg': { city: 'Fayetteville', state: 'NC', zip: '28310', alias: 'Fort Liberty' },
  'Fort Cavazos': { city: 'Killeen', state: 'TX', zip: '76544' },
  'Fort Hood': { city: 'Killeen', state: 'TX', zip: '76544', alias: 'Fort Cavazos' },
  'Fort Campbell': { city: 'Clarksville', state: 'TN', zip: '37042' },
  'Fort Carson': { city: 'Colorado Springs', state: 'CO', zip: '80913' },
  'Fort Drum': { city: 'Watertown', state: 'NY', zip: '13602' },
  'Fort Eisenhower': { city: 'Augusta', state: 'GA', zip: '30905' },
  'Fort Gordon': { city: 'Augusta', state: 'GA', zip: '30905', alias: 'Fort Eisenhower' },
  'Fort Gregg-Adams': { city: 'Petersburg', state: 'VA', zip: '23801' },
  'Fort Lee': { city: 'Petersburg', state: 'VA', zip: '23801', alias: 'Fort Gregg-Adams' },
  'Fort Jackson': { city: 'Columbia', state: 'SC', zip: '29207' },
  'Fort Leonard Wood': { city: 'Waynesville', state: 'MO', zip: '65583' },
  'Fort Moore': { city: 'Columbus', state: 'GA', zip: '31905' },
  'Fort Riley': { city: 'Junction City', state: 'KS', zip: '66442' },
  'Fort Stewart': { city: 'Hinesville', state: 'GA', zip: '31314' },
  'Joint Base Lewis-McChord': { city: 'Tacoma', state: 'WA', zip: '98433' },
  'Joint Base San Antonio': { city: 'San Antonio', state: 'TX', zip: '78234' },
  'Joint Base Langley-Eustis': { city: 'Hampton', state: 'VA', zip: '23665' },
  'Joint Base Andrews': { city: 'Camp Springs', state: 'MD', zip: '20762' },
  'Naval Station Norfolk': { city: 'Norfolk', state: 'VA', zip: '23511' },
  'Naval Base San Diego': { city: 'San Diego', state: 'CA', zip: '92136' },
  'Naval Station Mayport': { city: 'Jacksonville', state: 'FL', zip: '32228' },
  'NAS Pensacola': { city: 'Pensacola', state: 'FL', zip: '32508' },
  'Camp Lejeune': { city: 'Jacksonville', state: 'NC', zip: '28547' },
  'Marine Corps Base Camp Lejeune': { city: 'Jacksonville', state: 'NC', zip: '28547' },
  'Camp Pendleton': { city: 'Oceanside', state: 'CA', zip: '92055' },
  'MCAS Miramar': { city: 'San Diego', state: 'CA', zip: '92145' },
  'MCB Quantico': { city: 'Quantico', state: 'VA', zip: '22134' },
  'Eglin AFB': { city: 'Niceville', state: 'FL', zip: '32542' },
  'MacDill AFB': { city: 'Tampa', state: 'FL', zip: '33621' },
  'Tinker AFB': { city: 'Oklahoma City', state: 'OK', zip: '73145' },
  'Wright-Patterson AFB': { city: 'Dayton', state: 'OH', zip: '45433' },
  'Nellis AFB': { city: 'Las Vegas', state: 'NV', zip: '89191' },
  'Travis AFB': { city: 'Fairfield', state: 'CA', zip: '94535' },
  'Peterson SFB': { city: 'Colorado Springs', state: 'CO', zip: '80914' },
  'Schriever SFB': { city: 'Colorado Springs', state: 'CO', zip: '80912' },
  'Vandenberg SFB': { city: 'Lompoc', state: 'CA', zip: '93437' },
  'Camp Humphreys': { city: 'Pyeongtaek', state: 'South Korea', zip: '17977' },
  'Ramstein AB': { city: 'Ramstein-Miesenbach', state: 'Germany', zip: '66877' },
  'Yokota AB': { city: 'Fussa', state: 'Japan', zip: '197-0001' },
  'Kadena AB': { city: 'Okinawa', state: 'Japan', zip: '96368' },
};

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
const normalize = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function profileInstallation(profile) {
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
  const selected = clean(manual) || profileInstallation(profile);
  const known = findKnownMarket(selected);
  if (known) {
    const installation = known.alias || known.installation;
    const location = [known.city, known.state, known.zip].filter(Boolean).join(', ');
    return { installation, location, label: `${installation} - ${location}`, query: `${installation} ${location}` };
  }
  return {
    installation: selected || 'selected installation',
    location: selected || '',
    label: selected || 'Enter gaining installation, address, city, or ZIP',
    query: selected || 'military housing',
  };
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
  const market = useMemo(() => getMarket(profile, manual), [profile, manual]);
  const branch = clean(profile?.branch) || 'Army';
  const branchSource = BRANCH_HOUSING_SOURCES[branch] || BRANCH_HOUSING_SOURCES.Army;
  const links = useMemo(() => buildOfficialLinks(market, branchSource), [market, branchSource]);
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
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>HOME LOCATOR</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>{market.label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          Use these official public housing links to verify current housing availability, housing office contacts, temporary lodging, and allowance information for the gaining installation. PCS Express does not store private housing inventory or non-public housing data.
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

      <section style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: colors.text, marginBottom: 8 }}>Official housing links</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {links.map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#F8FAFC', border: '1px solid #E6EDF3', borderLeft: `4px solid ${colors.primary}`, borderRadius: 10, padding: 12, color: colors.text }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: colors.text }}>{link.name}</div>
              <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginTop: 4 }}>{link.desc}</div>
              <div style={{ marginTop: 10, display: 'inline-flex', padding: '7px 10px', borderRadius: 8, background: colors.primary, color: '#FFF', fontSize: 11, fontWeight: 900 }}>Open official site</div>
            </a>
          ))}
        </div>
      </section>

      <div style={{ fontSize: 11, color: '#0D3B66', background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
        Official housing systems may require users to search by installation name after opening the source. Verify all availability, eligibility, wait lists, pet rules, commute distance, lease terms, and move-in dates through the official source before making housing decisions.
      </div>
    </div>
  );
}
