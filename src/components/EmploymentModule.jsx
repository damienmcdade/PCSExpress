import { useState, useEffect } from 'react'
import { secureLocalStore, readLegacyJson } from '../security/SecurityExtensions'

const BASE_CITY = {
  'Fort Liberty': 'Fayetteville, NC', 'Fort Bragg': 'Fayetteville, NC',
  'Fort Campbell': 'Clarksville, TN', 'Fort Cavazos': 'Killeen, TX', 'Fort Hood': 'Killeen, TX',
  'Joint Base Lewis-McChord': 'Tacoma, WA', 'Fort Carson': 'Colorado Springs, CO',
  'Fort Bliss': 'El Paso, TX', 'Fort Stewart': 'Hinesville, GA', 'Fort Drum': 'Watertown, NY',
  'Fort Sill': 'Lawton, OK', 'Fort Jackson': 'Columbia, SC', 'Fort Meade': 'Odenton, MD',
  'Fort Knox': 'Radcliff, KY', 'Fort Leavenworth': 'Leavenworth, KS',
  'Fort Sam Houston': 'San Antonio, TX', 'Fort Wainwright': 'Fairbanks, AK',
  'Fort Eisenhower': 'Augusta, GA', 'Fort Gregg-Adams': 'Petersburg, VA',
  'Fort Leonard Wood': 'Waynesville, MO', 'Fort Novosel': 'Daleville, AL',
  'Fort Rucker': 'Daleville, AL', 'Schofield Barracks': 'Wahiawa, HI',
  'Fort Shafter': 'Honolulu, HI', 'West Point': 'West Point, NY',
  'Fort Hamilton': 'Brooklyn, NY', 'Fort Myer': 'Arlington, VA',
  'Naval Station Norfolk': 'Norfolk, VA', 'Naval Base San Diego': 'San Diego, CA',
  'NAS Jacksonville': 'Jacksonville, FL', 'NAS Pensacola': 'Pensacola, FL',
  'Naval Station Mayport': 'Jacksonville, FL', 'Naval Base Kitsap': 'Bremerton, WA',
  'Naval Station Everett': 'Everett, WA', 'NAS Oceana': 'Virginia Beach, VA',
  'NAS Whidbey Island': 'Oak Harbor, WA', 'NAS Corpus Christi': 'Corpus Christi, TX',
  'Marine Corps Base Camp Lejeune': 'Jacksonville, NC', 'Camp Pendleton': 'Oceanside, CA',
  'MCAS Cherry Point': 'Havelock, NC', 'MCAS Miramar': 'San Diego, CA',
  'MCB Quantico': 'Quantico, VA', 'MCAS New River': 'Jacksonville, NC',
  'MCB Hawaii Kaneohe Bay': 'Kailua, HI', 'MCAS Yuma': 'Yuma, AZ',
  'MCAS Beaufort': 'Beaufort, SC',
  'Joint Base Langley-Eustis': 'Hampton, VA', 'Eglin AFB': 'Valparaiso, FL',
  'MacDill AFB': 'Tampa, FL', 'Travis AFB': 'Fairfield, CA',
  'Wright-Patterson AFB': 'Dayton, OH', 'Joint Base Andrews': 'Clinton, MD',
  'Nellis AFB': 'Las Vegas, NV', 'Edwards AFB': 'Rosamond, CA',
  'Keesler AFB': 'Biloxi, MS', 'Little Rock AFB': 'Jacksonville, AR',
  'Dyess AFB': 'Abilene, TX', 'Luke AFB': 'Glendale, AZ',
  'Davis-Monthan AFB': 'Tucson, AZ', 'Fairchild AFB': 'Spokane, WA',
  'Hill AFB': 'Ogden, UT', 'Minot AFB': 'Minot, ND',
  'Malmstrom AFB': 'Great Falls, MT', 'Ellsworth AFB': 'Rapid City, SD',
  'Hurlburt Field': 'Fort Walton Beach, FL', 'Moody AFB': 'Valdosta, GA',
  'Shaw AFB': 'Sumter, SC', 'Seymour Johnson AFB': 'Goldsboro, NC',
  'Joint Base San Antonio': 'San Antonio, TX',
  'Buckley SFB': 'Aurora, CO', 'Schriever SFB': 'Colorado Springs, CO',
  'Peterson SFB': 'Colorado Springs, CO', 'Patrick SFB': 'Cocoa Beach, FL',
  'Vandenberg SFB': 'Lompoc, CA',
  'Camp Humphreys': 'Pyeongtaek, South Korea', 'Osan Air Base': 'Pyeongtaek, South Korea',
  'Kadena Air Base': 'Okinawa, Japan', 'Yokota Air Base': 'Fussa, Japan',
  'Ramstein Air Base': 'Kaiserslautern, Germany', 'USAG Stuttgart': 'Stuttgart, Germany',
  'USAG Wiesbaden': 'Wiesbaden, Germany',
}

const INDUSTRIES = [
  { id: 'tech',      label: 'Technology & IT',           keywords: 'information technology software cybersecurity network administrator', color: '#1565C0' },
  { id: 'health',    label: 'Healthcare & Medicine',      keywords: 'nurse medical healthcare physician health clinical EMT paramedic',   color: '#00695C' },
  { id: 'business',  label: 'Business & Finance',         keywords: 'finance accounting business management analyst operations',          color: '#E65100' },
  { id: 'govt',      label: 'Government & Defense',       keywords: 'government federal defense contractor intelligence analyst',         color: '#283593' },
  { id: 'eng',       label: 'Engineering & Science',      keywords: 'engineer engineering science research mechanical electrical',        color: '#4A148C' },
  { id: 'edu',       label: 'Education & Training',       keywords: 'teacher education training instructor curriculum developer',         color: '#1B5E20' },
  { id: 'security',  label: 'Law Enforcement & Security', keywords: 'security law enforcement police investigator federal agent',        color: '#B71C1C' },
  { id: 'logistics', label: 'Logistics & Supply Chain',   keywords: 'logistics supply chain warehouse operations distribution planning',  color: '#F57F17' },
  { id: 'trades',    label: 'Skilled Trades',             keywords: 'mechanic electrician plumber technician maintenance HVAC',          color: '#37474F' },
  { id: 'hr',        label: 'Human Resources',            keywords: 'human resources HR recruiter talent management people operations',   color: '#006064' },
]

const SKILL_CATS = [
  { id: 'technical',    label: 'Technical',     color: '#1565C0' },
  { id: 'soft',         label: 'Soft Skill',    color: '#2E7D32' },
  { id: 'cert',         label: 'Certification', color: '#6A1B9A' },
  { id: 'language',     label: 'Language',      color: '#E65100' },
]

const JOB_BOARDS = [
  { name: 'USAJOBS', desc: 'Official federal civilian jobs portal with military spouse and veteran hiring paths.', url: 'https://www.usajobs.gov', badge: 'Federal', color: '#1565C0' },
  { name: 'Department of Labor VETS', desc: 'Official employment support for veterans, transitioning service members, and military spouses.', url: 'https://www.dol.gov/agencies/vets', badge: 'DOL', color: '#37474F' },
  { name: 'DoD Transition Assistance Program', desc: 'Official transition workshops and career preparation resources for separating service members.', url: 'https://www.dodtap.mil', badge: 'DoD TAP', color: '#283593' },
]

const SPOUSE_BOARDS = [
  { name: 'MySECO / MSEP Portal', desc: 'Official DoD spouse education and career portal with MSEP employment resources.', url: 'https://myseco.militaryonesource.mil/portal/', badge: 'Spouse', color: '#880E4F' },
  { name: 'Military OneSource SECO', desc: 'Official spouse education and career guidance from Military OneSource.', url: 'https://www.militaryonesource.mil/education-employment/seco/', badge: 'Spouse', color: '#1565C0' },
  { name: 'DOL Military Spouse Employment', desc: 'Official Department of Labor employment information for military spouses.', url: 'https://www.dol.gov/agencies/vets/veterans/military-spouses/employment', badge: 'DOL', color: '#37474F' },
  { name: 'MyCAA Scholarship Program', desc: 'Official MyCAA portal for eligible spouse education and career credentials.', url: 'https://aiportal.acc.af.mil/mycaa', badge: 'Education', color: '#1B5E20' },
]

const LOCAL_JOBS = {
  'Fort Liberty': [
    { title: 'Cybersecurity Analyst', employer: 'Leidos', type: 'Full-time', pay: '$75k–$95k/yr', industry: 'tech', miles: 8 },
    { title: 'Software Developer', employer: 'CACI International', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'tech', miles: 10 },
    { title: 'Registered Nurse (ICU)', employer: 'Cape Fear Valley Medical', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'health', miles: 6 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 12 },
    { title: 'Logistics Manager', employer: 'DRS Technologies', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'logistics', miles: 15 },
    { title: 'Network Administrator', employer: 'Engility', type: 'Full-time', pay: '$68k–$88k/yr', industry: 'tech', miles: 20 },
    { title: 'Physical Therapist', employer: 'Womack Army Medical Center', type: 'Full-time', pay: '$70k–$90k/yr', industry: 'health', miles: 2 },
    { title: 'HR Specialist', employer: 'Army Civilian Corps', type: 'Full-time', pay: '$55k–$72k/yr', industry: 'hr', miles: 3 },
  ],
  'Fort Bragg': [
    { title: 'Cybersecurity Analyst', employer: 'Leidos', type: 'Full-time', pay: '$75k–$95k/yr', industry: 'tech', miles: 8 },
    { title: 'Software Developer', employer: 'CACI International', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'tech', miles: 10 },
    { title: 'Registered Nurse (ICU)', employer: 'Cape Fear Valley Medical', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'health', miles: 6 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 12 },
    { title: 'Logistics Manager', employer: 'DRS Technologies', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'logistics', miles: 15 },
    { title: 'HR Specialist', employer: 'Army Civilian Corps', type: 'Full-time', pay: '$55k–$72k/yr', industry: 'hr', miles: 3 },
  ],
  'Fort Campbell': [
    { title: 'Registered Nurse', employer: 'Tennova Healthcare', type: 'Full-time', pay: '$60k–$78k/yr', industry: 'health', miles: 8 },
    { title: 'IT Systems Specialist', employer: 'DLT Solutions', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'tech', miles: 12 },
    { title: 'Financial Advisor', employer: 'USAA', type: 'Full-time', pay: '$60k–$90k/yr', industry: 'business', miles: 7 },
    { title: 'Intelligence Analyst', employer: 'Chenega Corporation', type: 'Full-time', pay: '$72k–$95k/yr', industry: 'govt', miles: 5 },
    { title: 'Supply Chain Analyst', employer: 'ARAMARK', type: 'Full-time', pay: '$55k–$72k/yr', industry: 'logistics', miles: 14 },
    { title: 'HVAC Technician', employer: 'Johnson Controls', type: 'Full-time', pay: '$48k–$65k/yr', industry: 'trades', miles: 10 },
    { title: 'Physical Therapist', employer: 'Blanchfield Army Community Hospital', type: 'Full-time', pay: '$70k–$88k/yr', industry: 'health', miles: 3 },
  ],
  'Fort Cavazos': [
    { title: 'RN Trauma Nurse', employer: 'Advent Health Central Texas', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'health', miles: 12 },
    { title: 'Systems Administrator', employer: 'SAIC', type: 'Full-time', pay: '$70k–$90k/yr', industry: 'tech', miles: 8 },
    { title: 'Defense Contractor', employer: 'General Dynamics', type: 'Full-time', pay: '$80k–$110k/yr', industry: 'govt', miles: 10 },
    { title: 'Security Officer', employer: 'Allied Universal', type: 'Full-time', pay: '$38k–$50k/yr', industry: 'security', miles: 5 },
    { title: 'Logistics Coordinator', employer: 'DHL Supply Chain', type: 'Full-time', pay: '$45k–$60k/yr', industry: 'logistics', miles: 18 },
    { title: 'Electrician', employer: 'Kforce Government Solutions', type: 'Full-time', pay: '$52k–$68k/yr', industry: 'trades', miles: 7 },
  ],
  'Fort Hood': [
    { title: 'RN Trauma Nurse', employer: 'Advent Health Central Texas', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'health', miles: 12 },
    { title: 'Systems Administrator', employer: 'SAIC', type: 'Full-time', pay: '$70k–$90k/yr', industry: 'tech', miles: 8 },
    { title: 'Defense Contractor', employer: 'General Dynamics', type: 'Full-time', pay: '$80k–$110k/yr', industry: 'govt', miles: 10 },
    { title: 'Security Officer', employer: 'Allied Universal', type: 'Full-time', pay: '$38k–$50k/yr', industry: 'security', miles: 5 },
    { title: 'Logistics Coordinator', employer: 'DHL Supply Chain', type: 'Full-time', pay: '$45k–$60k/yr', industry: 'logistics', miles: 18 },
  ],
  'Joint Base Lewis-McChord': [
    { title: 'Software Engineer', employer: 'Boeing Defense', type: 'Full-time', pay: '$95k–$130k/yr', industry: 'tech', miles: 15 },
    { title: 'Registered Nurse', employer: 'MultiCare Health System', type: 'Full-time', pay: '$68k–$90k/yr', industry: 'health', miles: 12 },
    { title: 'Cybersecurity Engineer', employer: 'Raytheon', type: 'Full-time', pay: '$90k–$120k/yr', industry: 'tech', miles: 20 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 18 },
    { title: 'Logistics Analyst', employer: 'Amazon', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'logistics', miles: 25 },
    { title: 'Law Enforcement Officer', employer: 'Pierce County Sheriff', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'security', miles: 14 },
    { title: 'Mechanical Engineer', employer: 'PACCAR', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'eng', miles: 22 },
  ],
  'Fort Carson': [
    { title: 'Software Engineer', employer: 'L3Harris Technologies', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 12 },
    { title: 'Registered Nurse', employer: 'UCHealth', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'health', miles: 8 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$82k–$108k/yr', industry: 'govt', miles: 10 },
    { title: 'Cybersecurity Analyst', employer: 'Perspecta', type: 'Full-time', pay: '$75k–$98k/yr', industry: 'tech', miles: 15 },
    { title: 'Financial Analyst', employer: 'USAA', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'business', miles: 10 },
    { title: 'Electrician', employer: 'Hensel Phelps', type: 'Full-time', pay: '$55k–$72k/yr', industry: 'trades', miles: 7 },
  ],
  'Fort Bliss': [
    { title: 'Systems Engineer', employer: 'DRS Defense Solutions', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'eng', miles: 10 },
    { title: 'Registered Nurse', employer: 'Del Sol Medical Center', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'health', miles: 8 },
    { title: 'Network Engineer', employer: 'Northrop Grumman', type: 'Full-time', pay: '$82k–$108k/yr', industry: 'tech', miles: 14 },
    { title: 'Intelligence Analyst', employer: 'CACI International', type: 'Full-time', pay: '$78k–$102k/yr', industry: 'govt', miles: 12 },
    { title: 'Logistics Specialist', employer: 'DHL', type: 'Full-time', pay: '$42k–$58k/yr', industry: 'logistics', miles: 20 },
    { title: 'CBP Officer', employer: 'CBP / DHS', type: 'Full-time', pay: '$55k–$78k/yr', industry: 'security', miles: 5 },
  ],
  'Fort Stewart': [
    { title: 'RN Emergency Nurse', employer: 'Memorial Health Savannah', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'health', miles: 40 },
    { title: 'Network Administrator', employer: 'SAIC', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'tech', miles: 8 },
    { title: 'Army Civilian Analyst', employer: 'Department of the Army', type: 'Full-time', pay: '$55k–$75k/yr', industry: 'govt', miles: 3 },
    { title: 'Supply Chain Manager', employer: 'GTCC / DoD', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'logistics', miles: 5 },
    { title: 'Police Officer', employer: 'Liberty County Sheriff', type: 'Full-time', pay: '$38k–$52k/yr', industry: 'security', miles: 12 },
  ],
  'Fort Drum': [
    { title: 'RN Medical Surgical', employer: 'Samaritan Medical Center', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'health', miles: 8 },
    { title: 'IT Specialist', employer: 'DXC Technology', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'tech', miles: 10 },
    { title: 'Government Analyst', employer: 'Department of the Army', type: 'Full-time', pay: '$50k–$70k/yr', industry: 'govt', miles: 3 },
    { title: 'Logistics Coordinator', employer: 'ARAMARK', type: 'Full-time', pay: '$42k–$58k/yr', industry: 'logistics', miles: 6 },
    { title: 'Correctional Officer', employer: 'NYS DOCCS', type: 'Full-time', pay: '$45k–$65k/yr', industry: 'security', miles: 30 },
  ],
  'Fort Sill': [
    { title: 'Registered Nurse', employer: 'Reynolds Army Health Clinic', type: 'Full-time', pay: '$55k–$75k/yr', industry: 'health', miles: 5 },
    { title: 'IT Support Specialist', employer: 'Engility', type: 'Full-time', pay: '$55k–$72k/yr', industry: 'tech', miles: 8 },
    { title: 'Defense Systems Engineer', employer: 'Lockheed Martin', type: 'Full-time', pay: '$75k–$100k/yr', industry: 'eng', miles: 10 },
    { title: 'Automotive Technician', employer: 'David Stanley Chevrolet', type: 'Full-time', pay: '$45k–$62k/yr', industry: 'trades', miles: 12 },
    { title: 'Teacher / Instructor', employer: 'Lawton Public Schools', type: 'Full-time', pay: '$38k–$55k/yr', industry: 'edu', miles: 8 },
  ],
  'Fort Jackson': [
    { title: 'RN / Travel Nurse', employer: 'Prisma Health', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 15 },
    { title: 'Cybersecurity Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$75k–$98k/yr', industry: 'tech', miles: 18 },
    { title: 'HR Specialist', employer: 'Army Civilian Corps', type: 'Full-time', pay: '$52k–$70k/yr', industry: 'hr', miles: 5 },
    { title: 'Financial Advisor', employer: 'USAA', type: 'Full-time', pay: '$62k–$90k/yr', industry: 'business', miles: 12 },
    { title: 'Logistics Analyst', employer: 'Michelin North America', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'logistics', miles: 30 },
    { title: 'Teacher', employer: 'Richland School District', type: 'Full-time', pay: '$38k–$55k/yr', industry: 'edu', miles: 20 },
  ],
  'Fort Meade': [
    { title: 'Cybersecurity Engineer', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$95k–$130k/yr', industry: 'tech', miles: 5 },
    { title: 'Intelligence Analyst', employer: 'NSA / DoD', type: 'Full-time', pay: '$90k–$125k/yr', industry: 'govt', miles: 2 },
    { title: 'Software Developer', employer: 'CACI International', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 8 },
    { title: 'Data Scientist', employer: 'Leidos', type: 'Full-time', pay: '$95k–$128k/yr', industry: 'tech', miles: 10 },
    { title: 'Registered Nurse', employer: 'Johns Hopkins Howard County', type: 'Full-time', pay: '$70k–$92k/yr', industry: 'health', miles: 12 },
    { title: 'Security Specialist', employer: 'Peraton', type: 'Full-time', pay: '$88k–$115k/yr', industry: 'security', miles: 6 },
    { title: 'Program Manager', employer: 'Northrop Grumman', type: 'Full-time', pay: '$100k–$140k/yr', industry: 'business', miles: 15 },
  ],
  'Fort Knox': [
    { title: 'Registered Nurse', employer: 'Ireland Army Health Clinic', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'health', miles: 5 },
    { title: 'IT Specialist', employer: 'Engility', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'tech', miles: 8 },
    { title: 'Financial Analyst', employer: 'Fort Knox Federal Credit Union', type: 'Full-time', pay: '$50k–$68k/yr', industry: 'business', miles: 3 },
    { title: 'Logistics Analyst', employer: 'DLA', type: 'Full-time', pay: '$55k–$75k/yr', industry: 'logistics', miles: 10 },
    { title: 'Teacher', employer: 'Hardin County Schools', type: 'Full-time', pay: '$36k–$52k/yr', industry: 'edu', miles: 8 },
  ],
  'Fort Sam Houston': [
    { title: 'Registered Nurse', employer: 'Brooke Army Medical Center', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 3 },
    { title: 'Physician Assistant', employer: 'UT Health San Antonio', type: 'Full-time', pay: '$90k–$120k/yr', industry: 'health', miles: 10 },
    { title: 'Cybersecurity Analyst', employer: 'USAA', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'tech', miles: 8 },
    { title: 'Financial Advisor', employer: 'USAA', type: 'Full-time', pay: '$65k–$95k/yr', industry: 'business', miles: 8 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$82k–$108k/yr', industry: 'govt', miles: 12 },
    { title: 'Software Developer', employer: 'SAIC', type: 'Full-time', pay: '$88k–$115k/yr', industry: 'tech', miles: 14 },
    { title: 'Logistics Manager', employer: 'H-E-B', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'logistics', miles: 15 },
  ],
  'Joint Base San Antonio': [
    { title: 'Registered Nurse', employer: 'University Health System', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'health', miles: 8 },
    { title: 'Cybersecurity Analyst', employer: 'USAA', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'tech', miles: 5 },
    { title: 'Financial Advisor', employer: 'USAA', type: 'Full-time', pay: '$65k–$95k/yr', industry: 'business', miles: 5 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$82k–$108k/yr', industry: 'govt', miles: 10 },
    { title: 'Software Developer', employer: 'SAIC', type: 'Full-time', pay: '$88k–$115k/yr', industry: 'tech', miles: 12 },
    { title: 'Logistics Manager', employer: 'H-E-B', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'logistics', miles: 15 },
  ],
  'Schofield Barracks': [
    { title: 'RN Emergency Nurse', employer: 'Tripler Army Medical Center', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'health', miles: 20 },
    { title: 'Software Engineer', employer: 'Oceanit Labs', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 20 },
    { title: 'IT Specialist', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'tech', miles: 22 },
    { title: 'Intelligence Analyst', employer: 'DIA', type: 'Full-time', pay: '$82k–$112k/yr', industry: 'govt', miles: 22 },
    { title: 'Teacher', employer: 'Hawaii DOE', type: 'Full-time', pay: '$48k–$75k/yr', industry: 'edu', miles: 15 },
    { title: 'Construction Manager', employer: 'Hawaiian Dredging Construction', type: 'Full-time', pay: '$75k–$100k/yr', industry: 'eng', miles: 22 },
  ],
  'Naval Station Norfolk': [
    { title: 'Cybersecurity Analyst', employer: 'CACI International', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'tech', miles: 10 },
    { title: 'Registered Nurse', employer: 'Sentara Healthcare', type: 'Full-time', pay: '$65k–$88k/yr', industry: 'health', miles: 12 },
    { title: 'Naval Architect', employer: 'General Dynamics NASSCO', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'eng', miles: 8 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$82k–$110k/yr', industry: 'govt', miles: 10 },
    { title: 'Program Manager', employer: 'Lockheed Martin', type: 'Full-time', pay: '$95k–$130k/yr', industry: 'business', miles: 15 },
    { title: 'Logistics Analyst', employer: 'DLA', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'logistics', miles: 6 },
    { title: 'Network Engineer', employer: 'SAIC', type: 'Full-time', pay: '$78k–$102k/yr', industry: 'tech', miles: 12 },
  ],
  'Naval Base San Diego': [
    { title: 'Systems Engineer', employer: 'General Dynamics Mission Systems', type: 'Full-time', pay: '$95k–$130k/yr', industry: 'eng', miles: 10 },
    { title: 'Registered Nurse', employer: 'Scripps Health', type: 'Full-time', pay: '$72k–$98k/yr', industry: 'health', miles: 15 },
    { title: 'Cybersecurity Analyst', employer: 'Leidos', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 8 },
    { title: 'Software Developer', employer: 'Qualcomm', type: 'Full-time', pay: '$110k–$145k/yr', industry: 'tech', miles: 18 },
    { title: 'Program Manager', employer: 'Northrop Grumman', type: 'Full-time', pay: '$100k–$135k/yr', industry: 'business', miles: 15 },
    { title: 'Security Specialist', employer: 'CBP / DHS', type: 'Full-time', pay: '$60k–$85k/yr', industry: 'security', miles: 5 },
  ],
  'NAS Jacksonville': [
    { title: 'RN / Travel Nurse', employer: 'Baptist Medical Center', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 15 },
    { title: 'Software Developer', employer: 'CSX Technology', type: 'Full-time', pay: '$82k–$108k/yr', industry: 'tech', miles: 18 },
    { title: 'Cybersecurity Analyst', employer: 'EverBank', type: 'Full-time', pay: '$75k–$100k/yr', industry: 'tech', miles: 20 },
    { title: 'Logistics Analyst', employer: 'Amazon', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'logistics', miles: 22 },
    { title: 'Financial Analyst', employer: 'Fidelity National Information Services', type: 'Full-time', pay: '$68k–$90k/yr', industry: 'business', miles: 20 },
  ],
  'Naval Station Mayport': [
    { title: 'RN / Travel Nurse', employer: 'Mayo Clinic Florida', type: 'Full-time', pay: '$70k–$95k/yr', industry: 'health', miles: 20 },
    { title: 'Software Developer', employer: 'CSX Technology', type: 'Full-time', pay: '$82k–$108k/yr', industry: 'tech', miles: 18 },
    { title: 'Logistics Analyst', employer: 'Amazon', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'logistics', miles: 22 },
    { title: 'Financial Analyst', employer: 'Fidelity National Information Services', type: 'Full-time', pay: '$68k–$90k/yr', industry: 'business', miles: 20 },
    { title: 'Intelligence Analyst', employer: 'Leidos', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'govt', miles: 18 },
  ],
  'NAS Pensacola': [
    { title: 'RN / Navy Nurse', employer: 'Naval Hospital Pensacola', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 5 },
    { title: 'Cybersecurity Analyst', employer: 'SAIC', type: 'Full-time', pay: '$72k–$95k/yr', industry: 'tech', miles: 10 },
    { title: 'Aviation Systems Engineer', employer: 'L3Harris', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'eng', miles: 8 },
    { title: 'Intelligence Analyst', employer: 'Leidos', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'govt', miles: 10 },
    { title: 'Maintenance Technician', employer: 'Naval Air Station Pensacola', type: 'Full-time', pay: '$45k–$65k/yr', industry: 'trades', miles: 3 },
  ],
  'Marine Corps Base Camp Lejeune': [
    { title: 'RN Trauma Nurse', employer: 'Onslow Memorial Hospital', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'health', miles: 8 },
    { title: 'IT Systems Administrator', employer: 'SAIC', type: 'Full-time', pay: '$68k–$90k/yr', industry: 'tech', miles: 5 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'govt', miles: 10 },
    { title: 'Logistics Coordinator', employer: 'ARAMARK', type: 'Full-time', pay: '$42k–$58k/yr', industry: 'logistics', miles: 6 },
    { title: 'Police Officer', employer: 'Jacksonville PD', type: 'Full-time', pay: '$40k–$58k/yr', industry: 'security', miles: 8 },
    { title: 'Teacher', employer: 'Onslow County Schools', type: 'Full-time', pay: '$38k–$55k/yr', industry: 'edu', miles: 10 },
  ],
  'Camp Pendleton': [
    { title: 'Software Engineer', employer: 'SAIC', type: 'Full-time', pay: '$95k–$125k/yr', industry: 'tech', miles: 18 },
    { title: 'Registered Nurse', employer: 'Tri-City Medical Center', type: 'Full-time', pay: '$72k–$95k/yr', industry: 'health', miles: 15 },
    { title: 'Cybersecurity Analyst', employer: 'Raytheon', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 20 },
    { title: 'Intelligence Analyst', employer: 'Leidos', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 20 },
    { title: 'Program Manager', employer: 'Northrop Grumman', type: 'Full-time', pay: '$100k–$135k/yr', industry: 'business', miles: 25 },
    { title: 'Police Officer', employer: 'Oceanside Police Department', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'security', miles: 12 },
  ],
  'MCAS Miramar': [
    { title: 'Software Engineer', employer: 'Qualcomm', type: 'Full-time', pay: '$110k–$145k/yr', industry: 'tech', miles: 15 },
    { title: 'Cybersecurity Analyst', employer: 'Leidos', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 12 },
    { title: 'RN / Nurse Practitioner', employer: 'Sharp Healthcare', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'health', miles: 10 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 8 },
    { title: 'Logistics Manager', employer: 'Amazon', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'logistics', miles: 18 },
  ],
  'MCB Quantico': [
    { title: 'Cybersecurity Engineer', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$95k–$130k/yr', industry: 'tech', miles: 10 },
    { title: 'Intelligence Analyst (FBI)', employer: 'FBI / DOJ', type: 'Full-time', pay: '$90k–$120k/yr', industry: 'govt', miles: 5 },
    { title: 'Data Scientist', employer: 'Leidos', type: 'Full-time', pay: '$95k–$128k/yr', industry: 'tech', miles: 12 },
    { title: 'Security Specialist', employer: 'Peraton', type: 'Full-time', pay: '$88k–$115k/yr', industry: 'security', miles: 8 },
    { title: 'Registered Nurse', employer: 'Inova Health System', type: 'Full-time', pay: '$72k–$98k/yr', industry: 'health', miles: 20 },
    { title: 'Program Manager', employer: 'SAIC', type: 'Full-time', pay: '$100k–$135k/yr', industry: 'business', miles: 15 },
  ],
  'Joint Base Langley-Eustis': [
    { title: 'Cybersecurity Analyst', employer: 'CACI International', type: 'Full-time', pay: '$80k–$105k/yr', industry: 'tech', miles: 10 },
    { title: 'Registered Nurse', employer: 'Sentara CarePlex Hospital', type: 'Full-time', pay: '$65k–$88k/yr', industry: 'health', miles: 8 },
    { title: 'Systems Engineer', employer: 'Northrop Grumman', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'eng', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'Leidos', type: 'Full-time', pay: '$82k–$110k/yr', industry: 'govt', miles: 8 },
    { title: 'Financial Analyst', employer: 'Canon Solutions America', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'business', miles: 15 },
    { title: 'Logistics Analyst', employer: 'DLA', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'logistics', miles: 6 },
  ],
  'Eglin AFB': [
    { title: 'Aerospace Engineer', employer: 'L3Harris Technologies', type: 'Full-time', pay: '$90k–$125k/yr', industry: 'eng', miles: 10 },
    { title: 'Software Developer', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 12 },
    { title: 'RN Emergency Nurse', employer: 'HCA Florida Fort Walton-Destin', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 10 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'govt', miles: 12 },
    { title: 'Logistics Analyst', employer: 'Elbit Systems of America', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'logistics', miles: 8 },
  ],
  'Hurlburt Field': [
    { title: 'Special Operations Analyst', employer: 'Leidos', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 5 },
    { title: 'Software Developer', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 8 },
    { title: 'Registered Nurse', employer: 'HCA Florida Fort Walton-Destin', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 8 },
    { title: 'Aerospace Engineer', employer: 'L3Harris Technologies', type: 'Full-time', pay: '$90k–$125k/yr', industry: 'eng', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'govt', miles: 12 },
  ],
  'MacDill AFB': [
    { title: 'Cybersecurity Analyst', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 10 },
    { title: 'Registered Nurse', employer: 'Tampa General Hospital', type: 'Full-time', pay: '$68k–$90k/yr', industry: 'health', miles: 10 },
    { title: 'Intelligence Analyst (CENTCOM)', employer: 'CACI International', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'govt', miles: 5 },
    { title: 'Financial Advisor', employer: 'Raymond James', type: 'Full-time', pay: '$70k–$120k/yr', industry: 'business', miles: 12 },
    { title: 'Software Engineer', employer: 'Leidos', type: 'Full-time', pay: '$90k–$120k/yr', industry: 'tech', miles: 12 },
    { title: 'Logistics Analyst', employer: 'Amazon', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'logistics', miles: 20 },
  ],
  'Travis AFB': [
    { title: 'Software Engineer', employer: 'Intel Corporation', type: 'Full-time', pay: '$105k–$145k/yr', industry: 'tech', miles: 25 },
    { title: 'Registered Nurse', employer: 'Kaiser Permanente', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'health', miles: 20 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 12 },
    { title: 'Logistics Analyst', employer: 'Amazon', type: 'Full-time', pay: '$65k–$85k/yr', industry: 'logistics', miles: 22 },
    { title: 'Civil Engineer', employer: 'Sacramento Municipal Utility District', type: 'Full-time', pay: '$70k–$95k/yr', industry: 'eng', miles: 35 },
  ],
  'Wright-Patterson AFB': [
    { title: 'Aerospace Engineer', employer: 'Air Force Research Laboratory', type: 'Full-time', pay: '$82k–$115k/yr', industry: 'eng', miles: 5 },
    { title: 'Software Developer', employer: 'Leidos', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'tech', miles: 8 },
    { title: 'Registered Nurse', employer: 'Kettering Health Network', type: 'Full-time', pay: '$62k–$82k/yr', industry: 'health', miles: 15 },
    { title: 'Cybersecurity Engineer', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 10 },
    { title: 'Program Manager', employer: 'Northrop Grumman', type: 'Full-time', pay: '$100k–$135k/yr', industry: 'business', miles: 12 },
    { title: 'Data Scientist', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$90k–$120k/yr', industry: 'tech', miles: 8 },
  ],
  'Nellis AFB': [
    { title: 'Software Engineer', employer: 'Switch', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 18 },
    { title: 'Registered Nurse', employer: 'Valley Health System', type: 'Full-time', pay: '$68k–$92k/yr', industry: 'health', miles: 15 },
    { title: 'Cybersecurity Analyst', employer: 'Leidos', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'tech', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$82k–$110k/yr', industry: 'govt', miles: 10 },
    { title: 'Financial Advisor', employer: 'First Command Financial Services', type: 'Full-time', pay: '$60k–$95k/yr', industry: 'business', miles: 20 },
    { title: 'Hotel Operations Manager', employer: 'MGM Resorts International', type: 'Full-time', pay: '$65k–$90k/yr', industry: 'business', miles: 20 },
  ],
  'Joint Base Andrews': [
    { title: 'Cybersecurity Engineer', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$95k–$130k/yr', industry: 'tech', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'DIA', type: 'Full-time', pay: '$88k–$120k/yr', industry: 'govt', miles: 8 },
    { title: 'Registered Nurse', employer: 'Prince George\'s County Health Dept', type: 'Full-time', pay: '$72k–$98k/yr', industry: 'health', miles: 10 },
    { title: 'Software Developer', employer: 'CACI International', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 15 },
    { title: 'Program Manager', employer: 'Leidos', type: 'Full-time', pay: '$100k–$135k/yr', industry: 'business', miles: 12 },
    { title: 'Transportation Security Officer', employer: 'TSA / DHS', type: 'Full-time', pay: '$42k–$65k/yr', industry: 'security', miles: 20 },
  ],
  'Joint Base Charleston': [
    { title: 'Registered Nurse', employer: 'MUSC Health', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 12 },
    { title: 'Software Developer', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$82k–$110k/yr', industry: 'tech', miles: 15 },
    { title: 'Logistics Analyst', employer: 'DLA', type: 'Full-time', pay: '$55k–$75k/yr', industry: 'logistics', miles: 8 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'govt', miles: 10 },
    { title: 'Financial Analyst', employer: 'Truist Bank', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'business', miles: 15 },
  ],
  'Joint Base Elmendorf-Richardson': [
    { title: 'RN / Nurse Practitioner', employer: 'Providence Alaska Medical Center', type: 'Full-time', pay: '$75k–$100k/yr', industry: 'health', miles: 10 },
    { title: 'Software Engineer', employer: 'GCI / Alaska Communications', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'Leidos', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 8 },
    { title: 'Petroleum Engineer', employer: 'ConocoPhillips Alaska', type: 'Full-time', pay: '$100k–$140k/yr', industry: 'eng', miles: 50 },
    { title: 'Teacher', employer: 'Anchorage School District', type: 'Full-time', pay: '$50k–$75k/yr', industry: 'edu', miles: 10 },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { title: 'RN / Travel Nurse', employer: 'Tripler Army Medical Center', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'health', miles: 8 },
    { title: 'Software Engineer', employer: 'Oceanit Labs', type: 'Full-time', pay: '$88k–$118k/yr', industry: 'tech', miles: 12 },
    { title: 'Intelligence Analyst', employer: 'SAIC', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 10 },
    { title: 'Logistics Analyst', employer: 'DLA', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'logistics', miles: 8 },
    { title: 'Teacher', employer: 'Hawaii DOE', type: 'Full-time', pay: '$48k–$72k/yr', industry: 'edu', miles: 15 },
  ],
  'Camp Humphreys': [
    { title: 'IT Systems Specialist', employer: 'U.S. Forces Korea', type: 'Full-time', pay: '$65k–$88k/yr', industry: 'tech', miles: 5 },
    { title: 'RN / Medical Technologist', employer: 'Brian Allgood Army Community Hospital', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 3 },
    { title: 'Intelligence Analyst', employer: 'U.S. 8th Army', type: 'Full-time', pay: '$78k–$105k/yr', industry: 'govt', miles: 5 },
    { title: 'Logistics Coordinator', employer: 'DLA Korea', type: 'Full-time', pay: '$55k–$75k/yr', industry: 'logistics', miles: 5 },
    { title: 'Teacher', employer: 'DoDEA Korea', type: 'Full-time', pay: '$48k–$72k/yr', industry: 'edu', miles: 3 },
  ],
  'Fort Eisenhower': [
    { title: 'Cybersecurity Engineer', employer: 'Booz Allen Hamilton', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'tech', miles: 8 },
    { title: 'Registered Nurse', employer: 'Augusta University Health', type: 'Full-time', pay: '$62k–$85k/yr', industry: 'health', miles: 12 },
    { title: 'Software Developer', employer: 'SAIC', type: 'Full-time', pay: '$80k–$108k/yr', industry: 'tech', miles: 10 },
    { title: 'Intelligence Analyst', employer: 'NSA / DoD', type: 'Full-time', pay: '$85k–$115k/yr', industry: 'govt', miles: 5 },
    { title: 'Financial Analyst', employer: 'SRP Federal Credit Union', type: 'Full-time', pay: '$52k–$70k/yr', industry: 'business', miles: 10 },
  ],
  'Fort Wainwright': [
    { title: 'RN / ER Nurse', employer: 'Fairbanks Memorial Hospital', type: 'Full-time', pay: '$70k–$95k/yr', industry: 'health', miles: 8 },
    { title: 'IT Systems Analyst', employer: 'Denali Federal Credit Union', type: 'Full-time', pay: '$60k–$80k/yr', industry: 'tech', miles: 10 },
    { title: 'Government Analyst', employer: 'Department of the Army', type: 'Full-time', pay: '$55k–$75k/yr', industry: 'govt', miles: 5 },
    { title: 'Petroleum Technician', employer: 'Doyon Utilities', type: 'Full-time', pay: '$60k–$85k/yr', industry: 'trades', miles: 8 },
    { title: 'Teacher', employer: 'Fairbanks North Star Borough Schools', type: 'Full-time', pay: '$48k–$72k/yr', industry: 'edu', miles: 8 },
  ],
  'Fort Leonard Wood': [
    { title: 'Registered Nurse', employer: 'General Leonard Wood Army Community Hospital', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'health', miles: 5 },
    { title: 'IT Specialist', employer: 'Engility', type: 'Full-time', pay: '$58k–$78k/yr', industry: 'tech', miles: 8 },
    { title: 'Government Analyst', employer: 'Department of the Army', type: 'Full-time', pay: '$50k–$68k/yr', industry: 'govt', miles: 3 },
    { title: 'HVAC Technician', employer: 'Johnson Controls', type: 'Full-time', pay: '$48k–$65k/yr', industry: 'trades', miles: 10 },
    { title: 'Teacher', employer: 'Waynesville School District', type: 'Full-time', pay: '$36k–$52k/yr', industry: 'edu', miles: 12 },
  ],
}

function EmploymentModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('search')

  const [skills, setSkills] = useState(() => {
    return readLegacyJson('pcs_employment_skills', [])
  })
  const [newSkill, setNewSkill] = useState('')
  const [newSkillCat, setNewSkillCat] = useState('technical')

  const [radius, setRadius] = useState(25)
  const [selectedIndustries, setSelectedIndustries] = useState(new Set())
  const [showResults, setShowResults] = useState(false)


  useEffect(() => {
    secureLocalStore.set('pcs_employment_skills', skills)
  }, [skills])

  useEffect(() => {
    secureLocalStore.get('pcs_employment_skills', null).then(saved => {
      if (Array.isArray(saved)) setSkills(saved)
    })
  }, [])

  const installName = (profile?.gainingInstallation || '').split(',')[0].trim()
  const searchCity = BASE_CITY[installName] || (installName ? `${installName} area` : 'your area')

  const addSkill = () => {
    const name = newSkill.trim()
    if (!name || skills.some(s => s.name.toLowerCase() === name.toLowerCase())) return
    setSkills(prev => [...prev, { name, cat: newSkillCat }])
    setNewSkill('')
  }

  const removeSkill = idx => setSkills(prev => prev.filter((_, i) => i !== idx))

  const toggleIndustry = id => {
    setSelectedIndustries(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setShowResults(false)
  }

  const buildSearchUrl = (board) => {
    const industryKw = [...selectedIndustries].map(id => INDUSTRIES.find(i => i.id === id)?.keywords || '').join(' ')
    const skillKw = skills.map(s => s.name).join(' ')
    const kw = encodeURIComponent([industryKw, skillKw].filter(Boolean).join(' ').trim() || 'jobs')
    const loc = encodeURIComponent(searchCity)
    switch (board) {
      case 'myseco': return 'https://myseco.militaryonesource.mil/portal/'
      case 'dol': return 'https://www.dol.gov/agencies/vets/veterans/military-spouses/employment'
      case 'usajobs':
      default: return `https://www.usajobs.gov/Search/Results?keyword=${kw}&LocationName=${loc}&Radius=${radius}`
    }
  }

  const TABS = [
    { id: 'search',          label: 'Job Search'      },
    { id: 'jobboards',       label: 'Job Resources'   },
  ]

  const tb = (t) => ({
    padding: '7px 11px', borderRadius: 8,
    border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
    background: activeTab === t.id ? theme.primary : '#FFF',
    color: activeTab === t.id ? '#FFF' : '#56697C',
    fontSize: 10, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '.04em', textTransform: 'uppercase',
  })

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 2 }}>Employment & Career Center</div>
      <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16 }}>Service members & military spouses · {searchCity}</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={tb(t)}>{t.label}</button>)}
      </div>

      {/* ── SKILLS PROFILE ── */}
      {activeTab === 'skills' && (
        <div>
          <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>YOUR SKILLS PROFILE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>Skills drive your Recommendations and Job Search results. Add technical skills, soft skills, certifications, and languages.</div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821', marginBottom: 10 }}>Add a Skill</div>
            <input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              placeholder="e.g. Project Management, Python, EMT-B, Spanish, PMP..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E0E6EE', fontSize: 13, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {SKILL_CATS.map(cat => (
                <button key={cat.id} onClick={() => setNewSkillCat(cat.id)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${newSkillCat === cat.id ? cat.color : '#E0E6EE'}`, background: newSkillCat === cat.id ? cat.color : '#FFF', color: newSkillCat === cat.id ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <button onClick={addSkill} style={{ width: '100%', padding: '10px', borderRadius: 10, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              Add Skill
            </button>
          </div>

          {skills.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 10 }}>YOUR SKILLS ({skills.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {skills.map((skill, i) => {
                  const cat = SKILL_CATS.find(c => c.id === skill.cat) || SKILL_CATS[0]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${cat.color}12`, border: `1px solid ${cat.color}35`, borderRadius: 20, padding: '5px 10px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{skill.name}</span>
                      <span style={{ fontSize: 9, color: `${cat.color}AA`, fontWeight: 600 }}>{cat.label}</span>
                      <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: cat.color, fontSize: 15, cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.65 }}>×</button>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setActiveTab('recommendations')} style={{ width: '100%', padding: '12px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                View Matched Jobs →
              </button>
            </div>
          ) : (
            <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 20, textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No skills added yet</div>
              <div style={{ fontSize: 11 }}>Add skills above to unlock personalized job recommendations.</div>
            </div>
          )}
        </div>
      )}

      {/* ── JOB SEARCH ── */}
      {activeTab === 'search' && (
        <div>
          <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 2 }}>SEARCH AREA</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{searchCity}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Near {installName || 'your gaining installation'}</div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 10 }}>SEARCH RADIUS</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[10, 25, 50, 75, 100].map(r => (
                <button key={r} onClick={() => { setRadius(r); setShowResults(false) }} style={{ flex: 1, padding: '9px 4px', borderRadius: 8, border: `1.5px solid ${radius === r ? theme.primary : '#E0E6EE'}`, background: radius === r ? theme.primary : '#FFF', color: radius === r ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  {r}mi
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 10 }}>
              INDUSTRY FILTER <span style={{ fontWeight: 500, fontSize: 10, letterSpacing: 0 }}>— select one or more</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INDUSTRIES.map(ind => {
                const sel = selectedIndustries.has(ind.id)
                return (
                  <button key={ind.id} onClick={() => toggleIndustry(ind.id)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${sel ? ind.color : '#E0E6EE'}`, background: sel ? ind.color : '#FFF', color: sel ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                    {ind.label}
                  </button>
                )
              })}
            </div>
            {selectedIndustries.size > 0 && (
              <button onClick={() => { setSelectedIndustries(new Set()); setShowResults(false) }} style={{ marginTop: 10, padding: '5px 14px', borderRadius: 20, border: '1px solid #E0E6EE', background: '#F0F4F8', color: '#888', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                Clear Filters
              </button>
            )}
          </div>

          <button
            onClick={() => setShowResults(true)}
            style={{ width: '100%', padding: '13px', borderRadius: 12, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}
          >
            Search Jobs Within {radius} Miles
          </button>

          {showResults && (() => {
            const selectedLabels = selectedIndustries.size > 0
              ? [...selectedIndustries].map(id => INDUSTRIES.find(i => i.id === id)?.label).filter(Boolean).join(', ')
              : 'All Industries';
            const kw = encodeURIComponent([...selectedIndustries].map(id => INDUSTRIES.find(i => i.id === id)?.keywords || '').join(' ') || 'military spouse');
            const loc = encodeURIComponent(searchCity);
            const makeUsaJobs = (name, keyword, badge, desc, color, remote = 'Use USAJOBS filters for telework, remote, full-time, part-time, and agency options.') => ({
              name,
              badge,
              desc,
              url: `https://www.usajobs.gov/Search/Results?keyword=${encodeURIComponent(keyword)}&LocationName=${loc}&Radius=${radius}`,
              color,
              remote,
            });
            const jobCards = [
              makeUsaJobs('Administrative Support Assistant', 'administrative support assistant military spouse', 'Admin', `Open current administrative support listings within ${radius} miles of ${searchCity}.`, '#1565C0'),
              makeUsaJobs('Human Resources Specialist', 'human resources specialist military spouse', 'HR', `Open current HR listings near ${searchCity}, including spouse-friendly federal hiring paths when available.`, '#6A1B9A'),
              makeUsaJobs('Information Technology Specialist', 'information technology specialist cybersecurity military spouse', 'IT', `Open current IT and cybersecurity listings within ${radius} miles of ${searchCity}.`, '#283593'),
              makeUsaJobs('Registered Nurse / Clinical Staff', 'registered nurse clinical medical military spouse', 'Health', `Open current medical and clinical support listings near ${searchCity}.`, '#00796B'),
              makeUsaJobs('Logistics Management Specialist', 'logistics management specialist supply military spouse', 'Logistics', `Open current logistics, supply, and operations listings near ${searchCity}.`, '#5D4037'),
              makeUsaJobs('Contract Specialist', 'contract specialist acquisition military spouse', 'Contracting', `Open current contracting and acquisition listings near ${searchCity}.`, '#AD1457'),
              makeUsaJobs('Security Specialist', 'security specialist clearance military spouse', 'Security', `Open current security and clearance-friendly federal listings near ${searchCity}.`, '#37474F'),
              makeUsaJobs('Child and Youth Program Assistant', 'child youth program assistant military spouse', 'Family', `Open current child and youth support listings near ${searchCity}.`, '#EF6C00'),
              { name: 'Remote federal opportunities', badge: 'Remote', desc: 'Open current federal jobs marked remote or virtual, useful during PCS transitions.', url: `https://www.usajobs.gov/Search/Results?RemoteIndicator=true&keyword=${kw}`, color: '#00838F', remote: 'Remote-only search path.' },
              { name: 'Military spouse hiring path', badge: 'Spouse', desc: 'Official USAJOBS military spouse hiring path entry point for eligible spouses.', url: 'https://milspouse.usajobs.gov/', color: '#4A148C', remote: 'Supports remote and local federal searches.' },
              { name: 'MySECO / MSEP spouse employment', badge: 'MSEP', desc: 'Official DoD spouse career portal and Military Spouse Employment Partnership entry point.', url: 'https://myseco.militaryonesource.mil/portal/', color: '#880E4F', remote: 'Employer listings may include remote-friendly roles.' },
            ];
            return (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 12 }}>
                  LIVE JOB SEARCHES - {selectedLabels} · {radius}mi of {searchCity}
                </div>
                <div style={{ background: '#F0F8FF', border: '1px solid #ADD8E6', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 11, color: '#0C5A7E', lineHeight: 1.5 }}>
                  PCS Express no longer stores static job cards because openings change quickly. These links open official government and military employment resources using the selected radius, installation area, and industry filters where supported.
                </div>
                {jobCards.map(job => (
                  <a key={job.name} href={job.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${job.color}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{job.name}</div>
                          <span style={{ fontSize: 9, fontWeight: 900, background: '#E8F5E9', color: '#2E7D32', borderRadius: 999, padding: '2px 7px' }}>{job.badge}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{job.desc}</div>
                        <div style={{ fontSize: 10, color: '#7A4A00', marginTop: 7 }}>{job.remote}</div>
                      </div>
                      <div style={{ alignSelf: 'center', padding: '8px 12px', borderRadius: 10, background: job.color, color: '#FFF', fontSize: 11, fontWeight: 900 }}>Open</div>
                    </div>
                  </a>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {activeTab === 'recommendations' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>Skill-Matched Opportunities</div>
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16, lineHeight: 1.5 }}>Active job listings matched to your skills near {searchCity}. Each card links directly to current openings.</div>

          {skills.length > 0 ? (
            <>
              {skills.map((skill, i) => {
                const kw = encodeURIComponent(skill.name)
                const loc = encodeURIComponent(searchCity)
                const cat = SKILL_CATS.find(c => c.id === skill.cat) || SKILL_CATS[0]
                return (
                  <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${cat.color}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{skill.name}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: '2px 8px', borderRadius: 10, border: `1px solid ${cat.color}30` }}>{cat.label}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{radius}mi radius</div>
                        <div>{searchCity}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#556', lineHeight: 1.5, marginBottom: 10 }}>
                      Current openings matching your "{skill.name}" skill. Tap a board to view real-time listings.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`https://www.usajobs.gov/Search/Results?keyword=${kw}&LocationName=${loc}&Radius=${radius}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#1565C0', color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 10, textAlign: 'center', display: 'block' }}>USAJobs</a>
                      <a href={`https://www.usajobs.gov/Search/Results?keyword=${kw}&LocationName=${loc}&Radius=${radius}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#00897B', color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 10, textAlign: 'center', display: 'block' }}>DoD Jobs</a>
                      <a href={`https://myseco.militaryonesource.mil/portal/`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#0077B5', color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 10, textAlign: 'center', display: 'block' }}>MySECO</a>
                    </div>
                  </div>
                )
              })}

              <div style={{ background: '#E8F5E9', border: '1.5px solid #4CAF50', borderRadius: 12, padding: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 4 }}>Security Clearance Advantage</div>
                <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.5, marginBottom: 10 }}>Your military service may have granted a clearance — one of the most valuable credentials in the civilian market. Clearance holders typically earn 10–30% more than peers.</div>
                <a href="https://www.usajobs.gov/Search/Results?keyword=security%20clearance" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: '#2E7D32', color: '#FFF', textDecoration: 'none', fontWeight: 800, fontSize: 12, textAlign: 'center' }}>Browse Clearance Jobs</a>
              </div>
            </>
          ) : (
            <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 8 }}>No skills on file</div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 14 }}>Add your skills in the Skills Profile tab to see personalized job matches.</div>
              <button onClick={() => setActiveTab('skills')} style={{ padding: '10px 24px', borderRadius: 10, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Add Skills →</button>
            </div>
          )}
        </div>
      )}

      {/* ── JOB RESOURCES ── */}
      {activeTab === 'jobboards' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>Job Resources & Career Support</div>
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16, lineHeight: 1.5 }}>Curated job boards and career portals for military members and spouses. Federal hiring preference applies on USAJobs.gov.</div>

          {JOB_BOARDS.map((board, i) => (
            <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${board.color}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{board.name}</div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#FFF', background: board.color, padding: '2px 6px', borderRadius: 8 }}>{board.badge}</span>
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{board.desc}</div>
              </div>
              <a href={board.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 10, background: board.color, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>Open</a>
            </div>
          ))}

          <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 12, borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>MILITARY SPOUSE EMPLOYMENT</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>Dedicated programs and partnerships for spouses navigating careers through PCS moves. Most programs are completely free.</div>
          </div>

          {SPOUSE_BOARDS.map((board, i) => (
            <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${board.color}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{board.name}</div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#FFF', background: board.color, padding: '2px 6px', borderRadius: 8 }}>{board.badge}</span>
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{board.desc}</div>
              </div>
              <a href={board.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 10, background: board.color, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>Open</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmploymentModule
