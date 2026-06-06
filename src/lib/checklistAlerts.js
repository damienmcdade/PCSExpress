/*
 * Checklist notification + Command-Center alert bus.
 *
 * One shared place for the app-wide "notification mode" feature:
 *   - Per-checklist ON/OFF flag (plain localStorage boolean).
 *   - A published set of outstanding, priority-tagged alerts per checklist,
 *     persisted (encrypted) so the Command Center can render them in red and
 *     tailor them by priority.
 *   - Device-notification plumbing: request OS permission and fire a local
 *     notification. Server web-push (VAPID) is wired separately in
 *     pushNotifications.js and called best-effort by the selector.
 *
 * Alert shape: { id, title, priority: 'High' | 'Medium' | 'Low' }
 * Only checklists with notify-mode ON contribute to the Command Center feed.
 */

import { secureLocalStore } from '../security/SecurityExtensions';

const ALERTS_KEY = 'pcs_checklist_alerts';        // { [checklistId]: { label, items:[...] } }
const MODE_PREFIX = 'pcs_notify_mode_';           // per-checklist on/off

export const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

export function isNotifyMode(checklistId) {
  try { return localStorage.getItem(MODE_PREFIX + checklistId) === '1'; } catch { return false; }
}

export function setNotifyMode(checklistId, on) {
  try {
    if (on) localStorage.setItem(MODE_PREFIX + checklistId, '1');
    else localStorage.removeItem(MODE_PREFIX + checklistId);
  } catch { /* storage disabled — degrade silently */ }
}

// Serialize all read-modify-write access to the shared ALERTS_KEY through a
// single promise chain. Four checklists write the same key; without this,
// concurrent publish/clear calls each read the same base map and the later
// set() clobbers the earlier one's entry (silent alert loss). Mirrors
// AuditLogger._writeQueue in SecurityExtensions.js.
let _writeQueue = Promise.resolve();
function enqueue(mutate) {
  _writeQueue = _writeQueue.then(async () => {
    const all = (await secureLocalStore.get(ALERTS_KEY, {})) || {};
    const changed = mutate(all);
    if (changed) {
      await secureLocalStore.set(ALERTS_KEY, all);
      emitChanged();
    }
  }).catch(() => {});
  return _writeQueue;
}

// Replace the published alert set for one checklist and notify listeners.
export async function publishAlerts(checklistId, label, items) {
  const clean = Array.isArray(items)
    ? items
        .filter(it => it && it.id && it.title)
        .map(it => ({ id: String(it.id), title: String(it.title), priority: it.priority || 'Medium' }))
        .slice(0, 50)
    : [];
  return enqueue((all) => {
    if (!clean.length) {
      if (!all[checklistId]) return false;
      delete all[checklistId];
    } else {
      all[checklistId] = { label: label || 'Checklist', items: clean };
    }
    return true;
  });
}

export async function clearAlerts(checklistId) {
  return enqueue((all) => {
    if (!all[checklistId]) return false;
    delete all[checklistId];
    return true;
  });
}

// Flattened, priority-sorted alerts from every checklist whose mode is ON.
export async function getAllAlerts() {
  const all = (await secureLocalStore.get(ALERTS_KEY, {})) || {};
  const flat = [];
  for (const [cid, group] of Object.entries(all)) {
    if (!isNotifyMode(cid)) continue;
    for (const it of group.items || []) {
      flat.push({ checklistId: cid, checklistLabel: group.label, ...it });
    }
  }
  flat.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1));
  return flat;
}

function emitChanged() {
  try { window.dispatchEvent(new CustomEvent('pcs-alerts-changed')); } catch { /* SSR / no window */ }
}

// Connect the device for notifications by requesting OS permission. Returns
// { ok, reason }. Does NOT depend on a service worker, so it works even when
// server push (VAPID) isn't configured.
export async function connectDeviceNotifications() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  let perm = Notification.permission;
  if (perm === 'default') {
    try { perm = await Notification.requestPermission(); }
    catch { return { ok: false, reason: 'error' }; }
  }
  if (perm !== 'granted') return { ok: false, reason: 'denied' };
  return { ok: true };
}

// Fire an immediate local (on-device) notification, tailored by priority.
export function fireLocalNotification(title, body, priority = 'Medium') {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    // High-priority alerts stay until dismissed; others auto-dismiss.
    new Notification(title, {
      body: body || '',
      tag: `pcs-${priority}`,
      requireInteraction: priority === 'High',
    });
  } catch { /* some webviews throw on the Notification ctor — ignore */ }
}
