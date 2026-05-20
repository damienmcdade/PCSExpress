/*
 * Purpose: Branch-tailored moving financial assistance resources for service members and military families.
 * Third-party dependencies: React only.
 */

const BRANCH_ALIASES = {
  Army: 'Army',
  Navy: 'Navy',
  'Marine Corps': 'Marine Corps',
  Marines: 'Marine Corps',
  'Air Force': 'Air Force',
  'Space Force': 'Space Force',
  'Coast Guard': 'Coast Guard',
};

const RESOURCES = [
  {
    name: 'Military OneSource Financial Counseling',
    type: 'FREE ASSISTANCE',
    branches: ['ALL'],
    audience: 'All service members and military families',
    desc: 'Free confidential financial counseling, PCS budget help, SCRA guidance, and referrals before or during a move.',
    url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/',
  },
  {
    name: 'Operation Homefront Critical Financial Assistance',
    type: 'GRANT',
    branches: ['ALL'],
    audience: 'Eligible active duty, veterans, and military families',
    desc: 'Needs-based grants for rent, utilities, food, vehicle expenses, moving-related emergencies, and critical family costs.',
    url: 'https://operationhomefront.org/critical-financial-assistance/',
  },
  {
    name: 'Dislocation Allowance and PCS Travel Entitlements',
    type: 'FREE ASSISTANCE',
    branches: ['ALL'],
    audience: 'Most PCS moves',
    desc: 'Official DoD rates for DLA, per diem, temporary lodging, mileage, and dependent travel. Confirm eligibility with finance.',
    url: 'https://www.travel.dod.mil/Allowances/',
  },
  {
    name: 'SCRA Lease and Housing Protections',
    type: 'LAND / HOUSING',
    branches: ['ALL'],
    audience: 'Renters, homeowners, and families with PCS orders',
    desc: 'Federal protections for lease termination, interest caps, foreclosure protections, and housing-related legal questions.',
    url: 'https://www.justice.gov/servicemembers/servicemembers-civil-relief-act-scra',
  },
  {
    name: 'VA Housing Assistance',
    type: 'LAND / HOUSING',
    branches: ['ALL'],
    audience: 'Eligible service members, veterans, and surviving spouses',
    desc: 'Official VA housing assistance overview, including home loan and housing grant information for eligible users.',
    url: 'https://www.va.gov/housing-assistance/',
  },
  {
    name: 'Army Emergency Relief',
    type: 'GRANT',
    branches: ['Army'],
    audience: 'Army soldiers, retirees, and eligible family members',
    desc: 'Interest-free loans, grants, scholarships, and emergency help for PCS strain, travel, rent, utilities, and vehicle repair.',
    url: 'https://www.armyemergencyrelief.org/',
  },
  {
    name: 'Navy-Marine Corps Relief Society',
    type: 'GRANT',
    branches: ['Navy', 'Marine Corps'],
    audience: 'Navy and Marine Corps service members and eligible families',
    desc: 'Quick Assist Loans, grants, budget counseling, emergency travel help, and PCS-related financial support.',
    url: 'https://www.nmcrs.org/',
  },
  {
    name: 'Air Force Aid Society',
    type: 'GRANT',
    branches: ['Air Force', 'Space Force'],
    audience: 'Air Force and Space Force service members and eligible families',
    desc: 'Emergency assistance, Falcon Loans, grants, community programs, and relocation support for Airmen and Guardians.',
    url: 'https://afas.org/',
  },
  {
    name: 'Coast Guard Mutual Assistance',
    type: 'GRANT',
    branches: ['Coast Guard'],
    audience: 'Coast Guard service members and eligible families',
    desc: 'Loans, grants, PCS support, disaster help, and family assistance for active duty, reserve, retired, and civilian members.',
    url: 'https://www.cgmahq.org/',
  },
];

const TYPE_STYLE = {
  GRANT: { background: '#E8F5E9', color: '#1B5E20' },
  'FREE ASSISTANCE': { background: '#E3F2FD', color: '#1565C0' },
  'LAND / HOUSING': { background: '#FFF3E0', color: '#A04700' },
};

function normalizeBranch(value) {
  const branch = String(value || '').trim();
  return BRANCH_ALIASES[branch] || branch || 'Army';
}

function isResourceForBranch(resource, branch) {
  return resource.branches.includes('ALL') || resource.branches.includes(branch);
}

// DoD Civilian financial assistance — public, authoritative resources
// that apply to federal civilian employees during a PCS. Replaces
// branch-specific military relief societies (which require uniformed
// service) with civilian-eligible programs.
const CIVILIAN_RESOURCES = [
  {
    name: 'Federal Employee Education and Assistance Fund (FEEA)',
    type: 'GRANT / LOAN',
    branches: ['DoD Civilian'],
    audience: 'Federal civilian employees facing PCS-related financial hardship',
    desc: 'No-interest emergency loans and need-based grants for federal employees facing relocation hardship, unexpected expenses, or shortfalls during a PCS.',
    url: 'https://feea.org',
  },
  {
    name: 'Federal Travel Regulation — Civilian PCS Allowances',
    type: 'FREE ASSISTANCE',
    branches: ['DoD Civilian'],
    audience: 'Federal civilians on a PCS authorization',
    desc: 'GSA Chapter 302 of the FTR governs civilian PCS allowances including HHG, TQSE, real-estate expense, miscellaneous expense, and house-hunting trip reimbursement.',
    url: 'https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation',
  },
  {
    name: 'DCPAS Civilian Relocation Policy Guide',
    type: 'FREE ASSISTANCE',
    branches: ['DoD Civilian'],
    audience: 'DoD civilian employees relocating between agencies or installations',
    desc: 'DoD Civilian Personnel Advisory Service guide explaining service agreements, advance pay, dependent travel, and FTR application within DoD.',
    url: 'https://www.google.com/search?q=DCPAS+relocation+site%3Adcpas.osd.mil',
  },
  {
    name: 'OPM Locality Pay Tables',
    type: 'FREE ASSISTANCE',
    branches: ['DoD Civilian'],
    audience: 'Federal civilians moving between localities',
    desc: 'Office of Personnel Management current-year locality pay tables. Confirm your gaining locality pay rate before signing on a lease or mortgage at the new duty station.',
    url: 'https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/',
  },
  {
    name: 'DSSR — Living Quarters Allowance & Post Allowance (OCONUS)',
    type: 'FREE ASSISTANCE',
    branches: ['DoD Civilian'],
    audience: 'DoD civilians PCSing to OCONUS assignments',
    desc: 'Department of State Standardized Regulations — authoritative LQA, TQSA, Post Allowance, and Education Allowance rates for U.S. government civilians overseas.',
    url: 'https://aoprals.state.gov',
  },
  {
    name: 'TSP Hardship Withdrawal Guidance',
    type: 'GRANT / LOAN',
    branches: ['DoD Civilian'],
    audience: 'Federal civilians with TSP accounts',
    desc: 'Thrift Savings Plan financial hardship in-service withdrawal information — last-resort option for PCS-related cash needs.',
    url: 'https://www.tsp.gov',
  },
  {
    name: 'Employee Assistance Program (EAP)',
    type: 'FREE ASSISTANCE',
    branches: ['DoD Civilian'],
    audience: 'All federal employees and household members',
    desc: 'Free, confidential financial, legal, and mental-health counseling for federal civilian employees. Available 24/7 by phone or online.',
    url: 'https://www.opm.gov/policy-data-oversight/worklife/employee-assistance-programs/',
  },
];

export default function MovingFinancialAssistanceTab({ theme = {}, profile = {} }) {
  const branch = normalizeBranch(profile?.branch);
  const isCivilian = profile?.component === 'DoD Civilian';
  // Civilians get the civilian resource set plus universal entries.
  // Military profiles get branch-specific relief societies plus
  // universal entries; civilians do NOT see Army Emergency Relief,
  // Navy-Marine Corps Relief Society, etc. because eligibility requires
  // active uniformed service.
  const branchSpecific = isCivilian
    ? CIVILIAN_RESOURCES
    : RESOURCES.filter(resource => resource.branches.includes(branch));
  const universal = RESOURCES.filter(resource => resource.branches.includes('ALL'));
  const visibleResources = [...branchSpecific, ...universal].filter(resource => resource.url);
  const colors = {
    primary: theme.primary || '#244247',
    accent: theme.accent || '#C99A3D',
  };

  return (
    <div className="assistance-page">
      <div className="assistance-header">
        <div>
          <div className="assistance-kicker">Moving Relief</div>
          <h2>Financial Assistance for Moving</h2>
          <p>Resources are filtered to the branch selected during onboarding, with universal PCS support kept available for every service member and military family.</p>
        </div>
      </div>

      <section className="assistance-band" aria-label="Branch priority assistance">
        <div className="assistance-band__title">Start Here for {isCivilian ? 'DoD Civilian' : branch}</div>
        <div className="assistance-grid">
          {branchSpecific.length ? (
            branchSpecific.filter(resource => resource.url).map(resource => (
              <ResourceCard key={resource.name} resource={resource} theme={{ ...theme, primary: colors.primary }} compact />
            ))
          ) : (
            <ResourceCard
              resource={{
                name: 'Military OneSource Financial Counseling',
                type: 'FREE ASSISTANCE',
                audience: 'All service members and military families',
                desc: 'Start with Military OneSource if a branch-specific relief organization is not available for the selected profile.',
                url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/',
              }}
              theme={{ ...theme, primary: colors.primary }}
              compact
            />
          )}
        </div>
      </section>

      <section className="assistance-band" aria-label="Universal PCS assistance">
        <div className="assistance-band__title">Universal PCS Assistance</div>
        <div className="assistance-grid">
          {universal.filter(resource => resource.url).map(resource => (
            <ResourceCard key={resource.name} resource={resource} theme={{ ...theme, primary: colors.primary }} compact />
          ))}
        </div>
      </section>

      <div className="assistance-list">
        {visibleResources.map(resource => (
          <ResourceCard key={resource.name} resource={resource} theme={{ ...theme, primary: colors.primary }} />
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>
        Branch relief organizations are shown only when they match the onboarding branch. Universal resources remain visible because they apply across the armed forces.
      </div>
    </div>
  );
}

function ResourceCard({ resource, theme, compact = false }) {
  const style = TYPE_STYLE[resource.type] || { background: `${theme.primary}18`, color: theme.primary };
  return (
    <article className={`assistance-card ${compact ? 'is-compact' : ''}`}>
      <div className="assistance-card__top">
        <h3>{resource.name}</h3>
        <span style={style}>{resource.type}</span>
      </div>
      <div className="assistance-card__audience">{resource.audience}</div>
      <p>{resource.desc}</p>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${resource.name}`}
        className="card-cta"
        style={{ '--cta-color': theme.primary }}
      >
        Open Resource
      </a>
    </article>
  );
}

export { isResourceForBranch };
