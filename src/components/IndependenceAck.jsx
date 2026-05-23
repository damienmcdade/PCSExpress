/*
 * IndependenceAck — one-time first-launch acknowledgement modal.
 *
 * Shown to users who bypass the landing page (deep links, mobile launch
 * into the last tab, returning users with an existing profile). Surfaces
 * the same independence disclaimer used everywhere else (sourced from
 * src/config/disclaimer.js) and dismisses on a single tap, persisting
 * the acknowledgement in localStorage so it never shows again.
 *
 * Wired in App.jsx: rendered only when the landing page has already been
 * dismissed and the user has not yet acknowledged.
 */
import { useEffect, useState } from 'react';
import { INDEPENDENCE_DISCLAIMER } from '../config/disclaimer';

export const INDEPENDENCE_ACK_STORAGE_KEY = 'pcs_independence_ack_v1';

// Tells the host whether the user has already dismissed this modal. Wrapped
// in try/catch because localStorage is unavailable in some webview contexts.
export function hasAcknowledgedIndependence() {
  try {
    return localStorage.getItem(INDEPENDENCE_ACK_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function IndependenceAck({ onAcknowledge }) {
  const [visible, setVisible] = useState(false);

  // Read the persisted flag once on mount. Defer to next tick so the
  // first paint of the host app isn't blocked by a modal that may not
  // be needed at all.
  useEffect(() => {
    if (!hasAcknowledgedIndependence()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(INDEPENDENCE_ACK_STORAGE_KEY, '1'); } catch {}
    setVisible(false);
    if (typeof onAcknowledge === 'function') onAcknowledge();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="independence-ack-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(13,24,33,0.62)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 56px rgba(0,0,0,0.4)',
          padding: 22,
          border: '1px solid #E0E6EE',
        }}
      >
        <div
          id="independence-ack-title"
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: '#6D4C00',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Independent platform notice
        </div>
        <div style={{ fontSize: 14, color: '#0D1821', lineHeight: 1.55, marginBottom: 18 }}>
          {INDEPENDENCE_DISCLAIMER}
        </div>
        <div style={{ fontSize: 12, color: '#56697C', lineHeight: 1.55, marginBottom: 18 }}>
          Always verify exact entitlements with your unit S1 / IPAC / MPF / PSD
          or the official publication before making financial or housing decisions.
        </div>
        <button
          type="button"
          onClick={dismiss}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            borderRadius: 12,
            background: '#1A3A5C',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          I understand
        </button>
      </div>
    </div>
  );
}
