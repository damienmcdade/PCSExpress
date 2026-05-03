import { useState } from 'react'

function NavigationModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('routes')
  const [departingFrom, setDepartingFrom] = useState('')
  const [destination, setDestination] = useState('')
  const [savedRoutes, setSavedRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)

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

  const generateRoute = () => {
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

  const getBaseLocations = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    return BASE_MAPS[baseKey]?.locations || [];
  };

  const getPopularRoutes = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    return POPULAR_ROUTES[baseKey] || [];
  };

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary }}>🗺️ Navigation & Base Maps</h2>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'routes', label: 'Route Planner', icon: '🛣️' },
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

      {/* ROUTE PLANNER */}
      {activeTab === 'routes' && (
        <div>
          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 6 }}>DEPARTING FROM</label>
            <select
              value={departingFrom}
              onChange={(e) => setDepartingFrom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              <option value="">Select location...</option>
              {getBaseLocations().map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>

            <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 6 }}>DESTINATION</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                fontSize: 12,
              }}
            >
              <option value="">Select location...</option>
              {getBaseLocations().map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateRoute}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: theme.primary,
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            Generate Route
          </button>

          {/* POPULAR ROUTES */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>POPULAR ROUTES</div>
          {getPopularRoutes().map((route, idx) => (
            <div
              key={idx}
              onClick={() => {
                setDepartingFrom(route.from);
                setDestination(route.to);
              }}
              style={{
                background: '#FFFFFF',
                border: `1px solid #E0E6EE`,
                borderLeft: `3px solid ${theme.accent}`,
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{route.name}</div>
                <span style={{ fontSize: 10, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {route.type}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>
                <div>{route.distance} • {route.duration}</div>
              </div>
            </div>
          ))}

          {selectedRoute && (
            <div style={{
              background: `${theme.primary}15`,
              border: `1px solid ${theme.primary}`,
              borderRadius: 12,
              padding: '14px',
              marginTop: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>ROUTE DETAILS</div>
              <div style={{ fontSize: 11, color: '#34495E', lineHeight: 1.6, marginBottom: 8 }}>
                {selectedRoute.directions.map((dir, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    {idx + 1}. {dir}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSavedRoutes([...savedRoutes, selectedRoute])}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  background: '#4CAF50',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Download for Offline
              </button>
            </div>
          )}
        </div>
      )}

      {/* SAVED ROUTES */}
      {activeTab === 'saved' && (
        <div>
          {savedRoutes.length > 0 ? (
            savedRoutes.map((route) => (
              <div
                key={route.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid #E0E6EE`,
                  borderLeft: `3px solid ${theme.primary}`,
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>
                      {route.from} → {route.to}
                    </div>
                    <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>
                      {route.distance} • {route.duration}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRoute(route.id)}
                    style={{
                      background: '#FFEBEE',
                      color: '#C62828',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ fontSize: 10, color: '#56697C', marginBottom: 8 }}>
                  Saved: {route.timestamp} • {route.type}
                </div>
                <button
                  onClick={() => setSelectedRoute(route)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 6,
                    background: theme.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  View Offline
                </button>
              </div>
            ))
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Saved Routes</div>
              <div style={{ fontSize: 11 }}>Generate and download routes for offline viewing</div>
            </div>
          )}
        </div>
      )}

      {/* BASE MAP */}
      {activeTab === 'baseMap' && (
        <div>
          <div style={{
            background: '#FFFFFF',
            border: `1px solid #E0E6EE`,
            borderRadius: 12,
            padding: '12px',
            marginBottom: 16,
            textAlign: 'center',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#56697C',
            fontSize: 12,
          }}>
            📍 Interactive Base Map
            <br />
            <span style={{ fontSize: 10 }}>(Base layout and key locations)</span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>KEY LOCATIONS</div>
          {getBaseLocations().map((loc) => (
            <div
              key={loc.id}
              style={{
                background: '#FFFFFF',
                border: `1px solid #E0E6EE`,
                borderLeft: `3px solid ${
                  loc.type === 'Gate' ? '#FF9800' :
                  loc.type === 'Hospital' ? '#F44336' :
                  loc.type === 'Store' ? '#2196F3' :
                  loc.type === 'Dining' ? '#4CAF50' :
                  loc.type === 'Daycare' ? '#E91E63' :
                  theme.accent
                }`,
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{loc.name}</div>
                  <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>{loc.building}</div>
                </div>
                <span style={{
                  fontSize: 9,
                  background: '#F5F5F5',
                  color: '#556',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}>
                  {loc.type}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#34495E', marginTop: 6 }}>
                📍 {loc.coordinates}
              </div>
              <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>
                Services: {loc.services.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NavigationModule;
