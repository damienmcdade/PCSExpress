/*
 * usePullToRefresh — touch-driven pull-to-refresh primitive.
 *
 *   const { containerRef, indicatorStyle, refreshing } =
 *     usePullToRefresh(async () => { await fetchLatest(); });
 *
 *   <div ref={containerRef} style={{ overflowY: 'auto', height: '100%' }}>
 *     <div style={indicatorStyle}>↻</div>
 *     {children}
 *   </div>
 *
 * Native-only: returns inert refs on web (the desktop browser scroll
 * bars already make pull-gestures unnatural, and Capacitor's WebView
 * overscroll-bounce on iOS reads cleanly only inside a native shell).
 * The hook is safe to call unconditionally — it no-ops off-native.
 *
 * Behaviour:
 *   - Activates only when the container is scrolled to the very top.
 *   - User drags down; the indicator translates with rubber-band
 *     resistance (0.5x finger movement) up to a 90px ceiling.
 *   - Release past the 60px threshold triggers `onRefresh()`. The
 *     indicator stays pinned at the threshold while the promise
 *     resolves, then snaps back to 0 over 240ms.
 *   - Release before the threshold snaps back without firing.
 *
 * Implementation notes:
 *   - Pointer events are passive-friendly: we only call
 *     preventDefault() when we know we're handling the gesture, and
 *     only via a touch-action: pan-y inline style.
 *   - A short haptic fires on threshold-cross and on refresh start,
 *     mirroring the iOS / Material conventions.
 */
import { useEffect, useRef, useState } from 'react';
import { isNative } from '../native';

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
  const startY = useRef(0);
  const tracking = useRef(false);
  const passedThreshold = useRef(false);

  useEffect(() => {
    if (!isNative()) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (refreshing) return;
      if (el.scrollTop > 0) return;
      tracking.current = true;
      passedThreshold.current = false;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!tracking.current || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // If the container has scrolled down (rare — we set tracking only
      // when scrollTop was 0 — but iOS sometimes fires extra events),
      // bail out so native scroll wins.
      if (el.scrollTop > 0) {
        tracking.current = false;
        setPull(0);
        return;
      }
      e.preventDefault();
      const offset = Math.min(MAX, dy * RESISTANCE);
      if (!passedThreshold.current && offset >= TRIGGER) {
        passedThreshold.current = true;
        light();
      } else if (passedThreshold.current && offset < TRIGGER) {
        passedThreshold.current = false;
      }
      setPull(offset);
    };

    const onTouchEnd = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      if (pull >= TRIGGER) {
        setRefreshing(true);
        setPull(TRIGGER);
        light();
        try {
          await onRefresh?.();
        } catch {
          // Caller is responsible for surfacing its own error state.
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onRefresh, pull, refreshing]);

  const indicatorStyle = {
    height: pull,
    transition: refreshing || pull === 0 ? 'height .24s ease' : 'none',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0D3B66',
    fontSize: 16,
    fontWeight: 800,
    background: 'transparent',
    pointerEvents: 'none',
  };

  const indicator = isNative() ? (
    <span style={{ opacity: Math.min(1, pull / TRIGGER), transform: `rotate(${refreshing ? 360 : pull * 4}deg)`, transition: refreshing ? 'transform 1s linear infinite' : 'none' }}>
      ↻
    </span>
  ) : null;

  return { containerRef, indicatorStyle, indicator, refreshing };
}
