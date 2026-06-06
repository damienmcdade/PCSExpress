import { useEffect, useState, useRef } from 'react'

// Collision-proof id: Date.now() alone repeats within the same millisecond
// (e.g. a route + its directions saved in one tick), which made delete-by-id
// remove the wrong entry. Suffix with randomness.
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
import BaseMapModule from './BaseMapModule'
import { secureLocalStore, readLegacyJson } from '../security/SecurityExtensions'
import { apiUrl } from '../config/apiConfig'
import TabBar from './TabBar'

function NavigationModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('routes')
  const [departingFrom, setDepartingFrom] = useState('')
  const [destination, setDestination] = useState('')
  const [freeFormFrom, setFreeFormFrom] = useState('')
  const [freeFormTo, setFreeFormTo] = useState('')
  const [savedRoutes, setSavedRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeSteps, setRouteSteps] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [savedDirections, setSavedDirections] = useState(() => {
    return readLegacyJson('pcs_saved_directions', [])
  })
  const [expandedDirectionId, setExpandedDirectionId] = useState(null)

  // Don't let the async hydrate clobber directions the user saved/deleted
  // during the load window (the legacy sync read returns [] for an
  // encrypted envelope, so this async read is the real source of truth —
  // but only until the user touches the list).
  const directionsDirtyRef = useRef(false)
  useEffect(() => {
    secureLocalStore.get('pcs_saved_directions', null).then(saved => {
      if (Array.isArray(saved) && !directionsDirtyRef.current) setSavedDirections(saved)
    })
  }, [])
  // Official base map data is rendered by BaseMapModule. Mock placeholder map data has been removed.
  const BASE_MAPS = {};
  const POPULAR_ROUTES = {};

  // Geocode via the server proxy (cached, rate-limited, properly identified to
  // OSM) instead of calling Nominatim directly from the browser.
  const geocode = async (address) => {
    const r = await fetch(apiUrl(`/api/geocode?q=${encodeURIComponent(address)}`), {
      headers: { Accept: 'application/json' }
    });
    const d = await r.json();
    if (!d || d.error || !Number.isFinite(d.lat) || !Number.isFinite(d.lng)) {
      throw new Error(`Address not found: "${address}"`);
    }
    return { lat: d.lat, lng: d.lng, display: d.display };
  };

  // Format duration from seconds
  const formatDuration = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.round((secs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  // Save directions to localStorage
  const saveDirectionsToStorage = (directions) => {
    directionsDirtyRef.current = true;
    setSavedDirections(prev => {
      const updated = [directions, ...prev].slice(0, 20);
      secureLocalStore.set('pcs_saved_directions', updated);
      return updated;
    });
  };

  // Plan route using OSRM
  const planRoute = async () => {
    if (!freeFormFrom.trim() || !freeFormTo.trim()) {
      setRouteError('Please enter both a starting point and destination.');
      return;
    }
    setRouteLoading(true);
    setRouteError('');
    setRouteSteps([]);
    setRouteInfo(null);
    try {
      const from = await geocode(freeFormFrom);
      const to = await geocode(freeFormTo);
      const r = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?steps=true&geometries=geojson&overview=false`
      );
      const data = await r.json();
      if (data.code !== 'Ok' || !data.routes || !data.routes[0]) {
        throw new Error('No route found between these locations.');
      }
      const route = data.routes[0];
      const miles = (route.distance / 1609.34).toFixed(1);
      const dur = formatDuration(route.duration);
      const fromLabel = from.display?.split(',')[0] || freeFormFrom;
      const toLabel = to.display?.split(',')[0] || freeFormTo;
      setRouteInfo({ distance: miles, duration: dur, from: fromLabel, to: toLabel });

      const steps = [];
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          const instr = step.maneuver?.instruction || step.name;
          if (instr && instr.trim()) steps.push(instr);
        });
      });
      const finalSteps = steps.length > 0 ? steps : ['Head toward destination', `Arrive at ${freeFormTo}`];
      setRouteSteps(finalSteps);

      // Save to routes
      const newRoute = {
        id: uid(),
        from: freeFormFrom,
        to: freeFormTo,
        distance: `${miles} mi`,
        duration: dur,
        type: 'Driving',
        directions: finalSteps,
        timestamp: new Date().toLocaleDateString(),
      };
      setSavedRoutes(prev => [newRoute, ...prev.slice(0, 9)]);

      // Also save to directions
      saveDirectionsToStorage({
        id: uid(),
        name: `${fromLabel} → ${toLabel}`,
        from: fromLabel,
        to: toLabel,
        distance: `${miles} mi`,
        duration: dur,
        steps: finalSteps,
        timestamp: new Date().toLocaleDateString(),
      });
    } catch (e) {
      setRouteError(e.message || 'Failed to plan route. Check your internet connection and try again.');
    }
    setRouteLoading(false);
  };

  const generateOnBaseRoute = () => {
    alert('Official public on-base route data is not available for this installation. Use the public route planner or the official installation directory for current visitor guidance.');
  };

  const deleteRoute = (id) => {
    setSavedRoutes(savedRoutes.filter(r => r.id !== id));
    if (selectedRoute?.id === id) setSelectedRoute(null);
  };

  const deleteDirection = (id) => {
    directionsDirtyRef.current = true;
    setSavedDirections(prev => {
      const updated = prev.filter(d => d.id !== id);
      secureLocalStore.set('pcs_saved_directions', updated);
      return updated;
    });
    if (expandedDirectionId === id) setExpandedDirectionId(null);
  };

  const saveCurrentDirections = () => {
    if (!routeInfo || routeSteps.length === 0) return;
    saveDirectionsToStorage({
      id: uid(),
      name: `${routeInfo.from} → ${routeInfo.to}`,
      from: routeInfo.from,
      to: routeInfo.to,
      distance: `${routeInfo.distance} mi`,
      duration: routeInfo.duration,
      steps: routeSteps,
      timestamp: new Date().toLocaleDateString(),
    });
  };

  const getBaseLocations = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    return BASE_MAPS[baseKey]?.locations || [];
  };

  const getPopularRoutes = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    return POPULAR_ROUTES[baseKey] || [];
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: theme.primary, padding: '0 16px', marginTop: 16, marginBottom: 8 }}>Navigation</h2>

      <div role="note" aria-label="OpenStreetMap egress notice" style={{ padding: '8px 12px', margin: '0 16px 12px', background: '#F0F4FF', border: '1px solid #C7D7F5', borderRadius: 10, fontSize: 11, lineHeight: 1.5, color: '#1A3A5C' }}>
        <strong>Heads up:</strong> Addresses you enter here are sent to <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66' }}>OpenStreetMap</a> (Nominatim + OSRM) for geocoding and routing. Don't enter classified or operationally sensitive locations. Map data © OpenStreetMap contributors, ODbL.
      </div>

      {/* TABS */}
      <TabBar ariaLabel="Navigation sections">
        {[
          { id: 'routes', label: 'Route Planner', icon: '🛣️' },
          { id: 'directions', label: 'Directions', icon: '📋' },
          { id: 'saved', label: 'Saved Routes', icon: '💾' },
          { id: 'baseMap', label: 'Base Map', icon: '🗺️' },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`nav-tab-${t.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`nav-panel-${t.id}`}
              data-active={isActive || undefined}
              onClick={() => setActiveTab(t.id)}
              className={`pcs-tab ${isActive ? 'is-active' : ''}`}
              style={{
                padding: '8px 12px',
                borderRadius: 20,
                border: `1.5px solid ${isActive ? theme.primary : '#E0E6EE'}`,
                background: isActive ? theme.primary : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#56697C',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: isActive ? 800 : 500,
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </TabBar>

      <div style={{ padding: '0 16px 16px' }}>
        {/* ROUTE PLANNER */}
        {activeTab === 'routes' && (
          <div role="tabpanel" id="nav-panel-routes" aria-labelledby="nav-tab-routes">
            {/* Free-form route planner with real geocoding */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 12 }}>Plan a Route (Any Address)</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>FROM</label>
              <input
                aria-label="Route starting point"
                type="text"
                value={freeFormFrom}
                onChange={e => setFreeFormFrom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && planRoute()}
                placeholder="e.g., Fort Liberty, NC"
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', marginBottom: 10, fontSize: 12, boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>TO</label>
              <input
                aria-label="Route destination"
                type="text"
                value={freeFormTo}
                onChange={e => setFreeFormTo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && planRoute()}
                placeholder="e.g., Fort Campbell, KY"
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', marginBottom: 12, fontSize: 12, boxSizing: 'border-box' }}
              />

              <button
                onClick={planRoute}
                disabled={routeLoading}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: routeLoading ? '#ccc' : theme.primary, color: '#FFF', border: 'none', fontWeight: 700, cursor: routeLoading ? 'not-allowed' : 'pointer', fontSize: 12 }}
              >
                {routeLoading ? 'Planning Route...' : 'Plan Route'}
              </button>

              {routeError && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFEBEE', borderRadius: 8, color: '#C62828', fontSize: 11 }}>{routeError}</div>
              )}
            </div>

            {/* Route result */}
            {routeInfo && (
              <div style={{ background: `${theme.primary}15`, border: `1.5px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: theme.primary, marginBottom: 8 }}>ROUTE SUMMARY</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: theme.primary }}>{routeInfo.distance}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>miles</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: theme.primary }}>{routeInfo.duration}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>driving</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                  <strong>{routeInfo.from}</strong> → <strong>{routeInfo.to}</strong>
                </div>
                <button
                  onClick={saveCurrentDirections}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, background: theme.accent || theme.primary, color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 11, marginTop: 4 }}
                >
                  💾 Save Route
                </button>
              </div>
            )}

            {/* Turn-by-turn directions */}
            {routeSteps.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 10 }}>TURN-BY-TURN DIRECTIONS</div>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {routeSteps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: theme.primary, color: '#FFF', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{idx + 1}</div>
                      <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* POI Legend */}
            <div style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 6 }}>POINTS OF INTEREST LEGEND</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {[['⛽', 'Gas Station'], ['🏨', 'Hotel/Lodging'], ['🍴', 'Restaurant'], ['🅿️', 'Rest Stop'], ['🏥', 'Hospital'], ['🛒', 'Exchange/Commissary']].map(([icon, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555' }}>
                    <span style={{ fontSize: 14 }}>{icon}</span> {label}
                  </div>
                ))}
              </div>
            </div>

            {/* On-base selector route planner */}
            {getBaseLocations().length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#56697C', marginBottom: 10, marginTop: 4 }}>ON-BASE ROUTE PLANNER</div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <label htmlFor="nav-departing-from" style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>DEPARTING FROM</label>
                  <select id="nav-departing-from" aria-label="Departing from" value={departingFrom} onChange={(e) => setDepartingFrom(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', marginBottom: 10, fontSize: 12 }}>
                    <option value="">Select location...</option>
                    {getBaseLocations().map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name} ({loc.type})</option>
                    ))}
                  </select>

                  <label htmlFor="nav-destination" style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>DESTINATION</label>
                  <select id="nav-destination" aria-label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', fontSize: 12 }}>
                    <option value="">Select location...</option>
                    {getBaseLocations().map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name} ({loc.type})</option>
                    ))}
                  </select>
                </div>

                <button onClick={generateOnBaseRoute} style={{ width: '100%', padding: '11px', borderRadius: 10, background: theme.primary, color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer', marginBottom: 14, fontSize: 12 }}>
                  Generate On-Base Route
                </button>
              </>
            )}

            {/* POPULAR ROUTES */}
            {getPopularRoutes().length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10 }}>POPULAR ROUTES</div>
                {getPopularRoutes().map((route, idx) => (
                  <button type="button" key={idx} onClick={() => { setDepartingFrom(route.from); setDestination(route.to); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{route.name}</span>
                      <span style={{ fontSize: 10, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{route.type}</span>
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: '#56697C' }}>{route.distance} • {route.duration}</span>
                  </button>
                ))}
              </>
            )}

            {selectedRoute && (
              <div style={{ background: `${theme.primary}15`, border: `1px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>ROUTE DETAILS</div>
                <div style={{ fontSize: 11, color: '#34495E', lineHeight: 1.6, marginBottom: 8 }}>
                  {selectedRoute.directions.map((dir, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>{idx + 1}. {dir}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DIRECTIONS TAB */}
        {activeTab === 'directions' && (
          <div role="tabpanel" id="nav-panel-directions" aria-labelledby="nav-tab-directions">
            {/* Current active directions */}
            {routeInfo && routeSteps.length > 0 ? (
              <div style={{ background: `${theme.primary}15`, border: `1.5px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: theme.primary, marginBottom: 6 }}>CURRENT DIRECTIONS</div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
                  <strong>{routeInfo.from}</strong> → <strong>{routeInfo.to}</strong>
                  <span style={{ marginLeft: 10, color: '#888' }}>{routeInfo.distance} mi • {routeInfo.duration}</span>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
                  {routeSteps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: theme.primary, color: '#FFF', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{idx + 1}</div>
                      <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{step}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveCurrentDirections}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                >
                  💾 Save Current Directions
                </button>
              </div>
            ) : (
              <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '18px 16px', marginBottom: 14, textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>📋</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Active Directions</div>
                <div style={{ fontSize: 11 }}>Plan a route to generate turn-by-turn directions. Saved directions appear here for offline use.</div>
              </div>
            )}

            {/* Saved directions list */}
            <div style={{ fontSize: 12, fontWeight: 800, color: '#56697C', marginBottom: 10 }}>SAVED DIRECTIONS</div>
            {savedDirections.length > 0 ? (
              savedDirections.map((dir) => (
                <div key={dir.id} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{dir.name || `${dir.from} → ${dir.to}`}</div>
                      <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>{dir.distance} • {dir.duration}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Saved: {dir.timestamp}</div>
                    </div>
                    <button
                      onClick={() => deleteDirection(dir.id)}
                      style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700, flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedDirectionId(expandedDirectionId === dir.id ? null : dir.id)}
                    style={{ width: '100%', padding: '7px', borderRadius: 6, background: expandedDirectionId === dir.id ? theme.primary : '#F0F4F8', color: expandedDirectionId === dir.id ? '#FFF' : '#56697C', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                  >
                    {expandedDirectionId === dir.id ? 'Hide Steps' : 'Show Steps'}
                  </button>
                  {expandedDirectionId === dir.id && dir.steps && dir.steps.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {dir.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start', borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none', paddingTop: idx > 0 ? 6 : 0 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${theme.primary}22`, color: theme.primary, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{idx + 1}</div>
                          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Saved Directions</div>
                <div style={{ fontSize: 11 }}>Plan a route to generate turn-by-turn directions. Saved directions appear here for offline use.</div>
              </div>
            )}
          </div>
        )}

        {/* SAVED ROUTES */}
        {activeTab === 'saved' && (
          <div role="tabpanel" id="nav-panel-saved" aria-labelledby="nav-tab-saved">
            {savedRoutes.length > 0 ? (
              savedRoutes.map((route) => (
                <div key={route.id} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{route.from} → {route.to}</div>
                      <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>{route.distance} • {route.duration}</div>
                    </div>
                    <button onClick={() => deleteRoute(route.id)} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>Delete</button>
                  </div>
                  <div style={{ fontSize: 10, color: '#56697C', marginBottom: 8 }}>Saved: {route.timestamp} • {route.type}</div>
                  <button onClick={() => setSelectedRoute(route)} style={{ width: '100%', padding: '8px', borderRadius: 6, background: theme.primary, color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}>
                    View Directions
                  </button>
                  {selectedRoute?.id === route.id && route.directions.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {route.directions.map((d, i) => <div key={i} style={{ fontSize: 11, color: '#333', padding: '3px 0', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none' }}>{i + 1}. {d}</div>)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Saved Routes</div>
                <div style={{ fontSize: 11 }}>Plan a route to save it for later</div>
              </div>
            )}
          </div>
        )}

        {/* BASE MAP */}
        {activeTab === 'baseMap' && (
          <div role="tabpanel" id="nav-panel-baseMap" aria-labelledby="nav-tab-baseMap" style={{ margin: '-16px' }}>
            <BaseMapModule theme={theme} profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

export default NavigationModule;
