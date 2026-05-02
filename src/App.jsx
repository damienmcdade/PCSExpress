import { useState, useEffect, useCallback, useRef } from "react";

// ─── BRANCH THEMES ────────────────────────────────────────────────────────────
const BRANCH_THEMES = {
  "Army": {
    primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", light: "#F0EDD8",
    text: "#1A2200", subtext: "#5A6E30", badge: "#6B8040", badgeText: "#FFFFFF",
    name: "Army", abbr: "USA",
    insignia: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.18" fill="currentColor">
        <polygon points="100,10 115,55 162,55 124,82 138,127 100,100 62,127 76,82 38,55 85,55" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <polygon points="100,25 111,58 146,58 119,78 129,111 100,91 71,111 81,78 54,58 89,58" fill="currentColor" opacity="0.3"/>
        <text x="100" y="145" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="4" fontFamily="serif">UNITED STATES ARMY</text>
        <circle cx="100" cy="100" r="72" fill="none" strokeWidth="1.5" stroke="currentColor"/>
        <circle cx="100" cy="100" r="68" fill="none" strokeWidth="0.5" stroke="currentColor"/>
        <path d="M60,170 Q100,185 140,170" fill="none" stroke="currentColor" strokeWidth="1"/>
        <path d="M60,30 Q100,15 140,30" fill="none" stroke="currentColor" strokeWidth="1"/>
      </g>
    </svg>`,
  },
  "Navy": {
    primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", light: "#E8ECF8",
    text: "#050E2A", subtext: "#3A4A7A", badge: "#2A3A7A", badgeText: "#FFFFFF",
    name: "Navy", abbr: "USN",
    insignia: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.18" fill="none" stroke="currentColor">
        <path d="M100,20 L100,180 M20,100 L180,100" strokeWidth="1.2"/>
        <path d="M40,40 L160,160 M160,40 L40,160" strokeWidth="0.8"/>
        <circle cx="100" cy="100" r="75" strokeWidth="1.5"/>
        <circle cx="100" cy="100" r="55" strokeWidth="1"/>
        <circle cx="100" cy="100" r="30" strokeWidth="0.8"/>
        <polygon points="100,22 107,44 130,44 113,57 120,80 100,67 80,80 87,57 70,44 93,44" fill="currentColor" opacity="0.25"/>
        <text x="100" y="155" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="3" fontFamily="serif" fill="currentColor">U.S. NAVY</text>
        <path d="M50,170 C70,160 130,160 150,170" strokeWidth="1"/>
      </g>
    </svg>`,
  },
  "Marine Corps": {
    primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", light: "#F5E8E8",
    text: "#2A0000", subtext: "#7A2A2A", badge: "#9B1010", badgeText: "#FFFFFF",
    name: "Marines", abbr: "USMC",
    insignia: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.18" stroke="currentColor" fill="none">
        <ellipse cx="100" cy="110" rx="45" ry="65" strokeWidth="2"/>
        <circle cx="100" cy="75" r="22" strokeWidth="1.5"/>
        <line x1="30" y1="110" x2="170" y2="110" strokeWidth="1.5"/>
        <path d="M55,50 Q100,20 145,50" strokeWidth="1.5"/>
        <path d="M100,53 L100,10" strokeWidth="2"/>
        <path d="M85,10 L115,10" strokeWidth="2"/>
        <text x="100" y="185" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="2" fontFamily="serif" fill="currentColor">SEMPER FIDELIS</text>
        <path d="M55,150 L80,175 M145,150 L120,175" strokeWidth="1"/>
        <circle cx="100" cy="100" r="78" strokeWidth="1"/>
      </g>
    </svg>`,
  },
  "Air Force": {
    primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", light: "#E8F2FA",
    text: "#031525", subtext: "#2A4A6A", badge: "#2060A0", badgeText: "#FFFFFF",
    name: "Air Force", abbr: "USAF",
    insignia: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.18" stroke="currentColor" fill="none">
        <path d="M20,120 Q60,80 100,75 Q140,70 180,50" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M20,130 Q60,95 100,92 Q140,89 175,75" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <path d="M100,75 L70,130 L100,115 L130,130 Z" fill="currentColor" opacity="0.2"/>
        <circle cx="100" cy="95" r="18" strokeWidth="1.5"/>
        <circle cx="100" cy="95" r="8" fill="currentColor" opacity="0.15"/>
        <path d="M100,77 L100,30" strokeWidth="2"/>
        <path d="M85,42 L115,42" strokeWidth="1.5"/>
        <text x="100" y="170" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="2.5" fontFamily="serif" fill="currentColor">U.S. AIR FORCE</text>
        <circle cx="100" cy="100" r="78" strokeWidth="0.8"/>
      </g>
    </svg>`,
  },
  "Space Force": {
    primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", light: "#E8EEFA",
    text: "#05051E", subtext: "#3A3A6A", badge: "#2A2A6A", badgeText: "#C8D8F0",
    name: "Space Force", abbr: "USSF",
    insignia: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.2" stroke="currentColor" fill="none">
        <circle cx="100" cy="100" r="70" strokeWidth="1.5"/>
        <ellipse cx="100" cy="100" rx="70" ry="28" strokeWidth="1.2"/>
        <ellipse cx="100" cy="100" rx="70" ry="28" strokeWidth="1.2" transform="rotate(60,100,100)"/>
        <ellipse cx="100" cy="100" rx="70" ry="28" strokeWidth="1.2" transform="rotate(120,100,100)"/>
        <circle cx="100" cy="100" r="12" fill="currentColor" opacity="0.2"/>
        <circle cx="145" cy="65" r="5" fill="currentColor" opacity="0.3"/>
        <circle cx="60" cy="130" r="3" fill="currentColor" opacity="0.2"/>
        <circle cx="155" cy="130" r="4" fill="currentColor" opacity="0.25"/>
        <text x="100" y="185" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="2" fontFamily="serif" fill="currentColor">UNITED STATES SPACE FORCE</text>
      </g>
    </svg>`,
  },
  "Coast Guard": {
    primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", light: "#E8F4FA",
    text: "#001E3A", subtext: "#1A4A6A", badge: "#0070A0", badgeText: "#FFFFFF",
    name: "Coast Guard", abbr: "USCG",
    insignia: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.18" stroke="currentColor" fill="none">
        <path d="M100,18 L122,72 L180,72 L133,106 L151,160 L100,126 L49,160 L67,106 L20,72 L78,72 Z" strokeWidth="1.5"/>
        <path d="M100,35 L117,75 L158,75 L126,98 L137,138 L100,115 L63,138 L74,98 L42,75 L83,75 Z" fill="currentColor" opacity="0.1"/>
        <text x="100" y="185" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="2" fontFamily="serif" fill="currentColor">U.S. COAST GUARD</text>
        <circle cx="100" cy="100" r="78" strokeWidth="0.8"/>
        <path d="M55,170 Q100,185 145,170" strokeWidth="1"/>
      </g>
    </svg>`,
  },
};

const COMPONENT_TYPES = ["Active Duty", "Reserve", "National Guard", "AGR (Active Guard & Reserve)", "Full-Time National Guard (FTNG)"];

const COMPONENT_INFO = {
  "Active Duty": "Full-time military service. All PCS entitlements apply including full BAH, BAS, TLE, and HHG shipment.",
  "Reserve": "Part-time service. PCS orders are less common but do occur for command assignments. Entitlements vary — verify with your unit S1.",
  "National Guard": "State-controlled, federally funded when activated. PCS under Title 10 orders qualifies for most federal entitlements. Title 32 PCS has different rules.",
  "AGR (Active Guard & Reserve)": "Full-time support of Reserve or Guard units. Entitled to the same PCS benefits as Active Duty under AGR orders.",
  "Full-Time National Guard (FTNG)": "Full-time state employees supporting Guard missions. PCS rules vary by state. Verify entitlements with your State G1/J1.",
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

function buildTasks(rnltd, isOverseas, hasChildren) {
  const r = new Date(rnltd);
  const raw = [
    { id:"orders",    daysB:180, phase:"180+ days", cat:"Admin",    urgent:true,  title:"Receive & verify PCS orders",           detail:"Check all fields: RNLTD, losing/gaining UIC, dependent travel auth, TLE authorization. Errors must be corrected now.", office:"S1 / Personnel", contact:"Unit S1" },
    { id:"deers",     daysB:175, phase:"180+ days", cat:"Admin",    urgent:false, title:"Update DEERS & dependent info",         detail:"All dependents must be correctly listed before travel orders and ID card updates.", office:"RAPIDS site", contact:"rapids.dmdc.osd.mil" },
    { id:"fin_brief", daysB:160, phase:"180+ days", cat:"Finance",  urgent:false, title:"Attend PCS finance briefing",           detail:"Understand DPS, travel pay, advance pay, and PPM/DITY incentives. Schedule early.", office:"Finance office", contact:"On-post finance" },
    { id:"tmo_init",  daysB:150, phase:"180+ days", cat:"Move",     urgent:true,  title:"Create DPS account & book shipment",    detail:"Log into move.mil. Book HHG or PPM early — pickup windows fill fast especially summer.", office:"TMO", contact:"move.mil | 1-800-462-2176" },
    { id:"hsg_ntc",   daysB:150, phase:"180+ days", cat:"Housing",  urgent:true,  title:"Submit housing vacate notice",          detail:"On-post: 30–60 day notice required. Off-post: check your lease for required notice period.", office:"Housing office", contact:"Installation housing / landlord" },
    { id:"med_rec",   daysB:145, phase:"180+ days", cat:"Medical",  urgent:false, title:"Request medical & dental records",      detail:"Hard copies for every family member. Medical, dental, vision, mental health. Don't rely on electronic transfer.", office:"MTF medical records", contact:"On-post MTF" },
    { id:"school",    daysB:140, phase:"180+ days", cat:"Family",   urgent:false, title:"Request children's school records",     detail:"Transcripts, IEP docs, immunization records. Physical copies often required by gaining schools.", office:"School Liaison Office", contact:"Installation SLO", childOnly:true },
    { id:"car_ship",  daysB:120, phase:"90–120 days", cat:"Vehicle", urgent:true, title:"Book POV shipment",                    detail:"Book through pcsmypov.com. OCONUS: emissions check, proof of ownership, no personal items inside.", office:"VPC", contact:"pcsmypov.com | 1-855-389-9499", overseasOnly:true },
    { id:"passport",  daysB:120, phase:"90–120 days", cat:"Admin",  urgent:true,  title:"Apply for no-fee passports",           detail:"OCONUS required. Allow 8–10 weeks. Tourist passports for family too if traveling internationally.", office:"Legal / Passport office", contact:"Installation legal or post office", overseasOnly:true },
    { id:"hotel",     daysB:90,  phase:"90–120 days", cat:"Lodging", urgent:true, title:"Reserve TLF / backup hotel",           detail:"On-post Temporary Lodging Facility and off-post backup. TLE covers up to 10 days of lodging.", office:"Billeting / lodging", contact:"Installation lodging" },
    { id:"sponsor",   daysB:90,  phase:"90–120 days", cat:"Admin",  urgent:false, title:"Contact gaining unit sponsor",         detail:"Your gaining unit should assign a sponsor. If not assigned, contact the gaining unit S1 directly.", office:"Gaining unit orderly room", contact:"Gaining S1" },
    { id:"dental",    daysB:85,  phase:"90–120 days", cat:"Medical", urgent:false, title:"Complete dental exam",                detail:"OCONUS commands may require Class 1 or 2 dental status. Failure can delay orders.", office:"Dental clinic", contact:"On-post dental" },
    { id:"poa",       daysB:60,  phase:"60 days",     cat:"Legal",  urgent:false, title:"Get General Power of Attorney",        detail:"Free through installation legal. Essential if spouse handles affairs solo during move.", office:"JAG / Legal", contact:"Installation legal" },
    { id:"will",      daysB:60,  phase:"60 days",     cat:"Legal",  urgent:false, title:"Update will & SGLI beneficiaries",     detail:"Especially important before OCONUS or pre-deployment PCS.", office:"JAG / Legal", contact:"Installation legal" },
    { id:"car_dtl",   daysB:60,  phase:"60 days",     cat:"Vehicle", urgent:true, title:"Schedule VPC vehicle detailing",       detail:"Interior & exterior professionally cleaned. No soil/plant matter. 1–2 weeks before VPC drop-off.", office:"Auto detail shop", contact:"Ask locally — confirm VPC export requirements", overseasOnly:true },
    { id:"sell",      daysB:60,  phase:"60 days",     cat:"Logistics",urgent:false,title:"Start selling unwanted items",        detail:"Furniture, appliances, electronics. Facebook Marketplace, OfferUp, Swappa for electronics, on-post lemon lot for vehicles.", office:"Various", contact:"FB Marketplace · OfferUp · Swappa" },
    { id:"addr",      daysB:30,  phase:"30 days",     cat:"Admin",  urgent:true,  title:"Submit change of address",             detail:"USPS, DFAS, bank, VA, insurance, subscriptions, voter registration.", office:"Online / self", contact:"usps.com/move · mypay.dfas.mil" },
    { id:"hsg_insp",  daysB:30,  phase:"30 days",     cat:"Housing", urgent:true, title:"Schedule final housing inspection",    detail:"Book early — slots fill fast. Pre-inspect with the move-out checklist beforehand.", office:"Housing office", contact:"Installation housing / landlord" },
    { id:"clean",     daysB:28,  phase:"30 days",     cat:"Housing", urgent:true, title:"Book professional cleaning service",   detail:"Book 1–2 weeks before inspection. Military-area cleaners know inspection standards. Keep receipt.", office:"Cleaning service", contact:"Google '[city] military PCS cleaning'" },
    { id:"gear",      daysB:30,  phase:"30 days",     cat:"Equipment",urgent:true,title:"Inventory & replace TA-50 / gear",    detail:"Full inventory now. Replace missing items at CIF, unit supply, or AAFES. Don't wait — CIF lines are long at PCS season.", office:"CIF / Unit supply / AAFES", contact:"On-post CIF" },
    { id:"cif",       daysB:14,  phase:"Final 2 wks", cat:"Equipment",urgent:true,title:"Turn in CIF / TA-50 equipment",       detail:"Clean everything. Minimum 2 weeks before departure. Bring all items or pay replacement cost.", office:"CIF", contact:"On-post CIF — call ahead for appointment" },
    { id:"outproc",   daysB:14,  phase:"Final 2 wks", cat:"Admin",  urgent:true,  title:"Begin formal out-processing",          detail:"Packet from S1. Visit: Finance, Medical, Dental, Legal, Housing, TMO, Provost Marshal, leadership.", office:"S1 / Orderly room", contact:"Unit S1" },
    { id:"hhg_conf",  daysB:14,  phase:"Final 2 wks", cat:"Move",   urgent:true,  title:"Confirm HHG pickup with TMO",          detail:"Confirm 1–2 weeks before. Be present or have POA rep. Keep docs, medications, valuables with you.", office:"TMO", contact:"move.mil · moving company" },
    { id:"vpc_drop",  daysB:10,  phase:"Final 2 wks", cat:"Vehicle", urgent:true, title:"Drop POV at VPC",                     detail:"Bring title, registration, insurance, orders. Remove all personal items. Document vehicle condition.", office:"VPC", contact:"pcsmypov.com", overseasOnly:true },
    { id:"fin_clr",   daysB:7,   phase:"Final 2 wks", cat:"Finance", urgent:true, title:"Clear finance & submit travel voucher",detail:"File DD Form 1351-2. Claim mileage, per diem, lodging, authorized expenses. Don't leave money on the table.", office:"Finance office", contact:"Installation finance · mypay.dfas.mil" },
    { id:"hsg_fin",   daysB:7,   phase:"Final 2 wks", cat:"Housing", urgent:true, title:"Final housing inspection",             detail:"Have cleaning receipt and checklist ready. Dispute any unexpected charges in writing on the spot.", office:"Housing / landlord", contact:"Installation housing" },
  ];
  return raw
    .filter(t => !(t.overseasOnly && !isOverseas) && !(t.childOnly && !hasChildren))
    .map(t => ({ ...t, dueDate: addDays(r, -t.daysB), done: false }))
    .sort((a, b) => a.dueDate - b.dueDate);
}

const GAINING_CATS = [
  { id:"housing",   label:"Housing",         emoji:"🏠" },
  { id:"spouse",    label:"Spouse & family", emoji:"💛", isSpouse:true },
  { id:"daycare",   label:"Daycare",         emoji:"👶" },
  { id:"unit",      label:"Your unit",       emoji:"⭐" },
  { id:"furniture", label:"Furniture",       emoji:"🛋" },
  { id:"vehicles",  label:"Vehicles",        emoji:"🚗" },
  { id:"activities",label:"Activities",      emoji:"🎯" },
  { id:"nightlife", label:"Nightlife",       emoji:"🎵" },
  { id:"events",    label:"USO & events",    emoji:"📅" },
];

function gainingPrompt(catId, profile) {
  const { gainingInstallation:inst, paygrade, branch, component, hasChildren, hasDependents, bedrooms, unit } = profile;
  const compStr = component !== "Active Duty" ? ` (${component})` : "";
  const sys = `You are PCS Express assisting a ${branch}${compStr} ${paygrade} arriving at ${inst}. Be specific, practical, and current. Use bullets. Prioritize military resources.`;
  const p = {
    housing:    `Search for current military and private housing at ${inst}. Name the on-post housing company and neighborhoods, typical waitlist times, popular off-post areas, ${bedrooms}BR rent ranges.`,
    spouse:     `Search for spouse and family community resources at ${inst}: named spouse clubs and how to join, Family Readiness Groups, active Facebook groups for military spouses (name them), community events for families, MSEP spouse employment, mental health/wellness resources, friend-making opportunities for newly arrived spouses. Be warm and specific.`,
    daycare:    hasChildren ? `Search for childcare at ${inst}: CDC name and fees, waitlist tips, School Age Services, top private daycares, Military Child Care app, fee assistance programs.` : `Note CDC availability at ${inst} briefly.`,
    unit:       `Search for publicly available information about${unit ? ` the ${unit} and other` : ""} units at ${inst}${compStr}. Mission, OPTEMPO, history, what new arrivals should expect. Public info only.`,
    furniture:  `Search for furniture stores near ${inst} with military discounts: AAFES, local retailers, Facebook military buy/sell groups. Include discount amounts.`,
    vehicles:   `Search for vehicle dealerships near ${inst} with military discounts: manufacturer programs (Ford, GM, Toyota), USAA car buying, local dealerships known for military service.`,
    activities: `Search for activities near ${inst}: outdoor, cultural, sports, MWR.${hasChildren?" Family-friendly options too.":""} Note military discounts and distances.`,
    nightlife:  `Search for nightlife near ${inst}: bars, live music, breweries, on-post clubs. Which are popular with military?`,
    events:     `Search for upcoming USO events, MWR programming, military-sponsored activities at ${inst}. Include signature annual events and how to find the current calendar.`,
  };
  return { sys, user: p[catId] || `Tell me about ${catId} at ${inst}.` };
}

const SELL_RESOURCES = [
  { name:"Facebook Marketplace",         type:"General",     desc:"Best for furniture, appliances, household goods. Military communities near installations are very active PCS sellers." },
  { name:"Military Families Facebook",   type:"General",     desc:"Search '[Installation] military families' — large active groups for PCS sales, tips, and newcomer help." },
  { name:"OfferUp",                      type:"General",     desc:"Local buy/sell app. Good for mid-size items and furniture. Fast local pickups." },
  { name:"On-post lemon lot",            type:"Vehicles",    desc:"Free bulletin board at most installations. Service members sell vehicles — no fees, no middleman." },
  { name:"Carvana / CarMax",             type:"Vehicles",    desc:"Fast, no-haggle vehicle sales. Instant offer online. Best for quick PCS sell-off." },
  { name:"USAA Car Selling",             type:"Vehicles",    desc:"Competitive offers for USAA members. Also handles buying at the gaining installation." },
  { name:"Swappa",                       type:"Electronics", desc:"Best marketplace for phones, tablets, laptops. Safer than eBay, faster payout." },
  { name:"AAFES Electronics Trade-in",   type:"Electronics", desc:"On-post trade-in for phones and electronics. Convenient, no shipping required." },
  { name:"eBay",                         type:"Electronics", desc:"Best for rare, high-value, or collectible electronics and gaming gear." },
];

const ORGS = [
  { name:"Military OneSource",           desc:"Free counseling, relocation tools, financial help", contact:"militaryonesource.mil · 1-800-342-9647", branch:"All" },
  { name:"Army Emergency Relief",        desc:"Emergency financial assistance and interest-free loans", contact:"aerhq.org", branch:"Army" },
  { name:"Navy-Marine Corps Relief",     desc:"Financial assistance, budgeting, PCS support", contact:"nmcrs.org", branch:"Navy/USMC" },
  { name:"Air Force Aid Society",        desc:"Emergency funds, loans, PCS transition support", contact:"afas.org", branch:"Air Force" },
  { name:"Coast Guard Mutual Asst.",     desc:"Financial help and PCS relocation support", contact:"cgmahq.org", branch:"Coast Guard" },
  { name:"TRICARE",                      desc:"Transfer healthcare coverage before you depart", contact:"tricare.mil", branch:"All" },
  { name:"School Liaison Office",        desc:"Children's school enrollment and IEP transfers", contact:"Installation SLO", branch:"All" },
  { name:"Army Community Service",       desc:"Relocation assistance, financial counseling, spouse employment", contact:"On-post ACS", branch:"Army" },
  { name:"USO",                          desc:"Transition support, events, connection to resources", contact:"uso.org", branch:"All" },
  { name:"Blue Star Families",           desc:"Community, advocacy, and research for military families", contact:"bluestarfam.org", branch:"All" },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Spinner({ label = "Searching for current info…", accent = "#C8A84B" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 4px", color:"#56697C", fontSize:13 }}>
      <div style={{ width:15, height:15, border:`2px solid #E0E6EE`, borderTopColor:accent, borderRadius:"50%", animation:"spin 0.75s linear infinite", flexShrink:0 }} />
      {label}
    </div>
  );
}

function AiBlock({ text, theme }) {
  const acc = theme?.accent || "#C8A84B";
  return (
    <div style={{ fontSize:14, color:"#0D1821", lineHeight:1.75 }}>
      {text.split("\n").filter(l => l.trim()).map((line, i) => {
        const t = line.trim().replace(/\*\*(.*?)\*\*/g, "$1");
        if (t.startsWith("## ") || (t.startsWith("**") && t.endsWith("**")))
          return <div key={i} style={{ fontWeight:700, fontSize:13, marginTop:i>0?14:0, marginBottom:5, color:theme?.primary || "#0A1628" }}>{t.replace(/^##\s*/,"").replace(/^\*\*|\*\*$/g,"")}</div>;
        if (t.startsWith("- ") || t.startsWith("• "))
          return <div key={i} style={{ display:"flex", gap:9, marginBottom:6 }}><span style={{ color:acc, flexShrink:0, fontWeight:700, marginTop:2, fontSize:12 }}>›</span><span>{t.replace(/^[-•]\s*/,"")}</span></div>;
        if (/^\d+\./.test(t))
          return <div key={i} style={{ display:"flex", gap:9, marginBottom:6 }}><span style={{ color:acc, flexShrink:0, fontWeight:700, minWidth:18 }}>{t.match(/^\d+/)[0]}.</span><span>{t.replace(/^\d+\.\s*/,"")}</span></div>;
        return <p key={i} style={{ marginBottom:7 }}>{t}</p>;
      })}
    </div>
  );
}

function Tag({ label, bg = "#F3F5F8", color = "#56697C" }) {
  return <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:bg, color, fontWeight:700, whiteSpace:"nowrap", display:"inline-block", letterSpacing:".02em" }}>{label}</span>;
}

function Card({ children, style, onClick, theme }) {
  return (
    <div onClick={onClick} style={{ background:"#FFFFFF", border:`1px solid ${theme?.light ? theme.light+"80" : "#E0E6EE"}`, borderRadius:14, padding:"14px 16px", ...style, cursor:onClick?"pointer":undefined }}>
      {children}
    </div>
  );
}

// Branch insignia background
function InsigniaBackground({ theme }) {
  if (!theme?.insignia) return null;
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{ position:"absolute", right:-30, top:-30, width:220, height:220, color:theme.accent }}
        dangerouslySetInnerHTML={{ __html: theme.insignia.replace('currentColor', theme.accent) }} />
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    firstName:"", lastName:"", branch:"Army", component:"Active Duty", paygrade:"E-5",
    losingInstallation:"", gainingInstallation:"", rnltd:"", unit:"",
    isOverseas:false, hasDependents:false, hasChildren:false, hasVehicle:true, bedrooms:"3",
  });
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const theme = BRANCH_THEMES[p.branch] || BRANCH_THEMES["Army"];

  const inputSt = {
    width:"100%", fontSize:15, padding:"11px 14px", borderRadius:10,
    border:`1px solid rgba(255,255,255,0.15)`, background:"rgba(0,0,0,0.25)",
    color:"#FFFFFF", outline:"none", boxSizing:"border-box", WebkitAppearance:"none",
    fontFamily:"inherit",
  };

  const canGo1 = p.firstName && p.branch && p.paygrade && p.component;
  const canGo2 = p.losingInstallation && p.gainingInstallation && p.rnltd;

  return (
    <div style={{ minHeight:"100vh", background:theme.secondary, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} * {box-sizing:border-box}`}</style>
      {/* Animated insignia BG */}
      <div style={{ position:"absolute", right:-40, top:-40, width:280, height:280, opacity:0.12, color:theme.accent, animation:"fadeUp 1s ease" }}
        dangerouslySetInnerHTML={{ __html: theme.insignia }} />
      <div style={{ position:"absolute", left:-60, bottom:-60, width:200, height:200, opacity:0.07, color:theme.accent }}
        dangerouslySetInnerHTML={{ __html: theme.insignia }} />

      {/* Header */}
      <div style={{ padding:"36px 24px 24px", textAlign:"center", position:"relative", zIndex:1, animation:"fadeUp .6s ease" }}>
        <div style={{ fontSize:11, letterSpacing:".22em", color:theme.accent, marginBottom:8, fontWeight:800 }}>✦ PCS EXPRESS ✦</div>
        <div style={{ fontSize:28, fontWeight:900, color:"#FFFFFF", letterSpacing:"-.01em", lineHeight:1.15 }}>Your move,<br/><span style={{ color:theme.accent }}>simplified.</span></div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginTop:8, lineHeight:1.5 }}>Branch-aware PCS guidance<br/>from orders to arrival</div>
      </div>

      {/* Branch quick selector */}
      <div style={{ padding:"0 20px 16px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
          {Object.keys(BRANCH_THEMES).map(b => {
            const t = BRANCH_THEMES[b];
            const active = p.branch === b;
            return (
              <button key={b} onClick={() => upd("branch", b)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${active ? t.accent : "rgba(255,255,255,0.2)"}`, background: active ? t.accent : "rgba(255,255,255,0.08)", color: active ? t.secondary : "rgba(255,255,255,0.7)", fontSize:12, fontWeight:active?800:500, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, letterSpacing:".02em" }}>
                {t.abbr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:6, paddingBottom:18, zIndex:1 }}>
        {["Profile","Orders","Family"].map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background: i<=step ? theme.accent : "rgba(255,255,255,0.1)", border:`2px solid ${i<=step ? theme.accent : "rgba(255,255,255,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: i<=step ? theme.secondary : "rgba(255,255,255,0.4)" }}>
                {i < step ? "✓" : i+1}
              </div>
              <div style={{ fontSize:9, fontWeight:700, color: i===step ? theme.accent : "rgba(255,255,255,0.3)", letterSpacing:".06em" }}>{s.toUpperCase()}</div>
            </div>
            {i < 2 && <div style={{ width:24, height:2, borderRadius:1, background: i<step ? theme.accent : "rgba(255,255,255,0.15)", marginBottom:14 }} />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ flex:1, padding:"0 18px 32px", position:"relative", zIndex:1 }}>
        <div style={{ background:"rgba(0,0,0,0.35)", backdropFilter:"blur(10px)", borderRadius:20, border:"1px solid rgba(255,255,255,0.12)", padding:"22px 18px", animation:"fadeUp .5s ease" }}>

          {step === 0 && <>
            <div style={{ fontSize:16, fontWeight:800, color:"#FFFFFF", marginBottom:18 }}>About you</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>FIRST NAME</label><input value={p.firstName} onChange={e=>upd("firstName",e.target.value)} placeholder="Jordan" style={inputSt} /></div>
              <div><label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>LAST NAME</label><input value={p.lastName} onChange={e=>upd("lastName",e.target.value)} placeholder="Rivera" style={inputSt} /></div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>COMPONENT</label>
              <select value={p.component} onChange={e=>upd("component",e.target.value)} style={inputSt}>
                {COMPONENT_TYPES.map(c=><option key={c}>{c}</option>)}
              </select>
              {p.component && <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:6, lineHeight:1.5, padding:"6px 8px", background:"rgba(255,255,255,0.05)", borderRadius:6 }}>{COMPONENT_INFO[p.component]}</div>}
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>PAY GRADE</label>
              <select value={p.paygrade} onChange={e=>upd("paygrade",e.target.value)} style={inputSt}>
                {["E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8","E-9","W-1","W-2","W-3","W-4","W-5","O-1","O-2","O-3","O-4","O-5","O-6"].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <button onClick={()=>setStep(1)} disabled={!canGo1} style={{ width:"100%", padding:"14px", borderRadius:12, background:canGo1?theme.accent:"rgba(255,255,255,0.1)", color:canGo1?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:15, fontWeight:900, cursor:canGo1?"pointer":"not-allowed", letterSpacing:".02em" }}>Continue →</button>
          </>}

          {step === 1 && <>
            <div style={{ fontSize:16, fontWeight:800, color:"#FFFFFF", marginBottom:18 }}>Your orders</div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>DEPARTING FROM</label>
              <input value={p.losingInstallation} onChange={e=>upd("losingInstallation",e.target.value)} placeholder="e.g. Fort Campbell KY, RAF Lakenheath UK" style={inputSt} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>REPORTING TO</label>
              <input value={p.gainingInstallation} onChange={e=>upd("gainingInstallation",e.target.value)} placeholder="e.g. Fort Liberty NC, Camp Pendleton CA" style={inputSt} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>RNLTD</label>
                <input type="date" value={p.rnltd} onChange={e=>upd("rnltd",e.target.value)} style={{...inputSt, colorScheme:"dark"}} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>UNIT / MOS</label>
                <input value={p.unit} onChange={e=>upd("unit",e.target.value)} placeholder="Optional" style={inputSt} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(0)} style={{ padding:"14px 18px", borderRadius:12, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.15)", fontSize:14, fontWeight:700, cursor:"pointer" }}>←</button>
              <button onClick={()=>setStep(2)} disabled={!canGo2} style={{ flex:1, padding:"14px", borderRadius:12, background:canGo2?theme.accent:"rgba(255,255,255,0.1)", color:canGo2?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:15, fontWeight:900, cursor:canGo2?"pointer":"not-allowed" }}>Continue →</button>
            </div>
          </>}

          {step === 2 && <>
            <div style={{ fontSize:16, fontWeight:800, color:"#FFFFFF", marginBottom:18 }}>Family & move type</div>
            {[
              ["isOverseas",    p.isOverseas,    "OCONUS / overseas move",    "Adds passport, VPC, SOFA, and overseas tasks"],
              ["hasVehicle",    p.hasVehicle,    "Shipping a vehicle (POV)",  "Adds vehicle processing center timeline"],
              ["hasDependents", p.hasDependents, "Spouse / dependents",       "Spouse community resources included"],
              ["hasChildren",   p.hasChildren,   "Children",                  "Adds school records and daycare tasks"],
            ].map(([key, val, label, sub]) => (
              <div key={key} onClick={()=>upd(key,!val)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, marginBottom:9, background: val ? `${theme.accent}20` : "rgba(255,255,255,0.04)", border:`1.5px solid ${val ? theme.accent+"66" : "rgba(255,255,255,0.12)"}`, cursor:"pointer" }}>
                <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${val?theme.accent:"rgba(255,255,255,0.25)"}`, background:val?theme.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {val && <svg width="12" height="9" viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1" stroke={theme.secondary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>{label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>{sub}</div>
                </div>
              </div>
            ))}
            <div style={{ marginBottom:18, marginTop:4 }}>
              <label style={{ fontSize:10, fontWeight:700, color:theme.accent, display:"block", marginBottom:5, letterSpacing:".08em" }}>BEDROOMS NEEDED</label>
              <select value={p.bedrooms} onChange={e=>upd("bedrooms",e.target.value)} style={inputSt}>
                {["1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(1)} style={{ padding:"14px 18px", borderRadius:12, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.15)", fontSize:14, fontWeight:700, cursor:"pointer" }}>←</button>
              <button onClick={()=>onComplete(p)} style={{ flex:1, padding:"14px", borderRadius:12, background:theme.accent, color:theme.secondary, border:"none", fontSize:15, fontWeight:900, cursor:"pointer" }}>Build my PCS plan ✦</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({ profile, tasks, onNav, theme }) {
  const done = tasks.filter(t=>t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round(done/total*100) : 0;
  const dLeft = daysUntil(profile.rnltd);
  const overdue = tasks.filter(t=>!t.done && daysUntil(t.dueDate)<0);
  const urgent = tasks.filter(t=>!t.done && t.urgent && daysUntil(t.dueDate)>=0 && daysUntil(t.dueDate)<=30);

  return (
    <div>
      {/* Hero banner */}
      <div style={{ background:theme.secondary, position:"relative", overflow:"hidden", padding:"22px 20px 20px", marginBottom:16, borderBottomLeftRadius:24, borderBottomRightRadius:24 }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:180, height:180, opacity:0.1, color:theme.accent }}
          dangerouslySetInnerHTML={{ __html: theme.insignia }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, letterSpacing:".18em", color:theme.accent, marginBottom:5, fontWeight:800 }}>✦ PCS EXPRESS · {theme.abbr}</div>
          <div style={{ fontSize:21, fontWeight:900, color:"#FFFFFF", marginBottom:3, lineHeight:1.2 }}>
            {profile.firstName ? `Hey, ${profile.firstName}.` : "Your PCS."} <span style={{ color:theme.accent }}>Let's move.</span>
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:16, lineHeight:1.5 }}>
            {profile.branch} {profile.component !== "Active Duty" ? `(${profile.component.split(" ")[0]}) ` : ""}{profile.paygrade}<br/>
            {profile.losingInstallation.split(",")[0]} → {profile.gainingInstallation.split(",")[0]}
          </div>
          {/* Progress */}
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 15px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Out-processing progress</span>
              <span style={{ fontSize:13, fontWeight:900, color:pct===100?"#5DCAA5":theme.accent }}>{pct}%</span>
            </div>
            <div style={{ height:6, borderRadius:6, background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#1A9E75":theme.accent, borderRadius:6, transition:"width .4s ease" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:7 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{done}/{total} tasks done</span>
              <span style={{ fontSize:11, color: dLeft<=14&&dLeft>=0 ? "#F4A040" : "rgba(255,255,255,0.4)" }}>{dLeft>=0 ? `${dLeft} days to RNLTD` : "RNLTD passed"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"0 16px 20px" }}>
        {/* Alerts */}
        {(overdue.length>0||urgent.length>0) && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:10 }}>NEEDS ATTENTION</div>
            {[...overdue,...urgent].slice(0,3).map(t => {
              const d = daysUntil(t.dueDate);
              return (
                <div key={t.id} onClick={()=>onNav("outgoing")} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FFFFFF", border:`1px solid ${d<0?"#F0A0A0":"#F0C880"}`, borderLeft:`3px solid ${d<0?"#B83030":"#C07010"}`, borderRadius:12, padding:"11px 14px", marginBottom:7, cursor:"pointer" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0D1821" }}>{t.title}</div>
                    <div style={{ fontSize:11, color:"#56697C", marginTop:2 }}>{t.office}</div>
                  </div>
                  <Tag label={d<0?`${Math.abs(d)}d late`:`${d}d left`} bg={d<0?"#FDEAEA":"#FEF3E0"} color={d<0?"#B83030":"#C07010"} />
                </div>
              );
            })}
            <button onClick={()=>onNav("outgoing")} style={{ fontSize:13, color:theme.primary, background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:"2px 0" }}>Full checklist →</button>
          </div>
        )}

        {/* Nav grid */}
        <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:10 }}>JUMP TO</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"Out-processing", sub:"Checklist & timeline",    nav:"outgoing",  accent:theme.primary, emoji:"✓" },
            { label:"Gaining guide",  sub:"Housing, unit, activities",nav:"gaining",  accent:"#0F8A6A",    emoji:"↓" },
            { label:"Spouse & family",sub:"Community, clubs, events", nav:"spouse",   accent:"#9B3060",    emoji:"💛" },
            { label:"Resources",      sub:"Sell, orgs, local services",nav:"resources",accent:"#C07010",  emoji:"◉" },
            { label:"Ask PCS Express",sub:"AI-powered live answers",   nav:"ask",      accent:"#1A60A0",   emoji:"?" },
          ].map(item => (
            <div key={item.nav} onClick={()=>onNav(item.nav)} style={{ background:"#FFFFFF", border:`1px solid #E0E6EE`, borderLeft:`3px solid ${item.accent}`, borderRadius:12, padding:"14px 14px", cursor:"pointer" }}>
              <div style={{ fontSize:18, marginBottom:6 }}>{item.emoji}</div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0D1821", marginBottom:2 }}>{item.label}</div>
              <div style={{ fontSize:11, color:"#56697C", lineHeight:1.4 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Component info box */}
        {profile.component !== "Active Duty" && (
          <div style={{ marginTop:14, background:theme.light||"#F0EDD8", borderRadius:12, padding:"13px 15px", border:`1px solid ${theme.accent}33` }}>
            <div style={{ fontSize:11, fontWeight:800, color:theme.primary, marginBottom:4, letterSpacing:".04em" }}>
              {profile.component.toUpperCase()} — ENTITLEMENT NOTE
            </div>
            <div style={{ fontSize:12, color:theme.text||"#1A2200", lineHeight:1.6 }}>{COMPONENT_INFO[profile.component]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHECKLIST SCREEN ─────────────────────────────────────────────────────────
function ChecklistScreen({ profile, tasks, setTasks, theme }) {
  const [expanded, setExpanded] = useState(null);
  const [filterPhase, setFilterPhase] = useState("All");
  const [showDone, setShowDone] = useState(true);
  const toggle = id => setTasks(prev => prev.map(t => t.id===id ? {...t,done:!t.done} : t));
  const phases = ["All",...Array.from(new Set(tasks.map(t=>t.phase)))];
  const filtered = tasks.filter(t => (showDone||!t.done) && (filterPhase==="All"||t.phase===filterPhase));

  const PHASE_COLORS = {
    "180+ days":  { bg:"#E0F5EF", color:"#075740" },
    "90–120 days":{ bg:"#E8F2FB", color:"#0C3D6E" },
    "60 days":    { bg:"#FEF3E0", color:"#7A4500" },
    "30 days":    { bg:"#FEF0E7", color:"#803010" },
    "Final 2 wks":{ bg:"#FDEAEA", color:"#7A1A1A" },
  };

  return (
    <div style={{ padding:"16px 16px 24px" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:18, fontWeight:900, color:"#0D1821", marginBottom:2 }}>Out-processing checklist</div>
        <div style={{ fontSize:12, color:"#56697C" }}>
          Departing {profile.losingInstallation} · {tasks.filter(t=>t.done).length}/{tasks.length} done
        </div>
      </div>

      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:10, scrollbarWidth:"none" }}>
        {phases.map(ph => (
          <button key={ph} onClick={()=>setFilterPhase(ph)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${filterPhase===ph?theme.primary:"#E0E6EE"}`, background:filterPhase===ph?theme.primary:"#FFFFFF", color:filterPhase===ph?"#FFFFFF":"#56697C", fontSize:12, cursor:"pointer", fontWeight:filterPhase===ph?800:500, whiteSpace:"nowrap", flexShrink:0, letterSpacing:".01em" }}>{ph}</button>
        ))}
      </div>

      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#56697C", marginBottom:14, cursor:"pointer" }}>
        <input type="checkbox" checked={showDone} onChange={e=>setShowDone(e.target.checked)} style={{ accentColor:theme.accent }} />
        Show completed tasks
      </label>

      {filtered.length === 0 && <div style={{ color:"#56697C", fontSize:14, padding:"20px 0", textAlign:"center" }}>No tasks match this filter.</div>}

      {filtered.map(task => {
        const d = daysUntil(task.dueDate);
        const overdue = d<0 && !task.done;
        const soon = d>=0 && d<=14 && !task.done;
        const ph = PHASE_COLORS[task.phase] || { bg:"#F3F5F8", color:"#56697C" };
        const isEx = expanded===task.id;

        return (
          <div key={task.id} style={{ marginBottom:8, opacity:task.done?0.5:1, background:"#FFFFFF", border:`1px solid ${overdue?"#F0A0A0":soon?"#F0C880":"#E0E6EE"}`, borderRadius:12, overflow:"hidden", borderLeft:`3px solid ${overdue?"#B83030":soon?"#C07010":task.done?"#0F8A6A":theme.primary}` }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", cursor:"pointer" }} onClick={()=>setExpanded(isEx?null:task.id)}>
              <div onClick={e=>{e.stopPropagation();toggle(task.id);}} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${task.done?"#0F8A6A":"#D0DAE8"}`, background:task.done?"#0F8A6A":"transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                {task.done && <svg width="12" height="9" viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:task.done?"#56697C":"#0D1821", textDecoration:task.done?"line-through":"none", marginBottom:5, lineHeight:1.3 }}>{task.title}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  <Tag label={task.phase} bg={ph.bg} color={ph.color} />
                  <Tag label={task.cat} bg="#F3F5F8" color="#56697C" />
                  {!task.done && overdue && <Tag label={`${Math.abs(d)}d overdue`} bg="#FDEAEA" color="#B83030" />}
                  {!task.done && soon && !overdue && <Tag label={`${d}d left`} bg="#FEF3E0" color="#C07010" />}
                  {!task.done && !overdue && !soon && <span style={{ fontSize:11, color:"#56697C" }}>Due {fmtDate(task.dueDate)}</span>}
                </div>
              </div>
              <span style={{ fontSize:12, color:"#56697C", flexShrink:0, marginTop:2, fontWeight:700 }}>{isEx?"▲":"▼"}</span>
            </div>
            {isEx && (
              <div style={{ borderTop:"1px solid #F0F4F8", padding:"12px 14px 14px", background:"#F8FAFC" }}>
                <div style={{ fontSize:13, color:"#0D1821", lineHeight:1.7, marginBottom:12 }}>{task.detail}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:"#56697C", fontWeight:800, letterSpacing:".07em", marginBottom:3 }}>OFFICE</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0D1821" }}>{task.office}</div>
                  </div>
                  <div style={{ background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:"#56697C", fontWeight:800, letterSpacing:".07em", marginBottom:3 }}>CONTACT</div>
                    <div style={{ fontSize:12, color:"#1A60A0", lineHeight:1.4 }}>{task.contact}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── GAINING SCREEN ───────────────────────────────────────────────────────────
function GainingScreen({ profile, theme }) {
  const [activeCat, setActiveCat] = useState("housing");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const load = useCallback(async (catId) => {
    if (results[catId]||loading[catId]) return;
    setLoading(p=>({...p,[catId]:true}));
    const {sys,user} = gainingPrompt(catId, profile);
    try {
      const text = await aiCall(sys, user);
      setResults(p=>({...p,[catId]:text}));
    } catch(e) { setErrors(p=>({...p,[catId]:e.message})); }
    finally { setLoading(p=>({...p,[catId]:false})); }
  }, [profile, results, loading]);

  useEffect(()=>{ load(activeCat); }, [activeCat]);
  const activeDef = GAINING_CATS.find(c=>c.id===activeCat);

  return (
    <div style={{ padding:"16px 16px 24px" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:18, fontWeight:900, color:"#0D1821", marginBottom:2 }}>Gaining installation</div>
        <div style={{ fontSize:12, color:"#56697C" }}>Arriving at {profile.gainingInstallation}</div>
      </div>

      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:6, marginBottom:16, scrollbarWidth:"none" }}>
        {GAINING_CATS.map(cat => {
          const isActive = activeCat===cat.id;
          const sColor = cat.isSpouse ? "#9B3060" : theme.primary;
          return (
            <button key={cat.id} onClick={()=>setActiveCat(cat.id)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:20, border:`1.5px solid ${isActive?sColor:"#E0E6EE"}`, background:isActive?sColor:"#FFFFFF", color:isActive?"#FFFFFF":"#56697C", fontSize:13, cursor:"pointer", fontWeight:isActive?800:500, whiteSpace:"nowrap", flexShrink:0 }}>
              <span style={{ fontSize:14 }}>{cat.emoji}</span>{cat.label}
              {results[cat.id]&&!isActive&&<span style={{ width:6,height:6,borderRadius:"50%",background:"#0F8A6A",display:"inline-block",marginLeft:2 }} />}
            </button>
          );
        })}
      </div>

      {activeCat==="spouse" && (
        <div style={{ background:"linear-gradient(135deg,#FCEAF2,#FFF5F8)", border:"1px solid #E0A0C0", borderRadius:12, padding:"13px 16px", marginBottom:14, display:"flex", gap:12, alignItems:"flex-start" }}>
          <span style={{ fontSize:22, flexShrink:0 }}>💛</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:"#6A1A40", marginBottom:3 }}>Spouse & family community</div>
            <div style={{ fontSize:12, color:"#9A3A60", lineHeight:1.5 }}>Find your people. Real clubs, groups, and events to help you connect at {profile.gainingInstallation.split(",")[0]}.</div>
          </div>
        </div>
      )}

      <Card theme={theme}>
        <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:14 }}>
          {activeDef?.emoji} {activeDef?.label?.toUpperCase()} · {profile.gainingInstallation.split(",")[0].toUpperCase()}
        </div>
        {loading[activeCat] && <Spinner accent={theme.accent} label={`Searching ${profile.gainingInstallation.split(",")[0]}…`} />}
        {errors[activeCat] && (
          <div>
            <div style={{ color:"#B83030", fontSize:13, marginBottom:8 }}>{errors[activeCat]}</div>
            <button onClick={()=>{setErrors(p=>({...p,[activeCat]:null}));load(activeCat);}} style={{ fontSize:13, color:"#1A60A0", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>Retry</button>
          </div>
        )}
        {results[activeCat]&&!loading[activeCat]&&<AiBlock text={results[activeCat]} theme={theme} />}
        {!results[activeCat]&&!loading[activeCat]&&!errors[activeCat]&&<Spinner accent={theme.accent} label="Loading…" />}
      </Card>
    </div>
  );
}

// ─── SPOUSE SCREEN ────────────────────────────────────────────────────────────
function SpouseScreen({ profile, theme }) {
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(()=>{
    if (res||loading) return;
    setLoading(true);
    const sys = `You are PCS Express helping a military spouse arriving at ${profile.gainingInstallation}. Be warm, specific, and practical. Many spouses arrive knowing nobody.`;
    const user = `Search for spouse and family community at ${profile.gainingInstallation}. Include: named spouse clubs (how to join, what they offer), FRGs, active Facebook groups for military spouses (name them), recurring community events for families, MSEP and spouse employment resources, mental health/wellness options, fun friend-making activities. Be warm and encouraging.`;
    aiCall(sys,user).then(t=>setRes(t)).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[]);

  const QUICK = [
    ["Military OneSource","Free counseling, relocation, financial help","militaryonesource.mil"],
    ["MSEP / MyCAA","Spouse scholarships and employment programs","mycaa.com"],
    ["Blue Star Families","Community, advocacy, military family research","bluestarfam.org"],
    ["USO Family Programs","Events, support, connection","uso.org/family"],
    ["Hiring Our Heroes","Spouse employment fellowships","hiringourheroes.org"],
  ];

  return (
    <div style={{ padding:"16px 16px 24px" }}>
      <div style={{ background:"linear-gradient(135deg,#6A1A3C,#9B3060)", borderRadius:16, padding:"20px", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:120, height:120, opacity:0.15 }} dangerouslySetInnerHTML={{ __html: theme.insignia }} />
        <div style={{ fontSize:24, marginBottom:8 }}>💛</div>
        <div style={{ fontSize:18, fontWeight:900, color:"#FFFFFF", marginBottom:4 }}>Spouse & family community</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.55 }}>Arriving at {profile.gainingInstallation.split(",")[0]}. Here's how to find your people.</div>
      </div>

      <Card style={{ marginBottom:14 }}>
        {loading && <Spinner accent="#9B3060" label={`Searching for spouse resources at ${profile.gainingInstallation.split(",")[0]}…`} />}
        {err && <div style={{ color:"#B83030", fontSize:13 }}>{err}</div>}
        {res && <AiBlock text={res} theme={{ ...theme, accent:"#9B3060", primary:"#6A1A3C" }} />}
      </Card>

      <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:10 }}>NATIONAL SPOUSE RESOURCES</div>
      {QUICK.map(([name,desc,url])=>(
        <div key={name} style={{ background:"#FFFFFF", border:"1px solid #E0E6EE", borderLeft:"3px solid #9B3060", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0D1821", marginBottom:2 }}>{name}</div>
          <div style={{ fontSize:12, color:"#56697C", marginBottom:3 }}>{desc}</div>
          <div style={{ fontSize:12, color:"#1A60A0", fontWeight:600 }}>{url}</div>
        </div>
      ))}
    </div>
  );
}

// ─── RESOURCES SCREEN ─────────────────────────────────────────────────────────
function ResourcesScreen({ profile, theme }) {
  const [tab, setTab] = useState("sell");
  const [aiR, setAiR] = useState({});
  const [aiL, setAiL] = useState({});
  const [aiE, setAiE] = useState({});

  const fetchAi = async (key, prompt) => {
    if (aiR[key]||aiL[key]) return;
    setAiL(p=>({...p,[key]:true}));
    const sys = `You are PCS Express helping a ${profile.branch} ${profile.component} service member departing from ${profile.losingInstallation}. Be specific and practical.`;
    try { const t = await aiCall(sys,prompt); setAiR(p=>({...p,[key]:t})); }
    catch(e) { setAiE(p=>({...p,[key]:e.message})); }
    finally { setAiL(p=>({...p,[key]:false})); }
  };

  useEffect(()=>{
    if (tab==="local") {
      fetchAi("cleaning", `Search for professional cleaning services near ${profile.losingInstallation} specializing in military PCS move-out. Include names, prices, contact info.`);
      fetchAi("gear", `Search for places near ${profile.losingInstallation} to buy missing military gear, TA-50, uniforms: CIF, AAFES, surplus stores. Include hours.`);
      if (profile.isOverseas) fetchAi("detail", `Search for vehicle detailing shops near ${profile.losingInstallation} familiar with VPC OCONUS export requirements.`);
    }
  }, [tab]);

  const TABS = [{ id:"sell",label:"Sell & offload"},{ id:"local",label:"Local services"},{ id:"orgs",label:"Support orgs"}];

  return (
    <div style={{ padding:"16px 16px 24px" }}>
      <div style={{ fontSize:18, fontWeight:900, color:"#0D1821", marginBottom:16 }}>Resources & support</div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 16px", borderRadius:20, border:`1.5px solid ${tab===t.id?theme.primary:"#E0E6EE"}`, background:tab===t.id?theme.primary:"#FFFFFF", color:tab===t.id?"#FFFFFF":"#56697C", fontSize:13, cursor:"pointer", fontWeight:tab===t.id?800:500 }}>{t.label}</button>
        ))}
      </div>

      {tab==="sell" && ["General","Vehicles","Electronics"].map(type=>(
        <div key={type} style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:8 }}>{type.toUpperCase()}</div>
          {SELL_RESOURCES.filter(r=>r.type===type).map(r=>(
            <Card key={r.name} style={{ marginBottom:8 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0D1821", marginBottom:3 }}>{r.name}</div>
              <div style={{ fontSize:13, color:"#56697C", lineHeight:1.6 }}>{r.desc}</div>
            </Card>
          ))}
        </div>
      ))}

      {tab==="local" && [
        ["cleaning","Professional cleaning"],
        profile.isOverseas&&["detail","Vehicle detailing (VPC export)"],
        ["gear","Gear & TA-50 stores"],
      ].filter(Boolean).map(([key,label])=>(
        <div key={key} style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:8 }}>{label.toUpperCase()}</div>
          <Card>
            {aiL[key]&&<Spinner accent={theme.accent} label={`Searching near ${profile.losingInstallation.split(",")[0]}…`} />}
            {aiE[key]&&<div style={{ color:"#B83030",fontSize:13 }}>{aiE[key]}</div>}
            {aiR[key]&&<AiBlock text={aiR[key]} theme={theme} />}
          </Card>
        </div>
      ))}

      {tab==="orgs" && ORGS.filter(o=>o.branch==="All"||o.branch===profile.branch||(profile.branch==="Marine Corps"&&o.branch==="Navy/USMC")).map(o=>(
        <Card key={o.name} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0D1821", marginBottom:3 }}>{o.name}</div>
              <div style={{ fontSize:13, color:"#56697C", marginBottom:4, lineHeight:1.5 }}>{o.desc}</div>
              <div style={{ fontSize:12, color:"#1A60A0", fontWeight:600 }}>{o.contact}</div>
            </div>
            <Tag label={o.branch} bg={o.branch==="All"?"#E0F5EF":"#E8F2FB"} color={o.branch==="All"?"#075740":"#0C3D6E"} />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── ASK SCREEN ───────────────────────────────────────────────────────────────
function AskScreen({ profile, theme }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const compStr = profile.component !== "Active Duty" ? ` ${profile.component}` : "";
  const CHIPS = [
    `TMO phone number at ${profile.losingInstallation.split(",")[0]}?`,
    `How do I request advance pay for PCS?`,
    profile.isOverseas ? `VPC requirements at ${profile.losingInstallation.split(",")[0]}` : "How do I file a PPM/DITY claim?",
    `BAH rate for ${profile.paygrade} at ${profile.gainingInstallation.split(",")[0]}?`,
    `In-processing steps at ${profile.gainingInstallation.split(",")[0]}`,
    profile.component !== "Active Duty" ? `PCS entitlements for ${profile.component}?` : "TLE reimbursement rules?",
  ];

  async function ask(question) {
    if (!question.trim()||loading) return;
    const uq = question.trim(); setQ("");
    setHistory(h=>[...h,{role:"user",text:uq}]);
    setLoading(true);
    const sys = `You are PCS Express, a PCS assistant for a ${profile.branch}${compStr} ${profile.paygrade} moving from ${profile.losingInstallation} to ${profile.gainingInstallation}${profile.isOverseas?" (OCONUS)":""}. Answer specifically with web-searched current info.`;
    try {
      const text = await aiCall(sys, uq);
      setHistory(h=>[...h,{role:"ai",text}]);
    } catch { setHistory(h=>[...h,{role:"ai",text:"Something went wrong — please try again."}]); }
    finally { setLoading(false); setTimeout(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),100); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100dvh - 126px)", padding:"16px 16px 0" }}>
      <div style={{ fontSize:18, fontWeight:900, color:"#0D1821", marginBottom:2 }}>Ask PCS Express</div>
      <div style={{ fontSize:12, color:"#56697C", marginBottom:14 }}>Web-searched answers for your specific move</div>

      <div style={{ flex:1, overflowY:"auto", paddingBottom:12 }}>
        {history.length===0 && (
          <div>
            <div style={{ background:"#F3F5F8", borderRadius:12, padding:"16px", marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:14, color:"#56697C" }}>Ask anything about your PCS</div>
              <div style={{ fontSize:12, color:"#56697C", marginTop:3 }}>Offices · BAH rates · Timelines · In-processing · Entitlements</div>
            </div>
            <div style={{ fontSize:10, fontWeight:800, color:"#56697C", letterSpacing:".1em", marginBottom:8 }}>QUICK QUESTIONS</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {CHIPS.map(chip=>(
                <button key={chip} onClick={()=>ask(chip)} style={{ fontSize:12, padding:"8px 12px", borderRadius:20, border:"1px solid #E0E6EE", background:"#FFFFFF", color:"#0D1821", cursor:"pointer", textAlign:"left", lineHeight:1.3 }}>{chip.length>50?chip.slice(0,50)+"…":chip}</button>
              ))}
            </div>
          </div>
        )}
        {history.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:12 }}>
            <div style={{ maxWidth:"85%", background:m.role==="user"?theme.primary:"#FFFFFF", border:`1px solid ${m.role==="user"?theme.primary:"#E0E6EE"}`, borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"11px 14px" }}>
              {m.role==="ai" ? <AiBlock text={m.text} theme={theme} /> : <div style={{ fontSize:14, color:"#FFFFFF" }}>{m.text}</div>}
            </div>
          </div>
        ))}
        {loading && <div style={{ display:"flex", marginBottom:12 }}><div style={{ background:"#FFFFFF", border:"1px solid #E0E6EE", borderRadius:"4px 16px 16px 16px", padding:"11px 14px" }}><Spinner accent={theme.accent} /></div></div>}
        <div ref={endRef} />
      </div>

      <div style={{ paddingBottom:16, paddingTop:10, borderTop:"1px solid #E0E6EE", background:"#F3F5F8", marginLeft:-16, marginRight:-16, paddingLeft:16, paddingRight:16 }}>
        <div style={{ display:"flex", gap:10 }}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)} placeholder="Ask anything about your PCS…" style={{ flex:1, fontSize:14, padding:"11px 14px", borderRadius:24, border:"1.5px solid #D0DAE8", background:"#FFFFFF", color:"#0D1821", outline:"none" }} />
          <button onClick={()=>ask(q)} disabled={!q.trim()||loading} style={{ width:46, height:46, borderRadius:"50%", background:q.trim()&&!loading?theme.primary:"#E0E6EE", color:q.trim()&&!loading?"#FFFFFF":"#56697C", border:"none", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:700 }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
const BOTTOM_NAV = [
  { id:"home",      label:"Home",      icon:"◈" },
  { id:"outgoing",  label:"Checklist", icon:"✓" },
  { id:"gaining",   label:"Arriving",  icon:"↓" },
  { id:"resources", label:"Resources", icon:"◉" },
  { id:"ask",       label:"Ask",       icon:"?" },
];

export default function App() {
  const [profile, setProfile] = useState(() => store.get("pcs_profile"));
  const [tasks, setTasks] = useState(() => store.get("pcs_tasks") || []);
  const [screen, setScreen] = useState("home");

  const theme = BRANCH_THEMES[profile?.branch] || BRANCH_THEMES["Army"];

  // Persist to localStorage
  useEffect(() => { if (profile) store.set("pcs_profile", profile); }, [profile]);
  useEffect(() => { if (tasks.length) store.set("pcs_tasks", tasks); }, [tasks]);

  function complete(p) {
    setProfile(p);
    const built = buildTasks(p.rnltd, p.isOverseas, p.hasChildren);
    setTasks(built);
    store.set("pcs_profile", p);
    store.set("pcs_tasks", built);
    setScreen("home");
  }

  function reset() {
    store.set("pcs_profile", null);
    store.set("pcs_tasks", []);
    setProfile(null);
    setTasks([]);
    setScreen("home");
  }

  if (!profile) return <Onboarding onComplete={complete} />;

  const done = tasks.filter(t=>t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round(done/total*100) : 0;

  const persistTasks = (updater) => {
    setTasks(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      store.set("pcs_tasks", next);
      return next;
    });
  };

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100dvh", background:"#F3F5F8", fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column", position:"relative" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        input,select,button{font-family:inherit}
        ::-webkit-scrollbar{display:none}
        select{-webkit-appearance:none}
      `}</style>

      {/* Sticky top bar */}
      <div style={{ background:theme.secondary, padding:"13px 18px 11px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:200, borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ position:"relative", overflow:"hidden", flex:1 }}>
          <div style={{ position:"absolute", right:-10, top:-14, width:70, height:70, opacity:0.08, color:theme.accent }}
            dangerouslySetInnerHTML={{ __html: theme.insignia }} />
          <div style={{ fontSize:10, letterSpacing:".18em", color:theme.accent, fontWeight:800 }}>✦ PCS EXPRESS · {theme.abbr}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:1 }}>
            {profile.losingInstallation.split(",")[0]} → {profile.gainingInstallation.split(",")[0]}
          </div>
        </div>
        <div style={{ textAlign:"right", marginLeft:12 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:3, fontWeight:600 }}>{pct}% done</div>
          <div style={{ width:72, height:4, borderRadius:4, background:"rgba(255,255,255,0.12)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#1A9E75":theme.accent, borderRadius:4, transition:"width .3s" }} />
          </div>
          <button onClick={reset} style={{ fontSize:10, color:"rgba(255,255,255,0.3)", background:"none", border:"none", cursor:"pointer", marginTop:4, padding:0 }}>Edit profile</button>
        </div>
      </div>

      {/* Screen content */}
      <div style={{ flex:1, overflowY:"auto" }}>
        {screen==="home"       && <HomeScreen     profile={profile} tasks={tasks} onNav={setScreen} theme={theme} />}
        {screen==="outgoing"   && <ChecklistScreen profile={profile} tasks={tasks} setTasks={persistTasks} theme={theme} />}
        {screen==="gaining"    && <GainingScreen  profile={profile} theme={theme} />}
        {screen==="spouse"     && <SpouseScreen   profile={profile} theme={theme} />}
        {screen==="resources"  && <ResourcesScreen profile={profile} theme={theme} />}
        {screen==="ask"        && <AskScreen      profile={profile} theme={theme} />}
      </div>

      {/* Bottom nav */}
      <div style={{ background:"#FFFFFF", borderTop:"1px solid #E0E6EE", display:"flex", flexShrink:0, position:"sticky", bottom:0, zIndex:200 }}>
        {BOTTOM_NAV.map(item => {
          const active = screen===item.id || (screen==="spouse"&&item.id==="gaining");
          return (
            <button key={item.id} onClick={()=>setScreen(item.id)} style={{ flex:1, padding:"9px 4px 11px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"transparent", cursor:"pointer" }}>
              <div style={{ fontSize:15, lineHeight:1, color:active?theme.primary:"#9AAABB", fontWeight:active?800:500 }}>{item.icon}</div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".05em", color:active?theme.primary:"#9AAABB" }}>{item.label.toUpperCase()}</div>
              {active && <div style={{ width:18, height:2, borderRadius:1, background:theme.accent }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
