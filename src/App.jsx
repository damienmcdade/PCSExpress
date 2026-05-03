import { useState, useEffect } from 'react'
import './App.css'
import EmploymentModule from './components/EmploymentModule'
import NavigationModule from './components/NavigationModule'
import EducationModule from './components/EducationModule'
import TranslationModule from './components/TranslationModule'
import ReligiousServicesModule from './components/ReligiousServicesModule'
import SpouseDeploymentGuide from './components/SpouseDeploymentGuide'
import { ALL_BASES } from './components/BaseMapModule'

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const BRANCH_THEMES = {
  Army: { primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B" },
  Navy: { primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B" },
  "Marine Corps": { primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B" },
  "Air Force": { primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8" },
  "Space Force": { primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0" },
  "Coast Guard": { primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00" },
};

// Use the comprehensive base list from BaseMapModule (100+ installations, CONUS + OCONUS)
const MILITARY_DUTY_STATIONS = ALL_BASES.map(b => ({
  name: b.name,
  state: b.state,
  branch: b.branch,
  ...(b.country ? { country: b.country } : {}),
}));

const INSTALLATION_SCHOOLS = {
  "Fort Liberty": [
    { name:"Douglas Byrd Middle School", grades:"6-8", rating:3.8, desc:"Title I school serving military and civilian families near Fort Liberty. Strong JROTC feeder program.", url:"https://www.ccs.k12.nc.us/douglas-byrd-middle", city:"Fayetteville, NC" },
    { name:"Terry Sanford High School", grades:"9-12", rating:4.1, desc:"IB programme available. Active military family support group. Strong sports programs.", url:"https://www.ccs.k12.nc.us/terry-sanford", city:"Fayetteville, NC" },
    { name:"Westover Hills Elementary", grades:"K-5", rating:4.0, desc:"High-performing elementary near post housing. Military family liaison on staff.", url:"https://www.ccs.k12.nc.us/westover-hills", city:"Fayetteville, NC" },
    { name:"Pines Level Middle School", grades:"6-8", rating:3.6, desc:"STEM focus, robotics club. Close to Bragg housing areas.", url:"https://www.hcps.net/pines-level", city:"Harnett County, NC" },
  ],
  "Camp Humphreys": [
    { name:"Humphreys Elementary School (DoDEA)", grades:"K-5", rating:4.5, desc:"DoD operated school on post. Serves USFK families. Fully accredited.", url:"https://www.dodea.edu/humphreys", city:"Camp Humphreys, South Korea" },
    { name:"Humphreys Middle School (DoDEA)", grades:"6-8", rating:4.4, desc:"DoDEA school with strong academic standards. Special education services available.", url:"https://www.dodea.edu/humphreys", city:"Camp Humphreys, South Korea" },
    { name:"Humphreys High School (DoDEA)", grades:"9-12", rating:4.3, desc:"AP courses available. Dual enrollment with community college. Sports and arts programs.", url:"https://www.dodea.edu/humphreys", city:"Camp Humphreys, South Korea" },
  ],
  "Fort Bragg": [
    { name:"Irwin Elementary School (DoDEA)", grades:"K-5", rating:4.4, desc:"DoDEA on-post school. Military family support built in.", url:"https://www.dodea.edu/ftbragg", city:"Fort Bragg, NC" },
    { name:"Longstreet Middle School (DoDEA)", grades:"6-8", rating:4.3, desc:"DoDEA school, STEM focus.", url:"https://www.dodea.edu/ftbragg", city:"Fort Bragg, NC" },
  ],
  "Joint Base Lewis-McChord": [
    { name:"Clover Park High School", grades:"9-12", rating:3.9, desc:"Large high school near JBLM. Military family support coordinator. IB program.", url:"https://www.cloverpark.k12.wa.us", city:"Lakewood, WA" },
    { name:"Mann Elementary School", grades:"K-5", rating:3.7, desc:"Strong military family enrollment. Before/after care available.", url:"https://www.cloverpark.k12.wa.us/mann", city:"Lakewood, WA" },
    { name:"Park Lodge Elementary", grades:"K-5", rating:4.0, desc:"High-rated elementary near JBLM main gate.", url:"https://www.cloverpark.k12.wa.us/parklodge", city:"University Place, WA" },
  ],
  "Fort Hood": [
    { name:"Killeen High School", grades:"9-12", rating:3.5, desc:"Largest high school near Fort Hood. JROTC program. Career technical programs.", url:"https://www.killeenisd.org/khs", city:"Killeen, TX" },
    { name:"Nolan Middle School", grades:"6-8", rating:3.8, desc:"STEM magnet program. Military family advocate on staff.", url:"https://www.killeenisd.org/nolan", city:"Killeen, TX" },
    { name:"Rancier Elementary", grades:"K-5", rating:3.9, desc:"High military enrollment. PTA very active with PCS support.", url:"https://www.killeenisd.org/rancier", city:"Killeen, TX" },
  ],
  "Fort Campbell": [
    { name:"Fort Campbell High School (DoDEA)", grades:"9-12", rating:4.2, desc:"On-post DoDEA school. Strong AP and athletics programs.", url:"https://www.dodea.edu/ftcampbell", city:"Fort Campbell, KY" },
    { name:"Mahaffey Middle School (DoDEA)", grades:"6-8", rating:4.1, desc:"On-post DoDEA school.", url:"https://www.dodea.edu/ftcampbell", city:"Fort Campbell, KY" },
    { name:"Wassom Middle School (DoDEA)", grades:"K-5", rating:4.3, desc:"On-post elementary.", url:"https://www.dodea.edu/ftcampbell", city:"Fort Campbell, KY" },
  ],
  "Fort Benning": [
    { name:"Benning Hills Elementary (DoDEA)", grades:"K-5", rating:4.2, desc:"On-post DoDEA elementary.", url:"https://www.dodea.edu/ftbenning", city:"Fort Benning, GA" },
    { name:"Baker Middle School", grades:"6-8", rating:3.7, desc:"Near Benning. ROTC prep focus.", url:"https://www.muscogee.k12.ga.us/baker", city:"Columbus, GA" },
    { name:"Hardaway High School", grades:"9-12", rating:3.8, desc:"Strong ROTC and athletics. Near main post.", url:"https://www.muscogee.k12.ga.us/hardaway", city:"Columbus, GA" },
  ],
  "Fort Sam Houston": [
    { name:"Sam Houston High School", grades:"9-12", rating:3.6, desc:"Near Fort Sam. JROTC program. Magnet programs available.", url:"https://www.saisd.net/samhouston", city:"San Antonio, TX" },
    { name:"Hirsch Elementary", grades:"K-5", rating:3.8, desc:"Near post housing areas.", url:"https://www.saisd.net", city:"San Antonio, TX" },
  ],
  "Naval Station Norfolk": [
    { name:"Norview High School", grades:"9-12", rating:3.6, desc:"Near NS Norfolk. NJROTC program. Navy family support.", url:"https://www.nps.k12.va.us/norview", city:"Norfolk, VA" },
    { name:"Tidewater Elementary", grades:"K-5", rating:3.9, desc:"High military enrollment. Near Chesapeake Bay area.", url:"https://www.nps.k12.va.us", city:"Norfolk, VA" },
    { name:"Granby High School", grades:"9-12", rating:3.8, desc:"IB programme. Strong arts program. Military family liaison.", url:"https://www.nps.k12.va.us/granby", city:"Norfolk, VA" },
  ],
  "Marine Corps Base Camp Lejeune": [
    { name:"Lejeune High School (DoDEA)", grades:"9-12", rating:4.1, desc:"On-post DoDEA school. Strong athletics and AP courses.", url:"https://www.dodea.edu/lejeune", city:"Camp Lejeune, NC" },
    { name:"Lejeune Middle School (DoDEA)", grades:"6-8", rating:4.0, desc:"On-post DoDEA school.", url:"https://www.dodea.edu/lejeune", city:"Camp Lejeune, NC" },
    { name:"Tarawa Terrace Elementary (DoDEA)", grades:"K-5", rating:4.2, desc:"On-post DoDEA elementary.", url:"https://www.dodea.edu/lejeune", city:"Camp Lejeune, NC" },
  ],
};

const VETERAN_OWNED_BUSINESSES = {
  "Fort Liberty": [
    { name:"Airborne & Special Operations Museum Store", category:"Retail/Museum", desc:"Veteran-owned gift shop at the Airborne Museum. Military memorabilia, books, and gear.", url:"https://www.asomf.org", icon:"🎖️" },
    { name:"Manna Church Café", category:"Food & Beverage", desc:"Veteran-run café supporting military families near Fort Liberty.", url:"https://mannachurch.org", icon:"☕" },
    { name:"All American Brewpub", category:"Restaurant", desc:"Veteran-owned brewery and restaurant. Offers military discounts.", url:"https://allamericanbrewpub.com", icon:"🍺" },
    { name:"Green Beret Fitness", category:"Fitness", desc:"Veteran-owned gym offering tactical fitness training near Fort Liberty.", url:"https://greenberetfitness.com", icon:"💪" },
  ],
  "Camp Humphreys": [
    { name:"Dragon Hill Lodge (MWR)", category:"Hospitality", desc:"Military-operated lodge on Camp Humphreys. Veteran-run staff.", url:"https://www.dragonhilllodge.com", icon:"🏨" },
    { name:"AAFES Shopette", category:"Retail", desc:"Exchange-operated veteran-supporting retail on post.", url:"https://www.shopmyexchange.com", icon:"🛒" },
  ],
  "Joint Base Lewis-McChord": [
    { name:"Lewis Army Museum Gift Shop", category:"Retail/Museum", desc:"Veteran-operated museum store. JBLM history and memorabilia.", url:"https://lewisarmymuseum.com", icon:"🎖️" },
    { name:"Warrior Sports (Veteran Owned)", category:"Sporting Goods", desc:"Veteran-owned outdoor and sporting goods near JBLM.", url:"https://warriorsports.com", icon:"⛺" },
    { name:"Freedom Fuel Coffee", category:"Coffee Shop", desc:"Veteran-owned specialty coffee roaster near Tacoma.", url:"https://freedomfuelcoffee.com", icon:"☕" },
  ],
  "Fort Hood": [
    { name:"Combat Fit Gym", category:"Fitness", desc:"Veteran-owned tactical fitness center near Fort Cavazos.", url:"https://combatfitgym.com", icon:"💪" },
    { name:"Killeen Veterans Business Alliance", category:"Network", desc:"Network of veteran-owned businesses near Fort Hood. Referrals and support.", url:"https://kvba.org", icon:"🤝" },
    { name:"Texas Veteran BBQ", category:"Restaurant", desc:"Veteran-owned BBQ restaurant, military discounts available.", url:"https://texasveteranbbq.com", icon:"🍖" },
  ],
  "Naval Station Norfolk": [
    { name:"Navy Exchange (NEX)", category:"Retail", desc:"Navy-operated retail supporting veteran businesses as vendors.", url:"https://www.mynavyexchange.com", icon:"🛒" },
    { name:"Hampton Roads Veteran Business Network", category:"Network", desc:"Regional network of veteran-owned businesses near Norfolk.", url:"https://hampton-roads.score.org", icon:"🤝" },
    { name:"Ocean View Brewing (Veteran Owned)", category:"Restaurant/Bar", desc:"Veteran-owned craft brewery with military discount program.", url:"https://oceanviewbrewing.com", icon:"🍺" },
  ],
};

const PCS_CHECKLIST = {
  "Orders Received": [
    "Request official PCS orders from unit S1",
    "Review orders for report date and gaining unit",
    "Make copies of orders (keep 10+)",
    "Notify current landlord/housing office",
    "Begin home sale or lease termination process",
    "Notify your chain of command",
  ],
  "90 Days Out": [
    "Schedule transportation appointment (TMO/PPPO)",
    "Create household goods inventory",
    "Research gaining installation housing options",
    "Apply for on-post housing at gaining installation",
    "Research schools for children",
    "Update vehicle registrations and insurance",
    "Arrange POV shipment if going OCONUS",
    "Begin passport/visa process if going OCONUS",
  ],
  "60 Days Out": [
    "Schedule medical/dental appointments",
    "Obtain medical and dental records",
    "Update SGLI and beneficiary info",
    "Obtain school records for children",
    "Notify financial institutions of address change",
    "Begin decluttering for household move",
    "Research employment opportunities at gaining installation",
    "Connect with gaining unit Family Readiness Group",
  ],
  "30 Days Out": [
    "Confirm pack-out dates with moving company",
    "Arrange lodging for travel days",
    "Notify DEERS of upcoming move",
    "Forward mail via USPS",
    "Cancel or transfer local subscriptions/utilities",
    "Settle any outstanding debts locally",
    "Prepare vehicles for long-distance travel",
    "Pack personal bag for travel (do not ship)",
  ],
  "Move Week": [
    "Be present for household goods pack-out",
    "Verify all items on inventory sheet",
    "Photograph all rooms before departure",
    "Do final walkthrough of residence",
    "Return keys, base decals, and library books",
    "Pick up cleared documents from unit",
    "Ensure pets have travel documentation",
    "Check weather and route for travel day",
  ],
  "In-Processing": [
    "Report to gaining unit by report date",
    "Complete in-processing checklist",
    "Obtain new base access credentials/decal",
    "Set up bank account or update address at bank",
    "Register children in schools",
    "Transfer vehicles to new state registration",
    "Set up new utilities",
    "Schedule household goods delivery",
    "Update ID cards if expiring",
    "Register with new installation medical (MTF)",
  ],
};

const SCHOOL_DISTRICTS = {
  'Fort Liberty NC': { name: 'Cumberland County Schools', ages: 'K-12', rating: 4.5 },
  'Naval Station Norfolk VA': { name: 'Norfolk Public Schools', ages: 'K-12', rating: 4.3 },
  'Camp Pendleton CA': { name: 'Oceanside Unified', ages: 'K-12', rating: 4.6 },
};

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#F59E0B', fontSize: 13 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function ChecklistTab({ theme, profile, checklistItems, setChecklistItems }) {
  const [activePhase, setActivePhase] = useState(Object.keys(PCS_CHECKLIST)[0]);

  const daysUntil = getDaysUntilDeparture(profile?.departingDate);

  const toggleCheckItem = (phase, idx) => {
    const key = `${phase}-${idx}`;
    setChecklistItems(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('pcs_checklist_checks', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const allTasks = Object.entries(PCS_CHECKLIST).flatMap(([phase, tasks]) => tasks.map((_, i) => `${phase}-${i}`));
  const done = allTasks.filter(k => checklistItems[k]).length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  const phaseIsOverdue = daysUntil !== null && PHASE_WINDOWS[activePhase] && daysUntil < PHASE_WINDOWS[activePhase].overdueAt;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 16 }}>PCS Checklist</div>

      {/* Overdue warning banner */}
      {phaseIsOverdue && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #EF9A9A', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#C62828' }}>"{activePhase}" Phase is Past Due</div>
            <div style={{ fontSize: 11, color: '#B71C1C', marginTop: 2 }}>Incomplete tasks are highlighted — complete them immediately.</div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ background: '#FFFFFF', border: `2px solid ${theme.accent}40`, borderRadius: 14, padding: '14px 22px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>Overall Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888' }}>{done}/{allTasks.length} tasks</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: pct === 100 ? '#2E7D32' : theme.accent }}>{pct}%</span>
            {pct === 100 && <span style={{ fontSize: 11, fontWeight: 700, background: '#2E7D32', color: '#FFF', borderRadius: 6, padding: '2px 8px' }}>COMPLETE</span>}
          </div>
        </div>
        <div style={{ height: 10, background: '#E0E0E0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#2E7D32' : theme.accent, borderRadius: 10, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#BBB' }}>
          <span>Orders Received</span><span>In Progress</span><span>Move Complete</span>
        </div>
        {daysUntil !== null && (
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: daysUntil < 0 ? '#C62828' : daysUntil < 30 ? '#E65100' : '#56697C', textAlign: 'center' }}>
            {daysUntil < 0 ? `${Math.abs(daysUntil)}d since departure` : `${daysUntil} days until departure`}
          </div>
        )}
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.keys(PCS_CHECKLIST).map(phase => {
          const phaseTasks = PCS_CHECKLIST[phase].map((_, i) => `${phase}-${i}`);
          const phaseDone = phaseTasks.filter(k => checklistItems[k]).length;
          const phaseOverdue = daysUntil !== null && PHASE_WINDOWS[phase] && daysUntil < PHASE_WINDOWS[phase].overdueAt && phaseDone < phaseTasks.length;
          return (
            <button key={phase} onClick={() => setActivePhase(phase)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${phaseOverdue ? '#EF9A9A' : activePhase === phase ? theme.primary : '#E0E6EE'}`, background: activePhase === phase ? theme.primary : phaseOverdue ? '#FFF5F5' : '#FFF', color: activePhase === phase ? '#FFF' : phaseOverdue ? '#C62828' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: phaseOverdue || activePhase === phase ? 800 : 700, whiteSpace: 'nowrap' }}>
              {phaseOverdue ? '⚠ ' : ''}{phase} ({phaseDone}/{phaseTasks.length})
            </button>
          );
        })}
      </div>

      {/* Tasks */}
      <div>
        {PCS_CHECKLIST[activePhase].map((task, i) => {
          const checked = !!checklistItems[`${activePhase}-${i}`];
          const taskOverdue = phaseIsOverdue && !checked;
          return (
            <div key={i} onClick={() => toggleCheckItem(activePhase, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, background: checked ? '#E8F5E9' : taskOverdue ? '#FFF5F5' : '#FFFFFF', border: `1px solid ${checked ? '#A5D6A7' : taskOverdue ? '#FFCDD2' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#2E7D32' : taskOverdue ? '#E57373' : theme.accent}`, background: checked ? '#2E7D32' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {checked && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: checked ? '#888' : taskOverdue ? '#C62828' : theme.primary, textDecoration: checked ? 'line-through' : 'none', fontWeight: checked ? 400 : 600, lineHeight: 1.4 }}>{task}</span>
                {taskOverdue && <div style={{ fontSize: 10, color: '#E57373', fontWeight: 800, marginTop: 3 }}>PAST DUE — Complete immediately</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SchoolsTab({ theme, profile }) {
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const schools = INSTALLATION_SCHOOLS[instName] || [];
  const childAges = (profile?.childrenAges || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  const gradeForAge = age => {
    if (age < 5) return 'Pre-K';
    if (age <= 10) return 'K-5';
    if (age <= 13) return '6-8';
    return '9-12';
  };

  const relevantGrades = new Set(childAges.map(gradeForAge));
  const filtered = childAges.length > 0
    ? schools.filter(s => [...relevantGrades].some(g => {
        if (g === 'Pre-K') return false;
        const [gStart] = g.split('-');
        return s.grades.includes(gStart) || s.grades === g;
      }))
    : schools;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Schools & Districts</div>
      {instName ? (
        <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>
          Near <strong>{instName}</strong>
          {childAges.length > 0 && ` • Filtered for ages: ${childAges.join(', ')}`}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Complete onboarding to see schools near your installation.</div>
      )}

      {filtered.length === 0 && (
        <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>
          No school data available for this installation yet. Check back soon.
        </div>
      )}

      {filtered.map((school, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{school.name}</div>
            <span style={{ background: `${theme.primary}20`, color: theme.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>Grades {school.grades}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <StarRating rating={school.rating} />
          </div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{school.desc}</div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>📍 {school.city}</div>
          <a href={school.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '9px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>
            Visit School Website
          </a>
        </div>
      ))}

      {childAges.length > 0 && filtered.length < schools.length && (
        <button onClick={() => {}} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.accent}`, background: 'transparent', color: theme.primary, fontSize: 12, cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
          Show all {schools.length} schools regardless of age
        </button>
      )}
    </div>
  );
}

function VeteranBusinessesTab({ theme, profile }) {
  const [filter, setFilter] = useState('All');
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const localBiz = VETERAN_OWNED_BUSINESSES[instName] || [];
  const categories = ['All', ...new Set(localBiz.map(b => b.category))];
  const filtered = filter === 'All' ? localBiz : localBiz.filter(b => b.category === filter);

  const NATIONAL_DIRS = [
    { name: 'Veteran-Owned Business Directory', icon: '🇺🇸', desc: 'Search thousands of verified veteran-owned businesses by location and category.', url: 'https://veteranownedbusiness.com' },
    { name: 'SBA Veteran Business Outreach', icon: '🏛️', desc: 'Free counseling, training, and procurement opportunities for veteran entrepreneurs.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses' },
    { name: 'V-WISE (Women Vets)', icon: '💪', desc: 'SBA program specifically supporting women veteran business owners.', url: 'https://www.sba.gov/vwise' },
    { name: 'Hire Heroes USA', icon: '✈️', desc: 'Free job placement and career coaching for veterans and military spouses.', url: 'https://www.hireheroesusa.org' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Veteran Businesses</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>
        {instName ? <>Local businesses near <strong>{instName}</strong></> : 'Complete onboarding to see businesses near your installation.'}
      </div>

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

      {/* Category filter */}
      {localBiz.length > 0 && categories.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 16, border: `1.5px solid ${filter === cat ? theme.primary : '#E0E6EE'}`, background: filter === cat ? theme.primary : '#FFF', color: filter === cat ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Local listings */}
      {localBiz.length === 0 && (
        <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>No local listings yet for this installation</div>
          <div style={{ fontSize: 11, color: '#888' }}>Use the national directories above to find veteran-owned businesses in your area.</div>
        </div>
      )}

      {filtered.map((biz, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{biz.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{biz.name}</div>
              <span style={{ background: '#F3F4F6', color: '#56697C', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{biz.category}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{biz.desc}</div>
          <a href={biz.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '9px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>
            Visit Website
          </a>
        </div>
      ))}
    </div>
  );
}

function EducationBenefitsTab({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('gibill');

  const GI_BILL_CHAPTERS = [
    {
      chapter: "Chapter 33",
      name: "Post-9/11 GI Bill",
      who: "Veterans who served 90+ days after 9/11/2001",
      benefits: ["Tuition paid directly to school (100% for in-state public)", "Monthly housing allowance (BAH E-5 with dependents rate)", "Up to $1,000/yr books & supplies stipend", "Transferable to dependents (with qualifying service)"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: true,
    },
    {
      chapter: "Chapter 30",
      name: "Montgomery GI Bill (MGIB-AD)",
      who: "Active duty veterans who paid into the program ($1,200 contribution)",
      benefits: ["Monthly stipend paid to you directly", "Up to 36 months of benefits", "Must be enrolled at least half-time"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: false,
    },
    {
      chapter: "Chapter 35",
      name: "Survivors' & Dependents' Educational Assistance",
      who: "Dependents of veterans who are permanently disabled or died in service",
      benefits: ["Monthly stipend for full-time enrollment", "Up to 45 months of benefits", "Career & vocational training included"],
      apply: "https://www.va.gov/education/survivor-dependent-education-assistance/",
      best: false,
    },
    {
      chapter: "Chapter 1606",
      name: "Montgomery GI Bill — Selected Reserve",
      who: "National Guard and Reserve members who have 6-year commitment",
      benefits: ["Monthly payment for college, tech school, distance learning", "Up to 36 months of benefits"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: false,
    },
  ];

  const HOW_TO_STEPS = [
    { step: 1, title: "Apply on VA.gov", desc: "Go to va.gov/education/how-to-apply and complete VA Form 22-1990. You'll need your DD-214 or current service info." },
    { step: 2, title: "Receive Certificate of Eligibility", desc: "VA will mail your COE in 4-6 weeks. This shows your school exactly what benefits you have. Upload it to eBenefits or keep a copy." },
    { step: 3, title: "Notify School Certifying Official (SCO)", desc: "Every college has an SCO (usually in the Registrar or Veterans Affairs office). They certify your enrollment to VA each semester." },
    { step: 4, title: "Understand BAH (Ch.33)", desc: "If using Post-9/11, your monthly housing allowance is based on the ZIP code of your school's main campus. Online-only students get 50% of national average BAH." },
    { step: 5, title: "Track Benefits Usage", desc: "Log into va.gov/education/check-remaining-entitlement to see how many months remain. You have a 15-year limit from separation (Ch.33)." },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Education Benefits</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>GI Bill guide for service members & veterans</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ id: 'gibill', label: 'GI Bill Chapters' }, { id: 'howto', label: 'How to Apply' }, { id: 'schools', label: 'Find Schools' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`, background: activeTab === t.id ? theme.primary : '#FFF', color: activeTab === t.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'gibill' && (
        <div>
          {GI_BILL_CHAPTERS.map((ch, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: `1px solid ${ch.best ? theme.accent : '#E0E6EE'}`, borderLeft: `3px solid ${ch.best ? theme.accent : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#888' }}>Chapter {ch.chapter}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821' }}>{ch.name}</div>
                </div>
                {ch.best && <span style={{ background: theme.accent, color: theme.secondary, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>MOST COMMON</span>}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10, fontStyle: 'italic' }}>{ch.who}</div>
              {ch.benefits.map((b, i) => (
                <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>✓ {b}</div>
              ))}
              <a href={ch.apply} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 10, padding: '8px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>Apply Online</a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'howto' && (
        <div>
          {HOW_TO_STEPS.map((s) => (
            <div key={s.step} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.primary, color: '#FFF', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
          <a href="https://www.va.gov/education/how-to-apply/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
            Start Application on VA.gov
          </a>
        </div>
      )}

      {activeTab === 'schools' && (
        <div>
          <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            Use the links below to find VA-approved schools. Make sure any school you attend is on the VA's approved programs list.
          </div>
          {[
            { name: "VA Comparison Tool", desc: "Compare GI Bill benefits at specific schools — see tuition, BAH rates, and ratings.", url: "https://www.va.gov/gi-bill-comparison-tool/" },
            { name: "GoArmyEd / MyArmyBenefits", desc: "Army-specific portal for tuition assistance and education counseling.", url: "https://www.goarmyed.com" },
            { name: "DANTES (DSST Exams)", desc: "Free college-level subject exams for service members — earn college credit.", url: "https://www.dantes.mil" },
            { name: "Troops to Teachers", desc: "Transition into teaching with VA support programs.", url: "https://www.proudtoserveagain.com" },
            { name: "eBenefits Portal", desc: "Manage all VA education benefits and check remaining entitlement.", url: "https://www.ebenefits.va.gov" },
          ].map((r, idx) => (
            <div key={idx} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>Open Resource →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Phase timeline windows (days relative to departure) ──────────────────
const PHASE_WINDOWS = {
  'Orders Received': { activeAt: 999, overdueAt: 90 },
  '90 Days Out':     { activeAt: 90,  overdueAt: 60 },
  '60 Days Out':     { activeAt: 60,  overdueAt: 30 },
  '30 Days Out':     { activeAt: 30,  overdueAt: 7  },
  'Move Week':       { activeAt: 7,   overdueAt: 0  },
  'In-Processing':   { activeAt: 0,   overdueAt: -30 },
};

function getDaysUntilDeparture(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + 'T12:00:00') - new Date();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function OrdersTab({ theme, profile }) {
  const [orders, setOrders] = useState(() => store.get('pcs_orders') || null);
  const [mode, setMode] = useState('view');
  const [form, setForm] = useState({
    ordersNumber: '',
    reportDate: profile?.departingDate || '',
    gainingUnit: profile?.unit || '',
    gainingInstallation: profile?.gainingInstallation || '',
    losingInstallation: profile?.losingInstallation || '',
    authorizedDependents: profile?.hasDependents ?? false,
    tdyEnRoute: false,
    tdyLocation: '',
    pcsAllowances: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const saveOrders = (data) => {
    const saved = { ...data, savedAt: new Date().toISOString() };
    setOrders(saved);
    store.set('pcs_orders', saved);
    setMode('view');
    setUploadMsg('');
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('Reading file…');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target.result || '';
      // Extract printable ASCII strings — captures text from text-based PDFs
      const readable = (raw.match(/[ -~\n\r\t]{8,}/g) || []).join(' ');
      if (readable.length < 50) {
        setUploadMsg('Could not extract text. Please fill in the fields below.');
        setUploading(false);
        setMode('manual');
        return;
      }
      setUploadMsg('Analyzing orders with AI…');
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: 'Parse U.S. military PCS orders text. Return ONLY valid JSON, no other text: {"ordersNumber":"","reportDate":"YYYY-MM-DD or null","gainingUnit":"","gainingInstallation":"","losingInstallation":"","authorizedDependents":true,"tdyEnRoute":false,"tdyLocation":"","pcsAllowances":""}',
            user: readable.slice(0, 3500),
          }),
        });
        if (res.ok) {
          const { text } = await res.json();
          const match = text.match(/\{[\s\S]*?\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              setForm(prev => ({
                ...prev,
                ordersNumber: parsed.ordersNumber || prev.ordersNumber,
                reportDate: parsed.reportDate || prev.reportDate,
                gainingUnit: parsed.gainingUnit || prev.gainingUnit,
                gainingInstallation: parsed.gainingInstallation || prev.gainingInstallation,
                losingInstallation: parsed.losingInstallation || prev.losingInstallation,
                authorizedDependents: parsed.authorizedDependents ?? prev.authorizedDependents,
                tdyEnRoute: parsed.tdyEnRoute ?? prev.tdyEnRoute,
                tdyLocation: parsed.tdyLocation || prev.tdyLocation,
                pcsAllowances: parsed.pcsAllowances || prev.pcsAllowances,
              }));
              setUploadMsg('Orders analyzed — review fields below and save.');
            } catch {
              setUploadMsg('Partially parsed. Fill in any missing fields below.');
            }
          } else {
            setUploadMsg('AI response unclear. Fill in fields manually.');
          }
        } else {
          setUploadMsg('AI unavailable. Enter fields manually below.');
        }
      } catch {
        setUploadMsg('Could not reach server. Enter fields manually.');
      }
      setUploading(false);
      setMode('manual');
    };
    reader.readAsText(file, 'utf-8');
  };

  const daysUntil = orders?.reportDate ? getDaysUntilDeparture(orders.reportDate) : null;

  const fieldSt = {
    width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 8,
    border: '1px solid #CBD5E1', background: '#F8FAFC',
    color: '#0D1821', outline: 'none', boxSizing: 'border-box',
  };
  const labelSt = { fontSize: 11, fontWeight: 700, color: theme.primary, display: 'block', marginBottom: 5 };
  const InfoRow = ({ label, value }) => !value ? null : (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #F5F5F5', fontSize: 12 }}>
      <span style={{ color: '#888', fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{label}</span>
      <span style={{ color: '#0D1821', fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Military Orders</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>Upload your PCS orders to track timelines and deadlines automatically</div>

      {/* No orders: upload prompt */}
      {mode === 'view' && !orders && (
        <div style={{ background: theme.secondary, borderRadius: 14, padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Upload Your PCS Orders</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.5 }}>
            Upload your orders PDF to automatically extract key dates, unit info, and report deadlines.
          </div>
          <label style={{ display: 'block', padding: '12px', borderRadius: 10, background: theme.accent, color: theme.secondary, fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
            {uploading ? 'Reading…' : '📎 Select Orders File (PDF / Image)'}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {uploadMsg && <div style={{ fontSize: 12, color: theme.accent, marginBottom: 10 }}>{uploadMsg}</div>}
          <button onClick={() => setMode('manual')} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Enter Orders Manually
          </button>
        </div>
      )}

      {/* Orders on file: summary + timeline */}
      {mode === 'view' && orders && (
        <>
          {daysUntil !== null && (
            <div style={{ background: daysUntil < 0 ? '#FFEBEE' : daysUntil < 14 ? '#FFF3E0' : '#E8F5E9', border: `2px solid ${daysUntil < 0 ? '#EF9A9A' : daysUntil < 14 ? '#FFB74D' : '#A5D6A7'}`, borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 28 }}>{daysUntil < 0 ? '📍' : daysUntil < 14 ? '⚡' : '📅'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: daysUntil < 0 ? '#C62828' : daysUntil < 14 ? '#E65100' : '#1B5E20' }}>
                  {daysUntil < 0 ? `${Math.abs(daysUntil)} days since report date` : daysUntil === 0 ? 'Report date is TODAY' : `${daysUntil} days to report date`}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>Report NLT: {orders.reportDate}</div>
              </div>
            </div>
          )}

          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>Orders on File</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <label style={{ padding: '5px 10px', borderRadius: 7, background: `${theme.primary}15`, color: theme.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📎 Update
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={handleFile} style={{ display: 'none' }} />
                </label>
                <button onClick={() => { setForm({ ...orders }); setMode('manual'); }} style={{ padding: '5px 10px', borderRadius: 7, background: `${theme.primary}15`, color: theme.primary, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
            <InfoRow label="Orders Number" value={orders.ordersNumber} />
            <InfoRow label="Report NLT" value={orders.reportDate} />
            <InfoRow label="Gaining Unit" value={orders.gainingUnit} />
            <InfoRow label="Gaining Installation" value={orders.gainingInstallation} />
            <InfoRow label="Losing Installation" value={orders.losingInstallation} />
            <InfoRow label="Dependents Auth" value={orders.authorizedDependents ? '✓ Yes' : 'No'} />
            <InfoRow label="TDY En Route" value={orders.tdyEnRoute ? `✓ Yes${orders.tdyLocation ? ` — ${orders.tdyLocation}` : ''}` : 'No'} />
            <InfoRow label="Allowances" value={orders.pcsAllowances} />
          </div>

          {orders.reportDate && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 12 }}>PCS Phase Timeline</div>
              {Object.entries(PHASE_WINDOWS).map(([phase, win]) => {
                const phaseDate = new Date(orders.reportDate + 'T12:00:00');
                phaseDate.setDate(phaseDate.getDate() + win.overdueAt);
                const isPast = new Date() > phaseDate;
                const isActive = daysUntil !== null && daysUntil <= win.activeAt && daysUntil >= win.overdueAt;
                return (
                  <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isPast ? '#A5D6A7' : isActive ? theme.accent : '#E0E6EE', flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: isPast ? '#555' : isActive ? theme.primary : '#AAA', fontWeight: isActive ? 800 : 400, flex: 1 }}>{phase}</div>
                    <div style={{ fontSize: 10, color: '#AAA' }}>{win.overdueAt >= 0 ? `${win.overdueAt}d before` : `${Math.abs(win.overdueAt)}d after`}</div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => { setOrders(null); store.set('pcs_orders', null); }} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid #FFCDD2', color: '#C62828', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Remove Orders
          </button>
        </>
      )}

      {/* Manual entry / edit form */}
      {mode === 'manual' && (
        <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821', marginBottom: 12 }}>
            {uploadMsg ? '📋 Review Extracted Data' : 'Orders Information'}
          </div>
          {uploadMsg && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#1D4ED8' }}>
              {uploadMsg}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>ORDERS NUMBER</label>
            <input value={form.ordersNumber} onChange={e => upd('ordersNumber', e.target.value)} placeholder="e.g. ORDERS 123-01" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>REPORT NLT DATE</label>
            <input type="date" value={form.reportDate} onChange={e => upd('reportDate', e.target.value)} style={{ ...fieldSt, colorScheme: 'light' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>GAINING UNIT</label>
            <input value={form.gainingUnit} onChange={e => upd('gainingUnit', e.target.value)} placeholder="e.g. 2-7 Infantry, 1st Cav" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>GAINING INSTALLATION</label>
            <input value={form.gainingInstallation} onChange={e => upd('gainingInstallation', e.target.value)} placeholder="e.g. Fort Liberty" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>LOSING INSTALLATION</label>
            <input value={form.losingInstallation} onChange={e => upd('losingInstallation', e.target.value)} placeholder="e.g. Fort Carson" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>PCS ALLOWANCES / ENTITLEMENTS</label>
            <input value={form.pcsAllowances} onChange={e => upd('pcsAllowances', e.target.value)} placeholder="e.g. DPS authorized, PPM, TLE" style={fieldSt} />
          </div>
          {[['authorizedDependents', 'Dependents authorized to travel'], ['tdyEnRoute', 'TDY en route authorized']].map(([key, label]) => (
            <div key={key} onClick={() => upd(key, !form[key])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #F0F4F8', cursor: 'pointer' }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${form[key] ? theme.primary : '#CBD5E1'}`, background: form[key] ? theme.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {form[key] && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: '#0D1821', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
          {form.tdyEnRoute && (
            <div style={{ marginTop: 10, marginBottom: 4 }}>
              <label style={labelSt}>TDY LOCATION</label>
              <input value={form.tdyLocation} onChange={e => upd('tdyLocation', e.target.value)} placeholder="e.g. Fort Lee, VA" style={fieldSt} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setMode('view'); setUploadMsg(''); }} style={{ padding: '11px 16px', borderRadius: 10, background: '#F0F4F8', border: 'none', color: '#56697C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => saveOrders(form)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: theme.primary, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save Orders</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onboarding constants ──────────────────────────────────────────────────
const COMPONENT_TYPES = ['Active Duty', 'Reserve', 'National Guard', 'AGR', 'FTNG'];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',              native: 'English'    },
  { code: 'es', name: 'Spanish',              native: 'Español'    },
  { code: 'de', name: 'German',               native: 'Deutsch'    },
  { code: 'fr', name: 'French',               native: 'Français'   },
  { code: 'ko', name: 'Korean',               native: '한국어'       },
  { code: 'ja', name: 'Japanese',             native: '日本語'       },
  { code: 'tl', name: 'Tagalog',              native: 'Tagalog'    },
  { code: 'ar', name: 'Arabic',               native: 'العربية'     },
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文'        },
  { code: 'it', name: 'Italian',              native: 'Italiano'   },
  { code: 'pt', name: 'Portuguese',           native: 'Português'  },
  { code: 'vi', name: 'Vietnamese',           native: 'Tiếng Việt' },
];

const RELIGIOUS_PREFERENCES = [
  'No Preference', 'Protestant / Christian', 'Catholic', 'Orthodox Christian',
  'Jewish', 'Muslim / Islam', 'Buddhist', 'Hindu',
  'Sikh', 'LDS / Mormon', 'Unitarian Universalist',
  'Prefer not to say', 'Other',
];

const INSTALLATION_UNITS = {
  'Fort Liberty': {
    Army: ['XVIII Airborne Corps', '82nd Airborne Division', '1st Special Forces Command', '525th Expeditionary Military Intelligence Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Campbell': {
    Army: ['101st Airborne Division (Air Assault)', 'Special Operations Command Central', '5th Special Forces Group'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Hood': {
    Army: ['III Corps', '1st Cavalry Division', '3rd Cavalry Regiment', '13th Sustainment Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Cavazos': {
    Army: ['III Corps', '1st Cavalry Division', '3rd Cavalry Regiment', '13th Sustainment Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Lewis-McChord': {
    Army: ['I Corps', '7th Infantry Division', '2nd Infantry Division', '62nd Airlift Wing'],
    'Air Force': ['62nd Airlift Wing', '446th Airlift Wing'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Carson': {
    Army: ['4th Infantry Division', 'U.S. Army Space and Missile Defense Command', '10th Special Forces Group'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Bliss': {
    Army: ['1st Armored Division', '32nd Army Air and Missile Defense Command', '46th Military Police Command'],
    'Air Force': ['Air Defense Artillery Center of Excellence'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Drum': {
    Army: ['10th Mountain Division', 'Fort Drum Garrison'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Sill': {
    Army: ['Fires Center of Excellence', '75th Field Artillery Brigade', '31st Air Defense Artillery Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Norfolk': {
    Navy: ['U.S. Fleet Forces Command', 'Naval Station Norfolk', 'Carrier Strike Groups', 'Naval Air Force Atlantic'],
    'Marine Corps': ['2nd Marine Aircraft Wing'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base San Diego': {
    Navy: ['Navy Region Southwest', 'Third Fleet', 'Carrier Strike Groups', 'Submarine Forces'],
    'Marine Corps': ['1st Marine Division', '3rd Marine Expeditionary Force'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Marine Corps Base Camp Lejeune': {
    'Marine Corps': ['2nd Marine Division', 'II Marine Expeditionary Force', '2nd Marine Logistics Group'],
    Navy: ['Naval Medical Center Camp Lejeune'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Pendleton': {
    'Marine Corps': ['1st Marine Division', 'I Marine Expeditionary Force', 'Marine Aircraft Group 16'],
    Navy: ['Naval Hospital Camp Pendleton'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Humphreys': {
    Army: ['U.S. Forces Korea', '8th Army', '2nd Infantry Division', '19th Expeditionary Sustainment Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Ramstein Air Base': {
    'Air Force': ['U.S. Air Forces in Europe (USAFE)', '86th Airlift Wing', '521st Air Mobility Operations Wing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Kadena Air Base': {
    'Air Force': ['18th Wing', '353rd Special Operations Wing', '5th Air Force'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Yokota Air Base': {
    'Air Force': ['374th Airlift Wing', '5th Air Force', 'U.S. Forces Japan'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Pearl Harbor-Hickam': {
    Navy: ['U.S. Pacific Fleet', 'Naval Station Pearl Harbor'],
    'Air Force': ['15th Wing', 'Pacific Air Forces'],
    Army: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Eglin AFB': {
    'Air Force': ['Air Force Materiel Command', '96th Test Wing', '33rd Fighter Wing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MacDill AFB': {
    'Air Force': ['6th Air Refueling Wing', 'U.S. Central Command (CENTCOM)', 'U.S. Special Operations Command (SOCOM)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
};

const DEMO_PROFILE = {
  firstName: 'Marcus', lastName: 'Thompson',
  branch: 'Army', component: 'Active Duty', paygrade: 'E-7',
  losingInstallation: 'Fort Liberty', gainingInstallation: 'Camp Humphreys',
  departingDate: '2026-06-15',
  unit: '8th Army',
  isOverseas: true, hasDependents: true, hasChildren: true,
  childAges: [14, 11, 8], bedrooms: '4',
  language: 'en', religiousPreference: 'Protestant / Christian',
};

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [losingSearch, setLosingSearch] = useState('');
  const [gainingSearch, setGainingSearch] = useState('');
  const [p, setP] = useState({
    firstName: '', lastName: '', branch: 'Army', component: 'Active Duty', paygrade: 'E-5',
    losingInstallation: '', gainingInstallation: '', departingDate: '', unit: '',
    isOverseas: false, hasDependents: false, hasChildren: false, childAges: [], bedrooms: '3',
    language: 'en', religiousPreference: 'No Preference',
  });

  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const updBranch = (branch) => setP(prev => ({ ...prev, branch, unit: '' }));
  const updGaining = (name) => {
    const sel = MILITARY_DUTY_STATIONS.find(s => s.name === name);
    setP(prev => ({ ...prev, gainingInstallation: name, unit: '', isOverseas: sel?.country ? true : false }));
  };

  const theme = BRANCH_THEMES[p.branch];

  const losingSuggestions = losingSearch.length > 1
    ? MILITARY_DUTY_STATIONS.filter(b => b.name.toLowerCase().includes(losingSearch.toLowerCase())).slice(0, 7)
    : [];
  const gainingSuggestions = gainingSearch.length > 1
    ? MILITARY_DUTY_STATIONS.filter(b => b.name.toLowerCase().includes(gainingSearch.toLowerCase())).slice(0, 7)
    : [];
  const availableUnits = p.gainingInstallation
    ? (INSTALLATION_UNITS[p.gainingInstallation]?.[p.branch] || [])
    : [];

  const inputSt = {
    width: '100%', fontSize: 14, padding: '11px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)',
    color: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
  };
  const canGo1 = p.firstName && p.branch && p.paygrade && p.component;
  const canGo2 = p.gainingInstallation && p.departingDate;

  const SuggestionList = ({ items, onSelect }) => items.length === 0 ? null : (
    <div style={{ marginTop: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 10, maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.12)' }}>
      {items.map(b => (
        <div key={b.name} onClick={() => onSelect(b.name)} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          {b.name} — {b.state} <span style={{ fontSize: 11, color: theme.accent }}>({b.branch})</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: theme.secondary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ padding: 'env(safe-area-inset-top) 0 0', background: theme.secondary }}>
        <div style={{ padding: '20px 16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: '.05em' }}>PCS EXPRESS</div>
          <div style={{ fontSize: 12, color: theme.accent, marginTop: 4 }}>Your move, simplified.</div>
        </div>
        {/* Progress dots */}
        {step >= 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i <= step ? theme.accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '0 16px 24px', overflowY: 'auto' }}>
        <div style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', padding: '20px 16px' }}>

          {/* Demo / preview step */}
          {step === -1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>See PCS Express in Action</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  An E-7 Army soldier with 3 kids managing an overseas move to South Korea — showcasing all app features.
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 10, letterSpacing: '.1em' }}>DEMO PROFILE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Rank', 'E-7 (SFC)'], ['Branch', 'Army'], ['Family', '3 Children'], ['Move', 'OCONUS'], ['From', 'Fort Liberty, NC'], ['To', 'Camp Humphreys, SK']].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => onComplete(DEMO_PROFILE)} style={{ padding: '13px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Launch Demo</button>
                <button onClick={() => setStep(0)} style={{ padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>My Profile</button>
              </div>
            </>
          )}

          {/* Step 0 — Branch & Profile */}
          {step === 0 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Branch & Profile</div>

              {/* Branch buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {Object.keys(BRANCH_THEMES).map(b => {
                  const t = BRANCH_THEMES[b];
                  const active = p.branch === b;
                  return (
                    <button key={b} onClick={() => updBranch(b)} style={{ padding: '11px 4px', borderRadius: 10, border: `2px solid ${active ? t.accent : 'rgba(255,255,255,0.15)'}`, background: active ? `${t.accent}30` : 'rgba(255,255,255,0.04)', color: active ? t.accent : 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: active ? 800 : 500, cursor: 'pointer', lineHeight: 1.3, textAlign: 'center' }}>
                      {b}
                    </button>
                  );
                })}
              </div>

              {/* Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>FIRST NAME</label>
                  <input value={p.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Jordan" style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>LAST NAME</label>
                  <input value={p.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Rivera" style={inputSt} />
                </div>
              </div>

              {/* Component */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>COMPONENT</label>
                <select value={p.component} onChange={e => upd('component', e.target.value)} style={inputSt}>
                  {COMPONENT_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Pay grade */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>PAY GRADE</label>
                <select value={p.paygrade} onChange={e => upd('paygrade', e.target.value)} style={inputSt}>
                  {['E-1','E-2','E-3','E-4','E-5','E-6','E-7','E-8','E-9','W-1','W-2','W-3','W-4','W-5','O-1','O-2','O-3','O-4','O-5','O-6','O-7','O-8','O-9','O-10'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              {/* Language */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>PREFERRED LANGUAGE</label>
                <select value={p.language} onChange={e => upd('language', e.target.value)} style={inputSt}>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Used for translation services and language-specific resources</div>
              </div>

              <button onClick={() => setStep(-1)} style={{ width: '100%', padding: '10px', marginBottom: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                See Demo First →
              </button>
              <button onClick={() => setStep(1)} disabled={!canGo1} style={{ width: '100%', padding: '13px', borderRadius: 12, background: canGo1 ? theme.accent : 'rgba(255,255,255,0.1)', color: canGo1 ? theme.secondary : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 900, cursor: canGo1 ? 'pointer' : 'not-allowed', fontSize: 14 }}>
                Continue →
              </button>
            </>
          )}

          {/* Step 1 — Bases & Unit */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Your Bases & Unit</div>

              {/* Losing installation */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>DEPARTING FROM (LOSING INSTALLATION)</label>
                <input
                  value={losingSearch || p.losingInstallation}
                  onChange={e => { setLosingSearch(e.target.value); upd('losingInstallation', e.target.value); }}
                  placeholder="Type base name..."
                  style={inputSt}
                />
                <SuggestionList items={losingSuggestions} onSelect={name => { upd('losingInstallation', name); setLosingSearch(''); }} />
              </div>

              {/* Gaining installation */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>REPORTING TO (GAINING INSTALLATION)</label>
                <input
                  value={gainingSearch || p.gainingInstallation}
                  onChange={e => { setGainingSearch(e.target.value); updGaining(e.target.value); }}
                  placeholder="Type base name..."
                  style={inputSt}
                />
                <SuggestionList items={gainingSuggestions} onSelect={name => { updGaining(name); setGainingSearch(''); }} />
                {p.isOverseas && <div style={{ marginTop: 5, fontSize: 11, color: theme.accent, fontWeight: 700 }}>🌏 OCONUS — Overseas move detected</div>}
              </div>

              {/* Departing date */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>DEPARTING DATE</label>
                <input type="date" value={p.departingDate} onChange={e => upd('departingDate', e.target.value)} style={{ ...inputSt, colorScheme: 'dark' }} />
              </div>

              {/* Unit assignment */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                  UNIT ASSIGNMENT{p.gainingInstallation ? ` AT ${p.gainingInstallation.toUpperCase()}` : ''}
                </label>
                <select value={p.unit} onChange={e => upd('unit', e.target.value)} style={inputSt} disabled={!p.gainingInstallation}>
                  <option value="">{p.gainingInstallation ? 'Select unit...' : 'Select a gaining installation first'}</option>
                  {availableUnits.length > 0
                    ? availableUnits.map(u => <option key={u} value={u}>{u}</option>)
                    : p.gainingInstallation && <option value="" disabled>No {p.branch} units listed — enter manually below</option>
                  }
                </select>
                {p.gainingInstallation && availableUnits.length === 0 && (
                  <input value={p.unit} onChange={e => upd('unit', e.target.value)} placeholder="Enter unit name manually..." style={{ ...inputSt, marginTop: 8 }} />
                )}
                {availableUnits.length > 0 && <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{availableUnits.length} {p.branch} unit{availableUnits.length !== 1 ? 's' : ''} available</div>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(2)} disabled={!canGo2} style={{ flex: 1, padding: '13px', borderRadius: 12, background: canGo2 ? theme.accent : 'rgba(255,255,255,0.1)', color: canGo2 ? theme.secondary : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 900, cursor: canGo2 ? 'pointer' : 'not-allowed', fontSize: 14 }}>Continue →</button>
              </div>
            </>
          )}

          {/* Step 2 — Family, Religion & Housing */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Family & Preferences</div>

              {/* Toggles */}
              {[['hasDependents', 'Spouse / Dependents traveling with me'], ['hasChildren', 'I have children']].map(([key, label]) => (
                <div key={key} onClick={() => upd(key, !p[key])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p[key] ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p[key] ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p[key] ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p[key] ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p[key] && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{label}</div>
                </div>
              ))}

              {/* Children ages */}
              {p.hasChildren && (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>CHILDREN'S AGES</label>
                    <button onClick={() => upd('childAges', [...p.childAges, ''])} style={{ padding: '5px 12px', borderRadius: 8, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ Add Child</button>
                  </div>
                  {p.childAges.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '6px 0' }}>No children added yet</div>}
                  {p.childAges.map((age, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 60 }}>Child {idx + 1}</div>
                      <input type="number" min="0" max="25" value={age} onChange={e => { const a = [...p.childAges]; a[idx] = e.target.value; upd('childAges', a); }} placeholder="Age" style={{ ...inputSt, width: 80, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>yrs</span>
                      <button onClick={() => upd('childAges', p.childAges.filter((_, i) => i !== idx))} style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 7, background: 'rgba(255,80,80,0.2)', border: '1px solid rgba(255,80,80,0.35)', color: '#FF8080', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bedrooms */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>BEDROOMS NEEDED</label>
                <select value={p.bedrooms} onChange={e => upd('bedrooms', e.target.value)} style={inputSt}>
                  {['1', '2', '3', '4', '5+'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              {/* Religious preference */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                  RELIGIOUS PREFERENCE <span style={{ fontWeight: 400, opacity: 0.55, fontSize: 10 }}>(for chaplain & community resources)</span>
                </label>
                <select value={p.religiousPreference} onChange={e => upd('religiousPreference', e.target.value)} style={inputSt}>
                  {RELIGIOUS_PREFERENCES.map(r => <option key={r}>{r}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Stored locally only — helps surface relevant chapel and community resources</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={() => onComplete({
                    ...p,
                    childAges: p.childAges.filter(a => a !== '' && !isNaN(Number(a))).map(Number),
                    childrenAges: p.childAges.filter(a => a !== '' && !isNaN(Number(a))).map(Number).join(', '),
                  })}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}
                >
                  Build My PCS Plan ✦
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState(() => store.get('pcs_profile'));
  const [activeTab, setActiveTab] = useState('home');
  const [navOpen, setNavOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [checklistItems, setChecklistItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pcs_checklist_checks')) || {}; } catch { return {}; }
  });

  const theme = profile ? BRANCH_THEMES[profile.branch] : BRANCH_THEMES.Army;

  // Compute pending alerts based on departure date and checklist completion
  const daysUntilDeparture = profile?.departingDate ? getDaysUntilDeparture(profile.departingDate) : null;
  const pendingAlerts = profile?.departingDate
    ? Object.entries(PHASE_WINDOWS)
        .filter(([phase, win]) => {
          if (daysUntilDeparture === null || daysUntilDeparture > win.activeAt) return false;
          const tasks = PCS_CHECKLIST[phase] || [];
          return tasks.some((_, i) => !checklistItems[`${phase}-${i}`]);
        })
        .map(([phase, win]) => ({
          phase,
          overdue: daysUntilDeparture < win.overdueAt,
          daysUntil: daysUntilDeparture,
          count: (PCS_CHECKLIST[phase] || []).filter((_, i) => !checklistItems[`${phase}-${i}`]).length,
        }))
    : [];
  const overdueCount = pendingAlerts.filter(a => a.overdue).length;
  const alertCount = pendingAlerts.length;

  // Close nav/notifs on tab change
  const goTo = (tab) => {
    setActiveTab(tab);
    setNavOpen(false);
    setShowNotifs(false);
  };

  if (!profile) {
    return <Onboarding onComplete={(p) => { setProfile(p); store.set('pcs_profile', p); }} />;
  }

  const BOTTOM_NAV = [
    { id: 'home',      label: 'Home',     icon: '🏠' },
    { id: 'checklist', label: 'Checklist', icon: '✓' },
    { id: 'orders',    label: 'Orders',   icon: '📋' },
    { id: 'schools',   label: 'Schools',  icon: '🏫' },
    { id: 'nav',       label: 'Map',      icon: '🗺️' },
    { id: 'veterans',  label: 'Veterans', icon: '⭐' },
    { id: 'employment',label: 'Work',     icon: '💼' },
    { id: 'education', label: 'GI Bill',  icon: '🎓' },
    { id: 'spouse',    label: 'Spouse',   icon: '💛' },
    { id: 'religion',  label: 'Faith',    icon: '✝️' },
    { id: 'translation',label: 'Translate',icon: '🌐' },
  ];

  const currentLabel = BOTTOM_NAV.find(n => n.id === activeTab)?.label || 'Home';

  if (activeTab === 'translation') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: '#f0f4f8', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: theme.secondary, padding: '12px 16px', borderBottom: `1px solid ${theme.accent}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '2px 4px' }}>←</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Translation</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TranslationModule theme={theme} profile={profile} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: '#f0f4f8', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER — safe-area-inset-top for notch/Dynamic Island */}
      <div style={{ background: theme.secondary, paddingTop: 'env(safe-area-inset-top)', position: 'sticky', top: 0, zIndex: 100, borderBottom: `2px solid ${theme.accent}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: theme.accent, fontWeight: 900 }}>PCS EXPRESS</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{profile.firstName} · {currentLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {alertCount > 0 && (
              <button onClick={() => { setShowNotifs(o => !o); setNavOpen(false); }} style={{ position: 'relative', background: showNotifs ? `${theme.accent}30` : overdueCount > 0 ? 'rgba(229,57,53,0.2)' : 'none', border: `1px solid ${overdueCount > 0 ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.25)'}`, color: '#fff', fontSize: 15, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, lineHeight: 1 }}>
                🔔
                <span style={{ position: 'absolute', top: -5, right: -5, background: overdueCount > 0 ? '#E53935' : theme.accent, color: overdueCount > 0 ? '#FFF' : theme.secondary, fontSize: 9, fontWeight: 900, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {overdueCount > 0 ? overdueCount : alertCount}
                </span>
              </button>
            )}
            <button onClick={() => { setNavOpen(o => !o); setShowNotifs(false); }} style={{ background: navOpen ? `${theme.accent}30` : 'none', border: `1px solid rgba(255,255,255,0.25)`, color: '#fff', fontSize: 16, cursor: 'pointer', padding: '6px 11px', borderRadius: 8, lineHeight: 1, fontWeight: 700 }}>
              {navOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* SLIDE-DOWN NAV DRAWER */}
      {navOpen && (
        <div style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: 0, right: 0, maxWidth: 480, margin: '0 auto', zIndex: 200, background: theme.secondary, borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {BOTTOM_NAV.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} style={{ padding: '12px 6px', background: activeTab === item.id ? `${theme.accent}30` : 'transparent', border: 'none', borderBottom: `1px solid rgba(255,255,255,0.08)`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: activeTab === item.id ? 800 : 500 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setProfile(null); store.set('pcs_profile', null); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.15)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,100,100,0.9)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            Reset / Re-onboard
          </button>
        </div>
      )}

      {/* Notification dropdown */}
      {showNotifs && pendingAlerts.length > 0 && (
        <div style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: 0, right: 0, maxWidth: 480, margin: '0 auto', zIndex: 200, background: '#FFFFFF', borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821' }}>
              {overdueCount > 0 ? `${overdueCount} Overdue Action${overdueCount !== 1 ? 's' : ''}` : 'Pending Actions'}
            </div>
            <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#888' }}>✕</button>
          </div>
          {pendingAlerts.map((alert, i) => (
            <div key={i} onClick={() => { goTo('checklist'); }} style={{ padding: '12px 16px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: alert.overdue ? '#FFF5F5' : '#FFFDE7' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{alert.overdue ? '⚠️' : '📋'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: alert.overdue ? '#C62828' : '#E65100' }}>
                  {alert.overdue ? 'OVERDUE: ' : 'Due Now: '}{alert.phase}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                  {alert.count} task{alert.count !== 1 ? 's' : ''} remaining · {alert.daysUntil < 0 ? `${Math.abs(alert.daysUntil)}d past departure` : `${alert.daysUntil}d until departure`}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#AAA' }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop to close nav/notifs */}
      {(navOpen || showNotifs) && <div onClick={() => { setNavOpen(false); setShowNotifs(false); }} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent' }} />}

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {activeTab === 'home' && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Welcome, {profile.firstName}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 14 }}>{profile.gainingInstallation ? `Moving to ${profile.gainingInstallation}` : 'Set your gaining installation to personalize'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '📝', label: 'Checklist', id: 'checklist' },
                { icon: '📋', label: 'Orders', id: 'orders' },
                { icon: '💼', label: 'Employment', id: 'employment' },
                { icon: '🏫', label: 'Schools', id: 'schools' },
                { icon: '⭐', label: 'Vet Businesses', id: 'veterans' },
                { icon: '🎓', label: 'GI Bill', id: 'education' },
                { icon: '✝️', label: 'Faith', id: 'religion' },
                { icon: '💛', label: 'Spouse Guide', id: 'spouse' },
                { icon: '🗺️', label: 'Navigation', id: 'nav' },
              ].map((item) => (
                <div key={item.id} onClick={() => goTo(item.id)} style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '14px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Quick profile summary */}
            <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginTop: 16, color: '#FFF' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 8 }}>YOUR PROFILE</div>
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div>Branch: {profile.branch} · {profile.paygrade}</div>
                {profile.gainingInstallation && <div>Gaining: {profile.gainingInstallation}</div>}
                {profile.departingDate && <div>Depart: {profile.departingDate}</div>}
                {profile.religiousPreference && profile.religiousPreference !== 'Prefer not to say' && <div>Faith: {profile.religiousPreference}</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && <ChecklistTab theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />}
        {activeTab === 'orders' && <OrdersTab theme={theme} profile={profile} />}
        {activeTab === 'schools' && <SchoolsTab theme={theme} profile={profile} />}
        {activeTab === 'veterans' && <VeteranBusinessesTab theme={theme} profile={profile} />}
        {activeTab === 'employment' && <EmploymentModule theme={theme} profile={profile} />}
        {activeTab === 'education' && <EducationBenefitsTab theme={theme} profile={profile} />}
        {activeTab === 'nav' && <NavigationModule theme={theme} profile={profile} />}
        {activeTab === 'spouse' && <SpouseDeploymentGuide theme={theme} profile={profile} />}
        {activeTab === 'religion' && <ReligiousServicesModuleWrapped theme={theme} profile={profile} />}
      </div>

      {/* BOTTOM NAV — first 5 items */}
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #E0E6EE', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', position: 'fixed', bottom: 0, width: '100%', maxWidth: 480, left: '50%', transform: 'translateX(-50%)', zIndex: 90, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {BOTTOM_NAV.slice(0, 5).map((item) => (
          <button key={item.id} onClick={() => goTo(item.id)} style={{ padding: '8px 2px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 9, color: activeTab === item.id ? theme.primary : '#9AAABB', fontWeight: activeTab === item.id ? 800 : 500 }}>
            <div style={{ fontSize: 17 }}>{item.icon}</div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Wrapper for religious services that adds preference-based filtering
function ReligiousServicesModuleWrapped({ theme, profile }) {
  const pref = profile?.religiousPreference || profile?.religion || '';
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();

  const isChristian = pref.includes('Christian') || pref.includes('Protestant');
  const isCatholic = pref.includes('Catholic');
  const isJewish = pref.includes('Jewish') || pref.includes('Judaism');
  const isIslam = pref.includes('Islam') || pref.includes('Muslim') || pref === 'Islamic';
  const isBuddhist = pref.includes('Buddhist');
  const isHindu = pref.includes('Hindu');
  const showAll = !pref || pref === 'Other' || pref === 'Prefer not to say';

  const prefLabel = showAll ? 'All Faiths' : pref;

  return (
    <div>
      {pref && !showAll && (
        <div style={{ background: theme.secondary, padding: '10px 16px', fontSize: 12, color: theme.accent, fontWeight: 700 }}>
          Showing services for: {prefLabel} {instName ? `near ${instName}` : ''}
        </div>
      )}
      <ReligiousServicesModule theme={theme} profile={{ ...profile, filterDenomination: isChristian ? 'Protestant' : isCatholic ? 'Catholic' : isJewish ? 'Jewish' : isIslam ? 'Islamic' : null, showAll }} />
    </div>
  );
}

export default App;
