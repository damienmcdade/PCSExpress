/*
 * INSTALLATION_SCHOOLS — extracted from src/App.jsx in Phase 17.1 to shrink the
 * main shell file and let Vite chunk static data independently of
 * App component code (cache invalidation granularity). Verbatim
 * copy of the inlined version; no schema or behavior change.
 *
 * PROVENANCE NOTE (added during pre-launch audit):
 *   The numeric `rating` values and `desc` blurbs below are summary
 *   characterizations to help families compare options at a glance.
 *   They are NOT sourced from GreatSchools, Niche, U.S. News, or any
 *   other proprietary feed, and should not be treated as authoritative
 *   evaluations of the named institutions. Users should always verify
 *   current performance, accreditation, and military-family fit
 *   directly with each school. If a school disputes its rating or
 *   description, the entry will be corrected or removed.
 *
 *   Roadmap: replace this static table with on-demand links to the
 *   official NCES Common Core of Data (https://nces.ed.gov/ccd/) so
 *   the app stops carrying editorial assessments and only links to
 *   authoritative records.
 */
export const INSTALLATION_SCHOOLS = {
  "Fort Liberty": [
    { name:"Douglas Byrd Middle School", grades:"6-8", rating:3.8, desc:"Title I school serving military and civilian families near Fort Liberty. Strong JROTC feeder program.", url:"", city:"Fayetteville, NC" },
    { name:"Terry Sanford High School", grades:"9-12", rating:4.1, desc:"IB programme available. Active military family support group. Strong sports programs.", url:"", city:"Fayetteville, NC" },
    { name:"Westover Hills Elementary", grades:"K-5", rating:4.0, desc:"High-performing elementary near post housing. Military family liaison on staff.", url:"", city:"Fayetteville, NC" },
    { name:"Pines Level Middle School", grades:"6-8", rating:3.6, desc:"STEM focus, robotics club. Close to Bragg housing areas.", url:"", city:"Harnett County, NC" },
  ],
  "Camp Humphreys": [
    { name:"Humphreys Elementary School (DoDEA)", grades:"K-5", rating:4.5, desc:"DoD operated school on post. Serves USFK families. Fully accredited.", url:"", city:"Camp Humphreys, South Korea" },
    { name:"Humphreys Middle School (DoDEA)", grades:"6-8", rating:4.4, desc:"DoDEA school with strong academic standards. Special education services available.", url:"", city:"Camp Humphreys, South Korea" },
    { name:"Humphreys High School (DoDEA)", grades:"9-12", rating:4.3, desc:"AP courses available. Dual enrollment with community college. Sports and arts programs.", url:"", city:"Camp Humphreys, South Korea" },
  ],
  "Fort Bragg": [
    { name:"Irwin Elementary School (DoDEA)", grades:"K-5", rating:4.4, desc:"DoDEA on-post school. Military family support built in.", url:"", city:"Fort Bragg, NC" },
    { name:"Longstreet Middle School (DoDEA)", grades:"6-8", rating:4.3, desc:"DoDEA school, STEM focus.", url:"", city:"Fort Bragg, NC" },
  ],
  "Joint Base Lewis-McChord": [
    { name:"Clover Park High School", grades:"9-12", rating:3.9, desc:"Large high school near JBLM. Military family support coordinator. IB program.", url:"", city:"Lakewood, WA" },
    { name:"Mann Elementary School", grades:"K-5", rating:3.7, desc:"Strong military family enrollment. Before/after care available.", url:"", city:"Lakewood, WA" },
    { name:"Park Lodge Elementary", grades:"K-5", rating:4.0, desc:"High-rated elementary near JBLM main gate.", url:"", city:"University Place, WA" },
  ],
  "Fort Hood": [
    { name:"Killeen High School", grades:"9-12", rating:3.5, desc:"Largest high school near Fort Hood. JROTC program. Career technical programs.", url:"", city:"Killeen, TX" },
    { name:"Nolan Middle School", grades:"6-8", rating:3.8, desc:"STEM magnet program. Military family advocate on staff.", url:"", city:"Killeen, TX" },
    { name:"Rancier Elementary", grades:"K-5", rating:3.9, desc:"High military enrollment. PTA very active with PCS support.", url:"", city:"Killeen, TX" },
  ],
  "Fort Campbell": [
    { name:"Fort Campbell High School (DoDEA)", grades:"9-12", rating:4.2, desc:"On-post DoDEA school. Strong AP and athletics programs.", url:"", city:"Fort Campbell, KY" },
    { name:"Mahaffey Middle School (DoDEA)", grades:"6-8", rating:4.1, desc:"On-post DoDEA school.", url:"", city:"Fort Campbell, KY" },
    { name:"Wassom Middle School (DoDEA)", grades:"K-5", rating:4.3, desc:"On-post elementary.", url:"", city:"Fort Campbell, KY" },
  ],
  "Fort Benning": [
    { name:"Benning Hills Elementary (DoDEA)", grades:"K-5", rating:4.2, desc:"On-post DoDEA elementary.", url:"", city:"Fort Benning, GA" },
    { name:"Baker Middle School", grades:"6-8", rating:3.7, desc:"Near Benning. ROTC prep focus.", url:"", city:"Columbus, GA" },
    { name:"Hardaway High School", grades:"9-12", rating:3.8, desc:"Strong ROTC and athletics. Near main post.", url:"", city:"Columbus, GA" },
  ],
  "Fort Sam Houston": [
    { name:"Sam Houston High School", grades:"9-12", rating:3.6, desc:"Near Fort Sam. JROTC program. Magnet programs available.", url:"", city:"San Antonio, TX" },
    { name:"Hirsch Elementary", grades:"K-5", rating:3.8, desc:"Near post housing areas.", url:"", city:"San Antonio, TX" },
  ],
  "Naval Station Norfolk": [
    { name:"Norview High School", grades:"9-12", rating:3.6, desc:"Near NS Norfolk. NJROTC program. Navy family support.", url:"", city:"Norfolk, VA" },
    { name:"Tidewater Elementary", grades:"K-5", rating:3.9, desc:"High military enrollment. Near Chesapeake Bay area.", url:"", city:"Norfolk, VA" },
    { name:"Granby High School", grades:"9-12", rating:3.8, desc:"IB programme. Strong arts program. Military family liaison.", url:"", city:"Norfolk, VA" },
  ],
  "Marine Corps Base Camp Lejeune": [
    { name:"Lejeune High School (DoDEA)", grades:"9-12", rating:4.1, desc:"On-post DoDEA school. Strong athletics and AP courses.", url:"", city:"Camp Lejeune, NC" },
    { name:"Lejeune Middle School (DoDEA)", grades:"6-8", rating:4.0, desc:"On-post DoDEA school.", url:"", city:"Camp Lejeune, NC" },
    { name:"Tarawa Terrace Elementary (DoDEA)", grades:"K-5", rating:4.2, desc:"On-post DoDEA elementary.", url:"", city:"Camp Lejeune, NC" },
  ],

// ── ARMY · CONUS ─────────────────────────────────────────────────────────
  "Fort Carson": [
    { name: "Mountain View Elementary School", grades: "K-5", rating: 3.9, desc: "Colorado Springs District 11 elementary with high military enrollment near Fort Carson.", url: "", city: "Colorado Springs, CO" },
    { name: "Harrison High School", grades: "9-12", rating: 3.7, desc: "Harrison District 2 high school near Fort Carson south gate. JROTC program, career-technical pathways.", url: "", city: "Colorado Springs, CO" },
    { name: "Carmel Middle School", grades: "6-8", rating: 3.8, desc: "District 11 middle school serving Fort Carson families. STEM and arts programs.", url: "", city: "Colorado Springs, CO" },
  ],
  "Fort Bliss": [
    { name: "Pebble Hills High School", grades: "9-12", rating: 3.8, desc: "Socorro ISD high school near Fort Bliss housing areas. JROTC and career-tech programs.", url: "", city: "El Paso, TX" },
    { name: "Transmountain Early College High School", grades: "9-12", rating: 4.0, desc: "Ysleta ISD dual-credit high school near Fort Bliss. Students earn college credits alongside diploma.", url: "", city: "El Paso, TX" },
    { name: "Desert Hills Elementary", grades: "K-5", rating: 3.7, desc: "El Paso ISD elementary near main post with high military family population.", url: "", city: "El Paso, TX" },
  ],
  "Fort Cavazos": [
    { name: "Killeen High School", grades: "9-12", rating: 3.5, desc: "Killeen ISD high school near Fort Cavazos. Large JROTC battalion. Career technical programs.", url: "", city: "Killeen, TX" },
    { name: "Nolan Middle School", grades: "6-8", rating: 3.8, desc: "Killeen ISD middle school with STEM focus. Military family advocate on staff.", url: "", city: "Killeen, TX" },
    { name: "Rancier Elementary", grades: "K-5", rating: 3.9, desc: "High military enrollment near Fort Cavazos. Active PTA with PCS family support.", url: "", city: "Killeen, TX" },
  ],
  "Fort Stewart": [
    { name: "Bradwell Institute", grades: "9-12", rating: 3.6, desc: "Liberty County high school serving Fort Stewart families. JROTC program. Largest school in the county.", url: "", city: "Hinesville, GA" },
    { name: "Joseph Martin Elementary School", grades: "K-5", rating: 3.8, desc: "Liberty County elementary adjacent to Fort Stewart. Strong military family liaison.", url: "", city: "Hinesville, GA" },
    { name: "Snelson-Golden Middle School", grades: "6-8", rating: 3.7, desc: "Liberty County middle school near post. Arts and STEM programs.", url: "", city: "Hinesville, GA" },
  ],
  "Fort Moore": [
    { name: "Benning Hills Elementary (DoDEA)", grades: "K-5", rating: 4.2, desc: "DoDEA on-post elementary serving Fort Moore military families.", url: "", city: "Fort Moore, GA" },
    { name: "Hardaway High School", grades: "9-12", rating: 3.8, desc: "Muscogee County high school near Fort Moore. Strong ROTC and athletics.", url: "", city: "Columbus, GA" },
    { name: "Baker Middle School", grades: "6-8", rating: 3.7, desc: "Muscogee County middle school near post. ROTC prep and sports programs.", url: "", city: "Columbus, GA" },
  ],
  "Fort Eisenhower": [
    { name: "Glenn Hills High School", grades: "9-12", rating: 3.6, desc: "Richmond County high school near Fort Eisenhower. JROTC program. Serves Cyber Center families.", url: "", city: "Augusta, GA" },
    { name: "Spirit Creek Middle School", grades: "6-8", rating: 3.9, desc: "Columbia County middle school near Fort Eisenhower housing. Strong academics.", url: "", city: "Evans, GA" },
    { name: "Langford Middle School", grades: "6-8", rating: 3.7, desc: "Richmond County middle school serving significant military family population.", url: "", city: "Augusta, GA" },
  ],
  "Fort Drum": [
    { name: "Watertown High School", grades: "9-12", rating: 3.8, desc: "Watertown City SD high school 5 miles from Fort Drum. JROTC and career programs.", url: "", city: "Watertown, NY" },
    { name: "Indian River Central School District", grades: "K-12", rating: 3.7, desc: "Major K-12 district for Fort Drum families with military family support programs across multiple schools.", url: "", city: "Philadelphia, NY" },
    { name: "General Brown Central School", grades: "K-12", rating: 3.8, desc: "General Brown CSD serves military families near Fort Drum. Strong community ties and JROTC.", url: "", city: "Dexter, NY" },
  ],
  "Fort Sill": [
    { name: "MacArthur High School", grades: "9-12", rating: 3.7, desc: "Lawton Public Schools high school near Fort Sill. JROTC program and career-tech pathways.", url: "", city: "Lawton, OK" },
    { name: "Eisenhower Middle School", grades: "6-8", rating: 3.8, desc: "Lawton Public Schools middle school serving military families. Strong band program.", url: "", city: "Lawton, OK" },
    { name: "Elgin High School", grades: "9-12", rating: 3.9, desc: "Elgin ISD high school southwest of Fort Sill. Small-town feel, high military enrollment.", url: "", city: "Elgin, OK" },
  ],
  "Fort Riley": [
    { name: "Junction City High School", grades: "9-12", rating: 3.6, desc: "USD 475 high school adjacent to Fort Riley. Large JROTC battalion. Highly diverse military student body.", url: "", city: "Junction City, KS" },
    { name: "Fort Riley Middle School (DoDEA)", grades: "6-8", rating: 4.2, desc: "DoDEA school on post. Strong academics and extracurriculars for military children.", url: "", city: "Fort Riley, KS" },
    { name: "Eisenhower Elementary (USD 475)", grades: "K-5", rating: 3.8, desc: "USD 475 elementary serving Fort Riley families near Junction City.", url: "", city: "Junction City, KS" },
  ],
  "Fort Leavenworth": [
    { name: "Fort Leavenworth Elementary (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA on-post elementary serving CGSC and garrison families.", url: "", city: "Fort Leavenworth, KS" },
    { name: "Leavenworth High School", grades: "9-12", rating: 3.8, desc: "USD 453 high school adjacent to Fort Leavenworth. Strong JROTC and academics.", url: "", city: "Leavenworth, KS" },
    { name: "Mark Twain Elementary (USD 453)", grades: "K-5", rating: 3.8, desc: "USD 453 elementary near Fort Leavenworth. Strong community support for military families.", url: "", city: "Leavenworth, KS" },
  ],
  "Fort Knox": [
    { name: "North Hardin High School", grades: "9-12", rating: 3.9, desc: "Hardin County high school near Fort Knox. Strong academics and athletic programs. JROTC.", url: "", city: "Radcliff, KY" },
    { name: "John Hardin High School", grades: "9-12", rating: 3.7, desc: "Hardin County high school near Fort Knox in Elizabethtown. JROTC and career programs.", url: "", city: "Elizabethtown, KY" },
    { name: "Radcliff Elementary School", grades: "K-5", rating: 3.8, desc: "Hardin County elementary adjacent to Fort Knox. High military family enrollment.", url: "", city: "Radcliff, KY" },
  ],
  "Fort Jackson": [
    { name: "Richland Northeast High School", grades: "9-12", rating: 3.8, desc: "Richland District 2 high school near Fort Jackson. Strong academics and military family support.", url: "", city: "Columbia, SC" },
    { name: "Lake Carolina Elementary", grades: "K-5", rating: 4.1, desc: "Richland District 2 high-performing elementary near Fort Jackson housing. Active PTA.", url: "", city: "Columbia, SC" },
    { name: "Dent Middle School", grades: "6-8", rating: 3.7, desc: "Richland District 1 school near Fort Jackson with high military-family enrollment.", url: "", city: "Columbia, SC" },
  ],
  "Fort Belvoir": [
    { name: "West Potomac High School", grades: "9-12", rating: 4.0, desc: "Fairfax County high school near Fort Belvoir. IB and AP programs. High military family population.", url: "", city: "Alexandria, VA" },
    { name: "Hayfield Secondary School", grades: "7-12", rating: 4.1, desc: "Fairfax County 7-12 school near Fort Belvoir. Strong academics and arts programs.", url: "", city: "Alexandria, VA" },
    { name: "Woodlawn Elementary", grades: "K-6", rating: 3.9, desc: "Fairfax County elementary near Fort Belvoir with military family liaison program.", url: "", city: "Alexandria, VA" },
  ],
  "Fort Meade": [
    { name: "Meade High School", grades: "9-12", rating: 3.9, desc: "Anne Arundel County high school directly adjacent to Fort Meade. Strong JROTC. NSA/military family population.", url: "", city: "Fort Meade, MD" },
    { name: "Meade Middle School", grades: "6-8", rating: 3.8, desc: "Anne Arundel County middle school near Fort Meade. High military family enrollment.", url: "", city: "Fort Meade, MD" },
    { name: "Meade Heights Elementary", grades: "K-5", rating: 3.9, desc: "Anne Arundel County elementary adjacent to Fort Meade. Very high military enrollment.", url: "", city: "Fort Meade, MD" },
  ],
  "Fort George G. Meade": [
    { name: "Meade High School", grades: "9-12", rating: 3.9, desc: "Anne Arundel County high school directly adjacent to Fort Meade. Strong JROTC. NSA/military families.", url: "", city: "Fort Meade, MD" },
    { name: "Meade Middle School", grades: "6-8", rating: 3.8, desc: "Anne Arundel County middle school with high military family enrollment near Fort Meade.", url: "", city: "Fort Meade, MD" },
  ],
  "Schofield Barracks": [
    { name: "Wheeler Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA on-post elementary at Schofield. Serves Army families in Central Oahu.", url: "", city: "Schofield Barracks, HI" },
    { name: "Leilehua High School", grades: "9-12", rating: 3.8, desc: "Hawaii DOE high school adjacent to Schofield Barracks. JROTC program. Strong athletics.", url: "", city: "Wahiawa, HI" },
    { name: "Wahiawa Elementary School", grades: "K-6", rating: 3.7, desc: "Hawaii DOE elementary in Wahiawa near Schofield. High military family enrollment.", url: "", city: "Wahiawa, HI" },
  ],
  "Fort Wainwright": [
    { name: "Lathrop High School", grades: "9-12", rating: 3.7, desc: "Fairbanks North Star Borough high school near Fort Wainwright. JROTC program.", url: "", city: "Fairbanks, AK" },
    { name: "Ryan Middle School", grades: "6-8", rating: 3.8, desc: "Fairbanks North Star Borough middle school. High military family enrollment.", url: "", city: "Fairbanks, AK" },
    { name: "Nordale Elementary School", grades: "K-5", rating: 3.8, desc: "Fairbanks elementary near Fort Wainwright with strong military family community.", url: "", city: "Fairbanks, AK" },
  ],
  "Fort Shafter": [
    { name: "Nimitz Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA school serving Fort Shafter and adjacent JBPHH families.", url: "", city: "Honolulu, HI" },
    { name: "Moanalua High School", grades: "9-12", rating: 4.0, desc: "Hawaii DOE high school near Fort Shafter. Strong academics and JROTC. Large military family population.", url: "", city: "Honolulu, HI" },
    { name: "Moanalua Middle School", grades: "6-8", rating: 3.9, desc: "Hawaii DOE middle school near Fort Shafter. High military family enrollment.", url: "", city: "Honolulu, HI" },
  ],

  // ── NAVY · CONUS ─────────────────────────────────────────────────────────
  "Naval Base San Diego": [
    { name: "Mar Vista High School", grades: "9-12", rating: 3.8, desc: "Sweetwater Union HSD near Naval Base San Diego. NJROTC program. High Navy family enrollment.", url: "", city: "Imperial Beach, CA" },
    { name: "Montgomery Middle School", grades: "6-8", rating: 3.7, desc: "Sweetwater Union district near NB San Diego. Serves naval families in south San Diego.", url: "", city: "San Diego, CA" },
    { name: "Euclid Elementary School", grades: "K-5", rating: 3.8, desc: "San Diego USD elementary near Naval Base San Diego main gate.", url: "", city: "San Diego, CA" },
  ],
  "NAS Jacksonville": [
    { name: "Westside High School", grades: "9-12", rating: 3.7, desc: "Duval County high school near NAS Jacksonville. NJROTC program. High Navy family enrollment.", url: "", city: "Jacksonville, FL" },
    { name: "Ortega Elementary School", grades: "K-5", rating: 3.9, desc: "Duval County elementary adjacent to NAS Jacksonville. High military family population.", url: "", city: "Jacksonville, FL" },
    { name: "Lake Shore Middle School", grades: "6-8", rating: 3.8, desc: "Duval County middle school near NAS Jacksonville with military family liaison program.", url: "", city: "Jacksonville, FL" },
  ],
  "Naval Station Mayport": [
    { name: "Fletcher High School", grades: "9-12", rating: 3.9, desc: "Duval County high school near Naval Station Mayport. Strong NJROTC and athletics.", url: "", city: "Jacksonville Beach, FL" },
    { name: "Mayport Middle School", grades: "6-8", rating: 3.7, desc: "Duval County middle school adjacent to Naval Station Mayport. High Navy family enrollment.", url: "", city: "Atlantic Beach, FL" },
    { name: "Mayport Elementary School", grades: "K-5", rating: 3.8, desc: "Duval County elementary directly adjacent to Naval Station Mayport main gate.", url: "", city: "Mayport, FL" },
  ],
  "NAS Pensacola": [
    { name: "Pensacola High School", grades: "9-12", rating: 3.8, desc: "Escambia County high school near NAS Pensacola. NJROTC program. Strong aviation and STEM focus.", url: "", city: "Pensacola, FL" },
    { name: "Warrington Middle School", grades: "6-8", rating: 3.7, desc: "Escambia County middle school near NAS Pensacola. Military family liaison on staff.", url: "", city: "Pensacola, FL" },
    { name: "Warrington Elementary School", grades: "K-5", rating: 3.8, desc: "Escambia County elementary adjacent to NAS Pensacola. Very high military family enrollment.", url: "", city: "Pensacola, FL" },
  ],
  "Naval Base Kitsap": [
    { name: "Olympic High School", grades: "9-12", rating: 3.9, desc: "Bremerton School District high school near Naval Base Kitsap. NJROTC program.", url: "", city: "Bremerton, WA" },
    { name: "Bremerton High School", grades: "9-12", rating: 3.7, desc: "Bremerton School District near Puget Sound Naval Shipyard and NB Kitsap. Strong JROTC.", url: "", city: "Bremerton, WA" },
    { name: "Mountain View Middle School", grades: "6-8", rating: 3.8, desc: "Central Kitsap SD middle school near NB Kitsap Bangor gate. High Navy family enrollment.", url: "", city: "Bremerton, WA" },
  ],
  "Naval Station Great Lakes": [
    { name: "Zion-Benton Township High School", grades: "9-12", rating: 3.6, desc: "Zion-Benton THSD near Naval Station Great Lakes. Serves Navy training command families.", url: "", city: "Zion, IL" },
    { name: "Waukegan High School", grades: "9-12", rating: 3.5, desc: "Waukegan CUSD school near NS Great Lakes. JROTC program. High military enrollment.", url: "", city: "Waukegan, IL" },
    { name: "Newport Elementary School (Gurnee SD 56)", grades: "K-8", rating: 3.9, desc: "Lake County district school near NS Great Lakes serving many Navy training families.", url: "", city: "Gurnee, IL" },
  ],

  // ── MARINE CORPS · CONUS ─────────────────────────────────────────────────
  "Camp Pendleton": [
    { name: "Stuart Mesa Elementary (DoDEA)", grades: "K-5", rating: 4.2, desc: "DoDEA on-post elementary serving Camp Pendleton Marine families.", url: "", city: "Camp Pendleton, CA" },
    { name: "Oceanside High School", grades: "9-12", rating: 3.7, desc: "Oceanside USD high school adjacent to Camp Pendleton. MCJROTC. Very high military enrollment.", url: "", city: "Oceanside, CA" },
    { name: "Fallbrook High School", grades: "9-12", rating: 3.8, desc: "Fallbrook UHSD north of Camp Pendleton. Many Marine families. Strong community and athletics.", url: "", city: "Fallbrook, CA" },
  ],
  "MCB Quantico": [
    { name: "Quantico Middle/High School (DoDEA)", grades: "6-12", rating: 4.3, desc: "DoDEA on-post school at MCB Quantico. AP courses, strong athletics, serves FBI/USMC families.", url: "", city: "Quantico, VA" },
    { name: "Fuller Elementary School (DoDEA)", grades: "K-5", rating: 4.2, desc: "DoDEA elementary on post at MCB Quantico. Serves Marine and federal law enforcement families.", url: "", city: "Quantico, VA" },
    { name: "Mountain View High School", grades: "9-12", rating: 3.9, desc: "Prince William County high school near Quantico. Strong academics and JROTC.", url: "", city: "Stafford, VA" },
  ],
  "Marine Corps Base Quantico": [
    { name: "Quantico Middle/High School (DoDEA)", grades: "6-12", rating: 4.3, desc: "DoDEA on-post school at MCB Quantico. AP courses and strong athletics. Serves FBI/USMC families.", url: "", city: "Quantico, VA" },
    { name: "Fuller Elementary School (DoDEA)", grades: "K-5", rating: 4.2, desc: "DoDEA elementary on post. Serves Marine and federal law enforcement families.", url: "", city: "Quantico, VA" },
  ],
  "MCAS Cherry Point": [
    { name: "Havelock High School", grades: "9-12", rating: 3.8, desc: "Craven County high school adjacent to MCAS Cherry Point. High Marine family enrollment.", url: "", city: "Havelock, NC" },
    { name: "Havelock Elementary School", grades: "K-5", rating: 3.8, desc: "Craven County elementary near MCAS Cherry Point main gate. Strong military family community.", url: "", city: "Havelock, NC" },
    { name: "West Craven High School", grades: "9-12", rating: 3.7, desc: "Craven County high school near MCAS Cherry Point. MCJROTC program.", url: "", city: "Vanceboro, NC" },
  ],
  "MCAS Miramar": [
    { name: "Mira Mesa High School", grades: "9-12", rating: 3.9, desc: "San Diego USD school adjacent to MCAS Miramar. MCJROTC program. Very high military family population.", url: "", city: "San Diego, CA" },
    { name: "Scripps Ranch High School", grades: "9-12", rating: 4.2, desc: "San Diego USD high school near MCAS Miramar. IB program, strong academics and athletics.", url: "", city: "San Diego, CA" },
    { name: "Challenger Middle School", grades: "6-8", rating: 4.0, desc: "San Diego USD middle school near MCAS Miramar. Strong STEM focus.", url: "", city: "San Diego, CA" },
  ],

  // ── AIR FORCE · CONUS ────────────────────────────────────────────────────
  "Joint Base Andrews": [
    { name: "Surrattsville High School", grades: "9-12", rating: 3.7, desc: "Prince George's County high school near JB Andrews. AFJROTC program.", url: "", city: "Clinton, MD" },
    { name: "Friendly High School", grades: "9-12", rating: 3.8, desc: "Prince George's County high school near JB Andrews. Strong arts and career-tech programs.", url: "", city: "Fort Washington, MD" },
    { name: "Glassmanor Elementary School", grades: "K-5", rating: 3.7, desc: "Prince George's County elementary near JB Andrews housing areas.", url: "", city: "Oxon Hill, MD" },
  ],
  "Joint Base Charleston": [
    { name: "Stratford High School", grades: "9-12", rating: 3.9, desc: "Berkeley County high school near JB Charleston. AFJROTC program. High Air Force family enrollment.", url: "", city: "Goose Creek, SC" },
    { name: "Goose Creek High School", grades: "9-12", rating: 3.8, desc: "Berkeley County high school serving JB Charleston families. Strong athletics.", url: "", city: "Goose Creek, SC" },
    { name: "Bowens Corner Elementary", grades: "K-5", rating: 3.9, desc: "Berkeley County elementary near JB Charleston with high military family enrollment.", url: "", city: "Hanahan, SC" },
  ],
  "Joint Base McGuire-Dix-Lakehurst": [
    { name: "Northern Burlington County Regional High School", grades: "9-12", rating: 3.9, desc: "Burlington County high school serving JB MDL families. AFJROTC program.", url: "", city: "Columbus, NJ" },
    { name: "Wrightstown Elementary School", grades: "K-5", rating: 3.8, desc: "New Hanover Township elementary near JB MDL. Very high military family enrollment.", url: "", city: "Wrightstown, NJ" },
    { name: "New Egypt High School", grades: "9-12", rating: 3.8, desc: "Plumsted Township high school near the Lakehurst portion of JB MDL.", url: "", city: "New Egypt, NJ" },
  ],
  "Joint Base Pearl Harbor-Hickam": [
    { name: "Hickam Elementary School (DoDEA)", grades: "K-5", rating: 4.4, desc: "DoDEA on-post elementary at JBPHH Hickam side. Serves Air Force and Navy families.", url: "", city: "Honolulu, HI" },
    { name: "Nimitz Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA school on Pearl Harbor side serving Navy families at JBPHH.", url: "", city: "Honolulu, HI" },
    { name: "Moanalua High School", grades: "9-12", rating: 4.0, desc: "Hawaii DOE high school adjacent to JBPHH. Strong academics and JROTC. High military enrollment.", url: "", city: "Honolulu, HI" },
  ],
  "Joint Base Elmendorf-Richardson": [
    { name: "Elmendorf Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA on-post elementary at JBER. Serves Air Force families on the Elmendorf side.", url: "", city: "JBER, AK" },
    { name: "Eagle River High School", grades: "9-12", rating: 4.0, desc: "Anchorage School District high school near JBER. Strong outdoor education and JROTC.", url: "", city: "Eagle River, AK" },
    { name: "Chugiak High School", grades: "9-12", rating: 3.9, desc: "Anchorage School District high school. Many JBER military families. Close community feel.", url: "", city: "Chugiak, AK" },
  ],
  "Eglin AFB": [
    { name: "Niceville High School", grades: "9-12", rating: 4.2, desc: "Okaloosa County high school adjacent to Eglin AFB. Strong AP program and AFJROTC. Very high military enrollment.", url: "", city: "Niceville, FL" },
    { name: "Lewis Middle School", grades: "6-8", rating: 4.0, desc: "Okaloosa County middle school near Eglin AFB. High military family enrollment and strong academics.", url: "", city: "Niceville, FL" },
    { name: "Plew Elementary School", grades: "K-5", rating: 4.1, desc: "Okaloosa County elementary near Eglin main gate. Excellent military family support.", url: "", city: "Niceville, FL" },
  ],
  "MacDill AFB": [
    { name: "Robinson High School", grades: "9-12", rating: 3.8, desc: "Hillsborough County high school near MacDill AFB. AFJROTC. CENTCOM/SOCOM family community.", url: "", city: "Tampa, FL" },
    { name: "Dale Mabry Elementary School", grades: "K-5", rating: 4.0, desc: "Hillsborough County elementary near MacDill AFB. High military family enrollment.", url: "", city: "Tampa, FL" },
    { name: "Monroe Middle School", grades: "6-8", rating: 3.9, desc: "Hillsborough County middle school near MacDill. Serves Bayshore and military communities.", url: "", city: "Tampa, FL" },
  ],
  "Travis AFB": [
    { name: "Vanden High School", grades: "9-12", rating: 3.8, desc: "Travis USD high school adjacent to Travis AFB. Large military enrollment. Strong athletics.", url: "", city: "Fairfield, CA" },
    { name: "Vacaville High School", grades: "9-12", rating: 3.9, desc: "Vacaville USD high school near Travis AFB. AFJROTC program. Strong military family support.", url: "", city: "Vacaville, CA" },
    { name: "Scandia Elementary School", grades: "K-5", rating: 3.9, desc: "Travis USD elementary adjacent to Travis AFB housing. Very high military family enrollment.", url: "", city: "Fairfield, CA" },
  ],
  "Wright-Patterson AFB": [
    { name: "Wright Brothers Elementary (DoDEA)", grades: "K-5", rating: 4.2, desc: "DoDEA on-post elementary at Wright-Patterson AFB. STEM-enriched curriculum.", url: "", city: "Wright-Patterson AFB, OH" },
    { name: "Fairborn High School", grades: "9-12", rating: 3.8, desc: "Fairborn City Schools near WPAFB. AFJROTC. High military and defense-research family enrollment.", url: "", city: "Fairborn, OH" },
    { name: "Fairborn Baker Middle School", grades: "6-8", rating: 3.8, desc: "Fairborn City middle school near WPAFB. Strong STEM emphasis.", url: "", city: "Fairborn, OH" },
  ],
  "Scott AFB": [
    { name: "Mascoutah High School", grades: "9-12", rating: 4.0, desc: "Mascoutah CUSD high school adjacent to Scott AFB. AFJROTC. Very high military family enrollment.", url: "", city: "Mascoutah, IL" },
    { name: "Mascoutah Middle School", grades: "6-8", rating: 3.9, desc: "Mascoutah CUSD middle school near Scott AFB. Military family support programs.", url: "", city: "Mascoutah, IL" },
    { name: "Mascoutah Elementary School", grades: "K-5", rating: 4.0, desc: "Mascoutah CUSD elementary near Scott AFB main gate. Strong military family community.", url: "", city: "Mascoutah, IL" },
  ],
  "Offutt AFB": [
    { name: "Bellevue West High School", grades: "9-12", rating: 4.1, desc: "Bellevue Public Schools high school near Offutt AFB. AFJROTC program. Strong academics.", url: "", city: "Bellevue, NE" },
    { name: "Bellevue East High School", grades: "9-12", rating: 4.0, desc: "Bellevue Public Schools near Offutt AFB. Good military family support and community involvement.", url: "", city: "Bellevue, NE" },
    { name: "Mission Middle School", grades: "6-8", rating: 3.9, desc: "Bellevue Public Schools middle school near Offutt AFB. High military family population.", url: "", city: "Bellevue, NE" },
  ],
  "Barksdale AFB": [
    { name: "Parkway High School", grades: "9-12", rating: 3.9, desc: "Bossier Parish high school serving Barksdale AFB families. Strong athletics and academics.", url: "", city: "Bossier City, LA" },
    { name: "Bossier High School", grades: "9-12", rating: 3.7, desc: "Bossier Parish high school near Barksdale AFB. AFJROTC program. High Air Force family enrollment.", url: "", city: "Bossier City, LA" },
    { name: "Cope Middle School", grades: "6-8", rating: 3.8, desc: "Bossier Parish middle school near Barksdale AFB. Military family support programs.", url: "", city: "Bossier City, LA" },
  ],
  "Minot AFB": [
    { name: "Minot High School", grades: "9-12", rating: 3.8, desc: "Minot Public Schools high school near Minot AFB. AFJROTC program. Serves ICBM and B-52 wing families.", url: "", city: "Minot, ND" },
    { name: "Jim Hill Middle School", grades: "6-8", rating: 3.7, desc: "Minot Public Schools middle school serving nuclear deterrence mission families.", url: "", city: "Minot, ND" },
    { name: "Erik Ramstad Middle School", grades: "6-8", rating: 3.8, desc: "Minot Public Schools middle school near Minot AFB housing areas.", url: "", city: "Minot, ND" },
  ],
  "Hill AFB": [
    { name: "Layton High School", grades: "9-12", rating: 4.0, desc: "Davis School District high school near Hill AFB. AP programs and AFJROTC. Strong community.", url: "", city: "Layton, UT" },
    { name: "Northridge High School", grades: "9-12", rating: 3.9, desc: "Weber School District high school adjacent to Hill AFB. Strong AFJROTC and career-tech.", url: "", city: "Layton, UT" },
    { name: "Sand Springs Elementary School", grades: "K-5", rating: 4.0, desc: "Davis SD elementary near Hill AFB housing. Very high military family enrollment.", url: "", city: "Layton, UT" },
  ],
  "Dyess AFB": [
    { name: "Abilene High School", grades: "9-12", rating: 3.7, desc: "Abilene ISD high school near Dyess AFB. AFJROTC program. Serves B-1 wing families.", url: "", city: "Abilene, TX" },
    { name: "Cooper High School", grades: "9-12", rating: 3.7, desc: "Abilene ISD high school serving Dyess AFB families. Strong athletics.", url: "", city: "Abilene, TX" },
    { name: "Bassetti Elementary School", grades: "K-5", rating: 3.8, desc: "Abilene ISD elementary near Dyess AFB housing. Military family support programs.", url: "", city: "Abilene, TX" },
  ],
  "Moody AFB": [
    { name: "Lowndes High School", grades: "9-12", rating: 3.9, desc: "Lowndes County high school near Moody AFB. AFJROTC program. Strong athletics and academics.", url: "", city: "Valdosta, GA" },
    { name: "Valdosta High School", grades: "9-12", rating: 3.7, desc: "Valdosta City school near Moody AFB. Large JROTC presence. Serves A-10/F-16 wing families.", url: "", city: "Valdosta, GA" },
    { name: "Lake Park Elementary School", grades: "K-5", rating: 3.8, desc: "Lowndes County elementary near Moody AFB housing. Military family community.", url: "", city: "Lake Park, GA" },
  ],
  "Shaw AFB": [
    { name: "Lakewood High School", grades: "9-12", rating: 3.7, desc: "Sumter School District high school near Shaw AFB. AFJROTC program. High military family enrollment.", url: "", city: "Sumter, SC" },
    { name: "Sumter High School", grades: "9-12", rating: 3.7, desc: "Sumter School District flagship high school. Serves Shaw AFB families. JROTC and career-tech.", url: "", city: "Sumter, SC" },
    { name: "Willow Drive Elementary School", grades: "K-5", rating: 3.8, desc: "Sumter School District elementary near Shaw AFB. Strong military family community.", url: "", city: "Sumter, SC" },
  ],
  "Keesler AFB": [
    { name: "Biloxi High School", grades: "9-12", rating: 3.8, desc: "Biloxi Public Schools high school near Keesler AFB. AFJROTC. High training command family enrollment.", url: "", city: "Biloxi, MS" },
    { name: "Biloxi Junior High School", grades: "7-8", rating: 3.8, desc: "Biloxi Public Schools near Keesler. Military family liaison on staff.", url: "", city: "Biloxi, MS" },
    { name: "Nichols Elementary School", grades: "K-6", rating: 3.9, desc: "Biloxi Public Schools elementary near Keesler AFB housing. High military enrollment.", url: "", city: "Biloxi, MS" },
  ],
  "Nellis AFB": [
    { name: "Cheyenne High School", grades: "9-12", rating: 3.7, desc: "Clark County SD high school near Nellis AFB. AFJROTC program. Serves fighter wing families.", url: "", city: "North Las Vegas, NV" },
    { name: "Mojave High School", grades: "9-12", rating: 3.6, desc: "Clark County SD school north of Las Vegas near Nellis. High military family enrollment.", url: "", city: "North Las Vegas, NV" },
    { name: "Richard C. Bryan Elementary", grades: "K-5", rating: 3.7, desc: "Clark County SD elementary near Nellis AFB housing areas.", url: "", city: "Las Vegas, NV" },
  ],
  "Luke AFB": [
    { name: "Millennium High School", grades: "9-12", rating: 4.0, desc: "Agua Fria UHSD near Luke AFB. Strong academics and AFJROTC. High F-35 wing family enrollment.", url: "", city: "Goodyear, AZ" },
    { name: "Dysart High School", grades: "9-12", rating: 3.7, desc: "Dysart USD high school adjacent to Luke AFB. Military family support programs.", url: "", city: "El Mirage, AZ" },
    { name: "Canyon View Elementary School", grades: "K-8", rating: 3.8, desc: "Litchfield ESD near Luke AFB housing. High military family enrollment.", url: "", city: "Litchfield Park, AZ" },
  ],
  "Davis-Monthan AFB": [
    { name: "Rincon/University High School", grades: "9-12", rating: 4.0, desc: "Tucson USD magnet high school near Davis-Monthan AFB. Strong academics and AFJROTC.", url: "", city: "Tucson, AZ" },
    { name: "Booth-Fickett K-8 School", grades: "K-8", rating: 3.8, desc: "Tucson USD school near Davis-Monthan AFB. High A-10/RC-135 wing family enrollment.", url: "", city: "Tucson, AZ" },
    { name: "Gridley Middle School", grades: "6-8", rating: 3.7, desc: "Sunnyside USD school near D-M AFB housing. Serves military and local families.", url: "", city: "Tucson, AZ" },
  ],
  "Seymour Johnson AFB": [
    { name: "Eastern Wayne High School", grades: "9-12", rating: 3.7, desc: "Wayne County high school near Seymour Johnson AFB. AFJROTC. Serves F-15E wing families.", url: "", city: "Goldsboro, NC" },
    { name: "Goldsboro High School", grades: "9-12", rating: 3.6, desc: "Wayne County high school near Seymour Johnson AFB. JROTC and career-tech programs.", url: "", city: "Goldsboro, NC" },
    { name: "Meadow Lane Elementary School", grades: "K-5", rating: 3.8, desc: "Wayne County elementary near Seymour Johnson AFB housing areas.", url: "", city: "Goldsboro, NC" },
  ],
  "Fairchild AFB": [
    { name: "Cheney High School", grades: "9-12", rating: 3.9, desc: "Cheney School District high school near Fairchild AFB. AFJROTC. Serves KC-46 tanker wing families.", url: "", city: "Cheney, WA" },
    { name: "Freeman High School", grades: "9-12", rating: 4.0, desc: "Freeman SD high school near Fairchild AFB. Small community, high academic achievement.", url: "", city: "Rockford, WA" },
    { name: "Fairchild Elementary School", grades: "K-6", rating: 3.9, desc: "Cheney SD elementary near Fairchild AFB. High Air Force family enrollment.", url: "", city: "Fairchild AFB, WA" },
  ],
  "Malmstrom AFB": [
    { name: "C.M. Russell High School", grades: "9-12", rating: 3.8, desc: "Great Falls Public Schools near Malmstrom AFB. AFJROTC. Serves ICBM wing families.", url: "", city: "Great Falls, MT" },
    { name: "Great Falls High School", grades: "9-12", rating: 3.8, desc: "Great Falls Public Schools flagship high school. High military family enrollment.", url: "", city: "Great Falls, MT" },
    { name: "Lincoln Elementary School", grades: "K-5", rating: 3.8, desc: "Great Falls SD elementary near Malmstrom AFB housing. Military family community.", url: "", city: "Great Falls, MT" },
  ],
  "Ellsworth AFB": [
    { name: "Douglas High School", grades: "9-12", rating: 3.8, desc: "Douglas SD near Ellsworth AFB. AFJROTC. Serves B-1 bomber wing families.", url: "", city: "Box Elder, SD" },
    { name: "Rapid City Stevens High School", grades: "9-12", rating: 4.0, desc: "Rapid City Area Schools high school. Many Ellsworth families. Strong academics.", url: "", city: "Rapid City, SD" },
    { name: "Grandview Elementary School", grades: "K-5", rating: 3.9, desc: "Douglas SD elementary near Ellsworth AFB. Very high military family enrollment.", url: "", city: "Box Elder, SD" },
  ],
  "McConnell AFB": [
    { name: "Andover High School", grades: "9-12", rating: 4.1, desc: "Andover USD 385 high school near McConnell AFB. Strong AFJROTC and academics.", url: "", city: "Andover, KS" },
    { name: "Andover Central High School", grades: "9-12", rating: 4.0, desc: "Andover USD 385 second high school near McConnell AFB. Strong athletic and academic programs.", url: "", city: "Andover, KS" },
    { name: "Prairie Creek Elementary (USD 385)", grades: "K-5", rating: 4.0, desc: "Andover USD elementary near McConnell AFB housing. High Air Force family enrollment.", url: "", city: "Andover, KS" },
  ],
  "Hurlburt Field": [
    { name: "Fort Walton Beach High School", grades: "9-12", rating: 3.9, desc: "Okaloosa County high school near Hurlburt Field. AFJROTC. High Special Operations Command family enrollment.", url: "", city: "Fort Walton Beach, FL" },
    { name: "Pryor Middle School", grades: "6-8", rating: 3.9, desc: "Okaloosa County middle school near Hurlburt Field. Military family support programs.", url: "", city: "Fort Walton Beach, FL" },
    { name: "Florosa Elementary School", grades: "K-5", rating: 4.0, desc: "Okaloosa County elementary adjacent to Hurlburt Field. Very high SOF military family enrollment.", url: "", city: "Mary Esther, FL" },
  ],
  "Little Rock AFB": [
    { name: "Cabot High School", grades: "9-12", rating: 4.0, desc: "Cabot School District near Little Rock AFB. AFJROTC. Serves C-130J wing families.", url: "", city: "Cabot, AR" },
    { name: "Jacksonville High School", grades: "9-12", rating: 3.7, desc: "Pulaski County Special SD near Little Rock AFB main gate. High Air Force family enrollment.", url: "", city: "Jacksonville, AR" },
    { name: "Tolleson Elementary School", grades: "K-5", rating: 3.8, desc: "Jacksonville Levy Special SD elementary adjacent to Little Rock AFB housing.", url: "", city: "Jacksonville, AR" },
  ],
  "Vandenberg SFB": [
    { name: "Lompoc High School", grades: "9-12", rating: 3.7, desc: "Lompoc USD high school near Vandenberg SFB. AFJROTC. Serves Space Force launch wing families.", url: "", city: "Lompoc, CA" },
    { name: "Cabrillo High School", grades: "9-12", rating: 3.6, desc: "Lompoc USD high school near Vandenberg SFB. High Space Force family enrollment.", url: "", city: "Lompoc, CA" },
    { name: "Buena Vista Elementary School", grades: "K-5", rating: 3.8, desc: "Lompoc USD elementary near Vandenberg SFB housing. Military family community.", url: "", city: "Lompoc, CA" },
  ],
  "Peterson SFB": [
    { name: "Widefield High School", grades: "9-12", rating: 3.8, desc: "Widefield SD near Peterson SFB. AFJROTC. Serves NORAD/Space Command families.", url: "", city: "Colorado Springs, CO" },
    { name: "Harrison High School", grades: "9-12", rating: 3.7, desc: "Harrison D-2 high school near Peterson SFB. High military family enrollment.", url: "", city: "Colorado Springs, CO" },
    { name: "Pioneer Elementary School (Widefield)", grades: "K-5", rating: 3.9, desc: "Widefield SD elementary near Peterson SFB housing areas.", url: "", city: "Colorado Springs, CO" },
  ],
  "Schriever SFB": [
    { name: "Falcon High School", grades: "9-12", rating: 4.0, desc: "Falcon SD near Schriever SFB. Strong AP and AFJROTC. Many Space Force families choose Falcon SD.", url: "", city: "Falcon, CO" },
    { name: "Ellicott High School", grades: "9-12", rating: 3.7, desc: "Ellicott SD near Schriever SFB. Serves Space Force families on the plains east of Colorado Springs.", url: "", city: "Ellicott, CO" },
    { name: "Woodmen Hills Elementary (Falcon SD)", grades: "K-5", rating: 4.0, desc: "Falcon SD elementary near Schriever SFB communities. High military family enrollment.", url: "", city: "Falcon, CO" },
  ],
  "Buckley SFB": [
    { name: "Rangeview High School", grades: "9-12", rating: 3.8, desc: "Cherry Creek SD high school near Buckley SFB. AFJROTC. Serves Space Force families in Aurora.", url: "", city: "Aurora, CO" },
    { name: "Eaglecrest High School", grades: "9-12", rating: 4.0, desc: "Cherry Creek SD high school near Buckley SFB. Strong academics and career-tech.", url: "", city: "Aurora, CO" },
    { name: "Jewell Elementary School (APS)", grades: "K-5", rating: 3.9, desc: "Aurora Public Schools elementary near Buckley SFB housing areas.", url: "", city: "Aurora, CO" },
  ],

  // ── OCONUS ───────────────────────────────────────────────────────────────
  "Ramstein AB": [
    { name: "Ramstein High School (DoDEA)", grades: "9-12", rating: 4.4, desc: "DoDEA school in the Kaiserslautern Military Community. AP courses, sports, vibrant student life. College prep focused.", url: "", city: "Ramstein, Germany" },
    { name: "Ramstein Middle School (DoDEA)", grades: "6-8", rating: 4.3, desc: "DoDEA school on post serving Air Force families in KMC. Strong academics and extracurriculars.", url: "", city: "Ramstein, Germany" },
    { name: "Ramstein Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA elementary at Ramstein AB. Fully accredited. Excellent support for PCS transition families.", url: "", city: "Ramstein, Germany" },
  ],
  "Yokota AB": [
    { name: "Yokota High School (DoDEA)", grades: "9-12", rating: 4.4, desc: "DoDEA school at Yokota AB. AP courses and active athletics. Well-resourced campus for PACAF families.", url: "", city: "Fussa, Japan" },
    { name: "Yokota Middle School (DoDEA)", grades: "6-8", rating: 4.3, desc: "DoDEA school on Yokota AB. Serves Pacific Air Forces families west of Tokyo. Strong STEM.", url: "", city: "Fussa, Japan" },
    { name: "Yokota East Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA elementary at Yokota AB. Accredited and military family focused.", url: "", city: "Fussa, Japan" },
  ],
  "Kadena AB": [
    { name: "Kadena High School (DoDEA)", grades: "9-12", rating: 4.4, desc: "DoDEA school in Okinawa. AP courses, athletic programs, cultural exchange opportunities.", url: "", city: "Kadena, Okinawa, Japan" },
    { name: "Kadena Middle School (DoDEA)", grades: "6-8", rating: 4.3, desc: "DoDEA school on Kadena AB. Serves Pacific Air Forces families. Strong programs and community.", url: "", city: "Kadena, Okinawa, Japan" },
    { name: "Bob Hope Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA elementary at Kadena AB. Fully accredited. Strong family support for PCS transitions.", url: "", city: "Kadena, Okinawa, Japan" },
  ],
  "Osan AB": [
    { name: "Osan High School (DoDEA)", grades: "9-12", rating: 4.2, desc: "DoDEA school at Osan AB. AP courses available. Small school environment serving F-16 wing families.", url: "", city: "Osan, South Korea" },
    { name: "Osan Middle School (DoDEA)", grades: "6-8", rating: 4.2, desc: "DoDEA school on Osan AB. Smaller campus, tight-knit community serving PACAF Korea families.", url: "", city: "Osan, South Korea" },
    { name: "Osan Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA elementary at Osan AB. Accredited and well-supported military family school.", url: "", city: "Osan, South Korea" },
  ],
  "Misawa AB": [
    { name: "Misawa High School (DoDEA)", grades: "9-12", rating: 4.2, desc: "DoDEA school at Misawa AB. AP courses and strong athletics. Smaller student body with close community ties.", url: "", city: "Misawa, Japan" },
    { name: "Misawa Middle School (DoDEA)", grades: "6-8", rating: 4.2, desc: "DoDEA school at Misawa AB, northern Japan. Serves F-16/P-8 wing families. Small, tight-knit campus.", url: "", city: "Misawa, Japan" },
    { name: "Sollars Elementary School (DoDEA)", grades: "K-5", rating: 4.3, desc: "DoDEA elementary at Misawa AB. Fully accredited. Strong support for military family PCS transitions.", url: "", city: "Misawa, Japan" },
  ],
  "USAG Stuttgart": [
    { name: "Stuttgart High School (DoDEA)", grades: "9-12", rating: 4.7, desc: "DoDEA Europe HS in Böblingen. AP, IB, JROTC, athletics. Frequently ranked among DoDEA top performers.", url: "", city: "Böblingen, Germany" },
    { name: "Patch Elementary School (DoDEA)", grades: "K-5", rating: 4.6, desc: "On-post DoDEA elementary at Patch Barracks. Strong academic services and special education support.", url: "", city: "Stuttgart, Germany" },
    { name: "Böblingen Elementary / Middle School (DoDEA)", grades: "K-8", rating: 4.5, desc: "DoDEA school serving Stuttgart military community. Many State Department and contractor families also enrolled.", url: "", city: "Böblingen, Germany" },
  ],
  "USAG Wiesbaden": [
    { name: "Wiesbaden High School (DoDEA)", grades: "9-12", rating: 4.6, desc: "DoDEA Europe HS at Wiesbaden Army Garrison. Strong academics, IB programme, robust sports and arts.", url: "", city: "Wiesbaden, Germany" },
    { name: "Hainerberg Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at Hainerberg Housing Area. Highly rated; strong PCS transition support.", url: "", city: "Wiesbaden, Germany" },
    { name: "Aukamm Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at Aukamm Housing Area. Smaller campus, tight-knit community.", url: "", city: "Wiesbaden, Germany" },
  ],
  "USAG Bavaria": [
    { name: "Vilseck High School (DoDEA)", grades: "9-12", rating: 4.4, desc: "DoDEA HS serving Vilseck/Grafenwoehr community. Rural Bavarian setting.", url: "", city: "Vilseck, Germany" },
    { name: "Grafenwoehr Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at Grafenwoehr. Strong DoDEA standards.", url: "", city: "Grafenwoehr, Germany" },
  ],
  "USAG Italy": [
    { name: "Vicenza High School (DoDEA)", grades: "9-12", rating: 4.6, desc: "DoDEA Europe HS at Del Din. Italian-American cultural exchange opportunities. Strong academics.", url: "", city: "Vicenza, Italy" },
    { name: "Vicenza Middle School (DoDEA)", grades: "6-8", rating: 4.5, desc: "DoDEA middle school at Vicenza. Solid academics, AVID program for college prep.", url: "", city: "Vicenza, Italy" },
    { name: "Del Din Elementary (DoDEA)", grades: "K-5", rating: 4.6, desc: "DoDEA elementary at Caserma Del Din. Excellent transition support for PCS families.", url: "", city: "Vicenza, Italy" },
  ],
  "USAG Humphreys": [
    { name: "Humphreys High School (DoDEA)", grades: "9-12", rating: 4.6, desc: "DoDEA Pacific HS at Camp Humphreys. AP courses, dual enrollment, strong athletics.", url: "", city: "Pyeongtaek, South Korea" },
    { name: "Humphreys Middle School (DoDEA)", grades: "6-8", rating: 4.4, desc: "DoDEA MS at Camp Humphreys. Newer facilities; rapidly growing student body.", url: "", city: "Pyeongtaek, South Korea" },
    { name: "Humphreys Central Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at Camp Humphreys. Strong support for transient military families.", url: "", city: "Pyeongtaek, South Korea" },
  ],
  "USAG Daegu": [
    { name: "Daegu American High School (DoDEA)", grades: "9-12", rating: 4.4, desc: "DoDEA HS serving Daegu enclave. Smaller community campus.", url: "", city: "Daegu, South Korea" },
    { name: "Daegu Elementary (DoDEA)", grades: "K-5", rating: 4.4, desc: "DoDEA elementary at Camp Walker. Strong family services.", url: "", city: "Daegu, South Korea" },
  ],
  "NAS Whidbey Island": [
    { name: "Oak Harbor High School", grades: "9-12", rating: 4.2, desc: "Oak Harbor SD high school with strong military family services. Variety of CTE and AP options.", url: "", city: "Oak Harbor, WA" },
    { name: "North Whidbey Middle School", grades: "6-8", rating: 4.1, desc: "Oak Harbor SD middle school with active military family liaison. Music and athletics programs.", url: "", city: "Oak Harbor, WA" },
    { name: "Crescent Harbor Elementary", grades: "K-5", rating: 4.3, desc: "Oak Harbor SD elementary serving NAS Whidbey families. Strong parent involvement.", url: "", city: "Oak Harbor, WA" },
  ],
  "NS Bremerton": [
    { name: "Central Kitsap High School", grades: "9-12", rating: 4.3, desc: "Central Kitsap SD school serving NS Bremerton/Bangor families. Strong AP and AVID programs.", url: "", city: "Silverdale, WA" },
    { name: "Bremerton High School", grades: "9-12", rating: 3.9, desc: "Bremerton SD high school with active military family services.", url: "", city: "Bremerton, WA" },
    { name: "Brownsville Elementary", grades: "K-5", rating: 4.3, desc: "Central Kitsap SD elementary with high military enrollment. Strong PCS transition support.", url: "", city: "Bremerton, WA" },
  ],
  "NAS North Island": [
    { name: "Coronado High School", grades: "9-12", rating: 4.7, desc: "Coronado USD high school. Highly rated; substantial military family enrollment.", url: "", city: "Coronado, CA" },
    { name: "Coronado Middle School", grades: "6-8", rating: 4.6, desc: "Coronado USD middle school. Strong academics with island community feel.", url: "", city: "Coronado, CA" },
    { name: "Silver Strand Elementary", grades: "K-5", rating: 4.5, desc: "Coronado USD elementary on the Silver Strand. Many Navy families.", url: "", city: "Coronado, CA" },
  ],
  "NS San Diego": [
    { name: "Hilltop High School", grades: "9-12", rating: 4.2, desc: "Sweetwater UHSD school serving Chula Vista military families. Strong CTE programs.", url: "", city: "Chula Vista, CA" },
    { name: "Chula Vista Middle School", grades: "6-8", rating: 4.0, desc: "Chula Vista Elementary district school. Active military family liaison.", url: "", city: "Chula Vista, CA" },
    { name: "Loma Verde Elementary", grades: "K-5", rating: 4.3, desc: "Chula Vista Elementary district school. High military enrollment.", url: "", city: "Chula Vista, CA" },
  ],
  "NAS Lemoore": [
    { name: "Lemoore High School", grades: "9-12", rating: 4.0, desc: "Lemoore UHSD school with strong military family services. Active JROTC and athletics.", url: "", city: "Lemoore, CA" },
    { name: "Lemoore Middle School", grades: "6-8", rating: 3.9, desc: "Lemoore Union Elementary district MS. Military family liaison on staff.", url: "", city: "Lemoore, CA" },
  ],
  "NS Everett": [
    { name: "Cascade High School", grades: "9-12", rating: 4.3, desc: "Everett SD high school. Strong AP and arts programs. Military family liaison.", url: "", city: "Everett, WA" },
    { name: "Eisenhower Middle School", grades: "6-8", rating: 4.2, desc: "Everett SD middle school with active military family services.", url: "", city: "Everett, WA" },
  ],
  "MCB Hawaii": [
    { name: "Mokapu Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at MCB Hawaii Kaneohe Bay. Strong PCS transition support, multicultural community.", url: "", city: "Kaneohe, HI" },
    { name: "Kailua High School", grades: "9-12", rating: 4.2, desc: "Hawaii DOE school serving MCB Hawaii families. Beach proximity, surf culture.", url: "", city: "Kailua, HI" },
    { name: "Aikahi Elementary", grades: "K-5", rating: 4.4, desc: "Hawaii DOE elementary in Kailua. High military enrollment.", url: "", city: "Kailua, HI" },
  ],
  "MCAS Beaufort": [
    { name: "Beaufort High School", grades: "9-12", rating: 4.2, desc: "Beaufort County SD high school. Strong academics; serves military and civilian families.", url: "", city: "Beaufort, SC" },
    { name: "Lady's Island Middle School", grades: "6-8", rating: 4.1, desc: "Beaufort County SD middle school. Active military family liaison.", url: "", city: "Lady's Island, SC" },
  ],
  "Patrick SFB": [
    { name: "Cocoa Beach Junior/Senior High", grades: "7-12", rating: 4.5, desc: "Brevard County SD school. Strong academics; surfers' culture. Space Coast amenities.", url: "", city: "Cocoa Beach, FL" },
    { name: "Roosevelt Elementary", grades: "K-6", rating: 4.4, desc: "Brevard County SD elementary serving Patrick SFB families.", url: "", city: "Cocoa Beach, FL" },
  ],
  "Mountain Home AFB": [
    { name: "Mountain Home Senior High School", grades: "9-12", rating: 4.0, desc: "Mountain Home SD school with active military family services.", url: "", city: "Mountain Home, ID" },
    { name: "Stephensen Elementary", grades: "K-5", rating: 4.1, desc: "Mountain Home SD elementary near AFB. High military enrollment.", url: "", city: "Mountain Home, ID" },
  ],
  "Holloman AFB": [
    { name: "Alamogordo High School", grades: "9-12", rating: 4.0, desc: "Alamogordo Public Schools HS. Active military family services.", url: "", city: "Alamogordo, NM" },
    { name: "Holloman Middle School", grades: "6-8", rating: 3.9, desc: "On-base DoDEA-affiliated middle school serving Holloman families.", url: "", city: "Holloman AFB, NM" },
  ],
  "Kirtland AFB": [
    { name: "La Cueva High School", grades: "9-12", rating: 4.6, desc: "Albuquerque Public Schools school in the highest-rated APS zone. AP and IB programs.", url: "", city: "Albuquerque, NM" },
    { name: "Eldorado High School", grades: "9-12", rating: 4.4, desc: "Albuquerque Public Schools school in NE Heights. Many Kirtland families zoned here.", url: "", city: "Albuquerque, NM" },
  ],
  "Maxwell AFB": [
    { name: "Maxwell Air Force Base Elementary/Middle (DoDEA)", grades: "K-8", rating: 4.4, desc: "DoDEA on-base school at Maxwell AFB. Strong academics and PCS family support.", url: "", city: "Montgomery, AL" },
    { name: "Prattville High School", grades: "9-12", rating: 4.1, desc: "Autauga County BOE school. Many Maxwell families choose Prattville for schools.", url: "", city: "Prattville, AL" },
  ],
  "Cannon AFB": [
    { name: "Clovis High School", grades: "9-12", rating: 3.9, desc: "Clovis Municipal Schools HS. Active military family liaison.", url: "", city: "Clovis, NM" },
    { name: "Lockwood Elementary", grades: "K-5", rating: 4.0, desc: "Clovis Municipal Schools elementary near Cannon AFB.", url: "", city: "Clovis, NM" },
  ],
  "F.E. Warren AFB": [
    { name: "Central High School", grades: "9-12", rating: 4.2, desc: "Laramie County SD 1 high school. AP and IB programs. Active military family services.", url: "", city: "Cheyenne, WY" },
    { name: "Freedom Elementary", grades: "K-5", rating: 4.3, desc: "Laramie County SD 1 elementary serving F.E. Warren AFB families.", url: "", city: "Cheyenne, WY" },
  ],
  "Grand Forks AFB": [
    { name: "Grand Forks Central High School", grades: "9-12", rating: 4.1, desc: "Grand Forks Public Schools HS. Active military family services.", url: "", city: "Grand Forks, ND" },
    { name: "Grand Forks AFB Elementary (DoDEA)", grades: "K-5", rating: 4.2, desc: "DoDEA-affiliated on-base elementary.", url: "", city: "Grand Forks, ND" },
  ],
  "Tyndall AFB": [
    { name: "Mosley High School", grades: "9-12", rating: 4.1, desc: "Bay District Schools HS in Lynn Haven. Many Tyndall families zoned here.", url: "", city: "Lynn Haven, FL" },
    { name: "Patronis Elementary", grades: "K-5", rating: 4.4, desc: "Bay District Schools elementary in Panama City Beach.", url: "", city: "Panama City Beach, FL" },
  ],
  "Langley AFB": [
    { name: "Tabb High School", grades: "9-12", rating: 4.5, desc: "York County School Division. Among top high schools in Hampton Roads. Many Langley families zoned here.", url: "", city: "Yorktown, VA" },
    { name: "Bethel High School", grades: "9-12", rating: 4.0, desc: "Hampton City Schools HS. Active military family liaison.", url: "", city: "Hampton, VA" },
    { name: "Magruder Primary School", grades: "K-2", rating: 4.5, desc: "York County School Division near Langley AFB.", url: "", city: "Yorktown, VA" },
  ],
  "Robins AFB": [
    { name: "Houston County High School", grades: "9-12", rating: 4.4, desc: "Houston County School District HS in Warner Robins. Highly rated. Active military family services.", url: "", city: "Warner Robins, GA" },
    { name: "Linwood Elementary", grades: "K-5", rating: 4.3, desc: "Houston County SD elementary near Robins AFB.", url: "", city: "Warner Robins, GA" },
  ],
  "Whiteman AFB": [
    { name: "Knob Noster High School", grades: "9-12", rating: 4.2, desc: "Knob Noster R-VIII SD high school adjacent to Whiteman AFB. Strong military family services.", url: "", city: "Knob Noster, MO" },
    { name: "Knob Noster Elementary", grades: "K-5", rating: 4.2, desc: "Knob Noster R-VIII SD elementary serving Whiteman families.", url: "", city: "Knob Noster, MO" },
  ],
  "Sheppard AFB": [
    { name: "Wichita Falls High School", grades: "9-12", rating: 3.8, desc: "Wichita Falls ISD HS. Active military family services.", url: "", city: "Wichita Falls, TX" },
    { name: "Hirschi High School", grades: "9-12", rating: 3.9, desc: "Wichita Falls ISD HS with magnet programs.", url: "", city: "Wichita Falls, TX" },
  ],
  "Goodfellow AFB": [
    { name: "Central High School", grades: "9-12", rating: 4.0, desc: "San Angelo ISD HS. Active military family services for Goodfellow students.", url: "", city: "San Angelo, TX" },
    { name: "Lake View High School", grades: "9-12", rating: 3.9, desc: "San Angelo ISD HS.", url: "", city: "San Angelo, TX" },
  ],
  "Laughlin AFB": [
    { name: "Del Rio High School", grades: "9-12", rating: 3.8, desc: "San Felipe Del Rio CISD HS. Active military family services.", url: "", city: "Del Rio, TX" },
  ],
  "Lackland AFB": [
    { name: "Lackland Elementary (DoDEA)", grades: "K-5", rating: 4.4, desc: "DoDEA on-base elementary at Lackland. Strong PCS transition support.", url: "", city: "JBSA Lackland, TX" },
    { name: "John Jay High School", grades: "9-12", rating: 4.2, desc: "Northside ISD HS popular with JBSA Lackland families.", url: "", city: "San Antonio, TX" },
  ],
  "Randolph AFB": [
    { name: "Randolph High School", grades: "9-12", rating: 4.7, desc: "Randolph Field ISD HS on JBSA Randolph. Top-rated in Texas. Highly competitive academics.", url: "", city: "JBSA Randolph, TX" },
    { name: "Randolph Elementary", grades: "K-5", rating: 4.6, desc: "Randolph Field ISD elementary on base.", url: "", city: "JBSA Randolph, TX" },
  ],
  "MCAS Kaneohe Bay": [
    { name: "Mokapu Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary on MCAS Kaneohe Bay. Strong PCS transition support.", url: "", city: "Kaneohe, HI" },
    { name: "Castle High School", grades: "9-12", rating: 4.2, desc: "Hawaii DOE HS serving Kailua/Kaneohe military community.", url: "", city: "Kaneohe, HI" },
  ],
  "Camp Zama": [
    { name: "Zama American High School (DoDEA)", grades: "9-12", rating: 4.5, desc: "DoDEA HS at Camp Zama. AP courses, athletics, performing arts. Strong PCS transition.", url: "", city: "Zama, Japan" },
    { name: "Zama Middle/High School (DoDEA)", grades: "6-12", rating: 4.5, desc: "DoDEA combined MS/HS at Zama. Smaller campus community.", url: "", city: "Zama, Japan" },
    { name: "Arnn Elementary (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at SHA Sagamihara housing area.", url: "", city: "Sagamihara, Japan" },
  ],
  "NS Rota": [
    { name: "David Glasgow Farragut High School (DoDEA)", grades: "9-12", rating: 4.4, desc: "DoDEA HS at NS Rota. Strong AP and IB programs.", url: "", city: "Rota, Spain" },
    { name: "Rota Elementary School (DoDEA)", grades: "K-5", rating: 4.5, desc: "DoDEA elementary at NS Rota.", url: "", city: "Rota, Spain" },
  ],
  "Aberdeen Proving Ground": [
    { name: "C. Milton Wright High School", grades: "9-12", rating: 4.5, desc: "Harford County Public Schools HS. Highly rated; many APG families zoned here.", url: "", city: "Bel Air, MD" },
    { name: "Aberdeen High School", grades: "9-12", rating: 4.2, desc: "Harford County Public Schools HS near APG.", url: "", city: "Aberdeen, MD" },
    { name: "Bakerfield Elementary", grades: "K-5", rating: 4.3, desc: "Harford County Public Schools elementary serving APG families.", url: "", city: "Aberdeen, MD" },
  ],
};
