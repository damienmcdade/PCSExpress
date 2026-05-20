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

function dispatchNavigate(tab) {
  if (typeof window === 'undefined' || !tab) return;
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
    // /* @vite-ignore */ so Vite doesn't try to resolve this at
    // build time (the package is only installed for the Capacitor
    // build per docs/NATIVE_SETUP.md).
    ({ PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications'));
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
  return { native: true, biometric };
}
