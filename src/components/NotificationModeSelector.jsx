/*
 * NotificationModeSelector — the per-checklist "mode selector" dropped onto
 * every checklist in the app. Pressing it connects the device for
 * notifications (OS permission), turns on notify-mode for that checklist,
 * publishes its outstanding priority-tagged items to the Command Center
 * alert feed (rendered in red, tailored by priority), and fires a local
 * confirmation notification. Server web-push (VAPID) is attempted
 * best-effort and never blocks the UI.
 *
 * Props:
 *   checklistId    stable id (storage key) for this checklist
 *   checklistLabel human label for notifications / Command Center
 *   alerts         [{ id, title, priority }] — current OUTSTANDING items
 */

import { useEffect, useRef, useState } from 'react';
import {
  isNotifyMode, setNotifyMode, publishAlerts, clearAlerts,
  connectDeviceNotifications, fireLocalNotification,
} from '../lib/checklistAlerts';
import { enablePushNotifications } from '../pushNotifications';

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise(resolve => setTimeout(() => resolve({ ok: false, reason: 'timeout' }), ms))]);

export default function NotificationModeSelector({ theme, checklistId, checklistLabel, alerts }) {
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState('');
  const lastPublished = useRef('');

  useEffect(() => { setOn(isNotifyMode(checklistId)); }, [checklistId]);

  // Keep the published alert set in sync while mode is on — but only write
  // when the content actually changes, so toggling a checkbox doesn't spin
  // the storage/event bus on every render.
  useEffect(() => {
    if (!on) return;
    const sig = JSON.stringify((alerts || []).map(a => [a.id, a.priority]));
    if (sig === lastPublished.current) return;
    lastPublished.current = sig;
    publishAlerts(checklistId, checklistLabel, alerts || []);
  }, [on, alerts, checklistId, checklistLabel]);

  const enable = async () => {
    const res = await connectDeviceNotifications();
    setNotifyMode(checklistId, true);
    setOn(true);
    lastPublished.current = JSON.stringify((alerts || []).map(a => [a.id, a.priority]));
    await publishAlerts(checklistId, checklistLabel, alerts || []);
    // Best-effort server push; guarded so a missing SW/VAPID never hangs.
    withTimeout(enablePushNotifications(), 4000).catch(() => {});

    const highCount = (alerts || []).filter(a => a.priority === 'High').length;
    if (res.ok) {
      fireLocalNotification(
        `${checklistLabel}: notifications on`,
        highCount ? `${highCount} high-priority item${highCount > 1 ? 's' : ''} need attention.` : 'Priority items will alert you here and on this device.',
        highCount ? 'High' : 'Medium',
      );
      setStatus('On — device connected. Priority items show in red on Command Center.');
    } else if (res.reason === 'denied') {
      setStatus('On in-app (device notifications are blocked in your settings). Priority items still show in red on Command Center.');
    } else {
      setStatus('On in-app. This device doesn’t support push notifications, but priority items show in red on Command Center.');
    }
  };

  const disable = async () => {
    setNotifyMode(checklistId, false);
    setOn(false);
    await clearAlerts(checklistId);
    // Do NOT tear down the shared device push subscription here. It's a
    // single subscription owned jointly by every checklist's notify mode AND
    // the global push toggle in Settings; unsubscribing on one checklist's
    // disable would silently kill push for all the others. Turning off the
    // device subscription is the global toggle's job. Local notifications
    // simply stop firing for this checklist once its mode is off.
    setStatus('Off.');
  };

  const highCount = (alerts || []).filter(a => a.priority === 'High').length;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: on ? '#FEF2F2' : '#F4F7FB',
        border: `1px solid ${on ? '#FCA5A5' : '#DCE4EE'}`,
        borderRadius: 12, padding: '10px 12px', marginBottom: 14, flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: on ? '#991B1B' : '#1F2A3C', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true">{on ? '🔔' : '🔕'}</span>
          Notification mode {on ? 'ON' : 'OFF'}
          {on && highCount > 0 && (
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.06em', color: '#FFF', background: '#DC2626', borderRadius: 6, padding: '1px 6px' }}>
              {highCount} HIGH
            </span>
          )}
        </div>
        <div role="status" aria-live="polite" style={{ fontSize: 11, color: '#56697C', marginTop: 2, lineHeight: 1.4 }}>
          {status || 'Connect this device to get priority alerts on your phone and in red on Command Center.'}
        </div>
      </div>
      <button
        type="button"
        onClick={on ? disable : enable}
        aria-pressed={on}
        aria-label={on ? `Turn off notifications for ${checklistLabel}` : `Turn on device notifications for ${checklistLabel}`}
        style={{
          flexShrink: 0,
          padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
          fontSize: 12, fontWeight: 800, letterSpacing: '.02em',
          border: `1.5px solid ${on ? '#DC2626' : theme.primary}`,
          background: on ? '#DC2626' : theme.primary,
          color: '#FFFFFF',
        }}
      >
        {on ? 'Turn off' : 'Turn on'}
      </button>
    </div>
  );
}
