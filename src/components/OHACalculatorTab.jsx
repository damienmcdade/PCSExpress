/*
 * OHA Calculator — Overseas Housing Allowance reference tool.
 * OHA is a rent-cap allowance (not flat-rate like BAH). Members pay rent and are
 * reimbursed up to the OHA cap for their grade/location/dependency status.
 *
 * Rate data + lookup math live in src/lib/ohaCalculator.js so they can be
 * unit-tested. This component is the JSX shell that wires the lookup to the
 * profile + selector state.
 */
import { useState, useMemo } from 'react';
import DataFreshnessFooter from './DataFreshnessFooter';
import { CalculatorResultLabel, PlanningAidDisclaimer } from './CalculatorResultLabel';
import {
  OHA_REGIONS,
  OHA_REGION_KEYS as REGION_KEYS,
  OHA_PAY_GRADES as BAH_PAY_GRADES,
  detectOHARegion as detectRegion,
  formatCurrencyOHA as fmt,
} from '../lib/ohaCalculator';

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


export default function OHACalculatorTab({ theme, profile }) {
  const profileGaining = profile?.gainingInstallation || profile?.gaining || '';
  const autoRegion = detectRegion(profileGaining);

  const [payGrade, setPayGrade] = useState(profile?.paygrade || 'E-5');
  // Auto-derive from onboarding: spouse + each child counts as a
  // dependent for OHA purposes. OHA only distinguishes "with deps" /
  // "without deps" for the rate, but we keep the precise count for the
  // info chip so users see we used everything from their profile.
  const _profileDepCount = useMemo(() => {
    return (profile?.hasDependents ? 1 : 0) + (Array.isArray(profile?.childAges) ? profile.childAges.filter(a => a !== '' && !isNaN(Number(a))).length : 0);
  }, [profile?.hasDependents, profile?.childAges]);
  const [withDeps, setWithDeps] = useState(_profileDepCount > 0);
  const [region, setRegion] = useState(autoRegion || REGION_KEYS[0]);

  const regionData = OHA_REGIONS[region];
  const gradeRates = regionData?.rates[payGrade] || null;
  const rentCap = gradeRates ? gradeRates[withDeps ? 0 : 1] : null;
  const utilityRate = regionData?.utilityRate || 0;
  const miha = regionData?.miha || null;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFFFFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>OHA REFERENCE CALCULATOR</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Overseas Housing Allowance — 2025/2026 Reference Rates</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          OHA is the overseas equivalent of BAH. Unlike BAH, OHA reimburses <strong style={{ color: theme.accent }}>actual rent paid</strong>, up to the cap for your grade and location. Use the official DTMO tool for exact current rates.
        </div>
      </div>

      {/* How OHA Works */}
      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#1E40AF', marginBottom: 8 }}>How OHA Works</div>
        <div style={{ display: 'grid', gap: 6, fontSize: 11, color: '#1E3A8A', lineHeight: 1.55 }}>
          <div>📋 <strong>Rent Cap:</strong> You pay rent and are reimbursed up to the cap. Rent above the cap comes out of pocket.</div>
          <div>⚡ <strong>Utility/Recurring Maintenance:</strong> A separate monthly allowance to cover utilities — paid in addition to OHA.</div>
          <div>🏠 <strong>MIHA (Move-In Housing Allowance):</strong> One-time payment to cover security deposits, key money, and moving costs.</div>
          <div>📄 <strong>Lease Required:</strong> You must submit a lease to your housing office. OHA payment begins on lease start date.</div>
          <div>💱 <strong>Exchange Rate:</strong> Rates are set in USD based on periodic DTMO surveys and may lag behind currency movements.</div>
        </div>
      </div>

      {/* Auto-detected notice */}
      {autoRegion && (
        <div style={{ background: '#F0FFF4', border: '1px solid #A5D6A7', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#1B5E20' }}>
          Auto-detected from your profile: <strong>{profileGaining}</strong> → <strong>{autoRegion}</strong>
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          OVERSEAS REGION / INSTALLATION
          <select value={region} onChange={e => setRegion(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
            {REGION_KEYS.map(r => (
              <option key={r} value={r}>{OHA_REGIONS[r].flag}  {r}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
            PAY GRADE
            <select value={payGrade} onChange={e => setPayGrade(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
              {BAH_PAY_GRADES.map(pg => <option key={pg} value={pg}>{pg}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
            DEPENDENTS
            <select value={withDeps ? '1' : '0'} onChange={e => setWithDeps(e.target.value === '1')} style={{ ...fieldStyle, marginTop: 5 }}>
              <option value="1">With Dependents</option>
              <option value="0">Without Dependents</option>
            </select>
            {_profileDepCount > 0 && withDeps && (
              <div style={{ fontSize: 10, color: '#2E7D32', marginTop: 4, fontWeight: 700 }}>
                ✓ Auto-filled from profile{(profile?.hasDependents || (profile?.childAges?.length > 0)) ? ` (${profile.hasDependents ? 'spouse' : ''}${profile.hasDependents && profile.childAges?.length > 0 ? ' + ' : ''}${profile.childAges?.length > 0 ? `${profile.childAges.length} child${profile.childAges.length > 1 ? 'ren' : ''}` : ''})` : ''}
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Results */}
      {rentCap && (
        <>
          {/* Main rate card */}
          <div style={{ background: theme.primary, borderRadius: 18, padding: 20, marginBottom: 14, color: '#FFF', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.12em', marginBottom: 4 }}>ESTIMATED MONTHLY OHA RENT CAP</div>
            <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1, letterSpacing: '-1px', marginBottom: 6 }}>{fmt(rentCap)}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              {payGrade} · {withDeps ? 'with dependents' : 'without dependents'} · {region}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Reference rate — verify exact amount at DTMO</div>
            <CalculatorResultLabel
              tier="estimate"
              note="OHA rates publish quarterly; the values shown are FY 2025/2026 references not yet confirmed against the current DTMO publication."
            />
          </div>

          {/* Monthly breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E0E6EE', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 4 }}>UTILITY ALLOWANCE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0D1821' }}>{fmt(utilityRate)}</div>
              <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>Per month, in addition to OHA</div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E0E6EE', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 4 }}>TOTAL MONTHLY HOUSING</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#2E7D32' }}>{fmt(rentCap + utilityRate)}</div>
              <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>OHA cap + utilities</div>
            </div>
          </div>

          {/* MIHA */}
          {miha && (
            <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#6D4C00', marginBottom: 8 }}>MIHA — Move-In Housing Allowance (One-Time)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#6D4C00', fontWeight: 900 }}>MIHA MOVING</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#6D4C00' }}>{fmt(miha.moving)}</div>
                  <div style={{ fontSize: 10, color: '#8D6E00' }}>Covers transportation of household items to off-post housing</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#6D4C00', fontWeight: 900 }}>MIHA ONE-TIME</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#6D4C00' }}>{fmt(miha.onetime)}</div>
                  <div style={{ fontSize: 10, color: '#8D6E00' }}>Security deposits, key money, agent fees</div>
                </div>
              </div>
            </div>
          )}

          {/* Installation list */}
          {regionData?.installations && (
            <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 6 }}>INSTALLATIONS IN THIS REGION</div>
              <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{regionData.installations.join(' · ')}</div>
            </div>
          )}

          {/* Notes */}
          {regionData?.notes && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11, color: '#1E3A8A', lineHeight: 1.6 }}>
              {regionData.notes}
            </div>
          )}

          {/* With / without comparison */}
          <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', letterSpacing: '.08em', marginBottom: 8 }}>WITH vs. WITHOUT DEPENDENTS — {payGrade}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#56697C' }}>With Dependents</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#2E7D32' }}>{fmt(gradeRates[0])}</div>
              </div>
              <div style={{ fontSize: 12, color: '#56697C' }}>vs.</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#56697C' }}>Without Dependents</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0D1821' }}>{fmt(gradeRates[1])}</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#56697C' }}>
              Dependency differential: <strong>{fmt(gradeRates[0] - gradeRates[1])}/mo</strong>
            </div>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11, color: '#6D4C00', lineHeight: 1.6 }}>
        <strong>Disclaimer:</strong> Rates shown are reference estimates based on DTMO published tables and may not reflect the most current quarterly adjustments. OHA rates change throughout the year. Always verify your exact entitlement with the official DTMO OHA Rate Lookup tool and your unit housing office before signing a lease.
      </div>

      {/* Official links */}
      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>
          Official DTMO OHA Rate Lookup Tool
        </a>
        <a href="https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DTMO OHA Policy & Regulations
        </a>
        <a href="https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/MIHA/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DTMO MIHA Information
        </a>
      </div>

      <PlanningAidDisclaimer />
      <DataFreshnessFooter versionKey="oha" />
    </div>
  );
}
