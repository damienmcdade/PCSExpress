import { useState } from 'react'
import BaseMapModule from './BaseMapModule'

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
    try {
      return JSON.parse(localStorage.getItem('pcs_saved_directions')) || []
    } catch {
      return []
    }
  })
  const [expandedDirectionId, setExpandedDirectionId] = useState(null)

  // Mock base maps data
  const BASE_MAPS = {
    'Fort Liberty NC': {
      baseMap: 'https://via.placeholder.com/600x800?text=Fort+Liberty+Base+Map',
      locations: [
        { id: 1, name: 'Main Gate', type: 'Gate', coordinates: '(125, 150)', building: 'Gate 1', services: ['ID Check', 'Visitor Pass'] },
        { id: 2, name: 'Headquarters', type: 'Building', coordinates: '(300, 200)', building: 'Building A', services: ['Command', 'Administration'] },
        { id: 3, name: 'Medical Center', type: 'Hospital', coordinates: '(350, 400)', building: 'Building B', services: ['Emergency', 'Dental', 'Mental Health'] },
        { id: 4, name: 'Commissary', type: 'Store', coordinates: '(150, 300)', building: 'Building C', services: ['Groceries', 'Supplies'] },
        { id: 5, name: 'Exchange', type: 'Store', coordinates: '(200, 280)', building: 'Building D', services: ['Retail', 'Electronics'] },
        { id: 6, name: 'Housing Office', type: 'Office', coordinates: '(250, 350)', building: 'Building E', services: ['Housing Assignment', 'Rent Support'] },
        { id: 7, name: 'Dining Facility', type: 'Dining', coordinates: '(400, 250)', building: 'Building F', services: ['Breakfast', 'Lunch', 'Dinner'] },
        { id: 8, name: 'Fitness Center', type: 'Gym', coordinates: '(450, 300)', building: 'Building G', services: ['Weights', 'Cardio', 'Classes'] },
        { id: 9, name: 'Library', type: 'Library', coordinates: '(320, 150)', building: 'Building H', services: ['Books', 'Computer Lab', 'Study Areas'] },
        { id: 10, name: 'Childcare Center', type: 'Daycare', coordinates: '(100, 400)', building: 'Building I', services: ['Infant Care', 'Preschool', 'After-School'] },
      ],
    },
    'Naval Station Norfolk VA': {
      baseMap: 'https://via.placeholder.com/600x800?text=Norfolk+Naval+Base+Map',
      locations: [
        { id: 1, name: 'Naval Gate', type: 'Gate', coordinates: '(150, 100)', building: 'Security', services: ['Naval ID Check'] },
        { id: 2, name: 'Naval Medical Center', type: 'Hospital', coordinates: '(400, 300)', building: 'Medical', services: ['Military Medicine', 'Dental'] },
        { id: 3, name: 'Exchange', type: 'Store', coordinates: '(250, 200)', building: 'Retail', services: ['Navy Exchange'] },
        { id: 4, name: 'Submarine Pier', type: 'Pier', coordinates: '(550, 400)', building: 'Fleet', services: ['Fleet Operations'] },
      ],
    },
  };

  const POPULAR_ROUTES = {
    'Fort Liberty NC': [
      { name: 'Main Gate to Housing', from: 'Main Gate', to: 'Housing Office', distance: '2.3 mi', duration: '8 min', type: 'Driving' },
      { name: 'Main Gate to Medical', from: 'Main Gate', to: 'Medical Center', distance: '1.8 mi', duration: '6 min', type: 'Driving' },
      { name: 'Commissary to Exchange', from: 'Commissary', to: 'Exchange', distance: '0.3 mi', duration: '2 min', type: 'Walking' },
      { name: 'Housing to Dining', from: 'Housing Office', to: 'Dining Facility', distance: '1.2 mi', duration: '4 min', type: 'Driving' },
      { name: 'Main Gate to Childcare', from: 'Main Gate', to: 'Childcare Center', distance: '3.1 mi', duration: '10 min', type: 'Driving' },
    ],
  };

  // Geocode helper using Nominatim
  const geocode = async (address) => {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    const d = await r.json();
    if (!d.length) throw new Error(`Address not found: "${address}"`);
    return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), display: d[0].display_name };
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
    const updated = [directions, ...savedDirections].slice(0, 20);
    setSavedDirections(updated);
    try {
      localStorage.setItem('pcs_saved_directions', JSON.stringify(updated));
    } catch (e) {
      // storage unavailable
    }
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
        id: Date.now(),
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
        id: Date.now() + 1,
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
    if (!departingFrom || !destination) {
      alert('Please select both departure and destination');
      return;
    }
    const newRoute = {
      id: Date.now(),
      from: departingFrom,
      to: destination,
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} mi`,
      duration: `${Math.floor(Math.random() * 20 + 5)} min`,
      type: Math.random() > 0.5 ? 'Driving' : 'Walking',
      directions: [
        `Head east from ${departingFrom}`,
        'Continue for 0.5 miles',
        'Turn right at intersection',
        `Arrive at ${destination}`,
      ],
      timestamp: new Date().toLocaleDateString(),
    };
    setSavedRoutes([...savedRoutes, newRoute]);
    setSelectedRoute(newRoute);
  };

  const deleteRoute = (id) => {
    setSavedRoutes(savedRoutes.filter(r => r.id !== id));
    if (selectedRoute?.id === id) setSelectedRoute(null);
  };

  const deleteDirection = (id) => {
    const updated = savedDirections.filter(d => d.id !== id);
    setSavedDirections(updated);
    try {
      localStorage.setItem('pcs_saved_directions', JSON.stringify(updated));
    } catch (e) {
      // storage unavailable
    }
    if (expandedDirectionId === id) setExpandedDirectionId(null);
  };

  const saveCurrentDirections = () => {
    if (!routeInfo || routeSteps.length === 0) return;
    saveDirectionsToStorage({
      id: Date.now(),
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

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', padding: '0 16px' }}>
        {[
          { id: 'routes', label: 'Route Planner', icon: '🛣️' },
          { id: 'directions', label: 'Directions', icon: '📋' },
          { id: 'saved', label: 'Saved Routes', icon: '💾' },
          { id: 'baseMap', label: 'Base Map', icon: '🗺️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
              background: activeTab === t.id ? theme.primary : '#FFFFFF',
              color: activeTab === t.id ? '#FFFFFF' : '#56697C',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: activeTab === t.id ? 800 : 500,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {/* ROUTE PLANNER */}
        {activeTab === 'routes' && (
          <div>
            {/* Free-form route planner with real geocoding */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 12 }}>Plan a Route (Any Address)</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>FROM</label>
              <input
                type="text"
                value={freeFormFrom}
                onChange={e => setFreeFormFrom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && planRoute()}
                placeholder="e.g., Fort Liberty, NC"
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', marginBottom: 10, fontSize: 12, boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>TO</label>
              <input
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>DEPARTING FROM</label>
                  <select value={departingFrom} onChange={(e) => setDepartingFrom(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', marginBottom: 10, fontSize: 12 }}>
                    <option value="">Select location...</option>
                    {getBaseLocations().map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name} ({loc.type})</option>
                    ))}
                  </select>

                  <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 5 }}>DESTINATION</label>
                  <select value={destination} onChange={(e) => setDestination(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E0E6EE', fontSize: 12 }}>
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
                  <div key={idx} onClick={() => { setDepartingFrom(route.from); setDestination(route.to); }} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{route.name}</div>
                      <span style={{ fontSize: 10, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{route.type}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#56697C' }}>{route.distance} • {route.duration}</div>
                  </div>
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
          <div>
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
          <div>
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
          <div style={{ margin: '-16px' }}>
            <BaseMapModule theme={theme} profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

export default NavigationModule;
