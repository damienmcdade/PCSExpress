import { useState, useEffect, useCallback, useRef } from "react";

// Comprehensive military bases list
const MILITARY_BASES = [
  // Army
  { name: "Fort Liberty", state: "NC", branch: "Army", country: "USA" },
  { name: "Fort Bliss", state: "TX", branch: "Army", country: "USA" },
  { name: "Fort Campbell", state: "KY", branch: "Army", country: "USA" },
  { name: "Fort Carson", state: "CO", branch: "Army", country: "USA" },
  { name: "Fort Drum", state: "NY", branch: "Army", country: "USA" },
  { name: "Fort Hood", state: "TX", branch: "Army", country: "USA" },
  { name: "Fort Irwin", state: "CA", branch: "Army", country: "USA" },
  { name: "Fort Jackson", state: "SC", branch: "Army", country: "USA" },
  { name: "Fort Sill", state: "OK", branch: "Army", country: "USA" },
  { name: "Camp Humphreys", state: "Korea", branch: "Army", country: "South Korea" },
  { name: "Grafenwoehr", state: "Germany", branch: "Army", country: "Germany" },
  { name: "Ramstein", state: "Germany", branch: "Army", country: "Germany" },
  
  // Navy
  { name: "Naval Station Norfolk", state: "VA", branch: "Navy", country: "USA" },
  { name: "Naval Base San Diego", state: "CA", branch: "Navy", country: "USA" },
  { name: "Naval Station Groton", state: "CT", branch: "Navy", country: "USA" },
  { name: "NAS Pensacola", state: "FL", branch: "Navy", country: "USA" },
  { name: "Naval Base Coronado", state: "CA", branch: "Navy", country: "USA" },
  { name: "Naval Base Kitsap", state: "WA", branch: "Navy", country: "USA" },
  { name: "Naval Base Guam", state: "GU", branch: "Navy", country: "USA" },
  { name: "Naval Base Yokosuka", state: "Japan", branch: "Navy", country: "Japan" },
  { name: "Naval Station Bahrain", state: "Bahrain", branch: "Navy", country: "Bahrain" },
  
  // Marine Corps
  { name: "Camp Pendleton", state: "CA", branch: "Marine Corps", country: "USA" },
  { name: "Camp Lejeune", state: "NC", branch: "Marine Corps", country: "USA" },
  { name: "Quantico", state: "VA", branch: "Marine Corps", country: "USA" },
  { name: "MCAS Beaufort", state: "SC", branch: "Marine Corps", country: "USA" },
  { name: "MCAS Miramar", state: "CA", branch: "Marine Corps", country: "USA" },
  { name: "Camp Foster", state: "Japan", branch: "Marine Corps", country: "Japan" },
  { name: "Camp Kinser", state: "Japan", branch: "Marine Corps", country: "Japan" },
  
  // Air Force
  { name: "Lackland AFB", state: "TX", branch: "Air Force", country: "USA" },
  { name: "Nellis AFB", state: "NV", branch: "Air Force", country: "USA" },
  { name: "Luke AFB", state: "AZ", branch: "Air Force", country: "USA" },
  { name: "Ellsworth AFB", state: "SD", branch: "Air Force", country: "USA" },
  { name: "Minot AFB", state: "ND", branch: "Air Force", country: "USA" },
  { name: "Barksdale AFB", state: "LA", branch: "Air Force", country: "USA" },
  { name: "RAF Lakenheath", state: "UK", branch: "Air Force", country: "UK" },
  { name: "RAF Mildenhall", state: "UK", branch: "Air Force", country: "UK" },
  { name: "Ramstein AB", state: "Germany", branch: "Air Force", country: "Germany" },
  { name: "Kunsan AB", state: "Korea", branch: "Air Force", country: "South Korea" },
  { name: "Osan AB", state: "Korea", branch: "Air Force", country: "South Korea" },
  
  // Coast Guard
  { name: "USCG San Diego", state: "CA", branch: "Coast Guard", country: "USA" },
  { name: "USCG Norfolk", state: "VA", branch: "Coast Guard", country: "USA" },
  { name: "USCG Academy", state: "CT", branch: "Coast Guard", country: "USA" },
];

const BRANCH_THEMES = {
  "Army": {
    primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", light: "#F0EDD8",
    text: "#1A2200", subtext: "#5A6E30", name: "Army", abbr: "USA",
  },
  "Navy": {
    primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", light: "#E8ECF8",
    text: "#050E2A", subtext: "#3A4A7A", name: "Navy", abbr: "USN",
  },
  "Marine Corps": {
    primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", light: "#F5E8E8",
    text: "#2A0000", subtext: "#7A2A2A", name: "Marines", abbr: "USMC",
  },
  "Air Force": {
    primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", light: "#E8F2FA",
    text: "#031525", subtext: "#2A4A6A", name: "Air Force", abbr: "USAF",
  },
  "Space Force": {
    primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", light: "#E8EEFA",
    text: "#05051E", subtext: "#3A3A6A", name: "Space Force", abbr: "USSF",
  },
  "Coast Guard": {
    primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", light: "#E8F4FA",
    text: "#001E3A", subtext: "#1A4A6A", name: "Coast Guard", abbr: "USCG",
  },
};

// Branch-specific content
const BRANCH_CONTENT = {
  "Army": {
    s1: "Human Resources (S1)",
    finance: "Finance Office",
    tmo: "Transportation Management Office",
    medical: "MTF (Medical Treatment Facility)",
    housing: "Army Housing",
    terms: { rnltd: "Report Not Later Than Date", tad: "Temporary Additional Duty", dts: "Defense Travel System" },
  },
  "Navy": {
    s1: "Command Career Counselor (CCC)",
    finance: "Navy Finance Center",
    tmo: "Fleet Logistics Center",
    medical: "Naval Medical Clinic",
    housing: "Navy Gateway Inns & Suites",
    terms: { rnltd: "Report No Later Than Date", dity: "Do-It-Yourself Move", bah: "Basic Allowance for Housing" },
  },
  "Marine Corps": {
    s1: "Personnel Office",
    finance: "Marine Corps Finance",
    tmo: "Movement Control Team",
    medical: "Naval Medical Clinic",
    housing: "Base Housing",
    terms: { rnltd: "Report No Later Than Date", pcs: "Permanent Change of Station", sea_duty: "Sea Rotation" },
  },
  "Air Force": {
    s1: "Military Personnel Flight (MPF)",
    finance: "Air Force Finance",
    tmo: "Air Mobility Command",
    medical: "Air Force Clinic",
    housing: "Air Force Housing",
    terms: { rnltd: "Report No Later Than Date", pds: "Permanent Duty Station", aafes: "Armed Forces Exchange Service" },
  },
  "Space Force": {
    s1: "Guardian Personnel Management (GPM)",
    finance: "Space Force Finance",
    tmo: "Space Mobility",
    medical: "Space Force Medical",
    housing: "Space Force Housing",
    terms: { rnltd: "Report No Later Than Date", guardian: "Space Force Member" },
  },
  "Coast Guard": {
    s1: "Personnel Office",
    finance: "Coast Guard Finance Center",
    tmo: "Transportation Logistics",
    medical: "Coast Guard Medical",
    housing: "Coast Guard Housing",
    terms: { rnltd: "Report No Later Than Date", uscg: "U.S. Coast Guard", cg_one: "CG One Portal" },
  },
};

const COMPONENT_TYPES = ["Active Duty", "Reserve", "National Guard", "AGR", "FTNG"];

const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

async function aiCall(system, user) {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, user }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data.text;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

// Insignia SVG
function BranchInsignia({ branch, theme }) {
  const size = 200;
  const color = theme.accent;
  
  const insignias = {
    "Army": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15" fill="none" stroke="${color}" stroke-width="1.5"><circle cx="100" cy="100" r="80"/><polygon points="100,20 115,65 165,65 124,95 138,140 100,110 62,140 76,95 35,65 85,65"/><text x="100" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}" letter-spacing="2">ARMY</text></g></svg>`,
    "Navy": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15" fill="none" stroke="${color}" stroke-width="1.5"><circle cx="100" cy="100" r="80"/><path d="M100,30 L120,70 L165,70 L130,100 L150,140 L100,110 L50,140 L70,100 L35,70 L80,70Z"/><text x="100" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}" letter-spacing="2">NAVY</text></g></svg>`,
    "Marine Corps": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15" fill="none" stroke="${color}" stroke-width="1.5"><circle cx="100" cy="100" r="80"/><ellipse cx="100" cy="100" rx="50" ry="70"/><line x1="70" y1="100" x2="130" y2="100" stroke-width="2"/><text x="100" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}" letter-spacing="1">USMC</text></g></svg>`,
    "Air Force": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15" fill="none" stroke="${color}" stroke-width="1.5"><circle cx="100" cy="100" r="80"/><path d="M30,120 Q100,40 170,80"/><polygon points="100,50 110,80 140,70 100,100 70,70"/><text x="100" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}" letter-spacing="1">USAF</text></g></svg>`,
    "Space Force": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15" fill="none" stroke="${color}" stroke-width="1.5"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="40"/><circle cx="100" cy="60" r="6" fill="${color}"/><circle cx="140" cy="110" r="4" fill="${color}"/><circle cx="60" cy="130" r="5" fill="${color}"/><text x="100" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}" letter-spacing="1">USSF</text></g></svg>`,
    "Coast Guard": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.15" fill="none" stroke="${color}" stroke-width="1.5"><circle cx="100" cy="100" r="80"/><path d="M100,30 L125,80 L175,80 L135,115 L155,165 L100,130 L45,165 L65,115 L25,80 L75,80Z"/><text x="100" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}" letter-spacing="1">USCG</text></g></svg>`,
  };
  
  return <div dangerouslySetInnerHTML={{ __html: insignias[branch] || insignias["Army"] }} style={{ position: "absolute", right: -30, top: -30, width: size, height: size }} />;
}

// Onboarding
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [p, setP] = useState({
    firstName:"", lastName:"", branch:"Army", component:"Active Duty", paygrade:"E-5",
    losingInstallation:"", gainingInstallation:"", departingDate:"", unit:"",
    isOverseas:false, hasDependents:false, hasChildren:false, childAges:[], bedrooms:"3",
  });
  
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const theme = BRANCH_THEMES[p.branch];
  
  const baseSuggestions = search.length > 1 
    ? MILITARY_BASES.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) && 
        b.branch === p.branch
      ).slice(0, 5)
    : [];

  const inputSt = {
    width:"100%", fontSize:14, padding:"10px 12px", borderRadius:8,
    border:`1px solid rgba(255,255,255,0.2)`, background:"rgba(0,0,0,0.2)",
    color:"#FFFFFF", outline:"none", boxSizing:"border-box",
  };

  const canGo1 = p.firstName && p.branch && p.paygrade && p.component;
  const canGo2 = p.losingInstallation && p.gainingInstallation && p.departingDate;

  return (
    <div style={{ minHeight:"100dvh", background:theme.secondary, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <style>{`* {box-sizing:border-box}`}</style>
      <BranchInsignia branch={p.branch} theme={theme} />

      <div style={{ padding:"20px 16px 12px", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:9, letterSpacing:".2em", color:theme.accent, marginBottom:6, fontWeight:800 }}>✦ PCS EXPRESS · {theme.abbr} ✦</div>
        <div style={{ fontSize:20, fontWeight:900, color:"#FFFFFF" }}>Your move,<br/><span style={{ color:theme.accent }}>simplified.</span></div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap:3, paddingBottom:10, zIndex:1 }}>
        {["Profile","Bases","Family"].map((s,i) => (
          <div key={i} style={{ width:6, height:6, borderRadius:"50%", background: i<=step ? theme.accent : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>

      <div style={{ flex:1, padding:"0 12px 16px", overflowY:"auto", zIndex:1 }}>
        <div style={{ background:"rgba(0,0,0,0.3)", backdropFilter:"blur(10px)", borderRadius:14, border:"1px solid rgba(255,255,255,0.1)", padding:"14px 12px" }}>

          {step === 0 && <>
            <div style={{ fontSize:13, fontWeight:800, color:"#FFFFFF", marginBottom:10 }}>Branch & Profile</div>
            
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
                {Object.keys(BRANCH_THEMES).map(b => {
                  const t = BRANCH_THEMES[b];
                  const active = p.branch === b;
                  return (
                    <button key={b} onClick={() => upd("branch", b)} style={{ 
                      padding:"10px 8px", borderRadius:8, border:`2px solid ${active ? t.accent : "rgba(255,255,255,0.15)"}`, 
                      background: active ? t.accent + "30" : "rgba(255,255,255,0.04)", 
                      color: active ? t.accent : "rgba(255,255,255,0.4)", 
                      fontSize:11, fontWeight:active?800:500, cursor:"pointer"
                    }}>
                      {t.abbr}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div><label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>FIRST NAME</label><input value={p.firstName} onChange={e=>upd("firstName",e.target.value)} placeholder="Jordan" style={inputSt} /></div>
              <div><label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>LAST NAME</label><input value={p.lastName} onChange={e=>upd("lastName",e.target.value)} placeholder="Rivera" style={inputSt} /></div>
            </div>

            <div style={{ marginBottom:8 }}>
              <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>COMPONENT</label>
              <select value={p.component} onChange={e=>upd("component",e.target.value)} style={inputSt}>
                {COMPONENT_TYPES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>PAY GRADE</label>
              <select value={p.paygrade} onChange={e=>upd("paygrade",e.target.value)} style={inputSt}>
                {["E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8","E-9","W-1","W-2","O-1","O-2","O-3","O-4","O-5","O-6"].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>

            <button onClick={()=>setStep(1)} disabled={!canGo1} style={{ width:"100%", padding:"10px", borderRadius:8, background:canGo1?theme.accent:"rgba(255,255,255,0.1)", color:canGo1?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:12, fontWeight:900, cursor:canGo1?"pointer":"not-allowed" }}>Continue →</button>
          </>}

          {step === 1 && <>
            <div style={{ fontSize:13, fontWeight:800, color:"#FFFFFF", marginBottom:10 }}>Your Bases</div>

            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>DEPARTING FROM</label>
              <input value={search||p.losingInstallation} onChange={e=>{setSearch(e.target.value);upd("losingInstallation",e.target.value);}} placeholder="Type base..." style={inputSt} />
              {baseSuggestions.length > 0 && (
                <div style={{ marginTop:4, background:"rgba(0,0,0,0.2)", borderRadius:6, maxHeight:120, overflowY:"auto" }}>
                  {baseSuggestions.map(b => (
                    <div key={b.name} onClick={()=>{upd("losingInstallation",b.name);setSearch("");}} style={{ padding:"6px 10px", borderBottom:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontSize:11, color:"rgba(255,255,255,0.7)" }}>
                      {b.name}, {b.state}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>REPORTING TO</label>
              <input value={p.gainingInstallation} onChange={e=>upd("gainingInstallation",e.target.value)} placeholder="Type base..." style={inputSt} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>DEPARTING</label>
                <input type="date" value={p.departingDate} onChange={e=>upd("departingDate",e.target.value)} style={{...inputSt, colorScheme:"dark"}} />
              </div>
              <div>
                <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>UNIT</label>
                <input value={p.unit} onChange={e=>upd("unit",e.target.value)} placeholder="Optional" style={inputSt} />
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setStep(0)} style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:700, cursor:"pointer" }}>←</button>
              <button onClick={()=>setStep(2)} disabled={!canGo2} style={{ flex:1, padding:"10px", borderRadius:8, background:canGo2?theme.accent:"rgba(255,255,255,0.1)", color:canGo2?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:12, fontWeight:900, cursor:canGo2?"pointer":"not-allowed" }}>Continue →</button>
            </div>
          </>}

          {step === 2 && <>
            <div style={{ fontSize:13, fontWeight:800, color:"#FFFFFF", marginBottom:10 }}>Family & Move</div>

            {[
              ["isOverseas", p.isOverseas, "OCONUS / Overseas"],
              ["hasDependents", p.hasDependents, "Spouse / Dependents"],
              ["hasChildren", p.hasChildren, "Children (add ages below)"],
            ].map(([key, val, label]) => (
              <div key={key} onClick={()=>upd(key,!val)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:6, background: val ? `${theme.accent}20` : "rgba(255,255,255,0.04)", border:`1.5px solid ${val ? theme.accent+"66" : "rgba(255,255,255,0.12)"}`, cursor:"pointer" }}>
                <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${val?theme.accent:"rgba(255,255,255,0.25)"}`, background:val?theme.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {val && <svg width="10" height="7" viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1" stroke={theme.secondary} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"#FFFFFF" }}>{label}</div>
              </div>
            ))}

            {p.hasChildren && (
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:8, padding:"10px", marginBottom:10 }}>
                <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:4 }}>CHILDREN AGES</label>
                <input value={p.childAges.join(",")} onChange={e=>upd("childAges",e.target.value.split(",").map(a=>parseInt(a)).filter(a=>!isNaN(a)))} placeholder="e.g. 5, 8, 12" style={inputSt} />
              </div>
            )}

            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:8, fontWeight:700, color:theme.accent, display:"block", marginBottom:3 }}>BEDROOMS</label>
              <select value={p.bedrooms} onChange={e=>upd("bedrooms",e.target.value)} style={inputSt}>
                {["1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setStep(1)} style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:700, cursor:"pointer" }}>←</button>
              <button onClick={()=>onComplete(p)} style={{ flex:1, padding:"10px", borderRadius:8, background:theme.accent, color:theme.secondary, border:"none", fontSize:12, fontWeight:900, cursor:"pointer" }}>Build Plan ✦</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function MainApp({ profile, onReset }) {
  const [screen, setScreen] = useState("home");
  const theme = BRANCH_THEMES[profile.branch];
  const content = BRANCH_CONTENT[profile.branch];

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:"#F3F5F8", fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column", position:"relative" }}>
      <style>{`* {box-sizing:border-box} input,select,button {font-family:inherit}`}</style>
      
      {/* Insignia background */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <BranchInsignia branch={profile.branch} theme={theme} />
      </div>

      <div style={{ background:theme.secondary, color:"#FFFFFF", padding:"12px 14px", position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:".1em", color:theme.accent }}>PCS EXPRESS · {theme.abbr}</div>
            <div style={{ fontSize:12, fontWeight:700, marginTop:3 }}>{profile.firstName}</div>
            <div style={{ fontSize:10, opacity:0.6 }}>{profile.gainingInstallation}</div>
          </div>
          <button onClick={onReset} style={{ fontSize:10, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", color:"#FFFFFF", padding:"4px 10px", borderRadius:6, cursor:"pointer" }}>Reset</button>
        </div>
      </div>

      <div style={{ flex:1, padding:"10px 12px", overflowY:"auto", position:"relative", zIndex:1 }}>
        <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:12, padding:"12px", marginBottom:10 }}>
          {screen === "home" && (
            <div>
              <h2 style={{ fontSize:14, fontWeight:900, color:theme.primary, marginBottom:10 }}>Welcome, {profile.firstName}</h2>
              <p style={{ fontSize:11, color:"#666", marginBottom:12 }}>Departing {new Date(profile.departingDate).toLocaleDateString()} → {profile.gainingInstallation}</p>
              
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { screen: "checklist", icon: "✓", label: "Checklist" },
                  { screen: "schools", icon: "🎓", label: "Schools" },
                  { screen: "resources", icon: "◉", label: "Resources" },
                  { screen: "ask", icon: "?", label: "Ask AI" },
                ].map(tab => (
                  <button key={tab.screen} onClick={() => setScreen(tab.screen)} style={{ padding:"12px 10px", background:theme.primary, color:"#FFFFFF", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{tab.icon}</div>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {screen === "checklist" && (
            <div>
              <h2 style={{ fontSize:13, fontWeight:900, color:theme.primary, marginBottom:8 }}>PCS Checklist</h2>
              <p style={{ fontSize:11, color:"#666" }}>Contact {content.s1} first. All tasks tailored to your {profile.branch}.</p>
              <div style={{ marginTop:10, fontSize:11, color:theme.primary }}>✓ Tasks loading...</div>
            </div>
          )}

          {screen === "schools" && (
            <div>
              <h2 style={{ fontSize:13, fontWeight:900, color:theme.primary, marginBottom:8 }}>Schools at {profile.gainingInstallation}</h2>
              {profile.childAges.length === 0 ? (
                <p style={{ fontSize:11, color:"#666" }}>No children ages entered.</p>
              ) : (
                <div style={{ fontSize:11, color:theme.primary }}>
                  🔍 Finding school districts for ages: {profile.childAges.join(", ")}
                </div>
              )}
            </div>
          )}

          {screen === "resources" && (
            <div>
              <h2 style={{ fontSize:13, fontWeight:900, color:theme.primary, marginBottom:8 }}>{profile.branch} Resources</h2>
              <div style={{ display:"grid", gap:8, fontSize:11 }}>
                <div style={{ padding:"10px", background:theme.light, borderRadius:8, fontWeight:700, color:theme.primary }}>
                  → {content.s1}
                </div>
                <div style={{ padding:"10px", background:theme.light, borderRadius:8, fontWeight:700, color:theme.primary }}>
                  → {content.finance}
                </div>
                <div style={{ padding:"10px", background:theme.light, borderRadius:8, fontWeight:700, color:theme.primary }}>
                  → {content.tmo}
                </div>
              </div>
            </div>
          )}

          {screen === "ask" && (
            <div>
              <h2 style={{ fontSize:13, fontWeight:900, color:theme.primary, marginBottom:8 }}>Ask PCS Express</h2>
              <input type="text" placeholder="Ask about housing, schools, finance..." style={{ width:"100%", padding:"8px", borderRadius:8, border:`1px solid ${theme.accent}`, marginBottom:8, fontSize:11 }} />
              <button style={{ width:"100%", padding:"8px", background:theme.primary, color:"#FFFFFF", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }}>Send</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:"flex", gap:6, padding:"8px 12px", background:"#FFFFFF", borderTop:`2px solid ${theme.primary}`, position:"relative", zIndex:2 }}>
        {[{id:"home",icon:"◈"},{id:"checklist",icon:"✓"},{id:"schools",icon:"🎓"},{id:"resources",icon:"◉"},{id:"ask",icon:"?"}].map(tab => (
          <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{ flex:1, padding:"6px", background:screen===tab.id?theme.primary:"#F0F0F0", color:screen===tab.id?"#FFFFFF":theme.primary, border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:screen===tab.id?800:500 }}>
            {tab.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() => store.get("pcs_profile"));

  if (!profile) {
    return <Onboarding onComplete={p => {setProfile(p); store.set("pcs_profile", p);}} />;
  }

  return <MainApp profile={profile} onReset={() => {setProfile(null); store.set("pcs_profile", null);}} />;
}
