import { useState, useEffect } from 'react'
import './App.css'
import EmploymentModule from './components/EmploymentModule'
import NavigationModule from './components/NavigationModule'
import EducationModule from './components/EducationModule'
import TranslationModule from './components/TranslationModule'
import ReligiousServicesModule from './components/ReligiousServicesModule'
import SpouseDeploymentGuide from './components/SpouseDeploymentGuide'

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const BRANCH_THEMES = {
  Army: { primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B" },
  Navy: { primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B" },
  "Marine Corps": { primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B" },
  "Air Force": { primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8" },
  "Space Force": { primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0" },
  "Coast Guard": { primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00" },
};

const MILITARY_DUTY_STATIONS = [
  { name: "Fort Liberty", state: "NC", branch: "Army" },
  { name: "Fort Jackson", state: "SC", branch: "Army" },
  { name: "Naval Station Norfolk", state: "VA", branch: "Navy" },
  { name: "Camp Pendleton", state: "CA", branch: "Marine Corps" },
  { name: "Joint Base Andrews", state: "MD", branch: "Air Force" },
  { name: "Ramstein Air Base", state: "Germany", branch: "Air Force", country: "Germany" },
];

const SCHOOL_DISTRICTS = {
  'Fort Liberty NC': { name: 'Cumberland County Schools', ages: 'K-12', rating: 4.5 },
  'Naval Station Norfolk VA': { name: 'Norfolk Public Schools', ages: 'K-12', rating: 4.3 },
  'Camp Pendleton CA': { name: 'Oceanside Unified', ages: 'K-12', rating: 4.6 },
};

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    firstName: '',
    branch: 'Army',
    paygrade: 'E-5',
    departingDate: '',
    gainingInstallation: '',
    isOverseas: false,
    language: 'English',
    religion: 'Christian',
    childrenAges: '',
    hasDependents: false,
  });

  const theme = BRANCH_THEMES[p.branch];

  return (
    <div style={{ minHeight: '100vh', background: theme.secondary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui' }}>
      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>PCS Express</div>
        <div style={{ fontSize: 12, color: theme.accent, marginTop: 4 }}>Your move, simplified</div>
      </div>

      <div style={{ flex: 1, padding: '0 16px 20px' }}>
        <div style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', padding: '20px 16px' }}>
          {step === 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Select Your Branch</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {Object.keys(BRANCH_THEMES).map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setP({ ...p, branch })}
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      border: `2px solid ${p.branch === branch ? BRANCH_THEMES[branch].accent : 'rgba(255,255,255,0.2)'}`,
                      background: p.branch === branch ? `${BRANCH_THEMES[branch].accent}30` : 'rgba(0,0,0,0.2)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    {branch}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="First name"
                value={p.firstName}
                onChange={(e) => setP({ ...p, firstName: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 10, outline: 'none', fontSize: 14 }}
              />

              <select value={p.paygrade} onChange={(e) => setP({ ...p, paygrade: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 10, outline: 'none', fontSize: 14 }}>
                {['E-1', 'E-5', 'E-7', 'O-3', 'O-5'].map(g => <option key={g}>{g}</option>)}
              </select>

              <button onClick={() => setStep(1)} style={{ width: '100%', padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>
                Continue →
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Your Move Details</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>DEPARTING DATE</label>
              <input type="date" value={p.departingDate} onChange={(e) => setP({ ...p, departingDate: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', colorScheme: 'dark', fontSize: 14 }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>GAINING INSTALLATION</label>
              <select value={p.gainingInstallation} onChange={(e) => {
                const sel = MILITARY_DUTY_STATIONS.find(s => s.name === e.target.value);
                setP({ ...p, gainingInstallation: e.target.value, isOverseas: sel?.country ? true : false });
              }} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }}>
                <option value="">Select base...</option>
                {MILITARY_DUTY_STATIONS.map(s => <option key={s.name} value={`${s.name}, ${s.state}`}>{s.name} ({s.branch})</option>)}
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>Next →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Language & Religion</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>PREFERRED LANGUAGE</label>
              <select value={p.language} onChange={(e) => setP({ ...p, language: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }}>
                {['English', 'Spanish', 'German', 'Korean', 'Japanese'].map(l => <option key={l}>{l}</option>)}
              </select>

              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>RELIGIOUS PREFERENCE</label>
              <select value={p.religion} onChange={(e) => setP({ ...p, religion: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }}>
                {['Christian', 'Catholic', 'Jewish', 'Islamic', 'Buddhist', 'Hindu', 'Other', 'Prefer not to say'].map(r => <option key={r}>{r}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>Next →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Family Information</div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={p.hasDependents} onChange={(e) => setP({ ...p, hasDependents: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12 }}>I have dependents/children</span>
              </label>

              {p.hasDependents && (
                <>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>CHILDREN'S AGES (comma-separated)</label>
                  <input type="text" placeholder="e.g., 5, 8, 12" value={p.childrenAges} onChange={(e) => setP({ ...p, childrenAges: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: '#FFFFFF', marginBottom: 16, outline: 'none', fontSize: 14 }} />
                </>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                <button onClick={() => onComplete(p)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>Start ✦</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState(() => store.get('pcs_profile'));
  const [activeTab, setActiveTab] = useState('home');
  const [expandedSection, setExpandedSection] = useState(null);

  const theme = profile ? BRANCH_THEMES[profile.branch] : BRANCH_THEMES.Army;
  const progress = profile ? Math.round(Math.random() * 100) : 0; // Calculate from tasks in real app

  if (!profile) {
    return <Onboarding onComplete={(p) => { setProfile(p); store.set('pcs_profile', p); }} />;
  }

  const BOTTOM_NAV = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'checklist', label: 'Checklist', icon: '✓' },
    { id: 'employment', label: 'Work', icon: '💼' },
    { id: 'education', label: 'Schools', icon: '🎓' },
    { id: 'nav', label: 'Map', icon: '🗺️' },
    { id: 'spouse', label: 'Spouse', icon: '💛' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'religion', label: 'Faith', icon: '✝️' },
  ];

  if (profile.isOverseas && activeTab === 'translation') {
    return <TranslationModule theme={theme} profile={profile} />;
  }

  const RESOURCES = [
    { title: 'Military OneSource', desc: '8 free counseling sessions', action: () => window.open('tel:1-800-342-9647') },
    { title: 'VA Benefits', desc: 'Healthcare and support', action: () => window.open('https://www.va.gov') },
    { title: 'Family Readiness', desc: 'Local support groups', action: () => alert('Connect with your unit FRG for local groups') },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: '#f0f4f8', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ background: theme.secondary, padding: '12px 16px', sticky: 'top', zIndex: 100, borderBottom: `1px solid ${theme.accent}30` }}>
        <div style={{ fontSize: 10, letterSpacing: '.1em', color: theme.accent, fontWeight: 800, marginBottom: 6 }}>✦ PCS EXPRESS ✦</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{profile.firstName}</div>
          <button onClick={() => { setProfile(null); store.set('pcs_profile', null); }} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: theme.accent, transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Readiness: {progress}%</div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 70 }}>
        {activeTab === 'home' && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821', marginBottom: 12 }}>Welcome Back</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '📝', label: 'Checklist', count: '8/20' },
                { icon: '💼', label: 'Employment', count: 'Ready' },
                { icon: '🎓', label: 'Schools', count: '3 nearby' },
                { icon: '🏥', label: 'Health', count: 'Setup' },
              ].map((item) => (
                <div key={item.label} onClick={() => setActiveTab(item.label.toLowerCase().replace(/\s/g, ''))} style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '14px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: theme.primary, fontWeight: 700 }}>{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'employment' && <EmploymentModule theme={theme} profile={profile} />}
        {activeTab === 'nav' && <NavigationModule theme={theme} profile={profile} />}
        {activeTab === 'education' && <EducationModule theme={theme} profile={profile} />}
        {activeTab === 'spouse' && <SpouseDeploymentGuide theme={theme} profile={profile} />}
        {activeTab === 'religion' && <ReligiousServicesModule theme={theme} profile={profile} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #E0E6EE', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'fixed', bottom: 0, width: '100%', maxWidth: 480, margin: '0 auto', left: '50%', transform: 'translateX(-50%)' }}>
        {BOTTOM_NAV.slice(0, 4).map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 10, color: activeTab === item.id ? theme.primary : '#9AAABB', fontWeight: activeTab === item.id ? 800 : 500 }}>
            <div style={{ fontSize: 18 }}>{item.icon}</div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
