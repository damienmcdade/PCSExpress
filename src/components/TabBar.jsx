import { useEffect, useRef } from 'react';

/**
 * Horizontal-scrollable tab strip. Callers render their own buttons
 * (typically with className="pcs-tab"); TabBar provides the scroll
 * container, edge-fade affordance, ArrowLeft/ArrowRight/Home/End
 * keyboard nav, and scroll-into-view for whichever child carries
 * data-active.
 *
 * Replaces the inline `display: flex; overflow-x: auto; flex-wrap: wrap`
 * boilerplate that was duplicated across ~14 modules.
 */
export default function TabBar({ ariaLabel, children, className = '', style }) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const active = scroller.querySelector('[data-active="true"]');
    if (!active) return;
    const aRect = active.getBoundingClientRect();
    const sRect = scroller.getBoundingClientRect();
    if (aRect.left < sRect.left || aRect.right > sRect.right) {
      const prefersReducedMotion = typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      active.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }
  });

  const handleKeyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const tabs = Array.from(scroller.querySelectorAll('button, [role="tab"]'));
    if (!tabs.length) return;
    const idx = tabs.indexOf(document.activeElement);
    let next = idx;
    if (e.key === 'ArrowRight') next = idx < 0 ? 0 : Math.min(idx + 1, tabs.length - 1);
    else if (e.key === 'ArrowLeft') next = idx < 0 ? 0 : Math.max(idx - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next !== idx && tabs[next]) {
      e.preventDefault();
      tabs[next].focus();
    }
  };

  return (
    <div className={`pcs-tabbar ${className}`} style={style}>
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label={ariaLabel}
        className="pcs-tabbar-scroller"
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
