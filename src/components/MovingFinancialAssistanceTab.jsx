/*
 * Purpose: Moving financial assistance resources for service members and military families.
 * Third-party dependencies: React only.
 */

import SyncStatusIndicator from './SyncStatusIndicator';

const RESOURCES = [
  {
    name: 'Military OneSource Financial Counseling',
    type: 'FREE ASSISTANCE',
    audience: 'Service members and military families',
    desc: 'Free confidential financial counseling, moving budget help, SCRA guidance, and referrals before or during a PCS.',
    url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/',
  },
  {
    name: 'Operation Homefront Critical Financial Assistance',
    type: 'GRANT',
    audience: 'Eligible active duty, veterans, and military families',
    desc: 'Needs-based grants for rent, utilities, food, vehicle expenses, moving-related emergencies, and other critical family costs.',
    url: '',
  },
  {
    name: 'Army Emergency Relief',
    type: 'GRANT',
    audience: 'Army soldiers, retirees, and eligible family members',
    desc: 'Interest-free loans, grants, and scholarships for emergency travel, rent, utilities, vehicle repair, and PCS strain.',
    url: '',
  },
  {
    name: 'Navy-Marine Corps Relief Society',
    type: 'GRANT',
    audience: 'Navy and Marine Corps families',
    desc: 'Quick Assist Loans, grants, budget counseling, and emergency help for PCS, travel, housing, food, and child needs.',
    url: '',
  },
  {
    name: 'Air Force Aid Society',
    type: 'GRANT',
    audience: 'Air Force and Space Force families',
    desc: 'Emergency assistance, Falcon Loans, grants, and community programs to absorb unexpected relocation costs.',
    url: '',
  },
  {
    name: 'Coast Guard Mutual Assistance',
    type: 'GRANT',
    audience: 'Coast Guard families',
    desc: 'Loans, grants, PCS support, disaster help, and family assistance for active duty, reserve, retired, and civilian members.',
    url: '',
  },
  {
    name: 'Dislocation Allowance and PCS Travel Entitlements',
    type: 'FREE ASSISTANCE',
    audience: 'Most PCS moves',
    desc: 'Official DoD rates for DLA, per diem, temporary lodging, mileage, and dependent travel. Confirm eligibility with finance.',
    url: 'https://www.travel.dod.mil/Allowances/',
  },
  {
    name: 'SCRA Lease and Housing Protections',
    type: 'LAND / HOUSING',
    audience: 'Renters, homeowners, and families with PCS orders',
    desc: 'Federal protections for lease termination, interest caps, foreclosure protections, and housing-related legal questions.',
    url: '',
  },
  {
    name: 'VA Home Loan and Housing Assistance',
    type: 'LAND / HOUSING',
    audience: 'Eligible service members, veterans, and surviving spouses',
    desc: 'Zero-down home loan benefit, housing grants for qualifying disabilities, and official VA housing support.',
    url: 'https://www.va.gov/housing-assistance/',
  },
];

const TYPE_STYLE = {
  GRANT: { background: '#E8F5E9', color: '#1B5E20' },
  'FREE ASSISTANCE': { background: '#E3F2FD', color: '#1565C0' },
  'LAND / HOUSING': { background: '#FFF3E0', color: '#A04700' },
};

export default function MovingFinancialAssistanceTab({ theme, profile }) {
  const branch = profile?.branch || 'Army';
  const branchMatches = RESOURCES.filter(r => r.audience.toLowerCase().includes(branch.toLowerCase().split(' ')[0]));
  const priority = branchMatches.length ? branchMatches : RESOURCES.slice(0, 4);

  return (
    <div className="assistance-page">
      <div className="assistance-header">
        <div>
          <div className="assistance-kicker">Moving Relief</div>
          <h2>Financial Assistance for Moving</h2>
          <p>Resources that can reduce out-of-pocket strain during PCS, with grants and free assistance clearly marked for service members and military families.</p>
        </div>
        <SyncStatusIndicator />
      </div>

      <section className="assistance-band" aria-label="Priority assistance">
        <div className="assistance-band__title">Start Here for {branch}</div>
        <div className="assistance-grid">
          {priority.map(resource => (
            <ResourceCard key={resource.name} resource={resource} theme={theme} compact />
          ))}
        </div>
      </section>

      <div className="assistance-list">
        {RESOURCES.map(resource => (
          <ResourceCard key={resource.name} resource={resource} theme={theme} />
        ))}
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
        style={{ background: theme.primary }}
      >
        Open Resource
      </a>
    </article>
  );
}
