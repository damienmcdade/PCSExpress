/*
 * PlatformBanners — combines two tiny but useful UI affordances:
 *
 *   1. Offline banner. Listens to `online` / `offline` events and
 *      shows a short reassuring message when the device drops off
 *      the network. PCS Express stores most data locally, so most
 *      features keep working — the banner says so.
 *
 *   2. PWA install nudge. Listens for `beforeinstallprompt`
 *      (Chrome / Edge / Android) and exposes a small "Add to Home
 *      Screen" button. iOS Safari doesn't fire that event but does
 *      support PWA install via the share menu — we surface a hint
 *      instead. The nudge is dismissible per browser session via
 *      localStorage so the user isn't nagged.
 *
 * Both banners are intentionally narrow and non-blocking. They sit
 * at the top of the viewport above the sticky header.
 */

import { useEffect, useState } from 'react';

const PWA_DISMISS_KEY = 'pcs_pwa_nudge_dismissed_v1';

function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = String(navigator.userAgent || '');
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIos && isSafari;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  // iOS Safari sets navigator.standalone; everything else uses the
  // display-mode media query.
  if (window.navigator?.standalone) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

export default function PlatformBanners() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [pwaDismissed, setPwaDismissed] = useState(() => {
    try { return localStorage.getItem(PWA_DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const onBefore = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, []);

  const dismissPwa = () => {
    setPwaDismissed(true);
    try { localStorage.setItem(PWA_DISMISS_KEY, '1'); } catch {}
  };

  const triggerInstall = async () => {
    if (!installPrompt) return;
    try {
      installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {}
    setInstallPrompt(null);
    dismissPwa();
  };

  const standalone = isStandalone();
  const showIosNudge = !pwaDismissed && !standalone && isIosSafari();
  const showInstallButton = !pwaDismissed && !standalone && !!installPrompt;

  return (
    <>
      {!online && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: '#7A4A00',
            color: '#FFF8E1',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid #FFE082',
          }}
        >
          <span aria-hidden="true">⚠</span>
          Offline — your device data is still encrypted on this phone, and most PCS Express features keep working.
        </div>
      )}

      {showInstallButton && (
        <div
          role="status"
          style={{
            background: '#0D3B66',
            color: '#FFFFFF',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <span aria-hidden="true">📲</span>
          Install PCS Express for faster offline access.
          <button
            onClick={triggerInstall}
            aria-label="Install PCS Express to home screen"
            style={{ background: '#FFFFFF', color: '#0D3B66', border: 'none', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
          >
            Install
          </button>
          <button
            onClick={dismissPwa}
            aria-label="Dismiss install nudge"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Not now
          </button>
        </div>
      )}

      {showIosNudge && (
        <div
          role="status"
          style={{
            background: '#0D3B66',
            color: '#FFFFFF',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            flexWrap: 'wrap',
          }}
        >
          <span aria-hidden="true">📲</span>
          On iPhone: tap the Share button, then "Add to Home Screen" for one-tap PCS Express.
          <button
            onClick={dismissPwa}
            aria-label="Dismiss install nudge"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
}
