/*
 * Resources tab, extracted from App.jsx into its own lazy() chunk
 * (perf Tier 1b PR-C). Verbatim move.
 */
import { useState } from 'react';
import TabBar from './TabBar';

function ResourcesTab({ theme, profile }) {
  const [activeSection, setActiveSection] = useState('careers');
  const branch = profile?.branch || 'Army';
  const BRANCH_FAMILY_SUPPORT = {
    Army: { name: 'Army Community Service (ACS)', desc: 'Army installation-based family support, financial counseling, employment help, and relocation support.', url: 'https://installations.militaryonesource.mil/' },
    Navy: { name: 'Fleet & Family Support Center (FFSC)', desc: 'Navy family support, relocation assistance, deployment support, counseling, and employment help.', url: 'https://ffr.cnic.navy.mil/Fleet-And-Family-Readiness/Family-Readiness/Fleet-Family-Support-Program/' },
    'Marine Corps': { name: 'Marine Corps Community Services (MCCS)', desc: 'Marine Corps family readiness, relocation, counseling, employment, and financial support.', url: 'https://www.usmc-mccs.org/' },
    'Air Force': { name: 'Military & Family Readiness Center', desc: 'Air Force relocation, employment, financial readiness, family support, and deployment resources.', url: 'https://www.af.mil/Contact-Us/' },
    'Space Force': { name: 'Department of the Air Force Military & Family Readiness', desc: 'Space Force family readiness support through the servicing Department of the Air Force installation.', url: 'https://www.spaceforce.mil/Family/' },
    'Coast Guard': { name: 'Coast Guard Work-Life Program', desc: 'Coast Guard family, relocation, financial, employment, and work-life support services.', url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources-CG-1/Health-Safety-and-Work-Life-CG-11/' },
  };
  const selectedFamilySupport = BRANCH_FAMILY_SUPPORT[branch] || BRANCH_FAMILY_SUPPORT.Army;
  const BRANCH_ONLY_TAGS = ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard'];
  const getVisibleResources = (items = []) => items.filter(resource => !BRANCH_ONLY_TAGS.includes(resource.tag) || resource.tag === branch);

  const SECTIONS = [
    { id: 'careers',      label: 'Careers', icon: '💼' },
    { id: 'education',    label: 'Education', icon: '🎓' },
    { id: 'family',       label: 'Family Support', icon: '👨‍👩‍👧' },
    { id: 'financial',    label: 'Financial', icon: '💰' },
    { id: 'healthcare',   label: 'Healthcare', icon: '🏥' },
    { id: 'portals',      label: 'Military Portals', icon: '🖥️' },
    { id: 'pcs',          label: 'PCS & Housing', icon: '🏠' },
  ];

  const RESOURCES = {
    healthcare: [
      { name: 'TRICARE', desc: 'Military health insurance — find plans, providers, and enrollment info', url: 'https://www.tricare.mil', tag: 'All Branches' },
      { name: 'MHS GENESIS Patient Portal', desc: 'Book appointments, view records, and message care teams through the official MHS portal', url: 'https://my.mhsgenesis.health.mil/', tag: 'All Branches' },
      { name: 'TRICARE Claims', desc: 'Official TRICARE claims, EOB, and claims filing information', url: 'https://www.tricare.mil/PatientResources/Claims', tag: 'All Branches' },
      { name: 'TRICARE For Life', desc: 'Official Medicare-wraparound coverage information for eligible retirees', url: 'https://www.tricare.mil/Plans/HealthPlans/TFL', tag: 'Retirees' },
      { name: 'TRICARE Dental Program (TDP)', desc: 'Dental benefits enrollment, find a provider, and submit claims', url: 'https://www.tricare.mil/CoveredServices/Dental/TDP', tag: 'All Branches' },
      { name: 'TRICARE Overseas', desc: 'TRICARE coverage for beneficiaries stationed or living outside the U.S.', url: 'https://www.tricare.mil/Plans/HealthPlans', tag: 'OCONUS' },
      { name: 'TRICARE Overseas Program (TOP)', desc: 'Managed care option for overseas military beneficiaries', url: 'https://www.tricare-overseas.com/', tag: 'OCONUS' },
      { name: 'TRICARE Pharmacy — ESI', desc: 'Prescription drug benefits managed by Express Scripts for TRICARE', url: 'https://tricare.mil/CoveredServices/Pharmacy', tag: 'All Branches' },
      { name: 'TRICARE East', desc: 'TRICARE East Region managed care, provider search, and benefit management', url: 'https://www.tricare.mil/Plans/HealthPlans/Prime', tag: 'All Branches' },
      { name: 'My MHS GENESIS', desc: 'Military Health System patient portal — records, appointments, secure messaging', url: 'https://my.mhsgenesis.health.mil/', tag: 'All Branches' },
      { name: 'Military OneSource Health', desc: 'Free health consultations and wellness referrals for service members', url: 'https://www.militaryonesource.mil/health-wellness', tag: 'All Branches' },
      { name: 'VA Health Care', desc: 'Veteran health benefits, eligibility, and enrollment', url: 'https://www.va.gov/health-care', tag: 'Veterans' },
    ],
    family: [
      { name: 'Military OneSource', desc: '24/7 support for military families — counseling, legal, financial, relocation', url: 'https://www.militaryonesource.mil', tag: 'All Branches' },
      { name: 'Military Child Education Coalition', desc: 'School transition resources for military children', url: 'https://www.militarychild.org/', tag: 'Families' },
      { name: 'Operation Homefront', desc: 'Emergency financial and housing assistance for military families', url: 'https://operationhomefront.org/critical-financial-assistance/', tag: 'All Branches' },
      { name: 'Blue Star Families', desc: 'Connection and community for military families nationwide', url: 'https://bluestarfam.org/', tag: 'All Branches' },
      { ...selectedFamilySupport, tag: branch },
    ],
    financial: [
      { name: 'myPay (DFAS)', desc: 'Access and manage your military pay, allotments, and W-2s', url: 'https://mypay.dfas.mil', tag: 'All Branches' },
      { name: 'BAH Calculator', desc: 'Calculate your Basic Allowance for Housing by rank and zip code', url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/', tag: 'All Branches' },
      { name: 'VA Benefits Explorer', desc: 'Explore all VA benefits you may be eligible for', url: 'https://www.benefits.va.gov', tag: 'Veterans' },
      { name: 'Military Saves', desc: 'Financial readiness resources, savings plans, and debt reduction tools', url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/', tag: 'All Branches' },
      { name: 'Blended Retirement System', desc: 'BRS calculator and TSP retirement planning tools', url: 'https://militarypay.defense.gov/BRS/', tag: 'All Branches' },
      { name: 'SCRA (Service Members Civil Relief)', desc: 'Interest rate caps, lease termination rights, foreclosure protection', url: 'https://www.benefits.va.gov/homeloans/scra.asp', tag: 'All Branches' },
    ],
    pcs: [
      { name: 'Move.mil (DPS)', desc: 'Schedule your household goods move, track shipment, file claims', url: 'https://dps.move.mil/cust/standard/user/home.xhtml', tag: 'All Branches' },
      { name: 'Military Installations', desc: 'Find on-post housing, facilities, and services at any installation', url: 'https://installations.militaryonesource.mil/', tag: 'All Branches' },
      { name: 'Housing Network', desc: 'Search on-post and nearby off-post housing options', url: 'https://www.housing.af.mil', tag: 'All Branches' },
      { name: 'SCRA Lease Termination', desc: 'Break your lease when PCS orders arrive — federal protection', url: 'https://www.justice.gov/servicemembers/servicemembers-civil-relief-act-scra', tag: 'PCS' },
      { name: 'VA Home Loan', desc: 'Zero-down home loans for veterans and active duty service members', url: 'https://www.va.gov/housing-assistance/home-loans', tag: 'Housing' },
    ],
    education: [
      { name: 'VA GI Bill', desc: 'Apply for GI Bill benefits and check remaining entitlement', url: 'https://www.va.gov/education', tag: 'Veterans' },
      { name: 'MyCAA Scholarships', desc: 'Up to $4,000/year for eligible military spouses pursuing portable careers', url: 'https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/', tag: 'Spouses' },
      { name: 'Tuition Assistance (TA)', desc: `${branch === 'Army' ? 'GoArmyEd' : branch === 'Navy' ? 'Navy TA via NETPDTC' : 'Branch Tuition Assistance'} — up to $4,500/year for active duty`, url: branch === 'Army' ? 'https://www.armyignited.army.mil/student/' : 'https://www.dantes.mil/mil-ta/', tag: branch },
      { name: 'DANTES / DSST Exams', desc: 'Free college-level exams for service members — earn credits fast', url: 'https://www.dantes.mil', tag: 'All Branches' },
      { name: 'DoDEA Schools', desc: 'Find DoD-operated schools for military families worldwide', url: 'https://www.dodea.edu/', tag: 'Families' },
    ],
    careers: [
      { name: 'USAJobs.gov', desc: 'Federal civilian jobs with veteran preference hiring', url: 'https://www.usajobs.gov', tag: 'Federal' },
      { name: 'Hire Heroes USA', desc: 'Free job placement and resume coaching for veterans and spouses', url: 'https://www.dol.gov/agencies/vets', tag: 'Veteran-Focused' },
      { name: 'My Next Move for Veterans', desc: 'Translate your MOS to civilian career paths', url: 'https://www.dol.gov/agencies/vets', tag: 'MOS Translator' },
      { name: 'MySECO — Spouse Education & Career Opportunities', desc: 'Military OneSource career coaching, scholarships, and employment tools for spouses', url: 'https://myseco.militaryonesource.mil', tag: 'Spouses' },
      { name: 'Military Spouse Employment Partnership', desc: 'Employer network committed to hiring military spouses', url: 'https://myseco.militaryonesource.mil/portal/', tag: 'Spouses' },
      { name: 'MyCAA — Spouse Career Advancement Accounts', desc: 'Up to $4,000/year in scholarships for military spouses pursuing portable careers', url: 'https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/', tag: 'Spouses' },
      { name: 'Transition GPS (TAP)', desc: 'DoD Transition Assistance Program — mandatory pre-separation classes', url: 'https://www.dodtap.mil', tag: 'Transition' },
    ],
    portals: [
      
      { name: 'Army TAP Portal', desc: 'Army Transition Assistance Program — schedule TAP workshops and manage transition', url: 'https://tapevents.mil', tag: 'Army' },
      { name: 'HRC — iPERMS', desc: 'U.S. Army Human Resources Command — view and manage your official military personnel records', url: 'https://iperms.hrc.army.mil', tag: 'Army' },
      { name: 'U.S. Army HRC Portal', desc: 'Army Human Resources Command — assignments, promotions, evaluations, and career tools', url: 'https://www.hrc.army.mil', tag: 'Army' },
      { name: 'IPPS-A', desc: 'Integrated Personnel and Pay System — Army: manage pay, personnel actions, and leave', url: 'https://ipps-a.army.mil', tag: 'Army' },
      
      { name: 'milConnect (DMDC)', desc: 'Defense Manpower Data Center — view benefits, DEERS updates, and personnel data', url: 'https://milconnect.dmdc.osd.mil/', tag: 'All Branches' },
    ],
  };

  const tagColor = (tag) => {
    if (tag === 'All Branches') return { bg: '#E3F2FD', color: '#1565C0' };
    if (tag === 'Veterans') return { bg: '#FFF3E0', color: '#E65100' };
    if (tag === 'Spouses') return { bg: '#FCE4EC', color: '#880E4F' };
    if (tag === 'Families') return { bg: '#E8F5E9', color: '#1B5E20' };
    return { bg: `${theme.primary}15`, color: theme.primary };
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Section tabs */}
      <TabBar ariaLabel="Resource sections" className="pcs-tabbar--flush">
        {SECTIONS.map(s => {
          const isActive = activeSection === s.id;
          return (
            <button key={s.id} id={`rsec-tab-${s.id}`} role="tab" aria-selected={isActive} aria-controls={`rsec-panel-${s.id}`} data-active={isActive || undefined} onClick={() => setActiveSection(s.id)} className={`pcs-tab ${isActive ? 'is-active' : ''}`} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${isActive ? theme.primary : '#E0E6EE'}`, background: isActive ? theme.primary : '#FFF', color: isActive ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {s.icon} {s.label}
            </button>
          );
        })}
      </TabBar>

      {/* Resource cards */}
      <div role="tabpanel" id={`rsec-panel-${activeSection}`} aria-labelledby={`rsec-tab-${activeSection}`}>
      {getVisibleResources(RESOURCES[activeSection] || []).map((r, idx) => {
        const tc = tagColor(r.tag);
        return (
          <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{r.name}</div>
              <span style={{ background: tc.bg, color: tc.color, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap' }}>{r.tag}</span>
            </div>
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="card-cta" style={{ '--cta-color': theme.primary }}>Open Resource</a>
          </div>
        );
      })}
      </div>
    </div>
  );
}

export default ResourcesTab;
