/*
 * Lazy loader for the three large static PCS data tables. Together
 * these are ~172 KB raw / ~30 KB gzipped — they were previously
 * imported eagerly at the top of App.jsx, which forced their chunk
 * to download before the React shell could finish parsing.
 *
 * Strategy: ship the App with empty placeholders so the React tree
 * can mount immediately, kick off the dynamic import once on the
 * client, then notify subscribed components to re-render with the
 * real data. Components that consume these tables during the brief
 * loading window get empty arrays / empty objects — every call site
 * in App.jsx already handles missing entries with `|| []` /
 * optional chaining, so no UI throws.
 */

import { useEffect, useReducer } from 'react';

export const HEAVY = {
  BRANCH_PCS_CHECKLISTS: {},
  MILITARY_DUTY_STATIONS: [],
  INSTALLATION_SCHOOLS: {},
};

let _loadingPromise = null;
const _subscribers = new Set();

export function loadHeavyData() {
  if (_loadingPromise) return _loadingPromise;
  _loadingPromise = Promise.all([
    import('./branchChecklists'),
    import('./militaryDutyStations'),
    import('./installationSchools'),
  ]).then(([a, b, c]) => {
    HEAVY.BRANCH_PCS_CHECKLISTS = a.BRANCH_PCS_CHECKLISTS;
    HEAVY.MILITARY_DUTY_STATIONS = b.MILITARY_DUTY_STATIONS;
    HEAVY.INSTALLATION_SCHOOLS = c.INSTALLATION_SCHOOLS;
    _subscribers.forEach(fn => { try { fn(); } catch { /* ignore */ } });
    return HEAVY;
  });
  return _loadingPromise;
}

// React hook: kicks off the load (if not started) and forces a
// re-render once the data lands. No-op for the rest of the app's
// lifetime after that single re-render fires.
export function useHeavyData() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  useEffect(() => {
    let mounted = true;
    const notify = () => { if (mounted) forceUpdate(); };
    _subscribers.add(notify);
    loadHeavyData();
    return () => {
      mounted = false;
      _subscribers.delete(notify);
    };
  }, []);
}
