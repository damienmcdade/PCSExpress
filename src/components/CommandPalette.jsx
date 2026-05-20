/*
 * CommandPalette — ⌘K / Ctrl+K global search.
 *
 * Opens an overlay search box that fuzzy-matches across:
 *   - the 6 top-level mission groups (Command Center, PCS Operations,
 *     Movement & Logistics, Family Readiness, Holistic Health,
 *     Mission Resources)
 *   - the legacy tab IDs that still resolve via deep links
 *     (checklist, documents, education, translation, etc.) so users
 *     who remember the old vocabulary can still jump straight there.
 *
 * Navigation is via the existing `pcs-navigate` CustomEvent so we
 * don't have to thread a setActiveTab callback through props — any
 * navigator in the app listens for the same event.
 *
 * Keyboard:
 *   - ⌘K / Ctrl+K toggles the palette
 *   - Esc closes
 *   - ↑↓ moves selection
 *   - Enter activates the highlighted entry
 *   - Type to filter
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ENTRIES = [
  // Top-level (current) mission groups.
  { id: 'home',              label: 'Command Center',       hint: 'Overview · Mission Lanes · AI Assistant', section: 'Mission group' },
  { id: 'pcs-operations',    label: 'PCS Operations',       hint: 'Checklist · Paperwork · Timeline',         section: 'Mission group' },
  { id: 'home-relocation',   label: 'Movement & Logistics', hint: 'Calculators · Maps · Tracker',             section: 'Mission group' },
  { id: 'family-readiness',  label: 'Family Readiness',     hint: 'EFMP · Spouse · Pet relocation',           section: 'Mission group' },
  { id: 'medical-readiness', label: 'Holistic Health',      hint: 'Medical readiness · Mental support',       section: 'Mission group' },
  { id: 'mission-resources', label: 'Mission Resources',    hint: 'Base Insights · Maps · Help Hub',          section: 'Mission group' },

  // Legacy / deep-link IDs. Useful for typed search.
  { id: 'checklist',          label: 'Checklist',           hint: 'PCS phase tasks',                          section: 'Quick jump' },
  { id: 'documents',          label: 'Paperwork',           hint: 'PCS documents binder',                     section: 'Quick jump' },
  { id: 'education',          label: 'Education',           hint: 'Spouse + dependent education',             section: 'Quick jump' },
  { id: 'translation',        label: 'Translation',         hint: 'OCONUS / language tools',                  section: 'Quick jump' },
  { id: 'religion',           label: 'Faith & Chaplains',   hint: 'Religious services directory',             section: 'Quick jump' },
  { id: 'base-intelligence',  label: 'Base Insights',       hint: 'Verified family reviews',                  section: 'Quick jump' },
  { id: 'nav',                label: 'Maps',                hint: 'Installation maps',                        section: 'Quick jump' },
  { id: 'resources',          label: 'Help Hub',            hint: 'DoD/VA resource directory',                section: 'Quick jump' },
  { id: 'jtr-assistant',      label: 'JTR Assistant',       hint: 'Travel reg lookups + citations',           section: 'Quick jump' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

function navigateTo(tabId) {
  try {
    window.dispatchEvent(new CustomEvent('pcs-navigate', { detail: { tab: tabId } }));
  } catch {}
}

function fuzzyMatch(query, entry) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return entry.label.toLowerCase().includes(q)
      || entry.id.toLowerCase().includes(q)
      || (entry.hint || '').toLowerCase().includes(q);
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  const filtered = useMemo(() => ENTRIES.filter(e => fuzzyMatch(query, e)), [query]);

  useEffect(() => {
    const onKey = (e) => {
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setActiveIdx(0);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const entry = filtered[activeIdx];
        if (entry) {
          navigateTo(entry.id);
          setOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIdx]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(13,24,33,0.55)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%', maxWidth: 560,
          background: '#FFFFFF', borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          border: '1px solid #E0E6EE',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Jump to a tab — type to search (${isMac ? '⌘K' : 'Ctrl+K'})`}
          aria-label="Search PCS Express"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px 18px',
            fontSize: 14, fontWeight: 600,
            border: 'none', outline: 'none',
            borderBottom: '1px solid #E0E6EE',
            color: '#0D1821',
          }}
        />
        <div role="listbox" aria-label="Search results" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: '#56697C', textAlign: 'center' }}>
              No matches. Try "checklist", "BAH", "religious", "EFMP", "JTR".
            </div>
          )}
          {filtered.map((entry, idx) => {
            const active = idx === activeIdx;
            return (
              <div
                key={entry.id}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => { navigateTo(entry.id); setOpen(false); }}
                style={{
                  padding: '11px 18px',
                  cursor: 'pointer',
                  background: active ? '#F0F4F8' : 'transparent',
                  borderLeft: active ? '3px solid #1565C0' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821' }}>{entry.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#8B97A6', textTransform: 'uppercase', letterSpacing: '.06em' }}>{entry.section}</div>
                </div>
                {entry.hint && (
                  <div style={{ fontSize: 11, color: '#56697C', marginTop: 2 }}>{entry.hint}</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 14px', borderTop: '1px solid #E0E6EE', background: '#F8FAFC', fontSize: 10, color: '#56697C', display: 'flex', justifyContent: 'space-between' }}>
          <span>↑↓ navigate · Enter select · Esc close</span>
          <span>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
