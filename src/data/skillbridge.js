/*
 * DoD SkillBridge data + result builder, shared by the veteran Career Center.
 *
 * SkillBridge has no public listings API, so "auto-populated results" are
 * generated honestly: the official DoD SkillBridge Opportunity Locator plus
 * location/category-targeted searches and curated, publicly-documented partner
 * programs. No fabricated listings.
 */

const enc = (s) => encodeURIComponent(String(s || '').trim());
const q = (topic, loc) => enc(loc ? `${topic} ${loc}` : topic);

// Job categories — drive the SkillBridge filter (local + remote). `remote`
// marks programs commonly offered remotely.
export const SKILLBRIDGE_CATEGORIES = [
  { id: 'all', label: 'All', kw: '' },
  {
    id: 'it', label: 'IT & Cyber', kw: 'information technology cybersecurity',
    programs: [
      { name: 'Microsoft Software & Systems Academy (MSSA)', url: 'https://military.microsoft.com/mssa/', remote: true },
      { name: 'AWS re/Start', url: 'https://aws.amazon.com/training/restart/', remote: true },
      { name: 'Google Career Certificates (Veterans)', url: 'https://grow.google/programs/veterans/', remote: true },
      { name: 'CompTIA Tech Career Academy', url: 'https://www.comptia.org/', remote: true },
    ],
  },
  {
    id: 'business', label: 'Business & PM', kw: 'business management project',
    programs: [
      { name: 'Hiring Our Heroes Corporate Fellowship Program', url: 'https://www.hiringourheroes.org/career-services/fellowships/', remote: true },
      { name: 'Vets2PM (project management / PMP)', url: 'https://www.vets2pm.com/', remote: true },
      { name: 'Salesforce Vetforce', url: 'https://vetforce.salesforce.com/', remote: true },
    ],
  },
  {
    id: 'trades', label: 'Trades & Mfg', kw: 'skilled trades manufacturing maintenance',
    programs: [
      { name: 'Helmets to Hardhats (construction trades)', url: 'https://helmetstohardhats.org/' },
      { name: 'IBEW / Electrical apprenticeships', url: 'https://www.ibew.org/' },
    ],
  },
  {
    id: 'logistics', label: 'Logistics', kw: 'logistics supply chain transportation driver',
    programs: [
      { name: 'Amazon SkillBridge', url: 'https://www.amazon.jobs/en/business_categories/military-skillbridge' },
      { name: 'FASTPORT national programs', url: 'https://fastport.com/' },
    ],
  },
  {
    id: 'healthcare', label: 'Healthcare', kw: 'healthcare medical nursing',
    programs: [
      { name: 'Medtronic veteran healthcare pathways', url: 'https://www.medtronic.com/us-en/about/careers/veterans.html' },
    ],
  },
  {
    id: 'finance', label: 'Finance', kw: 'finance accounting banking',
    programs: [
      { name: 'USAA military transition careers', url: 'https://www.usaajobs.com/military/' },
    ],
  },
  {
    id: 'engineering', label: 'Engineering', kw: 'engineering aerospace defense',
    programs: [
      { name: 'Lockheed Martin Military Relations', url: 'https://www.lockheedmartinjobs.com/military' },
      { name: 'Boeing veterans careers', url: 'https://jobs.boeing.com/military' },
    ],
  },
  {
    id: 'aviation', label: 'Aviation', kw: 'aviation pilot aircraft maintenance',
    programs: [
      { name: 'United Aviate (pilot pathways)', url: 'https://unitedaviate.com/' },
    ],
  },
  {
    id: 'sales', label: 'Sales & CX', kw: 'sales account management customer success',
    programs: [
      { name: 'Breakline sales fellowships', url: 'https://breakline.org/', remote: true },
    ],
  },
];

export function skillbridgeCategoryById(id) {
  return SKILLBRIDGE_CATEGORIES.find(c => c.id === id) || SKILLBRIDGE_CATEGORIES[0];
}

// Build the SkillBridge result set for a category + location (or remote).
export function skillbridgeResults({ catId, location, remote }) {
  const cat = skillbridgeCategoryById(catId);
  const cards = [];
  const locPart = remote ? 'remote' : location;
  const kw = cat.kw ? `${cat.kw} ` : '';

  cards.push({
    official: true,
    name: 'Official DoD SkillBridge Opportunity Locator',
    desc: remote
      ? 'Filter the official locator to "Remote/Virtual" and your career field for current SkillBridge openings.'
      : `Search the official locator by state/area${location ? ` (${location})` : ''} and career field for current openings.`,
    url: 'https://skillbridge.osd.mil/locations.htm',
  });
  cards.push({
    name: remote
      ? `Search: remote DoD SkillBridge ${cat.label === 'All' ? 'opportunities' : cat.label}`
      : `Search: DoD SkillBridge ${cat.label === 'All' ? 'opportunities' : cat.label}${location ? ` near ${location}` : ''}`,
    desc: 'Live web results for SkillBridge programs matching this filter. Confirm eligibility and dates on each program’s official page.',
    url: `https://www.google.com/search?q=${q(`DoD SkillBridge ${kw}${locPart || 'opportunities'}`, '')}`,
  });
  for (const cat2 of (catId === 'all' ? SKILLBRIDGE_CATEGORIES.filter(c => c.programs) : [cat])) {
    for (const p of (cat2.programs || [])) {
      if (remote && !p.remote) continue;
      cards.push({ name: p.name, desc: `${cat2.label} SkillBridge partner program.`, url: p.url, partner: true });
    }
  }
  return cards;
}
