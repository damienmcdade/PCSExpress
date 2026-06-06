/*
 * Transition Career Center — built for SEPARATING/RETIRING service members
 * and veterans (NOT military spouses; the spouse-focused EmploymentModule
 * still serves Family Readiness). Veteran job search, a DoD SkillBridge
 * locator with a location box + job-category filter, a Remote SkillBridge
 * tab with the same category filter, and veteran career resources.
 *
 * SkillBridge has no public listings API, so "auto-populated results" are
 * generated honestly: the official DoD SkillBridge Opportunity Locator plus
 * location/category-targeted searches and a curated set of well-known,
 * publicly-documented SkillBridge partner programs. No fabricated listings.
 *
 * Tailored from the onboarding profile: branch (branch COOL credentialing,
 * MOS crosswalk), gaining installation (seeds the location), and separation
 * context. Bubble sub-tabs to match the rest of the app.
 *
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';
import { secureLocalStore } from '../security/SecurityExtensions';
import TabBar from './TabBar';

const LOCATION_KEY = 'pcs_career_location_override'; // shared with the Career override

const enc = (s) => encodeURIComponent(String(s || '').trim());
const q = (topic, loc) => enc(loc ? `${topic} ${loc}` : topic);

// Branch credentialing (COOL) portals — translate military training into
// civilian licenses/certs.
const BRANCH_COOL = {
  Army:          { name: 'Army COOL',  url: 'https://www.cool.army.mil/' },
  Navy:          { name: 'Navy COOL',  url: 'https://www.cool.navy.mil/' },
  'Marine Corps':{ name: 'Navy COOL (USMC)', url: 'https://www.cool.navy.mil/usmc/' },
  'Air Force':   { name: 'Air Force COOL', url: 'https://www.cool.af.mil/' },
  'Space Force': { name: 'Air Force COOL (USSF)', url: 'https://www.cool.af.mil/' },
  'Coast Guard': { name: 'Coast Guard credentialing', url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources/Training-and-Education-DCMS-81/Coast-Guard-Institute/' },
};
function coolFor(branch) { return BRANCH_COOL[branch] || BRANCH_COOL.Army; }

// Job categories — drive the SkillBridge filter (local + remote). Each has a
// search keyword and a few publicly-documented SkillBridge partner programs.
// `remote: true` marks programs commonly offered remotely.
const CATEGORIES = [
  { id: 'all', label: 'All', kw: '' },
  {
    id: 'it', label: 'IT & Cyber', kw: 'information technology cybersecurity',
    programs: [
      { name: 'Microsoft Software & Systems Academy (MSSA)', url: 'https://military.microsoft.com/mssa/', remote: true },
      { name: 'AWS re/Start', url: 'https://aws.amazon.com/training/restart/', remote: true },
      { name: 'Google Career Certificates (IT/Cyber/Data)', url: 'https://grow.google/programs/veterans/', remote: true },
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
      { name: 'FASTPORT / National programs', url: 'https://fastport.com/' },
    ],
  },
  {
    id: 'healthcare', label: 'Healthcare', kw: 'healthcare medical nursing',
    programs: [
      { name: 'Medtronic / Veteran healthcare pathways', url: 'https://www.medtronic.com/us-en/about/careers/veterans.html' },
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
      { name: 'Breakline / sales fellowships', url: 'https://breakline.org/', remote: true },
    ],
  },
];

function categoryById(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }

// Build the SkillBridge result set for a category + location (or remote).
function skillbridgeResults({ catId, location, remote }) {
  const cat = categoryById(catId);
  const cards = [];
  const locPart = remote ? 'remote' : location;
  const kw = cat.kw ? `${cat.kw} ` : '';

  // 1) Official locator — the authoritative source.
  cards.push({
    official: true,
    name: 'Official DoD SkillBridge Opportunity Locator',
    desc: remote
      ? 'Filter the official locator to "Remote/Virtual" and your career field for current SkillBridge openings.'
      : `Search the official locator by state/area${location ? ` (${location})` : ''} and career field for current openings.`,
    url: 'https://skillbridge.osd.mil/locations.htm',
  });
  // 2) Targeted search — "auto-populates" current results via the search engine.
  cards.push({
    name: remote
      ? `Search: remote DoD SkillBridge ${cat.label === 'All' ? 'opportunities' : cat.label}`
      : `Search: DoD SkillBridge ${cat.label === 'All' ? 'opportunities' : cat.label}${location ? ` near ${location}` : ''}`,
    desc: 'Live web results for SkillBridge programs matching this filter. Confirm eligibility and dates on each program’s official page.',
    url: `https://www.google.com/search?q=${q(`DoD SkillBridge ${kw}${locPart || 'opportunities'}`, '')}`,
  });
  // 3) Curated, publicly-documented partner programs for this category.
  for (const cat2 of (catId === 'all' ? CATEGORIES.filter(c => c.programs) : [cat])) {
    for (const p of (cat2.programs || [])) {
      if (remote && !p.remote) continue;
      cards.push({ name: p.name, desc: `${cat2.label} SkillBridge partner program.`, url: p.url, partner: true });
    }
  }
  return cards;
}

function CategoryFilter({ theme, value, onChange, idPrefix }) {
  return (
    <div role="group" aria-label="Job category filter" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {CATEGORIES.map(c => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            id={`${idPrefix}-${c.id}`}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.id)}
            className="pcs-tab"
            style={{
              borderRadius: 999, padding: '6px 13px',
              border: `1.5px solid ${active ? theme.primary : '#D4DCE8'}`,
              background: active ? theme.primary : '#FFF',
              color: active ? '#FFF' : '#43526B',
              fontSize: 11.5, fontWeight: 700,
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function ResultCard({ theme, card }) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${card.name} (opens in a new tab)`}
      style={{ display: 'block', textDecoration: 'none', background: '#FFFFFF', border: '1px solid #E2E8F1', borderRadius: 12, padding: 13 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.primary }}>{card.name} →</span>
        {card.official && <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: '#1B5E20', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 5, padding: '1px 6px' }}>OFFICIAL</span>}
        {card.partner && <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: '#0D3B66', background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 5, padding: '1px 6px' }}>PARTNER</span>}
      </div>
      <div style={{ fontSize: 12, color: '#43526B', lineHeight: 1.5 }}>{card.desc}</div>
    </a>
  );
}

export default function TransitionCareerModule({ theme, profile }) {
  const isCivilian = profile?.component === 'DoD Civilian';
  const branch = profile?.branch || 'Army';
  const cool = coolFor(branch);
  const seed = String(profile?.gainingInstallation || '').trim();

  const [sub, setSub] = useState('jobs');
  const [location, setLocation] = useState('');
  const [localCat, setLocalCat] = useState('all');
  const [remoteCat, setRemoteCat] = useState('all');

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(LOCATION_KEY, null).then(v => {
      if (!mounted) return;
      if (typeof v === 'string' && v) setLocation(v);
      else if (seed) setLocation(seed);
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loc = location.trim();
  const onLoc = (v) => { setLocation(v); secureLocalStore.set(LOCATION_KEY, v); };

  const SUBS = [
    { id: 'jobs',      label: 'Job Search' },
    { id: 'sb-local',  label: 'SkillBridge' },
    { id: 'sb-remote', label: 'Remote SkillBridge' },
    { id: 'resources', label: 'Resources' },
  ];

  // Veteran-focused job-search links (location-aware). MOS/role keyword left
  // generic; the member can refine on the destination site.
  const jobLinks = [
    { name: 'USAJOBS — Veterans hiring (preference)', official: true, desc: 'Federal jobs with veterans’ preference and special hiring authorities (VRA, VEOA, 30% disabled).', url: 'https://www.usajobs.gov/help/working-in-government/unique-hiring-paths/veterans/' },
    { name: `USAJOBS — jobs${loc ? ` near ${loc}` : ''}`, desc: 'Current federal listings; filter by series, pay grade, agency, remote/telework.', url: `https://www.usajobs.gov/Search/Results?l=${enc(loc)}` },
    { name: 'DOL VETS — Veterans’ employment & American Job Centers', official: true, desc: 'DOL programs, local American Job Center network, and the Transition Employment workshop.', url: 'https://www.dol.gov/agencies/vets/veterans' },
    { name: 'Hiring Our Heroes', desc: 'Hiring events, fellowships, and employer connections for transitioning members and veterans.', url: 'https://www.hiringourheroes.org/' },
    { name: 'RecruitMilitary / military.com jobs', desc: 'Veteran-focused job board and career fairs.', url: 'https://recruitmilitary.com/' },
    { name: `LinkedIn — veteran job search${loc ? ` (${loc})` : ''}`, desc: 'LinkedIn offers a free 1-year Premium Career for veterans; search roles and recruiters.', url: `https://www.linkedin.com/jobs/search/?keywords=veteran&location=${enc(loc)}` },
    { name: `ClearanceJobs${loc ? ` — ${loc}` : ''}`, desc: 'If you hold a clearance, it’s a major asset — search clearance-required roles.', url: `https://www.clearancejobs.com/jobs?location=${enc(loc)}` },
  ];

  const resourceLinks = [
    { name: 'VR&E (Chapter 31) — Veteran Readiness & Employment', official: true, desc: 'Career counseling, training, and support if you have a service-connected disability.', url: 'https://www.va.gov/careers-employment/vocational-rehabilitation/' },
    { name: 'O*NET — Military (MOS/AFSC/rating) Crosswalk', official: true, desc: 'Translate your military occupation into matching civilian careers and keywords for your resume.', url: 'https://www.onetonline.org/crosswalk/MOC/' },
    { name: `${cool.name} — credentialing (COOL)`, official: true, desc: 'Map your military training to civilian licenses and certifications (and funding).', url: cool.url },
    { name: 'DOL Apprenticeship finder', official: true, desc: 'Registered apprenticeships (earn while you learn) nationwide.', url: 'https://www.apprenticeship.gov/apprenticeship-finder' },
    { name: 'VET TEC — high-tech training', official: true, desc: 'VA-funded technology bootcamps that don’t use GI Bill entitlement.', url: 'https://www.va.gov/education/about-gi-bill-benefits/how-to-use-benefits/vettec-high-tech-program/' },
    { name: 'USAJOBS — federal resume guidance', official: true, desc: 'How to build a federal resume and what to include (federal resumes differ from private-sector).', url: 'https://help.usajobs.gov/how-to/account/documents/resume' },
  ];

  return (
    <div className="pet-page">
      <div className="pet-header">
        <div>
          <div className="assistance-kicker">Career Center</div>
          <h2>Your Next Career</h2>
          <p>
            {isCivilian
              ? 'Job search, credentialing, and training resources for your move out of federal service.'
              : `Built for ${branch} members leaving the service: veteran job search, DoD SkillBridge (local + remote), credentialing, and training — tailored to your branch and destination.`}
          </p>
        </div>
      </div>

      {/* Eligibility note — SkillBridge is a service-member benefit (pre-separation). */}
      {!isCivilian && (
        <div style={{ background: '#EDF4FA', border: '1px solid #D7E0EA', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#0D3B66', letterSpacing: '.08em', marginBottom: 3 }}>SKILLBRIDGE ELIGIBILITY</div>
          <div style={{ fontSize: 12, color: '#43526B', lineHeight: 1.55 }}>
            DoD SkillBridge places you in a civilian-employer internship during your <strong>last up-to-180 days</strong> of service while you keep military pay and benefits. It requires <strong>unit commander approval</strong>. Start the request early — see the Transition Checklist for timing.
          </div>
        </div>
      )}

      <TabBar ariaLabel="Career Center sections">
        {SUBS.map(s => {
          const active = sub === s.id;
          return (
            <button
              key={s.id}
              id={`career-tab-${s.id}`}
              role="tab"
              aria-selected={active}
              data-active={active || undefined}
              onClick={() => setSub(s.id)}
              className={`pcs-tab ${active ? 'is-active' : ''}`}
              style={{ borderRadius: 999, padding: '8px 15px', border: `1.5px solid ${active ? theme.primary : '#D4DCE8'}`, background: active ? theme.primary : '#FFF', color: active ? '#FFF' : '#43526B', fontSize: 12, fontWeight: 700 }}
            >
              {s.label}
            </button>
          );
        })}
      </TabBar>

      <div role="tabpanel" id={`career-panel-${sub}`} aria-labelledby={`career-tab-${sub}`} style={{ marginTop: 14 }}>
        {/* Shared location box for job search + local SkillBridge. */}
        {(sub === 'jobs' || sub === 'sb-local') && (
          <section aria-label="Search location" style={{ background: '#F4F7FB', border: '1px solid #DCE4EE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <label htmlFor="career-location" style={{ display: 'block', fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.1em', marginBottom: 6 }}>
              WHERE ARE YOU HEADED?
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                id="career-location"
                value={location}
                onChange={(e) => onLoc(e.target.value)}
                placeholder="City, ST or ZIP (e.g. Austin, TX)"
                aria-label="Destination city and state"
                style={{ flex: 1, minWidth: 200, border: '1px solid #D7E0EA', borderRadius: 999, padding: '9px 16px', fontSize: 13, color: '#0D1821', background: '#FFFFFF' }}
              />
              {loc && (
                <button type="button" onClick={() => onLoc('')} aria-label="Clear location" style={{ border: '1px solid #D4DCE8', borderRadius: 999, background: '#FFF', color: '#43526B', fontSize: 12, fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>Clear</button>
              )}
            </div>
            <div style={{ fontSize: 11, color: loc ? '#176B6B' : '#56697C', fontWeight: loc ? 700 : 400, marginTop: 6 }}>
              {loc ? `✓ Tailoring results to ${loc}` : 'Enter your destination to tailor results.'}
            </div>
          </section>
        )}

        {sub === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobLinks.map(c => <ResultCard key={c.name} theme={theme} card={c} />)}
          </div>
        )}

        {sub === 'sb-local' && (
          <>
            <CategoryFilter theme={theme} value={localCat} onChange={setLocalCat} idPrefix="sb-local-cat" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {skillbridgeResults({ catId: localCat, location: loc, remote: false }).map((c, i) => <ResultCard key={`${c.name}-${i}`} theme={theme} card={c} />)}
            </div>
          </>
        )}

        {sub === 'sb-remote' && (
          <>
            <p style={{ fontSize: 12, color: '#43526B', margin: '0 0 12px' }}>Remote / virtual SkillBridge programs you can do from anywhere — useful if your final location isn’t set. Filter by field:</p>
            <CategoryFilter theme={theme} value={remoteCat} onChange={setRemoteCat} idPrefix="sb-remote-cat" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {skillbridgeResults({ catId: remoteCat, location: '', remote: true }).map((c, i) => <ResultCard key={`${c.name}-${i}`} theme={theme} card={c} />)}
            </div>
          </>
        )}

        {sub === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resourceLinks.map(c => <ResultCard key={c.name} theme={theme} card={c} />)}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: '#6B7A90', lineHeight: 1.5, marginTop: 16 }}>
        SkillBridge listings open the official DoD locator and targeted searches — PCS Express doesn’t host live openings or vet individual programs. Confirm eligibility, dates, and command approval on each official source.
      </p>
    </div>
  );
}
