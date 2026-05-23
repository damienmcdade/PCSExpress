/*
 * LQA / TQSA Reference Calculator — Living Quarters Allowance and
 * Temporary Quarters Subsistence Allowance for DoD Civilians OCONUS.
 *
 * Rate data + lookup math live in src/lib/lqaCalculator.js so they can be
 * unit-tested. This component is the JSX shell that wires the lookup to
 * the profile + selector state.
 */
import { useState, useMemo } from 'react';
import DataFreshnessFooter from './DataFreshnessFooter';
import { CalculatorResultLabel, PlanningAidDisclaimer } from './CalculatorResultLabel';
import {
  LQA_POSTS,
  POST_KEYS,
  GRADE_GROUPS,
  FAMILY_BUCKETS,
  TQSA_TIERS,
  formatCurrencyLQA as fmt,
  detectPost,
  detectGroup,
} from '../lib/lqaCalculator';

const fieldStyle = {
  width: '100%',
  border: '1px solid #D8DEE7',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 14,
  color: '#111827',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  appearance: 'auto',
};
export default function LQACalculatorTab({ theme, profile }) {
  const profileGaining = profile?.gainingInstallation || profile?.gaining || '';
  const autoPost = detectPost(profileGaining);
  const autoGroup = detectGroup(profile?.paygrade);

  const _profileFamilyCount = useMemo(() => {
    const adults = 1 + (profile?.hasDependents ? 1 : 0);
    const kids = Array.isArray(profile?.childAges) ? profile.childAges.filter(a => a !== '' && !isNaN(Number(a))).length : 0;
    return adults + kids;
  }, [profile?.hasDependents, profile?.childAges]);

  const [post, setPost] = useState(autoPost || POST_KEYS[0]);
  const [group, setGroup] = useState(autoGroup);
  const [familySize, setFamilySize] = useState(() => {
    if (_profileFamilyCount >= 7) return 7;
    if (_profileFamilyCount >= 5) return 6;
    if (_profileFamilyCount >= 3) return 4;
    return Math.max(1, _profileFamilyCount);
  });
  const [tqsaAdultDeps, setTqsaAdultDeps] = useState(profile?.hasDependents ? 1 : 0);
  const [tqsaChildDeps, setTqsaChildDeps] = useState(() => {
    return Array.isArray(profile?.childAges) ? profile.childAges.filter(a => a !== '' && !isNaN(Number(a))).length : 0;
  });

  const postData = LQA_POSTS[post];
  const groupTier = GRADE_GROUPS.find(g => g.value === group)?.tier || 1.00;
  const familyMult = FAMILY_BUCKETS.find(b => b.value === familySize)?.mult || 1.00;
  const annualLqa = Math.round((postData?.baseAnnual || 0) * familyMult * groupTier);
  const monthlyLqa = Math.round(annualLqa / 12);
  const tqsaBase = postData?.tqsaDailyMax || 0;

  // TQSA daily totals by tier
  const tqsaRows = TQSA_TIERS.map(tier => {
    const occupant = Math.round(tqsaBase * tier.occupant);
    const adults = Math.round(tqsaBase * tier.adultDep) * tqsaAdultDeps;
    const children = Math.round(tqsaBase * tier.childDep) * tqsaChildDeps;
    const total = occupant + adults + children;
    return { label: tier.label, occupant, adults, children, total };
  });
  const tqsaFirst30Total = tqsaRows[0]?.total * 30 || 0;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: theme.secondary || '#1A3A5C', borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFFFFF', border: `1px solid ${theme.accent || '#C99A3D'}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent || '#C99A3D', letterSpacing: '.16em', marginBottom: 6 }}>LQA / TQSA REFERENCE CALCULATOR</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Living Quarters & Temporary Quarters Subsistence Allowance (DoD Civilian, OCONUS)</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          LQA is the civilian equivalent of OHA — a <strong style={{ color: theme.accent || '#C99A3D' }}>rent + utility ceiling</strong> set by the Department of State under the DSSR. TQSA covers temporary lodging at arrival/departure. Use the DSSR rate lookup to verify exact entitlement before signing a lease or filing SF-1190.
        </div>
      </div>

      {/* How LQA / TQSA Work */}
      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#1E40AF', marginBottom: 8 }}>How LQA / TQSA Work</div>
        <div style={{ display: 'grid', gap: 6, fontSize: 11, color: '#1E3A8A', lineHeight: 1.55 }}>
          <div>🏠 <strong>LQA Ceiling:</strong> Rent + utilities up to the published annual ceiling for your post, grade group, and family size. Costs above the ceiling come out of pocket.</div>
          <div>📑 <strong>SF-1190:</strong> Filed annually with the gaining DoD HR office to certify rent and utilities for LQA reimbursement.</div>
          <div>🏨 <strong>TQSA:</strong> Per-day allowance for hotel + meals during the temporary-quarters period at arrival (up to 90 days) or departure (up to 30 days), DSSR §123.</div>
          <div>👨‍👩‍👧 <strong>Family Size:</strong> LQA ceilings step up for households of 3-4 / 5-6 / 7+. TQSA pays a tapered percentage for each adult and child dependent.</div>
          <div>💱 <strong>USD-Denominated:</strong> All amounts paid in USD; the Department of State adjusts post ceilings as host-nation rents and exchange rates move.</div>
        </div>
      </div>

      {/* Auto-detected notice */}
      {(autoPost || autoGroup !== 'g2') && (
        <div style={{ background: '#F0FFF4', border: '1px solid #A5D6A7', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#1B5E20' }}>
          {autoPost && <>Post auto-detected from your profile: <strong>{profileGaining}</strong> → <strong>{autoPost}</strong>{autoGroup !== 'g2' ? <>; grade group inferred from <strong>{profile?.paygrade}</strong></> : null}</>}
          {!autoPost && autoGroup !== 'g2' && <>Grade group inferred from <strong>{profile?.paygrade}</strong></>}
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary || '#244247' }}>
          OVERSEAS POST
          <select value={post} onChange={e => setPost(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
            {POST_KEYS.map(p => (
              <option key={p} value={p}>{LQA_POSTS[p].flag}  {p}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary || '#244247' }}>
            GRADE GROUP
            <select value={group} onChange={e => setGroup(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
              {GRADE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary || '#244247' }}>
            FAMILY SIZE
            <select value={familySize} onChange={e => setFamilySize(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 5 }}>
              {FAMILY_BUCKETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {_profileFamilyCount > 0 && (
              <div style={{ fontSize: 10, color: '#2E7D32', marginTop: 4, fontWeight: 700 }}>
                ✓ Auto-filled from profile ({_profileFamilyCount} person{_profileFamilyCount > 1 ? 's' : ''})
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Main LQA card */}
      <div style={{ background: theme.primary || '#244247', borderRadius: 18, padding: 20, marginBottom: 14, color: '#FFF', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent || '#C99A3D', letterSpacing: '.12em', marginBottom: 4 }}>ESTIMATED ANNUAL LQA CEILING</div>
        <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1, letterSpacing: '-1px', marginBottom: 6 }}>{fmt(annualLqa)}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
          {GRADE_GROUPS.find(g => g.value === group)?.label.split(' — ')[0]} · {FAMILY_BUCKETS.find(b => b.value === familySize)?.label} · {post}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>≈ {fmt(monthlyLqa)} / month — reference rate, verify on allowances.state.gov</div>
        <CalculatorResultLabel
          tier="estimate"
          note="LQA / TQSA ceilings shown are representative DSSR §920 values not yet confirmed against the current Department of State publication."
        />
      </div>

      {/* Monthly / annual breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E0E6EE', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 4 }}>MONTHLY ALLOWANCE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0D1821' }}>{fmt(monthlyLqa)}</div>
          <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>Annual ceiling ÷ 12</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E0E6EE', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 4 }}>TQSA — FIRST 30 DAYS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2E7D32' }}>{fmt(tqsaFirst30Total)}</div>
          <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>Hotel + meals during arrival period</div>
        </div>
      </div>

      {/* TQSA inputs */}
      <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', letterSpacing: '.08em', marginBottom: 10 }}>TQSA — DAILY ALLOWANCE BY TIER</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#1A3A5C' }}>
            ADULT DEPENDENTS (12+)
            <select value={tqsaAdultDeps} onChange={e => setTqsaAdultDeps(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 5 }}>
              {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#1A3A5C' }}>
            CHILD DEPENDENTS (under 12)
            <select value={tqsaChildDeps} onChange={e => setTqsaChildDeps(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 5 }}>
              {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {tqsaRows.map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px', fontSize: 12 }}>
              <span style={{ color: '#1A3A5C', fontWeight: 700 }}>{r.label}</span>
              <span style={{ color: '#0D1821', fontWeight: 800 }}>
                <span style={{ color: '#56697C', fontWeight: 600 }}>occupant {fmt(r.occupant)}</span>
                {r.adults > 0 && <> · <span style={{ color: '#56697C', fontWeight: 600 }}>adults {fmt(r.adults)}</span></>}
                {r.children > 0 && <> · <span style={{ color: '#56697C', fontWeight: 600 }}>children {fmt(r.children)}</span></>}
                <> · </>
                <strong style={{ color: '#2E7D32' }}>{fmt(r.total)}/day</strong>
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#1A3A5C', marginTop: 8, lineHeight: 1.5 }}>
          DSSR §123 tapers TQSA across three 30-day tiers. Arrival period is up to 90 days; departure period up to 30 days. Receipts required for lodging.
        </div>
      </div>

      {/* Installation list */}
      {postData?.installations && (
        <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 6 }}>INSTALLATIONS IN THIS POST</div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{postData.installations.join(' · ')}</div>
        </div>
      )}

      {/* Notes */}
      {postData?.notes && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11, color: '#1E3A8A', lineHeight: 1.6 }}>
          {postData.notes}
        </div>
      )}

      {/* Group comparison */}
      <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', letterSpacing: '.08em', marginBottom: 8 }}>ANNUAL LQA BY GRADE GROUP — {FAMILY_BUCKETS.find(b => b.value === familySize)?.label}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {GRADE_GROUPS.map(g => {
            const amt = Math.round((postData?.baseAnnual || 0) * familyMult * g.tier);
            return (
              <div key={g.value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E0E6EE' }}>
                <span style={{ fontSize: 11, color: g.value === group ? '#1A3A5C' : '#56697C', fontWeight: g.value === group ? 900 : 600 }}>
                  {g.label.split(' — ')[0]} — {g.label.split(' — ')[1]}
                </span>
                <span style={{ fontSize: 13, color: g.value === group ? '#2E7D32' : '#0D1821', fontWeight: g.value === group ? 900 : 700 }}>{fmt(amt)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11, color: '#6D4C00', lineHeight: 1.6 }}>
        <strong>Disclaimer:</strong> Rates shown are reference estimates derived from published DSSR ceilings. Department of State updates LQA ceilings quarterly and TQSA per-diem caps periodically. Always verify your exact entitlement on allowances.state.gov and through the gaining DoD HR / DCPAS office before signing a lease or filing SF-1190.
      </div>

      {/* Official links */}
      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://allowances.state.gov/Default.asp" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary || '#244247' }}>
          Official DSSR Rate Lookup (Department of State)
        </a>
        <a href="https://www.dcpas.osd.mil/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DCPAS — LQA Worksheet & Eligibility Guide
        </a>
        <a href="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DoD JTR Chapter 5 — DoD Civilian Travel
        </a>
        <a href="https://www.gsa.gov/policy-regulations/regulations" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          GSA Federal Travel Regulation (FTR) Chapter 302
        </a>
      </div>

      <PlanningAidDisclaimer />
      <DataFreshnessFooter versionKey="lqa" />
    </div>
  );
}
