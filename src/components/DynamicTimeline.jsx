/*
 * Purpose: Backward-planned PCS timeline and notification toggles.
 * Third-party dependencies: React.
 */

import { useEffect, useMemo, useState } from 'react';

const TIMELINE_STORAGE_KEY = 'pcs_dynamic_timeline_notifications';

const MILESTONES = [
  { id: 'hhg', offsetDays: 60, title: 'Schedule HHG Shipment', body: 'Confirm pickup windows in DPS and coordinate with PPPO/TMO before peak season dates fill.' },
  { id: 'housing', offsetDays: 30, title: 'Submit Housing Intent to Vacate', body: 'Notify privatized housing, landlord, or property manager and confirm SCRA or lease requirements.' },
  { id: 'final-out', offsetDays: 10, title: 'Final Out-Processing / Vehicle Shipping', body: 'Complete clearing appointments, ship or prepare POV, and keep travel documents accessible.' },
];

function readNotificationState() {
  try {
    return JSON.parse(localStorage.getItem(TIMELINE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeNotificationState(value) {
  try {
    localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime())) return 'Set RNLTD';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(a, b) {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((end - start) / 86400000);
}

export default function DynamicTimeline({ theme, profile }) {
  const [enabled, setEnabled] = useState(() => readNotificationState());
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  const rnltDate = useMemo(() => profile?.departingDate ? new Date(`${profile.departingDate}T12:00:00`) : null, [profile?.departingDate]);
  const today = useMemo(() => new Date(), []);

  useEffect(() => writeNotificationState(enabled), [enabled]);

  const timeline = useMemo(() => MILESTONES.map(item => {
    const dueDate = rnltDate ? addDays(rnltDate, -item.offsetDays) : null;
    const daysUntilDue = dueDate ? daysBetween(today, dueDate) : null;
    return { ...item, dueDate, daysUntilDue };
  }), [rnltDate, today]);

  const toggle = async (id) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #DDD5C2', borderRadius: 16, padding: 14, marginBottom: 18, boxShadow: '0 10px 24px rgba(38,53,31,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>DYNAMIC 90-DAY TIMELINE</div>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#0D1821', marginTop: 3 }}>Backward-planned from RNLTD</div>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginTop: 3 }}>
            RNLTD/report date: <strong>{formatDate(rnltDate)}</strong>
          </div>
        </div>
        <span style={{ background: permission === 'granted' ? '#E8F5E9' : '#F3F4F6', color: permission === 'granted' ? '#1B5E20' : '#56697C', borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 900 }}>
          {permission === 'granted' ? 'Push ready' : 'In-app reminders'}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 9 }}>
        {timeline.map(item => {
          const overdue = item.daysUntilDue !== null && item.daysUntilDue < 0;
          const soon = item.daysUntilDue !== null && item.daysUntilDue <= 7 && item.daysUntilDue >= 0;
          return (
            <div key={item.id} style={{ border: `1px solid ${overdue ? '#FFCDD2' : soon ? '#FFE082' : '#E0E6EE'}`, borderLeft: `4px solid ${overdue ? '#C62828' : soon ? '#E65100' : theme.accent}`, borderRadius: 12, padding: 12, background: overdue ? '#FFF5F5' : soon ? '#FFF8E1' : '#F8FAFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: '#0D1821' }}>T-Minus {item.offsetDays} Days: {item.title}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45, marginTop: 4 }}>{item.body}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: overdue ? '#C62828' : theme.primary, marginTop: 6 }}>
                    Due {formatDate(item.dueDate)}{item.daysUntilDue !== null ? ` · ${overdue ? Math.abs(item.daysUntilDue) + ' days overdue' : item.daysUntilDue + ' days left'}` : ''}
                  </div>
                </div>
                <button onClick={() => toggle(item.id)} style={{ width: 48, height: 28, borderRadius: 999, border: 'none', background: enabled[item.id] ? theme.primary : '#CBD5E1', padding: 3, cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ display: 'block', width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', transform: enabled[item.id] ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .18s ease' }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
