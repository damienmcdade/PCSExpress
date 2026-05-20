/*
 * useFocusTrap — keep keyboard focus inside an open modal.
 *
 * When `active` flips to true:
 *   1. Save the element that had focus before the modal opened
 *      (typically the trigger button).
 *   2. Focus the first focusable element inside the container.
 *   3. Listen for Tab / Shift+Tab and cycle within the container
 *      so focus can't escape to the underlying page.
 *
 * When `active` flips to false:
 *   - Restore focus to the saved trigger so keyboard users land
 *     back where they were.
 *
 * Usage:
 *   const ref = useRef(null);
 *   useFocusTrap(ref, open);
 *   return <div ref={ref} role="dialog" aria-modal="true">…</div>;
 *
 * No dependencies beyond React. Respects prefers-reduced-motion
 * indirectly by not changing focus styles — the existing global
 * :focus-visible rule already handles the visual ring.
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((el) => {
      // Hidden by CSS or aria-hidden ancestors don't count.
      if (el.getAttribute('aria-hidden') === 'true') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 || rect.height > 0;
    });
}

export function useFocusTrap(containerRef, active) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previousFocusRef.current = (typeof document !== 'undefined' && document.activeElement) || null;

    // Focus the first focusable element after a brief tick so the
    // modal has time to mount and any auto-focus inside it (e.g.
    // search input) can land first.
    const t = setTimeout(() => {
      const focusable = getFocusable(container);
      if (focusable.length > 0 && !container.contains(document.activeElement)) {
        focusable[0].focus();
      }
    }, 20);

    function onKeyDown(e) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKeyDown);
      // Restore focus to whatever had it before opening.
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus(); } catch {}
      }
    };
  }, [active, containerRef]);
}
