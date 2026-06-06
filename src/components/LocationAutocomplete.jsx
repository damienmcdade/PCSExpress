/*
 * LocationAutocomplete — a reusable "City, ST" autofill input used by every
 * location search bar in the app. As the user types, it suggests matching US
 * cities (prefix-first) from a bundled list and fills "City, ST" on select.
 *
 * - Offline + private: filters a lazy-loaded local dataset, no geocoding call.
 * - Not restrictive: the user can still type any free-text location.
 * - Accessible: ARIA combobox/listbox pattern with full keyboard nav
 *   (ArrowUp/Down, Enter, Escape) and click-outside dismissal.
 *
 * Props:
 *   value, onChange(str)  controlled value (the onChange receives the string)
 *   id, ariaLabel, placeholder
 *   theme                 for the active-option highlight
 *   inputStyle            style overrides for the <input>
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';

// Lazy-load the city list once, shared across every instance.
let _citiesPromise = null;
function loadCities() {
  if (!_citiesPromise) {
    _citiesPromise = import('../data/usCities.js').then(m => m.US_CITIES).catch(() => []);
  }
  return _citiesPromise;
}

function rankMatches(cities, term) {
  if (!term) return [];
  const t = term.toLowerCase();
  const out = [];
  for (const c of cities) {
    const lc = c.toLowerCase();
    const city = lc.split(',')[0];
    let rank = -1;
    if (city.startsWith(t)) rank = 0;        // "aus" → Austin
    else if (lc.startsWith(t)) rank = 1;     // "austin, t" → Austin, TX
    else if (city.includes(t)) rank = 2;     // substring fallback
    if (rank >= 0) out.push({ c, rank });
  }
  out.sort((a, b) => a.rank - b.rank || a.c.localeCompare(b.c));
  return out.slice(0, 8).map(x => x.c);
}

// True when the value already equals a list entry (the user has picked) — so
// we stop showing suggestions for an exact match.
function isExactCity(term, cities) {
  const t = String(term || '').toLowerCase();
  return cities.some(c => c.toLowerCase() === t);
}

export default function LocationAutocomplete({
  value, onChange, id, ariaLabel, placeholder, theme, inputStyle = {},
}) {
  const [cities, setCities] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);
  const reactId = useId();
  const listboxId = `${id || 'loc'}-${reactId}-listbox`;
  const accent = (theme && theme.primary) || '#1565C0';

  useEffect(() => {
    let mounted = true;
    loadCities().then(c => { if (mounted) setCities(c); });
    return () => { mounted = false; };
  }, []);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const suggestions = useMemo(() => {
    const term = String(value || '').trim();
    // Don't keep suggesting once the value already IS a "City, ST" pick.
    if (!term || isExactCity(term, cities)) return [];
    return rankMatches(cities, term);
  }, [value, cities]);

  const select = (city) => {
    onChange(city);
    setOpen(false);
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length) { setOpen(true); setActiveIdx(0); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') { setActiveIdx(i => (i + 1) % suggestions.length); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActiveIdx(i => (i <= 0 ? suggestions.length - 1 : i - 1)); e.preventDefault(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { select(suggestions[activeIdx]); e.preventDefault(); }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1); }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <input
        id={id}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIdx(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined}
        autoComplete="off"
        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #D7E0EA', borderRadius: 999, padding: '9px 16px', fontSize: 13, color: '#0D1821', background: '#FFFFFF', ...inputStyle }}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="City suggestions"
          style={{
            position: 'absolute', zIndex: 30, top: 'calc(100% + 4px)', left: 0, right: 0,
            margin: 0, padding: 4, listStyle: 'none',
            background: '#FFFFFF', border: '1px solid #D7E0EA', borderRadius: 12,
            boxShadow: '0 10px 28px rgba(13,24,33,0.16)', maxHeight: 260, overflowY: 'auto',
          }}
        >
          {suggestions.map((c, i) => {
            const active = i === activeIdx;
            return (
              <li
                key={c}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => { e.preventDefault(); select(c); }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  color: active ? '#FFFFFF' : '#1F2A3C',
                  background: active ? accent : 'transparent',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {c}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
