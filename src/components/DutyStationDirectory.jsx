/*
 * Duty Station Directory — installation-level data for major CONUS & OCONUS installations.
 * Includes on-post housing wait times, TRICARE info, school ratings, and base contact numbers.
 */
import { useState, useMemo } from 'react';

const INSTALLATION_DIRECTORY = {
  'Fort Liberty': {
    state: 'NC', branch: 'Army',
    city: 'Fayetteville',
    housing: { waitTime: '3–6 months', onPostUnits: 'Corvias Military Living', offPostNotes: 'Fayetteville has strong off-post rental market; Spring Lake and Hope Mills popular with families.' },
    tricare: { region: 'East', mtf: 'Womack Army Medical Center', phone: '(910) 907-6000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Cumberland County Schools', rating: 4.2, dodea: false, liaison: '(910) 396-1533' },
    contacts: { housing: '(910) 396-0264', transportation: '(910) 396-3781', finance: '(910) 396-1082', acs: '(910) 396-1584', legal: '(910) 396-8801' },
    website: 'https://home.army.mil/liberty',
  },
  'Fort Carson': {
    state: 'CO', branch: 'Army',
    city: 'Colorado Springs',
    housing: { waitTime: '2–4 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Colorado Springs neighborhoods southeast of post (Fountain, Security) offer reasonable rent near gates.' },
    tricare: { region: 'West', mtf: 'Evans Army Community Hospital', phone: '(719) 526-7551', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Fountain-Fort Carson SD 8 / D-49', rating: 4.3, dodea: false, liaison: '(719) 526-5590' },
    contacts: { housing: '(719) 526-4464', transportation: '(719) 526-5454', finance: '(719) 526-0330', acs: '(719) 526-4590', legal: '(719) 526-4316' },
    website: 'https://home.army.mil/carson',
  },
  'Fort Cavazos': {
    state: 'TX', branch: 'Army',
    city: 'Killeen',
    housing: { waitTime: '2–5 months', onPostUnits: 'Lend Lease Communities', offPostNotes: 'Harker Heights and Copperas Cove are popular off-post options with shorter commutes.' },
    tricare: { region: 'West', mtf: 'Carl R. Darnall Army Medical Center', phone: '(254) 288-8000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Killeen ISD / Copperas Cove ISD', rating: 4.0, dodea: false, liaison: '(254) 287-1589' },
    contacts: { housing: '(254) 287-7036', transportation: '(254) 287-2195', finance: '(254) 288-3560', acs: '(254) 287-3477', legal: '(254) 287-3091' },
    website: 'https://home.army.mil/cavazos',
  },
  'Fort Bliss': {
    state: 'TX', branch: 'Army',
    city: 'El Paso',
    housing: { waitTime: '1–3 months', onPostUnits: 'Hunt Military Communities', offPostNotes: 'El Paso East side (Eastside) and Socorro are popular. Cross-border families sometimes live in New Mexico.' },
    tricare: { region: 'West', mtf: 'William Beaumont Army Medical Center', phone: '(915) 742-2121', primeAvailable: true, selectAvailable: true },
    schools: { district: 'El Paso ISD / Ysleta ISD', rating: 3.9, dodea: false, liaison: '(915) 568-7975' },
    contacts: { housing: '(915) 568-2141', transportation: '(915) 568-1234', finance: '(915) 568-3530', acs: '(915) 568-4516', legal: '(915) 568-7154' },
    website: 'https://home.army.mil/bliss',
  },
  'Fort Sam Houston': {
    state: 'TX', branch: 'Army',
    city: 'San Antonio',
    housing: { waitTime: '3–8 months (Joint Base)', onPostUnits: 'Balfour Beatty / Island Palm', offPostNotes: 'San Antonio is JBSA — joint installation. Neighborhoods northeast of post (Windcrest, Converse) are popular.' },
    tricare: { region: 'West', mtf: 'Brooke Army Medical Center (BAMC)', phone: '(210) 916-4141', primeAvailable: true, selectAvailable: true },
    schools: { district: 'North East ISD / Judson ISD', rating: 4.4, dodea: false, liaison: '(210) 221-2604' },
    contacts: { housing: '(210) 221-2404', transportation: '(210) 221-0671', finance: '(210) 221-8111', acs: '(210) 221-2705', legal: '(210) 221-2410' },
    website: 'https://www.jbsa.mil',
  },
  'Joint Base Lewis-McChord': {
    state: 'WA', branch: 'Army/Air Force',
    city: 'Tacoma',
    housing: { waitTime: '4–8 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Lakewood, University Place, and Spanaway are popular off-post areas. Tacoma rental market moves fast.' },
    tricare: { region: 'West', mtf: 'Madigan Army Medical Center', phone: '(253) 968-1110', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Clover Park SD / Bethel SD', rating: 4.2, dodea: false, liaison: '(253) 966-0100' },
    contacts: { housing: '(253) 967-3541', transportation: '(253) 967-7325', finance: '(253) 967-2402', acs: '(253) 967-4291', legal: '(253) 967-1013' },
    website: 'https://home.army.mil/lewis-mcchord',
  },
  'Schofield Barracks': {
    state: 'HI', branch: 'Army',
    city: 'Wahiawa (Oahu)',
    housing: { waitTime: '6–12 months (high demand)', onPostUnits: 'Ohana Military Communities', offPostNotes: 'Ewa Beach, Mililani, and Kapolei are popular off-post. Rents are very high — plan for BAH to be a significant portion of rent.' },
    tricare: { region: 'West', mtf: 'Tripler Army Medical Center', phone: '(808) 433-6661', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Hawaii DOE (Statewide)', rating: 4.5, dodea: true, dodealabel: 'Leilehua/Wheeler area DoDEA', liaison: '(808) 655-9728' },
    contacts: { housing: '(808) 655-9211', transportation: '(808) 655-5162', finance: '(808) 655-4408', acs: '(808) 655-4ACS', legal: '(808) 655-9227' },
    website: 'https://home.army.mil/hawaii',
  },
  'Fort Campbell': {
    state: 'KY/TN', branch: 'Army',
    city: 'Clarksville',
    housing: { waitTime: '2–4 months', onPostUnits: 'Campbell Crossing (Lend Lease)', offPostNotes: 'Clarksville (TN side) is the most popular off-post area. Oak Grove (KY) is directly adjacent to Screaming Eagle Gate.' },
    tricare: { region: 'East', mtf: 'Blanchfield Army Community Hospital', phone: '(270) 798-8400', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Clarksville-Montgomery Co SD / Christian County SD', rating: 4.1, dodea: false, liaison: '(270) 798-7523' },
    contacts: { housing: '(270) 798-6139', transportation: '(270) 798-3207', finance: '(270) 798-2141', acs: '(270) 798-5510', legal: '(270) 798-5519' },
    website: 'https://home.army.mil/campbell',
  },
  'Fort Stewart': {
    state: 'GA', branch: 'Army',
    city: 'Hinesville',
    housing: { waitTime: '1–3 months', onPostUnits: 'Picerne Military Housing', offPostNotes: 'Hinesville is the primary off-post city. Richmond Hill is popular for families (excellent schools, 30-min commute).' },
    tricare: { region: 'East', mtf: 'Winn Army Community Hospital', phone: '(912) 435-6965', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Liberty County Schools', rating: 4.0, dodea: false, liaison: '(912) 767-2248' },
    contacts: { housing: '(912) 767-5146', transportation: '(912) 767-1234', finance: '(912) 767-6361', acs: '(912) 767-5058', legal: '(912) 767-2264' },
    website: 'https://home.army.mil/stewart',
  },
  'Fort Moore': {
    state: 'GA', branch: 'Army',
    city: 'Columbus',
    housing: { waitTime: '2–4 months', onPostUnits: 'Corvias Military Living', offPostNotes: 'Columbus and Phenix City (AL across the river) are the main off-post options. Midland area is popular.' },
    tricare: { region: 'East', mtf: 'Martin Army Community Hospital', phone: '(706) 544-2516', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Muscogee County SD / Phenix City SD (AL)', rating: 4.0, dodea: false, liaison: '(706) 545-2958' },
    contacts: { housing: '(706) 545-7461', transportation: '(706) 545-1234', finance: '(706) 545-6044', acs: '(706) 545-6363', legal: '(706) 544-5165' },
    website: 'https://home.army.mil/moore',
  },
  'Fort Eisenhower': {
    state: 'GA', branch: 'Army',
    city: 'Augusta',
    housing: { waitTime: '1–3 months', onPostUnits: 'Corvias Military Living (Augusta)', offPostNotes: 'Evans, Grovetown, and Martinez are popular off-post communities. Aiken (SC) is also accessible.' },
    tricare: { region: 'East', mtf: 'Dwight David Eisenhower Army Medical Center', phone: '(706) 787-5811', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Columbia County Schools (GA)', rating: 4.6, dodea: false, liaison: '(706) 791-3369' },
    contacts: { housing: '(706) 791-6116', transportation: '(706) 791-1234', finance: '(706) 791-2215', acs: '(706) 791-3579', legal: '(706) 791-7770' },
    website: 'https://home.army.mil/eisenhower',
  },
  'Fort Drum': {
    state: 'NY', branch: 'Army',
    city: 'Watertown',
    housing: { waitTime: '2–5 months', onPostUnits: 'Corvias Military Living', offPostNotes: 'Watertown and Sackets Harbor are main off-post options. Expect harsh winters — heating costs are significant.' },
    tricare: { region: 'East', mtf: 'Samaritan Medical Center (civilian MTF, no on-post hospital)', phone: 'TRICARE East: 1-844-866-9378', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Watertown City SD / Indian River CSD', rating: 3.9, dodea: false, liaison: '(315) 772-5493' },
    contacts: { housing: '(315) 772-9044', transportation: '(315) 772-5493', finance: '(315) 772-5493', acs: '(315) 772-6422', legal: '(315) 772-7021' },
    website: 'https://home.army.mil/drum',
  },
  'Fort Sill': {
    state: 'OK', branch: 'Army',
    city: 'Lawton',
    housing: { waitTime: '1–2 months', onPostUnits: 'Corvias Military Living', offPostNotes: 'Lawton has affordable off-post rental market. Duncan and Cache are smaller communities within commuting distance.' },
    tricare: { region: 'West', mtf: 'Reynolds Army Health Clinic', phone: '(580) 442-6000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Lawton Public Schools / Elgin SD', rating: 3.8, dodea: false, liaison: '(580) 442-4240' },
    contacts: { housing: '(580) 442-3000', transportation: '(580) 442-4240', finance: '(580) 442-7040', acs: '(580) 442-4391', legal: '(580) 442-5765' },
    website: 'https://home.army.mil/sill',
  },
  'Fort Riley': {
    state: 'KS', branch: 'Army',
    city: 'Junction City / Manhattan',
    housing: { waitTime: '1–3 months', onPostUnits: 'Lend Lease Communities', offPostNotes: 'Junction City is adjacent; Manhattan (KS) is 30 min and preferred by many families (Big 12 university town, better amenities).' },
    tricare: { region: 'West', mtf: 'Irwin Army Community Hospital', phone: '(785) 239-7000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'USD 475 Geary County / USD 383 Manhattan-Ogden', rating: 4.1, dodea: false, liaison: '(785) 239-3312' },
    contacts: { housing: '(785) 239-3055', transportation: '(785) 239-3312', finance: '(785) 239-3068', acs: '(785) 239-3013', legal: '(785) 239-3033' },
    website: 'https://home.army.mil/riley',
  },
  'Fort Leavenworth': {
    state: 'KS', branch: 'Army',
    city: 'Leavenworth',
    housing: { waitTime: '1–2 months (CGSC attendees given priority)', onPostUnits: 'Picerne Military Housing', offPostNotes: 'Leavenworth city and Lansing are adjacent. Many CGSC students live off-post in the KC metro (Overland Park, Liberty MO).' },
    tricare: { region: 'West', mtf: 'Munson Army Health Center', phone: '(913) 684-6100', primeAvailable: true, selectAvailable: true },
    schools: { district: 'USD 453 Leavenworth', rating: 4.2, dodea: false, liaison: '(913) 684-5100' },
    contacts: { housing: '(913) 684-5000', transportation: '(913) 684-5100', finance: '(913) 684-2480', acs: '(913) 684-2880', legal: '(913) 684-5186' },
    website: 'https://home.army.mil/leavenworth',
  },
  'Fort Knox': {
    state: 'KY', branch: 'Army',
    city: 'Elizabethtown / Radcliff',
    housing: { waitTime: '1–3 months', onPostUnits: 'Corvias Military Living', offPostNotes: 'Radcliff, Vine Grove, and Elizabethtown are the main off-post areas. Louisville (~45 min) for more amenities.' },
    tricare: { region: 'East', mtf: 'Ireland Army Community Hospital', phone: '(502) 624-9333', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Hardin County Schools / Meade County', rating: 4.1, dodea: false, liaison: '(502) 624-3624' },
    contacts: { housing: '(502) 624-6395', transportation: '(502) 624-3624', finance: '(502) 624-1220', acs: '(502) 624-2172', legal: '(502) 624-2771' },
    website: 'https://home.army.mil/knox',
  },
  'Fort Jackson': {
    state: 'SC', branch: 'Army',
    city: 'Columbia',
    housing: { waitTime: '2–4 months', onPostUnits: 'Corvias Military Living', offPostNotes: 'Columbia is a large city with many off-post options. Lexington and Irmo are popular suburbs with good schools.' },
    tricare: { region: 'East', mtf: 'Moncrief Army Health Clinic', phone: '(803) 751-5430', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Richland SD 1 & 2 / Lexington SD 1', rating: 4.2, dodea: false, liaison: '(803) 751-5430' },
    contacts: { housing: '(803) 751-5000', transportation: '(803) 751-5430', finance: '(803) 751-5000', acs: '(803) 751-7605', legal: '(803) 751-7715' },
    website: 'https://home.army.mil/jackson',
  },
  'Fort Belvoir': {
    state: 'VA', branch: 'Army',
    city: 'Fairfax County',
    housing: { waitTime: '6–12 months (very high demand — apply immediately)', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Springfield, Lorton, and Woodbridge are common off-post areas. NoVA rental market is very competitive and expensive.' },
    tricare: { region: 'East', mtf: 'Fort Belvoir Community Hospital', phone: '(571) 231-3000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Fairfax County Public Schools', rating: 4.8, dodea: false, liaison: '(703) 805-3161' },
    contacts: { housing: '(703) 805-3168', transportation: '(703) 805-3025', finance: '(703) 805-4040', acs: '(703) 805-3940', legal: '(703) 806-3190' },
    website: 'https://home.army.mil/belvoir',
  },
  'Fort Meade': {
    state: 'MD', branch: 'Army/NSA',
    city: 'Anne Arundel County',
    housing: { waitTime: '6–10 months (NSA/cyber workforce — apply ASAP)', onPostUnits: 'Meade Communities LLC', offPostNotes: 'Odenton, Crofton, and Laurel are popular. DC Metro access makes this one of the highest-cost CONUS areas.' },
    tricare: { region: 'East', mtf: 'Kimbrough Ambulatory Care Center', phone: '(301) 677-8000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Anne Arundel County Public Schools', rating: 4.5, dodea: false, liaison: '(301) 677-4516' },
    contacts: { housing: '(301) 677-5590', transportation: '(301) 677-4516', finance: '(301) 677-6261', acs: '(301) 677-7023', legal: '(301) 677-3765' },
    website: 'https://home.army.mil/meade',
  },
  'Naval Station Norfolk': {
    state: 'VA', branch: 'Navy',
    city: 'Norfolk / Hampton Roads',
    housing: { waitTime: '2–6 months', onPostUnits: 'Lincoln Military Housing', offPostNotes: 'Chesapeake, Virginia Beach, and Suffolk are popular. The Hampton Roads area has a wide range of rental price points.' },
    tricare: { region: 'East', mtf: 'Naval Medical Center Portsmouth', phone: '(757) 953-5000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Norfolk City / Virginia Beach / Chesapeake', rating: 4.3, dodea: false, liaison: '(757) 444-7403' },
    contacts: { housing: '(757) 444-2584', transportation: '(757) 445-3999', finance: '(757) 444-7000', family: '(757) 444-2102' },
    website: 'https://www.cnic.navy.mil/regions/cnrma/installations/ns_norfolk.html',
  },
  'Camp Lejeune': {
    state: 'NC', branch: 'Marine Corps',
    city: 'Jacksonville',
    housing: { waitTime: '2–5 months', onPostUnits: 'Atlantic Marine Corps Communities', offPostNotes: 'Jacksonville is the primary off-post city. Richlands and Sneads Ferry are quieter options near different gates.' },
    tricare: { region: 'East', mtf: 'Naval Medical Center Camp Lejeune', phone: '(910) 450-4300', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Onslow County Schools', rating: 4.0, dodea: true, dodealabel: 'Tarawa Terrace ES / Courthouse Bay', liaison: '(910) 451-2075' },
    contacts: { housing: '(910) 451-7033', transportation: '(910) 451-6097', finance: '(910) 451-0222', family: '(910) 450-0777' },
    website: 'https://www.lejeune.marines.mil',
  },
  'MCB Quantico': {
    state: 'VA', branch: 'Marine Corps',
    city: 'Prince William County',
    housing: { waitTime: '3–7 months', onPostUnits: 'Lincoln Military Housing', offPostNotes: 'Stafford and Woodbridge are popular. DC commuter corridor — expect traffic. I-95 corridor dominates daily life.' },
    tricare: { region: 'East', mtf: 'Quantico Naval Medical Clinic', phone: '(703) 784-1521', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Prince William County Public Schools', rating: 4.4, dodea: true, dodealabel: 'Quantico Middle-High / Crossroads', liaison: '(703) 784-2285' },
    contacts: { housing: '(703) 784-5386', transportation: '(703) 784-2285', finance: '(703) 784-2400', family: '(703) 784-2536' },
    website: 'https://www.quantico.marines.mil',
  },
  'MCB Camp Pendleton': {
    state: 'CA', branch: 'Marine Corps',
    city: 'Oceanside',
    housing: { waitTime: '4–8 months', onPostUnits: 'Lincoln Military Housing', offPostNotes: 'Oceanside, San Clemente, and Fallbrook are popular. Southern California rents are among the highest in CONUS.' },
    tricare: { region: 'West', mtf: 'Naval Hospital Camp Pendleton', phone: '(760) 725-1247', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Oceanside Unified / Vista Unified / San Clemente', rating: 4.6, dodea: true, dodealabel: 'San Onofre Elementary / Del Mar', liaison: '(760) 725-6220' },
    contacts: { housing: '(760) 725-5304', transportation: '(760) 725-4900', finance: '(760) 725-5526', family: '(760) 725-4166' },
    website: 'https://www.pendleton.marines.mil',
  },
  'Eglin AFB': {
    state: 'FL', branch: 'Air Force',
    city: 'Fort Walton Beach / Destin',
    housing: { waitTime: '3–6 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Fort Walton Beach, Niceville, and Destin are popular. Excellent Gulf Coast quality of life. Schools are highly rated.' },
    tricare: { region: 'West', mtf: '96th Medical Group (Eglin Hospital)', phone: '(850) 883-8221', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Okaloosa County Schools', rating: 4.7, dodea: false, liaison: '(850) 882-3541' },
    contacts: { housing: '(850) 882-2441', transportation: '(850) 882-5541', finance: '(850) 882-3241', family: '(850) 882-5900' },
    website: 'https://www.eglin.af.mil',
  },
  'Langley AFB': {
    state: 'VA', branch: 'Air Force',
    city: 'Hampton',
    housing: { waitTime: '3–6 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Hampton, Newport News, and Poquoson are the primary off-base communities. Hampton Roads traffic near I-64 is significant.' },
    tricare: { region: 'East', mtf: '633rd Medical Group (Langley)', phone: '(757) 764-6969', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Hampton City Schools / York County', rating: 4.5, dodea: false, liaison: '(757) 764-8770' },
    contacts: { housing: '(757) 764-5600', transportation: '(757) 764-3504', finance: '(757) 764-6000', family: '(757) 764-3872' },
    website: 'https://www.jble.af.mil',
  },
  'Wright-Patterson AFB': {
    state: 'OH', branch: 'Air Force',
    city: 'Dayton',
    housing: { waitTime: '2–4 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Beavercreek, Centerville, and Fairborn are popular. Dayton metro has affordable housing compared to most CONUS bases.' },
    tricare: { region: 'East', mtf: '88th Medical Group (WPAFB)', phone: '(937) 522-2778', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Beavercreek CSD / Kettering CSD', rating: 4.6, dodea: false, liaison: '(937) 522-3451' },
    contacts: { housing: '(937) 257-3216', transportation: '(937) 257-3451', finance: '(937) 257-4000', family: '(937) 257-3393' },
    website: 'https://www.wpafb.af.mil',
  },
  'Keesler AFB': {
    state: 'MS', branch: 'Air Force',
    city: 'Biloxi',
    housing: { waitTime: '1–3 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Biloxi, D\'Iberville, and Ocean Springs are popular off-base neighborhoods. Gulf Coast living with lower cost of living.' },
    tricare: { region: 'East', mtf: '81st Medical Group (Keesler)', phone: '(228) 376-2550', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Biloxi Public Schools / Harrison County', rating: 4.0, dodea: false, liaison: '(228) 377-3541' },
    contacts: { housing: '(228) 377-5400', transportation: '(228) 377-2341', finance: '(228) 377-4000', family: '(228) 377-3541' },
    website: 'https://www.keesler.af.mil',
  },
  'Maxwell AFB': {
    state: 'AL', branch: 'Air Force',
    city: 'Montgomery',
    housing: { waitTime: '1–2 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Prattville, Pike Road, and east Montgomery are popular. Affordable cost of living compared to most CONUS bases.' },
    tricare: { region: 'East', mtf: '42nd Medical Group (Maxwell)', phone: '(334) 953-7541', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Montgomery County Public Schools / Prattville', rating: 4.0, dodea: false, liaison: '(334) 953-7541' },
    contacts: { housing: '(334) 953-2741', transportation: '(334) 953-2341', finance: '(334) 953-5541', family: '(334) 953-3241' },
    website: 'https://www.maxwell.af.mil',
  },
  'NAS Pensacola': {
    state: 'FL', branch: 'Navy',
    city: 'Pensacola',
    housing: { waitTime: '2–4 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Pensacola Beach, Gulf Breeze, Pace, and Navarre are popular. Beautiful Gulf Coast area with very affordable rents.' },
    tricare: { region: 'East', mtf: 'Naval Hospital Pensacola', phone: '(850) 505-6601', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Escambia County / Santa Rosa County SD', rating: 4.5, dodea: false, liaison: '(850) 452-3212' },
    contacts: { housing: '(850) 452-6123', transportation: '(850) 452-2341', finance: '(850) 452-4000', family: '(850) 452-6154' },
    website: 'https://www.cnic.navy.mil/regions/cnrse/installations/nas_pensacola.html',
  },
  'NAS Jacksonville': {
    state: 'FL', branch: 'Navy',
    city: 'Jacksonville',
    housing: { waitTime: '2–5 months', onPostUnits: 'Lincoln Military Housing', offPostNotes: 'Orange Park, Fleming Island, and Middleburg on the south side; Mandarin and San Marco on the north. Jacksonville is large with many off-base options.' },
    tricare: { region: 'East', mtf: 'Naval Air Station Jacksonville Branch Medical', phone: '(904) 542-7300', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Duval County Public Schools / Clay County', rating: 4.2, dodea: false, liaison: '(904) 542-3318' },
    contacts: { housing: '(904) 542-3333', transportation: '(904) 542-2341', finance: '(904) 542-4000', family: '(904) 542-2766' },
    website: 'https://www.cnic.navy.mil/regions/cnrse/installations/nas_jacksonville.html',
  },
  'USAG Humphreys': {
    state: 'KOR', branch: 'Army', oconus: true,
    city: 'Pyeongtaek, South Korea',
    housing: { waitTime: '0–2 months (barracks for junior enlisted; tower housing for families)', onPostUnits: 'Garrison housing (government-owned)', offPostNotes: 'Most families live on-post. Very limited quality off-post options; on-post living strongly recommended.' },
    tricare: { region: 'OCONUS', mtf: 'Brian D. Allgood Army Community Hospital', phone: 'DSN 753-8888 / +82-31-690-8888', primeAvailable: true, selectAvailable: false },
    schools: { district: 'DoDEA Pacific (Humphreys MS, HS)', rating: 4.6, dodea: true, dodealabel: 'Humphreys Elementary/MS/HS', liaison: 'DSN 753-2261' },
    contacts: { housing: 'DSN 753-7165', transportation: 'DSN 753-5162', finance: 'DSN 753-3411', acs: 'DSN 753-7003' },
    website: 'https://home.army.mil/humphreys',
  },
  'Fort Wainwright': {
    state: 'AK', branch: 'Army',
    city: 'Fairbanks',
    housing: { waitTime: '1–3 months', onPostUnits: 'Balfour Beatty Communities', offPostNotes: 'Fairbanks North Star Borough. Plan for extreme cold (-40°F possible). On-post housing is often preferred for heating reliability.' },
    tricare: { region: 'West', mtf: 'Bassett Army Community Hospital', phone: '(907) 361-4000', primeAvailable: true, selectAvailable: true },
    schools: { district: 'Fairbanks North Star Borough SD', rating: 4.0, dodea: true, dodealabel: 'Fort Wainwright Schools (DoDEA Pacific)', liaison: '(907) 361-7000' },
    contacts: { housing: '(907) 361-4000', transportation: '(907) 361-4000', finance: '(907) 361-4000', acs: '(907) 361-7000' },
    website: 'https://home.army.mil/wainwright',
  },
};

// Get all available installation names from directory
export const DIRECTORY_INSTALLATIONS = Object.keys(INSTALLATION_DIRECTORY).sort();

function ContactRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4F8', fontSize: 12 }}>
      <span style={{ color: '#56697C', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#0D1821', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function RatingStars({ rating }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: '#F59E0B', fontSize: 13 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <strong style={{ color: '#0D1821', marginLeft: 4, fontSize: 12 }}>{rating.toFixed(1)}</strong>
    </span>
  );
}

export default function DutyStationDirectory({ theme, profile }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(
    profile?.gainingInstallation
      ? Object.keys(INSTALLATION_DIRECTORY).find(k =>
          profile.gainingInstallation.includes(k) || k.includes(profile.gainingInstallation.split(',')[0])
        ) || ''
      : ''
  );
  const [section, setSection] = useState('housing');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return DIRECTORY_INSTALLATIONS;
    return DIRECTORY_INSTALLATIONS.filter(s => s.toLowerCase().includes(q));
  }, [search]);

  const data = selected ? INSTALLATION_DIRECTORY[selected] : null;

  const sections = [
    { id: 'housing', label: 'Housing' },
    { id: 'tricare', label: 'TRICARE' },
    { id: 'schools', label: 'Schools' },
    { id: 'contacts', label: 'Contacts' },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>DUTY STATION DIRECTORY</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Installation Intelligence</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          On-post housing wait times, TRICARE providers, school ratings, and base office contacts for major CONUS & OCONUS installations.
        </div>
      </div>

      {/* Search / Picker */}
      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="Search installation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', border: '1px solid #D8DEE7', borderRadius: 12, padding: '10px 12px', fontSize: 14, color: '#111827', background: '#FFF', boxSizing: 'border-box', marginBottom: 6 }}
        />
        {(search || !selected) && (
          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            {filtered.slice(0, 60).map(name => {
              const d = INSTALLATION_DIRECTORY[name];
              return (
                <div
                  key={name}
                  onClick={() => { setSelected(name); setSearch(''); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F3F4F6', background: name === selected ? '#EEF5FF' : '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: name === selected ? 700 : 500, color: '#111827' }}>{name}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>{d.city}, {d.state} · {d.branch}</div>
                  </div>
                  {d.oconus && <span style={{ fontSize: 9, background: '#FFF3E0', color: '#E65100', borderRadius: 4, padding: '2px 5px', fontWeight: 700 }}>OCONUS</span>}
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: 14, color: '#888', fontSize: 12 }}>No installations found</div>}
          </div>
        )}
        {selected && !search && (
          <div style={{ background: '#F0F4FF', border: '1px solid #C7D7F5', borderRadius: 10, padding: '8px 12px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{selected}</strong> — {data?.city}, {data?.state}</span>
            <button onClick={() => setSelected('')} style={{ background: 'none', border: 'none', color: theme.primary, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Change</button>
          </div>
        )}
      </div>

      {!selected && (
        <div style={{ background: '#F8F9FA', borderRadius: 14, padding: 20, textAlign: 'center', color: '#56697C', fontSize: 13 }}>
          Select an installation above to view its directory data.
        </div>
      )}

      {selected && data && (
        <>
          {/* OCONUS notice */}
          {data.oconus && (
            <div style={{ background: '#FFF3E0', border: '1.5px solid #FFB74D', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#6D4C00' }}>
              <strong>OCONUS Installation</strong> — OHA (Overseas Housing Allowance) applies. Contact your gaining unit housing office for current OHA rates and local housing guidance.
            </div>
          )}

          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${section === s.id ? theme.primary : '#E0E6EE'}`, background: section === s.id ? theme.primary : '#FFF', color: section === s.id ? '#FFF' : '#56697C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Housing */}
          {section === 'housing' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary}`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 6 }}>ON-POST HOUSING WAIT TIME</div>
                <div style={{ fontSize: 22, fontWeight: 950, color: theme.primary }}>{data.housing.waitTime}</div>
                <div style={{ fontSize: 11, color: '#56697C', marginTop: 6 }}>Apply immediately upon receiving PCS orders — waitlists fill fast at most installations.</div>
              </div>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#56697C', letterSpacing: '.06em', marginBottom: 6 }}>ON-POST OPERATOR</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0D1821' }}>{data.housing.onPostUnits}</div>
              </div>
              <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', marginBottom: 6 }}>OFF-POST NOTES</div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{data.housing.offPostNotes}</div>
              </div>
              <a href="https://www.militaryonesource.mil/housing-and-moving/home-buying-and-renting/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, borderRadius: 12, background: theme.primary, color: '#FFF', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>
                Military OneSource Housing Resources
              </a>
            </div>
          )}

          {/* TRICARE */}
          {section === 'tricare' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid #1565C0`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 6 }}>TRICARE REGION</div>
                <div style={{ fontSize: 18, fontWeight: 950, color: '#1565C0', marginBottom: 4 }}>{data.tricare.region}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.tricare.primeAvailable && <span style={{ background: '#E8F5E9', color: '#2E7D32', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>Prime Available</span>}
                  {data.tricare.selectAvailable && <span style={{ background: '#E3F2FD', color: '#1565C0', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>Select Available</span>}
                </div>
              </div>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 4 }}>MILITARY TREATMENT FACILITY (MTF)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0D1821', marginBottom: 6 }}>{data.tricare.mtf}</div>
                <div style={{ fontSize: 13, color: theme.primary, fontWeight: 600 }}>{data.tricare.phone}</div>
              </div>
              <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 12, fontSize: 11, color: '#6D4C00', lineHeight: 1.6 }}>
                Transfer TRICARE enrollment to the new region as soon as PCS orders are received. Use tricare.mil or call TRICARE to update your enrollment before departing current duty station.
              </div>
              <a href="https://www.tricare.mil/Resources/Enrollment" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, borderRadius: 12, background: '#1565C0', color: '#FFF', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>
                TRICARE Enrollment Transfer (tricare.mil)
              </a>
            </div>
          )}

          {/* Schools */}
          {section === 'schools' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid #5D4037`, borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 6 }}>SCHOOL DISTRICT</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>{data.schools.district}</div>
                <RatingStars rating={data.schools.rating} />
                <div style={{ fontSize: 11, color: '#56697C', marginTop: 4 }}>Community satisfaction rating</div>
              </div>
              {data.schools.dodea && (
                <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#1B5E20', marginBottom: 4 }}>DoDEA SCHOOL ON-POST</div>
                  <div style={{ fontSize: 13, color: '#1B5E20', fontWeight: 700 }}>{data.schools.dodealabel}</div>
                  <div style={{ fontSize: 11, color: '#388E3C', marginTop: 4 }}>Department of Defense Education Activity (DoDEA) school on or adjacent to post.</div>
                </div>
              )}
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 4 }}>SCHOOL LIAISON OFFICER</div>
                <div style={{ fontSize: 13, color: theme.primary, fontWeight: 700 }}>{data.schools.liaison}</div>
                <div style={{ fontSize: 11, color: '#56697C', marginTop: 4 }}>School Liaison Officers assist with enrollment, record transfers, and district coordination. Contact them immediately after receiving orders.</div>
              </div>
              <a href="https://www.dodea.edu/home.cfm" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, borderRadius: 12, background: '#5D4037', color: '#FFF', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>
                DoDEA School Finder
              </a>
            </div>
          )}

          {/* Contacts */}
          {section === 'contacts' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#56697C', letterSpacing: '.06em', marginBottom: 10 }}>BASE OFFICE CONTACTS</div>
                <ContactRow label="Housing Office" value={data.contacts.housing} />
                <ContactRow label="Transportation (TMO)" value={data.contacts.transportation} />
                <ContactRow label="Finance" value={data.contacts.finance} />
                <ContactRow label="ACS / Family Support" value={data.contacts.acs || data.contacts.family} />
                <ContactRow label="Legal" value={data.contacts.legal} />
              </div>
              {data.website && (
                <a href={data.website} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, borderRadius: 12, background: theme.primary, color: '#FFF', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>
                  Official Installation Website
                </a>
              )}
              <a href="https://installations.militaryonesource.mil/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, borderRadius: 12, background: '#F3F4F6', color: '#111827', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid #E5E7EB' }}>
                Military OneSource — All Installations
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
