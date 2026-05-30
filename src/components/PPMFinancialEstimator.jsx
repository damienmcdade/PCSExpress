/*
 * Purpose: Mobile-first PPM estimator UI for PCS Express.
 * Third-party dependencies: React.
 */

import { useMemo, useState } from 'react';
import DataFreshnessFooter from './DataFreshnessFooter';
import { CalculatorResultLabel, PlanningAidDisclaimer } from './CalculatorResultLabel';
import { PPM_PAYGRADES, calculatePPMEstimate, formatCurrency } from '../lib/ppmCalculator';

const fieldStyle = {
  width: '100%',
  border: '1px solid #D8DEE7',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 14,
  color: '#111827',
  background: '#FFFFFF',
  boxSizing: 'border-box',
};

function MetricCard({ label, value, note, tone = '#1565C0' }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${tone}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 950, color: '#0D1821', lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45, marginTop: 6 }}>{note}</div>}
    </div>
  );
}

// Per JTR §050302, PPM (Personally Procured Move) is generally not
// authorized for OCONUS PCS. The DoD ships household goods through the
// Defense Personal Property System (DPS) using the Patriot Express or
// commercial-port sea shipment instead. A small number of OCONUS
// localities (Alaska, Hawaii, Guam, and a few specific Pacific bases)
// can authorize a partial PPM, but the gaining PPSO has the final call.
const OCONUS_PPM_PARTIAL_ALLOWED = new Set([
  // Alaska intra-theatre / inter-base moves can be PPM-authorized.
  'fort wainwright','fort greely','jber','elmendorf','eielson','clear space force station',
  // Hawaii intra-island moves can be authorized as PPM.
  'jbphh','schofield','shafter','fort shafter','kaneohe','barbers point','wheeler army airfield','mcb hawaii',
  // Guam intra-island.
  'andersen','nb guam','naval base guam','navy base guam',
]);
function gainingIsOconusPpmRestricted(profile) {
  const raw = String(profile?.gainingInstallation || '').toLowerCase();
  if (!raw) return false;
  if (!profile?.isOverseas) return false;
  // Profile is OCONUS — check if the gaining base is on the limited
  // PPM-allowed allowlist. If not, surface the JTR §050302 restriction.
  return !Array.from(OCONUS_PPM_PARTIAL_ALLOWED).some(kw => raw.includes(kw));
}

export default function PPMFinancialEstimator({ theme, profile }) {
  const isCivilian = profile?.component === 'DoD Civilian';
  const oconusRestricted = gainingIsOconusPpmRestricted(profile);
  // Civilian profiles carry a GS/SES/WG grade not in PPM_PAYGRADES.
  // We fall back to an E-5 baseline so the calculator still produces a
  // meaningful planning number; the civilian banner notes the
  // limitation and points users to the authoritative DCPAS/JTR sources.
  const initialRank = (profile?.paygrade && PPM_PAYGRADES.includes(profile.paygrade)) ? profile.paygrade : 'E-5';
  const [rank, setRank] = useState(initialRank);
  const [yearsOfService, setYearsOfService] = useState('6');
  const [distanceMiles, setDistanceMiles] = useState('850');
  // Civilian PCS weight allowance is a flat 18,000 lbs per FTR §302-7
  // versus the military's rank-tied allowance. Default the field
  // accordingly when the profile signals civilian status.
  const [estimatedWeightLbs, setEstimatedWeightLbs] = useState(isCivilian ? '18000' : '7500');

  const estimate = useMemo(() => calculatePPMEstimate({
    rank,
    yearsOfService,
    distanceMiles,
    estimatedWeightLbs,
  }), [rank, yearsOfService, distanceMiles, estimatedWeightLbs]);

  const meterWidth = `${Math.max(0, estimate.profitMeterPercent)}%`;
  const isProfit = estimate.estimatedCashInPocket >= 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFFFFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>PPM FINANCIAL ESTIMATOR</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Personally Procured Move cash-flow planner</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Estimates 95 percent of a planning Government Constructive Cost against rental truck, fuel, labor, supplies, and tax withholding. Official PPM payment amounts must come from DPS, your PPPO/TMO, and current JTR guidance.
        </div>
      </div>

      {isCivilian && (
        <div style={{ background: '#FFF3E0', border: '1.5px solid #FFB74D', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#6D4C00', lineHeight: 1.55 }}>
          <strong>DoD Civilian planning estimate.</strong> Civilian PPM reimbursement follows the Federal Travel Regulation §302-7 against your 18,000 lb weight allowance; the exact basis differs from the military rate, so this figure is only a planning proxy. The rank field below maps to a military E/O paygrade for math purposes only; your actual reimbursement is calculated by your servicing DCPAS / TMO office at the gaining activity. Use this as a planning order-of-magnitude only.
        </div>
      )}

      {oconusRestricted && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #EF9A9A', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#7F0000', lineHeight: 1.55 }}>
          <strong>OCONUS PPM is generally not authorized.</strong> Per JTR §050302, PPM is restricted at most overseas installations — household goods normally ship through DPS via Patriot Express or sea-freight, with the optional partial-PPM only at Alaska / Hawaii / Guam and select Pacific bases. Confirm with the gaining PPSO before relying on the numbers below. If the gaining PPSO denies PPM authorization, the figures here will overstate your reimbursement.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          RANK
          <select value={rank} onChange={(e) => setRank(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
            {PPM_PAYGRADES.map(pg => <option key={pg} value={pg}>{pg}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          YEARS OF SERVICE
          <input inputMode="numeric" min="0" max="40" value={yearsOfService} onChange={(e) => setYearsOfService(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }} />
        </label>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          MOVE DISTANCE
          <input inputMode="numeric" min="0" value={distanceMiles} onChange={(e) => setDistanceMiles(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }} />
        </label>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          EST. WEIGHT
          <input inputMode="numeric" min="0" value={estimatedWeightLbs} onChange={(e) => setEstimatedWeightLbs(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }} />
        </label>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: '0 10px 26px rgba(13,24,33,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#56697C', fontWeight: 900, letterSpacing: '.08em' }}>PROFIT METER</div>
            <div style={{ fontSize: 24, color: isProfit ? '#1B5E20' : '#B71C1C', fontWeight: 950 }}>{formatCurrency(estimate.estimatedCashInPocket)}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#56697C', lineHeight: 1.45 }}>
            <strong>{estimate.profitMeterPercent}%</strong><br />estimated cash-in-pocket after taxes
          </div>
        </div>
        <div style={{ height: 13, borderRadius: 999, background: '#EEF2F6', overflow: 'hidden', border: '1px solid #D8DEE7' }}>
          <div style={{ width: isProfit ? meterWidth : '8%', height: '100%', background: isProfit ? `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` : '#B71C1C', transition: 'width .2s ease' }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>
          Weight above the rank planning allowance is excluded from the reimbursable estimate. This is a planning tool, not an entitlement decision.
        </div>
        <CalculatorResultLabel
          tier="estimate"
          note="Uses official JTR incentive rate with estimated market costs (fuel, truck rental, labor) — verify the official PPM payment with DPS / your PPSO."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <MetricCard label="PPM incentive (100% GCC)" value={formatCurrency(estimate.grossIncentive)} note={`${estimate.reimbursableWeightLbs.toLocaleString()} reimbursable lbs of ${estimate.estimatedWeightLbs.toLocaleString()} entered`} tone={theme.primary} />
        <MetricCard label="Tax withholding" value={formatCurrency(estimate.estimatedTaxWithholding)} note={`${Math.round(estimate.federalTaxWithholdingRate * 100)}% planning holdback`} tone="#7A4A00" />
        <MetricCard label="Truck and fuel" value={formatCurrency(estimate.rentalTruckAndFuelCost)} note={`${estimate.travelDays} travel day estimate`} tone="#455A64" />
        <MetricCard label="Official weight cap" value={`${estimate.authorizedWeightLbs.toLocaleString()} lbs`} note={estimate.excessWeightLbs > 0 ? `${estimate.excessWeightLbs.toLocaleString()} lbs may be excess` : 'No excess weight shown'} tone={estimate.excessWeightLbs > 0 ? '#B71C1C' : '#1B5E20'} />
      </div>

      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: 14, fontSize: 11, color: '#6D4C00', lineHeight: 1.6, marginBottom: 12 }}>
        JTR and PPM incentive rates can change. In 2025, DTMO published changes clarifying 100 percent Best Value cost and a temporary 130 percent PPM rate; this module keeps the requested 95 percent formula as a conservative planning setting until the user verifies the official DPS/PPPO estimate.
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>Open Joint Travel Regulations</a>
        <a href="https://dps.move.mil/cust/standard/user/home.xhtml" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Open DPS / Move.mil</a>
      </div>

      <PlanningAidDisclaimer />
      <DataFreshnessFooter versionKey="ppm" />
      <DataFreshnessFooter versionKey="ppm_config" />
    </div>
  );
}
