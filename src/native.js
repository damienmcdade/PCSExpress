/*
 * Native (Capacitor) shim. Detects whether PCS Express is running
 * inside the iOS / Android Capacitor wrapper and, if so, wires up
 * native-only features that meaningfully exceed what the PWA can do:
 *
 *   - Native Push Notifications (FCM on Android, APNs on iOS) — more
 *     reliable than Web Push on iOS and survives app force-quit on
 *     Android. Activates when @capacitor/push-notifications is
 *     installed AND the user grants permission.
 *
 *   - Biometric unlock on app open — Face ID / Touch ID / Android
 *     biometrics gate the app shell so a borrowed / stolen phone
 *     can't read the locally-stored (already-encrypted) profile.
 *     Activates when @capacitor-community/biometric-auth is
 *     installed AND the user has opted in via Settings.
 *
 *   - Notification-click deep links — taps on a system notification
 *     navigate the app to the right tab via the existing
 *     `pcs-navigate` CustomEvent.
 *
 * All plugin imports use dynamic import() with try/catch so the web
 * build doesn't fail when these packages aren't installed. The
 * operator installs them only for the Capacitor build.
 *
 * Operator setup steps live in docs/NATIVE_SETUP.md.
 */

export function isNative() {
  if (typeof window === 'undefined') return false;
  return !!window.Capacitor?.isNativePlatform?.();
}

// Top-level tab slugs a push notification is allowed to deep-link to. Mirrors
// the ?go= allowlist in App.jsx — the server-supplied `tab` is untrusted, so we
// validate it here instead of dispatching an arbitrary value to setActiveTab.
const ALLOWED_NAV_TABS = new Set([
  'home', 'pcs-operations', 'home-relocation', 'family-readiness',
  'medical-readiness', 'mission-resources', 'transition',
  'checklist', 'documents', 'family', 'education', 'translation',
  'religion', 'base-intelligence', 'nav', 'resources', 'veterans',
  'jtr-assistant',
]);

function dispatchNavigate(tab) {
  if (typeof window === 'undefined' || !tab || !ALLOWED_NAV_TABS.has(tab)) return;
  try {
    window.dispatchEvent(new CustomEvent('pcs-navigate', { detail: { tab } }));
  } catch {}
}

// Native push registration. Returns { ok: bool, reason?: string }.
// Idempotent — calling twice in the same session is a no-op the
// second time because Capacitor's PushNotifications plugin tracks
// registration state internally.
export async function tryRegisterNativePush() {
  if (!isNative()) return { ok: false, reason: 'not-native' };
  let PushNotifications;
  try {
    // String-built path so Vite's import-analysis doesn't try to
    // resolve the optional native-only package at dev / build time.
    // The /* @vite-ignore */ comment stopped suppressing the
    // resolution check after Vite 8, breaking the web dev server
    // when the optional Capacitor plugin isn't installed.
    const pkg = '@capacitor' + '/push-notifications';
    ({ PushNotifications } = await import(/* @vite-ignore */ pkg));
  } catch {
    return { ok: false, reason: 'plugin-not-installed' };
  }
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm?.receive !== 'granted') {
      return { ok: false, reason: 'permission-denied' };
    }
    await PushNotifications.register();
    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      // The dispatching server includes `tab` in data so a tap can
      // deep-link the user straight to the relevant module.
      const tab = event?.notification?.data?.tab;
      dispatchNavigate(tab);
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'register-error', error: String(e?.message || e) };
  }
}

// Biometric unlock on app open. Returns { ok: bool, reason?: string }.
// Caller decides what to do on `ok === false` — typically: render the
// app anyway and rely on the encrypted local store as the security
// boundary. Biometric is a UX gate, not the security primitive.
export async function tryBiometricUnlock() {
  if (!isNative()) return { ok: false, reason: 'not-native' };
  let BiometricAuth;
  try {
    ({ BiometricAuth } = await import(/* @vite-ignore */ '@capacitor-community/biometric-auth'));
  } catch {
    return { ok: false, reason: 'plugin-not-installed' };
  }
  try {
    const availability = await BiometricAuth.checkBiometry();
    if (!availability?.isAvailable) {
      return { ok: false, reason: 'not-available', detail: availability?.reason || '' };
    }
    await BiometricAuth.authenticate({
      reason: 'Unlock PCS Express',
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Use passcode',
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'auth-failed', error: String(e?.message || e) };
  }
}

// ---------------------------------------------------------------------------
// PCS Pro subscription (native-only). The web app stays 100% free — every
// helper here degrades to "not Pro / no-op" on web or when the native
// PCSProPlugin isn't present. The plugin is a first-party Capacitor plugin
// registered via packageClassList (see ios/App/App/PCSProPlugin.swift).
// ---------------------------------------------------------------------------

const PRO_CACHE_KEY = 'pcs_pro_active';

function proPlugin() {
  if (typeof window === 'undefined') return null;
  return window.Capacitor?.Plugins?.PCSProPlugin || null;
}

// Last-known Pro status, persisted so gated modules render instantly on the
// next launch instead of flashing the upsell while the plugin resolves.
// UX cache only — the native StoreKit entitlement is the source of truth.
export function cachedProStatus() {
  try { return localStorage.getItem(PRO_CACHE_KEY) === '1'; } catch { return false; }
}

function rememberProStatus(active) {
  try { localStorage.setItem(PRO_CACHE_KEY, active ? '1' : '0'); } catch {}
}

const proStatusListeners = new Set();

function emitProStatus(active) {
  rememberProStatus(active);
  proStatusListeners.forEach((cb) => { try { cb(active); } catch {} });
}

// Subscribe to Pro status changes (purchase, restore, renewal, revocation).
// Returns an unsubscribe function.
export function onProStatusChange(cb) {
  proStatusListeners.add(cb);
  return () => proStatusListeners.delete(cb);
}

let proEventsWired = false;
function wireProEvents() {
  if (proEventsWired) return;
  const plugin = proPlugin();
  if (!plugin?.addListener) return;
  proEventsWired = true;
  try {
    // Native fires "prostatus" whenever the StoreKit entitlement flips.
    plugin.addListener('prostatus', (e) => emitProStatus(!!e?.active));
  } catch {
    proEventsWired = false;
  }
}

// Current Pro entitlement. Always false on web / non-native — the three
// gated modules stay free outside the iOS app.
export async function getProStatus() {
  if (!isNative()) return false;
  const plugin = proPlugin();
  if (!plugin) return cachedProStatus();
  try {
    const res = await plugin.getStatus();
    const active = !!res?.active;
    emitProStatus(active);
    return active;
  } catch {
    return cachedProStatus();
  }
}

// Present the native PCS Pro paywall. Resolves { active } after the sheet
// is dismissed (purchase, restore, or close).
export async function showProPaywall() {
  if (!isNative()) return { active: false };
  const plugin = proPlugin();
  if (!plugin) return { active: cachedProStatus() };
  try {
    const res = await plugin.showPaywall();
    const active = !!res?.active;
    emitProStatus(active);
    return { active };
  } catch {
    return { active: cachedProStatus() };
  }
}

// Restore purchases without opening the paywall.
export async function restoreProPurchases() {
  if (!isNative()) return { active: false };
  const plugin = proPlugin();
  if (!plugin) return { active: cachedProStatus() };
  try {
    const res = await plugin.restore();
    const active = !!res?.active;
    emitProStatus(active);
    return { active };
  } catch {
    return { active: cachedProStatus() };
  }
}

// Cold-start native bootstrap. Called once from main.jsx (or App.jsx)
// when the app loads. No-ops on web. Safe to invoke before any other
// imports complete because every plugin call is dynamic and guarded.
export async function bootstrapNative({ requireBiometric = false } = {}) {
  if (!isNative()) return { native: false };
  let biometric = null;
  if (requireBiometric) {
    biometric = await tryBiometricUnlock();
  }
  // Don't wait on push — it's not user-visible and shouldn't delay
  // first paint.
  tryRegisterNativePush().catch(() => {});
  // Refresh the cached Pro status from the live StoreKit entitlement and
  // start listening for changes. Fire-and-forget for the same reason.
  wireProEvents();
  getProStatus().catch(() => {});
  return { native: true, biometric };
}
