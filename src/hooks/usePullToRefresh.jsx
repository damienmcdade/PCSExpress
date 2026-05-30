/*
 * usePullToRefresh — touch-driven pull-to-refresh primitive.
 *
 * Usage (no container ref required):
 *
 *   const { indicator, refreshing } = usePullToRefresh(async () => {
 *     await loadData();
 *   });
 *
 *   return (
 *     <div>
 *       {indicator}
 *       <rest of tab content />
 *     </div>
 *   );
 *
 * Or for a specific scroll container (the older API still works):
 *
 *   const { containerRef, indicator } = usePullToRefresh(refresh);
 *   <div ref={containerRef} style={{ overflowY: 'auto', height: '100%' }}>...</div>
 *
 * Native-only: returns an inert `indicator` (null) and a no-op
 * ref on web. Capacitor's WebView gives us the rubber-band overscroll
 * feel; desktop browsers don't. The hook is safe to call
 * unconditionally — it no-ops off-native.
 *
 * Behaviour:
 *   - Default scroll surface: document.scrollingElement (the WebView
 *     body). Override by attaching `containerRef` to a custom
 *     scrollable element.
 *   - Activates only when the surface is scrolled to the very top.
 *   - User drags down; the indicator translates with rubber-band
 *     resistance (0.5x finger movement) up to a 90px ceiling.
 *   - Release past the 60px threshold triggers `onRefresh()`. The
 *     indicator stays pinned at the threshold while the promise
 *     resolves, then snaps back to 0 over 240ms.
 *   - Release before the threshold snaps back without firing.
 *   - One light haptic on threshold-cross, one on refresh start.
 *
 * Coexistence: only one tab renders at a time (App.jsx switches by
 * activeTab), so only one usePullToRefresh effect is mounted. The
 * unmount cleanup removes its listeners cleanly.
 */
import { useEffect, useRef, useState } from 'react';

// Inline native check (rather than importing from ../native) so this
// hook's dependency graph stays free of the @capacitor/push-notifications
// dynamic import that lives in the bootstrap module. Vitest's transform
// pipeline can't see past the @vite-ignore the bootstrap uses.
function isNative() {
  if (typeof window === 'undefined') return false;
  return !!window.Capacitor?.isNativePlatform?.();
}

const TRIGGER = 60;
const MAX = 90;
const RESISTANCE = 0.5;

async function light() {
  try {
    const m = await import('@capacitor/haptics');
    await m.Haptics?.impact?.({ style: m.ImpactStyle?.Light || 'LIGHT' });
  } catch {
    // Plugin missing — silent.
  }
}

export function usePullToRefresh(onRefresh) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Mirror pull/refreshing into refs so the touch listeners read the
  // live value without the attach-effect depending on them (which would
  // tear down and re-add listeners on every setPull during a drag and
  // leave onTouchEnd reading a stale `pull`).
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const startY = useRef(0);
  const tracking = useRef(false);
  const passedThreshold = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  // Keep the ref in sync without forcing the listener-attach effect to
  // re-run on every render — that would tear down and re-add touch
  // listeners on every parent state change.
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  useEffect(() => {
    if (!isNative()) return;
    // Resolve the scroll surface: caller's ref wins, else the page
    // scroller. We use document.scrollingElement for scrollTop reads
    // (it's spec-defined to be the actual scroller — body on
    // quirks-mode pages, html otherwise) and attach listeners to
    // window for the touch events because touch on body bubbles up.
    const surface = containerRef.current;
    const scrollEl = surface || document.scrollingElement || document.documentElement;
    const target = surface || window;

    // Update both the ref (read synchronously by the next touch event)
    // and the state (drives the indicator render).
    const setPullBoth = (v) => { pullRef.current = v; setPull(v); };

    const onTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (scrollEl.scrollTop > 0) return;
      tracking.current = true;
      passedThreshold.current = false;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!tracking.current || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullBoth(0);
        return;
      }
      if (scrollEl.scrollTop > 0) {
        tracking.current = false;
        setPullBoth(0);
        return;
      }
      // Suppress native overscroll-bounce while we drive the gesture.
      if (e.cancelable) e.preventDefault();
      const offset = Math.min(MAX, dy * RESISTANCE);
      if (!passedThreshold.current && offset >= TRIGGER) {
        passedThreshold.current = true;
        light();
      } else if (passedThreshold.current && offset < TRIGGER) {
        passedThreshold.current = false;
      }
      setPullBoth(offset);
    };

    const onTouchEnd = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      if (pullRef.current >= TRIGGER) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(TRIGGER);
        light();
        try {
          await onRefreshRef.current?.();
        } catch {
          // Caller is responsible for surfacing its own error state.
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullBoth(0);
        }
      } else {
        setPullBoth(0);
      }
    };

    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: false });
    target.addEventListener('touchend', onTouchEnd, { passive: true });
    target.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
      target.removeEventListener('touchcancel', onTouchEnd);
    };
    // Listeners read live values via refs, so they attach exactly once.
  }, []);

  const indicatorStyle = {
    height: pull,
    transition: refreshing || pull === 0 ? 'height .24s ease' : 'none',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0D3B66',
    fontSize: 18,
    fontWeight: 800,
    background: 'transparent',
    pointerEvents: 'none',
  };

  const indicator = isNative() ? (
    <div style={indicatorStyle}>
      <span
        style={{
          opacity: Math.min(1, pull / TRIGGER),
          display: 'inline-block',
          transform: `rotate(${refreshing ? 360 : pull * 4}deg)`,
          transition: refreshing ? 'transform 1s linear infinite' : 'none',
        }}
      >
        ↻
      </span>
    </div>
  ) : null;

  return { containerRef, indicatorStyle, indicator, refreshing };
}
