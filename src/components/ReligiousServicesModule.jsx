import { useState } from 'react'

function ReligiousServicesModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('services')

  // Religious services database
  const RELIGIOUS_SERVICES = {
    'Fort Liberty NC': [
      {
        id: 1,
        name: 'Fort Liberty Chapel - Catholic',
        denomination: 'Catholic',
        address: '100 Chapel Road, Fort Liberty, NC',
        phone: '(910) 396-5000',
        mass: ['Sunday 9:00 AM', 'Saturday 5:00 PM', 'Weekday 12:00 PM'],
        contact: 'chaplain.catholic@army.mil',
        onBase: true,
      },
      {
        id: 2,
        name: 'Fort Liberty Chapel - Protestant',
        denomination: 'Protestant',
        address: '100 Chapel Road, Fort Liberty, NC',
        phone: '(910) 396-5000',
        mass: ['Sunday 11:00 AM', 'Wednesday 6:00 PM'],
        contact: 'chaplain.protestant@army.mil',
        onBase: true,
      },
      {
        id: 3,
        name: 'Fort Liberty Chapel - Jewish Services',
        denomination: 'Jewish',
        address: '100 Chapel Road, Fort Liberty, NC',
        phone: '(910) 396-5000',
        mass: ['Friday 6:00 PM (Shabbat)', 'Saturday 9:30 AM'],
        contact: 'chaplain.jewish@army.mil',
        onBase: true,
      },
      {
        id: 4,
        name: 'Fort Liberty Chapel - Islamic Services',
        denomination: 'Islamic',
        address: '100 Chapel Road, Fort Liberty, NC',
        phone: '(910) 396-5000',
        mass: ['Friday 1:00 PM (Jumu\'ah)', 'Daily 5 Salah times'],
        contact: 'chaplain.muslim@army.mil',
        onBase: true,
      },
      {
        id: 5,
        name: 'Fayetteville Community Church',
        denomination: 'Multi-faith Community',
        address: '500 Main St, Fayetteville, NC',
        phone: '(910) 555-2000',
        mass: ['Sunday 9:00 AM & 11:00 AM'],
        contact: 'info@fayettevillecommunity.org',
        onBase: false,
      },
      {
        id: 6,
        name: 'Fayetteville Mosque',
        denomination: 'Islamic',
        address: '250 Ramadan Way, Fayetteville, NC',
        phone: '(910) 555-3000',
        mass: ['Daily prayers', 'Friday Jumu\'ah 1:30 PM'],
        contact: 'info@fayetteville-mosque.org',
        onBase: false,
      },
    ],
  };

  // Spiritual counseling resources
  const COUNSELING_RESOURCES = [
    {
      name: 'Military Chaplain Services',
      description: 'Free confidential spiritual counseling for all service members',
      availability: '24/7 Emergency hotline',
      phone: '(800) 273-8255',
    },
    {
      name: 'Faith & Family Support',
      description: 'Spiritual counseling for military families',
      availability: 'Mon-Fri 8:00 AM - 5:00 PM',
      phone: '(910) 396-5000',
    },
    {
      name: 'Military OneSource Spiritual',
      description: 'Free counseling sessions with spiritual dimension',
      availability: '24/7',
      phone: '(800) 342-9647',
    },
  ];

  const getServices = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    return RELIGIOUS_SERVICES[baseKey] || [];
  };

  const getServicesByDenomination = (denom) => {
    return getServices().filter(s => s.denomination === denom);
  };

  const filterDenom = profile?.filterDenomination;
  const showAll = profile?.showAll !== false && !filterDenom;

  const denominationsToShow = showAll
    ? ['Catholic', 'Protestant', 'Jewish', 'Islamic', 'Multi-faith Community']
    : filterDenom
      ? [filterDenom, 'Multi-faith Community']
      : ['Catholic', 'Protestant', 'Jewish', 'Islamic', 'Multi-faith Community'];

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary, padding: '0 16px', marginTop: 16, marginBottom: 8 }}>Chapel & Spiritual Services</h2>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', padding: '0 16px' }}>
        {[
          { id: 'services', label: 'Services', icon: '⛪' },
          { id: 'counseling', label: 'Counseling', icon: '🤝' },
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

      {/* RELIGIOUS SERVICES */}
      {activeTab === 'services' && (
        <div style={{ padding: '0 16px' }}>
          {denominationsToShow.map((denom) => {
            const services = getServicesByDenomination(denom);
            if (services.length === 0) return null;

            return (
              <div key={denom} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10 }}>
                  {denom.toUpperCase()}
                </div>

                {services.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      background: '#FFFFFF',
                      border: `1px solid #E0E6EE`,
                      borderLeft: `3px solid ${service.onBase ? '#4CAF50' : theme.primary}`,
                      borderRadius: 12,
                      padding: '14px',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{service.name}</div>
                        <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>
                          {service.onBase ? '🏢 On Base' : '🏛️ Community'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.6 }}>
                      <div>📍 {service.address}</div>
                      <div>📞 {service.phone}</div>
                      <div>📧 {service.contact}</div>
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', marginBottom: 10 }}>
                      TIMES:
                    </div>
                    {service.mass.map((time, idx) => (
                      <div key={idx} style={{ fontSize: 10, color: '#34495E', marginBottom: 4 }}>
                        • {time}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* SPIRITUAL COUNSELING */}
      {activeTab === 'counseling' && (
        <div style={{ padding: '0 16px' }}>
          {COUNSELING_RESOURCES.map((resource, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: `1px solid #E0E6EE`,
                borderLeft: `3px solid ${theme.primary}`,
                borderRadius: 12,
                padding: '14px',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 6 }}>
                {resource.name}
              </div>
              <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.5 }}>
                {resource.description}
              </div>
              <div style={{
                background: '#F5F5F5',
                padding: '8px 12px',
                borderRadius: 6,
                marginBottom: 8,
                fontSize: 10,
                color: '#56697C',
              }}>
                🕐 {resource.availability}
              </div>
              <button
                onClick={() => window.open(`tel:${resource.phone}`)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  background: theme.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                📞 Call: {resource.phone}
              </button>
            </div>
          ))}

          <div style={{
            background: `${theme.primary}15`,
            border: `1px solid ${theme.primary}`,
            borderRadius: 12,
            padding: '12px',
            marginTop: 16,
            fontSize: 11,
            color: theme.primary,
            lineHeight: 1.6,
          }}>
            <strong>All services are:</strong>
            <div style={{ marginTop: 6 }}>
              ✓ Confidential<br />
              ✓ Non-judgmental<br />
              ✓ Free for all service members & families<br />
              ✓ Available 24/7 for emergencies
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReligiousServicesModule;
