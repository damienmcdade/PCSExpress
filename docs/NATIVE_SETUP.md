# Native iOS / Android Setup — Operator Runbook

PCS Express ships a Capacitor wrapper. The web app is the primary
surface; the native shell adds two meaningful capabilities the PWA
can't match.

| Feature | Web (PWA) | Native (Capacitor) |
|---|---|---|
| Push notifications | Web Push (with VAPID, fragile on iOS Safari) | **FCM (Android) / APNs (iOS)** — survives force-quit |
| Biometric app-open | Not available | **Face ID / Touch ID / Android biometrics** |
| Deep links from notifications | `?go=<tab>` URL params | Same, plus app-launched-from-killed handled natively |

The integration points live in `src/native.js`. **Plugin packages are
NOT in `package.json` to keep the web build lean.** Install them only
for the Capacitor build.

## One-time install (per developer / CI host)

```bash
cd /Users/damiengantt-mcdade/PCSExpress

# Native push (FCM + APNs via Capacitor)
npm install --save-dev @capacitor/push-notifications

# Biometric auth (Face ID / Touch ID / Android biometrics)
npm install --save-dev @capacitor-community/biometric-auth

# Sync into the iOS + Android projects
npx cap sync ios
npx cap sync android
```

`src/native.js` already imports both packages via dynamic `import()`
with try/catch — the web build still succeeds whether the plugins
are installed or not.

## Wire bootstrapNative() from main.jsx

```js
// src/main.jsx (or App.jsx)
import { bootstrapNative } from './native';

// Fire-and-forget on app load. Biometric unlock is an opt-in
// the user controls from Settings — leave requireBiometric false
// until the Settings toggle is wired.
bootstrapNative({ requireBiometric: false });
```

## iOS-specific: Push capability

In Xcode, open `ios/App/App.xcworkspace`:

1. Select the **App** target.
2. **Signing & Capabilities** tab → **+ Capability** → add:
   - **Push Notifications**
   - **Background Modes** (then check **Remote notifications**)
3. Add an **APNs Authentication Key** in App Store Connect → Keys.
4. Wire the APNs key into FCM (Firebase project → Cloud Messaging →
   APNs authentication key).

## Android-specific: FCM project

In `android/`:

1. Create a Firebase project at https://console.firebase.google.com.
2. Add an Android app with package `com.pcsexpress.app` (matches
   `appId` in `capacitor.config.json`).
3. Download `google-services.json` → place in `android/app/`.
4. Capacitor's @capacitor/push-notifications plugin handles the
   Gradle wiring automatically on `npx cap sync android`.

## Server-side: dispatch path

The native push handlers re-use the same dispatch infrastructure as
Web Push (see `docs/PUSH_SETUP.md`). The notification payload shape
is identical:

```json
{ "title": "PCS Express", "body": "3 tasks overdue", "tab": "pcs-operations" }
```

Native receives the `data.tab` field and `notificationActionPerformed`
fires a `pcs-navigate` CustomEvent that the existing App.jsx listener
picks up. No additional client wiring needed.

## Test the native build

```bash
# iOS — opens Xcode
npm run ios:build
npm run ios:open

# Android — opens Android Studio
npm run android:sync
npm run android:open
```

In the running app, open DevTools (Safari Web Inspector for iOS,
Chrome inspect for Android) → Console → check for:

```
[native] push registered
[native] biometric available: true|false
```

(`src/native.js` doesn't currently log these; add `console.log` calls
in `tryRegisterNativePush` / `tryBiometricUnlock` if you want them
visible during initial native debugging.)

## Security notes

- **Push payloads must never contain PII.** Title / body / tab only.
  No name, no rank, no orders, no checklist content.
- **Biometric is a UX gate, not the security primitive.** The
  encrypted local store (AES-256-GCM, key in IndexedDB, non-extractable)
  is what actually protects the data. A biometric prompt prevents
  casual snooping on a borrowed phone; it does NOT protect against
  forensic device imaging — that's the encryption layer's job.
- **Native push tokens are device-identity material.** Treat the
  Firebase server key (FCM HTTP v1 service account JSON) and the
  APNs key with the same care as a VAPID private key.
