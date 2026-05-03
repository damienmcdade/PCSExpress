import { useState, useEffect } from 'react'
import './App.css'
import DemoTour from './DemoTour'
import UnitInfoScreen from './components/UnitInfoScreen'
import MILITARY_UNITS from './data/militaryUnits'

// ─── STORAGE & HELPERS
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function calculateProgress(profile, activities) {
  if (!profile) return 0;
  const weights = { profile: 10, translations: 20, resourcesViewed: 15, tasksDone: 40, planning: 15 };
  let totalScore = weights.profile;
  if (profile.isOverseas) totalScore += Math.min(activities.translationsCount * 5, weights.translations);
  else totalScore += weights.translations;
  totalScore += Math.min(activities.resourcesViewed * 3, weights.resourcesViewed);
  totalScore += activities.tasksDone > 0 ? Math.min((activities.tasksDone / Math.max(activities.tasksTotal, 1)) * weights.tasksDone, weights.tasksDone) : 0;
  totalScore += Math.min(activities.gainingCategoriesViewed * 3, weights.planning);
  return Math.min(Math.round(totalScore), 100);
}

const MILITARY_DUTY_STATIONS = [
  { name: "Fort Liberty", state: "NC", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Bragg", state: "NC", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Jackson", state: "SC", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Gordon", state: "GA", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Benning", state: "GA", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Naval Station Norfolk", state: "VA", branch: "Navy", country: "USA", region: "Southeast" },
  { name: "Naval Base San Diego", state: "CA", branch: "Navy", country: "USA", region: "West" },
  { name: "Camp Pendleton", state: "CA", branch: "Marine Corps", country: "USA", region: "West" },
  { name: "Joint Base Andrews", state: "MD", branch: "Air Force", country: "USA", region: "Southeast" },
  { name: "Nellis Air Force Base", state: "NV", branch: "Air Force", country: "USA", region: "Mountain" },
];

const BRANCH_THEMES = {
  Army: { primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", name: "Army", abbr: "USA" },
  Navy: { primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", name: "Navy", abbr: "USN" },
  "Marine Corps": { primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", name: "Marines", abbr: "USMC" },
  "Air Force": { primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", name: "Air Force", abbr: "USAF" },
  "Space Force": { primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", name: "Space Force", abbr: "USSF" },
  "Coast Guard": { primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", name: "Coast Guard", abbr: "USCG" },
};

const PRE_DEPLOYMENT_TASKS = [
  { id: "pow_of_atty", category: "Legal", phase: "90+ days", title: "Obtain Power of Attorney (POA)", desc: "Get general or limited POA signed. Notarized copies needed.", urgency: true, completed: false },
  { id: "will_update", category: "Legal", phase: "90+ days", title: "Update will & beneficiaries", desc: "Verify life insurance, SGLI, retirement accounts.", urgency: true, completed: false },
  { id: "budget", category: "Financial", phase: "180+ days", title: "Review household budget", desc: "List all monthly bills. Identify what you'll handle solo.", urgency: true, completed: false },
  { id: "emergency_fund", category: "Financial", phase: "120+ days", title: "Build emergency fund (3-6 months)", desc: "Set aside cash for unexpected costs.", urgency: true, completed: false },
  { id: "childcare", category: "Family", phase: "60+ days", title: "Arrange backup childcare", desc: "Identify someone to help with kids.", urgency: true, completed: false },
  { id: "medical", category: "Medical", phase: "90+ days", title: "Get medical & dental checkups", desc: "Complete annual physicals for whole family.", urgency: false, completed: false },
  { id: "frg_join", category: "Support", phase: "60+ days", title: "Join Family Readiness Group (FRG)", desc: "Connect with other military families.", urgency: true, completed: false },
  { id: "comms_plan", category: "Communication", phase: "30+ days", title: "Establish communication plan", desc: "Agree on email, phone call schedule, time zones.", urgency: true, completed: false },
];

const CRISIS_HOTLINES = [
  { name: "988 Suicide & Crisis Lifeline", phone: "988", desc: "24/7 free confidential support for mental health crisis", icon: "🆘", available: "24/7" },
  { name: "Veterans Crisis Line", phone: "988 then press 1", desc: "Crisis counseling specifically for veterans", icon: "🪖", available: "24/7" },
  { name: "Military OneSource", phone: "1-800-342-9647", desc: "8 free counseling sessions for service members & families", icon: "💬", available: "24/7" },
  { name: "SAMHSA National Helpline", phone: "1-800-662-4357", desc: "Free, confidential, 24/7 substance abuse & mental health", icon: "🤝", available: "24/7" },
];

const VETERAN_OWNED = [
  { name: "Original Mattress Factory", cat: "Furniture", desc: "Veteran-owned mattress retailer. Military discounts (10-20%).", url: "https://www.originalmattress.com", service: "Furniture & Bedding", tag: "🪖" },
  { name: "Patriot Movers", cat: "Moving", desc: "Veteran-owned moving company. PCS & OCONUS expertise.", url: "https://www.patriotmovers.com", service: "Moving & Logistics", tag: "🪖" },
  { name: "Veterans Auto Group", cat: "Vehicles", desc: "Veteran-owned car dealership. Military & veteran discounts.", url: "https://www.veteransautogroup.com", service: "Vehicle Sales", tag: "🪖" },
  { name: "Hire Heroes USA", cat: "Employment", desc: "Free resume, interview, job placement for military & spouses.", url: "https://www.hireheroesusa.org", service: "Career Support", tag: "🪖" },
  { name: "USAA", cat: "Finance", desc: "Veteran-founded. Bank, invest, insure with military benefits.", url: "https://www.usaa.com", service: "Financial Services", tag: "🪖" },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [demoOpen, setDemoOpen] = useState(false)
  const [profile, setProfile] = useState(() => store.get("pcs_profile"))
  const [activities, setActivities] = useState(() =>
    store.get("pcs_activities") || { translationsCount: 0, resourcesViewed: 0, tasksDone: 0, tasksTotal: 10, gainingCategoriesViewed: 0 }
  )
  const [tasks, setTasks] = useState(() => store.get("deployment_tasks") || PRE_DEPLOYMENT_TASKS)
  const [selectedUnit, setSelectedUnit] = useState(() => store.get("selected_unit"))

  const availableUnits = profile && profile.gainingInstallation 
    ? MILITARY_UNITS[profile.gainingInstallation.split(",")[0] + " " + profile.gainingInstallation.split(",")[1]] || []
    : []

  useEffect(() => {
    const demoShown = localStorage.getItem('pcs-demo-shown')
    if (!demoShown && !profile) setDemoOpen(true)
  }, [profile])

  useEffect(() => {
    store.set("pcs_profile", profile)
    store.set("pcs_activities", activities)
    store.set("deployment_tasks", tasks)
    store.set("selected_unit", selectedUnit)
  }, [profile, activities, tasks, selectedUnit])

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleOnboard = (p) => {
    setProfile(p)
    const baseKey = p.gainingInstallation.split(",")[0] + " " + p.gainingInstallation.split(",")[1]
    const units = MILITARY_UNITS[baseKey] || []
    if (units.length > 0) setSelectedUnit(units[0])
    setActiveTab('dashboard')
  }

  const theme = profile ? BRANCH_THEMES[profile.branch] : BRANCH_THEMES.Army
  const progress = calculateProgress(profile, activities)

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: BRANCH_THEMES.Army.secondary, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "36px 24px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", color: BRANCH_THEMES.Army.accent, marginBottom: 8, fontWeight: 800 }}>✦ PCS EXPRESS ✦</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.15 }}>Your move, simplified.</div>
        </div>
        <div style={{ flex: 1, padding: "0 18px 32px" }}>
          <div style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)", padding: "22px 18px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", marginBottom: 18 }}>Get Started</div>
            <button onClick={() => handleOnboard({
              firstName: "Demo", lastName: "User", branch: "Army", component: "Active Duty", paygrade: "E-5",
              losingInstallation: "Fort Bragg, NC USA", gainingInstallation: "Fort Liberty, NC USA", rnltd: "2024-06-15",
              unit: "Company A", isOverseas: false, hasDependents: true, hasChildren: true, hasVehicle: true, bedrooms: "3"
            })} style={{ width: "100%", padding: "14px", borderRadius: 12, background: BRANCH_THEMES.Army.accent,
              color: BRANCH_THEMES.Army.secondary, border: "none", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
              Start PCS Plan ✦
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app" style={{ backgroundColor: '#f0f4f8' }}>
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <h1>PCS Express</h1>
        <button className="demo-btn" onClick={() => setDemoOpen(true)}>🎯 Demo</button>
      </header>

      <aside className={`sidebar ${menuOpen ? 'open' : 'closed'}`}>
        <nav className="menu">
          <a href="#dashboard" onClick={() => { setActiveTab('dashboard'); setMenuOpen(false) }} className={activeTab === 'dashboard' ? 'active' : ''}>🎖️ Dashboard</a>
          <a href="#spouse" onClick={() => { setActiveTab('spouse'); setMenuOpen(false) }} className={activeTab === 'spouse' ? 'active' : ''}>💛 Deployment Prep</a>
          {availableUnits.length > 0 && (
            <>
              <a href="#unit" onClick={() => { setActiveTab('unit'); setMenuOpen(false) }} className={activeTab === 'unit' ? 'active' : ''}>🏢 Your Unit</a>
              {availableUnits.length > 1 && (
                <div style={{ padding: "0 1rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                  <select value={selectedUnit?.id || ''} onChange={(e) => {
                    const unit = availableUnits.find(u => u.id === e.target.value)
                    setSelectedUnit(unit)
                  }} style={{
                    width: "100%", padding: "0.5rem", borderRadius: "0.35rem", border: "1px solid #ddd",
                    fontSize: "0.9rem", backgroundColor: "#f9f9f9", cursor: "pointer"
                  }}>
                    {availableUnits.map(u => (<option key={u.id} value={u.id}>{u.nickname}</option>))}
                  </select>
                </div>
              )}
            </>
          )}
          <a href="#mental" onClick={() => { setActiveTab('mental'); setMenuOpen(false) }} className={activeTab === 'mental' ? 'active' : ''}>🧠 Mental Health</a>
          <a href="#family" onClick={() => { setActiveTab('family'); setMenuOpen(false) }} className={activeTab === 'family' ? 'active' : ''}>👨‍👩‍👧‍👦 Family Health</a>
          <a href="#resources" onClick={() => { setActiveTab('resources'); setMenuOpen(false) }} className={activeTab === 'resources' ? 'active' : ''}>🪖 Resources</a>
          <a href="#faq" onClick={() => { setActiveTab('faq'); setMenuOpen(false) }} className={activeTab === 'faq' ? 'active' : ''}>❓ FAQ</a>
          <button onClick={() => { setProfile(null); setSelectedUnit(null); setMenuOpen(false) }} style={{
            width: "100%", marginTop: "20px", padding: "10px", background: "#D32F2F", color: "#fff",
            border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700"
          }}>Reset Profile</button>
        </nav>
      </aside>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <main className="chat-container" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>🎖️ PCS Dashboard</h2>
            <div style={{ background: `linear-gradient(135deg,${theme.primary}20,${theme.accent}20)`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>Progress: {progress}%</div>
              <div style={{ height: 8, borderRadius: 6, background: "#E0E6EE", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: theme.primary, transition: "width .3s" }} />
              </div>
            </div>
            <div className="dashboard-info">
              <div className="info-card">
                <h3>Your PCS Move</h3>
                <p><strong>From:</strong> {profile.losingInstallation}</p>
                <p><strong>To:</strong> {profile.gainingInstallation}</p>
                <p><strong>Departure:</strong> {new Date(profile.rnltd).toLocaleDateString()}</p>
              </div>
              <div className="info-card">
                <h3>Profile</h3>
                <p><strong>{profile.firstName} {profile.lastName}</strong></p>
                <p>{profile.paygrade} • {profile.branch}</p>
                <p>{profile.component}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'unit' && <UnitInfoScreen profile={profile} theme={theme} unit={selectedUnit} />}

        {activeTab === 'spouse' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>💛 Deployment Prep</h2>
            {Array.from(new Set(tasks.map((t) => t.category))).map((cat) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#56697C", marginBottom: 8 }}>{cat.toUpperCase()}</h3>
                {tasks.filter((t) => t.category === cat).map((task) => (
                  <div key={task.id} onClick={() => toggleTask(task.id)} style={{
                    background: "#FFFFFF", border: `1px solid ${task.completed ? "#D0E8C8" : "#E0E6EE"}`,
                    borderLeft: `3px solid ${task.urgency && !task.completed ? "#D32F2F" : task.completed ? "#0F8A6A" : "#C8A84B"}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", opacity: task.completed ? 0.6 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, border: `2px solid ${task.completed ? "#0F8A6A" : "#D0DAE8"}`,
                        background: task.completed ? "#0F8A6A" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {task.completed && <span style={{ color: "#FFFFFF", fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821", textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</div>
                        <div style={{ fontSize: 12, color: "#56697C" }}>{task.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'mental' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>🧠 Mental Health</h2>
            {CRISIS_HOTLINES.map((hotline) => (
              <div key={hotline.name} onClick={() => window.open(`tel:${hotline.phone.replace(/[^0-9]/g, "")}`)} style={{
                background: "#FFFFFF", border: "1px solid #F0A0A0", borderLeft: "3px solid #D32F2F",
                borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1821" }}>{hotline.name}</div>
                <div style={{ fontSize: 12, color: "#56697C", marginBottom: 6 }}>{hotline.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#D32F2F" }}>{hotline.phone}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'family' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>👨‍👩‍👧‍👦 Family Health</h2>
            {[
              { name: "Spouse Mental Health", desc: "Counseling & support", icon: "💛" },
              { name: "Child Mental Health", desc: "Therapy for children", icon: "👶" },
              { name: "Family Counseling", desc: "Family therapy services", icon: "👨‍👩‍👧‍👦" },
            ].map((service) => (
              <div key={service.name} style={{
                background: "#FFFFFF", border: "1px solid #E0E6EE", borderLeft: `3px solid ${theme.primary}`,
                borderRadius: 12, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1821" }}>{service.name}</div>
                  <span style={{ fontSize: 18 }}>{service.icon}</span>
                </div>
                <div style={{ fontSize: 12, color: "#56697C", marginTop: 4 }}>{service.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>🪖 Resources</h2>
            {[...new Set(VETERAN_OWNED.map((v) => v.cat))].map((cat) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: theme.primary, marginBottom: 6 }}>{cat.toUpperCase()}</h3>
                {VETERAN_OWNED.filter((v) => v.cat === cat).map((vet) => (
                  <a key={vet.name} href={vet.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 8 }}>
                    <div style={{ background: "#FFFFFF", border: `1px solid ${theme.accent}33`, borderLeft: `3px solid ${theme.accent}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0D1821" }}>{vet.name}</div>
                        <span style={{ fontSize: 12 }}>{vet.tag}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#56697C", marginBottom: 6 }}>{vet.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="tab-content">
            <h2>❓ FAQ</h2>
            {[
              { q: "How long does a typical PCS move take?", a: "From notification to arrival is typically 30-60 days." },
              { q: "What is BAH?", a: "BAH covers local housing costs at your new duty station." },
              { q: "Can I refuse a PCS?", a: "In most cases, PCS orders are mandatory." },
            ].map((item, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E0E6EE", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0D1821", marginBottom: 6 }}>{item.q}</h4>
                <p style={{ fontSize: 12, color: "#56697C", margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
