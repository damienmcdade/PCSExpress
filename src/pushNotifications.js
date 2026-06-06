/*
 * Web Push subscription helper.
 *
 * Three things have to be true before a real push can be delivered:
 *
 *   1. The user has granted Notification permission.
 *   2. A service worker is registered and active.
 *   3. The server has a VAPID public key the browser can use to
 *      derive the push subscription, AND has the corresponding
 *      private key on hand to sign outgoing messages.
 *
 * Generating the keypair securely is operator work — see
 * docs/PUSH_SETUP.md. Until VAPID_PUBLIC_KEY is set on the server,
 * `enablePushNotifications()` is a no-op that returns null.
 *
 * No PII leaves the device through this code path. The subscription
 * endpoint URL plus the browser-generated p256dh and auth keys are
 * the only fields sent to /api/push-subscribe. The server does not
 * receive the user's profile, branch, rank, location, or checklist.
 */
import { apiUrl } from './config/apiConfig';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) return { ok: false, reason: 'no-sw' };
    // Ask the server for the configured VAPID public key. The
    // /api/push-config endpoint returns { vapidPublicKey: '...' }
    // or { vapidPublicKey: null } if push isn't enabled yet.
    const cfgResp = await fetch(apiUrl('/api/push-config'));
    if (!cfgResp.ok) return { ok: false, reason: 'config-fetch-failed' };
    const cfg = await cfgResp.json();
    if (!cfg?.vapidPublicKey) return { ok: false, reason: 'vapid-not-configured' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'permission-denied' };

    const appServerKey = urlBase64ToUint8Array(cfg.vapidPublicKey);
    let existing = await reg.pushManager.getSubscription();
    // If a subscription survives from a PREVIOUS VAPID key (server rotated
    // keys / key changed between releases), the push service silently drops
    // messages signed with the new private key. Detect the mismatch and
    // re-subscribe with the current key.
    if (existing) {
      const existingKey = existing.options?.applicationServerKey;
      const sameKey = existingKey
        && existingKey.byteLength === appServerKey.byteLength
        && new Uint8Array(existingKey).every((b, i) => b === appServerKey[i]);
      if (!sameKey) {
        try { await existing.unsubscribe(); } catch { /* ignore */ }
        existing = null;
      }
    }
    const subscription = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    });

    await fetch(apiUrl('/api/push-subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    return { ok: true, subscription };
  } catch (e) {
    return { ok: false, reason: 'error', error: String(e?.message || e) };
  }
}

export async function disablePushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg?.pushManager?.getSubscription?.();
    if (existing) {
      try {
        await fetch(apiUrl('/api/push-unsubscribe'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
      } catch {}
      await existing.unsubscribe();
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
