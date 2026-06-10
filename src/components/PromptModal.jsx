/*
 * PromptModal — in-app replacement for window.prompt / window.confirm.
 *
 * window.prompt and window.confirm are NOT supported inside the
 * Capacitor native WebView (iOS/Android), so any feature that relied
 * on them was silently dead on native. This component reproduces the
 * same flow with an accessible in-app dialog that:
 *   - renders role="dialog" aria-modal="true" with a labelled title
 *   - traps keyboard focus via the shared useFocusTrap hook
 *   - closes on Escape (resolving to null / cancel)
 *   - returns the chosen value to the original handler
 *
 * Variants:
 *   - 'date'           → <input type="date">,      onSubmit(value: 'YYYY-MM-DD')
 *   - 'datetime-local' → <input type="datetime-local">, onSubmit('YYYY-MM-DDTHH:MM')
 *   - 'confirm'        → no input, onSubmit(true)
 *
 * Usage (controlled by the parent):
 *   const [prompt, setPrompt] = useState(null); // { variant, title, ... } | null
 *   ...
 *   setPrompt({
 *     variant: 'date',
 *     title: 'Snooze until',
 *     defaultValue: def,
 *     onSubmit: (val) => snoozeUntil(key, val),
 *   });
 *   ...
 *   {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
 *
 * Keep it self-contained: the parent only supplies copy + handlers and
 * decides when to unmount it (typically via onClose).
 */
import { useState, useRef, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function PromptModal({
  variant = 'confirm',
  title,
  message,
  defaultValue = '',
  confirmLabel,
  cancelLabel = 'Cancel',
  accent = '#0D3B66',
  onSubmit,
  onClose,
}) {
  const dialogRef = useRef(null);
  const [value, setValue] = useState(defaultValue);
  useFocusTrap(dialogRef, true);

  // Escape cancels (mirrors window.prompt returning null on cancel).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isInput = variant === 'date' || variant === 'datetime-local';
  const submit = () => {
    if (isInput) {
      if (!value) return; // require a value, like a non-empty prompt
      onSubmit?.(value);
    } else {
      onSubmit?.(true);
    }
    onClose?.();
  };

  const titleId = 'prompt-modal-title';

  return (
    <div
      ref={dialogRef}
      data-no-language-runtime
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 420, width: '100%', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', borderTop: `6px solid ${accent}`, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px' }}>
          <h2 id={titleId} style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 900, color: '#1F2937' }}>{title}</h2>
          {message && (
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#374151', margin: '0 0 14px' }}>{message}</p>
          )}
          {isInput && (
            <input
              type={variant}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #D1D5DB', fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}
            />
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => onClose?.()}
              style={{ flex: 1, padding: '13px', borderRadius: 10, background: '#F3F4F6', color: '#1F2937', border: '1.5px solid #D1D5DB', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={submit}
              style={{ flex: 1, padding: '13px', borderRadius: 10, background: accent, color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
            >
              {confirmLabel || (variant === 'confirm' ? 'Confirm' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
