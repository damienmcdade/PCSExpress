import { useEffect, useState } from 'react';
import {
  isNative,
  cachedProStatus,
  getProStatus,
  showProPaywall,
  restoreProPurchases,
  onProStatusChange,
} from '../native';

// PCS Pro feature gate. Wraps exactly three modules (Move Strategy,
// Documents checklist, Inventory & Claims vault) at their render sites in
// App.jsx. The web app stays 100% free: on non-native platforms this
// component renders its children untouched. On iOS it renders the children
// when the PCS Pro subscription is active, otherwise a branded upsell card
// that opens the native StoreKit paywall.

const FEATURE_COPY = {
  'move-strategy': {
    title: 'Move Strategy',
    line: 'Compare HHG, PPM, and partial-PPM side by side and get a recommended plan for your move.',
  },
  documents: {
    title: 'Documents Checklist',
    line: 'Track every PCS form to done and export a printable binder for the gaining unit.',
  },
  'inventory-claims': {
    title: 'Inventory & Claims Vault',
    line: 'Build a room-by-room inventory and an evidence log that wins claims if the movers break something.',
  },
};

const GOLD = '#C99A3D';

function LockIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke={color} strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.6" fill={color} />
    </svg>
  );
}

export default function ProGate({ feature, theme, children }) {
  // Gate on iOS ONLY: that's where the StoreKit paywall lives. Android has no
  // billing yet — gating there would show an upsell whose unlock can't work.
  // Web stays 100% free too.
  const native = isNative() && window.Capacitor?.getPlatform?.() === 'ios';
  const [active, setActive] = useState(() => (native ? cachedProStatus() : true));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!native) return undefined;
    const off = onProStatusChange((isActive) => setActive(!!isActive));
    // Refresh from the live StoreKit entitlement — the initial value above
    // is only the cached last-known status.
    getProStatus().then((isActive) => setActive(!!isActive)).catch(() => {});
    return off;
  }, [native]);

  // Web (and Android until products ship there) stays free/unchanged.
  if (!native || active) return children;

  const copy = FEATURE_COPY[feature] || {
    title: 'This module',
    line: 'This planning module is part of PCS Pro.',
  };
  const primary = theme?.primary || '#0D3B66';

  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      const res = await showProPaywall();
      if (res?.active) setActive(true);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      const res = await restoreProPurchases();
      if (res?.active) setActive(true);
      else setNotice('No active PCS Pro subscription found to restore.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #E0E6EE',
        borderTop: `4px solid ${primary}`,
        borderRadius: 14,
        padding: '28px 22px',
        maxWidth: 460,
        margin: '24px auto',
        textAlign: 'center',
      }}
    >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `${primary}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <LockIcon color={primary} />
        </div>

        <span
          style={{
            display: 'inline-block',
            background: GOLD,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '.08em',
            padding: '4px 10px',
            borderRadius: 999,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          PCS Pro
        </span>

        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 900, color: primary }}>
          {copy.title} is a PCS Pro module
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.55, color: '#56616F' }}>
          {copy.line}
        </p>

        <button
          onClick={unlock}
          disabled={busy}
          style={{
            display: 'block',
            width: '100%',
            padding: '13px 16px',
            background: primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: '.02em',
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'One moment…' : 'Unlock PCS Pro'}
        </button>

        <button
          onClick={restore}
          disabled={busy}
          style={{
            marginTop: 10,
            background: 'transparent',
            border: 'none',
            color: '#56616F',
            fontSize: 12,
            fontWeight: 700,
            cursor: busy ? 'default' : 'pointer',
            textDecoration: 'underline',
          }}
        >
          Restore purchases
        </button>

        {notice && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#7F1D1D' }}>{notice}</p>
        )}

      <p style={{ margin: '14px 0 0', fontSize: 11, color: '#8B96A3' }}>
        Everything else in PCS Express stays free.
      </p>
    </div>
  );
}
