/*
 * Persistent crisis-line chip.
 *
 * Always visible at the bottom of every screen. Two tap-to-call
 * targets: Military Crisis Line (988 then 1) and Military OneSource
 * (1-800-342-9647). Collapsible to a single 🆘 icon so it never
 * obscures content, but cannot be fully dismissed — the design
 * intent is that a service member in crisis is never more than one
 * tap away from help, regardless of which mission group they are in.
 */

import { useEffect, useState } from 'react';

const COLLAPSE_KEY = 'pcs_crisis_chip_collapsed';

export default function CrisisLineChip({ isNative, isDesktop }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  // Anchor above the bottom tab bar on mobile / native; sit inside
  // the bottom-left gutter on desktop where the tab bar is absent.
  // The crisis-line chip should never overlap a tap target — the
  // 12-16px offset keeps it clear of system gesture handles too.
  const offsetBottom = isNative && !isDesktop
    ? 'calc(64px + env(safe-area-inset-bottom) + 10px)'
    : 'calc(20px + env(safe-area-inset-bottom))';

  const baseStyle = {
    position: 'fixed',
    bottom: offsetBottom,
    left: isDesktop ? 16 : 12,
    zIndex: 320,
    fontFamily: 'system-ui',
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Show crisis line and OneSource contacts"
        style={{
          ...baseStyle,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '2px solid #FECACA',
          background: '#7F1D1D',
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 900,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(127, 29, 29, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🆘
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Crisis line and confidential counseling"
      style={{
        ...baseStyle,
        right: isDesktop ? 'auto' : 12,
        maxWidth: isDesktop ? 320 : 'calc(100% - 24px)',
        background: '#7F1D1D',
        border: '1.5px solid #FECACA',
        borderRadius: 14,
        padding: '8px 10px',
        boxShadow: '0 10px 28px rgba(127, 29, 29, 0.45)',
        color: '#FFFFFF',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#FECACA', letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 2 }}>Need help now?</div>
        <a
          href="tel:988"
          style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 900, textDecoration: 'none', lineHeight: 1.25 }}
          aria-label="Call Military Crisis Line — 988 then 1"
        >
          📞 Crisis Line · <span style={{ textDecoration: 'underline' }}>988</span> then 1
        </a>
        <a
          href="tel:18003429647"
          style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, textDecoration: 'none', lineHeight: 1.3, opacity: 0.95 }}
          aria-label="Call Military OneSource — 1-800-342-9647"
        >
          OneSource · <span style={{ textDecoration: 'underline' }}>1-800-342-9647</span>
        </a>
      </div>
      <button
        onClick={() => setCollapsed(true)}
        aria-label="Collapse crisis-line chip"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FECACA',
          fontSize: 12,
          fontWeight: 900,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
