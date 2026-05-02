import { useState, useEffect, useCallback, useRef } from "react";

// Comprehensive military bases list (US + Overseas)
const MILITARY_BASES = [
  // Army Bases
  { name: "Fort Liberty", abbr: "Fort Liberty", state: "NC", branch: "Army", country: "USA" },
  { name: "Fort Bliss", abbr: "Fort Bliss", state: "TX", branch: "Army", country: "USA" },
  { name: "Fort Hood", abbr: "Fort Cavazos", state: "TX", branch: "Army", country: "USA" },
  { name: "Fort Campbell", abbr: "Fort Campbell", state: "KY", branch: "Army", country: "USA" },
  { name: "Fort Benning", abbr: "Fort Moore", state: "GA", branch: "Army", country: "USA" },
  { name: "Fort Jackson", abbr: "Fort Jackson", state: "SC", branch: "Army", country: "USA" },
  { name: "Fort Leonard Wood", abbr: "Fort Leonard Wood", state: "MO", branch: "Army", country: "USA" },
  { name: "Fort Sill", abbr: "Fort Sill", state: "OK", branch: "Army", country: "USA" },
  { name: "Fort Carson", abbr: "Fort Carson", state: "CO", branch: "Army", country: "USA" },
  { name: "Fort Drum", abbr: "Fort Drum", state: "NY", branch: "Army", country: "USA" },
  { name: "Fort Bragg", abbr: "Fort Liberty", state: "NC", branch: "Army", country: "USA" },
  { name: "Fort Irwin", abbr: "Fort Irwin", state: "CA", branch: "Army", country: "USA" },
  { name: "Fort Riley", abbr: "Fort Riley", state: "KS", branch: "Army", country: "USA" },
  { name: "Fort Huachuca", abbr: "Fort Huachuca", state: "AZ", branch: "Army", country: "USA" },
  { name: "Fort Polk", abbr: "Fort Johnson", state: "LA", branch: "Army", country: "USA" },
  { name: "Fort Sam Houston", abbr: "Fort Sam Houston", state: "TX", branch: "Army", country: "USA" },
  { name: "Fort Wainwright", abbr: "Fort Wainwright", state: "AK", branch: "Army", country: "USA" },
  { name: "Fort Richardson", abbr: "Joint Base Elmendorf-Richardson", state: "AK", branch: "Army", country: "USA" },
  { name: "Fort Shafter", abbr: "Fort Shafter", state: "HI", branch: "Army", country: "USA" },
  { name: "Schofield Barracks", abbr: "Schofield Barracks", state: "HI", branch: "Army", country: "USA" },
  { name: "Honshu Island (Japan)", abbr: "Camp Zama", state: "Japan", branch: "Army", country: "Japan" },
  { name: "Kadena Air Base (Japan)", abbr: "Kadena", state: "Japan", branch: "Army", country: "Japan" },
  { name: "Camp Humphreys", abbr: "Camp Humphreys", state: "South Korea", branch: "Army", country: "South Korea" },
  { name: "Ramstein Air Base", abbr: "Ramstein", state: "Germany", branch: "Army", country: "Germany" },
  { name: "Grafenwoehr", abbr: "Grafenwoehr", state: "Germany", branch: "Army", country: "Germany" },
  
  // Navy Bases
  { name: "Naval Station San Diego", abbr: "NAS San Diego", state: "CA", branch: "Navy", country: "USA" },
  { name: "Naval Station Norfolk", abbr: "NAS Norfolk", state: "VA", branch: "Navy", country: "USA" },
  { name: "Naval Base San Diego", abbr: "NAB San Diego", state: "CA", branch: "Navy", country: "USA" },
  { name: "Naval Air Station Pensacola", abbr: "NAS Pensacola", state: "FL", branch: "Navy", country: "USA" },
  { name: "Naval Station Groton", abbr: "NAS Groton", state: "CT", branch: "Navy", country: "USA" },
  { name: "Naval Base Coronado", abbr: "NAB Coronado", state: "CA", branch: "Navy", country: "USA" },
  { name: "Naval Base Kitsap", abbr: "NAB Kitsap", state: "WA", branch: "Navy", country: "USA" },
  { name: "Naval Base Guam", abbr: "NAB Guam", state: "GU", branch: "Navy", country: "USA" },
  { name: "Naval Station Bahrain", abbr: "NS Bahrain", state: "Bahrain", branch: "Navy", country: "Bahrain" },
  { name: "Naval Base Yokosuka", abbr: "NAB Yokosuka", state: "Japan", branch: "Navy", country: "Japan" },
  
  // Marine Corps Bases
  { name: "Camp Pendleton", abbr: "Camp Pendleton", state: "CA", branch: "Marine Corps", country: "USA" },
  { name: "Camp Lejeune", abbr: "Camp Lejeune", state: "NC", branch: "Marine Corps", country: "USA" },
  { name: "Quantico Marine Corps Base", abbr: "Quantico", state: "VA", branch: "Marine Corps", country: "USA" },
  { name: "Camp Geiger", abbr: "Camp Geiger", state: "NC", branch: "Marine Corps", country: "USA" },
  { name: "Okinawa (Camp Foster)", abbr: "Camp Foster", state: "Japan", branch: "Marine Corps", country: "Japan" },
  { name: "Camp Kinser", abbr: "Camp Kinser", state: "Japan", branch: "Marine Corps", country: "Japan" },
  { name: "Miramar Air Station", abbr: "MCAS Miramar", state: "CA", branch: "Marine Corps", country: "USA" },
  { name: "Beaufort Air Station", abbr: "MCAS Beaufort", state: "SC", branch: "Marine Corps", country: "USA" },
  { name: "Lejeune Air Station", abbr: "MCAS Lejeune", state: "NC", branch: "Marine Corps", country: "USA" },
  
  // Air Force Bases
  { name: "Lackland Air Force Base", abbr: "Lackland AFB", state: "TX", branch: "Air Force", country: "USA" },
  { name: "Nellis Air Force Base", abbr: "Nellis AFB", state: "NV", branch: "Air Force", country: "USA" },
  { name: "Luke Air Force Base", abbr: "Luke AFB", state: "AZ", branch: "Air Force", country: "USA" },
  { name: "Kunsan Air Base", abbr: "Kunsan AB", state: "South Korea", branch: "Air Force", country: "South Korea" },
  { name: "Osan Air Base", abbr: "Osan AB", state: "South Korea", branch: "Air Force", country: "South Korea" },
  { name: "Ramstein Air Base", abbr: "Ramstein AB", state: "Germany", branch: "Air Force", country: "Germany" },
  { name: "Spangdahlem Air Base", abbr: "Spangdahlem AB", state: "Germany", branch: "Air Force", country: "Germany" },
  { name: "RAF Lakenheath", abbr: "RAF Lakenheath", state: "UK", branch: "Air Force", country: "UK" },
  { name: "RAF Mildenhall", abbr: "RAF Mildenhall", state: "UK", branch: "Air Force", country: "UK" },
  { name: "Incirlik Air Base", abbr: "Incirlik AB", state: "Turkey", branch: "Air Force", country: "Turkey" },
  { name: "Al Dhafra Air Base", abbr: "Al Dhafra AB", state: "UAE", branch: "Air Force", country: "UAE" },
  { name: "Ellsworth Air Force Base", abbr: "Ellsworth AFB", state: "SD", branch: "Air Force", country: "USA" },
  { name: "Minot Air Force Base", abbr: "Minot AFB", state: "ND", branch: "Air Force", country: "USA" },
  { name: "Barksdale Air Force Base", abbr: "Barksdale AFB", state: "LA", branch: "Air Force", country: "USA" },
  
  // Space Force Bases
  { name: "Joint Base San Antonio-Lackland", abbr: "JBSA-Lackland", state: "TX", branch: "Space Force", country: "USA" },
  { name: "Buckley Space Force Base", abbr: "Buckley SFB", state: "CO", branch: "Space Force", country: "USA" },
  
  // Coast Guard Bases
  { name: "Coast Guard Base San Diego", abbr: "CG San Diego", state: "CA", branch: "Coast Guard", country: "USA" },
  { name: "Coast Guard Base Norfolk", abbr: "CG Norfolk", state: "VA", branch: "Coast Guard", country: "USA" },
  { name: "Coast Guard Academy", abbr: "CG Academy", state: "CT", branch: "Coast Guard", country: "USA" },
];

// ─── BRANCH THEMES ────────────────────────────────────────────────────────────
const BRANCH_THEMES = {
  "Army": {
    primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", light: "#F0EDD8",
    text: "#1A2200", subtext: "#5A6E30", badge: "#6B8040", badgeText: "#FFFFFF",
    name: "Army", abbr: "USA",
  },
  "Navy": {
    primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", light: "#E8ECF8",
    text: "#050E2A", subtext: "#3A4A7A", badge: "#2A3A7A", badgeText: "#FFFFFF",
    name: "Navy", abbr: "USN",
  },
  "Marine Corps": {
    primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", light: "#F5E8E8",
    text: "#2A0000", subtext: "#7A2A2A", badge: "#9B1010", badgeText: "#FFFFFF",
    name: "Marines", abbr: "USMC",
  },
  "Air Force": {
    primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", light: "#E8F2FA",
    text: "#031525", subtext: "#2A4A6A", badge: "#2060A0", badgeText: "#FFFFFF",
    name: "Air Force", abbr: "USAF",
  },
  "Space Force": {
    primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", light: "#E8EEFA",
    text: "#05051E", subtext: "#3A3A6A", badge: "#2A2A6A", badgeText: "#C8D8F0",
    name: "Space Force", abbr: "USSF",
  },
  "Coast Guard": {
    primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", light: "#E8F4FA",
    text: "#001E3A", subtext: "#1A4A6A", badge: "#0070A0", badgeText: "#FFFFFF",
    name: "Coast Guard", abbr: "USCG",
  },
};

const COMPONENT_TYPES = ["Active Duty", "Reserve", "National Guard", "AGR (Active Guard & Reserve)", "Full-Time National Guard (FTNG)"];

const COMPONENT_INFO = {
  "Active Duty": "Full-time military service. All PCS entitlements apply.",
  "Reserve": "Part-time service. PCS orders less common. Verify entitlements with your unit.",
  "National Guard": "State-controlled. Title 10 vs Title 32 orders affect entitlements.",
  "AGR (Active Guard & Reserve)": "Full-time support. Same benefits as Active Duty.",
  "Full-Time National Guard (FTNG)": "State employee. Entitlements vary by state.",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const addDays = (base, d) => { const r = new Date(base); r.setDate(r.getDate() + d); return r; };
const fmtDate = d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const daysUntil = t => Math.round((new Date(t) - new Date()) / 86400000);
const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

async function aiCall(system, user) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data.text;
}

function buildTasks(departingDate, isOverseas, hasChildren) {
  const r = new Date(departingDate);
  const raw = [
    { id:"orders",    daysB:180, phase:"180+ days", cat:"Admin",    urgent:true,  title:"Receive & verify PCS orders",           detail:"Check all fields: date, installations, dependent travel. Errors must be corrected now.", office:"S1 / Personnel", contact:"Unit S1" },
    { id:"deers",     daysB:175, phase:"180+ days", cat:"Admin",    urgent:false, title:"Update DEERS & dependent info",         detail:"All dependents must be listed before travel orders.", office:"RAPIDS site", contact:"rapids.dmdc.osd.mil" },
    { id:"fin_brief", daysB:160, phase:"180+ days", cat:"Finance",  urgent:false, title:"Attend PCS finance briefing",           detail:"Understand DPS, travel pay, advance pay options.", office:"Finance office", contact:"On-post finance" },
    { id:"tmo_init",  daysB:150, phase:"180+ days", cat:"Move",     urgent:true,  title:"Create DPS account & book shipment",    detail:"Log into move.mil. Book early — pickup windows fill fast.", office:"TMO", contact:"move.mil" },
    { id:"hsg_ntc",   daysB:150, phase:"180+ days", cat:"Housing",  urgent:true,  title:"Submit housing vacate notice",          detail:"30–60 day notice required.", office:"Housing office", contact:"Installation housing" },
    { id:"med_rec",   daysB:145, phase:"180+ days", cat:"Medical",  urgent:false, title:"Request medical & dental records",      detail:"Hard copies for every family member.", office:"MTF medical records", contact:"On-post MTF" },
    { id:"school",    daysB:140, phase:"180+ days", cat:"Family",   urgent:false, title:"Request children's school records",     detail:"Transcripts, IEP docs, immunization records.", office:"School Liaison Office", contact:"Installation SLO", childOnly:true },
    { id:"passport",  daysB:120, phase:"90–120 days", cat:"Admin",  urgent:true,  title:"Apply for no-fee passports",           detail:"OCONUS required. Allow 8–10 weeks.", office:"Legal / Passport office", contact:"Installation legal", overseasOnly:true },
    { id:"hotel",     daysB:90,  phase:"90–120 days", cat:"Lodging", urgent:true, title:"Reserve TLF / backup hotel",           detail:"TLE covers up to 10 days.", office:"Billeting", contact:"Installation lodging" },
    { id:"sponsor",   daysB:90,  phase:"90–120 days", cat:"Admin",  urgent:false, title:"Contact gaining unit sponsor",         detail:"Your gaining unit should assign one.", office:"Gaining unit orderly room", contact:"Gaining S1" },
    { id:"poa",       daysB:60,  phase:"60 days",     cat:"Legal",  urgent:false, title:"Get General Power of Attorney",        detail:"Free through installation legal.", office:"JAG / Legal", contact:"Installation legal" },
    { id:"addr",      daysB:30,  phase:"30 days",     cat:"Admin",  urgent:true,  title:"Submit change of address",             detail:"USPS, DFAS, bank, VA, insurance.", office:"Online / self", contact:"usps.com/move" },
    { id:"hsg_insp",  daysB:30,  phase:"30 days",     cat:"Housing", urgent:true, title:"Schedule final housing inspection",    detail:"Book early — slots fill fast.", office:"Housing office", contact:"Installation housing" },
    { id:"clean",     daysB:28,  phase:"30 days",     cat:"Housing", urgent:true, title:"Book professional cleaning service",   detail:"1–2 weeks before inspection.", office:"Cleaning service", contact:"Google '[city] military PCS cleaning'" },
    { id:"outproc",   daysB:14,  phase:"Final 2 wks", cat:"Admin",  urgent:true,  title:"Begin formal out-processing",          detail:"Packet from S1. Visit all required offices.", office:"S1 / Orderly room", contact:"Unit S1" },
    { id:"hhg_conf",  daysB:14,  phase:"Final 2 wks", cat:"Move",   urgent:true,  title:"Confirm HHG pickup with TMO",          detail:"Be present or have POA rep.", office:"TMO", contact:"move.mil" },
    { id:"fin_clr",   daysB:7,   phase:"Final 2 wks", cat:"Finance", urgent:true, title:"Clear finance & submit travel voucher",detail:"File DD Form 1351-2. Claim expenses.", office:"Finance office", contact:"Installation finance" },
    { id:"hsg_fin",   daysB:7,   phase:"Final 2 wks", cat:"Housing", urgent:true, title:"Final housing inspection",             detail:"Have receipt and checklist ready.", office:"Housing", contact:"Installation housing" },
  ];
  return raw
    .filter(t => !(t.overseasOnly && !isOverseas) && !(t.childOnly && !hasChildren))
    .map(t => ({ ...t, dueDate: addDays(r, -t.daysB), done: false }))
    .sort((a, b) => a.dueDate - b.dueDate);
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [p, setP] = useState({
    firstName:"", lastName:"", branch:"Army", component:"Active Duty", paygrade:"E-5",
    losingInstallation:"", gainingInstallation:"", departingDate:"", unit:"",
    isOverseas:false, hasDependents:false, hasChildren:false, childAges:[], bedrooms:"3",
  });
  
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const theme = BRANCH_THEMES[p.branch] || BRANCH_THEMES["Army"];
  
  // Filter bases by search and branch
  const baseSuggestions = search.length > 1 
    ? MILITARY_BASES.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) && 
        (b.branch === p.branch || b.branch === "All")
      ).slice(0, 5)
    : [];

  const inputSt = {
    width:"100%", fontSize:14, padding:"10px 12px", borderRadius:10,
    border:`1px solid rgba(255,255,255,0.15)`, background:"rgba(0,0,0,0.25)",
    color:"#FFFFFF", outline:"none", boxSizing:"border-box", WebkitAppearance:"none",
    fontFamily:"inherit",
  };

  const canGo1 = p.firstName && p.branch && p.paygrade && p.component;
  const canGo2 = p.losingInstallation && p.gainingInstallation && p.departingDate;

  return (
    <div style={{ minHeight:"100dvh", background:theme.secondary, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} * {box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ padding:"24px 20px 16px", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:10, letterSpacing:".22em", color:theme.accent, marginBottom:8, fontWeight:800 }}>✦ PCS EXPRESS ✦</div>
        <div style={{ fontSize:24, fontWeight:900, color:"#FFFFFF", letterSpacing:"-.01em" }}>Your move,<br/><span style={{ color:theme.accent }}>simplified.</span></div>
      </div>

      {/* Step dots - compact */}
      <div style={{ display:"flex", justifyContent:"center", gap:4, paddingBottom:12, zIndex:1 }}>
        {["Profile","Bases","Family"].map((s,i) => (
          <div key={i} style={{ width:8, height:8, borderRadius:"50%", background: i<=step ? theme.accent : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>

      {/* Form - compact */}
      <div style={{ flex:1, padding:"0 14px 20px", position:"relative", zIndex:1, overflowY:"auto" }}>
        <div style={{ background:"rgba(0,0,0,0.35)", backdropFilter:"blur(10px)", borderRadius:16, border:"1px solid rgba(255,255,255,0.12)", padding:"16px 14px" }}>

          {step === 0 && <>
            <div style={{ fontSize:14, fontWeight:800, color:"#FFFFFF", marginBottom:12 }}>About you</div>
            
            {/* Branch selector - LARGE & PROMINENT */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:8, letterSpacing:".1em" }}>BRANCH</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {Object.keys(BRANCH_THEMES).map(b => {
                  const t = BRANCH_THEMES[b];
                  const active = p.branch === b;
                  return (
                    <button key={b} onClick={() => upd("branch", b)} style={{ 
                      padding:"14px", borderRadius:12, border:`2px solid ${active ? t.accent : "rgba(255,255,255,0.15)"}`, 
                      background: active ? t.accent + "30" : "rgba(255,255,255,0.05)", 
                      color: active ? t.accent : "rgba(255,255,255,0.5)", 
                      fontSize:13, fontWeight:active?800:500, cursor:"pointer", transition:"all .2s"
                    }}>
                      {t.abbr}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>FIRST NAME</label><input value={p.firstName} onChange={e=>upd("firstName",e.target.value)} placeholder="Jordan" style={inputSt} /></div>
              <div><label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>LAST NAME</label><input value={p.lastName} onChange={e=>upd("lastName",e.target.value)} placeholder="Rivera" style={inputSt} /></div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>COMPONENT</label>
              <select value={p.component} onChange={e=>upd("component",e.target.value)} style={inputSt}>
                {COMPONENT_TYPES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>PAY GRADE</label>
              <select value={p.paygrade} onChange={e=>upd("paygrade",e.target.value)} style={inputSt}>
                {["E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8","E-9","W-1","W-2","W-3","W-4","W-5","O-1","O-2","O-3","O-4","O-5","O-6"].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>

            <button onClick={()=>setStep(1)} disabled={!canGo1} style={{ width:"100%", padding:"12px", borderRadius:10, background:canGo1?theme.accent:"rgba(255,255,255,0.1)", color:canGo1?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:14, fontWeight:900, cursor:canGo1?"pointer":"not-allowed" }}>Continue →</button>
          </>}

          {step === 1 && <>
            <div style={{ fontSize:14, fontWeight:800, color:"#FFFFFF", marginBottom:12 }}>Your bases</div>

            {/* Base autofill search */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>DEPARTING FROM</label>
              <input value={search||p.losingInstallation} onChange={e=>{setSearch(e.target.value);upd("losingInstallation",e.target.value);}} placeholder="Type base name..." style={inputSt} />
              {baseSuggestions.length > 0 && (
                <div style={{ marginTop:6, background:"rgba(0,0,0,0.25)", borderRadius:8, overflow:"hidden" }}>
                  {baseSuggestions.map(b => (
                    <div key={b.name} onClick={()=>{upd("losingInstallation",b.name);setSearch("");}} style={{ padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.8)" }}>
                      {b.name} {b.state && `· ${b.state}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>REPORTING TO</label>
              <input value={p.gainingInstallation} onChange={e=>upd("gainingInstallation",e.target.value)} placeholder="Type base name..." style={inputSt} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>DEPARTING</label>
                <input type="date" value={p.departingDate} onChange={e=>upd("departingDate",e.target.value)} style={{...inputSt, colorScheme:"dark"}} />
              </div>
              <div>
                <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>UNIT / MOS</label>
                <input value={p.unit} onChange={e=>upd("unit",e.target.value)} placeholder="Optional" style={inputSt} />
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(0)} style={{ padding:"12px 16px", borderRadius:10, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.15)", fontSize:13, fontWeight:700, cursor:"pointer" }}>←</button>
              <button onClick={()=>setStep(2)} disabled={!canGo2} style={{ flex:1, padding:"12px", borderRadius:10, background:canGo2?theme.accent:"rgba(255,255,255,0.1)", color:canGo2?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:14, fontWeight:900, cursor:canGo2?"pointer":"not-allowed" }}>Continue →</button>
            </div>
          </>}

          {step === 2 && <>
            <div style={{ fontSize:14, fontWeight:800, color:"#FFFFFF", marginBottom:12 }}>Family & move</div>

            {[
              ["isOverseas",    p.isOverseas,    "OCONUS / overseas",  ""],
              ["hasVehicle",    true,            "Shipping vehicle",   ""],
              ["hasDependents", p.hasDependents, "Spouse / dependents",""],
              ["hasChildren",   p.hasChildren,   "Children",           "Enter ages below"],
            ].map(([key, val, label, sub]) => (
              <div key={key} onClick={()=>upd(key,!val)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, marginBottom:8, background: val ? `${theme.accent}20` : "rgba(255,255,255,0.04)", border:`1.5px solid ${val ? theme.accent+"66" : "rgba(255,255,255,0.12)"}`, cursor:"pointer" }}>
                <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${val?theme.accent:"rgba(255,255,255,0.25)"}`, background:val?theme.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {val && <svg width="11" height="8" viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1" stroke={theme.secondary} strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#FFFFFF" }}>{label}</div>
                  {sub && <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{sub}</div>}
                </div>
              </div>
            ))}

            {p.hasChildren && (
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"12px", marginBottom:12 }}>
                <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:6, letterSpacing:".08em" }}>CHILDREN AGES (comma-separated)</label>
                <input value={p.childAges.join(",")} onChange={e=>upd("childAges",e.target.value.split(",").map(a=>parseInt(a)).filter(a=>!isNaN(a)))} placeholder="e.g. 5, 8, 12" style={inputSt} />
              </div>
            )}

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:9, fontWeight:700, color:theme.accent, display:"block", marginBottom:4, letterSpacing:".08em" }}>BEDROOMS NEEDED</label>
              <select value={p.bedrooms} onChange={e=>upd("bedrooms",e.target.value)} style={inputSt}>
                {["1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(1)} style={{ padding:"12px 16px", borderRadius:10, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.15)", fontSize:13, fontWeight:700, cursor:"pointer" }}>←</button>
              <button onClick={()=>onComplete(p)} style={{ flex:1, padding:"12px", borderRadius:10, background:theme.accent, color:theme.secondary, border:"none", fontSize:14, fontWeight:900, cursor:"pointer" }}>Build my PCS plan ✦</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// Placeholder for main app (will be expanded)
function MainApp({ profile, onReset }) {
  const [screen, setScreen] = useState("home");
  const [tasks, setTasks] = useState(() => store.get("pcs_tasks") || buildTasks(profile.departingDate, profile.isOverseas, profile.hasChildren));
  const theme = BRANCH_THEMES[profile.branch];

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:"#F3F5F8", fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`* {box-sizing:border-box} input,select,button {font-family:inherit}`}</style>
      
      <div style={{ background:theme.secondary, color:"#FFFFFF", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", color:theme.accent }}>PCS EXPRESS</div>
          <div style={{ fontSize:11, opacity:0.8 }}>{profile.gainingInstallation}</div>
        </div>
        <button onClick={onReset} style={{ fontSize:12, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"#FFFFFF", padding:"6px 12px", borderRadius:8, cursor:"pointer" }}>Edit</button>
      </div>

      <div style={{ flex:1, padding:"12px 14px 0", overflowY:"auto" }}>
        {screen === "home" && (
          <div>
            <div style={{ marginBottom:12 }}>
              <h2 style={{ fontSize:16, fontWeight:900, color:"#0D1821", marginBottom:8 }}>Welcome, {profile.firstName}</h2>
              <p style={{ fontSize:13, color:"#56697C" }}>Departing {new Date(profile.departingDate).toLocaleDateString()}</p>
            </div>

            {/* Quick actions */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <button onClick={()=>setScreen("checklist")} style={{ padding:"12px 10px", background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>✓</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#0D1821" }}>Checklist</div>
                <div style={{ fontSize:10, color:"#56697C" }}>{tasks.filter(t=>t.done).length}/{tasks.length}</div>
              </button>
              <button onClick={()=>setScreen("schools")} style={{ padding:"12px 10px", background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>🎓</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#0D1821" }}>Schools</div>
                <div style={{ fontSize:10, color:"#56697C" }}>{profile.childAges.length} kids</div>
              </button>
              <button onClick={()=>setScreen("resources")} style={{ padding:"12px 10px", background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>◉</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#0D1821" }}>Resources</div>
                <div style={{ fontSize:10, color:"#56697C" }}>Local info</div>
              </button>
              <button onClick={()=>setScreen("ask")} style={{ padding:"12px 10px", background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, cursor:"pointer", textAlign:"center" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>?</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#0D1821" }}>Ask AI</div>
                <div style={{ fontSize:10, color:"#56697C" }}>Questions</div>
              </button>
            </div>
          </div>
        )}

        {screen === "checklist" && (
          <div>
            <h2 style={{ fontSize:14, fontWeight:900, color:"#0D1821", marginBottom:10 }}>PCS Checklist</h2>
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} style={{ display:"flex", gap:10, padding:"10px", background:"#FFFFFF", marginBottom:8, borderRadius:10, border:"1px solid #E0E6EE" }}>
                <input type="checkbox" checked={task.done} onChange={e=>setTasks(tasks.map(t=>t.id===task.id?{...t,done:e.target.checked}:t))} style={{ marginTop:2 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:task.done?"#aaa":"#0D1821", textDecoration:task.done?"line-through":"none" }}>{task.title}</div>
                  <div style={{ fontSize:10, color:"#56697C" }}>{task.office}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === "schools" && (
          <div>
            <h2 style={{ fontSize:14, fontWeight:900, color:"#0D1821", marginBottom:10 }}>Schools at {profile.gainingInstallation}</h2>
            {profile.childAges.length === 0 ? (
              <p style={{ color:"#56697C" }}>Add children ages in profile to see school info</p>
            ) : (
              <div>
                {profile.childAges.map((age, i) => (
                  <div key={i} style={{ background:"#FFFFFF", padding:"10px", marginBottom:8, borderRadius:10, border:"1px solid #E0E6EE" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0D1821", marginBottom:6 }}>Age {age} (Grade {Math.max(0, age - 5)})</div>
                    <p style={{ fontSize:11, color:"#56697C", margin:0 }}>Loading school districts...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {screen === "resources" && (
          <div>
            <h2 style={{ fontSize:14, fontWeight:900, color:"#0D1821", marginBottom:10 }}>Resources</h2>
            <div style={{ display:"grid", gap:8 }}>
              {["Housing", "Spouse", "Moving", "Finance", "Medical"].map(r => (
                <button key={r} onClick={()=>{}} style={{ padding:"12px", background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, cursor:"pointer", textAlign:"left", fontWeight:700, color:"#0D1821" }}>
                  {r} →
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === "ask" && (
          <div>
            <h2 style={{ fontSize:14, fontWeight:900, color:"#0D1821", marginBottom:10 }}>Ask PCS Express</h2>
            <input type="text" placeholder="Ask about housing, schools, finance..." style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid #E0E6EE", marginBottom:10, fontSize:12 }} />
            <button style={{ width:"100%", padding:"10px", background:"#4A5E2A", color:"#FFFFFF", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700 }}>Send</button>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, padding:"10px 14px 14px", background:"#FFFFFF", borderTop:"1px solid #E0E6EE" }}>
        {[{id:"home",icon:"◈"},{id:"checklist",icon:"✓"},{id:"schools",icon:"🎓"},{id:"resources",icon:"◉"},{id:"ask",icon:"?"}].map(tab => (
          <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{ flex:1, padding:"8px", background:screen===tab.id?"#4A5E2A":"#F3F5F8", color:screen===tab.id?"#FFFFFF":"#56697C", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:screen===tab.id?800:500 }}>
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
