const PCS_CHECKLIST = {
  "pre-move": [
    "Notify current command of PCS move",
    "Contact gaining installation's in-processing office",
    "Schedule household goods pickup",
    "Set up utilities at new location",
    "Update address with USPS",
    "Arrange temporary lodging if needed",
    "Transfer medical records",
    "Schedule vehicle inspection and registration",
    "Update insurance policies",
    "Notify banks and creditors of address change",
  ],
  "during-move": [
    "Ensure all household goods are packed correctly",
    "Take photos of high-value items",
    "Keep important documents with you",
    "Track shipment status",
    "Verify all boxes are labeled and inventoried",
    "Check vehicle before departure",
  ],
  "post-move": [
    "Report to gaining installation",
    "Complete in-processing checklist",
    "Register vehicle at new location",
    "Establish new medical care providers",
    "Enroll children in new schools",
    "Update military ID address",
    "File final move report",
    "Request itemized household goods inventory",
    "Update address with benefits providers",
  ],
};

const SCHOOL_RESOURCES = {
  "general": [
    { name: "Military Child Education Coalition", url: "https://www.militarychild.org", desc: "Education support for military-connected children" },
    { name: "State Departments of Education", url: "https://www2.ed.gov/about/contacts/state/", desc: "Find state education offices" },
    { name: "Great Schools", url: "https://www.greatschools.org", desc: "School ratings and information" },
    { name: "Military OneSource Education", url: "https://www.militaryonesource.mil", desc: "Educational resources for military families" },
  ],
};const INSTALLATION_UNITS = {
  "Fort Liberty": {
    "Army": ["XVIII Airborne Corps", "1st Special Forces Command", "525th Expeditionary Military Intelligence Brigade", "101st Airborne Division"],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Fort Bliss": {
    "Army": ["1st Armored Division", "32nd Army Air and Missile Defense Command", "46th Military Police Command"],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": ["Air Defense Artillery Center of Excellence"],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Fort Campbell": {
    "Army": ["101st Airborne Division (Air Assault)", "Special Operations Command Central"],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Fort Carson": {
    "Army": ["United States Army Space and Missile Defense Command", "4th Infantry Division", "garrison units"],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Fort Drum": {
    "Army": ["10th Mountain Division", "Fort Drum Garrison"],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Naval Station Norfolk": {
    "Army": [],
    "Navy": ["U.S. Fleet Forces Command", "Naval Station Norfolk Commander", "Carrier Strike Groups", "Naval Air Force Atlantic"],
    "Marine Corps": ["2nd Marine Aircraft Wing"],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Naval Base San Diego": {
    "Army": [],
    "Navy": ["Navy Region Southwest", "Third Fleet", "Carrier Strike Groups", "Submarine Forces"],
    "Marine Corps": ["1st Marine Division", "3rd Marine Expeditionary Force"],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Camp Pendleton": {
    "Army": [],
    "Navy": [],
    "Marine Corps": ["1st Marine Division", "I Marine Expeditionary Force", "Marine Aircraft Group 16"],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Camp Lejeune": {
    "Army": [],
    "Navy": [],
    "Marine Corps": ["2nd Marine Division", "II Marine Expeditionary Force", "Marine Expeditionary Force Training Command"],
    "Air Force": [],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Lackland AFB": {
    "Army": [],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": ["37th Training Wing", "Air Education and Training Command"],
    "Space Force": [],
    "Coast Guard": [],
  },
  "Nellis AFB": {
    "Army": [],
    "Navy": [],
    "Marine Corps": [],
    "Air Force": ["57th Wing", "U.S. Air Force Warfare Center", "99th Air Base Wing"],
    "Space Force": [],
    "Coast Guard": [],
  },
};import { useState, useEffect, useCallback, useRef } from "react";

const MILITARY_BASES = [
  { name: "Fort Liberty", state: "NC", branch: "Army", country: "USA" },
  { name: "Fort Bliss", state: "TX", branch: "Army", country: "USA" },
  { name: "Fort Campbell", state: "KY", branch: "Army", country: "USA" },
  { name: "Fort Carson", state: "CO", branch: "Army", country: "USA" },
  { name: "Fort Drum", state: "NY", branch: "Army", country: "USA" },
  { name: "Naval Station Norfolk", state: "VA", branch: "Navy", country: "USA" },
  { name: "Naval Base San Diego", state: "CA", branch: "Navy", country: "USA" },
  { name: "Camp Pendleton", state: "CA", branch: "Marine Corps", country: "USA" },
  { name: "Camp Lejeune", state: "NC", branch: "Marine Corps", country: "USA" },
  { name: "Lackland AFB", state: "TX", branch: "Air Force", country: "USA" },
  { name: "Nellis AFB", state: "NV", branch: "Air Force", country: "USA" },
];

const BRANCH_THEMES = {
  "Army": { primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", light: "#F0EDD8", text: "#1A2200", subtext: "#5A6E30", name: "Army", abbr: "USA" },
  "Navy": { primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", light: "#E8ECF8", text: "#050E2A", subtext: "#3A4A7A", name: "Navy", abbr: "USN" },
  "Marine Corps": { primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", light: "#F5E8E8", text: "#2A0000", subtext: "#7A2A2A", name: "Marines", abbr: "USMC" },
  "Air Force": { primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", light: "#E8F2FA", text: "#031525", subtext: "#2A4A6A", name: "Air Force", abbr: "USAF" },
  "Space Force": { primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", light: "#E8EEFA", text: "#05051E", subtext: "#3A3A6A", name: "Space Force", abbr: "USSF" },
  "Coast Guard": { primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", light: "#E8F4FA", text: "#001E3A", subtext: "#1A4A6A", name: "Coast Guard", abbr: "USCG" },
};

const BRANCH_CONTENT = {
  "Army": { s1: "Human Resources (S1)", finance: "Finance Office", tmo: "Transportation Management Office", medical: "MTF", housing: "Army Housing" },
  "Navy": { s1: "Command Career Counselor (CCC)", finance: "Navy Finance Center", tmo: "Fleet Logistics Center", medical: "Naval Medical", housing: "Navy Gateway" },
  "Marine Corps": { s1: "Personnel Office", finance: "Marine Corps Finance", tmo: "Movement Control Team", medical: "Naval Medical", housing: "Base Housing" },
  "Air Force": { s1: "Military Personnel Flight (MPF)", finance: "Air Force Finance", tmo: "Air Mobility Command", medical: "Air Force Clinic", housing: "Air Force Housing" },
  "Space Force": { s1: "Guardian Personnel Mgmt", finance: "Space Force Finance", tmo: "Space Mobility", medical: "Space Force Medical", housing: "Space Force Housing" },
  "Coast Guard": { s1: "Personnel Office", finance: "CG Finance Center", tmo: "Transportation", medical: "CG Medical", housing: "CG Housing" },
};

const BRANCH_RESOURCES = {
  "Army": {
    Housing: [
      { name: "Army Housing Online", url: "https://housing.army.mil", desc: "Official Army housing management system for on-post and BAH information" },
      { name: "BAH Calculator", url: "https://militarypay.defense.gov", desc: "Calculate Basic Allowance for Housing based on rank and location" },
      { name: "Army Communities of Excellence", url: "https://www.arcoe.army.mil", desc: "Army Family housing programs and relocation support" },
    ],
    Finance: [
      { name: "Army Finance Office", url: "https://armypubs.army.mil", desc: "Pay statements, allowances, and financial forms for Army personnel" },
      { name: "Military Pay Overview", url: "https://militarypay.defense.gov", desc: "DoD pay scales and allowance information for all ranks" },
      { name: "Leave and Earnings Statement", url: "https://myarmybenefits.us.army.mil", desc: "Access your LES and manage Army benefits online" },
    ],
    "Family Services": [
      { name: "Army Community Service", url: "https://www.armyonesource.mil", desc: "Free counseling, financial planning, and family support services" },
      { name: "Military Family Readiness", url: "https://www.militaryonesource.mil", desc: "24/7 support for military families including deployment assistance" },
      { name: "Spouse Employment Support", url: "https://www.seco.org", desc: "Military Spouse Employment Partnership Program with major employers" },
    ],
    Medical: [
      { name: "TRICARE", url: "https://www.tricare.mil", desc: "Comprehensive health insurance for active duty and families" },
      { name: "Army Medical Command", url: "https://www.army.mil/medcom", desc: "Army medical facilities and healthcare provider directory" },
      { name: "Find Military Hospitals", url: "https://www.tricare.mil/FindCare", desc: "Locate MTF and civilian TRICARE providers" },
    ],
  },
  "Navy": {
    Housing: [
      { name: "Navy Housing Office", url: "https://www.cnic.navy.mil/ffsc/family-readiness/housing.html", desc: "Naval Consolidated Command housing information and BAH rates" },
      { name: "BAH/BAS Information", url: "https://www.dfas.mil", desc: "Basic Allowance Housing and Subsistence rates for Navy personnel" },
      { name: "Navy Gateway Relocation Program", url: "https://www.navygateway.org", desc: "Comprehensive moving and housing relocation support" },
    ],
    Finance: [
      { name: "Navy Finance", url: "https://www.dfas.mil", desc: "Navy pay and entitlements administration" },
      { name: "Military Pay", url: "https://militarypay.defense.gov", desc: "Pay scales, basic allowances, and compensation" },
      { name: "Navy Benefits Portal", url: "https://www.navy.mil/Benefits", desc: "Complete Navy benefits package including PCS allowances" },
    ],
    "Family Services": [
      { name: "Navy OneSource", url: "https://www.militaryonesource.mil", desc: "Counseling, childcare referrals, and family support services" },
      { name: "Fleet and Family Support Center", url: "https://www.cnic.navy.mil/ffsc", desc: "Navy family readiness programs and command sponsorship" },
      { name: "Spouse Career Support", url: "https://www.seco.org", desc: "Employment assistance for military spouses" },
    ],
    Medical: [
      { name: "TRICARE For Navy", url: "https://www.tricare.mil", desc: "Navy-specific TRICARE health insurance and benefits" },
      { name: "Navy Medicine", url: "https://www.navy.mil/Medicine", desc: "Naval hospitals and medical clinics worldwide" },
      { name: "Find Military Care Providers", url: "https://www.tricare.mil/FindCare", desc: "Locate Navy Medical facilities and civilian providers" },
    ],
  },
  "Marine Corps": {
    Housing: [
      { name: "Marine Corps Housing", url: "https://www.mcieast.marines.mil/Housing", desc: "On-post housing and Family Readiness programs" },
      { name: "BAH Information", url: "https://www.dfas.mil", desc: "Marine Corps Basic Allowance for Housing rates by location" },
      { name: "Base Housing Directory", url: "https://www.marines.mil", desc: "Marine Corps base housing and relocation resources" },
    ],
    Finance: [
      { name: "Marine Corps Finance", url: "https://www.dfas.mil", desc: "Pay and allowances for Marine Corps personnel" },
      { name: "Military Pay System", url: "https://militarypay.defense.gov", desc: "Marine Corps compensation and pay scales" },
      { name: "Pay and Allowances", url: "https://www.marines.mil/Benefits", desc: "Complete guide to Marine Corps entitlements" },
    ],
    "Family Services": [
      { name: "Marine Corps OneSource", url: "https://www.militaryonesource.mil", desc: "Counseling and support services for Marine families" },
      { name: "Marine Corps Family Services", url: "https://www.mccs.marines.mil", desc: "MWR programs and family support services" },
      { name: "Spouse Support Programs", url: "https://www.seco.org", desc: "Military spouse employment and career development" },
    ],
    Medical: [
      { name: "TRICARE", url: "https://www.tricare.mil", desc: "Healthcare for active duty Marines and families" },
      { name: "Naval Hospital Listings", url: "https://www.tricare.mil/FindCare", desc: "Marine Corps and Navy medical facilities" },
      { name: "Marine Medicine", url: "https://www.marines.mil/Health", desc: "Marine Corps medical services and clinics" },
    ],
  },
  "Air Force": {
    Housing: [
      { name: "Air Force Housing", url: "https://www.af.mil/About-Us/Fact-Sheets/Display/Article/145845/air-force-housing", desc: "Official Air Force housing programs and BAH information" },
      { name: "BAH Calculator", url: "https://www.dfas.mil", desc: "Calculate Basic Allowance for Housing by rank and duty station" },
      { name: "Base Housing Directory", url: "https://www.af.mil", desc: "Air Force base housing and relocation support" },
    ],
    Finance: [
      { name: "Air Force Finance", url: "https://www.dfas.mil", desc: "Air Force pay and financial services" },
      { name: "Military Pay Info", url: "https://militarypay.defense.gov", desc: "Air Force compensation and allowances" },
      { name: "Air Force Benefits", url: "https://www.af.mil/Benefits", desc: "Complete Air Force entitlements and benefits guide" },
    ],
    "Family Services": [
      { name: "Air Force OneSource", url: "https://www.militaryonesource.mil", desc: "Counseling and family support for Air Force families" },
      { name: "Air Force Family Readiness", url: "https://www.afcrossroads.com", desc: "Air Force family programs and community resources" },
      { name: "Spouse Employment", url: "https://www.seco.org", desc: "Military spouse job placement and career support" },
    ],
    Medical: [
      { name: "TRICARE", url: "https://www.tricare.mil", desc: "Healthcare coverage for Air Force personnel and families" },
      { name: "Air Force Medical", url: "https://www.af.mil/News/Article-Display/Article/145845", desc: "Air Force medical services and clinic information" },
      { name: "Find Military Care", url: "https://www.tricare.mil/FindCare", desc: "Locate Air Force bases and TRICARE providers" },
    ],
  },
  "Space Force": {
    Housing: [
      { name: "Space Force Housing", url: "https://www.spaceforce.mil/About-Us/Fact-Sheets", desc: "Guardian housing programs and base information" },
      { name: "BAH Information", url: "https://www.dfas.mil", desc: "Space Force Basic Allowance for Housing rates" },
      { name: "Base Directory", url: "https://www.spaceforce.mil/About-Us/Installations", desc: "Space Force installations and housing locations" },
    ],
    Finance: [
      { name: "Space Force Finance", url: "https://www.dfas.mil", desc: "Guardian pay and financial management" },
      { name: "Military Pay", url: "https://militarypay.defense.gov", desc: "Space Force compensation and allowances" },
      { name: "Guardian Benefits", url: "https://www.spaceforce.mil/Benefits", desc: "Complete Space Force benefits package" },
    ],
    "Family Services": [
      { name: "Space Force OneSource", url: "https://www.militaryonesource.mil", desc: "Family counseling and support for Guardians" },
      { name: "Space Force Family Support", url: "https://www.spaceforce.mil", desc: "Guardian family programs and resources" },
      { name: "Career Resources", url: "https://www.seco.org", desc: "Spouse employment and career development" },
    ],
    Medical: [
      { name: "TRICARE", url: "https://www.tricare.mil", desc: "Guardian healthcare and family coverage" },
      { name: "Space Force Medical", url: "https://www.spaceforce.mil", desc: "Guardian medical services" },
      { name: "Care Providers", url: "https://www.tricare.mil/FindCare", desc: "Find TRICARE and Space Force medical facilities" },
    ],
  },
  "Coast Guard": {
    Housing: [
      { name: "Coast Guard Housing", url: "https://www.cg.mil/Our-Organization/District-Force-Readiness/Personnel-And-Family-Readiness", desc: "Coast Guard housing programs and family relocation" },
      { name: "BAH/BAS", url: "https://www.dfas.mil", desc: "Coast Guard Basic Allowance Housing and Subsistence" },
      { name: "Base Housing", url: "https://www.cg.mil", desc: "Coast Guard base housing directory and information" },
    ],
    Finance: [
      { name: "Coast Guard Finance", url: "https://www.dfas.mil", desc: "Coast Guard pay and entitlements" },
      { name: "Military Pay", url: "https://militarypay.defense.gov", desc: "Coast Guard compensation structure" },
      { name: "Benefits Overview", url: "https://www.cg.mil/Pay-and-Benefits", desc: "Complete Coast Guard benefits guide" },
    ],
    "Family Services": [
      { name: "Coast Guard OneSource", url: "https://www.militaryonesource.mil", desc: "Family counseling and support services" },
      { name: "Family Support", url: "https://www.cg.mil/Our-Organization/District-Force-Readiness/Personnel-And-Family-Readiness", desc: "Coast Guard family programs and readiness" },
      { name: "Spouse Programs", url: "https://www.seco.org", desc: "Military spouse employment assistance" },
    ],
    Medical: [
      { name: "TRICARE", url: "https://www.tricare.mil", desc: "Coast Guard healthcare and family insurance" },
      { name: "Coast Guard Medicine", url: "https://www.cg.mil/Our-Organization/District-Force-Readiness", desc: "Coast Guard medical services and clinics" },
      { name: "Healthcare Facilities", url: "https://www.tricare.mil/FindCare", desc: "Find Coast Guard and TRICARE medical providers" },
    ],
  },
};

const ALL_UNITS = [
  "1st Infantry Division", "2nd Infantry Division", "3rd Infantry Division", "4th Infantry Division", "10th Mountain Division",
  "101st Airborne Division", "82nd Airborne Division", "25th Infantry Division", "24th Marine Expeditionary Unit",
  "2nd Marine Division", "1st Marine Division", "3rd Marine Division", "1st Air Force", "2nd Air Force", "Pacific Air Forces",
  "United States Naval Forces Europe", "Seventh Fleet", "Second Fleet", "Naval Air Forces", "Fleet Forces Command",
  "U.S. Army Pacific", "U.S. Army Europe", "U.S. Army Central", "U.S. Army South", "U.S. Army Special Operations Command",
  "Naval Special Warfare Command", "Air Force Special Operations Command", "Marine Corps Special Operations Command",
  "United States Northern Command", "United States Southern Command", "United States European Command",
  "United States Transportation Command", "United States Cyber Command", "United States Space Command",
].sort();

const COMPONENT_TYPES = ["Active Duty", "Reserve", "National Guard", "AGR", "FTNG"];

const VETERAN_BUSINESSES = {
  "Army": [
    { name: "AAFES (Army Air Force Exchange)", services: "Tax-free shopping, PCS discounts, military gear", url: "https://www.shopmyexchange.com", icon: "🛍️" },
    { name: "VetFran - IFA", services: "Veteran franchise opportunities and support", url: "https://www.franchisee.com/veteran-franchises/", icon: "🤝" },
    { name: "Hire Heroes USA", services: "Job placement and career coaching for veterans", url: "https://www.hireheroesusa.org", icon: "🎯" },
    { name: "Operation Homefront", services: "Emergency financial assistance and housing", url: "https://www.operationhomefront.org", icon: "🏠" },
  ],
  "Navy": [
    { name: "Navy Exchange", services: "Military retail and shopping benefits", url: "https://www.mynavyexchange.com", icon: "🛍️" },
    { name: "The Sailor's Child Foundation", services: "Educational support for Navy families", url: "https://www.sailorschildfoundation.org", icon: "📚" },
    { name: "Hire Heroes USA", services: "Career placement for military members", url: "https://www.hireheroesusa.org", icon: "🎯" },
    { name: "Team Red White & Blue", services: "Veteran wellness and community programs", url: "https://www.teamrwb.org", icon: "💪" },
  ],
  "Marine Corps": [
    { name: "Marine Corps Exchange", services: "Military shopping and PCS discounts", url: "https://www.shopmyexchange.com", icon: "🛍️" },
    { name: "Semper Fi Fund", services: "Financial assistance for Marines and families", url: "https://www.semperfifund.org", icon: "💰" },
    { name: "Hire Heroes USA", services: "Employment support for veterans", url: "https://www.hireheroesusa.org", icon: "🎯" },
    { name: "Wounded Warrior Project", services: "Support and programs for wounded warriors", url: "https://www.woundedwarriorproject.org", icon: "🎖️" },
  ],
  "Air Force": [
    { name: "Air Force Exchange", services: "Military retail benefits and discounts", url: "https://www.shopmyexchange.com", icon: "🛍️" },
    { name: "Fisher House Foundation", services: "Housing for military families during medical care", url: "https://www.fisherhouse.org", icon: "🏡" },
    { name: "Hire Heroes USA", services: "Job coaching and placement services", url: "https://www.hireheroesusa.org", icon: "🎯" },
    { name: "Air Force Aid Society", services: "Emergency assistance for Air Force families", url: "https://www.afas.org", icon: "🆘" },
  ],
  "Space Force": [
    { name: "Air Force Exchange (AAFES)", services: "Military shopping and discounts", url: "https://www.shopmyexchange.com", icon: "🛍️" },
    { name: "Hire Heroes USA", services: "Career transition support for Space Force", url: "https://www.hireheroesusa.org", icon: "🎯" },
    { name: "Veterans Community Living Centers", services: "Housing and community for veterans", url: "https://www.va.gov/housing-support/", icon: "🏘️" },
    { name: "Give an Hour", services: "Free mental health services for veterans", url: "https://www.giveanhour.org", icon: "💙" },
  ],
  "Coast Guard": [
    { name: "Coast Guard Exchange", services: "Military retail and PCS benefits", url: "https://www.shopmyexchange.com", icon: "🛍️" },
    { name: "Coast Guard Mutual Assistance", services: "Financial aid for Coast Guard members", url: "https://www.cgmahq.org", icon: "🤝" },
    { name: "Hire Heroes USA", services: "Employment assistance for veterans", url: "https://www.hireheroesusa.org", icon: "🎯" },
    { name: "American Legion", services: "Veteran benefits, advocacy, and community", url: "https://www.legion.org", icon: "🎖️" },
  ],
};

const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

async function aiCall(system, user) {
  const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, user }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data.text;
}

function BranchInsignia({ branch, theme, size = 200 }) {
  const color = theme.accent;
  const insignias = {
    "Army": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.08" fill="none" stroke="${color}" stroke-width="2"><circle cx="100" cy="100" r="80"/><polygon points="100,20 115,65 165,65 124,95 138,140 100,110 62,140 76,95 35,65 85,65"/></g></svg>`,
    "Navy": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.08" fill="none" stroke="${color}" stroke-width="2"><circle cx="100" cy="100" r="80"/><path d="M100,30 L120,70 L165,70 L130,100 L150,140 L100,110 L50,140 L70,100 L35,70 L80,70Z"/></g></svg>`,
    "Marine Corps": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.08" fill="none" stroke="${color}" stroke-width="2"><circle cx="100" cy="100" r="80"/><ellipse cx="100" cy="100" rx="50" ry="70"/><line x1="70" y1="100" x2="130" y2="100"/></g></svg>`,
    "Air Force": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.08" fill="none" stroke="${color}" stroke-width="2"><circle cx="100" cy="100" r="80"/><path d="M30,120 Q100,40 170,80"/><polygon points="100,50 110,80 140,70 100,100 70,70"/></g></svg>`,
    "Space Force": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.08" fill="none" stroke="${color}" stroke-width="2"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="40"/><circle cx="100" cy="60" r="6" fill="${color}"/><circle cx="140" cy="110" r="4" fill="${color}"/></g></svg>`,
    "Coast Guard": `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity="0.08" fill="none" stroke="${color}" stroke-width="2"><circle cx="100" cy="100" r="80"/><path d="M100,30 L125,80 L175,80 L135,115 L155,165 L100,130 L45,165 L65,115 L25,80 L75,80Z"/></g></svg>`,
  };
  return <div dangerouslySetInnerHTML={{ __html: insignias[branch] }} style={{ position: "absolute", right: -50, top: -50, width: size, height: size }} />;
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [losingSearch, setLosingSearch] = useState("");
  const [gainingSearch, setGainingSearch] = useState("");
  const [p, setP] = useState({
    firstName:"", lastName:"", branch:"Army", component:"Active Duty", paygrade:"E-5",
    losingInstallation:"", gainingInstallation:"", departingDate:"", unit:"",
    isOverseas:false, hasDependents:false, hasChildren:false, childAges:[], bedrooms:"3",
  });
  
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  // When branch changes, reset unit (and clear gaining search if the installation no longer has units for the new branch)
  const updBranch = (branch) => setP(prev => ({ ...prev, branch, unit: "" }));
  // When gaining installation changes, reset unit so stale selections don't persist
  const updGainingInstallation = (installation) => {
    setP(prev => ({ ...prev, gainingInstallation: installation, unit: "" }));
  };
  const theme = BRANCH_THEMES[p.branch];
  const losingSuggestions = losingSearch.length > 1
    ? MILITARY_BASES.filter(b => b.name.toLowerCase().includes(losingSearch.toLowerCase())).slice(0, 8)
    : [];
  const gainingSuggestions = gainingSearch.length > 1
    ? MILITARY_BASES.filter(b => b.name.toLowerCase().includes(gainingSearch.toLowerCase())).slice(0, 8)
    : [];
  const availableUnits = p.gainingInstallation && INSTALLATION_UNITS[p.gainingInstallation]
    ? (INSTALLATION_UNITS[p.gainingInstallation][p.branch] || [])
    : [];
  const inputSt = { width:"100%", fontSize:15, padding:"12px 14px", borderRadius:10, border:`1px solid rgba(255,255,255,0.15)`, background:"rgba(0,0,0,0.25)", color:"#FFFFFF", outline:"none", boxSizing:"border-box" };
  const canGo1 = p.firstName && p.branch && p.paygrade && p.component;
  const canGo2 = p.losingInstallation && p.gainingInstallation && p.departingDate;

  return (
    <div style={{ minHeight:"100dvh", background:theme.secondary, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <style>{`* {box-sizing:border-box}
        .onboarding-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><pattern id="insignia-pattern" patternUnits="userSpaceOnUse" width="600" height="600"><circle cx="300" cy="300" r="200" fill="none" stroke="currentColor" stroke-width="3" opacity="0.12"/><path d="M300,100 L330,200 L450,200 L360,270 L400,370 L300,310 L200,370 L240,270 L150,200 L270,200Z" fill="none" stroke="currentColor" stroke-width="3" opacity="0.12"/></pattern></defs><rect width="600" height="600" fill="url(%23insignia-pattern)" style="color: ${theme.accent}"/></svg>'); background-size: 600px 600px; opacity: 0.15; pointer-events: none; z-index: 0; }
      `}</style>
      <div className="onboarding-bg"></div>

      <div style={{ padding:"40px 40px 20px", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:12, letterSpacing:".2em", color:theme.accent, marginBottom:10, fontWeight:800 }}>✦ PCS EXPRESS · {theme.abbr} ✦</div>
        <div style={{ fontSize:42, fontWeight:900, color:"#FFFFFF", lineHeight:1.2 }}>Your move,<br/><span style={{ color:theme.accent }}>simplified.</span></div>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.6)", marginTop:12 }}>PCS guidance tailored to your branch</p>
      </div>

      <div style={{ flex:1, padding:"40px", maxWidth:600, margin:"0 auto", width:"100%" }}>
        <div style={{ background:"rgba(0,0,0,0.35)", backdropFilter:"blur(10px)", borderRadius:20, border:"1px solid rgba(255,255,255,0.12)", padding:"32px", position:"relative", zIndex:1 }}>

          {step === 0 && <>
            <div style={{ fontSize:24, fontWeight:900, color:"#FFFFFF", marginBottom:20 }}>Branch & Profile</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
              {Object.keys(BRANCH_THEMES).map(b => {
                const t = BRANCH_THEMES[b];
                const active = p.branch === b;
                return (
                  <button key={b} onClick={() => updBranch(b)} style={{ padding:"16px", borderRadius:12, border:`2px solid ${active ? t.accent : "rgba(255,255,255,0.15)"}`, background: active ? t.accent + "30" : "rgba(255,255,255,0.04)", color: active ? t.accent : "rgba(255,255,255,0.5)", fontSize:14, fontWeight:active?800:500, cursor:"pointer" }}>
                    {t.abbr}
                  </button>
                );
              })}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>FIRST NAME</label><input value={p.firstName} onChange={e=>upd("firstName",e.target.value)} placeholder="Jordan" style={inputSt} /></div>
              <div><label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>LAST NAME</label><input value={p.lastName} onChange={e=>upd("lastName",e.target.value)} placeholder="Rivera" style={inputSt} /></div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>COMPONENT</label>
              <select value={p.component} onChange={e=>upd("component",e.target.value)} style={inputSt}>
                {COMPONENT_TYPES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>PAY GRADE</label>
              <select value={p.paygrade} onChange={e=>upd("paygrade",e.target.value)} style={inputSt}>
                {["E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8","E-9","W-1","W-2","O-1","O-2","O-3","O-4","O-5","O-6"].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>

            <button onClick={()=>setStep(1)} disabled={!canGo1} style={{ width:"100%", padding:"14px", borderRadius:12, background:canGo1?theme.accent:"rgba(255,255,255,0.1)", color:canGo1?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:16, fontWeight:900, cursor:canGo1?"pointer":"not-allowed" }}>Continue →</button>
          </>}

          {step === 1 && (
            <>
              <div style={{ fontSize:24, fontWeight:900, color:"#FFFFFF", marginBottom:20 }}>Your Bases</div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>DEPARTING FROM</label>
                <input
                  value={losingSearch || p.losingInstallation}
                  onChange={e => { setLosingSearch(e.target.value); upd("losingInstallation", e.target.value); }}
                  placeholder="Type base name..."
                  style={inputSt}
                />
                {losingSuggestions.length > 0 && (
                  <div style={{ marginTop:8, background:"rgba(0,0,0,0.2)", borderRadius:10, maxHeight:200, overflowY:"auto" }}>
                    {losingSuggestions.map(b => (
                      <div key={b.name} onClick={() => { upd("losingInstallation", b.name); setLosingSearch(""); }} style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontSize:14, color:"rgba(255,255,255,0.8)" }}>
                        {b.name}, {b.state}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>REPORTING TO (GAINING INSTALLATION)</label>
                <input
                  value={gainingSearch || p.gainingInstallation}
                  onChange={e => { setGainingSearch(e.target.value); updGainingInstallation(e.target.value); }}
                  placeholder="Type base name..."
                  style={inputSt}
                />
                {gainingSuggestions.length > 0 && (
                  <div style={{ marginTop:8, background:"rgba(0,0,0,0.2)", borderRadius:10, maxHeight:200, overflowY:"auto" }}>
                    {gainingSuggestions.map(b => (
                      <div key={b.name} onClick={() => { updGainingInstallation(b.name); setGainingSearch(""); }} style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontSize:14, color:"rgba(255,255,255,0.8)" }}>
                        {b.name}, {b.state}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>DEPARTING</label>
                <input type="date" value={p.departingDate} onChange={e=>upd("departingDate",e.target.value)} style={{...inputSt, colorScheme:"dark"}} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>
                  UNIT{p.gainingInstallation ? ` AT ${p.gainingInstallation.toUpperCase()}` : ""}
                </label>
                <select
                  value={p.unit}
                  onChange={e => upd("unit", e.target.value)}
                  style={inputSt}
                  disabled={!p.gainingInstallation}
                >
                  <option value="">
                    {p.gainingInstallation ? "Select unit at gaining installation..." : "Select a gaining installation first"}
                  </option>
                  {availableUnits.length > 0
                    ? availableUnits.map(u => <option key={u} value={u}>{u}</option>)
                    : p.gainingInstallation && (
                        <option value="" disabled>No units listed for {p.branch} at this installation</option>
                      )
                  }
                </select>
                {p.gainingInstallation && availableUnits.length > 0 && (
                  <div style={{ marginTop:6, fontSize:12, color:"rgba(255,255,255,0.45)" }}>
                    {availableUnits.length} unit{availableUnits.length !== 1 ? "s" : ""} available for {p.branch}
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:12 }}>
                <button onClick={()=>setStep(0)} style={{ padding:"14px 20px", borderRadius:12, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)", fontSize:16, fontWeight:700, cursor:"pointer" }}>← Back</button>
                <button onClick={()=>setStep(2)} disabled={!canGo2} style={{ flex:1, padding:"14px", borderRadius:12, background:canGo2?theme.accent:"rgba(255,255,255,0.1)", color:canGo2?theme.secondary:"rgba(255,255,255,0.3)", border:"none", fontSize:16, fontWeight:900, cursor:canGo2?"pointer":"not-allowed" }}>Continue →</button>
              </div>
            </>
          )}

          {step === 2 && <>
            <div style={{ fontSize:24, fontWeight:900, color:"#FFFFFF", marginBottom:20 }}>Family & Move</div>

            {[["isOverseas", p.isOverseas, "OCONUS / Overseas"], ["hasDependents", p.hasDependents, "Spouse / Dependents"], ["hasChildren", p.hasChildren, "Children"]].map(([key, val, label]) => (
              <div key={key} onClick={()=>upd(key,!val)} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:12, marginBottom:12, background: val ? `${theme.accent}20` : "rgba(255,255,255,0.04)", border:`1.5px solid ${val ? theme.accent+"66" : "rgba(255,255,255,0.12)"}`, cursor:"pointer" }}>
                <div style={{ width:24, height:24, borderRadius:6, border:`2px solid ${val?theme.accent:"rgba(255,255,255,0.25)"}`, background:val?theme.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {val && <svg width="12" height="9" viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1" stroke={theme.secondary} strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:"#FFFFFF" }}>{label}</div>
              </div>
            ))}

            {p.hasChildren && (
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"14px", marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>CHILDREN AGES</label>
                <input value={p.childAges.join(",")} onChange={e=>upd("childAges",e.target.value.split(",").map(a=>parseInt(a)).filter(a=>!isNaN(a)))} placeholder="e.g. 5, 8, 12" style={inputSt} />
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>BEDROOMS</label>
              <select value={p.bedrooms} onChange={e=>upd("bedrooms",e.target.value)} style={inputSt}>
                {["1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", gap:12 }}>
              <button onClick={()=>setStep(1)} style={{ padding:"14px 20px", borderRadius:12, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)", fontSize:16, fontWeight:700, cursor:"pointer" }}>← Back</button>
              <button onClick={()=>onComplete(p)} style={{ flex:1, padding:"14px", borderRadius:12, background:theme.accent, color:theme.secondary, border:"none", fontSize:16, fontWeight:900, cursor:"pointer" }}>Build PCS Plan ✦</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function DesktopApp({ profile, onReset }) {
  const [screen, setScreen] = useState("dashboard");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [dashboardCollapsed, setDashboardCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pcs_dashboard_collapsed")) === true; } catch { return false; }
  });
  const theme = BRANCH_THEMES[profile.branch];
  const content = BRANCH_CONTENT[profile.branch];
  const branchBusinesses = VETERAN_BUSINESSES[profile.branch] || [];

  const toggleDashboard = () => {
    setDashboardCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("pcs_dashboard_collapsed", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Reporting screen state
  // Include all bases, not just branch-filtered, so profile installations always appear in dropdowns
  const allBases = MILITARY_BASES;
  const branchBases = MILITARY_BASES.filter(b => b.branch === profile.branch);
  const [reportAutofilled, setReportAutofilled] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [reportForm, setReportForm] = useState(() => {
    const saved = store.get("pcs_report");
    return saved || { losingInstallation: "", gainingInstallation: "", reportingDate: "", unit: "" };
  });
  const updReport = (k, v) => { setReportSaved(false); setReportForm(prev => ({ ...prev, [k]: v })); };
  // When gaining installation changes in the report form, reset unit so stale selections don't persist
  const updReportGaining = (installation) => {
    setReportSaved(false);
    setReportForm(prev => ({ ...prev, gainingInstallation: installation, unit: "" }));
  };
  const handleAutofill = () => {
    const gainingInstallation = profile.gainingInstallation || "";
    const profileUnit = profile.unit || "";
    // Determine the units available for the profile's gaining installation + branch
    const unitsAtGaining = gainingInstallation && INSTALLATION_UNITS[gainingInstallation]
      ? (INSTALLATION_UNITS[gainingInstallation][profile.branch] || [])
      : [];
    // Only autofill the unit if it's actually in the list for that installation/branch,
    // or if there are no listed units (custom/unlisted installation) — preserve whatever was set
    const unit = unitsAtGaining.length === 0 || unitsAtGaining.includes(profileUnit)
      ? profileUnit
      : unitsAtGaining[0];
    setReportForm({
      losingInstallation: profile.losingInstallation || "",
      gainingInstallation,
      reportingDate: profile.departingDate || "",
      unit,
    });
    setReportAutofilled(true);
    setReportSaved(false);
  };
  const handleReportSave = () => {
    store.set("pcs_report", reportForm);
    setReportSaved(true);
  };
  const reportUnitsForGaining = reportForm.gainingInstallation && INSTALLATION_UNITS[reportForm.gainingInstallation]
    ? (INSTALLATION_UNITS[reportForm.gainingInstallation][profile.branch] || [])
    : [];
  const inputStLight = { width: "100%", fontSize: 15, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${theme.accent}40`, background: "#FFFFFF", color: "#1A1A1A", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  const handleAiQuestion = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const system = `You are a helpful PCS (Permanent Change of Station) assistant for ${theme.name} service members. Provide accurate, branch-specific guidance about military moves, housing, schools, finance, and relocation. User is ${profile.firstName} ${profile.lastName}, rank ${profile.paygrade}, moving from ${profile.losingInstallation} to ${profile.gainingInstallation}.`;
      const response = await aiCall(system, aiQuestion);
      setAiResponse(response);
    } catch (err) {
      setAiError(err.message || "Failed to get response");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100dvh", background:"#F5F7FA", fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", position:"relative" }}>
      <style>{`* {box-sizing:border-box}`}</style>
      
      <div style={{ width:280, background:theme.secondary, color:"#FFFFFF", padding:"32px 24px", borderRight:`3px solid ${theme.accent}`, display:"flex", flexDirection:"column", position:"relative", backgroundImage:`url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><pattern id="insignia" patternUnits="userSpaceOnUse" width="400" height="400"><circle cx="200" cy="200" r="150" fill="none" stroke="${encodeURIComponent(theme.accent)}" stroke-width="2" opacity="0.08"/><path d="M200,100 L220,150 L270,150 L230,190 L250,240 L200,200 L150,240 L170,190 L130,150 L180,150Z" fill="none" stroke="${encodeURIComponent(theme.accent)}" stroke-width="2" opacity="0.08"/></pattern></defs><rect width="400" height="400" fill="url(%23insignia)"/></svg>')`, backgroundSize:"400px 400px" }}>

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:11, letterSpacing:".15em", color:theme.accent, fontWeight:800, marginBottom:8 }}>PCS EXPRESS</div>
          <div style={{ fontSize:18, fontWeight:900, color:"#FFFFFF", marginBottom:4 }}>{profile.firstName} {profile.lastName}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:24 }}>{theme.name} · {profile.paygrade}</div>

          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:12, padding:"12px", marginBottom:24 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>DEPARTURE</div>
            <div style={{ fontSize:14, fontWeight:700 }}>{new Date(profile.departingDate).toLocaleDateString()}</div>
          </div>

          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:12, padding:"12px", marginBottom:24 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>UNIT</div>
            <div style={{ fontSize:14, fontWeight:700 }}>{profile.unit || "Not selected"}</div>
          </div>

          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:12, padding:"12px", marginBottom:32 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>REPORTING TO</div>
            <div style={{ fontSize:14, fontWeight:700 }}>{profile.gainingInstallation}</div>
          </div>

          <nav style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { id:"dashboard", icon:"◈", label:"Dashboard" },
              { id:"reporting", icon:"📋", label:"Reporting" },
              { id:"checklist", icon:"✓", label:"PCS Checklist" },
              { id:"schools", icon:"🎓", label:"Schools & Districts" },
              { id:"resources", icon:"◉", label:`${theme.name} Resources` },
              { id:"veterans", icon:"⭐", label:"Veteran Services" },
              { id:"ask", icon:"?", label:"Ask AI" },
            ].map(nav => (
              <button key={nav.id} onClick={() => setScreen(nav.id)} style={{ textAlign:"left", padding:"12px 14px", borderRadius:10, border:screen===nav.id?`2px solid ${theme.accent}`:"1px solid rgba(255,255,255,0.15)", background:screen===nav.id?theme.accent+"20":"rgba(255,255,255,0.05)", color:screen===nav.id?theme.accent:"rgba(255,255,255,0.7)", fontSize:14, fontWeight:screen===nav.id?700:500, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }}>{nav.icon}</span>{nav.label}
              </button>
            ))}
          </nav>

          <button onClick={onReset} style={{ marginTop:"auto", width:"100%", padding:"12px", borderRadius:10, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:700, cursor:"pointer" }}>Edit Profile</button>
        </div>
      </div>

      <div style={{ flex:1, padding:"40px", overflowY:"auto" }}>
        <div style={{ maxWidth:1000 }}>
          {screen === "dashboard" && (
            <div>
              <style>{`
                @keyframes pcs-collapse {
                  from { opacity: 1; transform: translateY(0); max-height: 600px; }
                  to   { opacity: 0; transform: translateY(-8px); max-height: 0; }
                }
                @keyframes pcs-expand {
                  from { opacity: 0; transform: translateY(-8px); max-height: 0; }
                  to   { opacity: 1; transform: translateY(0); max-height: 600px; }
                }
                .pcs-dashboard-body {
                  overflow: hidden;
                  animation-duration: 280ms;
                  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                  animation-fill-mode: both;
                }
                .pcs-dashboard-body.collapsed {
                  animation-name: pcs-collapse;
                  pointer-events: none;
                }
                .pcs-dashboard-body.expanded {
                  animation-name: pcs-expand;
                }
                .pcs-collapse-btn:hover {
                  background: ${theme.accent}30 !important;
                }
              `}</style>

              {/* Dashboard header with collapse toggle */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: dashboardCollapsed ? 0 : 32 }}>
                <div>
                  <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Welcome back, {profile.firstName}</h1>
                  {!dashboardCollapsed && (
                    <p style={{ fontSize:16, color:"#666", margin:0 }}>Here's your {theme.name} PCS timeline and resources</p>
                  )}
                </div>
                <button
                  className="pcs-collapse-btn"
                  onClick={toggleDashboard}
                  title={dashboardCollapsed ? "Expand dashboard" : "Collapse dashboard"}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 10,
                    border: `1.5px solid ${theme.accent}50`,
                    background: dashboardCollapsed ? `${theme.accent}18` : "rgba(0,0,0,0.04)",
                    color: theme.primary, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", flexShrink: 0, marginTop: 4,
                    transition: "background 0.2s",
                  }}
                >
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)", transform: dashboardCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                  >
                    <polyline points="2,4.5 7,9.5 12,4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {dashboardCollapsed ? "Show Dashboard" : "Hide Dashboard"}
                </button>
              </div>

              {/* Collapsible dashboard body */}
              {!dashboardCollapsed && (
                <div className={`pcs-dashboard-body expanded`}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:40 }}>
                    {[
                      { label:"Days to Departure", value: Math.ceil((new Date(profile.departingDate) - new Date()) / 86400000), icon:"📅" },
                      { label:"Dependents", value: profile.hasDependents ? "Yes" : "No", icon:"👨‍👩‍👧" },
                      { label:"Children", value: profile.childAges.length > 0 ? `${profile.childAges.length} kids` : "None", icon:"👶" },
                    ].map((card, i) => (
                      <div key={i} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
                        <div style={{ fontSize:24, marginBottom:12 }}>{card.icon}</div>
                        <div style={{ fontSize:28, fontWeight:900, color:theme.primary, marginBottom:4 }}>{card.value}</div>
                        <div style={{ fontSize:13, color:"#999" }}>{card.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:"#FFFFFF", padding:"28px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:24 }}>
                    <h2 style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:16 }}>Branch-Specific Support</h2>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      {[
                        { label:"Personnel", value: content.s1 },
                        { label:"Finance", value: content.finance },
                        { label:"Transportation", value: content.tmo },
                        { label:"Medical", value: content.medical },
                      ].map((item, i) => (
                        <div key={i} style={{ padding:"14px", background:theme.light, borderRadius:10, border:`1px solid ${theme.accent}40` }}>
                          <div style={{ fontSize:12, color:theme.subtext, fontWeight:700, marginBottom:4 }}>{item.label}</div>
                          <div style={{ fontSize:14, fontWeight:600, color:theme.primary }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {screen === "reporting" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Reporting</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:28 }}>Enter your losing and gaining installation details for your PCS report</p>

              {/* Autofill banner */}
              <div style={{ background: reportAutofilled ? `${theme.accent}18` : theme.light, border: `2px solid ${reportAutofilled ? theme.accent : theme.accent + "50"}`, borderRadius:14, padding:"20px 24px", marginBottom:28, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:theme.primary, marginBottom:4 }}>
                    {reportAutofilled ? "✦ Autofilled from your profile" : "⚡ Autofill from Profile"}
                  </div>
                  <div style={{ fontSize:13, color:theme.subtext }}>
                    {reportAutofilled
                      ? `Populated from ${profile.firstName} ${profile.lastName}'s onboarding data — you can still edit any field below`
                      : `Instantly populate all fields using the information you entered during onboarding`}
                  </div>
                </div>
                <button
                  onClick={handleAutofill}
                  style={{ padding:"10px 22px", borderRadius:10, background:theme.accent, color:theme.secondary, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}
                >
                  {reportAutofilled ? "↺ Re-autofill" : "Autofill from Profile"}
                </button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
                {/* Losing Installation */}
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:theme.subtext, letterSpacing:".1em", marginBottom:12 }}>LOSING INSTALLATION</div>
                  <select
                    value={reportForm.losingInstallation}
                    onChange={e => updReport("losingInstallation", e.target.value)}
                    style={inputStLight}
                  >
                    <option value="">— Select losing installation —</option>
                    {allBases.map(b => (
                      <option key={b.name} value={b.name}>{b.name}, {b.state} ({b.branch})</option>
                    ))}
                    {reportForm.losingInstallation && !allBases.find(b => b.name === reportForm.losingInstallation) && (
                      <option value={reportForm.losingInstallation}>{reportForm.losingInstallation} (custom)</option>
                    )}
                  </select>
                  {reportForm.losingInstallation && (
                    <div style={{ marginTop:10, fontSize:13, color:theme.subtext, display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ color:theme.accent }}>✦</span>
                      {(() => {
                        const found = allBases.find(b => b.name === reportForm.losingInstallation);
                        return found ? `${found.branch} installation · ${found.state}` : "Custom entry";
                      })()}
                    </div>
                  )}
                </div>

                {/* Gaining Installation */}
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:theme.subtext, letterSpacing:".1em", marginBottom:12 }}>GAINING INSTALLATION</div>
                  <select
                    value={reportForm.gainingInstallation}
                    onChange={e => updReportGaining(e.target.value)}
                    style={inputStLight}
                  >
                    <option value="">— Select gaining installation —</option>
                    {allBases.map(b => (
                      <option key={b.name} value={b.name}>{b.name}, {b.state} ({b.branch})</option>
                    ))}
                    {reportForm.gainingInstallation && !allBases.find(b => b.name === reportForm.gainingInstallation) && (
                      <option value={reportForm.gainingInstallation}>{reportForm.gainingInstallation} (custom)</option>
                    )}
                  </select>
                  {reportForm.gainingInstallation && (
                    <div style={{ marginTop:10, fontSize:13, color:theme.subtext, display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ color:theme.accent }}>✦</span>
                      {(() => {
                        const found = allBases.find(b => b.name === reportForm.gainingInstallation);
                        return found ? `${found.branch} installation · ${found.state}` : "Custom entry";
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
                {/* Reporting Date */}
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:theme.subtext, letterSpacing:".1em", marginBottom:12 }}>REPORTING DATE</div>
                  <input
                    type="date"
                    value={reportForm.reportingDate}
                    onChange={e => updReport("reportingDate", e.target.value)}
                    style={{ ...inputStLight, colorScheme:"light" }}
                  />
                </div>

                {/* Unit */}
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:theme.subtext, letterSpacing:".1em", marginBottom:12 }}>
                    UNIT AT {reportForm.gainingInstallation ? reportForm.gainingInstallation.toUpperCase() : "GAINING INSTALLATION"}
                  </div>
                  <select
                    value={reportForm.unit}
                    onChange={e => updReport("unit", e.target.value)}
                    style={inputStLight}
                    disabled={!reportForm.gainingInstallation}
                  >
                    <option value="">
                      {reportForm.gainingInstallation ? "— Select unit —" : "Select a gaining installation first"}
                    </option>
                    {reportUnitsForGaining.length > 0
                      ? reportUnitsForGaining.map(u => <option key={u} value={u}>{u}</option>)
                      : reportForm.gainingInstallation && <option value="" disabled>No units listed for {profile.branch} at this installation</option>
                    }
                    {reportForm.unit && !reportUnitsForGaining.includes(reportForm.unit) && reportForm.unit !== "" && (
                      <option value={reportForm.unit}>{reportForm.unit} (custom)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Summary card */}
              {(reportForm.losingInstallation || reportForm.gainingInstallation) && (
                <div style={{ background: theme.light, border:`2px solid ${theme.accent}40`, borderRadius:14, padding:"20px 24px", marginBottom:24 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:theme.primary, marginBottom:14 }}>📋 Report Summary</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
                    {[
                      { label:"FROM", value: reportForm.losingInstallation || "—" },
                      { label:"TO", value: reportForm.gainingInstallation || "—" },
                      { label:"DATE", value: reportForm.reportingDate ? new Date(reportForm.reportingDate + "T00:00:00").toLocaleDateString() : "—" },
                      { label:"UNIT", value: reportForm.unit || "—" },
                    ].map((item, i) => (
                      <div key={i} style={{ background:"#FFFFFF", padding:"12px 14px", borderRadius:10, border:`1px solid ${theme.accent}30` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:theme.subtext, marginBottom:4 }}>{item.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:theme.primary, wordBreak:"break-word" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save button */}
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <button
                  onClick={handleReportSave}
                  disabled={!reportForm.losingInstallation || !reportForm.gainingInstallation || !reportForm.reportingDate}
                  style={{ padding:"13px 32px", borderRadius:12, background: (!reportForm.losingInstallation || !reportForm.gainingInstallation || !reportForm.reportingDate) ? "#E0E0E0" : theme.primary, color: (!reportForm.losingInstallation || !reportForm.gainingInstallation || !reportForm.reportingDate) ? "#999" : "#FFFFFF", border:"none", fontSize:15, fontWeight:800, cursor: (!reportForm.losingInstallation || !reportForm.gainingInstallation || !reportForm.reportingDate) ? "not-allowed" : "pointer" }}
                >
                  Save Report
                </button>
                {reportSaved && (
                  <div style={{ fontSize:14, fontWeight:700, color:"#2E7D32", display:"flex", alignItems:"center", gap:6 }}>
                    <span>✓</span> Report saved successfully
                  </div>
                )}
              </div>
            </div>
          )}

          {screen === "checklist" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>PCS Checklist</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:28 }}>Your {theme.name}-specific pre- and post-move tasks</p>
              
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>
                {["pre-move", "during-move", "post-move"].map((phase) => {
                  const phaseNames = { "pre-move": "Before Move", "during-move": "During Move", "post-move": "After Move" };
                  const phaseIcons = { "pre-move": "📋", "during-move": "📦", "post-move": "✓" };
                  return (
                    <div key={phase} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:24 }}>{phaseIcons[phase]}</span>
                        {phaseNames[phase]}
                      </div>
                      <ul style={{ margin:0, paddingLeft:20, display:"flex", flexDirection:"column", gap:10 }}>
                        {PCS_CHECKLIST[phase].map((task, i) => (
                          <li key={i} style={{ fontSize:13, color:"#333", lineHeight:1.5 }}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {screen === "schools" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Schools & Districts</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:28 }}>Find schools and educational resources at {profile.gainingInstallation}</p>
              
              <div style={{ background:"#FFFFFF", padding:"28px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:24 }}>
                {profile.childAges.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
                    <div style={{ fontSize:16, fontWeight:700, color:theme.primary, marginBottom:8 }}>No children ages entered</div>
                    <div style={{ fontSize:14, color:"#666" }}>Update your profile to see school recommendations for your children</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:theme.primary, marginBottom:20 }}>📚 School Search for Ages: {profile.childAges.join(", ")}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                      {SCHOOL_RESOURCES.general.map((resource, i) => (
                        <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" style={{ padding:"16px", background:theme.light, border:`1.5px solid ${theme.accent}40`, borderRadius:10, textDecoration:"none", color:theme.primary, transition:"all 0.2s", display:"block" }} onMouseEnter={e=>e.target.style.background=theme.accent+"20"} onMouseLeave={e=>e.target.style.background=theme.light}>
                          <div style={{ fontWeight:700, marginBottom:4 }}>{resource.name}</div>
                          <div style={{ fontSize:12, color:"#666" }}>{resource.desc}</div>
                        </a>
                      ))}
                    </div>
                    <div style={{ background:theme.light, border:`1.5px solid ${theme.accent}40`, borderRadius:10, padding:"16px" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:theme.primary, marginBottom:8 }}>💡 Tips for Military Families:</div>
                      <ul style={{ margin:0, paddingLeft:20, fontSize:13, color:"#333", lineHeight:1.8 }}>
                        <li>Ask about military family support programs at the school</li>
                        <li>Look for schools with strong counseling services for military transitions</li>
                        <li>Check if the district has military student liaisons</li>
                        <li>Inquire about enrollment requirements and transcript transfers</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screen === "resources" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>{theme.name} Resources</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Branch-specific PCS and relocation support</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {["Housing", "Finance", "Family Services", "Medical"].map((category) => {
                  const resources = BRANCH_RESOURCES[profile.branch][category] || [];
                  const icons = { Housing: "🏠", Finance: "💰", "Family Services": "👨‍👩‍👧‍👦", Medical: "⚕️" };
                  return (
                    <div key={category} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40` }}>
                      <div style={{ fontSize:20, fontWeight:900, color:theme.primary, marginBottom:16 }}>{icons[category]} {category}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {resources.map((resource, idx) => (
                          <div key={idx} style={{ padding:"12px 14px", background:theme.light, border:`1px solid ${theme.accent}40`, borderRadius:10, color:theme.primary, fontSize:13, transition:"all 0.2s" }}>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color:theme.primary, fontWeight:700, textDecoration:"none" }}>{resource.name}</a>
                            <div style={{ fontSize:12, color:"#666", marginTop:4 }}>{resource.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {screen === "veterans" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>{theme.name} Veteran Services</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Branch-specific veteran support organizations and resources</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {branchBusinesses.map((business, i) => (
                  <a key={i} href={business.url} target="_blank" rel="noopener noreferrer" style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, textDecoration:"none", cursor:"pointer", transition:"all 0.3s", display:"block" }} onMouseEnter={e=>e.target.style.transform="translateY(-4px)"} onMouseLeave={e=>e.target.style.transform="translateY(0)"}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{business.icon}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:8 }}>{business.name}</div>
                    <div style={{ fontSize:14, color:"#666" }}>{business.services}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {screen === "ask" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Ask PCS Express</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Ask AI questions about your {theme.name} PCS</p>
              <div style={{ background:"#FFFFFF", padding:"28px", borderRadius:14, border:`2px solid ${theme.accent}40`, maxWidth:700 }}>
                <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && handleAiQuestion()}
                    disabled={aiLoading}
                    placeholder="Ask about housing, schools, finance, moving, benefits, or military life..."
                    style={{
                      flex:1,
                      padding:"14px 16px",
                      fontSize:14,
                      borderRadius:10,
                      border:`1.5px solid ${theme.accent}40`,
                      background:"#F9F9F9",
                      color:"#1A1A1A",
                      outline:"none",
                      opacity:aiLoading ? 0.6 : 1,
                      transition:"all 0.2s",
                    }}
                  />
                  <button
                    onClick={handleAiQuestion}
                    disabled={aiLoading || !aiQuestion.trim()}
                    style={{
                      padding:"14px 28px",
                      borderRadius:10,
                      background:aiLoading || !aiQuestion.trim() ? "#E0E0E0" : theme.primary,
                      color:aiLoading || !aiQuestion.trim() ? "#999" : "#FFFFFF",
                      border:"none",
                      fontSize:14,
                      fontWeight:700,
                      cursor:aiLoading || !aiQuestion.trim() ? "not-allowed" : "pointer",
                      whiteSpace:"nowrap",
                      transition:"all 0.2s",
                    }}
                  >
                    {aiLoading ? "Thinking..." : "Ask"}
                  </button>
                </div>

                {aiError && (
                  <div style={{
                    padding:"14px 16px",
                    background:"#FEE",
                    border:`1.5px solid #F88`,
                    borderRadius:10,
                    color:"#C33",
                    fontSize:14,
                    marginBottom:16,
                    display:"flex",
                    alignItems:"center",
                    gap:8,
                  }}>
                    <span style={{ fontSize:16 }}>⚠️</span>
                    {aiError}
                  </div>
                )}

                {aiResponse && (
                  <div style={{
                    padding:"20px",
                    background:theme.light,
                    border:`1.5px solid ${theme.accent}40`,
                    borderRadius:10,
                    color:theme.primary,
                    fontSize:14,
                    lineHeight:1.8,
                    whiteSpace:"pre-wrap",
                    wordBreak:"break-word",
                  }}>
                    {aiResponse}
                  </div>
                )}

                {!aiResponse && !aiError && !aiLoading && (
                  <div style={{
                    padding:"24px",
                    background:theme.light,
                    borderRadius:10,
                    color:theme.subtext,
                    fontSize:13,
                    lineHeight:1.6,
                  }}>
                    <div style={{ fontWeight:700, color:theme.primary, marginBottom:8 }}>💡 Example questions:</div>
                    <ul style={{ margin:0, paddingLeft:20 }}>
                      <li>What are the best schools near {profile.gainingInstallation}?</li>
                      <li>What is the BAH rate for my rank at {profile.gainingInstallation}?</li>
                      <li>What are the PCS entitlements for {profile.paygrade}?</li>
                      <li>Tell me about moving with dependents in the {theme.name}</li>
                      <li>What should I do before reporting to {profile.gainingInstallation}?</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState(() => store.get("pcs_profile"));

  if (!profile) {
    return <Onboarding onComplete={p => {setProfile(p); store.set("pcs_profile", p);}} />;
  }

  return <DesktopApp profile={profile} onReset={() => {setProfile(null); store.set("pcs_profile", null);}} />;
}

export default App;
