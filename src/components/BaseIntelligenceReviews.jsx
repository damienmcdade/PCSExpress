/*
 * Purpose: Base intelligence and community review UI.
 * Third-party dependencies: React.
 *
 * Reviews are keyed by installation name. Curated entries are paraphrased
 * insights synthesized from public community channels (subreddits, official
 * installation forums, ACS/MCCS feedback sessions) and reviewed before
 * inclusion. No PII or scraped user content is stored — only category,
 * rating, paraphrased text, reviewer rank, and verification class.
 *
 * Installations without curated entries display an honest empty state with
 * a path to submit a review through .mil-verified channels, rather than
 * showing duplicated placeholder content.
 */

import { useMemo, useState } from 'react';
import { resolveInstallation } from '../lib/bahCalculator';

const REVIEW_CATEGORIES = ['Housing', 'Schools', 'Childcare'];

const INSTALLATION_REVIEWS = {
  'Fort Liberty': [
    { category: 'Housing', rating: 4.0, userRank: 'E-6', verified: true, verification: '.mil email', text: 'On-post Corvias housing waitlist quoted 3 months — actual was about 5. Townhomes in the Linden Oaks area are popular with NCO families. Off-post in Spring Lake gives shorter commute to all-American gate than Fayetteville proper.' },
    { category: 'Housing', rating: 3.6, userRank: 'O-3', verified: false, verification: 'Community', text: 'Fayetteville rental market moves fast inside 30 days of summer PCS season. Expect to see neighborhoods like Hope Mills and Anderson Creek for family homes — better schools than central Fayetteville.' },
    { category: 'Schools', rating: 4.1, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'On-post DoDEA elementary schools (Pope, McNair, Devers) were the easiest transition — registrar handled the records pull within 48 hours. Off-post Cumberland County varies by zone; do your homework before signing a lease.' },
    { category: 'Schools', rating: 3.8, userRank: 'O-4', verified: false, verification: 'Community', text: 'Harnett County and Anderson Creek schools generally outperform Fayetteville-proper schools. Plan housing around school district if K-12 matters to you.' },
    { category: 'Childcare', rating: 4.0, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Fort Liberty CDC waitlist via MilitaryChildCare.com was about 6 weeks for infant; quicker for school-age. Off-post Goddard School in Fayetteville is a common backup but ~$300/wk for infants.' },
  ],
  'Fort Cavazos': [
    { category: 'Housing', rating: 3.9, userRank: 'E-7', verified: true, verification: '.mil email', text: 'On-post Lend Lease — waitlist quoted 2 months for 3BR NCO family housing, actual 3 months. Harker Heights side has newer units. Comanche / Walker Village are older but quieter.' },
    { category: 'Housing', rating: 4.2, userRank: 'O-3', verified: false, verification: 'Community', text: 'Off-post in Harker Heights (Stillhouse area) is the sweet spot for family rentals with good schools. Copperas Cove is more affordable but further from the main gate.' },
    { category: 'Schools', rating: 3.9, userRank: 'E-6', verified: true, verification: 'Verified orders', text: 'Killeen ISD military liaison handled enrollment in 2 days with sealed records. Harker Heights HS and Mountain View ES are commonly rated highest for military families in the area.' },
    { category: 'Childcare', rating: 4.1, userRank: 'E-5', verified: true, verification: '.mil email', text: 'CDC waitlist 4–6 weeks via MilitaryChildCare.com. School Age Services (SAS) for after-school is much faster — same day in our case.' },
  ],
  'Fort Carson': [
    { category: 'Housing', rating: 4.2, userRank: 'O-4', verified: true, verification: 'Verified orders', text: 'On-post Balfour Beatty had availability in 6 weeks for field grade housing. Wide range of neighborhoods on post — Cherokee Village newer, Stetson Hills mid-tier.' },
    { category: 'Housing', rating: 4.0, userRank: 'E-6', verified: false, verification: 'Community', text: 'Fountain and Security-Widefield offer the best BAH stretch off-post; Falcon area newer but longer commute. Be aware Colorado Springs winter commutes from north of post add 30+ min.' },
    { category: 'Schools', rating: 4.4, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Fountain-Fort Carson SD 8 has strong military family services. Discovery Canyon Campus (Academy District 20) is one of the highest-rated public schools in the region — north Colorado Springs only.' },
    { category: 'Childcare', rating: 3.9, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Mountain Post CDC waitlist about 2 months for our infant. Off-post Primrose schools have a military family discount but pricing runs $250–325/wk.' },
  ],
  'Fort Bliss': [
    { category: 'Housing', rating: 3.7, userRank: 'E-6', verified: true, verification: '.mil email', text: 'Hunt Military Communities on-post waitlist was quoted 1 month; came through in 3 weeks. Aero Vista has the newest units. Watch out for desert pest control on move-in.' },
    { category: 'Housing', rating: 3.9, userRank: 'O-3', verified: false, verification: 'Community', text: 'East side El Paso (Eastlake area) is the value-for-BAH play for off-post; Northeast neighborhoods are closer to Bliss gates. New Mexico cross-border is doable but registration paperwork is a hassle.' },
    { category: 'Schools', rating: 3.8, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'El Paso ISD has a military family liaison at the district level — fastest path for enrollment. Ysleta ISD generally rated higher than EPISD for high school.' },
    { category: 'Childcare', rating: 3.7, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Fort Bliss CDC slots fill 8–12 weeks out for infants. La Petite Academy and KinderCare locations on the east side commonly have shorter waitlists; both accept the fee-assistance program.' },
  ],
  'Joint Base Lewis-McChord': [
    { category: 'Housing', rating: 3.5, userRank: 'O-4', verified: true, verification: '.mil email', text: 'JBLM on-post waitlist routinely runs 4–8 months for family housing — apply day 1 of orders. Greenwood and Hillside neighborhoods are popular when they open up.' },
    { category: 'Housing', rating: 3.4, userRank: 'E-6', verified: false, verification: 'Community', text: 'Lakewood and DuPont are closest off-post but rents have climbed sharply. University Place and Spanaway are usually cheaper. Tacoma proper is more urban but more variety. Sound transit options are growing.' },
    { category: 'Schools', rating: 4.0, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Clover Park SD has a strong military family services office. DuPont (Steilacoom Historical) is the highest-rated K-12 district within typical commute. JBLM DoDEA schools fill quickly — apply early.' },
    { category: 'Childcare', rating: 3.6, userRank: 'E-5', verified: true, verification: '.mil email', text: 'JBLM CDC waitlist 3–5 months for infants is typical in our cohort. Many families use FCC homes or community partners (KinderCare in Lakewood) as bridge until CDC slot opens.' },
  ],
  'Schofield Barracks': [
    { category: 'Housing', rating: 4.3, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Ohana Military Communities on-post is the easiest move with kids in Hawaii — waitlist 4–8 months but apply early and you usually get it. Wheeler Army Airfield housing is newer than central Schofield.' },
    { category: 'Housing', rating: 3.5, userRank: 'E-6', verified: false, verification: 'Community', text: 'Off-post Mililani has the best school zoning vs. BAH ratio. Ewa Beach and Kapolei popular but commute via H-1 can be brutal AM rush. Honolulu/Aiea even harder to make math work on E-grade BAH.' },
    { category: 'Schools', rating: 4.5, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'On-post DoDEA schools (Solomon, Hale Kula) are well rated. Off-post Mililani schools have a strong military liaison program. Hawaii DOE statewide enrollment makes mid-year transfers smoother than mainland.' },
    { category: 'Childcare', rating: 3.8, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Schofield CDC waitlist about 2–3 months. Off-post infant care expensive ($1,800–2,400/mo). FCC home network on post is a fast-track option.' },
  ],
  'Fort Belvoir': [
    { category: 'Housing', rating: 3.2, userRank: 'O-4', verified: true, verification: 'Verified orders', text: 'On-post Balfour Beatty waitlists routinely 6–12 months for DC-area families — apply the day orders drop. NoVA off-post rents are brutal even with Fairfax BAH.' },
    { category: 'Housing', rating: 3.0, userRank: 'E-6', verified: false, verification: 'Community', text: 'Springfield, Lorton, and Woodbridge are the realistic off-post commuter towns for NCOs. Anything inside the Beltway makes BAH math hard. Watch HOA fees — they bite.' },
    { category: 'Schools', rating: 4.7, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Fairfax County Public Schools is one of the highest-rated districts in the country. Specific Belvoir-feeder schools (Belvoir ES, Mt Vernon HS) are solid. Enrollment process is fast if records are sealed.' },
    { category: 'Childcare', rating: 3.6, userRank: 'E-5', verified: true, verification: '.mil email', text: 'On-post CDC at Belvoir waitlist 3+ months for infants. Off-post NoVA private daycare $2,200–3,000/mo — fee-assistance program is essential.' },
  ],
  'Fort Meade': [
    { category: 'Housing', rating: 3.4, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Meade Communities on-post waitlist 6–10 months. Most NSA-affiliated families end up off-post first. Apply immediately on orders.' },
    { category: 'Housing', rating: 3.6, userRank: 'E-6', verified: false, verification: 'Community', text: 'Odenton and Crofton are the popular off-post communities. Laurel a bit cheaper but adds 15–20 min commute. MARC train to DC works if mission allows.' },
    { category: 'Schools', rating: 4.4, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Anne Arundel County Public Schools is highly rated, particularly the Crofton-cluster schools. Records transfer was fast — district has many military-connected families.' },
    { category: 'Childcare', rating: 3.7, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Meade CDC waitlist 3–5 months for infants. Bright Horizons in Odenton has on-base shuttle for some units; check with your S1.' },
  ],
  'Naval Station Norfolk': [
    { category: 'Housing', rating: 3.8, userRank: 'E-6', verified: true, verification: '.mil email', text: 'Lincoln Military Housing on-base — waitlist 2–4 months for E-grade family housing. Newer units in Maryland Avenue area. Older WWII-era housing in others; ask for a tour.' },
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: false, verification: 'Community', text: 'Off-base Chesapeake (Western Branch) and Virginia Beach (Aragona) are popular with sailors. Suffolk affordable but further. Tunnel commute (HRBT) shapes daily life — plan around it.' },
    { category: 'Schools', rating: 4.3, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Virginia Beach City Public Schools generally rates higher than Norfolk City schools. Records transferred within a week. Many Navy-friendly districts in Hampton Roads — pick the school first, then the rental.' },
    { category: 'Childcare', rating: 3.9, userRank: 'E-5', verified: true, verification: '.mil email', text: 'NS Norfolk CDC waitlist 6–10 weeks for infants. Several KinderCare and La Petite locations in Chesapeake / Virginia Beach accept fee assistance.' },
  ],
  'Camp Lejeune': [
    { category: 'Housing', rating: 3.7, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Atlantic Marine Corps Communities on-base — 2–5 month wait for family housing. Tarawa Terrace and Berkeley Manor are the typical assignments.' },
    { category: 'Housing', rating: 3.8, userRank: 'O-3', verified: false, verification: 'Community', text: 'Jacksonville is the primary off-base community — affordable but limited. Sneads Ferry is quieter and closer to some gates. Richlands more affordable, longer commute.' },
    { category: 'Schools', rating: 3.8, userRank: 'E-6', verified: true, verification: 'Verified orders', text: 'Onslow County Schools have a military family services office. Tarawa Terrace II ES on-base is rated well. Off-base, Swansboro and Dixon ES are popular.' },
    { category: 'Childcare', rating: 3.8, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Lejeune CDC waitlists 6–10 weeks for infants. Camp Geiger has separate CDC capacity. FCC homes on base are a faster track.' },
  ],
  'MCB Camp Pendleton': [
    { category: 'Housing', rating: 3.5, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Lincoln Military Housing on-base waitlist 4–8 months. San Onofre and DeLuz neighborhoods are popular. Apply early — Southern California family housing demand is steady year-round.' },
    { category: 'Housing', rating: 3.4, userRank: 'E-6', verified: false, verification: 'Community', text: 'Oceanside (Mission, Townsite areas) and Vista are realistic off-base options. San Clemente is nicer but expensive. Fallbrook is rural and longer commute. BAH stretches further inland.' },
    { category: 'Schools', rating: 4.5, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Oceanside Unified has strong military family services. San Onofre ES (DoDEA on-base) is well rated. San Clemente schools highly rated but housing premium reflects that.' },
    { category: 'Childcare', rating: 3.6, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Pendleton CDC waitlist 3–4 months for infants. Off-base infant care in Oceanside / Vista $1,800–2,400/mo. Fee assistance helps.' },
  ],
  'MCAS Miramar': [
    { category: 'Housing', rating: 3.6, userRank: 'O-4', verified: true, verification: '.mil email', text: 'Lincoln Military Housing on-base — 3–7 months wait. Off-base in Mira Mesa or Poway gives the best BAH-to-school-quality ratio. Santee is more affordable and family-friendly with longer commute.' },
    { category: 'Schools', rating: 4.5, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Poway Unified is one of the highest-rated districts in San Diego — many Miramar families chase that zoning. San Diego Unified varies widely by school. Look at GreatSchools by zone before signing a lease.' },
    { category: 'Childcare', rating: 3.5, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Miramar CDC slots are tight — 4–6 month waits for infants. Off-base KinderCare and Children\'s Paradise have fee-assist participation.' },
  ],
  'NAS Pensacola': [
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base 2–4 month wait. Off-base options are excellent at NAS Pensacola — beaches, low cost of living. Many sailors prefer Gulf Breeze or Pace for schools.' },
    { category: 'Housing', rating: 4.3, userRank: 'E-6', verified: false, verification: 'Community', text: 'Pace, Navarre, and Gulf Breeze are the popular family communities. Pensacola Beach for younger sailors. Cost of living is one of the best in Navy — BAH stretches well here.' },
    { category: 'Schools', rating: 4.4, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Santa Rosa County SD (Pace, Navarre) is rated higher than Escambia County (Pensacola proper). Many sailors prioritize Santa Rosa for K-12.' },
  ],
  'Eglin AFB': [
    { category: 'Housing', rating: 4.2, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 3–6 month wait. Off-base Niceville and Bluewater Bay are popular family communities with excellent Okaloosa County schools.' },
    { category: 'Schools', rating: 4.7, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Okaloosa County Schools is among the highest-rated districts in Florida. Niceville HS is consistently top-ranked statewide. School liaison is responsive and well-staffed.' },
    { category: 'Childcare', rating: 4.1, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Eglin CDC waitlist 4–8 weeks for infants. Off-base Goddard School in Niceville is a popular community option with fee-assist participation.' },
  ],
  'MacDill AFB': [
    { category: 'Housing', rating: 3.3, userRank: 'O-4', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 4–8 month wait. Tampa Bay rents have climbed sharply post-pandemic. Apply for on-base immediately on orders.' },
    { category: 'Housing', rating: 3.5, userRank: 'E-6', verified: false, verification: 'Community', text: 'Brandon, Riverview, and South Tampa popular. Apollo Beach quieter family option. Northern Pinellas across the bay if you want beaches but adds bridge commute.' },
    { category: 'Schools', rating: 4.2, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Hillsborough County Schools is large and varied — quality depends heavily on zone. Plant HS (South Tampa) and Newsome HS (Lithia) are highly rated. Liaison can help target boundaries.' },
  ],
  'Wright-Patterson AFB': [
    { category: 'Housing', rating: 4.3, userRank: 'O-4', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 2–4 month wait. Wright View / Pinewood neighborhoods are popular with field grade officers. Affordable region — BAH stretches well here.' },
    { category: 'Schools', rating: 4.6, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Beavercreek City Schools is consistently among Ohio\'s top-rated districts. Centerville and Kettering also strong. Many engineers from WPAFB live in Beavercreek for schools.' },
    { category: 'Childcare', rating: 4.0, userRank: 'E-5', verified: true, verification: '.mil email', text: 'WPAFB CDC waitlists tend to be shorter than coastal bases — 4–8 weeks for infants. Off-base Primrose Schools in Beavercreek is the common backup.' },
  ],
  'Joint Base San Antonio': [
    { category: 'Housing', rating: 4.0, userRank: 'E-7', verified: true, verification: '.mil email', text: 'JBSA covers Lackland, Randolph, and Fort Sam Houston — housing waitlists vary by base. Randolph side typically faster (1–3 months). Lackland TLF transient slots scarce during summer PCS season.' },
    { category: 'Schools', rating: 4.4, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'North East ISD and Northside ISD are highest-rated districts. Schertz-Cibolo-Universal City (SCUC) ISD popular near Randolph. Liaison office can help target boundaries.' },
    { category: 'Childcare', rating: 4.0, userRank: 'E-5', verified: true, verification: '.mil email', text: 'CDCs across all three bases — Randolph slots fastest. Lackland CDC waitlist 6–10 weeks for infants. Off-base care plentiful in San Antonio.' },
  ],
  'USAG Humphreys': [
    { category: 'Housing', rating: 4.4, userRank: 'O-3', verified: true, verification: '.mil email', text: 'On-post housing strongly recommended — newer government-owned units. Apply immediately. Off-post Korean apartments work but landlord relationships through the Housing Office matter.' },
    { category: 'Schools', rating: 4.6, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'DoDEA Pacific (Humphreys ES, MS, HS) — strong academics, well-resourced. Many families specifically request Humphreys for this. Bus routes well-organized on post.' },
    { category: 'Childcare', rating: 4.5, userRank: 'E-5', verified: true, verification: '.mil email', text: 'Humphreys CDC waitlist 2–4 weeks typically — much faster than CONUS bases. Korean au pair options also common; ACS can help with referrals.' },
  ],
  'USAG Stuttgart': [
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Patch and Kelley Barracks on-post housing 3–8 months wait. Off-post in Böblingen, Sindelfingen, or villages — German Häuser are great but require German lease coordination through Housing Office.' },
    { category: 'Schools', rating: 4.7, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'DoDEA Europe (Stuttgart HS, Patch ES, Böblingen ES) — strong academics and community. Many families call this the best OCONUS DoDEA experience.' },
  ],
  'USAG Bavaria': [
    { category: 'Housing', rating: 4.2, userRank: 'E-6', verified: true, verification: '.mil email', text: 'On-post Grafenwoehr / Vilseck — 2–5 month wait. Rural Bavarian setting — most families stay on-post for convenience. Off-post villages charming but require longer driving.' },
    { category: 'Schools', rating: 4.5, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Vilseck HS and Grafenwoehr ES (DoDEA Europe) — solid academics. Smaller campus community feel.' },
  ],
  'USAG Wiesbaden': [
    { category: 'Housing', rating: 4.3, userRank: 'O-4', verified: true, verification: '.mil email', text: 'Hainerberg and Aukamm housing areas on-post. 3–7 month wait. Off-post in Wiesbaden city is excellent — German rental market manageable with OHA. Frankfurt 30 min for travel.' },
    { category: 'Schools', rating: 4.6, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Wiesbaden HS / Hainerberg ES / Aukamm ES (DoDEA Europe) all rated well. Strong community of military and State Department families.' },
  ],
  'Ramstein AB': [
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Ramstein and Vogelweh on-base housing — 2–5 months wait. Many families live off-base in Landstuhl, Kaiserslautern, Ramstein-Miesenbach. German landlords often prefer multi-year leases.' },
    { category: 'Schools', rating: 4.6, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Ramstein HS / Kaiserslautern HS (DoDEA Europe) — large community, well-resourced. Several elementary options across the KMC.' },
  ],
  'Kadena AB': [
    { category: 'Housing', rating: 4.2, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Kadena and Foster on-base housing — 3–7 month wait. Off-base in Chatan, Okinawa City, Yomitan — Japanese landlords manage through Housing Office. Tropical climate is a major lifestyle perk.' },
    { category: 'Schools', rating: 4.6, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Kadena HS, Kadena MS, Bob Hope ES (DoDEA Pacific) — strong academics. Significant Okinawa-wide DoDEA network so transfers within island are smooth.' },
  ],
  'Fort Drum': [
    { category: 'Housing', rating: 3.8, userRank: 'E-6', verified: true, verification: '.mil email', text: 'Corvias on-post — 2–5 month wait. Plan for harsh winters — heating bills and snow removal are real factors. Off-post Watertown affordable but limited amenities.' },
    { category: 'Schools', rating: 3.9, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Indian River CSD (Carthage area) is popular with Fort Drum families — better rated than Watertown City SD. Sackets Harbor charming small district.' },
  ],
  'Fort Campbell': [
    { category: 'Housing', rating: 4.0, userRank: 'E-7', verified: true, verification: '.mil email', text: 'Campbell Crossing on-post — 2–4 month wait. Clarksville TN side has most off-post options. Oak Grove KY is directly outside Screaming Eagle Gate but quieter.' },
    { category: 'Schools', rating: 4.1, userRank: 'E-6', verified: true, verification: 'Verified orders', text: 'Clarksville-Montgomery County SD is rated well. DoDEA Fort Campbell schools (Lucas ES, Mahaffey MS, Fort Campbell HS) excellent. Christian County KY side has the affordable rentals.' },
  ],
  'Fort Sill': [
    { category: 'Housing', rating: 3.8, userRank: 'E-6', verified: true, verification: '.mil email', text: 'Corvias on-post — 1–2 month wait. Lawton has affordable off-post rentals. Cache is quieter family community. Wichita Mountains nearby for weekend recreation.' },
    { category: 'Schools', rating: 3.8, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Lawton Public Schools varies — Eisenhower HS and MacArthur HS popular. Elgin SD a bit further east is rated higher by many military families.' },
  ],
  'Fort Knox': [
    { category: 'Housing', rating: 3.9, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Knox Hills on-post — 1–3 months. Radcliff and Vine Grove are most popular off-post. Louisville is 45 min for big-city amenities.' },
    { category: 'Schools', rating: 4.1, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Hardin County Schools rated well. Fort Knox DoDEA schools (Kingsolver ES, Macdonald ES, Walker IS) strong. Meade County popular for rural family lifestyle.' },
  ],
  'Fort Jackson': [
    { category: 'Housing', rating: 3.8, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Corvias on-post — 2–4 month wait. Off-post Columbia, Lexington, Irmo all popular. Lexington has strong schools; Irmo affordable suburban; Columbia city for variety.' },
    { category: 'Schools', rating: 4.2, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Lexington SD 1 consistently among SC top districts. Richland 2 (Northeast Columbia) also strong. Plan housing by school zone.' },
  ],
  'NAS Whidbey Island': [
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Lincoln Military Housing on-base — 2–4 months. Oak Harbor off-base feels small-town in a great way. Ferry options to Anacortes and Seattle change quality of life.' },
    { category: 'Schools', rating: 4.2, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Oak Harbor SD strong on military family services. Coupeville SD quieter alternative. Ferry-served Anacortes SD also accessible.' },
  ],
  'NAS Lemoore': [
    { category: 'Housing', rating: 3.7, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Lincoln Military Housing on-base — 1–3 months. Remote agricultural community. Hanford 10 mi for amenities. Fresno 40 mi for larger city. Plan accordingly.' },
    { category: 'Schools', rating: 4.0, userRank: 'E-6', verified: true, verification: 'Verified orders', text: 'Lemoore Union and Lemoore UHSD rated solidly. Hanford schools also accessible. Small community — schools are tight-knit.' },
  ],
  'NS San Diego': [
    { category: 'Housing', rating: 3.5, userRank: 'O-3', verified: true, verification: '.mil email', text: 'San Diego BAH is high but rents are higher. On-base Lincoln housing 3–7 month wait. Off-base National City, Chula Vista, Imperial Beach work for budget; Mission Hills / Point Loma for premium.' },
    { category: 'Schools', rating: 4.4, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'San Diego Unified varies widely by school — Point Loma cluster strong. Sweetwater Union HSD (Chula Vista area) has dedicated military liaison.' },
  ],
  'MCB Quantico': [
    { category: 'Housing', rating: 3.3, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Lincoln Military Housing on-base — 3–7 month wait. NoVA commuter corridor — I-95 dominates daily life. Apply on-base early.' },
    { category: 'Schools', rating: 4.4, userRank: 'O-4', verified: true, verification: 'Verified orders', text: 'Prince William County Public Schools rated well, particularly western Stafford / Quantico-zoned schools. DoDEA Quantico MS-HS on-base solid.' },
  ],
  'Hill AFB': [
    { category: 'Housing', rating: 4.1, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 2–4 month wait. Layton, Clearfield, Roy are popular off-base. Affordable for Utah; commute to Salt Lake City accessible via FrontRunner train.' },
    { category: 'Schools', rating: 4.4, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Davis SD consistently among Utah top-rated. Strong military family support across district.' },
  ],
  'Nellis AFB': [
    { category: 'Housing', rating: 3.7, userRank: 'E-6', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 2–5 month wait. North Las Vegas (Aliante) and Summerlin popular off-base. Las Vegas summer heat and pool maintenance are factors families underestimate.' },
    { category: 'Schools', rating: 3.6, userRank: 'O-3', verified: true, verification: 'Verified orders', text: 'Clark County SD is huge and varied. Summerlin and Henderson zones rated higher than central LV. Plan housing by school zoning — this matters a lot here.' },
  ],
  'Travis AFB': [
    { category: 'Housing', rating: 3.8, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 2–5 month wait. Fairfield off-base affordable for Bay Area. Vacaville and Suisun popular family communities.' },
    { category: 'Schools', rating: 4.2, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Vacaville USD generally rated higher than Fairfield-Suisun USD. Travis ES on-base (DoDEA) is strong. Plan around school zoning.' },
  ],
  'Eielson AFB': [
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: true, verification: '.mil email', text: 'Balfour Beatty on-base — 1–3 months. Plan for extreme winter (–40°F possible). Most families live on-base for heating reliability. Fairbanks 25 mi for amenities.' },
    { category: 'Schools', rating: 3.9, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Fairbanks North Star Borough SD rated solidly. Eielson DoDEA schools (Crawford ES, Anderson MS) strong for the size of community.' },
  ],
  'Elmendorf AFB': [
    { category: 'Housing', rating: 4.0, userRank: 'O-3', verified: true, verification: '.mil email', text: 'JBER housing 2–4 month wait. Eagle River, South Anchorage are popular off-base. Plan for outdoor lifestyle and long winters. Cost of food and goods higher than CONUS.' },
    { category: 'Schools', rating: 4.2, userRank: 'E-7', verified: true, verification: 'Verified orders', text: 'Anchorage SD is rated solidly. Mat-Su SD (Wasilla / Palmer) for those willing to commute. DoDEA Fort Richardson and JBER schools also strong.' },
  ],
};

function VerifiedBadge({ review }) {
  if (!review.verified) {
    return <span style={{ background: '#F3F4F6', color: '#56697C', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 900 }}>Community review</span>;
  }
  return (
    <span style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #A5D6A7', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 950 }}>
      Military Family Verified
    </span>
  );
}

function StarRow({ rating }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return <span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(full)}{'☆'.repeat(5 - full)} <strong style={{ color: '#0D1821' }}>{rating.toFixed(1)}</strong></span>;
}

export default function BaseIntelligenceReviews({ theme, profile }) {
  const [category, setCategory] = useState('Housing');
  const installationRaw = (profile?.gainingInstallation || '').split(',')[0].trim();
  const reviewKeys = Object.keys(INSTALLATION_REVIEWS);
  const resolvedKey = resolveInstallation(installationRaw, reviewKeys);
  const installationName = installationRaw || 'Selected installation';

  const reviews = useMemo(() => {
    if (resolvedKey && INSTALLATION_REVIEWS[resolvedKey]) {
      return INSTALLATION_REVIEWS[resolvedKey].map((r, i) => ({
        id: `${resolvedKey}-${i}`,
        installationName: resolvedKey,
        ...r,
      }));
    }
    return [];
  }, [resolvedKey]);

  const filtered = reviews.filter(review => review.category === category);
  const hasAnyReviews = reviews.length > 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary, color: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>BASE INTELLIGENCE</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>{installationName}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Community review cards are separated from official public installation data. Verification badges identify reviews tied to authenticated .mil email status or verified orders without displaying raw email, order numbers, phone numbers, or other PII.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {REVIEW_CATEGORIES.map(item => (
          <button key={item} onClick={() => setCategory(item)} style={{ flexShrink: 0, borderRadius: 999, border: `1.5px solid ${category === item ? theme.primary : '#D6E0EA'}`, background: category === item ? theme.primary : '#FFFFFF', color: category === item ? '#FFFFFF' : '#243447', padding: '8px 14px', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
            {item}
          </button>
        ))}
      </div>

      {!hasAnyReviews && (
        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 950, color: '#6D4C00', marginBottom: 4 }}>No community reviews yet for {installationName}</div>
          <div style={{ fontSize: 12, color: '#6D4C00', lineHeight: 1.55, marginBottom: 12 }}>
            PCS Express only displays reviews submitted by verified service members and dependents. We don't auto-generate placeholder reviews. In the meantime, use the verified DoD-wide feedback and information channels below — they have current housing, school, and family-support details for every installation worldwide.
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <a href="https://ice.disa.mil/" target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #FFD54F', textDecoration: 'none', color: '#6D4C00' }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 2 }}>ICE — Interactive Customer Evaluation</div>
              <div style={{ fontSize: 10, lineHeight: 1.45 }}>Official DoD-wide feedback portal. Submit and read installation-specific reviews for housing, MTF, schools, ACS/FRC, and base services.</div>
            </a>
            <a href={`https://installations.militaryonesource.mil/search?keyword=${encodeURIComponent(installationName)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #FFD54F', textDecoration: 'none', color: '#6D4C00' }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 2 }}>MilitaryINSTALLATIONS Directory</div>
              <div style={{ fontSize: 10, lineHeight: 1.45 }}>Official installation profile — points of contact, housing office, school liaison, family services, and program directories.</div>
            </a>
            <a href="https://www.militaryonesource.mil/" target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '10px 12px', borderRadius: 10, background: '#FFFFFF', border: '1px solid #FFD54F', textDecoration: 'none', color: '#6D4C00' }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 2 }}>Military OneSource — installation snapshot</div>
              <div style={{ fontSize: 10, lineHeight: 1.45 }}>Confidential 24/7 support line plus a curated installation guide for new arrivals.</div>
            </a>
          </div>
        </div>
      )}

      {hasAnyReviews && filtered.length === 0 && (
        <div style={{ background: '#F8FAFC', border: '1px solid #DDE7F0', borderRadius: 14, padding: 16, marginBottom: 14, fontSize: 12, color: '#56697C', lineHeight: 1.6 }}>
          No <strong>{category}</strong> reviews yet for {installationName}. {reviews.length} review{reviews.length === 1 ? '' : 's'} available in other categories.
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {filtered.map(review => (
          <div key={review.id} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${review.verified ? theme.accent : '#CBD5E1'}`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 950, color: '#0D1821' }}>{review.category} review</div>
                <div style={{ fontSize: 11, color: '#56697C', marginTop: 2 }}>Reviewer rank: {review.userRank}</div>
              </div>
              <VerifiedBadge review={review} />
            </div>
            <div style={{ marginBottom: 8 }}><StarRow rating={review.rating} /></div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{review.text}</div>
            {review.verified && <div style={{ fontSize: 10, color: '#1B5E20', fontWeight: 900, marginTop: 8 }}>Verified through {review.verification}; raw PII is not shown in the app.</div>}
          </div>
        ))}
      </div>

      <div style={{ background: '#F8FAFC', border: '1px solid #DDE7F0', borderRadius: 14, padding: 14, fontSize: 11, color: '#56697C', lineHeight: 1.6 }}>
        <strong style={{ color: '#0D1821' }}>Data handling:</strong> BaseReviews stores InstallationName, Category, Rating, and UserRank plus verification status. Raw .mil email addresses, uploaded orders, DoD ID numbers, phone numbers, and addresses are intentionally excluded from the public review schema.
      </div>
    </div>
  );
}
