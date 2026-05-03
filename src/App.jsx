import { useState, useEffect } from 'react'
import './App.css'
import DemoTour from './DemoTour'

// ─── STORAGE & HELPERS ────────────────────────────────────────────────────
const store = {
  get: (k) => {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

function calculateProgress(profile, activities) {
  if (!profile) return 0;
  const weights = { profile: 10, translations: 20, resourcesViewed: 15, tasksDone: 40, planning: 15 };
  let totalScore = weights.profile;
  if (profile.isOverseas) {
    totalScore += Math.min(activities.translationsCount * 5, weights.translations);
  } else {
    totalScore += weights.translations;
  }
  totalScore += Math.min(activities.resourcesViewed * 3, weights.resourcesViewed);
  totalScore += activities.tasksDone > 0 ? Math.min((activities.tasksDone / Math.max(activities.tasksTotal, 1)) * weights.tasksDone, weights.tasksDone) : 0;
  totalScore += Math.min(activities.gainingCategoriesViewed * 3, weights.planning);
  return Math.min(Math.round(totalScore), 100);
}

// ─── U.S. MILITARY DUTY STATIONS DATABASE ──────────────────────────
const MILITARY_DUTY_STATIONS = [
  // Army Installations
  { name: "Fort Liberty", state: "NC", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Bragg", state: "NC", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Jackson", state: "SC", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Gordon", state: "GA", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Benning", state: "GA", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Moore", state: "GA", branch: "Army", country: "USA", region: "Southeast" },
  { name: "Fort Huachuca", state: "AZ", branch: "Army", country: "USA", region: "Southwest" },
  { name: "Fort Bliss", state: "TX", branch: "Army", country: "USA", region: "Southwest" },
  { name: "Fort Hood", state: "TX", branch: "Army", country: "USA", region: "Southwest" },
  { name: "Fort Cavazos", state: "TX", branch: "Army", country: "USA", region: "Southwest" },
  { name: "Fort Drum", state: "NY", branch: "Army", country: "USA", region: "Northeast" },
  { name: "Fort Campbell", state: "KY", branch: "Army", country: "USA", region: "Midwest" },
  { name: "Fort Leonard Wood", state: "MO", branch: "Army", country: "USA", region: "Midwest" },
  { name: "Fort Leavenworth", state: "KS", branch: "Army", country: "USA", region: "Midwest" },
  { name: "Fort Riley", state: "KS", branch: "Army", country: "USA", region: "Midwest" },
  { name: "Fort Carson", state: "CO", branch: "Army", country: "USA", region: "Mountain" },
  { name: "Fort Irwin", state: "CA", branch: "Army", country: "USA", region: "West" },
  { name: "Fort Hunter Liggett", state: "CA", branch: "Army", country: "USA", region: "West" },
  { name: "Fort Lewis", state: "WA", branch: "Army", country: "USA", region: "West" },
  { name: "Joint Base Lewis-McChord", state: "WA", branch: "Army", country: "USA", region: "West" },
  { name: "Fort Wainwright", state: "AK", branch: "Army", country: "USA", region: "Alaska" },
  { name: "Fort Richardson", state: "AK", branch: "Army", country: "USA", region: "Alaska" },
  { name: "Schofield Barracks", state: "HI", branch: "Army", country: "USA", region: "Hawaii" },
  { name: "Fort Shafter", state: "HI", branch: "Army", country: "USA", region: "Hawaii" },
  
  // Navy Installations
  { name: "Naval Station Norfolk", state: "VA", branch: "Navy", country: "USA", region: "Southeast" },
  { name: "Naval Base San Diego", state: "CA", branch: "Navy", country: "USA", region: "West" },
  { name: "Naval Base Pearl Harbor", state: "HI", branch: "Navy", country: "USA", region: "Hawaii" },
  { name: "Naval Base Kitsap", state: "WA", branch: "Navy", country: "USA", region: "West" },
  { name: "Naval Station Everett", state: "WA", branch: "Navy", country: "USA", region: "West" },
  { name: "Naval Base Coronado", state: "CA", branch: "Navy", country: "USA", region: "West" },
  { name: "Naval Station Charleston", state: "SC", branch: "Navy", country: "USA", region: "Southeast" },
  { name: "Naval Submarine Base New London", state: "CT", branch: "Navy", country: "USA", region: "Northeast" },
  { name: "Naval Air Station Kingsville", state: "TX", branch: "Navy", country: "USA", region: "Southwest" },
  { name: "Naval Air Station Corpus Christi", state: "TX", branch: "Navy", country: "USA", region: "Southwest" },
  { name: "Naval Air Station Jacksonville", state: "FL", branch: "Navy", country: "USA", region: "Southeast" },
  { name: "Naval Air Station Pensacola", state: "FL", branch: "Navy", country: "USA", region: "Southeast" },
  { name: "Naval Station Guam", state: "GU", branch: "Navy", country: "USA", region: "Pacific" },
  
  // Marine Corps Installations
  { name: "Camp Pendleton", state: "CA", branch: "Marine Corps", country: "USA", region: "West" },
  { name: "Camp Lejeune", state: "NC", branch: "Marine Corps", country: "USA", region: "Southeast" },
  { name: "Quantico", state: "VA", branch: "Marine Corps", country: "USA", region: "Southeast" },
  { name: "Parris Island", state: "SC", branch: "Marine Corps", country: "USA", region: "Southeast" },
  { name: "Camp Geiger", state: "NC", branch: "Marine Corps", country: "USA", region: "Southeast" },
  { name: "Twentynine Palms", state: "CA", branch: "Marine Corps", country: "USA", region: "West" },
  { name: "Miramar", state: "CA", branch: "Marine Corps", country: "USA", region: "West" },
  { name: "Camp Blaz", state: "GU", branch: "Marine Corps", country: "USA", region: "Pacific" },
  
  // Air Force Installations
  { name: "Joint Base Andrews", state: "MD", branch: "Air Force", country: "USA", region: "Southeast" },
  { name: "Joint Base Elmendorf-Richardson", state: "AK", branch: "Air Force", country: "USA", region: "Alaska" },
  { name: "Nellis Air Force Base", state: "NV", branch: "Air Force", country: "USA", region: "Mountain" },
  { name: "Luke Air Force Base", state: "AZ", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Davis-Monthan Air Force Base", state: "AZ", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Holloman Air Force Base", state: "NM", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Kirtland Air Force Base", state: "NM", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Dyess Air Force Base", state: "TX", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Lackland Air Force Base", state: "TX", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Randolph Air Force Base", state: "TX", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Wright-Patterson Air Force Base", state: "OH", branch: "Air Force", country: "USA", region: "Midwest" },
  { name: "Scott Air Force Base", state: "IL", branch: "Air Force", country: "USA", region: "Midwest" },
  { name: "Offutt Air Force Base", state: "NE", branch: "Air Force", country: "USA", region: "Midwest" },
  { name: "Cannon Air Force Base", state: "NM", branch: "Air Force", country: "USA", region: "Southwest" },
  { name: "Edwards Air Force Base", state: "CA", branch: "Air Force", country: "USA", region: "West" },
  { name: "Travis Air Force Base", state: "CA", branch: "Air Force", country: "USA", region: "West" },
  { name: "Beale Air Force Base", state: "CA", branch: "Air Force", country: "USA", region: "West" },
  { name: "Creech Air Force Base", state: "NV", branch: "Air Force", country: "USA", region: "Mountain" },
  { name: "Mountain Home Air Force Base", state: "ID", branch: "Air Force", country: "USA", region: "Mountain" },
  { name: "Elmendorf Air Force Base", state: "AK", branch: "Air Force", country: "USA", region: "Alaska" },
  { name: "Hickam Air Force Base", state: "HI", branch: "Air Force", country: "USA", region: "Hawaii" },
  
  // Overseas Installations - Europe
  { name: "Ramstein Air Base", state: "Germany", branch: "Air Force", country: "Germany", region: "Europe" },
  { name: "Grafenwoehr", state: "Germany", branch: "Army", country: "Germany", region: "Europe" },
  { name: "Vilseck", state: "Germany", branch: "Army", country: "Germany", region: "Europe" },
  { name: "RAF Lakenheath", state: "England", branch: "Air Force", country: "United Kingdom", region: "Europe" },
  { name: "RAF Mildenhall", state: "England", branch: "Air Force", country: "United Kingdom", region: "Europe" },
  { name: "RAF Feltwell", state: "England", branch: "Air Force", country: "United Kingdom", region: "Europe" },
  { name: "RAF Fairford", state: "England", branch: "Air Force", country: "United Kingdom", region: "Europe" },
  { name: "MCAS Rota", state: "Spain", branch: "Marine Corps", country: "Spain", region: "Europe" },
  { name: "Naval Station Rota", state: "Spain", branch: "Navy", country: "Spain", region: "Europe" },
  { name: "Naples", state: "Italy", branch: "Navy", country: "Italy", region: "Europe" },
  { name: "Vicenza", state: "Italy", branch: "Army", country: "Italy", region: "Europe" },
  
  // Overseas Installations - Asia-Pacific
  { name: "Camp Humphreys", state: "South Korea", branch: "Army", country: "South Korea", region: "Asia-Pacific" },
  { name: "Camp Red Cloud", state: "South Korea", branch: "Army", country: "South Korea", region: "Asia-Pacific" },
  { name: "Osan Air Base", state: "South Korea", branch: "Air Force", country: "South Korea", region: "Asia-Pacific" },
  { name: "Kunsan Air Base", state: "South Korea", branch: "Air Force", country: "South Korea", region: "Asia-Pacific" },
  { name: "Kadena Air Base", state: "Okinawa", branch: "Air Force", country: "Japan", region: "Asia-Pacific" },
  { name: "Camp Foster", state: "Okinawa", branch: "Marine Corps", country: "Japan", region: "Asia-Pacific" },
  { name: "Camp Schwab", state: "Okinawa", branch: "Marine Corps", country: "Japan", region: "Asia-Pacific" },
  { name: "Camp Hansen", state: "Okinawa", branch: "Marine Corps", country: "Japan", region: "Asia-Pacific" },
  { name: "Yokota Air Base", state: "Tokyo", branch: "Air Force", country: "Japan", region: "Asia-Pacific" },
  { name: "Naval Base Yokosuka", state: "Tokyo", branch: "Navy", country: "Japan", region: "Asia-Pacific" },
  { name: "Naval Base Sasebo", state: "Nagasaki", branch: "Navy", country: "Japan", region: "Asia-Pacific" },
  { name: "Anderson Air Force Base", state: "Guam", branch: "Air Force", country: "USA", region: "Pacific" },
  { name: "Naval Base Guam", state: "Guam", branch: "Navy", country: "USA", region: "Pacific" },
];

// ─── BRANCH THEMES ────────────────────────────────────────────────────
const BRANCH_THEMES = {
  Army: { primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", name: "Army", abbr: "USA" },
  Navy: { primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", name: "Navy", abbr: "USN" },
  "Marine Corps": { primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", name: "Marines", abbr: "USMC" },
  "Air Force": { primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", name: "Air Force", abbr: "USAF" },
  "Space Force": { primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", name: "Space Force", abbr: "USSF" },
  "Coast Guard": { primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", name: "Coast Guard", abbr: "USCG" },
};

const COMPONENT_TYPES = ["Active Duty", "Reserve", "National Guard", "AGR", "FTNG"];

// ─── DATA: DEPLOYMENT CHECKLIST ────────────────────────────────────
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

// ─── DATA: CRISIS HOTLINES ────────────────────────────────────────
const CRISIS_HOTLINES = [
  { name: "988 Suicide & Crisis Lifeline", phone: "988", desc: "24/7 free confidential support for mental health crisis", icon: "🆘", available: "24/7" },
  { name: "Veterans Crisis Line", phone: "988 then press 1", desc: "Crisis counseling specifically for veterans", icon: "🪖", available: "24/7" },
  { name: "Military OneSource", phone: "1-800-342-9647", desc: "8 free counseling sessions for service members & families", icon: "💬", available: "24/7" },
  { name: "SAMHSA National Helpline", phone: "1-800-662-4357", desc: "Free, confidential, 24/7 substance abuse & mental health", icon: "🤝", available: "24/7" },
];

// ─── DATA: VETERAN-OWNED BUSINESSES ────────────────────────────────
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

  useEffect(() => {
    const demoShown = localStorage.getItem('pcs-demo-shown')
    if (!demoShown && !profile) {
      setDemoOpen(true)
    }
  }, [profile])

  useEffect(() => {
    store.set("pcs_profile", profile)
    store.set("pcs_activities", activities)
    store.set("deployment_tasks", tasks)
  }, [profile, activities, tasks])

  const toggleMenu = () => setMenuOpen(!menuOpen)

  const handleDemoClose = () => {
    setDemoOpen(false)
    localStorage.setItem('pcs-demo-shown', 'true')
  }

  const theme = profile ? BRANCH_THEMES[profile.branch] : BRANCH_THEMES.Army
  const progress = calculateProgress(profile, activities)

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleOnboard = (p) => {
    setProfile(p)
    setActiveTab('dashboard')
  }

  // ─── ONBOARDING MODAL ──────────────────────────────────────────────
  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: BRANCH_THEMES.Army.secondary, display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} * {box-sizing:border-box}`}</style>
        <div style={{ padding: "36px 24px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", color: BRANCH_THEMES.Army.accent, marginBottom: 8, fontWeight: 800 }}>✦ PCS EXPRESS ✦</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.15 }}>Your move, simplified.</div>
        </div>

        <div style={{ flex: 1, padding: "0 18px 32px" }}>
          <div style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(10px)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)", padding: "22px 18px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", marginBottom: 18 }}>Get Started</div>
            <input 
              type="text"
              placeholder="First name" 
              defaultValue=""
              onBlur={(e) => handleOnboard({
                firstName: e.target.value,
                lastName: "Soldier",
                branch: "Army",
                component: "Active Duty",
                paygrade: "E-5",
                losingInstallation: "Fort Bragg, NC USA",
                gainingInstallation: "Fort Liberty, NC USA",
                rnltd: "2024-06-15",
                unit: "Company A",
                isOverseas: false,
                hasDependents: true,
                hasChildren: true,
                hasVehicle: true,
                bedrooms: "3"
              })}
              style={{
                width: "100%",
                fontSize: 15,
                padding: "11px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.25)",
                color: "#FFFFFF",
                outline: "none",
                marginBottom: 10,
                fontFamily: "inherit"
              }}
            />
            <button 
              onClick={() => handleOnboard({
                firstName: "Demo",
                lastName: "User",
                branch: "Army",
                component: "Active Duty",
                paygrade: "E-5",
                losingInstallation: "Fort Bragg, NC USA",
                gainingInstallation: "Fort Liberty, NC USA",
                rnltd: "2024-06-15",
                unit: "Company A",
                isOverseas: false,
                hasDependents: true,
                hasChildren: true,
                hasVehicle: true,
                bedrooms: "3"
              })}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: BRANCH_THEMES.Army.accent,
                color: BRANCH_THEMES.Army.secondary,
                border: "none",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Start PCS Plan ✦
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app" style={{ backgroundColor: '#f0f4f8' }}>
      {demoOpen && (
        <DemoTour 
          onTabChange={setActiveTab}
          onClose={handleDemoClose}
          onLoadExample={() => setActiveTab('dashboard')}
        />
      )}

      <header className="header">
        <button className="hamburger" onClick={toggleMenu}>☰</button>
        <h1>PCS Express</h1>
        <button className="demo-btn" onClick={() => setDemoOpen(true)} title="Start guided tour">🎯 Demo</button>
      </header>

      <aside className={`sidebar ${menuOpen ? 'open' : 'closed'}`}>
        <nav className="menu">
          <a href="#dashboard" onClick={() => { setActiveTab('dashboard'); setMenuOpen(false) }} className={activeTab === 'dashboard' ? 'active' : ''}>🎖️ Dashboard</a>
          <a href="#spouse" onClick={() => { setActiveTab('spouse'); setMenuOpen(false) }} className={activeTab === 'spouse' ? 'active' : ''}>💛 Deployment Prep</a>
          <a href="#mental" onClick={() => { setActiveTab('mental'); setMenuOpen(false) }} className={activeTab === 'mental' ? 'active' : ''}>🧠 Mental Health</a>
          <a href="#family" onClick={() => { setActiveTab('family'); setMenuOpen(false) }} className={activeTab === 'family' ? 'active' : ''}>👨‍👩‍👧‍👦 Family Health</a>
          <a href="#resources" onClick={() => { setActiveTab('resources'); setMenuOpen(false) }} className={activeTab === 'resources' ? 'active' : ''}>🪖 Resources</a>
          <a href="#employment" onClick={() => { setActiveTab('employment'); setMenuOpen(false) }} className={activeTab === 'employment' ? 'active' : ''}>💼 Employment</a>
          <a href="#financial" onClick={() => { setActiveTab('financial'); setMenuOpen(false) }} className={activeTab === 'financial' ? 'active' : ''}>💰 Financial</a>
          <a href="#faq" onClick={() => { setActiveTab('faq'); setMenuOpen(false) }} className={activeTab === 'faq' ? 'active' : ''}>❓ FAQ</a>
          <button onClick={() => { setProfile(null); setMenuOpen(false) }} style={{ width: "100%", marginTop: "20px", padding: "10px", background: "#D32F2F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>Reset Profile</button>
        </nav>
      </aside>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <main className="chat-container" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>🎖️ PCS Operations Dashboard</h2>
            <div style={{ background: "linear-gradient(135deg," + theme.primary + "20," + theme.accent + "20)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
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
              <div className="info-card">
                <h3>System Features</h3>
                <ul>
                  <li>📊 Real-time readiness tracking</li>
                  <li>✓ Deployment checklist</li>
                  <li>🧠 Mental health resources</li>
                  <li>👨‍👩‍👧‍👦 Family support services</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spouse' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>💛 Deployment Preparation Checklist</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>Complete these tasks to be fully ready for your move.</p>
            
            {Array.from(new Set(tasks.map((t) => t.category))).map((cat) => {
              const catTasks = tasks.filter((t) => t.category === cat);
              return (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 800, color: "#56697C", letterSpacing: ".1em", marginBottom: 8 }}>
                    {cat.toUpperCase()}
                  </h3>
                  {catTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      style={{
                        background: "#FFFFFF",
                        border: `1px solid ${task.completed ? "#D0E8C8" : "#E0E6EE"}`,
                        borderLeft: `3px solid ${task.urgency && !task.completed ? "#D32F2F" : task.completed ? "#0F8A6A" : "#C8A84B"}`,
                        borderRadius: 12,
                        padding: "12px 14px",
                        marginBottom: 8,
                        cursor: "pointer",
                        opacity: task.completed ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${task.completed ? "#0F8A6A" : "#D0DAE8"}`,
                            background: task.completed ? "#0F8A6A" : "transparent",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {task.completed && <span style={{ color: "#FFFFFF", fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1821", textDecoration: task.completed ? "line-through" : "none", marginBottom: 3 }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: 12, color: "#56697C" }}>{task.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'mental' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>🧠 Mental Health Support</h2>
            <div style={{ background: "linear-gradient(135deg,#FFEBEE,#FFCDD2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: "1px solid #EF9A9A" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C62828" }}>🚨 In crisis? Help is available 24/7</div>
            </div>
            {CRISIS_HOTLINES.map((hotline) => (
              <div
                key={hotline.name}
                onClick={() => window.open(`tel:${hotline.phone.replace(/[^0-9]/g, "")}`)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #F0A0A0",
                  borderLeft: "3px solid #D32F2F",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1821", marginBottom: 4 }}>{hotline.name}</div>
                <div style={{ fontSize: 12, color: "#56697C", marginBottom: 6 }}>{hotline.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#D32F2F" }}>{hotline.phone}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'family' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>👨‍👩‍👧‍👦 Family Health Services</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>Healthcare and support for your entire family.</p>
            {[
              { name: "Spouse Mental Health", desc: "Counseling & support for military spouses", icon: "💛" },
              { name: "Child Mental Health", desc: "Therapy for children & adolescents", icon: "👶" },
              { name: "Family Counseling", desc: "Family therapy & adjustment services", icon: "👨‍👩‍👧‍👦" },
              { name: "Pediatric Care", desc: "Children's medical care & preventive", icon: "👼" },
            ].map((service) => (
              <div
                key={service.name}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E6EE",
                  borderLeft: "3px solid " + theme.primary,
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1821" }}>{service.name}</div>
                  <span style={{ fontSize: 18 }}>{service.icon}</span>
                </div>
                <div style={{ fontSize: 12, color: "#56697C" }}>{service.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="tab-content">
            <h2 style={{ color: theme.primary }}>🪖 Veteran-Owned Businesses</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>Support veteran-owned businesses.</p>
            {[...new Set(VETERAN_OWNED.map((v) => v.cat))].map((cat) => {
              const vets = VETERAN_OWNED.filter((v) => v.cat === cat);
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: theme.primary, marginBottom: 6 }}>{cat.toUpperCase()}</h3>
                  {vets.map((vet) => (
                    <a key={vet.name} href={vet.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 8 }}>
                      <div style={{ background: "#FFFFFF", border: `1px solid ${theme.accent}33`, borderLeft: `3px solid ${theme.accent}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0D1821" }}>{vet.name}</div>
                          <span style={{ fontSize: 12 }}>{vet.tag}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#56697C", lineHeight: 1.5, marginBottom: 6 }}>{vet.desc}</div>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "#E8F4F8", color: "#0C5A7E", fontWeight: 700 }}>
                          {vet.service}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="tab-content">
            <h2>💼 Employment & Career Services</h2>
            <p>Hire Heroes USA: Free military employment support</p>
            <div className="info-card">
              <h3>Job Search Resources</h3>
              <ul>
                <li><a href="https://www.hireheroesusa.org" target="_blank">Hire Heroes USA</a> - Free resume and job placement</li>
                <li><a href="https://www.military.com/veteran-jobs" target="_blank">Military.com Jobs</a> - Military job listings</li>
                <li><a href="https://www.va.gov/careers" target="_blank">VA Careers</a> - Government job opportunities</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="tab-content">
            <h2>💰 Financial Planning & Assistance</h2>
            <p>Track and manage your PCS financial benefits and reimbursements.</p>
            <div className="info-card">
              <h3>Military Financial Resources</h3>
              <ul>
                <li><strong>BAH:</strong> Basic Allowance for Housing</li>
                <li><strong>DLA:</strong> Dislocation Allowance</li>
                <li><strong>TLE:</strong> Temporary Lodging Expense</li>
                <li><strong>HHG:</strong> Household Goods shipment coverage</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="tab-content">
            <h2>❓ Frequently Asked Questions</h2>
            <div className="faq">
              <div className="faq-item">
                <h4>How long does a typical PCS move take?</h4>
                <p>From notification to arrival is typically 30-60 days, depending on availability and distance.</p>
              </div>

              <div className="faq-item">
                <h4>What is BAH (Basic Allowance for Housing)?</h4>
                <p>BAH is separate from your salary and covers local housing costs at your new duty station.</p>
              </div>

              <div className="faq-item">
                <h4>Can I refuse a PCS?</h4>
                <p>In most cases, PCS orders are mandatory. Consult your chain of command for specific circumstances.</p>
              </div>

              <div className="faq-item">
                <h4>Are school records automatically transferred?</h4>
                <p>Request official transcripts from the current school. Some states have automatic forwarding agreements.</p>
              </div>

              <div className="faq-item">
                <h4>What OCONUS benefits apply to my move?</h4>
                <p>OCONUS moves qualify for additional allowances. Consult your finance office for location-specific rates.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
