/*
 * PriorityAlertsCard — Command Center red alert feed.
 *
 * Renders the outstanding, priority-tagged items from every checklist that
 * has notification mode turned ON (see checklistAlerts.js). Displayed in red
 * and tiered by priority (High / Medium / Low). Returns null when there are
 * no active alerts, so users who haven't enabled any checklist see nothing.
 */

import { useEffect, useState } from 'react';
import { getAllAlerts } from '../lib/checklistAlerts';

// Chip colors meet WCAG AA (≥4.5:1) for the small white label text.
const TIER = {
  High:   { band: '#7F1D1D', chip: '#B91C1C', label: 'HIGH' },
  Medium: { band: '#9A3412', chip: '#C2410C', label: 'MED' },
  Low:    { band: '#854D0E', chip: '#854D0E', label: 'LOW' },
};

// Map a checklist id to the top-level tab + (optional) sub-tab to jump to.
const CHECKLIST_ROUTE = {
  'pcs-checklist':        { tab: 'pcs-operations', sub: 'checklist' },
  'transition-checklist': { tab: 'transition', sub: 'checklist' },
  'transition-documents': { tab: 'transition', sub: 'documentation' },
  'pet-relocation':       { tab: 'family-readiness', sub: null },
};

export default function PriorityAlertsCard({ onJumpTo }) {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () => getAllAlerts().then(a => { if (mounted) setAlerts(a); });
    load();
    window.addEventListener('pcs-alerts-changed', load);
    // Re-read when returning to the tab (a notification may have fired).
    window.addEventListener('focus', load);
    return () => {
      mounted = false;
      window.removeEventListener('pcs-alerts-changed', load);
      window.removeEventListener('focus', load);
    };
  }, []);

  if (!alerts || alerts.length === 0) return null;

  const high = alerts.filter(a => a.priority === 'High').length;
  const shown = alerts.slice(0, 6);
  const more = alerts.length - shown.length;

  return (
    <div
      role="region"
      aria-label="Priority alerts"
      style={{
        background: '#FFFFFF',
        border: '1px solid #FCA5A5',
        borderLeft: '4px solid #DC2626',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        boxShadow: '0 12px 28px rgba(127,29,29,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 10, fontWeight: 950, color: '#B91C1C', letterSpacing: '.12em' }}>
          <span aria-hidden="true">🔔</span> PRIORITY ALERTS
        </h2>
        <span style={{ fontSize: 11, fontWeight: 800, color: high ? '#B91C1C' : '#6B7A90' }}>
          {alerts.length} open{high ? ` · ${high} high` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {shown.map(a => {
          const tier = TIER[a.priority] || TIER.Medium;
          const route = CHECKLIST_ROUTE[a.checklistId];
          const rowStyle = {
            display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '8px 10px', width: '100%',
          };
          const inner = (
            <>
              <span style={{
                flexShrink: 0, fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em',
                color: '#FFFFFF', background: tier.chip, borderRadius: 5, padding: '2px 5px', marginTop: 1,
              }}>
                {tier.label}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#7F1D1D', lineHeight: 1.4 }}>{a.title}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: '#7A4A4A', marginTop: 1 }}>{a.checklistLabel}</span>
              </span>
            </>
          );
          // Routable alerts are buttons that jump to the source tab/sub-tab;
          // non-routable ones render as a plain row (no focusable no-op).
          return route ? (
            <button
              key={`${a.checklistId}:${a.id}`}
              type="button"
              onClick={() => onJumpTo && onJumpTo(route.tab, route.sub)}
              aria-label={`${a.priority} priority: ${a.title} — open ${a.checklistLabel}`}
              style={{ ...rowStyle, cursor: 'pointer' }}
            >
              {inner}
            </button>
          ) : (
            <div key={`${a.checklistId}:${a.id}`} role="listitem" style={rowStyle}>
              {inner}
            </div>
          );
        })}
      </div>

      {more > 0 && (
        <div style={{ fontSize: 11, color: '#9A6B6B', marginTop: 8 }}>
          +{more} more open item{more > 1 ? 's' : ''} across your checklists.
        </div>
      )}
    </div>
  );
}
