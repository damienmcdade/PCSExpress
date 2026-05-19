/*
 * CopyableText — single-tap clipboard copy for stress-mode UX.
 *
 * Wraps a piece of text (phone number, address, GBL, lookup code,
 * etc.) in a button that copies it to the clipboard. A brief toast
 * confirms the copy without taking focus or stealing scroll.
 *
 * Why: a parent on hold with a TSP at 0930 is not going to retype a
 * 14-digit GBL number from a phone screen. Tap-to-copy turns every
 * displayed identifier into actionable input for the next tool.
 *
 * Behavior:
 *   - Renders the text as a borderless inline button with a subtle
 *     "tap to copy" affordance on hover/focus.
 *   - On click, writes `value` (falls back to the displayed children)
 *     to navigator.clipboard. Shows a 1.5-second checkmark state.
 *   - Falls back gracefully if Clipboard API is unavailable.
 */

import { useState } from 'react';

export default function CopyableText({
  children,
  value,
  ariaLabel,
  monospace = false,
  inline = true,
  style = {},
  copiedLabel = 'Copied',
}) {
  const [state, setState] = useState('idle'); // 'idle' | 'copied' | 'error'

  const handleCopy = async (e) => {
    e.stopPropagation();
    const text = value != null ? String(value) : (typeof children === 'string' ? children : '');
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setState('copied');
        setTimeout(() => setState('idle'), 1500);
        return;
      }
    } catch {}
    // Fallback: try the deprecated execCommand path. Works in older
    // WebViews and in Capacitor on iOS where Clipboard permission is
    // sometimes deferred.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setState('copied');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 1500);
    }
  };

  const base = {
    background: 'transparent',
    border: 'none',
    padding: inline ? '1px 4px' : '4px 8px',
    margin: 0,
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    borderRadius: 6,
    display: inline ? 'inline' : 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: monospace ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
    textAlign: 'left',
    ...style,
  };

  const indicator = state === 'copied'
    ? <span aria-hidden="true" style={{ marginLeft: 4, fontSize: '0.85em', color: '#1B5E20', fontWeight: 800 }}>✓ {copiedLabel}</span>
    : state === 'error'
      ? <span aria-hidden="true" style={{ marginLeft: 4, fontSize: '0.85em', color: '#C62828', fontWeight: 800 }}>copy unavailable</span>
      : null;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel || (typeof children === 'string' ? `Copy ${children}` : 'Copy')}
      title="Tap to copy"
      className="copyable-text"
      style={base}
    >
      <span style={{ borderBottom: '1px dashed rgba(13,24,33,0.25)' }}>{children}</span>
      {indicator}
    </button>
  );
}
