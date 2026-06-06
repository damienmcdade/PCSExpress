/*
 * Shared "where am I moving to" location for the entire Transition tab.
 *
 * One location, entered once, drives the dynamic location-tailored info cards
 * across every Transition sub-tab (Community, Outreach, Career Center). A
 * React context provided by TransitionTab; persisted (encrypted) under one
 * key and seeded from the gaining installation. Consumers read `location` and
 * call `setLocation`. Used outside the provider (e.g. the spouse Career
 * Center) it safely returns an empty default.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { secureLocalStore } from '../security/SecurityExtensions';
import LocationAutocomplete from './LocationAutocomplete';

export const TRANSITION_LOCATION_KEY = 'pcs_transition_location';

const TransitionLocationContext = createContext({ location: '', setLocation: () => {}, inProvider: false });

export function TransitionLocationProvider({ seed = '', children }) {
  const [location, setLoc] = useState('');
  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(TRANSITION_LOCATION_KEY, null).then(v => {
      if (!mounted) return;
      if (typeof v === 'string' && v) setLoc(v);
      else if (seed) setLoc(seed);
    });
    return () => { mounted = false; };
  }, [seed]);

  const setLocation = (v) => {
    const val = typeof v === 'string' ? v : '';
    setLoc(val);
    secureLocalStore.set(TRANSITION_LOCATION_KEY, val);
  };

  return (
    <TransitionLocationContext.Provider value={{ location, setLocation, inProvider: true }}>
      {children}
    </TransitionLocationContext.Provider>
  );
}

export function useTransitionLocation() {
  return useContext(TransitionLocationContext);
}

// The one location bar for the whole Transition tab. Entering a destination
// here re-tailors the dynamic info cards in Community, Outreach, and the
// Career Center. Rendered inside the provider (above the sub-tabs).
export function TransitionLocationBar({ theme }) {
  const { location, setLocation } = useTransitionLocation();
  const loc = String(location || '').trim();
  return (
    <section aria-label="Destination for tailored resources" style={{ background: '#F4F7FB', border: '1px solid #DCE4EE', borderRadius: 14, padding: 14, margin: '0 0 14px' }}>
      <label htmlFor="transition-location" style={{ display: 'block', fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.1em', marginBottom: 6 }}>
        WHERE ARE YOU MOVING? — TAILORS EVERY TAB
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <LocationAutocomplete
          id="transition-location"
          value={location}
          onChange={setLocation}
          placeholder="City, ST (e.g. Austin, TX)"
          ariaLabel="Destination city and state"
          theme={theme}
        />
        {loc && (
          <button type="button" onClick={() => setLocation('')} aria-label="Clear destination" style={{ border: '1px solid #D4DCE8', borderRadius: 999, background: '#FFF', color: '#43526B', fontSize: 12, fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>Clear</button>
        )}
      </div>
      <div style={{ fontSize: 11, color: loc ? '#176B6B' : '#56697C', fontWeight: loc ? 700 : 400, marginTop: 6 }}>
        {loc ? `✓ Community, Outreach, and Career Center are tailored to ${loc}` : 'Enter your destination to tailor the resource cards across all tabs.'}
      </div>
    </section>
  );
}
