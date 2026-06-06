/*
 * DoD SkillBridge data + result builder for the veteran Career Center.
 *
 * SkillBridge has no public listings API, so "results" are generated honestly:
 * the official DoD SkillBridge Opportunity Locator + program pages, a
 * location/category-targeted live search, and a curated list of vetted,
 * publicly-documented SkillBridge-authorized partner programs. No fabricated
 * listings. Every partner URL was verified to resolve (HTTP 200) before
 * shipping.
 *
 * Results are emitted in the Career Center Card shape
 * ({ name, url, desc, official, color, badgeKey, badgeLabel }) so the
 * SkillBridge tab renders with the IDENTICAL card style + structure as the
 * Employment Center — the only difference is the vetted SkillBridge content.
 *
 * Official program domain note: the program moved from skillbridge.osd.mil to
 * www.skillbridge.mil (the legacy host 301-redirects). We link the new host.
 */

const enc = (s) => encodeURIComponent(String(s || '').trim());

// remote: true (commonly remote/virtual), false (in-person), or 'varies'
// (large employers whose individual postings differ by role/location). The
// Remote-only filter keeps true + 'varies'.
//
// Category palette mirrors the Employment Center accent colors.
export const SKILLBRIDGE_CATEGORIES = [
  { id: 'all', label: 'All', kw: '' },
  {
    id: 'it', label: 'IT & Cyber', kw: 'information technology cybersecurity', color: '#1F4E79',
    programs: [
      { name: 'Microsoft Software & Systems Academy (MSSA)', url: 'https://military.microsoft.com/mssa/', remote: true, desc: 'Microsoft cloud/IT training and hiring program for transitioning service members.' },
      { name: 'AWS re/Start', url: 'https://aws.amazon.com/training/restart/', remote: true, desc: 'Full-time cloud-computing skills program with employer connections.' },
      { name: 'CompTIA Tech Career Academy', url: 'https://www.comptia.org/', remote: true, desc: 'Industry IT certifications (A+, Network+, Security+) used across SkillBridge tracks.' },
      { name: 'VetsinTech', url: 'https://vetsintech.co/', remote: true, desc: 'Tech training, certification, and placement for veterans and transitioning members.' },
      { name: 'Per Scholas', url: 'https://perscholas.org/', remote: 'varies', desc: 'Tuition-free tech training in cybersecurity, IT support, and cloud.' },
      { name: 'Grow with Google — Career Certificates', url: 'https://grow.google/', remote: true, desc: 'Google Career Certificates in IT support, cybersecurity, and data analytics.' },
    ],
  },
  {
    id: 'business', label: 'Business & PM', kw: 'business management project', color: '#5B3E8A',
    programs: [
      { name: 'Hiring Our Heroes Corporate Fellowship', url: 'https://www.hiringourheroes.org/career-services/fellowships/', remote: 'varies', desc: 'Flagship 12-week corporate fellowship placing members directly with employers.' },
      { name: 'Vets2PM SkillBridge', url: 'https://vets2pm.com/skillbridge/', remote: true, desc: 'Project-management (PMP/CAPM) certification plus a SkillBridge host placement.' },
      { name: 'Salesforce Military (Vetforce)', url: 'https://veterans.my.site.com/s/', remote: true, desc: 'Free Salesforce/Trailhead training, certifications, and SkillBridge fellowships.' },
      { name: 'FourBlock Career Readiness', url: 'https://www.fourblock.org/programs', remote: 'varies', desc: 'Cohort-based veteran career-readiness program in major metro areas.' },
    ],
  },
  {
    id: 'trades', label: 'Trades & Mfg', kw: 'skilled trades manufacturing maintenance', color: '#7A3E16',
    programs: [
      { name: 'Helmets to Hardhats', url: 'https://helmetstohardhats.org/', remote: false, desc: 'Connects members to building and construction-trades apprenticeships.' },
      { name: 'Workshops for Warriors', url: 'https://www.workshopsforwarriors.org/', remote: false, desc: 'Hands-on CNC, welding, and manufacturing training with nationally-recognized certs.' },
      { name: 'Veterans in Piping (UA VIP)', url: 'https://www.uavip.org/', remote: false, desc: 'United Association accelerated welding, HVAC, and pipefitting training.' },
      { name: 'IBEW Electrical Apprenticeships', url: 'https://www.ibew.org/', remote: false, desc: 'International Brotherhood of Electrical Workers apprenticeship pathways.' },
    ],
  },
  {
    id: 'logistics', label: 'Logistics', kw: 'logistics supply chain transportation driver', color: '#2C6E49',
    programs: [
      { name: 'Amazon Military SkillBridge', url: 'https://www.amazon.jobs/content/en/career-programs/military', remote: 'varies', desc: 'Amazon fellowships and apprenticeships across operations, logistics, and corporate roles.' },
      { name: 'Schneider Military Apprenticeship', url: 'https://schneiderjobs.com/truck-driving-jobs/military/military-apprenticeship-program', remote: false, desc: 'CDL / over-the-road truck-driving apprenticeship (VA-approved).' },
      { name: 'FASTPORT (Veterans in Trucking)', url: 'https://fastport.com/', remote: 'varies', desc: 'Apprenticeship intermediary connecting members to trucking and logistics employers.' },
    ],
  },
  {
    id: 'healthcare', label: 'Healthcare', kw: 'healthcare medical nursing', color: '#176B6B',
    programs: [
      { name: 'Medtronic SkillBridge', url: 'https://www.medtronic.com/', remote: 'varies', desc: 'Medical-device roles in field service, manufacturing, and sales.' },
      { name: 'Veterans Health Administration (VHA)', url: 'https://www.va.gov/careers-employment/', official: true, remote: false, desc: 'VHA clinical and administrative SkillBridge placements across VA facilities.', badgeKey: 'official' },
    ],
  },
  {
    id: 'finance', label: 'Finance', kw: 'finance accounting banking', color: '#255E91',
    programs: [
      { name: 'USAA Military Transition', url: 'https://www.usaa.com/inet/wc/careers-military-transition', remote: 'varies', desc: 'SkillBridge fellowships in finance, operations, and corporate functions.' },
      { name: 'Edward Jones Careers', url: 'https://careers.edwardjones.com/', remote: 'varies', desc: 'Financial-advisor career pathway and SkillBridge entry point.' },
      { name: 'Bank of America / Merrill Careers', url: 'https://careers.bankofamerica.com/', remote: 'varies', desc: 'Veteran and SkillBridge hiring across banking and Merrill wealth roles.' },
    ],
  },
  {
    id: 'engineering', label: 'Engineering', kw: 'engineering aerospace defense', color: '#334155',
    programs: [
      { name: 'Lockheed Martin Careers', url: 'https://www.lockheedmartinjobs.com/', remote: 'varies', desc: 'Defense engineering and technical SkillBridge roles.' },
      { name: 'Boeing Careers', url: 'https://jobs.boeing.com/', remote: 'varies', desc: 'Aerospace manufacturing and engineering SkillBridge placements.' },
      { name: 'Northrop Grumman Careers', url: 'https://www.northropgrumman.com/careers/', remote: 'varies', desc: 'Defense and engineering SkillBridge and veteran hiring.' },
      { name: 'General Dynamics Mission Systems SkillBridge', url: 'https://gdmissionsystems.com/careers/veterans/skillbridge', remote: 'varies', desc: 'Dedicated SkillBridge military internship program.' },
      { name: 'Leidos Careers', url: 'https://careers.leidos.com/', remote: 'varies', desc: 'Defense IT and engineering roles.' },
      { name: 'Booz Allen Hamilton Careers', url: 'https://careers.boozallen.com/', remote: 'varies', desc: 'Consulting, cyber, and engineering SkillBridge fellowships.' },
    ],
  },
  {
    id: 'aviation', label: 'Aviation', kw: 'aviation pilot aircraft maintenance', color: '#0A66C2',
    programs: [
      { name: 'United Aviate', url: 'https://www.unitedaviate.com/', remote: false, desc: 'United Airlines pilot career-development pathway.' },
      { name: 'American Airlines Careers', url: 'https://jobs.aa.com/', remote: 'varies', desc: 'Aviation maintenance, operations, and corporate SkillBridge roles.' },
      { name: 'SkyBridge Aviation', url: 'https://skybridgeaviation.com/', remote: 'varies', desc: 'Aviation-industry SkillBridge intermediary placing members with carriers and MROs.' },
      { name: 'Delta Military Careers', url: 'https://www.delta.com/us/en/careers/military-careers', remote: 'varies', desc: "Delta's official military and transition careers hub." },
    ],
  },
  {
    id: 'sales', label: 'Sales & CX', kw: 'sales account management customer success', color: '#7A3E16',
    programs: [
      { name: 'BreakLine', url: 'https://breakline.org/', remote: true, desc: 'Career-acceleration program with sales, customer-success, and tech tracks.' },
      { name: 'VETS2INDUSTRY', url: 'https://vets2industry.org/', remote: true, desc: 'Free resource library and SkillBridge job board across fields.' },
    ],
  },
  {
    id: 'general', label: 'Cross-Industry', kw: 'transition career placement', color: '#176B6B',
    programs: [
      { name: 'Hire Heroes USA', url: 'https://www.hireheroesusa.org/', remote: true, desc: 'Free job-search coaching and placement across every industry.' },
      { name: 'Onward to Opportunity (IVMF)', url: 'https://ivmf.syracuse.edu/programs/career-training/onward-to-opportunity/', official: true, remote: true, desc: 'Free Syracuse University career-skills training and certifications across fields.', badgeKey: 'official' },
      { name: 'Orion Talent — SkillBridge', url: 'https://www.oriontalent.com/dodskillbridge/', remote: 'varies', desc: 'Dedicated SkillBridge internship hub plus manufacturing certifications.' },
      { name: 'FourBlock', url: 'https://www.fourblock.org/', remote: 'varies', desc: 'Cohort career-readiness program spanning industries.' },
    ],
  },
];

export function skillbridgeCategoryById(id) {
  return SKILLBRIDGE_CATEGORIES.find(c => c.id === id) || SKILLBRIDGE_CATEGORIES[0];
}

// SkillBridge eligibility facts (official). Surfaced in the tab intro.
export const SKILLBRIDGE_FACTS = {
  windowDays: 180,
  summary: 'DoD SkillBridge places you in a civilian-employer internship during your last up-to-180 days of service while you keep military pay and benefits. It requires unit commander approval — start early.',
};

const OFFICIAL_LOCATOR = 'https://www.skillbridge.mil/locations';
const remoteEligible = (p) => p.remote === true || p.remote === 'varies';

// Build the SkillBridge result set (Card-shaped) for a category + location (or
// remote). Always returns the official locator + a live search so the tab is
// never empty, then the vetted partner programs for the filter.
export function skillbridgeResults({ catId, location, remote }) {
  const cat = skillbridgeCategoryById(catId);
  const loc = String(location || '').trim();
  const cards = [];

  cards.push({
    official: true,
    badgeKey: 'official',
    name: 'Official DoD SkillBridge Opportunity Locator',
    color: '#1F4E79',
    desc: remote
      ? 'Filter the official locator to "Remote/Virtual" and your career field for current SkillBridge openings.'
      : `Search the official locator by state/area${loc ? ` (${loc})` : ''} and career field for current openings.`,
    url: OFFICIAL_LOCATOR,
  });
  cards.push({
    official: true,
    badgeKey: 'official',
    name: 'SkillBridge Program Overview & Eligibility',
    color: '#2C6E49',
    desc: 'Official program rules: the up-to-180-day window, unit-commander authorization, and keeping full pay and benefits.',
    url: 'https://www.skillbridge.mil/program-overview',
  });

  const kw = cat.kw ? `${cat.kw} ` : '';
  const locPart = remote ? 'remote' : loc;
  cards.push({
    official: false,
    badgeKey: 'external',
    name: remote
      ? `Search: remote DoD SkillBridge ${cat.label === 'All' ? 'opportunities' : cat.label}`
      : `Search: DoD SkillBridge ${cat.label === 'All' ? 'opportunities' : cat.label}${loc ? ` near ${loc}` : ''}`,
    color: '#334155',
    desc: 'Live web results for SkillBridge programs matching this filter. Confirm eligibility and dates on each program’s official page.',
    url: `https://www.google.com/search?q=${enc(`DoD SkillBridge ${kw}${locPart || 'opportunities'}`)}`,
  });

  const cats = catId === 'all' ? SKILLBRIDGE_CATEGORIES.filter(c => c.programs) : [cat];
  for (const c of cats) {
    for (const p of (c.programs || [])) {
      if (remote && !remoteEligible(p)) continue;
      const remoteTag = p.remote === true ? ' · Remote' : (p.remote === 'varies' ? ' · Remote varies by role' : '');
      cards.push({
        name: p.name,
        url: p.url,
        official: !!p.official,
        color: p.official ? '#1F4E79' : (c.color || '#334155'),
        badgeKey: p.badgeKey || (p.official ? 'official' : 'partner'),
        badgeLabel: p.official ? undefined : 'SkillBridge',
        desc: `${p.desc} (${c.label}${remoteTag})`,
      });
    }
  }
  return cards;
}
