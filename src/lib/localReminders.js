/*
 * Local (foreground) reminder helper.
 *
 * Why not real background push: the PCS milestones / shipment milestones
 * that drive these reminders live ONLY on the device, AES-encrypted in
 * secureLocalStore. The server never sees them, so it cannot schedule a
 * Web Push for "milestone X is overdue". The honest, deliverable behavior
 * is a foreground system Notification fired when the user opens the app
 * and an opted-in item is actually overdue — deduplicated to at most once
 * per calendar day per item so reopening the app doesn't spam.
 *
 * Callers must have already obtained Notification permission (the toggles
 * request it). This helper is a no-op when permission isn't 'granted'.
 */

const LAST_FIRED_KEY = 'pcs_reminder_last_fired';

function readLastFired() {
  try { return JSON.parse(localStorage.getItem(LAST_FIRED_KEY) || '{}'); } catch { return {}; }
}

function writeLastFired(value) {
  try { localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(value)); } catch { /* storage full / blocked */ }
}

export function notificationsGranted() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

/**
 * Fire a Notification at most once per calendar day for a given key.
 * Returns true if a notification was actually shown.
 */
export function notifyReminderOncePerDay(key, title, body) {
  if (!notificationsGranted()) return false;
  let today;
  try { today = new Date().toISOString().slice(0, 10); } catch { return false; }
  const seen = readLastFired();
  if (seen[key] === today) return false;
  try {
    // `tag` collapses repeat notifications for the same item in the OS tray.
    new Notification(title, { body, tag: key });
  } catch {
    return false;
  }
  seen[key] = today;
  // Prune entries older than ~14 days so the map can't grow forever.
  const cutoff = (() => { try { return new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10); } catch { return null; } })();
  if (cutoff) { for (const k of Object.keys(seen)) { if (seen[k] < cutoff) delete seen[k]; } }
  writeLastFired(seen);
  return true;
}
