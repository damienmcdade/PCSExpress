import { useState } from 'react'

function UnitInfoScreen({ profile, theme, unit }) {
  const [activeUnitTab, setActiveUnitTab] = useState('overview')

  if (!unit) {
    return (
      <div className="tab-content">
        <h2>🎖️ Unit Information</h2>
        <div style={{ background: "#FFEBEE", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#C62828" }}>ℹ️ No unit selected yet</div>
          <div style={{ fontSize: 11, color: "#8B0000", marginTop: 6 }}>
            Select a unit during onboarding to view unit-specific information, news, and resources.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary }}>🎖️ {unit.name}</h2>
      
      {/* Unit Header Card */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}20)`,
        border: `1px solid ${theme.accent}`,
        borderRadius: 12,
        padding: "16px",
        marginBottom: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#56697C", marginBottom: 4 }}>ESTABLISHED</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821" }}>{unit.established}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#56697C", marginBottom: 4 }}>MOTTO</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, fontStyle: "italic" }}>"{unit.motto}"</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#0D1821", lineHeight: 1.5 }}>
          <strong>Nickname:</strong> {unit.nickname}
        </div>
      </div>

      {/* Unit Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "Overview", icon: "📋" },
          { id: "news", label: "News", icon: "📰" },
          { id: "uptempo", label: "Uptempo", icon: "⚡" },
          { id: "social", label: "Social Media", icon: "📱" },
          { id: "companies", label: "Companies", icon: "🏢" },
          { id: "patches", label: "Patches", icon: "🎫" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveUnitTab(t.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 20,
              border: `1.5px solid ${activeUnitTab === t.id ? theme.primary : "#E0E6EE"}`,
              background: activeUnitTab === t.id ? theme.primary : "#FFFFFF",
              color: activeUnitTab === t.id ? "#FFFFFF" : "#56697C",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: activeUnitTab === t.id ? 800 : 500,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeUnitTab === "overview" && (
        <div>
          <div style={{
            background: "#FFFFFF",
            border: `1px solid #E0E6EE`,
            borderLeft: `3px solid ${theme.primary}`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#56697C", marginBottom: 6 }}>UNIT DESIGNATION</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1821", marginBottom: 12 }}>{unit.id}</div>
            
            <div style={{ fontSize: 12, fontWeight: 700, color: "#56697C", marginBottom: 6 }}>BRANCH</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 12 }}>{unit.branch}</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#56697C", marginBottom: 6 }}>HISTORY</div>
            <div style={{ fontSize: 12, color: "#34495E", lineHeight: 1.6 }}>
              {unit.nickname} - Established {unit.established}. {unit.name} continues to serve with distinction.
            </div>
          </div>

          {unit.website && (
            <a href={unit.website} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
              <div style={{
                background: "#E3F2FD",
                border: `1px solid #90CAF9`,
                borderLeft: `3px solid #2196F3`,
                borderRadius: 12,
                padding: "12px 14px",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1565C0" }}>🌐 Official Website</div>
                <div style={{ fontSize: 11, color: "#0D47A1", marginTop: 4 }}>{unit.website}</div>
              </div>
            </a>
          )}
        </div>
      )}

      {/* News Tab */}
      {activeUnitTab === "news" && (
        <div>
          <div style={{
            background: "#FFFFFF",
            border: `1px solid #E0E6EE`,
            borderLeft: `3px solid ${theme.primary}`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821", marginBottom: 8 }}>Latest Updates</div>
            <div style={{ fontSize: 12, color: "#34495E", lineHeight: 1.6 }}>
              {unit.news}
            </div>
          </div>

          <div style={{
            background: "#F0F8FF",
            border: `1px solid #ADD8E6`,
            borderLeft: `3px solid #0099FF`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0C5A7E", marginBottom: 6 }}>📢 Check Unit Website</div>
            <div style={{ fontSize: 11, color: "#034078" }}>
              Visit the official unit website for official news, announcements, and upcoming events.
            </div>
          </div>
        </div>
      )}

      {/* Uptempo Tab */}
      {activeUnitTab === "uptempo" && (
        <div>
          <div style={{
            background: "#FFFFFF",
            border: `1px solid #E0E6EE`,
            borderLeft: `3px solid ${theme.primary}`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821", marginBottom: 8 }}>Operational Tempo</div>
            <div style={{ fontSize: 12, color: "#34495E", lineHeight: 1.6, fontWeight: 600 }}>
              {unit.uptempo}
            </div>
          </div>

          <div style={{
            background: "#FFF3E0",
            border: `1px solid #FFD699`,
            borderLeft: `3px solid #FF9800`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E65100", marginBottom: 6 }}>⚡ What to Expect</div>
            <div style={{ fontSize: 11, color: "#BF360C", lineHeight: 1.6 }}>
              Be prepared for the operational tempo of this unit. Ensure family plans, childcare, and financial arrangements account for deployment cycles and training schedules.
            </div>
          </div>
        </div>
      )}

      {/* Social Media Tab */}
      {activeUnitTab === "social" && (
        <div>
          {unit.social && Object.keys(unit.social).length > 0 ? (
            <div>
              <div style={{
                background: "#FFFFFF",
                border: `1px solid #E0E6EE`,
                borderLeft: `3px solid ${theme.primary}`,
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821", marginBottom: 12 }}>Follow the Unit</div>
                
                {unit.social.facebook && (
                  <a href={`https://www.facebook.com/${unit.social.facebook}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 8 }}>
                    <div style={{
                      background: "#E7F3FF",
                      border: `1px solid #B8E0FF`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1877F2" }}>👍 Facebook</div>
                      <div style={{ fontSize: 10, color: "#0A66C2" }}>@{unit.social.facebook}</div>
                    </div>
                  </a>
                )}

                {unit.social.twitter && (
                  <a href={`https://www.twitter.com/${unit.social.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 8 }}>
                    <div style={{
                      background: "#E1F5FE",
                      border: `1px solid #B3E5FC`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1DA1F2" }}>🐦 Twitter / X</div>
                      <div style={{ fontSize: 10, color: "#1A91DA" }}>{unit.social.twitter}</div>
                    </div>
                  </a>
                )}

                {unit.social.instagram && (
                  <a href={`https://www.instagram.com/${unit.social.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 8 }}>
                    <div style={{
                      background: "#FCE7F3",
                      border: `1px solid #F8BBD0`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#E1306C" }}>📷 Instagram</div>
                      <div style={{ fontSize: 10, color: "#C13584" }}>@{unit.social.instagram}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: "#F5F5F5",
              border: `1px solid #CCCCCC`,
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "center",
              color: "#666"
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Social Media Listed</div>
              <div style={{ fontSize: 11 }}>Check the official unit website for social media links.</div>
            </div>
          )}
        </div>
      )}

      {/* Companies Tab */}
      {activeUnitTab === "companies" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#56697C", marginBottom: 8 }}>SUBORDINATE UNITS</div>
            {unit.companies && unit.companies.map((company, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: `1px solid #E0E6EE`,
                  borderLeft: `3px solid ${theme.accent}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821" }}>🏢 {company}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patches Tab */}
      {activeUnitTab === "patches" && (
        <div>
          <a href={unit.patchStore} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
            <div style={{
              background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}20)`,
              border: `1px solid ${theme.accent}`,
              borderRadius: 12,
              padding: "16px 14px",
              cursor: "pointer",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎫</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 4 }}>Unit Patches & Insignia</div>
              <div style={{ fontSize: 11, color: "#56697C" }}>Shop official unit patches, insignia, and merchandise</div>
              <div style={{ fontSize: 10, color: theme.accent, fontWeight: 700, marginTop: 8 }}>VISIT STORE →</div>
            </div>
          </a>

          <div style={{
            background: "#E8F5E9",
            border: `1px solid #C8E6C9`,
            borderLeft: `3px solid #4CAF50`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1B5E20", marginBottom: 6 }}>💡 Pro Tip</div>
            <div style={{ fontSize: 11, color: "#2E7D32", lineHeight: 1.5 }}>
              Official unit patches are a great way to show pride in your new unit. Display them on uniforms per regulations.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnitInfoScreen
