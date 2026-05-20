/*
 * AIAssistantFAB — persistent floating button that opens the AI
 * Assistant from anywhere in the app.
 *
 * Native-only: returns null on the web build. The web shell already
 * has a sidebar trigger + home-page footer trigger; adding a third on
 * desktop would clutter the viewport. On Capacitor (iOS + Android)
 * the trigger surface is the bottom-nav, which is harder to reach
 * one-handed — the FAB closes that gap.
 *
 * Behaviour:
 *   - Bottom-right anchor with safe-area-inset-bottom padding so the
 *     button clears the iPhone home indicator and the Android nav bar.
 *   - Auto-hides when the user scrolls down past 200px (so it doesn't
 *     cover content during reading) and re-shows on scroll up.
 *   - Single light haptic on tap. Falls through silently when the
 *     Haptics plugin isn't available (e.g. older Capacitor builds).
 *
 * Wiring: rendered once at the App shell. Calls the same
 * `setShowAIAssistant(true)` setter the existing triggers use.
 */
import { useEffect, useState } from 'react';
import { isNative } from '../native';

async function lightHaptic() {
  try {
    const mod = await import('@capacitor/haptics');
    await mod.Haptics?.impact?.({ style: mod.ImpactStyle?.Light || 'LIGHT' });
  } catch {
    // Plugin not installed or platform doesn't support it — silent.
  }
}

export default function AIAssistantFAB({ onClick, theme: _theme }) {
  const [visible, setVisible] = useState(true);
  const [pressed, setPressed] = useState(false);

  // Auto-hide on scroll-down past 200px, re-show on scroll-up. Tracks
  // the last scrollY so we don't toggle visibility on momentum jitter.
  useEffect(() => {
    if (!isNative()) return;
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 200) setVisible(true);
        else if (y > lastY + 8) setVisible(false);
        else if (y < lastY - 8) setVisible(true);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!isNative()) return null;

  const handleClick = () => {
    setPressed(true);
    lightHaptic();
    setTimeout(() => setPressed(false), 120);
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open AI Assistant"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 78px)',
        zIndex: 350,
        width: 56,
        height: 56,
        borderRadius: 28,
        border: 'none',
        background: '#0D3B66',
        color: '#FFFFFF',
        boxShadow: pressed
          ? '0 2px 8px rgba(13, 59, 102, 0.45)'
          : '0 10px 26px rgba(13, 59, 102, 0.42), 0 2px 6px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? '0' : '12px'}) scale(${pressed ? 0.92 : 1})`,
        pointerEvents: visible ? 'auto' : 'none',
        transition:
          'opacity .2s ease, transform .15s ease, box-shadow .12s ease',
      }}
    >
      <span aria-hidden="true">🤖</span>
    </button>
  );
}
