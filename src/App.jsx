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

function ChecklistTab({ theme, profile }) {
  const [checklistItems, setChecklistItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pcs_checklist_checks')) || {}; } catch { return {}; }
  });
  const [activePhase, setActivePhase] = useState(Object.keys(PCS_CHECKLIST)[0]);

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

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 16 }}>PCS Checklist</div>

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
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.keys(PCS_CHECKLIST).map(phase => {
          const phaseTasks = PCS_CHECKLIST[phase].map((_, i) => `${phase}-${i}`);
          const phaseDone = phaseTasks.filter(k => checklistItems[k]).length;
          return (
            <button key={phase} onClick={() => setActivePhase(phase)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${activePhase === phase ? theme.primary : '#E0E6EE'}`, background: activePhase === phase ? theme.primary : '#FFF', color: activePhase === phase ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {phase} ({phaseDone}/{phaseTasks.length})
            </button>
          );
        })}
      </div>

      {/* Tasks */}
      <div>
        {PCS_CHECKLIST[activePhase].map((task, i) => (
          <div key={i} onClick={() => toggleCheckItem(activePhase, i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: checklistItems[`${activePhase}-${i}`] ? '#E8F5E9' : '#FFFFFF', border: `1px solid ${checklistItems[`${activePhase}-${i}`] ? '#A5D6A7' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checklistItems[`${activePhase}-${i}`] ? '#2E7D32' : theme.accent}`, background: checklistItems[`${activePhase}-${i}`] ? '#2E7D32' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {checklistItems[`${activePhase}-${i}`] && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: checklistItems[`${activePhase}-${i}`] ? '#666' : theme.primary, textDecoration: checklistItems[`${activePhase}-${i}`] ? 'line-through' : 'none', fontWeight: checklistItems[`${activePhase}-${i}`] ? 400 : 500 }}>{task}</span>
          </div>
        ))}
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
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const businesses = VETERAN_OWNED_BUSINESSES[instName] || [];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Veteran Owned Businesses</div>
      {instName ? (
        <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>Near <strong>{instName}</strong></div>
      ) : (
        <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Complete onboarding to see local veteran businesses.</div>
      )}

      {businesses.length === 0 && (
        <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>No local data yet</div>
          <div style={{ fontSize: 11, color: '#888' }}>Check usasbe.org or veteranownedbusiness.com for your area.</div>
          <a href="https://veteranownedbusiness.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, padding: '10px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}>Search National Directory</a>
        </div>
      )}

      {businesses.map((biz, idx) => (
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

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    firstName: '',
    branch: 'Army',
    paygrade: 'E-5',
    departingDate: '',
    gainingInstallation: '',
    isOverseas: false,
    language: 'English',
    religion: 'Christian',
    religiousPreference: 'Christian',
    childrenAges: '',
    hasDependents: false,
  });

  const theme = BRANCH_THEMES[p.branch];

  return (
    <div style={{ minHeight: '100vh', background: theme.secondary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui' }}>
      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>PCS Express</div>
        <div style={{ fontSize: 12, color: theme.accent, marginTop: 4 }}>Your move, simplified</div>
      </div>

      <div style={{ flex: 1, padding: '0 16px 20px' }}>
        <div style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', padding: '20px 16px' }}>
          {step === 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Select Your Branch</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {Object.keys(BRANCH_THEMES).map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setP({ ...p, branch })}
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      border: `2px solid ${p.branch === branch ? BRANCH_THEMES[branch].accent : 'rgba(255,255,255,0.2)'}`,
                      background: p.branch === branch ? `${BRANCH_THEMES[branch].accent}30` : 'rgba(0,0,0,0.2)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    {branch}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="First name"
                value={p.firstName}
                onChange={(e) => setP({ ...p, firstName: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 10, outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
              />

              <select value={p.paygrade} onChange={(e) => setP({ ...p, paygrade: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 10, outline: 'none', fontSize: 14 }}>
                {['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9', 'W-1', 'W-2', 'W-3', 'W-4', 'W-5', 'O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'].map(g => <option key={g}>{g}</option>)}
              </select>

              <button onClick={() => setStep(1)} style={{ width: '100%', padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>
                Continue →
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Your Move Details</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>DEPARTING DATE</label>
              <input type="date" value={p.departingDate} onChange={(e) => setP({ ...p, departingDate: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', colorScheme: 'dark', fontSize: 14, boxSizing: 'border-box' }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>GAINING INSTALLATION</label>
              <select value={p.gainingInstallation} onChange={(e) => {
                const sel = MILITARY_DUTY_STATIONS.find(s => s.name === e.target.value);
                setP({ ...p, gainingInstallation: e.target.value, isOverseas: sel?.country ? true : false });
              }} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }}>
                <option value="">Select base...</option>
                {MILITARY_DUTY_STATIONS.map(s => <option key={s.name} value={s.name}>{s.name} — {s.state} ({s.branch})</option>)}
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>Next →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Language & Religion</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>PREFERRED LANGUAGE</label>
              <select value={p.language} onChange={(e) => setP({ ...p, language: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }}>
                {['English', 'Spanish', 'German', 'Korean', 'Japanese'].map(l => <option key={l}>{l}</option>)}
              </select>

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>RELIGIOUS PREFERENCE</label>
              <select value={p.religion} onChange={(e) => setP({ ...p, religion: e.target.value, religiousPreference: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }}>
                {['Christian', 'Catholic', 'Protestant', 'Jewish', 'Islamic', 'Buddhist', 'Hindu', 'Other', 'Prefer not to say'].map(r => <option key={r}>{r}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>Next →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Family Information</div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={p.hasDependents} onChange={(e) => setP({ ...p, hasDependents: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12 }}>I have dependents/children</span>
              </label>

              {p.hasDependents && (
                <>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>CHILDREN'S AGES (comma-separated)</label>
                  <input type="text" placeholder="e.g., 5, 8, 12" value={p.childrenAges} onChange={(e) => setP({ ...p, childrenAges: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
                </>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <button onClick={() => onComplete({ ...p, religiousPreference: p.religion })} style={{ flex: 1, padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>Start</button>
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

  const theme = profile ? BRANCH_THEMES[profile.branch] : BRANCH_THEMES.Army;

  // Close nav on tab change for mobile
  const goTo = (tab) => {
    setActiveTab(tab);
    setNavOpen(false);
  };

  if (!profile) {
    return <Onboarding onComplete={(p) => { setProfile(p); store.set('pcs_profile', p); }} />;
  }

  const BOTTOM_NAV = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'checklist', label: 'Checklist', icon: '✓' },
    { id: 'schools', label: 'Schools', icon: '🏫' },
    { id: 'veterans', label: 'Vet Biz', icon: '⭐' },
    { id: 'employment', label: 'Work', icon: '💼' },
    { id: 'education', label: 'GI Bill', icon: '🎓' },
    { id: 'nav', label: 'Map', icon: '🗺️' },
    { id: 'spouse', label: 'Spouse', icon: '💛' },
    { id: 'religion', label: 'Faith', icon: '✝️' },
    { id: 'translation', label: 'Translate', icon: '🌐' },
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
          <button onClick={() => setNavOpen(o => !o)} style={{ background: navOpen ? `${theme.accent}30` : 'none', border: `1px solid rgba(255,255,255,0.25)`, color: '#fff', fontSize: 16, cursor: 'pointer', padding: '6px 11px', borderRadius: 8, lineHeight: 1, fontWeight: 700 }}>
            {navOpen ? '✕' : '☰'}
          </button>
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

      {/* Backdrop to close nav */}
      {navOpen && <div onClick={() => setNavOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent' }} />}

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {activeTab === 'home' && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Welcome, {profile.firstName}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 14 }}>{profile.gainingInstallation ? `Moving to ${profile.gainingInstallation}` : 'Set your gaining installation to personalize'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '📝', label: 'Checklist', id: 'checklist' },
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

        {activeTab === 'checklist' && <ChecklistTab theme={theme} profile={profile} />}
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
