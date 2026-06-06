/*
 * Transition Outreach — a directory of official and operational veteran /
 * transition-assistance resources, organized into category sub-tabs
 * (Housing, Legal, Healthcare, Financial, Education, Employment, Benefits &
 * Claims, Crisis & Mental Health). Every link points to an official .gov /
 * .mil source or a congressionally chartered Veterans Service Organization
 * (VSO) — no fabricated or commercial providers.
 *
 * Third-party dependencies: React only.
 */

import { useState } from 'react';
import TabBar from './TabBar';
import { useTransitionLocation } from './transitionLocation';

const enc = (s) => encodeURIComponent(String(s || '').trim());

// Location-tailored "dynamic" cards prepended to each category when the user
// has set a destination — they point at official locators/searches scoped to
// that area so the resources match where the member is moving. No fabricated
// listings; each links to an official locator or a scoped search.
function dynamicCards(catId, loc) {
  if (!loc) return [];
  const va = (type) => `https://www.va.gov/find-locations/?location=${enc(loc)}${type ? `&facilityType=${type}` : ''}`;
  const search = (q) => `https://www.google.com/search?q=${enc(`${q} ${loc}`)}`;
  const byCat = {
    housing: [
      { name: `VA & housing resources near ${loc}`, desc: `VA offices and housing help serving ${loc}.`, url: va('') },
      { name: `Veteran housing search — ${loc}`, desc: `HUD-VASH, transitional, and veteran-friendly housing in ${loc}.`, url: search('veteran housing assistance') },
    ],
    legal: [{ name: `Free veteran legal aid near ${loc}`, desc: `Pro bono and low-cost legal help for veterans in ${loc}.`, url: search('veteran legal aid pro bono') }],
    healthcare: [{ name: `VA health facilities near ${loc}`, desc: `VA medical centers, clinics, and Vet Centers serving ${loc}.`, url: va('health') }],
    financial: [{ name: `Free tax & financial help near ${loc}`, desc: `VITA / MilTax sites and veteran financial counseling in ${loc}.`, url: search('VITA free tax help veterans') }],
    education: [{ name: `GI Bill schools near ${loc}`, desc: `Compare GI Bill-approved schools and programs in ${loc}.`, url: `https://www.va.gov/education/gi-bill-comparison-tool/` }],
    employment: [{ name: `American Job Center near ${loc}`, desc: `Local DOL job center (veterans get priority of service) serving ${loc}.`, url: `https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx?location=${enc(loc)}` }],
    benefits: [{ name: `VA benefits office near ${loc}`, desc: `File and get help with VA claims in ${loc}.`, url: va('benefits') }],
    crisis: [{ name: `Vet Center near ${loc}`, desc: `Free, confidential readjustment counseling in ${loc} — separate from your VA medical record.`, url: va('vet_center') }],
  };
  return (byCat[catId] || []).map(c => ({ ...c, dynamic: true }));
}

// Crisis line is pinned above every category — surfaced first, always.
const CRISIS = {
  name: 'Veterans Crisis Line — 988 then 1 (or text 838255)',
  desc: 'Free, confidential, 24/7 support for veterans, service members, and their families — you do not need to be enrolled in VA care.',
  url: 'https://www.veteranscrisisline.net/',
};

const CATEGORIES = [
  {
    id: 'housing', label: 'Housing',
    blurb: 'Home loans, homelessness prevention, and transitional housing.',
    links: [
      { name: 'VA Home Loan (Certificate of Eligibility)', desc: 'No-down-payment VA-backed home loans and how to request your COE.', url: 'https://www.va.gov/housing-assistance/home-loans/' },
      { name: 'HUD-VASH (housing vouchers)', desc: 'Rental assistance plus VA case management for veterans experiencing or at risk of homelessness.', url: 'https://www.va.gov/homeless/hud-vash.asp' },
      { name: 'VA — National Call Center for Homeless Veterans (877-424-3838)', desc: '24/7 help for veterans who are homeless or at imminent risk.', url: 'https://www.va.gov/homeless/nationalcallcenter.asp' },
      { name: 'HUD Veterans housing resources', desc: 'Federal housing programs, counseling agencies, and tenant resources.', url: 'https://www.hud.gov/veterans' },
    ],
  },
  {
    id: 'legal', label: 'Legal',
    blurb: 'Free and low-cost legal help, claims representation, and records.',
    links: [
      { name: 'Stateside Legal (military/veteran legal help)', desc: 'Plain-language legal information and a benefits finder for service members, veterans, and families.', url: 'https://statesidelegal.org/' },
      { name: 'ABA Military & Veterans Legal Center', desc: 'American Bar Association pro bono and legal-resource directory for the military community.', url: 'https://www.americanbar.org/groups/legal_assistance_military_personnel/' },
      { name: 'Armed Forces Legal Assistance locator', desc: 'Find a base legal-assistance office for free help while you still have access (wills, POAs, SCRA).', url: 'https://legalassistance.law.af.mil/' },
      { name: 'VA — Accredited representatives & VSOs', desc: 'Find an accredited attorney, claims agent, or VSO to represent you on a VA claim or appeal.', url: 'https://www.va.gov/ogc/apps/accreditation/index.asp' },
    ],
  },
  {
    id: 'healthcare', label: 'Healthcare',
    blurb: 'VA health enrollment, community care, and dental.',
    links: [
      { name: 'VA Health Care — apply', desc: 'Enroll in VA health care; recent combat veterans and PACT Act toxic-exposure conditions have expanded eligibility.', url: 'https://www.va.gov/health-care/apply/application/' },
      { name: 'VA — Community Care', desc: 'When VA can cover care from a local non-VA provider.', url: 'https://www.va.gov/communitycare/' },
      { name: 'TRICARE — losing military health coverage', desc: 'TAMP, CHCBP, and transitional options when active-duty TRICARE ends.', url: 'https://www.tricare.mil/Plans/Eligibility/LosingMilitaryHealthCoverage' },
      { name: 'VA Dental care eligibility', desc: 'Limited VA dental benefits and the VADIP insurance option.', url: 'https://www.va.gov/health-care/about-va-health-benefits/dental-care/' },
    ],
  },
  {
    id: 'financial', label: 'Financial',
    blurb: 'Compensation, pension, protections, and money counseling.',
    links: [
      { name: 'VA — Disability compensation', desc: 'Tax-free monthly payment for service-connected conditions; file, track, and manage your claim.', url: 'https://www.va.gov/disability/' },
      { name: 'VA — Veterans Pension', desc: 'Needs-based benefit for wartime veterans with limited income.', url: 'https://www.va.gov/pension/' },
      { name: 'SCRA — Servicemembers Civil Relief Act', desc: 'Interest-rate caps, lease/termination, and other financial protections (DOJ overview).', url: 'https://www.justice.gov/servicemembers' },
      { name: 'CFPB — Tools for veterans', desc: 'Consumer-protection guidance on transition finances, benefits, and avoiding scams.', url: 'https://www.consumerfinance.gov/consumer-tools/military-financial-lifecycle/' },
    ],
  },
  {
    id: 'education', label: 'Education',
    blurb: 'GI Bill, vocational rehab, and credentialing.',
    links: [
      { name: 'VA — Education & GI Bill', desc: 'Post-9/11 / Montgomery GI Bill, transfer of entitlement, and the GI Bill Comparison Tool.', url: 'https://www.va.gov/education/' },
      { name: 'VR&E (Chapter 31) — Veteran Readiness & Employment', desc: 'Career counseling, training, and support for veterans with a service-connected disability.', url: 'https://www.va.gov/careers-employment/vocational-rehabilitation/' },
      { name: 'VET TEC — high-tech training', desc: 'VA-funded technology bootcamps without using GI Bill entitlement.', url: 'https://www.va.gov/education/about-gi-bill-benefits/how-to-use-benefits/vettec-high-tech-program/' },
      { name: 'GI Bill Comparison Tool', desc: 'Compare schools, benefit amounts, and approved programs.', url: 'https://www.va.gov/education/gi-bill-comparison-tool/' },
    ],
  },
  {
    id: 'employment', label: 'Employment',
    blurb: 'Federal hiring preference, job programs, and apprenticeships.',
    links: [
      { name: 'DOL VETS — Veterans’ employment & training', desc: 'Department of Labor programs, the American Job Center network, and the Transition Employment workshop.', url: 'https://www.dol.gov/agencies/vets/veterans' },
      { name: 'USAJOBS — Veterans hiring (preference)', desc: 'How veterans’ preference and special hiring authorities work for federal jobs.', url: 'https://www.usajobs.gov/help/working-in-government/unique-hiring-paths/veterans/' },
      { name: 'DoD SkillBridge', desc: 'Civilian-employer internships during your final 180 days while keeping military pay.', url: 'https://skillbridge.osd.mil/' },
      { name: 'Hiring Our Heroes (U.S. Chamber Foundation)', desc: 'Fellowships, hiring events, and employer connections for the military community.', url: 'https://www.hiringourheroes.org/' },
    ],
  },
  {
    id: 'benefits', label: 'Benefits & Claims',
    blurb: 'VSOs and tools to file, track, and appeal benefits.',
    links: [
      { name: 'VA.gov — claim or appeal status', desc: 'Track claims and appeals, download VA letters, and set up direct deposit.', url: 'https://www.va.gov/claim-or-appeal-status/' },
      { name: 'DAV — Disabled American Veterans (free claims help)', desc: 'Congressionally chartered VSO providing free benefits claims assistance and rides to VA care.', url: 'https://www.dav.org/' },
      { name: 'VFW — Veterans of Foreign Wars', desc: 'Free accredited claims representation and transition assistance.', url: 'https://www.vfw.org/assistance/va-claims-separation-benefits' },
      { name: 'The American Legion', desc: 'Accredited service officers for VA claims, appeals, and benefits guidance.', url: 'https://www.legion.org/veteransbenefits' },
      { name: 'State Veterans Affairs offices', desc: 'State-level property-tax exemptions, tuition benefits, and license designations.', url: 'https://www.va.gov/statedva.htm' },
    ],
  },
  {
    id: 'crisis', label: 'Crisis & Mental Health',
    blurb: 'Immediate, confidential support.',
    links: [
      { name: 'Veterans Crisis Line — 988 then 1', desc: 'Call, text 838255, or chat 24/7. You do not need to be enrolled in VA care.', url: 'https://www.veteranscrisisline.net/' },
      { name: 'Vet Centers (readjustment counseling)', desc: 'Free, confidential community-based counseling for combat veterans and families — separate from your VA medical record.', url: 'https://www.va.gov/find-locations/?facilityType=vet_center' },
      { name: 'VA — Mental health', desc: 'PTSD, depression, substance use, and transition-stress resources and how to start care.', url: 'https://www.mentalhealth.va.gov/' },
      { name: 'Military OneSource — non-medical counseling', desc: 'Free confidential counseling and transition support, available up to 365 days after separation.', url: 'https://www.militaryonesource.mil/' },
    ],
  },
];

export default function TransitionOutreachModule({ theme }) {
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const active = CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  const { location } = useTransitionLocation();
  const loc = String(location || '').trim();
  const cards = [...dynamicCards(active.id, loc), ...active.links];

  return (
    <div className="pet-page">
      <div className="pet-header">
        <div>
          <div className="assistance-kicker">Outreach</div>
          <h2>Veteran &amp; Transition Assistance</h2>
          <p>{loc ? `Official resources for life after service, tailored to ${loc} — organized by category.` : 'Official and operational resources for life after service — organized by category. Set your destination above to tailor them to your area.'}</p>
        </div>
      </div>

      {/* Pinned crisis line — always visible above the categories. */}
      <a
        href={CRISIS.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${CRISIS.name} (opens in a new tab)`}
        style={{ display: 'block', textDecoration: 'none', background: '#7F1D1D', borderRadius: 12, padding: 13, marginBottom: 14 }}
      >
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', color: '#FECACA', marginBottom: 3 }}>IN CRISIS? — IMMEDIATE HELP</div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF' }}>{CRISIS.name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginTop: 3 }}>{CRISIS.desc}</div>
      </a>

      {/* Category sub-tab strip. */}
      <TabBar ariaLabel="Outreach categories">
        {CATEGORIES.map(c => {
          const isActive = c.id === cat;
          return (
            <button
              key={c.id}
              id={`outreach-tab-${c.id}`}
              role="tab"
              aria-selected={isActive}
              data-active={isActive || undefined}
              onClick={() => setCat(c.id)}
              className={`pcs-tab ${isActive ? 'is-active' : ''}`}
              style={{
                borderRadius: 999,
                padding: '8px 15px',
                border: `1.5px solid ${isActive ? theme.primary : '#D4DCE8'}`,
                background: isActive ? theme.primary : '#FFF',
                color: isActive ? '#FFF' : '#43526B',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </TabBar>

      <div role="tabpanel" id={`outreach-panel-${active.id}`} aria-labelledby={`outreach-tab-${active.id}`} style={{ marginTop: 12 }}>
        <p style={{ fontSize: 12, color: '#43526B', margin: '0 0 12px' }}>{active.blurb}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cards.map(link => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} (opens in a new tab)`}
              style={{ display: 'block', textDecoration: 'none', background: link.dynamic ? '#F1F8F2' : '#FFFFFF', border: `1px solid ${link.dynamic ? '#A5D6A7' : '#E2E8F1'}`, borderRadius: 12, padding: 13 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.primary }}>{link.name} →</span>
                {link.dynamic && <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: '#1B5E20', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 5, padding: '1px 6px' }}>NEAR YOU</span>}
              </div>
              <div style={{ fontSize: 12, color: '#43526B', lineHeight: 1.5 }}>{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
