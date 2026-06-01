/*
 * Move Strategy module — the PCS Express flagship differentiator.
 *
 * Three stacked tools that no competitor bundles together:
 *   (A) On-device HHG weight estimator (Quick room-count mode + Itemized
 *       per-article stepper mode), summed from the move.mil weight-estimator
 *       convention in ../data/weightEstimatorData.
 *   (B) Allowance gauge — estimated weight vs the rank/dependency-tied JTR
 *       HHG allowance (getAuthorizedWeightAllowance).
 *   (C) Overweight-cost warning — the ≈ government bill for weight above the
 *       cap, derived from the SAME GCC coefficients via the shared
 *       ppmCalculator (no money math is re-implemented here).
 *   (D) Move-method comparison — Full Government HHG vs Full PPM vs Partial
 *       PPM, showing ONLY the extra cash from the move method. DLA, per diem,
 *       and MALT are paid identically for all three, so they cancel and are
 *       deliberately excluded from these numbers.
 *
 * Persistence mirrors InventoryVaultModule: every write goes through the
 * AES-256-GCM secureLocalStore, guarded by a hydration ref so the empty
 * default never clobbers saved data, and AuditLogger records metadata-only
 * events (counts/mode — never the underlying values).
 *
 * Third-party dependencies: React.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import DataFreshnessFooter from './DataFreshnessFooter';
import { CalculatorResultLabel, PlanningAidDisclaimer } from './CalculatorResultLabel';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import {
  PPM_PAYGRADES,
  getAuthorizedWeightAllowance,
  calculateGovernmentConstructiveCost,
  calculatePPMEstimate,
  formatCurrency,
} from '../lib/ppmCalculator';
import {
  ROOMS,
  ROOM_AVERAGE_LBS,
  quickEstimate,
  sumItemizedWeight,
  excessWeight,
  partialMoveWeight,
  estimateExcessGovernmentBill,
  findPpmBreakEvenWeight,
} from '../data/weightEstimatorData';

const STORAGE_KEY = 'pcs_move_strategy';

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

function defaultState() {
  return {
    mode: 'quick', // 'quick' | 'itemized'
    roomCounts: {}, // roomId -> count (quick mode)
    selections: {}, // itemId -> qty (itemized mode)
    partialPct: 50, // 0..100 weight the member moves themselves in Partial PPM
    overrides: { rank: '', withDependents: null, distanceMiles: '' },
  };
}

function MetricCard({ label, value, note, tone = '#1565C0' }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${tone}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 950, color: '#0D1821', lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45, marginTop: 6 }}>{note}</div>}
    </div>
  );
}

function Stepper({ label, value, onDec, onInc, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: '1px solid #F0F3F7' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#0D1821', fontWeight: 700 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#56697C', marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={onDec}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #D8DEE7', background: '#FFFFFF', color: '#0D1821', fontWeight: 900, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
        >−</button>
        <div aria-live="polite" style={{ minWidth: 22, textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#0D1821' }}>{value}</div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={onInc}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #D8DEE7', background: '#FFFFFF', color: '#0D1821', fontWeight: 900, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
        >+</button>
      </div>
    </div>
  );
}

export default function MoveStrategyModule({ theme, profile }) {
  const [state, setState] = useState(defaultState());
  const [loaded, setLoaded] = useState(false);
  // Hydration guard — see InventoryVaultModule: secureLocalStore.get is async
  // (AES decrypt), so the first render shows the empty default. Block every
  // write until the initial decrypt resolves so we never persist the empty
  // default OVER the user's saved selections.
  const loadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, defaultState()).then(saved => {
      if (mounted) {
        setState({ ...defaultState(), ...(saved || {}) });
        loadedRef.current = true;
        setLoaded(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  const persist = (updater) => {
    if (!loadedRef.current) return; // never clobber saved data before it loads
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      secureLocalStore.set(STORAGE_KEY, next);
      // Metadata-only audit: counts + mode, never the underlying values.
      AuditLogger.record('move_strategy_change', {
        mode: next.mode,
        roomsSelected: Object.values(next.roomCounts || {}).filter(n => n > 0).length,
        itemsSelected: Object.values(next.selections || {}).filter(n => n > 0).length,
        partialPct: next.partialPct,
      });
      return next;
    });
  };

  // ── Derived inputs (profile with manual overrides) ────────────────────
  const profileRank = (profile?.paygrade && PPM_PAYGRADES.includes(profile.paygrade)) ? profile.paygrade : null;
  const rank = state.overrides.rank || profileRank || 'E-5';
  // Mirror PPMFinancialEstimator: dependency status drives the JTR weight cap.
  const withDependents = state.overrides.withDependents != null
    ? state.overrides.withDependents
    : !!profile?.hasDependents;
  const distanceMiles = state.overrides.distanceMiles || '1000';

  // ── (A) Weight estimate ───────────────────────────────────────────────
  const estimatedWeightLbs = useMemo(() => (
    state.mode === 'quick'
      ? quickEstimate(state.roomCounts)
      : sumItemizedWeight(state.selections)
  ), [state.mode, state.roomCounts, state.selections]);

  // ── (B) Allowance ─────────────────────────────────────────────────────
  const authorizedWeightLbs = getAuthorizedWeightAllowance(rank, withDependents);
  const excess = excessWeight(estimatedWeightLbs, authorizedWeightLbs);
  const isOver = excess > 0;
  const gaugePct = Math.min(100, authorizedWeightLbs > 0 ? Math.round((estimatedWeightLbs / authorizedWeightLbs) * 100) : 0);

  // ── (C) Overweight cost (same GCC coefficients via ppmCalculator) ──────
  const excessBill = useMemo(() => (
    estimateExcessGovernmentBill(calculateGovernmentConstructiveCost, {
      withDependents, distanceMiles, estimatedWeightLbs, authorizedWeightLbs,
    })
  ), [withDependents, distanceMiles, estimatedWeightLbs, authorizedWeightLbs]);

  // ── (D) Move-method comparison ────────────────────────────────────────
  const partialWeight = partialMoveWeight(estimatedWeightLbs, state.partialPct / 100);

  const fullPpm = useMemo(() => calculatePPMEstimate({
    rank, withDependents, distanceMiles, estimatedWeightLbs,
  }), [rank, withDependents, distanceMiles, estimatedWeightLbs]);

  const partialPpm = useMemo(() => calculatePPMEstimate({
    rank, withDependents, distanceMiles, estimatedWeightLbs: partialWeight,
  }), [rank, withDependents, distanceMiles, partialWeight]);

  const breakEven = useMemo(() => findPpmBreakEvenWeight(calculatePPMEstimate, {
    rank, withDependents, distanceMiles,
  }), [rank, withDependents, distanceMiles]);

  const scenarios = [
    { id: 'hhg', name: 'Full Government HHG', additionalCash: 0, sub: 'Government moves 100% of your goods', tone: '#455A64' },
    { id: 'ppm', name: 'Full PPM / DITY', additionalCash: fullPpm.estimatedCashInPocket, sub: 'You move 100% yourself', tone: theme.primary },
    { id: 'partial', name: `Partial PPM (${state.partialPct}%)`, additionalCash: partialPpm.estimatedCashInPocket, sub: `You move ${partialWeight.toLocaleString()} lbs yourself`, tone: theme.accent },
  ];
  const bestScenario = scenarios.reduce((best, s) => (s.additionalCash > best.additionalCash ? s : best), scenarios[0]);

  // ── State mutators ────────────────────────────────────────────────────
  const setMode = (mode) => persist(prev => ({ ...prev, mode }));
  const bumpRoom = (roomId, delta) => persist(prev => {
    const cur = Math.max(0, (prev.roomCounts[roomId] || 0) + delta);
    return { ...prev, roomCounts: { ...prev.roomCounts, [roomId]: cur } };
  });
  const bumpItem = (itemId, delta) => persist(prev => {
    const cur = Math.max(0, (prev.selections[itemId] || 0) + delta);
    return { ...prev, selections: { ...prev.selections, [itemId]: cur } };
  });
  const setPartialPct = (pct) => persist(prev => ({ ...prev, partialPct: pct }));
  const setOverride = (key, value) => persist(prev => ({ ...prev, overrides: { ...prev.overrides, [key]: value } }));
  const resetAll = () => persist(() => defaultState());

  const profileMissingInputs = !profileRank || profile?.hasDependents == null;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFFFFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>MOVE STRATEGY</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Weight estimator + overweight gauge + HHG vs PPM money comparison</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.80)' }}>
          Estimate your household-goods weight on-device, see it against your rank&apos;s JTR allowance, and compare the extra cash from a full government move, a full PPM, or a partial PPM. Everything is stored encrypted on your device.
        </div>
      </div>

      {/* ── (A) WEIGHT ESTIMATOR ─────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: '0 10px 26px rgba(13,24,33,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.06em' }}>1 · WEIGHT ESTIMATOR</div>
          <div role="tablist" aria-label="Estimate mode" style={{ display: 'flex', background: '#EEF2F6', borderRadius: 10, padding: 3 }}>
            {[{ id: 'quick', label: 'Quick' }, { id: 'itemized', label: 'Itemized' }].map(m => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={state.mode === m.id}
                aria-label={`${m.label} estimate mode`}
                onClick={() => setMode(m.id)}
                style={{
                  border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 900, cursor: 'pointer',
                  background: state.mode === m.id ? theme.primary : 'transparent',
                  color: state.mode === m.id ? '#FFFFFF' : '#56697C',
                }}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {state.mode === 'quick' ? (
          <>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
              Count each fully-furnished room. Official move.mil rule of thumb: <strong>≈ {ROOM_AVERAGE_LBS.toLocaleString()} lbs per room</strong>.
            </div>
            <div>
              {ROOMS.map(room => (
                <Stepper
                  key={room.id}
                  label={room.name}
                  sub={`≈ ${((state.roomCounts[room.id] || 0) * ROOM_AVERAGE_LBS).toLocaleString()} lbs`}
                  value={state.roomCounts[room.id] || 0}
                  onDec={() => bumpRoom(room.id, -1)}
                  onInc={() => bumpRoom(room.id, +1)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
              Add the quantity of each article. Weights are conservative DoD/industry per-item averages, not a guaranteed scale weight.
            </div>
            {ROOMS.map(room => (
              <div key={room.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: theme.primary, letterSpacing: '.05em', margin: '8px 0 2px' }}>{room.name.toUpperCase()}</div>
                {room.items.map(item => (
                  <Stepper
                    key={item.id}
                    label={item.name}
                    sub={`${item.lbs} lbs each`}
                    value={state.selections[item.id] || 0}
                    onDec={() => bumpItem(item.id, -1)}
                    onInc={() => bumpItem(item.id, +1)}
                  />
                ))}
              </div>
            ))}
          </>
        )}

        <div style={{ marginTop: 14, padding: 14, background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 11, color: '#56697C', fontWeight: 900, letterSpacing: '.08em' }}>ESTIMATED WEIGHT</div>
          <div aria-live="polite" style={{ fontSize: 26, fontWeight: 950, color: theme.primary }}>{estimatedWeightLbs.toLocaleString()} lbs</div>
        </div>
        <CalculatorResultLabel
          tier="estimate"
          note="Per-item averages follow the move.mil / DPS weight-estimator convention. Your binding shipment weight comes from certified weight tickets (DD Form 619) and your TMO/PPPO."
        />
      </div>

      {/* ── Inputs / overrides ───────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.06em', marginBottom: 10 }}>YOUR PROFILE</div>
        {profileMissingInputs && (
          <div style={{ fontSize: 11, color: '#6D4C00', background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 10, padding: '8px 10px', marginBottom: 10, lineHeight: 1.5 }}>
            Some inputs aren&apos;t on your profile — set rank, dependents, and move distance below so the gauge and comparison are accurate.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
            RANK
            <select aria-label="Rank / paygrade" value={rank} onChange={(e) => setOverride('rank', e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
              {PPM_PAYGRADES.map(pg => <option key={pg} value={pg}>{pg}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
            DEPENDENTS
            <select
              aria-label="Moving with dependents"
              value={withDependents ? 'yes' : 'no'}
              onChange={(e) => setOverride('withDependents', e.target.value === 'yes')}
              style={{ ...fieldStyle, marginTop: 5 }}
            >
              <option value="yes">With dependents</option>
              <option value="no">Without dependents</option>
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
            MOVE DISTANCE (MI)
            <input aria-label="Move distance in miles" inputMode="numeric" min="0" value={distanceMiles} onChange={(e) => setOverride('distanceMiles', e.target.value)} style={{ ...fieldStyle, marginTop: 5 }} />
          </label>
        </div>
      </div>

      {/* ── (B) ALLOWANCE GAUGE ──────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.06em' }}>2 · ALLOWANCE GAUGE</div>
          <div style={{ fontSize: 11, color: '#56697C' }}>Authorized: <strong>{authorizedWeightLbs.toLocaleString()} lbs</strong></div>
        </div>
        <div style={{ position: 'relative', height: 18, borderRadius: 999, background: '#EEF2F6', overflow: 'hidden', border: '1px solid #D8DEE7' }}>
          <div
            role="meter"
            aria-label="Estimated weight versus authorized allowance"
            aria-valuenow={estimatedWeightLbs}
            aria-valuemin={0}
            aria-valuemax={authorizedWeightLbs}
            style={{ width: `${gaugePct}%`, height: '100%', background: isOver ? '#B71C1C' : `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, transition: 'width .2s ease' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
          <span style={{ color: '#56697C' }}>Estimated: <strong style={{ color: '#0D1821' }}>{estimatedWeightLbs.toLocaleString()} lbs</strong></span>
          {isOver
            ? <span style={{ color: '#B71C1C', fontWeight: 900 }}>OVER by {excess.toLocaleString()} lbs</span>
            : <span style={{ color: '#1B5E20', fontWeight: 900 }}>{(authorizedWeightLbs - estimatedWeightLbs).toLocaleString()} lbs to spare</span>}
        </div>
      </div>

      {/* ── (C) OVERWEIGHT COST WARNING ──────────────────────────────── */}
      {isOver && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #EF9A9A', borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#B71C1C', letterSpacing: '.06em', marginBottom: 8 }}>3 · OVERWEIGHT COST WARNING</div>
          <div style={{ fontSize: 15, color: '#7F0000', lineHeight: 1.55, fontWeight: 700 }}>
            ≈ {formatCurrency(excessBill)} you&apos;d be billed for excess weight at the government rate.
          </div>
          <div style={{ fontSize: 13, color: '#7F0000', lineHeight: 1.55, marginTop: 6 }}>
            Declutter <strong>{excess.toLocaleString()} lbs</strong> to get back under your {authorizedWeightLbs.toLocaleString()} lb allowance and avoid the bill.
          </div>
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFFFFF', border: '1px solid #FFCDD2', borderRadius: 10, fontSize: 12, color: '#7F0000', fontWeight: 700 }}>
            Declutter to save: sell, donate, or discard the heaviest low-value items first (garage gear, books, old furniture).
          </div>
          <CalculatorResultLabel
            tier="estimate"
            style={{ marginTop: 10 }}
            note="The exact overage bill is calculated by your TMO/PPPO from certified scale weights — this is a planning estimate using the app's GCC model for the weight above your cap."
          />
        </div>
      )}

      {/* ── (D) MOVE-METHOD COMPARISON ───────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: '0 10px 26px rgba(13,24,33,0.06)' }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.06em', marginBottom: 4 }}>4 · MOVE-METHOD MONEY COMPARISON</div>
        <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55, marginBottom: 12 }}>
          Extra cash from the <em>move method only</em>, for your estimated {estimatedWeightLbs.toLocaleString()} lbs.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {scenarios.map(s => {
            const isBest = s.id === bestScenario.id && bestScenario.additionalCash > 0;
            return (
              <div key={s.id} style={{ border: `1px solid ${isBest ? s.tone : '#E0E6EE'}`, borderLeft: `4px solid ${s.tone}`, borderRadius: 14, padding: 14, background: isBest ? '#F1F8F4' : '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{s.name}{isBest && <span style={{ marginLeft: 6, fontSize: 10, color: '#1B5E20', fontWeight: 900 }}>★ MOST CASH</span>}</div>
                    <div style={{ fontSize: 11, color: '#56697C', marginTop: 2 }}>{s.sub}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 950, color: s.additionalCash > 0 ? '#1B5E20' : s.additionalCash < 0 ? '#B71C1C' : '#56697C' }}>
                    {s.id === 'hhg' ? '$0' : formatCurrency(s.additionalCash)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Partial PPM percentage slider */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <label htmlFor="partial-ppm-pct" style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>PARTIAL PPM — % YOU MOVE</label>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#0D1821' }}>{state.partialPct}% · {partialWeight.toLocaleString()} lbs</span>
          </div>
          <input
            id="partial-ppm-pct"
            type="range"
            min="0"
            max="100"
            step="5"
            value={state.partialPct}
            aria-label="Percentage of weight you move yourself in a partial PPM"
            onChange={(e) => setPartialPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.primary }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <MetricCard
            label="Full-PPM break-even weight"
            value={breakEven.weight != null
              ? `${breakEven.weight.toLocaleString()} lbs`
              : breakEven.alwaysPositive ? 'Always positive' : 'Always negative'}
            note={breakEven.weight != null
              ? 'Below this weight a full PPM nets roughly $0 or less after your hauling costs and taxes.'
              : breakEven.alwaysPositive
                ? 'For these inputs a full PPM nets positive cash across the weight range.'
                : 'For these inputs a full PPM nets negative cash across the weight range — the government move is the cheaper choice.'}
            tone={theme.primary}
          />
        </div>

        <div style={{ marginTop: 12, padding: '10px 12px', background: '#F0F4FF', border: '1px solid #C7D7F5', borderRadius: 10, fontSize: 11, color: '#1A3A5C', lineHeight: 1.55 }}>
          <strong style={{ color: '#0D3B66' }}>Apples-to-apples:</strong> Travel entitlements (DLA, per diem, MALT) are the <strong>same for all three</strong> options and are <strong>not shown here</strong>. This compares only the extra cash from the move method — so they cancel out and don&apos;t change which option pays more.
        </div>
        <CalculatorResultLabel
          tier="estimate"
          note="Full PPM / Partial PPM use the shared JTR 100% incentive rate net of an estimated flat tax withholding and your estimated hauling costs. Full Government HHG is shown as $0 extra cash because the government pays the mover directly. This nets a flat estimated withholding, NOT your actual tax liability — PPM incentive payments are taxable income (IRS Form 3903 may offset documented moving costs), so your real take-home depends on your tax situation. This is not tax or financial advice; confirm your actual tax impact with a tax professional or your installation Tax Center, and verify the official PPM payment with DPS / your PPPO."
        />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <button type="button" onClick={resetAll} disabled={!loaded} className="card-cta card-cta--block card-cta--ghost" style={{ cursor: loaded ? 'pointer' : 'not-allowed' }}>
          Reset weight estimate
        </button>
        <a href="https://dps.move.mil/cust/standard/user/home.xhtml" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Open DPS / Move.mil weight estimator</a>
        <a href="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Open Joint Travel Regulations</a>
      </div>

      <PlanningAidDisclaimer />
      <DataFreshnessFooter versionKey="ppm" />
      <DataFreshnessFooter versionKey="ppm_config" />
    </div>
  );
}
