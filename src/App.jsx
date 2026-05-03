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
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const DEMO_PROFILE = {
  firstName: "Marcus",
  lastName: "Thompson",
  branch: "Army",
  component: "Active Duty",
  paygrade: "E-7",
  losingInstallation: "Fort Liberty",
  gainingInstallation: "Camp Humphreys",
  departingDate: "2026-06-15",
  unit: "101st Airborne Division (Air Assault)",
  isOverseas: true,
  hasDependents: true,
  hasChildren: true,
  childAges: [14, 11, 8],
  bedrooms: "4",
  language: "English",
  religiousPreference: "Christian (Protestant)",
};

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

const INSTALLATION_COORDS = {
  "Fort Liberty":          { lat: 35.1390, lng: -79.0064, zoom: 14 },
  "Fort Bliss":            { lat: 31.8120, lng: -106.4145, zoom: 13 },
  "Fort Campbell":         { lat: 36.6614, lng: -87.4817,  zoom: 13 },
  "Fort Carson":           { lat: 38.7268, lng: -104.7896, zoom: 13 },
  "Fort Drum":             { lat: 44.0568, lng: -75.7717,  zoom: 13 },
  "Naval Station Norfolk": { lat: 36.9376, lng: -76.2944,  zoom: 13 },
  "Naval Base San Diego":  { lat: 32.6826, lng: -117.1342, zoom: 13 },
  "Camp Pendleton":        { lat: 33.3767, lng: -117.5638, zoom: 12 },
  "Camp Lejeune":          { lat: 34.6815, lng: -77.3398,  zoom: 12 },
  "Lackland AFB":          { lat: 29.3843, lng: -98.6201,  zoom: 14 },
  "Nellis AFB":            { lat: 36.2361, lng: -115.0343, zoom: 13 },
};

const BASE_POI_CATEGORIES = {
  medical:    { icon: "🏥", color: "#C62828", label: "Medical"        },
  exchange:   { icon: "🛒", color: "#1565C0", label: "Exchange (PX/BX)" },
  commissary: { icon: "🥩", color: "#2E7D32", label: "Commissary"     },
  admin:      { icon: "🏛️", color: "#6A1B9A", label: "Headquarters"   },
  gate:       { icon: "🚗", color: "#37474F", label: "Gate"           },
  chapel:     { icon: "⛪", color: "#E65100", label: "Chapel"         },
  housing:    { icon: "🏠", color: "#00838F", label: "Housing Office" },
  education:  { icon: "🎓", color: "#558B2F", label: "Education Center" },
  fitness:    { icon: "🏋️", color: "#00796B", label: "Fitness Center" },
  finance:    { icon: "🏦", color: "#4527A0", label: "Finance Office" },
  dining:     { icon: "🍽️", color: "#F57F17", label: "Dining Facility" },
  childcare:  { icon: "👶", color: "#AD1457", label: "Child Development" },
};

const BASE_LOCATIONS = {
  "Fort Liberty": [
    { name: "Womack Army Medical Center", cat: "medical",    lat: 35.1383, lng: -79.0036 },
    { name: "Fort Liberty Exchange (PX)", cat: "exchange",   lat: 35.1453, lng: -79.0116 },
    { name: "Commissary",                 cat: "commissary", lat: 35.1465, lng: -79.0133 },
    { name: "XVIII Airborne Corps HQ",    cat: "admin",      lat: 35.1390, lng: -79.0064 },
    { name: "Main Gate (Reilly Rd)",      cat: "gate",       lat: 35.1560, lng: -79.0140 },
    { name: "All American Chapel",        cat: "chapel",     lat: 35.1395, lng: -79.0070 },
    { name: "Army Housing Office",        cat: "housing",    lat: 35.1470, lng: -79.0050 },
    { name: "Education Center",           cat: "education",  lat: 35.1430, lng: -79.0085 },
    { name: "Finance Office",             cat: "finance",    lat: 35.1402, lng: -79.0073 },
    { name: "Soldier Support Center",     cat: "admin",      lat: 35.1385, lng: -79.0080 },
    { name: "Airborne & Special Ops Museum", cat: "admin",   lat: 35.0524, lng: -78.8772 },
    { name: "CDC / Child Development Center", cat: "childcare", lat: 35.1460, lng: -79.0095 },
  ],
  "Fort Bliss": [
    { name: "William Beaumont Army Medical Center", cat: "medical",    lat: 31.8092, lng: -106.4012 },
    { name: "Fort Bliss Exchange",                  cat: "exchange",   lat: 31.8145, lng: -106.4120 },
    { name: "Commissary",                           cat: "commissary", lat: 31.8160, lng: -106.4135 },
    { name: "1st Armored Division HQ",              cat: "admin",      lat: 31.8120, lng: -106.4145 },
    { name: "Marshall Road Gate (Main Gate)",       cat: "gate",       lat: 31.8280, lng: -106.4155 },
    { name: "Chapel",                               cat: "chapel",     lat: 31.8130, lng: -106.4100 },
    { name: "Housing Office",                       cat: "housing",    lat: 31.8090, lng: -106.4145 },
    { name: "Education Center",                     cat: "education",  lat: 31.8140, lng: -106.4090 },
    { name: "Finance Office",                       cat: "finance",    lat: 31.8125, lng: -106.4138 },
    { name: "Dining Facility (DFAC)",               cat: "dining",     lat: 31.8108, lng: -106.4120 },
    { name: "Soldier and Family Readiness Center",  cat: "admin",      lat: 31.8135, lng: -106.4128 },
    { name: "Child Development Center",             cat: "childcare",  lat: 31.8155, lng: -106.4110 },
  ],
  "Fort Campbell": [
    { name: "Blanchfield Army Community Hospital", cat: "medical",    lat: 36.6550, lng: -87.4700 },
    { name: "Fort Campbell Exchange",              cat: "exchange",   lat: 36.6680, lng: -87.4820 },
    { name: "Commissary",                          cat: "commissary", lat: 36.6690, lng: -87.4835 },
    { name: "101st Airborne HQ",                   cat: "admin",      lat: 36.6614, lng: -87.4817 },
    { name: "Main Gate (Gate 1)",                  cat: "gate",       lat: 36.6750, lng: -87.4850 },
    { name: "Campbell Army Airfield",              cat: "admin",      lat: 36.6480, lng: -87.4600 },
    { name: "Chapel",                              cat: "chapel",     lat: 36.6620, lng: -87.4810 },
    { name: "Housing Office",                      cat: "housing",    lat: 36.6660, lng: -87.4830 },
    { name: "Education Center",                    cat: "education",  lat: 36.6635, lng: -87.4795 },
    { name: "Finance Office",                      cat: "finance",    lat: 36.6618, lng: -87.4820 },
    { name: "Soldier Support Center",              cat: "admin",      lat: 36.6600, lng: -87.4808 },
    { name: "Child Development Center",            cat: "childcare",  lat: 36.6670, lng: -87.4800 },
  ],
  "Fort Carson": [
    { name: "Evans Army Community Hospital",  cat: "medical",    lat: 38.7220, lng: -104.7900 },
    { name: "Fort Carson Exchange",           cat: "exchange",   lat: 38.7290, lng: -104.7880 },
    { name: "Commissary",                     cat: "commissary", lat: 38.7300, lng: -104.7895 },
    { name: "4th Infantry Division HQ",       cat: "admin",      lat: 38.7268, lng: -104.7896 },
    { name: "South Gate (Gate 1)",            cat: "gate",       lat: 38.7080, lng: -104.7940 },
    { name: "Chapel",                         cat: "chapel",     lat: 38.7275, lng: -104.7885 },
    { name: "Housing Office",                 cat: "housing",    lat: 38.7310, lng: -104.7870 },
    { name: "Education Center",               cat: "education",  lat: 38.7260, lng: -104.7870 },
    { name: "Finance Office",                 cat: "finance",    lat: 38.7270, lng: -104.7898 },
    { name: "Mountain Post Fitness Center",   cat: "fitness",    lat: 38.7285, lng: -104.7875 },
    { name: "Dining Facility (DFAC)",         cat: "dining",     lat: 38.7255, lng: -104.7905 },
    { name: "Child Development Center",       cat: "childcare",  lat: 38.7295, lng: -104.7888 },
  ],
  "Fort Drum": [
    { name: "Guthrie Army Health Clinic",     cat: "medical",    lat: 44.0530, lng: -75.7750 },
    { name: "Fort Drum Exchange",             cat: "exchange",   lat: 44.0590, lng: -75.7700 },
    { name: "Commissary",                     cat: "commissary", lat: 44.0600, lng: -75.7720 },
    { name: "10th Mountain Division HQ",      cat: "admin",      lat: 44.0568, lng: -75.7717 },
    { name: "Wheeler-Sack Gate",              cat: "gate",       lat: 44.0670, lng: -75.7620 },
    { name: "Chapel",                         cat: "chapel",     lat: 44.0575, lng: -75.7710 },
    { name: "Housing Office",                 cat: "housing",    lat: 44.0610, lng: -75.7730 },
    { name: "Education Center",               cat: "education",  lat: 44.0580, lng: -75.7695 },
    { name: "Finance Office",                 cat: "finance",    lat: 44.0570, lng: -75.7720 },
    { name: "Magrath Sports Complex",         cat: "fitness",    lat: 44.0555, lng: -75.7680 },
    { name: "Dining Facility",                cat: "dining",     lat: 44.0562, lng: -75.7725 },
  ],
  "Naval Station Norfolk": [
    { name: "Naval Medical Center Portsmouth", cat: "medical",    lat: 36.8358, lng: -76.3085 },
    { name: "Norfolk Exchange (NEX)",          cat: "exchange",   lat: 36.9415, lng: -76.2920 },
    { name: "Commissary",                      cat: "commissary", lat: 36.9420, lng: -76.2940 },
    { name: "Fleet Forces Command HQ",         cat: "admin",      lat: 36.9376, lng: -76.2944 },
    { name: "Main Gate",                       cat: "gate",       lat: 36.9290, lng: -76.3010 },
    { name: "Chapel",                          cat: "chapel",     lat: 36.9385, lng: -76.2950 },
    { name: "Housing Office",                  cat: "housing",    lat: 36.9430, lng: -76.2930 },
    { name: "Navy College Afloat",             cat: "education",  lat: 36.9395, lng: -76.2935 },
    { name: "Finance Office (DFAS)",           cat: "finance",    lat: 36.9380, lng: -76.2948 },
    { name: "Recreation Center",               cat: "fitness",    lat: 36.9400, lng: -76.2925 },
    { name: "Galley (Dining Facility)",        cat: "dining",     lat: 36.9388, lng: -76.2955 },
    { name: "CDC / Child Development Center",  cat: "childcare",  lat: 36.9408, lng: -76.2938 },
  ],
  "Naval Base San Diego": [
    { name: "Naval Medical Center San Diego",  cat: "medical",    lat: 32.7200, lng: -117.1580 },
    { name: "NEX (Main Exchange)",             cat: "exchange",   lat: 32.6860, lng: -117.1320 },
    { name: "Commissary",                      cat: "commissary", lat: 32.6870, lng: -117.1340 },
    { name: "Navy Region Southwest HQ",        cat: "admin",      lat: 32.6826, lng: -117.1342 },
    { name: "Main Gate (Gate 4)",              cat: "gate",       lat: 32.6780, lng: -117.1420 },
    { name: "Chapel",                          cat: "chapel",     lat: 32.6830, lng: -117.1335 },
    { name: "Housing Office",                  cat: "housing",    lat: 32.6880, lng: -117.1310 },
    { name: "Navy College Office",             cat: "education",  lat: 32.6840, lng: -117.1330 },
    { name: "Finance Office",                  cat: "finance",    lat: 32.6828, lng: -117.1345 },
    { name: "Navy Gateway Fitness Center",     cat: "fitness",    lat: 32.6850, lng: -117.1325 },
    { name: "Galley",                          cat: "dining",     lat: 32.6822, lng: -117.1348 },
    { name: "Child Development Center",        cat: "childcare",  lat: 32.6865, lng: -117.1318 },
  ],
  "Camp Pendleton": [
    { name: "Naval Hospital Camp Pendleton",   cat: "medical",    lat: 33.3760, lng: -117.4680 },
    { name: "MCX Main Exchange",               cat: "exchange",   lat: 33.3780, lng: -117.5590 },
    { name: "Commissary",                      cat: "commissary", lat: 33.3790, lng: -117.5610 },
    { name: "I MEF HQ",                        cat: "admin",      lat: 33.3767, lng: -117.5638 },
    { name: "Main Gate (Gate 1)",              cat: "gate",       lat: 33.3850, lng: -117.5680 },
    { name: "Chapel",                          cat: "chapel",     lat: 33.3775, lng: -117.5630 },
    { name: "Housing Office",                  cat: "housing",    lat: 33.3800, lng: -117.5580 },
    { name: "Education Center",                cat: "education",  lat: 33.3760, lng: -117.5600 },
    { name: "Finance Office",                  cat: "finance",    lat: 33.3770, lng: -117.5640 },
    { name: "Semper Fit Center",               cat: "fitness",    lat: 33.3785, lng: -117.5595 },
    { name: "Mess Hall / Dining Facility",     cat: "dining",     lat: 33.3755, lng: -117.5620 },
    { name: "Child Development Center",        cat: "childcare",  lat: 33.3795, lng: -117.5570 },
  ],
  "Camp Lejeune": [
    { name: "Naval Hospital Camp Lejeune",     cat: "medical",    lat: 34.6780, lng: -77.3480 },
    { name: "MCX (Marine Corps Exchange)",     cat: "exchange",   lat: 34.6850, lng: -77.3380 },
    { name: "Commissary",                      cat: "commissary", lat: 34.6860, lng: -77.3400 },
    { name: "II MEF HQ",                       cat: "admin",      lat: 34.6815, lng: -77.3398 },
    { name: "Wallace Creek Gate",              cat: "gate",       lat: 34.6700, lng: -77.3500 },
    { name: "Main Side Chapel",               cat: "chapel",     lat: 34.6820, lng: -77.3390 },
    { name: "Housing Office",                  cat: "housing",    lat: 34.6870, lng: -77.3370 },
    { name: "Education Center",                cat: "education",  lat: 34.6835, lng: -77.3370 },
    { name: "Finance Office",                  cat: "finance",    lat: 34.6818, lng: -77.3400 },
    { name: "Tarawa Terrace Community Center", cat: "fitness",    lat: 34.6840, lng: -77.3360 },
    { name: "Dining Facility",                 cat: "dining",     lat: 34.6808, lng: -77.3410 },
    { name: "Child Development Center",        cat: "childcare",  lat: 34.6858, lng: -77.3375 },
  ],
  "Lackland AFB": [
    { name: "Wilford Hall Ambulatory Surgical Center", cat: "medical",    lat: 29.3862, lng: -98.6180 },
    { name: "BX (Base Exchange)",                      cat: "exchange",   lat: 29.3870, lng: -98.6210 },
    { name: "Commissary",                              cat: "commissary", lat: 29.3880, lng: -98.6230 },
    { name: "AETC Headquarters",                       cat: "admin",      lat: 29.3843, lng: -98.6201 },
    { name: "Billy Mitchell Blvd Main Gate",           cat: "gate",       lat: 29.3780, lng: -98.6250 },
    { name: "Chapel",                                  cat: "chapel",     lat: 29.3850, lng: -98.6195 },
    { name: "Housing Office",                          cat: "housing",    lat: 29.3890, lng: -98.6190 },
    { name: "Education & Training Center",             cat: "education",  lat: 29.3860, lng: -98.6205 },
    { name: "Finance Office",                          cat: "finance",    lat: 29.3845, lng: -98.6205 },
    { name: "Fitness Center",                          cat: "fitness",    lat: 29.3868, lng: -98.6198 },
    { name: "Dining Facility",                         cat: "dining",     lat: 29.3840, lng: -98.6215 },
    { name: "Child Development Center",                cat: "childcare",  lat: 29.3885, lng: -98.6185 },
  ],
  "Nellis AFB": [
    { name: "Mike O'Callaghan Federal Medical Center", cat: "medical",    lat: 36.0800, lng: -115.0800 },
    { name: "Nellis BX (Base Exchange)",               cat: "exchange",   lat: 36.2400, lng: -115.0330 },
    { name: "Commissary",                              cat: "commissary", lat: 36.2410, lng: -115.0350 },
    { name: "57th Wing Headquarters",                  cat: "admin",      lat: 36.2361, lng: -115.0343 },
    { name: "Main Gate (Las Vegas Blvd N)",            cat: "gate",       lat: 36.2500, lng: -115.0390 },
    { name: "Chapel",                                  cat: "chapel",     lat: 36.2368, lng: -115.0337 },
    { name: "Housing Office",                          cat: "housing",    lat: 36.2420, lng: -115.0320 },
    { name: "Education Center",                        cat: "education",  lat: 36.2375, lng: -115.0330 },
    { name: "Finance Office",                          cat: "finance",    lat: 36.2363, lng: -115.0345 },
    { name: "Fitness Center",                          cat: "fitness",    lat: 36.2385, lng: -115.0328 },
    { name: "Dining Facility (DFAC)",                  cat: "dining",     lat: 36.2356, lng: -115.0350 },
    { name: "Child Development Center",                cat: "childcare",  lat: 36.2415, lng: -115.0338 },
  ],
};

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "fr", name: "French", native: "Français" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "tl", name: "Tagalog", native: "Tagalog" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "zh", name: "Chinese (Simplified)", native: "中文" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
];

const RELIGIOUS_PREFERENCES = [
  "No Preference", "Protestant / Christian", "Catholic", "Orthodox Christian",
  "Jewish", "Muslim / Islam", "Buddhist", "Hindu",
  "Sikh", "LDS / Mormon", "Unitarian Universalist",
  "Prefer not to say", "Other",
];

const RELIGIOUS_RESOURCES = {
  chaplain: [
    { name: "DoD Chaplain Program", url: "https://www.chapnet.army.mil", desc: "Military chaplains provide free, confidential spiritual care and counseling to all service members regardless of faith" },
    { name: "Army Chaplain Corps", url: "https://www.chapnet.army.mil", desc: "Free spiritual care and religious support for all service members and families — bound by privileged communication" },
    { name: "Military OneSource Spiritual Fitness", url: "https://www.militaryonesource.mil/confidential-help/spiritual-fitness/", desc: "Faith-neutral spiritual wellness resources and chaplain referrals for all service members" },
  ],
  protestant: [
    { name: "Armed Forces Baptist Missions", url: "https://www.afbm.org", desc: "Baptist ministry support for military communities worldwide" },
    { name: "Military Ministry (Cru)", url: "https://www.militaryministry.org", desc: "Protestant Christian ministry resources for service members and families" },
    { name: "Chapel on Base", url: "https://www.militaryonesource.mil/confidential-help/spiritual-fitness/", desc: "Locate Protestant chapel services and worship times at your installation" },
  ],
  catholic: [
    { name: "Archdiocese for Military Services", url: "https://www.milarch.org", desc: "Catholic chaplains and Mass services at military installations worldwide" },
    { name: "Catholic Military Ministry", url: "https://www.catholicmilitary.org", desc: "Sacraments, chaplain directories, and faith formation for Catholic service members" },
    { name: "Knights of Columbus Military", url: "https://www.kofc.org/en/what-we-do/faith-in-action/community/military-program.html", desc: "Catholic fraternal support and programs for military members and families" },
  ],
  jewish: [
    { name: "JWB Jewish Chaplains Council", url: "https://www.jwb.org", desc: "Jewish chaplains and religious support for Jewish military personnel and families" },
    { name: "Aleph Institute", url: "https://www.aleph-institute.org", desc: "Jewish outreach, religious materials, and support for service members" },
    { name: "Jewish Community Centers (JCC)", url: "https://www.jcca.org", desc: "Find local JCC community support and programming near military installations" },
  ],
  muslim: [
    { name: "Armed Forces Muslim Association", url: "https://www.afmamembers.org", desc: "Islamic faith resources and community support for Muslim service members" },
    { name: "Muslim Chaplain Network", url: "https://www.militaryonesource.mil/confidential-help/spiritual-fitness/", desc: "Find Muslim chaplains and Islamic services at military installations" },
    { name: "ISNA Military Outreach", url: "https://www.isna.net", desc: "Islamic Society of North America military and veteran outreach programs" },
  ],
  buddhist: [
    { name: "Buddhist Military Sangha", url: "https://www.buddhistmilitarysangha.org", desc: "Buddhist chaplains and meditation resources for military members and their families" },
    { name: "Mindfulness & Spiritual Fitness", url: "https://www.hprc-online.org/social-fitness/spiritual-fitness", desc: "Meditation, mindfulness, and resilience tools for service members" },
  ],
  general: [
    { name: "Chapel Locator", url: "https://www.militaryonesource.mil", desc: "Find on-base chapels, prayer rooms, and multi-faith spaces at your gaining installation" },
    { name: "Spiritual Fitness Program (HPRC)", url: "https://www.hprc-online.org/social-fitness/spiritual-fitness", desc: "Human Performance Resource Center spiritual wellness tools and resources" },
    { name: "Command Chaplain Connect", url: "https://www.chapnet.army.mil", desc: "Contact your unit chaplain for confidential counseling, spiritual care, or community referrals" },
  ],
};

const EDUCATION_RESOURCES = {
  benefits: [
    { name: "MyCAA Scholarship (Military Spouse)", url: "https://mycaa.militaryonesource.mil", desc: "Up to $4,000 for portable career education — spouses of active duty E-1 to E-5, W-1 to W-2, O-1 to O-2", type: "Benefit" },
    { name: "Tuition Assistance (TA)", url: "https://www.military.com/education/money-for-school/tuition-assistance-ta-programs.html", desc: "DoD pays up to 100% tuition for active duty service members pursuing higher education", type: "Benefit" },
    { name: "Post-9/11 GI Bill (Chapter 33)", url: "https://www.va.gov/education/about-gi-bill-benefits/post-9-11/", desc: "Full tuition, housing allowance, and books for eligible veterans — transferable to dependents", type: "Benefit" },
    { name: "Montgomery GI Bill (Chapter 30)", url: "https://www.va.gov/education/about-gi-bill-benefits/montgomery-active-duty/", desc: "Monthly education stipend for active duty service members enrolled in approved programs", type: "Benefit" },
    { name: "SECO Education Guidance (Military Spouses)", url: "https://myseco.militaryonesource.mil", desc: "Free career coaching, scholarship search, and education planning for military spouses", type: "Benefit" },
    { name: "Federal Student Aid — Military", url: "https://studentaid.gov/military", desc: "FAFSA, military-specific grants, and special financial aid provisions for military families", type: "Benefit" },
  ],
  online: [
    { name: "American Military University (AMU/APUS)", url: "https://www.amu.apus.edu", desc: "Military-focused online degrees — tuition discounts for active duty and spouses", type: "Online University" },
    { name: "University of Maryland Global Campus", url: "https://www.umgc.edu", desc: "Affordable online university with a long history of serving military students worldwide", type: "Online University" },
    { name: "Southern New Hampshire University (SNHU)", url: "https://www.snhu.edu/about/military", desc: "Highly affordable online degrees with a dedicated military support team", type: "Online University" },
    { name: "Excelsior University", url: "https://www.excelsior.edu", desc: "Military-friendly online university that accepts ACE military credits and experience", type: "Online University" },
    { name: "Troy University Global Campus", url: "https://www.troy.edu/global-campus/", desc: "Online and on-base programs available at many military installations worldwide", type: "Online University" },
    { name: "Coursera for Military", url: "https://www.coursera.org/government/military", desc: "Certificates and courses from top universities — free and discounted access for military", type: "Online Courses" },
    { name: "LinkedIn Learning (Military)", url: "https://opportunity.linkedin.com/en-us/military", desc: "Free LinkedIn Premium + Learning for transitioning service members and military spouses", type: "Online Courses" },
  ],
  byInstallation: {
    "Fort Liberty": [
      { name: "Fayetteville State University", url: "https://www.uncfsu.edu", desc: "4-year HBCU 7 miles from post — military partnership programs and veteran services", type: "4-Year University" },
      { name: "Methodist University", url: "https://www.methodist.edu", desc: "Private liberal arts university with ROTC program and military-connected student services", type: "4-Year University" },
      { name: "Fayetteville Technical Community College", url: "https://www.faytechcc.edu", desc: "Affordable 2-year degrees and vocational programs — on-post enrollment support available", type: "Community College" },
      { name: "Campbell University", url: "https://www.campbell.edu", desc: "Private university with online/hybrid programs and military scholarship support", type: "4-Year University" },
    ],
    "Fort Bliss": [
      { name: "UTEP (University of Texas at El Paso)", url: "https://www.utep.edu", desc: "Major research university with veteran services center and military tuition rates", type: "4-Year University" },
      { name: "El Paso Community College", url: "https://www.epcc.edu", desc: "Affordable community college with veteran enrollment and career support", type: "Community College" },
      { name: "New Mexico State University", url: "https://www.nmsu.edu", desc: "Research university 45 minutes from Fort Bliss with robust online programs", type: "4-Year University" },
    ],
    "Fort Campbell": [
      { name: "Austin Peay State University", url: "https://www.apsu.edu", desc: "Adjacent to Fort Campbell — widely known as 'The Fort Campbell University' with military-first policies", type: "4-Year University" },
      { name: "Hopkinsville Community College", url: "https://hopkinsville.kctcs.edu", desc: "Affordable 2-year programs with veteran services close to Fort Campbell", type: "Community College" },
    ],
    "Fort Carson": [
      { name: "UCCS (Univ. of Colorado Colorado Springs)", url: "https://www.uccs.edu", desc: "Public research university with active veteran services office and military partnerships", type: "4-Year University" },
      { name: "Colorado State University — Global", url: "https://csuglobal.edu", desc: "Online programs designed around military schedules and transfer credits", type: "Online University" },
      { name: "Pikes Peak State College", url: "https://www.pikespeak.edu", desc: "Community college with military student services and affordable programs near Fort Carson", type: "Community College" },
    ],
    "Fort Drum": [
      { name: "Jefferson Community College (SUNY)", url: "https://www.sunyjefferson.edu", desc: "SUNY community college adjacent to Fort Drum with full military credit recognition", type: "Community College" },
      { name: "SUNY Potsdam", url: "https://www.potsdam.edu", desc: "State university with military-friendly enrollment and degree completion policies", type: "4-Year University" },
    ],
    "Naval Station Norfolk": [
      { name: "Old Dominion University", url: "https://www.odu.edu", desc: "Research university with Navy education partnership programs and military scholarships", type: "4-Year University" },
      { name: "Tidewater Community College", url: "https://www.tcc.edu", desc: "Leading military-connected community college serving the Hampton Roads region", type: "Community College" },
      { name: "Regent University", url: "https://www.regent.edu", desc: "Christian university with military tuition benefits, online programs, and veteran center", type: "4-Year University" },
    ],
    "Naval Base San Diego": [
      { name: "San Diego State University", url: "https://www.sdsu.edu", desc: "Major research university with well-resourced veteran services center", type: "4-Year University" },
      { name: "University of San Diego", url: "https://www.sandiego.edu", desc: "Private university with military scholarships and veteran support office", type: "4-Year University" },
      { name: "Grossmont College", url: "https://www.grossmont.edu", desc: "Community college with dedicated veteran services serving San Diego military families", type: "Community College" },
    ],
    "Camp Pendleton": [
      { name: "CSU San Marcos", url: "https://www.csusm.edu", desc: "Public university near Camp Pendleton with military transfer programs and veteran center", type: "4-Year University" },
      { name: "MiraCosta College", url: "https://www.miracosta.edu", desc: "Military-friendly community college near Pendleton with strong veteran services", type: "Community College" },
    ],
    "Camp Lejeune": [
      { name: "Coastal Carolina Community College", url: "https://www.coastalcarolina.edu", desc: "Community college adjacent to Camp Lejeune with military-focused degree programs", type: "Community College" },
      { name: "University of Mount Olive", url: "https://www.umo.edu", desc: "Private university with a campus near Camp Lejeune and military scholarships", type: "4-Year University" },
    ],
    "Lackland AFB": [
      { name: "UTSA (Univ. of Texas at San Antonio)", url: "https://www.utsa.edu", desc: "Major research university near Lackland with veteran resource programs and GI Bill support", type: "4-Year University" },
      { name: "St. Philip's College", url: "https://www.alamo.edu/spc/", desc: "Community college near Lackland with cybersecurity, healthcare, and trade programs", type: "Community College" },
    ],
    "Nellis AFB": [
      { name: "UNLV (Univ. of Nevada Las Vegas)", url: "https://www.unlv.edu", desc: "Research university with veteran services and flexible evening programs near Nellis", type: "4-Year University" },
      { name: "College of Southern Nevada", url: "https://www.csn.edu", desc: "Affordable community college with military student services near Nellis AFB", type: "Community College" },
    ],
  },
};

const EMPLOYMENT_RESOURCES = {
  boards: [
    { name: "USAJobs.gov", url: "https://www.usajobs.gov", desc: "Official federal job board — includes GS civilian positions on military installations. Use 'military spouse preference' filter.", icon: "🏛️", type: "federal" },
    { name: "Military Spouse Employment Partnership", url: "https://myseco.militaryonesource.mil/portal/", desc: "Network of 700+ employers committed to hiring military spouses — priority placement listings", icon: "⭐", type: "military-spouse" },
    { name: "Hire Heroes USA", url: "https://www.hireheroesusa.org", desc: "Free personalized job placement and career coaching for military spouses and veterans", icon: "🎯", type: "military-spouse" },
    { name: "Blue Star Families Job Board", url: "https://bluestarfam.org/jobs/", desc: "Curated job listings from verified military-friendly employers nationwide", icon: "🌟", type: "military-spouse" },
    { name: "SECO Career Portal", url: "https://myseco.militaryonesource.mil", desc: "Free career coaching, resume help, and job search assistance for military spouses", icon: "🎓", type: "military-spouse" },
    { name: "Indeed", url: "https://www.indeed.com", desc: "Largest general job board — search by ZIP code, salary, and job type including remote", icon: "🔍", type: "civilian" },
    { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs", desc: "Professional networking + job listings with direct employer connections", icon: "💼", type: "civilian" },
    { name: "Handshake (Military)", url: "https://joinhandshake.com/military/", desc: "Early-career and entry-level jobs for military-connected students and spouses", icon: "🤝", type: "civilian" },
    { name: "Remote.co", url: "https://remote.co/remote-jobs/", desc: "Curated remote-only job listings across all industries and experience levels", icon: "🏠", type: "remote" },
    { name: "FlexJobs", url: "https://www.flexjobs.com", desc: "Remote and flexible-schedule jobs — ideal for military spouses managing PCS moves", icon: "⏰", type: "remote" },
    { name: "We Work Remotely", url: "https://weworkremotely.com", desc: "High-quality remote positions in tech, design, marketing, and customer support", icon: "💻", type: "remote" },
    { name: "Virtual Vocations (Military Spouse)", url: "https://www.virtualvocations.com/jobs/telecommute-jobs-for-military-spouses/", desc: "Telecommute and remote jobs curated specifically for military spouses", icon: "📡", type: "remote" },
  ],
  federalTips: [
    "Search USAJobs.gov with 'military spouse' to find Priority Placement Program (PPP) eligible positions",
    "Military spouses of active duty O-1 to O-6 / E-1 to E-9 qualify for non-competitive federal hiring in certain locations",
    "NAF (Non-Appropriated Fund) positions — MWR, commissary, clubs — hire locally and value military-connected applicants",
    "AAFES, NEX, and MCX base exchange positions are available at most installations — apply via their respective websites",
    "OCONUS installations often have fewer civilian applicants for GS positions — filter USAJobs by host country",
  ],
};

const MENTAL_HEALTH_RESOURCES = {
  crisis: [
    { name: "Veterans Crisis Line", url: "https://www.veteranscrisisline.net", desc: "Call or text 988 then press 1 — confidential crisis support 24/7 for veterans and service members", phone: "988 → Press 1" },
    { name: "Military Crisis Line (Chat)", url: "https://www.veteranscrisisline.net/get-help-now/chat/", desc: "Live online chat with crisis counselors — 24/7, confidential", phone: "Chat available 24/7" },
    { name: "SAMHSA National Helpline", url: "https://www.samhsa.gov/find-help/national-helpline", desc: "Free, confidential 24/7 treatment referral and information service for mental health and substance use", phone: "1-800-662-4357" },
  ],
  tricare: [
    { name: "TRICARE Mental Health Finder", url: "https://www.tricare.mil/FindCare", desc: "Find TRICARE-covered mental health and behavioral health providers near your installation" },
    { name: "TRICARE Behavioral Health Coverage", url: "https://www.tricare.mil/CoveredServices/Mental", desc: "Full behavioral health coverage details — outpatient, inpatient, and specialty care" },
    { name: "MHN Government Services", url: "https://www.mhngs.com", desc: "TRICARE behavioral health managed care — find in-network providers by ZIP code" },
  ],
  va: [
    { name: "VA Mental Health Services", url: "https://www.mentalhealth.va.gov", desc: "Comprehensive VA mental health services — accepts VA health coverage for all eligible veterans" },
    { name: "VA Vet Center Program", url: "https://www.vetcenter.va.gov", desc: "Free readjustment counseling at community Vet Centers — accepts all VA health coverage" },
    { name: "VA Same-Day Mental Health Care", url: "https://www.va.gov/health-care/health-needs-conditions/mental-health/", desc: "Walk-in same-day mental health appointments at VA Medical Centers nationwide" },
  ],
  free: [
    { name: "Give an Hour", url: "https://www.giveanhour.org", desc: "Free mental health care from licensed providers for military members and their families" },
    { name: "Headstrong Project", url: "https://www.projectheadstrong.org", desc: "Completely free mental health treatment for post-9/11 veterans — no cost, no co-pay, ever" },
    { name: "Cohen Veterans Network", url: "https://www.cohenveteransnetwork.org", desc: "Free or low-cost mental healthcare clinics for veterans and military families nationwide" },
    { name: "Real Warriors Campaign", url: "https://www.realwarriors.net", desc: "DoD program promoting help-seeking behavior — find providers and peer support resources" },
    { name: "Military Family Advisory Network", url: "https://www.mfan.org", desc: "Free peer support and mental health navigation for military families" },
  ],
  programs: [
    { name: "Military OneSource Counseling", url: "https://www.militaryonesource.mil/health-wellness/mental-health/", desc: "12 free confidential counseling sessions for service members and families — no referral needed" },
    { name: "FOCUS Resilience Program", url: "https://www.focusproject.org", desc: "Free resilience training for military families with children experiencing deployment stress" },
    { name: "Strong Bonds", url: "https://www.strongbonds.org", desc: "Chaplain-led relationship and resilience retreats for couples and families — often free or subsidized" },
  ],
};

const FAMILY_HEALTH_RESOURCES = {
  tricare: [
    { name: "TRICARE Family Coverage", url: "https://www.tricare.mil/Plans/HealthPlans/Prime", desc: "Comprehensive TRICARE Prime coverage for all enrolled family members" },
    { name: "TRICARE Dental Program", url: "https://www.tricare.mil/TDP", desc: "Dental coverage for family members of active duty service members" },
    { name: "TRICARE Find a Provider", url: "https://www.tricare.mil/FindCare", desc: "Locate TRICARE-covered family medicine, pediatric, OB/GYN, and specialist providers" },
    { name: "TRICARE Pharmacy Benefits", url: "https://www.tricare.mil/CoveredServices/Pharmacy", desc: "Prescription coverage and military pharmacy locations for the whole family" },
  ],
  pediatric: [
    { name: "TRICARE Pediatric Care", url: "https://www.tricare.mil/FindCare", desc: "Find pediatric primary and specialty care providers covered by TRICARE" },
    { name: "Military Child Mental Health", url: "https://www.militaryonesource.mil/health-wellness/mental-health/children-and-teens/", desc: "Mental and behavioral health resources specifically for military children experiencing family stress" },
    { name: "Military Child Education Coalition", url: "https://www.militarychild.org", desc: "Education and health resources supporting military-connected children through transitions" },
  ],
  women: [
    { name: "TRICARE Women's Health", url: "https://www.tricare.mil/CoveredServices/WomensHealth", desc: "OB/GYN, maternity care, and preventive services for military women and family members" },
    { name: "TRICARE Maternity Coverage", url: "https://www.tricare.mil/maternity", desc: "Full prenatal, labor/delivery, and postpartum care coverage for military families" },
  ],
  free: [
    { name: "Fisher House Foundation", url: "https://www.fisherhouse.org", desc: "Free lodging for military families while a loved one receives medical care — nationwide locations" },
    { name: "Operation Homefront", url: "https://www.operationhomefront.org", desc: "Financial assistance, housing, and health-related support for military families in need" },
    { name: "VA Caregiver Support", url: "https://www.caregiver.va.gov", desc: "Support programs and services for family caregivers of veterans" },
  ],
};

const SPOUSE_RESOURCES = {
  mentalHealth: [
    { name: "Military OneSource Counseling", url: "https://www.militaryonesource.mil/health-wellness/mental-health/", desc: "12 free confidential counseling sessions for spouses — during and after deployment" },
    { name: "Give an Hour", url: "https://www.giveanhour.org", desc: "Free mental health care from licensed therapists for military spouses and families" },
    { name: "TRICARE Spouse Mental Health", url: "https://www.tricare.mil/CoveredServices/Mental", desc: "Full behavioral health and counseling coverage for military spouses through TRICARE" },
    { name: "Sesame Street for Military Families", url: "https://sesamestreetformilitaryfamilies.org", desc: "Age-appropriate resources helping young children and families cope with deployment" },
  ],
  socialGroups: [
    { name: "Family Readiness Group (FRG)", url: "https://www.army.mil/info/institution/support/frg/", desc: "Unit-level family support network — join before deployment for ongoing updates and community" },
    { name: "Blue Star Families", url: "https://bluestarfam.org", desc: "Events, programs, and community connecting military spouses and families nationwide" },
    { name: "National Military Family Association", url: "https://www.militaryfamily.org", desc: "Advocacy, programs, scholarships, and community for military families" },
    { name: "Military Spouse JD Network", url: "https://www.msjdn.org", desc: "Community and career support for military spouse professionals" },
    { name: "SpouseLink — Military OneSource", url: "https://www.militaryonesource.mil/family-relationships/spouse-and-partner/", desc: "Peer support, connections, and community resources for military spouses" },
  ],
  onBase: [
    { name: "Army Community Service (ACS)", url: "https://www.armyonesource.mil", desc: "On-base counseling, financial planning, deployment support, and emergency assistance" },
    { name: "Fleet & Family Support Center", url: "https://www.cnic.navy.mil/ffsc", desc: "Navy installation family support — workshops, counseling, and deployment resources" },
    { name: "Marine Corps Family Services", url: "https://www.mccs.marines.mil", desc: "On-base family programs, child development, and deployment support services" },
    { name: "Airman & Family Readiness Center", url: "https://www.afcrossroads.com", desc: "Air Force family readiness, employment assistance, and deployment support" },
    { name: "Installation Chaplain Services", url: "https://www.chapnet.army.mil", desc: "Free, confidential counseling and spiritual support for spouses on any installation" },
  ],
  familyAwareness: [
    { name: "Deployment Family Readiness", url: "https://www.militaryonesource.mil/deployment/", desc: "Complete deployment preparation guide including communication planning and financial management" },
    { name: "FOCUS Resilience Training", url: "https://www.focusproject.org", desc: "Free resilience program for military families — helps children and spouses navigate deployment stress" },
    { name: "MilKids Education & Health", url: "https://www.militarychild.org", desc: "Resources for children experiencing school changes and social transitions during deployment" },
    { name: "During Deployment Support", url: "https://www.militaryonesource.mil/deployment/during-deployment/", desc: "Communication tips, self-care guidance, and financial resources for the deployment period" },
  ],
};

const POWER_OF_ATTORNEY_CHECKLIST = [
  "Contact your installation's Legal Assistance Office (JAG) — POA appointments are free for service members",
  "Decide the type: General POA (broad authority) or Special/Limited POA (specific transactions only)",
  "List the exact powers to grant: banking, vehicle sales, housing lease, tax filing, medical decisions",
  "Gather required documents: service member's military ID, spouse's government-issued ID, any relevant financial documents",
  "Attend the JAG appointment — service member signature must be witnessed and notarized by a JAG attorney",
  "Request multiple certified copies — banks, landlords, and agencies often require originals or certified copies",
  "Deliver copies to: bank/credit union, housing office, and any relevant financial institution",
  "Set up joint bank account or add spouse as authorized user on all accounts",
  "Update DEERS (Defense Enrollment Eligibility Reporting System) to ensure spouse has full TRICARE access",
  "Confirm spouse has a current, non-expiring military dependent ID card (DEERS-issued)",
  "Provide spouse with all account numbers, passwords, PIN codes, and emergency financial contacts",
  "Enroll in automatic bill pay for rent/mortgage, utilities, and insurance",
];

const PRE_DEPLOYMENT_SPOUSE_CHECKLIST = [
  "Create a laminated family emergency contact list — unit POC, FRG leader, chaplain, and local support contacts",
  "Gather and organize all critical documents: wills, SGLI, birth certificates, marriage certificate, Social Security cards, passports",
  "Update or create a legal will for the service member — JAG provides this free of charge",
  "Confirm and update SGLI (Servicemembers' Group Life Insurance) beneficiaries",
  "Review TRICARE enrollment — know your PCM, nearest MTF, and how to find emergency care",
  "Complete the Power of Attorney steps above",
  "Set a household budget for the full deployment period with an emergency fund",
  "Agree on a communication plan: frequency, preferred app (WhatsApp, Skype, Signal), and backup method",
  "Join the unit Family Readiness Group (FRG) before departure",
  "Brief children in an age-appropriate way about the deployment timeline and what to expect",
  "Identify a trusted local emergency contact who can assist while service member is deployed",
  "Ensure vehicle registration, inspection sticker, and insurance are current and won't expire during deployment",
  "Photograph all high-value household items for insurance records",
  "Download the branch family app and save the unit's deployment support officer contact",
  "Schedule a pre-deployment counseling session through Military OneSource or the installation chaplain",
];

const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

async function aiCall(system, user, imageBase64 = null, imageMediaType = null) {
  const body = { system, user };
  if (imageBase64) { body.imageBase64 = imageBase64; body.imageMediaType = imageMediaType || "image/jpeg"; }
  const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
  const [isDemo, setIsDemo] = useState(false);
  const [p, setP] = useState({
    firstName:"", lastName:"", branch:"Army", component:"Active Duty", paygrade:"E-5",
    losingInstallation:"", gainingInstallation:"", departingDate:"", unit:"",
    isOverseas:false, hasDependents:false, hasChildren:false, childAges:[], bedrooms:"3",
    language:"en", religion:"No Preference",
  });
  
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  // When branch changes, reset unit (and clear gaining search if the installation no longer has units for the new branch)
  const updBranch = (branch) => setP(prev => ({ ...prev, branch, unit: "" }));
  // When gaining installation changes, reset unit so stale selections don't persist
  const updGainingInstallation = (installation) => {
    setP(prev => ({ ...prev, gainingInstallation: installation, unit: "" }));
  };
  const theme = BRANCH_THEMES[p.branch];
  const losingSuggestions = losingSearch && losingSearch.length > 1
    ? MILITARY_BASES.filter(b => b && b.name && b.name.toLowerCase().includes(losingSearch.toLowerCase())).slice(0, 8)
    : [];
  const gainingSuggestions = gainingSearch && gainingSearch.length > 1
    ? MILITARY_BASES.filter(b => b && b.name && b.name.toLowerCase().includes(gainingSearch.toLowerCase())).slice(0, 8)
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
        {step === 0 && <button onClick={() => setStep(-1)} style={{ marginTop:16, padding:"8px 16px", borderRadius:8, background:"rgba(255,255,255,0.15)", border:`1px solid ${theme.accent}40`, color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:700, cursor:"pointer" }}>See Demo →</button>}
      </div>

      <div style={{ flex:1, padding:"40px", maxWidth:600, margin:"0 auto", width:"100%" }}>
        <div style={{ background:"rgba(0,0,0,0.35)", backdropFilter:"blur(10px)", borderRadius:20, border:"1px solid rgba(255,255,255,0.12)", padding:"32px", position:"relative", zIndex:1 }}>
          {step === -1 && <>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <div style={{ fontSize:48, marginBottom:20 }}>🎬</div>
              <div style={{ fontSize:28, fontWeight:900, color:"#FFFFFF", marginBottom:16 }}>See PCS Express in Action</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:32, lineHeight:1.6 }}>Watch how an E-7 Army soldier with 3 kids can use PCS Express to manage an overseas move to South Korea. This demo showcases all features and capabilities.</p>
              
              <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:14, padding:"20px", marginBottom:24, textAlign:"left", border:"1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:theme.accent, marginBottom:12, textTransform:"uppercase", letterSpacing:".1em" }}>Demo Profile</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Rank:</span><br/><span style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>E-7 (Sergeant First Class)</span></div>
                  <div><span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Branch:</span><br/><span style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>Army</span></div>
                  <div><span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Family:</span><br/><span style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>3 Children (Ages 8, 11, 14)</span></div>
                  <div><span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Move Type:</span><br/><span style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>OCONUS (Overseas)</span></div>
                  <div><span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>From:</span><br/><span style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>Fort Liberty, NC</span></div>
                  <div><span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>To:</span><br/><span style={{ fontSize:14, fontWeight:700, color:"#FFFFFF" }}>Camp Humphreys, SK</span></div>
                </div>
              </div>
              
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <button onClick={() => { setIsDemo(true); onComplete(DEMO_PROFILE); }} style={{ padding:"14px", borderRadius:12, background:theme.accent, color:theme.secondary, border:"none", fontSize:16, fontWeight:900, cursor:"pointer" }}>Launch Demo</button>
                <button onClick={() => setStep(0)} style={{ padding:"14px", borderRadius:12, background:"rgba(255,255,255,0.1)", border:`1px solid rgba(255,255,255,0.2)`, color:"#FFFFFF", fontSize:16, fontWeight:700, cursor:"pointer" }}>Create Profile</button>
              </div>
            </div>
          </>}

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

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>PREFERRED LANGUAGE</label>
              <select value={p.language} onChange={e=>upd("language",e.target.value)} style={inputSt}>
                {SUPPORTED_LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
              </select>
              <div style={{ marginTop:6, fontSize:11, color:"rgba(255,255,255,0.45)" }}>Used for translation services and language-specific resources</div>
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
              <label style={{ fontSize:12, fontWeight:700, color:theme.accent, display:"block", marginBottom:8 }}>RELIGIOUS PREFERENCE <span style={{ fontWeight:400, opacity:0.6, fontSize:11 }}>(for chaplain & community services)</span></label>
              <select value={p.religion} onChange={e=>upd("religion",e.target.value)} style={inputSt}>
                {RELIGIOUS_PREFERENCES.map(r=><option key={r}>{r}</option>)}
              </select>
              <div style={{ marginTop:6, fontSize:11, color:"rgba(255,255,255,0.45)" }}>Helps us surface relevant chaplain resources — optional, stored locally only</div>
            </div>

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

function NavigationMap({ profile, theme }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [directions, setDirections] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState(() => store.get("pcs_routes") || []);
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    // L imported from leaflet npm
    if (!L) return;
    const map = L.map(mapContainerRef.current).setView([38.8, -96.8], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  async function geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (!data.length) throw new Error(`Could not find: "${address}"`);
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  }

  async function handleRoute() {
    if (!from.trim() || !to.trim()) { setError("Please enter both a starting point and destination."); return; }
    setLoading(true); setError(""); setDirections([]); setRouteInfo(null);
    // L imported from leaflet npm
    try {
      const [fromCoord, toCoord] = await Promise.all([geocode(from), geocode(to)]);
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${toCoord.lng},${toCoord.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(osrmUrl);
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes.length) throw new Error("No route found between these locations.");
      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
      const poly = L.polyline(coords, { color: theme.accent, weight: 5, opacity: 0.85 }).addTo(mapRef.current);
      routeLayerRef.current = poly;
      mapRef.current.fitBounds(poly.getBounds(), { padding: [40, 40] });
      const steps = route.legs[0].steps.map(s => ({
        instruction: s.maneuver.type + (s.name ? ` onto ${s.name}` : ""),
        distance: s.distance > 1000 ? `${(s.distance / 1609.34).toFixed(1)} mi` : `${Math.round(s.distance)} m`,
      }));
      setDirections(steps);
      setRouteInfo({
        distance: `${(route.distance / 1609.34).toFixed(1)} miles`,
        duration: `${Math.round(route.duration / 60)} min`,
        fromDisplay: fromCoord.display.split(",").slice(0, 3).join(","),
        toDisplay: toCoord.display.split(",").slice(0, 3).join(","),
        coords,
      });
    } catch (e) {
      setError(e.message || "Routing failed. Check addresses and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!routeInfo) return;
    const name = savedName.trim() || `${from} → ${to}`;
    const newRoute = { id: Date.now(), name, from, to, routeInfo };
    const updated = [newRoute, ...savedRoutes].slice(0, 10);
    setSavedRoutes(updated);
    store.set("pcs_routes", updated);
    setSavedName("");
  }

  function handleLoadRoute(r) {
    // L imported from leaflet npm
    setFrom(r.from); setTo(r.to);
    if (!L || !mapRef.current) return;
    if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
    const poly = L.polyline(r.routeInfo.coords, { color: theme.accent, weight: 5, opacity: 0.85 }).addTo(mapRef.current);
    routeLayerRef.current = poly;
    mapRef.current.fitBounds(poly.getBounds(), { padding: [40, 40] });
    setDirections([]);
    setRouteInfo(r.routeInfo);
    setError("");
  }

  function handleDeleteRoute(id) {
    const updated = savedRoutes.filter(r => r.id !== id);
    setSavedRoutes(updated);
    store.set("pcs_routes", updated);
  }

  const inputSt = { width:"100%", padding:"12px 14px", fontSize:14, borderRadius:10, border:`1.5px solid ${theme.accent}40`, outline:"none", background:"#F9F9F9", color:"#1A1A1A" };

  return (
    <div>
      <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Navigation</h1>
      <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Get driving directions and save routes for offline reference</p>

      <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, maxWidth:700 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:theme.primary, display:"block", marginBottom:6 }}>STARTING POINT</label>
            <input value={from} onChange={e=>setFrom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRoute()} placeholder="e.g. Fort Liberty, NC or your home address" style={inputSt} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:theme.primary, display:"block", marginBottom:6 }}>DESTINATION</label>
            <input value={to} onChange={e=>setTo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRoute()} placeholder={`e.g. ${profile.gainingInstallation || "Fort Campbell, KY"}`} style={inputSt} />
          </div>
          <button onClick={handleRoute} disabled={loading} style={{ padding:"13px", borderRadius:10, background:loading?"#E0E0E0":theme.primary, color:loading?"#999":"#FFFFFF", border:"none", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "Finding Route…" : "🗺️ Get Directions"}
          </button>
        </div>

        {error && <div style={{ marginTop:12, padding:"12px 14px", background:"#FEE", border:"1.5px solid #F88", borderRadius:10, color:"#C33", fontSize:14 }}>{error}</div>}

        {routeInfo && (
          <div style={{ marginTop:16, padding:"14px", background:theme.light, borderRadius:10, border:`1px solid ${theme.accent}30` }}>
            <div style={{ display:"flex", gap:24, marginBottom:8 }}>
              <span style={{ fontWeight:700, color:theme.primary }}>🚗 {routeInfo.distance}</span>
              <span style={{ fontWeight:700, color:theme.primary }}>⏱ {routeInfo.duration}</span>
            </div>
            <div style={{ fontSize:12, color:theme.subtext, marginBottom:12 }}>
              <div><strong>From:</strong> {routeInfo.fromDisplay}</div>
              <div><strong>To:</strong> {routeInfo.toDisplay}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <input value={savedName} onChange={e=>setSavedName(e.target.value)} placeholder="Name this route (optional)" style={{ flex:1, padding:"8px 12px", fontSize:13, borderRadius:8, border:`1px solid ${theme.accent}40`, outline:"none", background:"#FFFFFF" }} />
              <button onClick={handleSave} style={{ padding:"8px 16px", borderRadius:8, background:theme.accent, color:"#FFFFFF", border:"none", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>💾 Save</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background:"#FFFFFF", borderRadius:14, border:`2px solid ${theme.accent}40`, overflow:"hidden", marginBottom:20, maxWidth:700 }}>
        <div ref={mapContainerRef} style={{ height:380, width:"100%" }} />
      </div>

      {directions.length > 0 && (
        <div style={{ background:"#FFFFFF", padding:"20px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, maxWidth:700 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:theme.primary, marginBottom:16 }}>Turn-by-Turn Directions</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:320, overflowY:"auto" }}>
            {directions.map((step, i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px", background:theme.light, borderRadius:8 }}>
                <span style={{ minWidth:26, height:26, borderRadius:"50%", background:theme.accent, color:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                <div>
                  <div style={{ fontSize:14, color:theme.primary, fontWeight:500, textTransform:"capitalize" }}>{step.instruction}</div>
                  <div style={{ fontSize:12, color:theme.subtext, marginTop:2 }}>{step.distance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedRoutes.length > 0 && (
        <div style={{ background:"#FFFFFF", padding:"20px", borderRadius:14, border:`2px solid ${theme.accent}40`, maxWidth:700 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:theme.primary, marginBottom:16 }}>Saved Routes ({savedRoutes.length})</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {savedRoutes.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:theme.light, borderRadius:10, border:`1px solid ${theme.accent}20` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:theme.primary }}>{r.name}</div>
                  <div style={{ fontSize:12, color:theme.subtext }}>{r.routeInfo.distance} · {r.routeInfo.duration}</div>
                </div>
                <button onClick={()=>handleLoadRoute(r)} style={{ padding:"6px 12px", borderRadius:8, background:theme.primary, color:"#FFFFFF", border:"none", fontSize:12, fontWeight:700, cursor:"pointer" }}>Load</button>
                <button onClick={()=>handleDeleteRoute(r.id)} style={{ padding:"6px 10px", borderRadius:8, background:"#FEE", color:"#C33", border:"1px solid #F88", fontSize:12, fontWeight:700, cursor:"pointer" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BaseMapView({ profile, theme }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [installType, setInstallType] = useState("gaining");
  const [activeCategory, setActiveCategory] = useState("all");

  const installation = installType === "gaining" ? profile.gainingInstallation : profile.losingInstallation;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    // L imported from leaflet npm
    if (!L) return;
    const c = installation ? INSTALLATION_COORDS[installation] : null;
    const center = c ? [c.lat, c.lng] : [38.8, -96.8];
    const zoom = c ? c.zoom : 4;
    const map = L.map(mapContainerRef.current).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markersGroupRef.current = null; } };
  }, []);

  useEffect(() => {
    // L imported from leaflet npm
    if (!L || !mapRef.current || !markersGroupRef.current) return;
    const c = installation ? INSTALLATION_COORDS[installation] : null;
    if (c) mapRef.current.setView([c.lat, c.lng], c.zoom);
    markersGroupRef.current.clearLayers();
    const pois = BASE_LOCATIONS[installation] || [];
    const filtered = activeCategory === "all" ? pois : pois.filter(p => p.cat === activeCategory);
    filtered.forEach(poi => {
      const cat = BASE_POI_CATEGORIES[poi.cat];
      if (!cat) return;
      const icon = L.divIcon({
        html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))">${cat.icon}</div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([poi.lat, poi.lng], { icon })
        .bindPopup(`<strong>${poi.name}</strong><br/><span style="color:${cat.color};font-weight:600">${cat.label}</span>`)
        .addTo(markersGroupRef.current);
    });
  }, [installation, activeCategory]);

  const pois = BASE_LOCATIONS[installation] || [];
  const filteredPois = activeCategory === "all" ? pois : pois.filter(p => p.cat === activeCategory);
  const presentCategories = [...new Set(pois.map(p => p.cat))];

  return (
    <div>
      <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Base Map</h1>
      <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Explore buildings and facilities at your installations</p>

      <div style={{ display:"flex", gap:10, marginBottom:16, maxWidth:700 }}>
        {[
          { key:"gaining", label:`Gaining: ${profile.gainingInstallation || "Not set"}` },
          { key:"losing",  label:`Losing: ${profile.losingInstallation  || "Not set"}` },
        ].map(opt => (
          <button key={opt.key} onClick={()=>{ setInstallType(opt.key); setActiveCategory("all"); }} style={{ flex:1, padding:"11px 14px", borderRadius:10, border:installType===opt.key?`2px solid ${theme.accent}`:`1px solid rgba(0,0,0,0.15)`, background:installType===opt.key?theme.primary:"#FFFFFF", color:installType===opt.key?"#FFFFFF":theme.primary, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {installation && !INSTALLATION_COORDS[installation] && (
        <div style={{ padding:"16px", background:"#FFF8E1", border:"1.5px solid #FFD54F", borderRadius:12, marginBottom:16, color:"#5D4037", fontSize:14, maxWidth:700 }}>
          ⚠️ Detailed map data not available for "{installation}" yet.
        </div>
      )}

      {!installation && (
        <div style={{ padding:"16px", background:"#FFF8E1", border:"1.5px solid #FFD54F", borderRadius:12, marginBottom:16, color:"#5D4037", fontSize:14, maxWidth:700 }}>
          ⚠️ No installation set for this selection. Update your profile to add an installation.
        </div>
      )}

      {pois.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16, maxWidth:700 }}>
          <button onClick={()=>setActiveCategory("all")} style={{ padding:"7px 14px", borderRadius:20, border:activeCategory==="all"?`2px solid ${theme.accent}`:`1px solid rgba(0,0,0,0.15)`, background:activeCategory==="all"?theme.primary:"#FFFFFF", color:activeCategory==="all"?"#FFFFFF":theme.primary, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            All ({pois.length})
          </button>
          {presentCategories.map(catKey => {
            const cat = BASE_POI_CATEGORIES[catKey];
            if (!cat) return null;
            const count = pois.filter(p => p.cat === catKey).length;
            return (
              <button key={catKey} onClick={()=>setActiveCategory(catKey)} style={{ padding:"7px 14px", borderRadius:20, border:activeCategory===catKey?`2px solid ${cat.color}`:`1px solid rgba(0,0,0,0.15)`, background:activeCategory===catKey?cat.color:"#FFFFFF", color:activeCategory===catKey?"#FFFFFF":"#333", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div style={{ background:"#FFFFFF", borderRadius:14, border:`2px solid ${theme.accent}40`, overflow:"hidden", marginBottom:20, maxWidth:700 }}>
        <div ref={mapContainerRef} style={{ height:450, width:"100%" }} />
      </div>

      {filteredPois.length > 0 && (
        <div style={{ background:"#FFFFFF", padding:"20px", borderRadius:14, border:`2px solid ${theme.accent}40`, maxWidth:700 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:theme.primary, marginBottom:16 }}>
            {installation} — {activeCategory === "all" ? "All Facilities" : (BASE_POI_CATEGORIES[activeCategory]?.label || activeCategory)}
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:10 }}>
            {filteredPois.map((poi, i) => {
              const cat = BASE_POI_CATEGORIES[poi.cat];
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:theme.light, borderRadius:10, border:`1px solid ${theme.accent}20` }}>
                  <span style={{ fontSize:22 }}>{cat?.icon || "📍"}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:theme.primary }}>{poi.name}</div>
                    <div style={{ fontSize:12, color:cat?.color || theme.subtext, fontWeight:600 }}>{cat?.label || poi.cat}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopApp({ profile, onReset }) {
  const [screen, setScreen] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [dashboardCollapsed, setDashboardCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pcs_dashboard_collapsed")) === true; } catch { return false; }
  });
  const [progress, setProgress] = useState(() => { try { return Number(localStorage.getItem("pcs_progress")) || 0; } catch { return 0; } });
  const [poaList, setPoaList] = useState(() => store.get("pcs_poa") || POWER_OF_ATTORNEY_CHECKLIST.map(t => ({ task: t, done: false })));
  const [preDeployList, setPreDeployList] = useState(() => store.get("pcs_predeploy") || PRE_DEPLOYMENT_SPOUSE_CHECKLIST.map(t => ({ task: t, done: false })));
  const [transText, setTransText] = useState("");
  const [transResult, setTransResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError] = useState("");
  const [transHistory, setTransHistory] = useState(() => store.get("pcs_translations") || []);
  const [transImagePreview, setTransImagePreview] = useState("");
  const [transImageBase64, setTransImageBase64] = useState("");
  const [transImageMediaType, setTransImageMediaType] = useState("image/jpeg");
  const [transMode, setTransMode] = useState("text");
  const [eduFilter, setEduFilter] = useState("all");
  const [empPosition, setEmpPosition] = useState("");
  const [empSkills, setEmpSkills] = useState([]);
  const [empSkillInput, setEmpSkillInput] = useState("");
  const [empCategory, setEmpCategory] = useState("all");
  const [empAiResults, setEmpAiResults] = useState("");
  const [empAiLoading, setEmpAiLoading] = useState(false);
  const [empAiError, setEmpAiError] = useState("");
  const theme = BRANCH_THEMES[profile.branch];
  const content = BRANCH_CONTENT[profile.branch];
  const branchBusinesses = VETERAN_BUSINESSES[profile.branch] || [];

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (!newIsMobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          <div style={{ fontSize:11, letterSpacing:".15em", color:theme.accent, fontWeight:800, marginBottom:8 }}>PCS EXPRESS {profile.branch === "Demo" ? "(DEMO MODE)" : ""}</div>
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
              { id:"religious", icon:"⛪", label:"Religious Services" },
              { id:"mental", icon:"🧠", label:"Mental Health" },
              { id:"familyhealth", icon:"❤️", label:"Family Health" },
              { id:"spouse", icon:"💑", label:"Spouse Guide" },
              { id:"education", icon:"🎓", label:"Education" },
              { id:"employment", icon:"💼", label:"Spouse Employment" },
              { id:"translation", icon:"🌐", label:"Translation" },
              { id:"navigation", icon:"🗺️", label:"Navigation" },
              { id:"basemap", icon:"🏛️", label:"Base Map" },
              { id:"ask", icon:"?", label:"Ask AI" },
            ].map(nav => (
              <button key={nav.id} onClick={() => setScreen(nav.id)} style={{ textAlign:"left", padding:"12px 14px", borderRadius:10, border:screen===nav.id?`2px solid ${theme.accent}`:"1px solid rgba(255,255,255,0.15)", background:screen===nav.id?theme.accent+"20":"rgba(255,255,255,0.05)", color:screen===nav.id?theme.accent:"rgba(255,255,255,0.7)", fontSize:14, fontWeight:screen===nav.id?700:500, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }}>{nav.icon}</span>{nav.label}
              </button>
            ))}
          </nav>

          <button onClick={() => { onReset(); }} style={{ marginTop:"auto", width:"100%", padding:"12px", borderRadius:10, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:700, cursor:"pointer" }}>Exit Demo / Edit Profile</button>
        </div>
      </div>

      <div style={{ flex:1, padding:"40px", overflowY:"auto" }}>
        <div style={{ maxWidth:1000 }}>

          {/* ── Interactive PCS Progress Bar ── */}
          <div style={{ background:"#FFFFFF", border:`2px solid ${theme.accent}40`, borderRadius:14, padding:"16px 22px", marginBottom:28, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:800, color:theme.primary }}>PCS Progress</div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:13, color:"#888" }}>Drag or click to update</span>
                <span style={{ fontSize:18, fontWeight:900, color: progress === 100 ? "#2E7D32" : theme.accent }}>{progress}%</span>
                {progress === 100 && <span style={{ fontSize:12, fontWeight:700, background:"#2E7D32", color:"#FFF", borderRadius:6, padding:"2px 8px" }}>COMPLETE ✓</span>}
              </div>
            </div>
            <input
              type="range" min="0" max="100" value={progress}
              onChange={e => { const v = Number(e.target.value); setProgress(v); localStorage.setItem("pcs_progress", v); }}
              style={{ width:"100%", cursor:"pointer", accentColor:theme.accent, height:6 }}
            />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"#BBB" }}>
              <span>0% — Not started</span>
              <span>50% — In progress</span>
              <span>100% — Complete</span>
            </div>
          </div>

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

          {screen === "mental" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Mental Health Services</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Crisis resources, TRICARE providers, VA services, and free mental health support</p>

              {/* Crisis line — always first and prominent */}
              <div style={{ background:"#B71C1C", borderRadius:14, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ fontSize:32, flexShrink:0 }}>🆘</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:900, color:"#FFF", marginBottom:6 }}>In Crisis? Get Help Now</div>
                  {MENTAL_HEALTH_RESOURCES.crisis.map((r, i) => (
                    <div key={i} style={{ marginBottom:i < MENTAL_HEALTH_RESOURCES.crisis.length - 1 ? 10 : 0 }}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color:"#FFCDD2", fontWeight:700, fontSize:14 }}>{r.name}</a>
                      <span style={{ color:"#FFCDD2", fontSize:14 }}> — {r.phone}</span>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                { key:"tricare", label:"TRICARE Mental Health", icon:"⚕️", desc:"Find TRICARE-covered behavioral health providers near your installation" },
                { key:"va", label:"VA Mental Health Services", icon:"🎖️", desc:"VA health coverage accepted — walk-in and scheduled care" },
                { key:"free", label:"Free Mental Health Services", icon:"💙", desc:"No cost, no insurance required" },
                { key:"programs", label:"Military Programs & Counseling", icon:"🤝", desc:"DoD-sponsored programs for service members and families" },
              ].map(({ key, label, icon, desc }) => (
                <div key={key} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:22 }}>{icon}</span>{label}
                  </div>
                  <div style={{ fontSize:13, color:"#777", marginBottom:14 }}>{desc}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {MENTAL_HEALTH_RESOURCES[key].map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding:"12px 14px", background:theme.light, border:`1px solid ${theme.accent}30`, borderRadius:10, textDecoration:"none", display:"block" }}>
                        <div style={{ fontWeight:700, color:theme.primary, fontSize:14, marginBottom:3 }}>{r.name}</div>
                        <div style={{ fontSize:12, color:"#666" }}>{r.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {screen === "familyhealth" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Family Health Services</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>TRICARE family coverage, pediatric care, women's health, and free family assistance</p>

              {[
                { key:"tricare", label:"TRICARE Family Coverage", icon:"⚕️", desc:"Coverage for your enrolled spouse, children, and dependents" },
                { key:"pediatric", label:"Pediatric & Child Health", icon:"👶", desc:"Primary care, mental health, and specialty services for military children" },
                { key:"women", label:"Women's Health & Maternity", icon:"🌸", desc:"OB/GYN, prenatal, and women's preventive care" },
                { key:"free", label:"Free & Assistance Programs", icon:"💙", desc:"No-cost family support, lodging, and emergency assistance" },
              ].map(({ key, label, icon, desc }) => (
                <div key={key} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:22 }}>{icon}</span>{label}
                  </div>
                  <div style={{ fontSize:13, color:"#777", marginBottom:14 }}>{desc}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {FAMILY_HEALTH_RESOURCES[key].map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding:"12px 14px", background:theme.light, border:`1px solid ${theme.accent}30`, borderRadius:10, textDecoration:"none", display:"block" }}>
                        <div style={{ fontWeight:700, color:theme.primary, fontSize:14, marginBottom:3 }}>{r.name}</div>
                        <div style={{ fontSize:12, color:"#666" }}>{r.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {screen === "spouse" && (() => {
            const poaDone = poaList.filter(i => i.done).length;
            const preDeployDone = preDeployList.filter(i => i.done).length;
            const togglePoa = (idx) => {
              const updated = poaList.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
              setPoaList(updated);
              store.set("pcs_poa", updated);
            };
            const togglePreDeploy = (idx) => {
              const updated = preDeployList.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
              setPreDeployList(updated);
              store.set("pcs_predeploy", updated);
            };
            return (
              <div>
                <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Spouse Deployment Guide</h1>
                <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>Comprehensive support for military spouses — before, during, and after deployment</p>

                {/* Deployment coping banner */}
                <div style={{ background:theme.light, border:`2px solid ${theme.accent}50`, borderRadius:14, padding:"20px 24px", marginBottom:28, display:"flex", alignItems:"flex-start", gap:16 }}>
                  <div style={{ fontSize:36, flexShrink:0 }}>💑</div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:theme.primary, marginBottom:6 }}>You Are Not Alone</div>
                    <div style={{ fontSize:14, color:"#555", lineHeight:1.7 }}>Deployment is challenging — but thousands of military spouses navigate it every year with the right support network. This guide provides mental health resources, social connections, on-base services, and every checklist you need to prepare before your service member departs.</div>
                  </div>
                </div>

                {/* Sections: mental health, social, on-base, family */}
                {[
                  { key:"mentalHealth", label:"Mental Health for Spouses", icon:"🧠", desc:"Free counseling, therapy, and peer support designed for military spouses" },
                  { key:"socialGroups", label:"Social Groups & FRG", icon:"🤝", desc:"Family Readiness Groups, spouse clubs, and national military spouse communities" },
                  { key:"onBase", label:"On-Base Support Services", icon:"🏛️", desc:"Installation resources available to military spouses 24/7" },
                  { key:"familyAwareness", label:"Family Awareness & Coping", icon:"👨‍👩‍👧", desc:"Resources for children, communication tips, and family resilience during deployment" },
                ].map(({ key, label, icon, desc }) => (
                  <div key={key} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:22 }}>{icon}</span>{label}
                    </div>
                    <div style={{ fontSize:13, color:"#777", marginBottom:14 }}>{desc}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {SPOUSE_RESOURCES[key].map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding:"12px 14px", background:theme.light, border:`1px solid ${theme.accent}30`, borderRadius:10, textDecoration:"none", display:"block" }}>
                          <div style={{ fontWeight:700, color:theme.primary, fontSize:13, marginBottom:3 }}>{r.name}</div>
                          <div style={{ fontSize:11, color:"#666" }}>{r.desc}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Power of Attorney Checklist */}
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <div style={{ fontSize:18, fontWeight:900, color:theme.primary, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:22 }}>📜</span> Power of Attorney Checklist
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color: poaDone === poaList.length ? "#2E7D32" : theme.subtext }}>
                      {poaDone}/{poaList.length} complete
                    </div>
                  </div>
                  <div style={{ height:6, background:"#F0F0F0", borderRadius:6, marginBottom:16, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(poaDone/poaList.length)*100}%`, background:`linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, borderRadius:6, transition:"width 0.3s" }} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {poaList.map((item, idx) => (
                      <div key={idx} onClick={() => togglePoa(idx)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", borderRadius:10, background: item.done ? `${theme.accent}12` : "#FAFAFA", border:`1px solid ${item.done ? theme.accent+"50" : "#E8E8E8"}`, cursor:"pointer" }}>
                        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${item.done ? theme.accent : "#CCC"}`, background: item.done ? theme.accent : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {item.done && <svg width="10" height="8" viewBox="0 0 10 8"><polyline points="1,4 3.5,6.5 9,1" stroke="#FFF" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                        </div>
                        <div style={{ fontSize:13, color: item.done ? "#666" : "#222", textDecoration: item.done ? "line-through" : "none", lineHeight:1.5 }}>{item.task}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-Deployment Spouse Checklist */}
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <div style={{ fontSize:18, fontWeight:900, color:theme.primary, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:22 }}>✈️</span> Pre-Deployment Checklist
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color: preDeployDone === preDeployList.length ? "#2E7D32" : theme.subtext }}>
                      {preDeployDone}/{preDeployList.length} complete
                    </div>
                  </div>
                  <div style={{ height:6, background:"#F0F0F0", borderRadius:6, marginBottom:16, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(preDeployDone/preDeployList.length)*100}%`, background:`linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, borderRadius:6, transition:"width 0.3s" }} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {preDeployList.map((item, idx) => (
                      <div key={idx} onClick={() => togglePreDeploy(idx)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", borderRadius:10, background: item.done ? `${theme.accent}12` : "#FAFAFA", border:`1px solid ${item.done ? theme.accent+"50" : "#E8E8E8"}`, cursor:"pointer" }}>
                        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${item.done ? theme.accent : "#CCC"}`, background: item.done ? theme.accent : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {item.done && <svg width="10" height="8" viewBox="0 0 10 8"><polyline points="1,4 3.5,6.5 9,1" stroke="#FFF" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                        </div>
                        <div style={{ fontSize:13, color: item.done ? "#666" : "#222", textDecoration: item.done ? "line-through" : "none", lineHeight:1.5 }}>{item.task}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {screen === "education" && (() => {
            const localSchools = EDUCATION_RESOURCES.byInstallation[profile.gainingInstallation] || [];
            const typeFilters = ["all","4-Year University","Community College","Online University","Online Courses","Benefit"];
            const allItems = [
              ...EDUCATION_RESOURCES.benefits,
              ...EDUCATION_RESOURCES.online,
              ...localSchools,
            ];
            const filtered = eduFilter === "all" ? allItems : allItems.filter(i => i.type === eduFilter);
            return (
              <div>
                <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Education</h1>
                <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>
                  Local institutions near {profile.gainingInstallation || "your installation"}, online programs, and military education benefits
                </p>

                {/* Filter tabs */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24 }}>
                  {typeFilters.map(f => (
                    <button key={f} onClick={() => setEduFilter(f)} style={{ padding:"8px 16px", borderRadius:20, border:`1.5px solid ${eduFilter===f?theme.accent:theme.accent+"40"}`, background: eduFilter===f ? theme.accent+"22" : "transparent", color: eduFilter===f ? theme.primary : "#888", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      {f === "all" ? "All Resources" : f}
                    </button>
                  ))}
                </div>

                {/* Local schools callout */}
                {localSchools.length > 0 && (eduFilter === "all" || eduFilter === "4-Year University" || eduFilter === "Community College") && (
                  <div style={{ background:theme.light, border:`2px solid ${theme.accent}50`, borderRadius:14, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:24 }}>📍</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:theme.primary }}>
                        {localSchools.length} institution{localSchools.length !== 1 ? "s" : ""} near {profile.gainingInstallation}
                      </div>
                      <div style={{ fontSize:12, color:"#777" }}>Showing local schools plus all online and benefit programs</div>
                    </div>
                  </div>
                )}

                {localSchools.length === 0 && (eduFilter === "all" || eduFilter === "4-Year University" || eduFilter === "Community College") && (
                  <div style={{ background:"#FFF8E1", border:"1.5px solid #FFD54F", borderRadius:12, padding:"12px 18px", marginBottom:20, fontSize:13, color:"#5D4037" }}>
                    📍 No local institutions on file for <strong>{profile.gainingInstallation || "your installation"}</strong> — showing online and benefit programs below.
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {filtered.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ background:"#FFFFFF", padding:"20px", borderRadius:14, border:`2px solid ${theme.accent}40`, textDecoration:"none", display:"block", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", transition:"transform 0.15s" }} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div style={{ fontSize:15, fontWeight:800, color:theme.primary, lineHeight:1.3 }}>{item.name}</div>
                        <span style={{ fontSize:10, fontWeight:700, background: item.type === "Benefit" ? "#2E7D32" : item.type?.includes("Online") ? theme.primary : theme.accent+"30", color: item.type === "Benefit" ? "#FFF" : item.type?.includes("Online") ? "#FFF" : theme.primary, borderRadius:6, padding:"2px 7px", whiteSpace:"nowrap", marginLeft:8, flexShrink:0 }}>
                          {item.type}
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:"#666", lineHeight:1.6 }}>{item.desc}</div>
                    </a>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div style={{ textAlign:"center", padding:"48px 20px", color:"#AAA" }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>🎓</div>
                    <div style={{ fontSize:15, fontWeight:700 }}>No results for this filter</div>
                  </div>
                )}
              </div>
            );
          })()}

          {screen === "employment" && (() => {
            const categoryFilters = [
              { id:"all", label:"All Jobs" },
              { id:"military-spouse", label:"Military Spouse" },
              { id:"federal", label:"Federal & Base" },
              { id:"remote", label:"Remote" },
              { id:"civilian", label:"Civilian" },
            ];
            const filteredBoards = empCategory === "all"
              ? EMPLOYMENT_RESOURCES.boards
              : EMPLOYMENT_RESOURCES.boards.filter(b => b.type === empCategory);

            const handleEmpSearch = async () => {
              if (!empPosition.trim() && empSkills.length === 0) return;
              setEmpAiLoading(true); setEmpAiResults(""); setEmpAiError("");
              try {
                const sys = `You are a military spouse career counselor. The service member is stationed at ${profile.gainingInstallation || "a military installation"} (${profile.branch}). Provide 6 specific, actionable job recommendations for their spouse based on the desired position and skills. For each recommendation include: Job Title, Why It Fits (1-2 sentences), Where to Apply (specific job board or employer site), and Type (Remote / Local / Federal). Format with clear headers. End with 2 quick resume tips tailored to military spouses.`;
                const userMsg = `Desired position: ${empPosition || "open to suggestions"}\nSkills: ${empSkills.length > 0 ? empSkills.join(", ") : "not specified"}\nInstallation: ${profile.gainingInstallation || "not specified"}`;
                const result = await aiCall(sys, userMsg);
                setEmpAiResults(result);
              } catch (err) {
                setEmpAiError(err.message || "Search failed");
              } finally {
                setEmpAiLoading(false);
              }
            };

            return (
              <div>
                <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Spouse Employment</h1>
                <p style={{ fontSize:16, color:"#666", marginBottom:24 }}>
                  AI job recommendations, active listings, federal positions, and remote opportunities near {profile.gainingInstallation || "your installation"}
                </p>

                {/* AI Search Panel */}
                <div style={{ background:"#FFFFFF", padding:"28px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:24, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:17, fontWeight:900, color:theme.primary, marginBottom:18 }}>🤖 AI Job Recommendations</div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:800, color:theme.subtext, display:"block", marginBottom:6, letterSpacing:".08em" }}>DESIRED POSITION / JOB TITLE</label>
                      <input
                        value={empPosition}
                        onChange={e => setEmpPosition(e.target.value)}
                        placeholder="e.g. Registered Nurse, Software Developer, Teacher…"
                        style={{ width:"100%", fontSize:14, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${theme.accent}40`, outline:"none", fontFamily:"inherit", boxSizing:"border-box", color:"#1A1A1A" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:800, color:theme.subtext, display:"block", marginBottom:6, letterSpacing:".08em" }}>ADD SKILLS (press Enter or comma)</label>
                      <input
                        value={empSkillInput}
                        onChange={e => setEmpSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if ((e.key === "Enter" || e.key === ",") && empSkillInput.trim()) {
                            e.preventDefault();
                            const skill = empSkillInput.trim().replace(/,$/, "");
                            if (skill && !empSkills.includes(skill)) setEmpSkills(prev => [...prev, skill]);
                            setEmpSkillInput("");
                          }
                        }}
                        placeholder="e.g. Python, Project Management, EMT…"
                        style={{ width:"100%", fontSize:14, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${theme.accent}40`, outline:"none", fontFamily:"inherit", boxSizing:"border-box", color:"#1A1A1A" }}
                      />
                    </div>
                  </div>

                  {/* Skills tags */}
                  {empSkills.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                      {empSkills.map((skill, i) => (
                        <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:theme.accent+"22", border:`1px solid ${theme.accent}50`, fontSize:13, fontWeight:700, color:theme.primary }}>
                          {skill}
                          <button onClick={() => setEmpSkills(prev => prev.filter((_,j) => j !== i))} style={{ background:"none", border:"none", color:theme.primary, cursor:"pointer", fontSize:14, lineHeight:1, padding:0 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleEmpSearch}
                    disabled={empAiLoading || (!empPosition.trim() && empSkills.length === 0)}
                    style={{ padding:"12px 28px", borderRadius:10, background: empAiLoading || (!empPosition.trim() && empSkills.length === 0) ? "#E0E0E0" : theme.primary, color: empAiLoading || (!empPosition.trim() && empSkills.length === 0) ? "#999" : "#FFF", border:"none", fontSize:14, fontWeight:800, cursor:"pointer" }}
                  >
                    {empAiLoading ? "Searching…" : "Get AI Job Recommendations"}
                  </button>

                  {empAiError && (
                    <div style={{ marginTop:14, padding:"12px 16px", background:"#FEE", border:"1.5px solid #F88", borderRadius:10, color:"#C33", fontSize:13 }}>⚠️ {empAiError}</div>
                  )}
                  {empAiResults && (
                    <div style={{ marginTop:16, padding:"20px", background:theme.light, border:`1.5px solid ${theme.accent}40`, borderRadius:10, fontSize:14, color:theme.primary, lineHeight:1.85, whiteSpace:"pre-wrap" }}>
                      {empAiResults}
                    </div>
                  )}
                </div>

                {/* Category filter */}
                <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                  {categoryFilters.map(f => (
                    <button key={f.id} onClick={() => setEmpCategory(f.id)} style={{ padding:"8px 18px", borderRadius:20, border:`1.5px solid ${empCategory===f.id?theme.accent:theme.accent+"40"}`, background: empCategory===f.id ? theme.accent+"22" : "transparent", color: empCategory===f.id ? theme.primary : "#888", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Job board cards */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:28 }}>
                  {filteredBoards.map((board, i) => (
                    <a key={i} href={board.url} target="_blank" rel="noopener noreferrer" style={{ background:"#FFFFFF", padding:"20px", borderRadius:14, border:`2px solid ${theme.accent}40`, textDecoration:"none", display:"block", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", transition:"transform 0.15s" }} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:22 }}>{board.icon}</span>
                          <div style={{ fontSize:15, fontWeight:800, color:theme.primary }}>{board.name}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, background: board.type === "remote" ? "#1565C0" : board.type === "federal" ? "#2E7D32" : board.type === "military-spouse" ? theme.accent+"40" : "#EEE", color: board.type === "remote" ? "#FFF" : board.type === "federal" ? "#FFF" : theme.primary, borderRadius:6, padding:"2px 8px", whiteSpace:"nowrap", marginLeft:8, flexShrink:0 }}>
                          {board.type === "military-spouse" ? "MIL SPOUSE" : board.type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:"#666", lineHeight:1.6 }}>{board.desc}</div>
                    </a>
                  ))}
                </div>

                {/* Federal hiring tips */}
                <div style={{ background:theme.light, border:`1.5px solid ${theme.accent}40`, borderRadius:14, padding:"20px 24px" }}>
                  <div style={{ fontSize:15, fontWeight:800, color:theme.primary, marginBottom:12 }}>🏛️ Federal & Base Hiring Tips for Military Spouses</div>
                  <ul style={{ margin:0, paddingLeft:20, fontSize:13, color:"#444", lineHeight:1.95 }}>
                    {EMPLOYMENT_RESOURCES.federalTips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </div>
            );
          })()}

          {screen === "translation" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Translation Services</h1>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
                <span style={{ fontSize:13, fontWeight:700, background:theme.accent, color:theme.secondary, borderRadius:6, padding:"3px 10px" }}>OCONUS</span>
                <p style={{ fontSize:16, color:"#666", margin:0 }}>Translate text or photos from any language into English</p>
              </div>

              {/* Mode tabs */}
              <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                {[["text","✏️ Text Input"],["photo","📷 Photo / Image"]].map(([mode, label]) => (
                  <button key={mode} onClick={() => { setTransMode(mode); setTransResult(""); setTransError(""); }} style={{ padding:"10px 20px", borderRadius:10, border:`2px solid ${transMode===mode?theme.accent:theme.accent+"40"}`, background: transMode===mode?theme.accent+"20":"transparent", color: transMode===mode?theme.primary:"#888", fontWeight:700, fontSize:14, cursor:"pointer" }}>{label}</button>
                ))}
              </div>

              <div style={{ background:"#FFFFFF", padding:"28px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:24, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                {transMode === "text" ? (
                  <>
                    <label style={{ fontSize:12, fontWeight:800, color:theme.subtext, display:"block", marginBottom:8, letterSpacing:".08em" }}>ENTER TEXT TO TRANSLATE</label>
                    <textarea
                      value={transText}
                      onChange={e => setTransText(e.target.value)}
                      placeholder="Paste or type text in any language…"
                      rows={5}
                      style={{ width:"100%", fontSize:15, padding:"12px 14px", borderRadius:10, border:`1.5px solid ${theme.accent}40`, outline:"none", resize:"vertical", fontFamily:"inherit", color:"#1A1A1A", boxSizing:"border-box" }}
                    />
                  </>
                ) : (
                  <>
                    <label style={{ fontSize:12, fontWeight:800, color:theme.subtext, display:"block", marginBottom:8, letterSpacing:".08em" }}>SELECT OR CAPTURE A PHOTO</label>
                    <input
                      type="file" accept="image/*" capture="environment"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          setTransImagePreview(ev.target.result);
                          setTransImageBase64(ev.target.result.split(",")[1]);
                          setTransImageMediaType(file.type || "image/jpeg");
                          setTransResult(""); setTransError("");
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ marginBottom:14 }}
                    />
                    {transImagePreview && (
                      <img src={transImagePreview} alt="preview" style={{ maxWidth:"100%", maxHeight:260, borderRadius:10, objectFit:"contain", border:`1.5px solid ${theme.accent}30`, display:"block", marginBottom:8 }} />
                    )}
                  </>
                )}

                <button
                  onClick={async () => {
                    if (transMode === "text" && !transText.trim()) return;
                    if (transMode === "photo" && !transImageBase64) return;
                    setTransLoading(true); setTransResult(""); setTransError("");
                    try {
                      const sys = "You are a professional military translator. Your job is to extract all readable text from the input and provide an accurate English translation. If text is a sign, document, or form, preserve the structure. Output only the translated English text followed by a brief note on the source language detected.";
                      const userMsg = transMode === "text"
                        ? `Translate the following text to English:\n\n${transText}`
                        : "Extract and translate all text visible in this image to English.";
                      const result = await aiCall(sys, userMsg, transMode === "photo" ? transImageBase64 : null, transMode === "photo" ? transImageMediaType : null);
                      setTransResult(result);
                      const entry = { date: new Date().toLocaleString(), mode: transMode, input: transMode === "text" ? transText.slice(0, 80) : "[Photo]", result };
                      const updated = [entry, ...transHistory].slice(0, 20);
                      setTransHistory(updated);
                      store.set("pcs_translations", updated);
                    } catch (err) {
                      setTransError(err.message || "Translation failed");
                    } finally {
                      setTransLoading(false);
                    }
                  }}
                  disabled={transLoading || (transMode === "text" ? !transText.trim() : !transImageBase64)}
                  style={{ marginTop:14, padding:"12px 28px", borderRadius:10, background: transLoading || (transMode === "text" ? !transText.trim() : !transImageBase64) ? "#E0E0E0" : theme.primary, color: transLoading || (transMode === "text" ? !transText.trim() : !transImageBase64) ? "#999" : "#FFF", border:"none", fontSize:14, fontWeight:800, cursor:"pointer" }}
                >
                  {transLoading ? "Translating…" : "Translate to English"}
                </button>

                {transError && (
                  <div style={{ marginTop:14, padding:"12px 16px", background:"#FEE", border:"1.5px solid #F88", borderRadius:10, color:"#C33", fontSize:13 }}>⚠️ {transError}</div>
                )}
                {transResult && (
                  <div style={{ marginTop:14, padding:"18px", background:theme.light, border:`1.5px solid ${theme.accent}40`, borderRadius:10 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:theme.subtext, marginBottom:8, letterSpacing:".08em" }}>ENGLISH TRANSLATION</div>
                    <div style={{ fontSize:14, color:theme.primary, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{transResult}</div>
                  </div>
                )}
              </div>

              {/* Translation history */}
              {transHistory.length > 0 && (
                <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:theme.primary }}>📁 Translation History</div>
                    <button onClick={() => { setTransHistory([]); store.set("pcs_translations", []); }} style={{ fontSize:12, color:"#999", background:"none", border:"none", cursor:"pointer" }}>Clear</button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:360, overflowY:"auto" }}>
                    {transHistory.map((entry, i) => (
                      <div key={i} style={{ padding:"12px 14px", background:"#FAFAFA", border:"1px solid #EEE", borderRadius:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:theme.accent }}>{entry.mode === "photo" ? "📷 Photo" : "✏️ Text"}</span>
                          <span style={{ fontSize:11, color:"#AAA" }}>{entry.date}</span>
                        </div>
                        <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Input: {entry.input}</div>
                        <div style={{ fontSize:13, color:"#333", lineHeight:1.6 }}>{entry.result.slice(0, 200)}{entry.result.length > 200 ? "…" : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {screen === "religious" && (
            <div>
              <h1 style={{ fontSize:32, fontWeight:900, color:theme.primary, marginBottom:8 }}>Religious Services</h1>
              <p style={{ fontSize:16, color:"#666", marginBottom:28 }}>Unit chaplain support and community faith accommodations for all beliefs</p>

              {/* Chaplain confidentiality banner */}
              <div style={{ background:theme.light, border:`2px solid ${theme.accent}50`, borderRadius:14, padding:"20px 24px", marginBottom:28, display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ fontSize:36, flexShrink:0 }}>⛪</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:theme.primary, marginBottom:6 }}>Military Chaplains — Confidential & Always Free</div>
                  <div style={{ fontSize:14, color:"#555", lineHeight:1.7 }}>Your unit chaplain provides free, confidential spiritual care and counseling to <strong>all service members regardless of faith or belief</strong>. Chaplains are bound by privileged communication — what you share stays with them. Contact your command chaplain anytime, no appointment needed.</div>
                </div>
              </div>

              {/* User faith preference highlight */}
              {profile.religion && profile.religion !== "No Preference" && profile.religion !== "Prefer not to say" && (
                <div style={{ background:"#FFFFFF", border:`2px solid ${theme.accent}`, borderRadius:14, padding:"16px 22px", marginBottom:24, display:"flex", alignItems:"center", gap:14, boxShadow:`0 4px 14px ${theme.accent}22` }}>
                  <div style={{ fontSize:28 }}>🙏</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:theme.primary, marginBottom:2 }}>Your Faith Preference: {profile.religion}</div>
                    <div style={{ fontSize:13, color:"#666" }}>Your preferred-faith resources are highlighted below with a gold border.</div>
                  </div>
                </div>
              )}

              {/* Unit & Installation Chaplain Resources */}
              <div style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${theme.accent}40`, marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:20, fontWeight:900, color:theme.primary, marginBottom:16 }}>✦ Unit & Installation Chaplain Services</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {RELIGIOUS_RESOURCES.chaplain.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding:"14px 16px", background:theme.light, border:`1px solid ${theme.accent}40`, borderRadius:10, textDecoration:"none", display:"block" }}>
                      <div style={{ fontWeight:700, color:theme.primary, marginBottom:4 }}>{r.name}</div>
                      <div style={{ fontSize:12, color:"#666" }}>{r.desc}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Faith-specific resources grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                {[
                  { key:"protestant", label:"Protestant / Christian", icon:"✝️" },
                  { key:"catholic", label:"Catholic", icon:"⛪" },
                  { key:"jewish", label:"Jewish", icon:"✡️" },
                  { key:"muslim", label:"Muslim / Islam", icon:"☪️" },
                  { key:"buddhist", label:"Buddhist", icon:"☸️" },
                  { key:"general", label:"Multi-Faith & General", icon:"🕊️" },
                ].map(({ key, label, icon }) => {
                  const isPreferred = profile.religion && (
                    (key === "protestant" && profile.religion.includes("Protestant")) ||
                    (key === "catholic" && profile.religion.includes("Catholic")) ||
                    (key === "jewish" && profile.religion.includes("Jewish")) ||
                    (key === "muslim" && profile.religion.includes("Muslim")) ||
                    (key === "buddhist" && profile.religion.includes("Buddhist"))
                  );
                  return (
                    <div key={key} style={{ background:"#FFFFFF", padding:"24px", borderRadius:14, border:`2px solid ${isPreferred ? theme.accent : theme.accent+"40"}`, boxShadow: isPreferred ? `0 4px 14px ${theme.accent}28` : "0 2px 8px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:18, fontWeight:900, color:theme.primary, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:22 }}>{icon}</span>
                        <span style={{ flex:1 }}>{label}</span>
                        {isPreferred && <span style={{ fontSize:10, fontWeight:800, background:theme.accent, color:theme.secondary, borderRadius:6, padding:"3px 8px" }}>YOUR FAITH</span>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {RELIGIOUS_RESOURCES[key].map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ padding:"10px 12px", background:theme.light, border:`1px solid ${theme.accent}30`, borderRadius:8, textDecoration:"none", display:"block" }}>
                            <div style={{ fontWeight:700, color:theme.primary, fontSize:13, marginBottom:3 }}>{r.name}</div>
                            <div style={{ fontSize:11, color:"#666" }}>{r.desc}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Community accommodations */}
              <div style={{ background:theme.light, border:`1.5px solid ${theme.accent}40`, borderRadius:14, padding:"20px 24px" }}>
                <div style={{ fontSize:16, fontWeight:800, color:theme.primary, marginBottom:12 }}>🏛️ Community Religious Accommodations</div>
                <ul style={{ margin:0, paddingLeft:20, fontSize:14, color:"#444", lineHeight:1.9 }}>
                  <li>Request religious accommodation through your chain of command per <strong>DoD Instruction 1300.17</strong></li>
                  <li>Chaplains can assist with dietary requirements, designated worship space, and religious leave requests</li>
                  <li>Off-base religious communities can be located through your installation chaplain's community liaison</li>
                  <li>Contact your gaining installation's Chapel Office <em>before arrival</em> to arrange worship services and scheduling</li>
                  <li>TRICARE covers mental health referrals — ask your chaplain if you need additional support services</li>
                  <li>Language-specific services and translated materials may be available through your unit chaplain</li>
                </ul>
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

          {screen === "navigation" && (
            <NavigationMap profile={profile} theme={theme} />
          )}

          {screen === "basemap" && (
            <BaseMapView profile={profile} theme={theme} />
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
