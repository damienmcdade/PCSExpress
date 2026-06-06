/*
 * HHG Shipment Tracker — real-time transparency surface for the
 * Defense Personal Property System (DPS) move.
 *
 * DPS does not expose a public REST API, so this is intentionally a
 * MANUAL milestone tracker: the user (or their TMO) records each
 * milestone, the app timestamps and persists it locally via the
 * encrypted secureLocalStore, and a push notification toggle lets the
 * user opt in to be reminded when a milestone is overdue based on the
 * standard JTR DPS service-level windows. Deep links route directly
 * to DPS / move.mil and major TSP claim portals so the user never
 * has to hunt for the next official step.
 *
 * Privacy: GBL / TCN / TSP names are profile-local. Nothing about a
 * specific shipment is sent to the PCS Express backend or any third
 * party. The shipment object is encrypted at rest like every other
 * stored profile artifact (AES-256-GCM via cryptoStore).
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { secureLocalStore, AuditLogger } from '../security/SecurityExtensions';
import { notifyReminderOncePerDay, notificationsGranted } from '../lib/localReminders';
import NotificationModeSelector from './NotificationModeSelector';
import { isNotifyMode } from '../lib/checklistAlerts';
import CopyableText from './CopyableText';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const STORAGE_KEY = 'pcs_shipment_tracker';

// Canonical DPS milestone ladder per JTR Chapter 5 (Household Goods
// shipment lifecycle). slaDays is the worst-case days a stage should
// take under the standard government TSP contract — used to compute
// the "overdue" badge when a milestone hasn't been marked complete.
const MILESTONES = [
  { id: 'counsel',        label: 'DPS Counseling Complete',          slaDays:   1, link: 'https://dps.move.mil', desc: 'Confirm DPS self-counseling submitted and orders + entitlements verified by gaining PPSO.' },
  { id: 'tsp-assigned',   label: 'Transportation Service Provider (TSP) Assigned', slaDays: 7, link: 'https://dps.move.mil', desc: 'PPSO assigns a TSP and emails the Government Bill of Lading (GBL) and pre-move survey contact info.' },
  { id: 'pre-move-survey',label: 'Pre-Move Survey Complete',          slaDays:  10, link: '', desc: 'TSP completes the in-home or virtual survey. Weight estimate locks here — request a copy.' },
  { id: 'packing',        label: 'Packing Day',                       slaDays:  14, link: '', desc: 'Packing crew arrives. Check every box label against your inventory before sealing.' },
  { id: 'loaded',         label: 'Loaded / Pickup Complete',          slaDays:  15, link: '', desc: 'Truck loaded, weight ticket signed, DD 1840 / DD 1840R issued. Photograph the truck plate and BOL.' },
  { id: 'in-transit',     label: 'In Transit',                        slaDays:  30, link: 'https://dps.move.mil/', desc: 'Tracking begins. Most CONUS loads deliver inside the spread window; OCONUS sea-freight runs 60-90 days.' },
  { id: 'arrival-call',   label: 'Notice of Arrival Received',        slaDays:  45, link: '', desc: 'TSP calls 24-48 hours before delivery to schedule. Confirm gaining address and access details.' },
  { id: 'delivered',      label: 'Delivered',                         slaDays:  46, link: '', desc: 'Truck unloaded, items checked off the inventory. Note any pre-existing damage on the DD 1840R BEFORE the driver leaves.' },
  { id: 'claim-loss',     label: 'Loss / Damage Claim Filed',         slaDays:  76, link: 'https://dps.move.mil', desc: 'Report loss/damage in DPS within 180 days of delivery; file the itemized claim within 9 months for full replacement value (DD 1840R supplement). File promptly — don\'t wait for the deadline.' },
  { id: 'claim-settled',  label: 'Claim Settled',                     slaDays: 120, link: 'https://dps.move.mil', desc: 'TSP settles inside 60 days of claim filing. Escalate to the Military Claims Office (MCO) if you disagree with the offer.' },
];

const FIELDS = [
  { id: 'gbl',     label: 'GBL / TCN / shipment #', placeholder: 'GBL number from DPS' },
  { id: 'tsp',     label: 'Transportation Service Provider (TSP)', placeholder: 'e.g., Atlas Van Lines' },
  { id: 'tspPhone',label: 'TSP contact phone',      placeholder: '+1 555-555-5555' },
  { id: 'pickup',  label: 'Spread pickup window',   placeholder: 'YYYY-MM-DD to YYYY-MM-DD' },
  { id: 'delivery',label: 'Spread delivery window', placeholder: 'YYYY-MM-DD to YYYY-MM-DD' },
];

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function daysBetween(isoA, isoB) {
  if (!isoA || !isoB) return null;
  const a = new Date(`${isoA}T00:00:00Z`).getTime();
  const b = new Date(`${isoB}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export default function ShipmentTrackerModule({ theme, profile: _profile }) {
  const [state, setState] = useState({ fields: {}, milestones: {}, startedOn: '', notifyOnOverdue: false });
  // Hydration guard: the store decrypts asynchronously, so the first render
  // holds the empty default. Writing in that window would persist the empty
  // object OVER saved milestones/fields. loadedRef blocks writes until the
  // initial decrypt resolves; persist() takes a functional updater so it
  // never builds on a stale closure.
  const loadedRef = useRef(false);

  const reload = useCallback(async (isMounted = () => true) => {
    const saved = await secureLocalStore.get(
      STORAGE_KEY,
      { fields: {}, milestones: {}, startedOn: '', notifyOnOverdue: false }
    );
    if (!isMounted()) return;
    setState(saved || { fields: {}, milestones: {}, startedOn: '', notifyOnOverdue: false });
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    let mounted = true;
    reload(() => mounted).catch(() => { /* secureLocalStore handles its own errors */ });
    return () => { mounted = false; };
  }, [reload]);

  // Pull-to-refresh re-reads the encrypted store. No network here — the
  // value to the user is recovering from an out-of-sync session (e.g.
  // the iOS keychain wasn't unlocked at first render). 600ms is enough
  // for the AES decrypt + setState to flush.
  const { indicator } = usePullToRefresh(async () => {
    await reload();
    await new Promise(r => setTimeout(r, 600));
  });

  const persist = (updater) => {
    if (!loadedRef.current) return; // never clobber saved data before it loads
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      secureLocalStore.set(STORAGE_KEY, next);
      AuditLogger.record('shipment_tracker_change', { hasGbl: !!next.fields?.gbl, completedCount: Object.values(next.milestones || {}).filter(Boolean).length });
      return next;
    });
  };

  const updField = (id, val) => persist(prev => ({ ...prev, fields: { ...prev.fields, [id]: val } }));
  const startTracking = () => persist(prev => ({ ...prev, startedOn: prev.startedOn || todayIso() }));
  const toggleMilestone = (id) => {
    persist(prev => ({ ...prev, milestones: { ...prev.milestones, [id]: prev.milestones[id] ? null : todayIso() } }));
  };

  const overdueMap = useMemo(() => {
    const start = state.startedOn || '';
    if (!start) return {};
    const today = todayIso();
    const daysSinceStart = daysBetween(start, today) || 0;
    const out = {};
    for (const m of MILESTONES) {
      const completed = !!state.milestones[m.id];
      out[m.id] = !completed && daysSinceStart > m.slaDays;
    }
    return out;
  }, [state.milestones, state.startedOn]);

  const completed = MILESTONES.filter(m => state.milestones[m.id]).length;
  const overdueCount = Object.values(overdueMap).filter(Boolean).length;
  const pct = Math.round((completed / MILESTONES.length) * 100);

  // When the user has opted into overdue alerts, fire a foreground
  // reminder for each overdue milestone (once per day per milestone) when
  // they open the tracker. Background push isn't possible — the milestone
  // data is encrypted on-device and never reaches the server.
  useEffect(() => {
    if (!isNotifyMode('shipment-tracker') || !notificationsGranted()) return;
    for (const m of MILESTONES) {
      if (overdueMap[m.id]) {
        notifyReminderOncePerDay(`shipment:${m.id}`, 'PCS Express shipment reminder', `Overdue: ${m.label}`);
      }
    }
  }, [overdueMap]);

  // Outstanding milestones feed notification mode + the Command Center.
  // Overdue milestones (past their JTR SLA window) escalate to High.
  const outstandingAlerts = useMemo(() => MILESTONES
    .filter(m => !state.milestones[m.id])
    .map(m => ({ id: m.id, title: m.label, priority: overdueMap[m.id] ? 'High' : 'Medium' })), [state.milestones, overdueMap]);

  return (
    <div style={{ padding: 16 }}>
      {indicator}
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>HHG SHIPMENT TRACKER</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Real-time DPS milestone visibility</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>
          DPS doesn’t publish a tracking API. PCS Express stores your shipment timeline locally (encrypted) and flags any milestone that runs past the standard JTR service-level window. Use the DPS / move.mil / TSP links to take the next official action.
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '.06em', marginBottom: 10 }}>SHIPMENT DETAILS</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {FIELDS.map(f => (
            <div key={f.id} style={{ display: 'block' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#56697C', letterSpacing: '.06em', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>{f.label.toUpperCase()}</span>
                {state.fields?.[f.id] && (
                  <CopyableText value={state.fields[f.id]} ariaLabel={`Copy ${f.label}`} style={{ fontSize: 10, color: theme.primary, padding: '0 4px' }}>
                    Copy
                  </CopyableText>
                )}
              </div>
              <input
                value={state.fields?.[f.id] || ''}
                onChange={e => updField(f.id, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', border: '1px solid #D8DEE7', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={startTracking} style={{ flex: 1, minWidth: 140, padding: '10px 14px', background: theme.primary, color: '#FFF', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            {state.startedOn ? `Tracking since ${state.startedOn}` : 'Start tracking'}
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <NotificationModeSelector theme={theme} checklistId="shipment-tracker" checklistLabel="HHG Shipment Tracker" alerts={outstandingAlerts} />
        </div>
      </div>

      <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary }}>PROGRESS</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C' }}>{completed} / {MILESTONES.length} milestones · {pct}%</div>
        </div>
        <div style={{ width: '100%', height: 8, background: '#E0E0E0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: overdueCount > 0 ? '#E65100' : '#1B5E20', borderRadius: 99, transition: 'width 240ms ease' }} />
        </div>
        {overdueCount > 0 && (
          <div style={{ fontSize: 11, color: '#C62828', fontWeight: 800, marginTop: 8 }}>⚠ {overdueCount} milestone{overdueCount === 1 ? '' : 's'} past the standard JTR SLA window — escalate to your gaining PPSO or TSP.</div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {MILESTONES.map(m => {
          const done = !!state.milestones[m.id];
          const overdue = overdueMap[m.id];
          const border = done ? '#A5D6A7' : overdue ? '#EF9A9A' : '#E0E6EE';
          const bg     = done ? '#F0FFF4' : overdue ? '#FFEBEE' : '#FFFFFF';
          return (
            <div key={m.id} style={{ background: bg, border: `1px solid ${border}`, borderLeft: `4px solid ${done ? '#1B5E20' : overdue ? '#C62828' : theme.accent}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821' }}>{m.label}</div>
                    {done && <span style={{ fontSize: 9, fontWeight: 800, background: '#1B5E20', color: '#FFF', padding: '2px 7px', borderRadius: 8 }}>DONE {state.milestones[m.id]}</span>}
                    {!done && overdue && <span style={{ fontSize: 9, fontWeight: 800, background: '#C62828', color: '#FFF', padding: '2px 7px', borderRadius: 8 }}>OVERDUE</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginTop: 4 }}>{m.desc}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#56697C', marginTop: 4 }}>Standard SLA: complete within {m.slaDays} day{m.slaDays === 1 ? '' : 's'} of counseling start.</div>
                </div>
                <button onClick={() => toggleMilestone(m.id)} style={{ width: 90, padding: '8px 10px', background: done ? '#FFFFFF' : theme.primary, color: done ? theme.primary : '#FFFFFF', border: `1px solid ${theme.primary}`, borderRadius: 8, fontWeight: 800, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                  {done ? 'Undo' : 'Mark done'}
                </button>
              </div>
              {m.link && (
                <a href={m.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>
                  Open official portal →
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://dps.move.mil" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>DPS / move.mil — Manage shipment</a>
        <a href="https://dps.move.mil/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Move.mil — Customer Service / SCAC lookup</a>
        <a href="https://dps.move.mil/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">Customer portal (rate your TSP)</a>
      </div>
    </div>
  );
}
