/*
 * Shared installation -> city/state/zip lookup used by:
 *   - HomeLocatorTab (housing market display + manual override)
 *   - BaseMapModule (map centering hint)
 *   - VeteranBusinessesTab (city/state for SAM.gov entity search)
 *
 * Entries without an alias are the current canonical name. Entries with an
 * alias forward to a renamed installation (Fort Bragg -> Fort Liberty, etc.).
 * No coordinates are stored; Google Maps geocodes from the city/state/zip
 * label and we control the zoom level via the embed URL.
 */

export const INSTALLATION_MARKETS = {
  'Fort Liberty': { city: 'Fayetteville', state: 'NC', zip: '28310' },
  'Fort Bragg': { city: 'Fayetteville', state: 'NC', zip: '28310', alias: 'Fort Liberty' },
  'Fort Cavazos': { city: 'Killeen', state: 'TX', zip: '76544' },
  'Fort Hood': { city: 'Killeen', state: 'TX', zip: '76544', alias: 'Fort Cavazos' },
  'Fort Campbell': { city: 'Clarksville', state: 'TN', zip: '37042' },
  'Fort Carson': { city: 'Colorado Springs', state: 'CO', zip: '80913' },
  'Fort Drum': { city: 'Watertown', state: 'NY', zip: '13602' },
  'Fort Eisenhower': { city: 'Augusta', state: 'GA', zip: '30905' },
  'Fort Gordon': { city: 'Augusta', state: 'GA', zip: '30905', alias: 'Fort Eisenhower' },
  'Fort Gregg-Adams': { city: 'Petersburg', state: 'VA', zip: '23801' },
  'Fort Lee': { city: 'Petersburg', state: 'VA', zip: '23801', alias: 'Fort Gregg-Adams' },
  // 2023 Naming Commission renames - old names alias to new entries.
  'Fort Polk': { city: 'Leesville', state: 'LA', zip: '71459', alias: 'Fort Johnson' },
  'Fort Benning': { city: 'Columbus', state: 'GA', zip: '31905', alias: 'Fort Moore' },
  'Fort Rucker': { city: 'Daleville', state: 'AL', zip: '36362', alias: 'Fort Novosel' },
  // Fort Pickett -> Fort Barfoot (2023); Fort A.P. Hill -> Fort Walker (2023).
  'Fort Pickett': { city: 'Blackstone', state: 'VA', zip: '23824', alias: 'Fort Barfoot' },
  'Fort Barfoot': { city: 'Blackstone', state: 'VA', zip: '23824' },
  'Fort A.P. Hill': { city: 'Bowling Green', state: 'VA', zip: '22427', alias: 'Fort Walker' },
  'Fort Walker': { city: 'Bowling Green', state: 'VA', zip: '22427' },
  'Fort Jackson': { city: 'Columbia', state: 'SC', zip: '29207' },
  'Fort Leonard Wood': { city: 'Waynesville', state: 'MO', zip: '65583' },
  'Fort Moore': { city: 'Columbus', state: 'GA', zip: '31905' },
  'Fort Riley': { city: 'Junction City', state: 'KS', zip: '66442' },
  'Fort Stewart': { city: 'Hinesville', state: 'GA', zip: '31314' },
  'Joint Base Lewis-McChord': { city: 'Tacoma', state: 'WA', zip: '98433' },
  'Joint Base San Antonio': { city: 'San Antonio', state: 'TX', zip: '78234' },
  'Joint Base Langley-Eustis': { city: 'Hampton', state: 'VA', zip: '23665' },
  'Joint Base Andrews': { city: 'Camp Springs', state: 'MD', zip: '20762' },
  'Naval Station Norfolk': { city: 'Norfolk', state: 'VA', zip: '23511' },
  'Naval Base San Diego': { city: 'San Diego', state: 'CA', zip: '92136' },
  'Naval Station Mayport': { city: 'Jacksonville', state: 'FL', zip: '32228' },
  'NAS Pensacola': { city: 'Pensacola', state: 'FL', zip: '32508' },
  'Camp Lejeune': { city: 'Jacksonville', state: 'NC', zip: '28547' },
  'Marine Corps Base Camp Lejeune': { city: 'Jacksonville', state: 'NC', zip: '28547' },
  'Camp Pendleton': { city: 'Oceanside', state: 'CA', zip: '92055' },
  'MCAS Miramar': { city: 'San Diego', state: 'CA', zip: '92145' },
  'MCB Quantico': { city: 'Quantico', state: 'VA', zip: '22134' },
  'Eglin AFB': { city: 'Niceville', state: 'FL', zip: '32542' },
  'MacDill AFB': { city: 'Tampa', state: 'FL', zip: '33621' },
  'Tinker AFB': { city: 'Oklahoma City', state: 'OK', zip: '73145' },
  'Wright-Patterson AFB': { city: 'Dayton', state: 'OH', zip: '45433' },
  'Nellis AFB': { city: 'Las Vegas', state: 'NV', zip: '89191' },
  'Travis AFB': { city: 'Fairfield', state: 'CA', zip: '94535' },
  'Peterson SFB': { city: 'Colorado Springs', state: 'CO', zip: '80914' },
  'Schriever SFB': { city: 'Colorado Springs', state: 'CO', zip: '80912' },
  'Vandenberg SFB': { city: 'Lompoc', state: 'CA', zip: '93437' },
  'Camp Humphreys': { city: 'Pyeongtaek', state: 'South Korea', zip: '17977' },
  'Ramstein AB': { city: 'Ramstein-Miesenbach', state: 'Germany', zip: '66877' },
  'Yokota AB': { city: 'Fussa', state: 'Japan', zip: '197-0001' },
  'Kadena AB': { city: 'Okinawa', state: 'Japan', zip: '96368' },
  'Fort Novosel': { city: 'Daleville', state: 'AL', zip: '36362' },
  'Redstone Arsenal': { city: 'Huntsville', state: 'AL', zip: '35898' },
  'Maxwell AFB': { city: 'Montgomery', state: 'AL', zip: '36112' },
  'Fort Huachuca': { city: 'Sierra Vista', state: 'AZ', zip: '85613' },
  'MCAS Yuma': { city: 'Yuma', state: 'AZ', zip: '85365' },
  'Yuma Proving Ground': { city: 'Yuma', state: 'AZ', zip: '85365' },
  'Beale AFB': { city: 'Marysville', state: 'CA', zip: '95903' },
  'Fort Irwin': { city: 'Barstow', state: 'CA', zip: '92310' },
  'MCRD San Diego': { city: 'San Diego', state: 'CA', zip: '92140' },
  'NAS Lemoore': { city: 'Lemoore', state: 'CA', zip: '93246' },
  'Naval Base Ventura County': { city: 'Port Hueneme', state: 'CA', zip: '93043' },
  'Presidio of Monterey': { city: 'Monterey', state: 'CA', zip: '93944' },
  'Coast Guard Base Alameda': { city: 'Alameda', state: 'CA', zip: '94501' },
  'Buckley SFB': { city: 'Aurora', state: 'CO', zip: '80011' },
  'NAS Key West': { city: 'Key West', state: 'FL', zip: '33040' },
  'Patrick SFB': { city: 'Cocoa Beach', state: 'FL', zip: '32925' },
  'Tyndall AFB': { city: 'Panama City', state: 'FL', zip: '32403' },
  'USAG Miami': { city: 'Doral', state: 'FL', zip: '33172' },
  'Coast Guard Air Station Clearwater': { city: 'Clearwater', state: 'FL', zip: '33762' },
  'Coast Guard Air Station Miami': { city: 'Opa-locka', state: 'FL', zip: '33054' },
  'Robins AFB': { city: 'Warner Robins', state: 'GA', zip: '31098' },
  'MCB Hawaii': { city: 'Kaneohe', state: 'HI', zip: '96863' },
  'Schofield Barracks': { city: 'Wahiawa', state: 'HI', zip: '96857' },
  'Fort Shafter': { city: 'Honolulu', state: 'HI', zip: '96858' },
  'Coast Guard Air Station Barbers Point': { city: 'Kapolei', state: 'HI', zip: '96707' },
  'Mountain Home AFB': { city: 'Mountain Home', state: 'ID', zip: '83648' },
  'Fort Knox': { city: 'Radcliff', state: 'KY', zip: '40121' },
  'Fort Johnson': { city: 'Leesville', state: 'LA', zip: '71459' },
  'Aberdeen Proving Ground': { city: 'Aberdeen', state: 'MD', zip: '21005' },
  'Fort Detrick': { city: 'Frederick', state: 'MD', zip: '21702' },
  'Fort Meade': { city: 'Odenton', state: 'MD', zip: '20755' },
  'NAS Patuxent River': { city: 'Lexington Park', state: 'MD', zip: '20653' },
  'Detroit Arsenal': { city: 'Warren', state: 'MI', zip: '48397' },
  'Columbus AFB': { city: 'Columbus', state: 'MS', zip: '39710' },
  'NAS Fallon': { city: 'Fallon', state: 'NV', zip: '89496' },
  'Cannon AFB': { city: 'Clovis', state: 'NM', zip: '88103' },
  'Holloman AFB': { city: 'Alamogordo', state: 'NM', zip: '88330' },
  'Kirtland AFB': { city: 'Albuquerque', state: 'NM', zip: '87117' },
  'White Sands Missile Range': { city: 'White Sands Missile Range', state: 'NM', zip: '88002' },
  'Fort Hamilton': { city: 'Brooklyn', state: 'NY', zip: '11252' },
  'West Point': { city: 'West Point', state: 'NY', zip: '10996' },
  'Grand Forks AFB': { city: 'Grand Forks', state: 'ND', zip: '58205' },
  'MCAS New River': { city: 'Jacksonville', state: 'NC', zip: '28540' },
  'Pope Army Airfield': { city: 'Fayetteville', state: 'NC', zip: '28308' },
  'Seymour Johnson AFB': { city: 'Goldsboro', state: 'NC', zip: '27531' },
  'Coast Guard Base Elizabeth City': { city: 'Elizabeth City', state: 'NC', zip: '27909' },
  'Altus AFB': { city: 'Altus', state: 'OK', zip: '73523' },
  'Fort Sill': { city: 'Lawton', state: 'OK', zip: '73503' },
  'Vance AFB': { city: 'Enid', state: 'OK', zip: '73705' },
  'Fort Buchanan': { city: 'San Juan', state: 'PR', zip: '00934' },
  'Naval Station Newport': { city: 'Newport', state: 'RI', zip: '02841' },
  'MCAS Beaufort': { city: 'Beaufort', state: 'SC', zip: '29904' },
  'MCRD Parris Island': { city: 'Beaufort', state: 'SC', zip: '29905' },
  'Goodfellow AFB': { city: 'San Angelo', state: 'TX', zip: '76908' },
  'Laughlin AFB': { city: 'Del Rio', state: 'TX', zip: '78843' },
  'NAS Corpus Christi': { city: 'Corpus Christi', state: 'TX', zip: '78419' },
  'NAS Kingsville': { city: 'Kingsville', state: 'TX', zip: '78363' },
  'Sheppard AFB': { city: 'Wichita Falls', state: 'TX', zip: '76311' },
  'Fort Belvoir': { city: 'Fort Belvoir', state: 'VA', zip: '22060' },
  'Fort Myer': { city: 'Arlington', state: 'VA', zip: '22211' },
  'Joint Base Myer-Henderson Hall': { city: 'Arlington', state: 'VA', zip: '22211' },
  'NAS Oceana': { city: 'Virginia Beach', state: 'VA', zip: '23460' },
  'Coast Guard Base Portsmouth': { city: 'Portsmouth', state: 'VA', zip: '23703' },
  'NSA Washington': { city: 'Washington', state: 'DC', zip: '20374' },
  'NAS Whidbey Island': { city: 'Oak Harbor', state: 'WA', zip: '98278' },
  'Naval Station Everett': { city: 'Everett', state: 'WA', zip: '98207' },
  'Naval Base Kitsap': { city: 'Bremerton', state: 'WA', zip: '98314' },
  'Coast Guard Base Seattle': { city: 'Seattle', state: 'WA', zip: '98134' },
  'Fort Greely': { city: 'Delta Junction', state: 'AK', zip: '99731' },
  'Fort Wainwright': { city: 'Fairbanks', state: 'AK', zip: '99703' },
  'Joint Base Elmendorf-Richardson': { city: 'Anchorage', state: 'AK', zip: '99506' },
  'Coast Guard Base Kodiak': { city: 'Kodiak', state: 'AK', zip: '99619' },
  'Coast Guard Training Center Cape May': { city: 'Cape May', state: 'NJ', zip: '08204' },
  'Fort Leavenworth': { city: 'Leavenworth', state: 'KS', zip: '66027' },
  'McConnell AFB': { city: 'Wichita', state: 'KS', zip: '67221' },
  'Offutt AFB': { city: 'Bellevue', state: 'NE', zip: '68113' },
  'Minot AFB': { city: 'Minot', state: 'ND', zip: '58704' },
  'Ellsworth AFB': { city: 'Rapid City', state: 'SD', zip: '57706' },
  'Malmstrom AFB': { city: 'Great Falls', state: 'MT', zip: '59402' },
  'Hill AFB': { city: 'Ogden', state: 'UT', zip: '84056' },
  'Fairchild AFB': { city: 'Spokane', state: 'WA', zip: '99011' },
  'Barksdale AFB': { city: 'Bossier City', state: 'LA', zip: '71110' },
  'Keesler AFB': { city: 'Biloxi', state: 'MS', zip: '39534' },
  'Little Rock AFB': { city: 'Jacksonville', state: 'AR', zip: '72099' },
  'Scott AFB': { city: "O'Fallon", state: 'IL', zip: '62225' },
  'Luke AFB': { city: 'Glendale', state: 'AZ', zip: '85309' },
  'Davis-Monthan AFB': { city: 'Tucson', state: 'AZ', zip: '85707' },
  'Moody AFB': { city: 'Valdosta', state: 'GA', zip: '31699' },
  'Shaw AFB': { city: 'Sumter', state: 'SC', zip: '29152' },
  'Whiteman AFB': { city: 'Knob Noster', state: 'MO', zip: '65336' },
  'Dyess AFB': { city: 'Abilene', state: 'TX', zip: '79607' },
  'Hurlburt Field': { city: 'Fort Walton Beach', state: 'FL', zip: '32544' },
  'NAS Jacksonville': { city: 'Jacksonville', state: 'FL', zip: '32212' },
  'Naval Station Great Lakes': { city: 'Great Lakes', state: 'IL', zip: '60088' },
  'Fort Sam Houston': { city: 'San Antonio', state: 'TX', zip: '78234' },
  'Fort Bliss': { city: 'El Paso', state: 'TX', zip: '79916' },
  'USAG Stuttgart': { city: 'APO', state: 'AE', zip: '09154' },
  'USAG Wiesbaden': { city: 'APO', state: 'AE', zip: '09096' },
  'USAG Bavaria': { city: 'APO', state: 'AE', zip: '09114' },
  'USAG Ansbach': { city: 'APO', state: 'AE', zip: '09177' },
  'USAG Italy Vicenza': { city: 'APO', state: 'AE', zip: '09630' },
  'Camp Bondsteel': { city: 'APO', state: 'AE', zip: '09340' },
  'Naval Station Rota': { city: 'FPO', state: 'AE', zip: '09645' },
  'Spangdahlem AB': { city: 'APO', state: 'AE', zip: '09126' },
  'Incirlik AB': { city: 'APO', state: 'AE', zip: '09824' },
  'Aviano AB': { city: 'APO', state: 'AE', zip: '09604' },
  'Lajes Field': { city: 'APO', state: 'AE', zip: '09720' },
  'RAF Lakenheath': { city: 'APO', state: 'AE', zip: '09464' },
  'RAF Mildenhall': { city: 'APO', state: 'AE', zip: '09459' },
  'RAF Alconbury': { city: 'APO', state: 'AE', zip: '09469' },
  'Al Udeid AB': { city: 'APO', state: 'AE', zip: '09309' },
  'Al Dhafra AB': { city: 'APO', state: 'AE', zip: '09898' },
  'Misawa AB': { city: 'APO', state: 'AP', zip: '96319' },
  'MCAS Iwakuni': { city: 'FPO', state: 'AP', zip: '96310' },
  'Camp Foster': { city: 'FPO', state: 'AP', zip: '96373' },
  'Osan AB': { city: 'APO', state: 'AP', zip: '96266' },
  'Kunsan AB': { city: 'APO', state: 'AP', zip: '96264' },
  'Naval Station Guam': { city: 'FPO', state: 'AP', zip: '96540' },
  'Andersen AFB': { city: 'APO', state: 'AP', zip: '96543' },

  // ── ARMY RESERVE ──────────────────────────────────────────────────────
  // Public city/state/zip from army.mil / usar.army.mil installation pages.
  'Fort McCoy': { city: 'Sparta', state: 'WI', zip: '54656' },
  'Camp Atterbury': { city: 'Edinburgh', state: 'IN', zip: '46124' },
  'Camp Parks (Parks RFTA)': { city: 'Dublin', state: 'CA', zip: '94568' },
  'Devens Reserve Forces Training Area': { city: 'Devens', state: 'MA', zip: '01434' },
  '88th Readiness Division HQ Fort McCoy': { city: 'Sparta', state: 'WI', zip: '54656' },
  '99th Readiness Division HQ Fort Dix': { city: 'Joint Base McGuire-Dix-Lakehurst', state: 'NJ', zip: '08640' },
  '63rd Readiness Division HQ Mountain View': { city: 'Mountain View', state: 'CA', zip: '94043' },
  '81st Readiness Division HQ Fort Jackson': { city: 'Columbia', state: 'SC', zip: '29207' },

  // ── ARMY NATIONAL GUARD · MAJOR TRAINING CENTERS ──────────────────────
  // Public addresses from nationalguard.mil and state ARNG sites.
  'Camp Shelby Joint Forces Training Center': { city: 'Hattiesburg', state: 'MS', zip: '39407' },
  'Camp Williams (Utah NG)': { city: 'Bluffdale', state: 'UT', zip: '84065' },
  'Camp Robinson': { city: 'North Little Rock', state: 'AR', zip: '72199' },
  'Camp Mabry (Texas Military Forces HQ)': { city: 'Austin', state: 'TX', zip: '78763' },
  'Camp Murray (Washington NG)': { city: 'Tacoma', state: 'WA', zip: '98430' },
  'Camp Roberts': { city: 'San Miguel', state: 'CA', zip: '93451' },
  'Camp Ripley': { city: 'Little Falls', state: 'MN', zip: '56345' },
  'Camp Grayling Joint Maneuver Training Center': { city: 'Grayling', state: 'MI', zip: '49739' },
  'Camp Dawson': { city: 'Kingwood', state: 'WV', zip: '26537' },
  'Camp Dodge': { city: 'Johnston', state: 'IA', zip: '50131' },
  'Camp Beauregard': { city: 'Pineville', state: 'LA', zip: '71360' },
  'Camp Edwards (Joint Base Cape Cod)': { city: 'Bourne', state: 'MA', zip: '02542' },
  'Camp Smith Training Site': { city: 'Cortlandt Manor', state: 'NY', zip: '10567' },
  'Camp Blanding Joint Training Center': { city: 'Starke', state: 'FL', zip: '32091' },
  'Fort Indiantown Gap': { city: 'Annville', state: 'PA', zip: '17003' },
  'Gowen Field': { city: 'Boise', state: 'ID', zip: '83705' },
  'McEntire Joint National Guard Base': { city: 'Eastover', state: 'SC', zip: '29044' },
  'Volk Field Combat Readiness Training Center': { city: 'Camp Douglas', state: 'WI', zip: '54618' },

  // ── AIR FORCE RESERVE · HOST BASES ─────────────────────────────────────
  // Public addresses from afrc.af.mil installations directory.
  'Westover Air Reserve Base': { city: 'Chicopee', state: 'MA', zip: '01022' },
  'March Air Reserve Base': { city: 'Riverside', state: 'CA', zip: '92518' },
  'Dobbins Air Reserve Base': { city: 'Marietta', state: 'GA', zip: '30069' },
  'Youngstown Air Reserve Station': { city: 'Vienna', state: 'OH', zip: '44473' },
  'Pittsburgh Air Reserve Station': { city: 'Coraopolis', state: 'PA', zip: '15108' },
  'Niagara Falls Air Reserve Station': { city: 'Niagara Falls', state: 'NY', zip: '14304' },
  'Grissom Air Reserve Base': { city: 'Peru', state: 'IN', zip: '46971' },
  'Homestead Air Reserve Base': { city: 'Homestead', state: 'FL', zip: '33039' },

  // ── AIR NATIONAL GUARD · WING HOSTS ────────────────────────────────────
  // Public airfield addresses from ang.af.mil wing pages.
  'Barnes Air National Guard Base': { city: 'Westfield', state: 'MA', zip: '01085' },
  'Bradley Air National Guard Base': { city: 'East Granby', state: 'CT', zip: '06026' },
  'Burlington Air National Guard Base': { city: 'South Burlington', state: 'VT', zip: '05403' },
  'Fresno Air National Guard Base': { city: 'Fresno', state: 'CA', zip: '93727' },
  'Joe Foss Field': { city: 'Sioux Falls', state: 'SD', zip: '57104' },
  'Otis Air National Guard Base': { city: 'Mashpee', state: 'MA', zip: '02649' },
  'Selfridge Air National Guard Base': { city: 'Harrison Township', state: 'MI', zip: '48045' },
  'Springfield Air National Guard Base': { city: 'Springfield', state: 'IL', zip: '62707' },
  'Tulsa Air National Guard Base': { city: 'Tulsa', state: 'OK', zip: '74115' },
  'Sioux City Air National Guard Base': { city: 'Sioux City', state: 'IA', zip: '51110' },
  'Forbes Field Air National Guard Base': { city: 'Topeka', state: 'KS', zip: '66619' },
  'Truax Field Air National Guard Base': { city: 'Madison', state: 'WI', zip: '53704' },
  'Hancock Field Air National Guard Base': { city: 'Syracuse', state: 'NY', zip: '13211' },
  'Pease Air National Guard Base': { city: 'Newington', state: 'NH', zip: '03801' },
  'Atlantic City Air National Guard Base': { city: 'Egg Harbor Township', state: 'NJ', zip: '08234' },
  'Reno-Tahoe Air National Guard Base': { city: 'Reno', state: 'NV', zip: '89502' },
  'Klamath Falls Air National Guard Base': { city: 'Klamath Falls', state: 'OR', zip: '97603' },
  'Portland Air National Guard Base': { city: 'Portland', state: 'OR', zip: '97218' },
  'Camp Murray (ANG HQ)': { city: 'Tacoma', state: 'WA', zip: '98430' },
  'Sumpter Smith Air National Guard Base': { city: 'Birmingham', state: 'AL', zip: '35217' },
  'Montgomery Regional Air National Guard': { city: 'Montgomery', state: 'AL', zip: '36108' },
  'New Castle Air National Guard Base': { city: 'New Castle', state: 'DE', zip: '19720' },

  // ── NAVY RESERVE · MAJOR CENTERS ───────────────────────────────────────
  // Public addresses from navyreserve.navy.mil.
  'NAS Joint Reserve Base Fort Worth': { city: 'Fort Worth', state: 'TX', zip: '76127' },
  'NAS Joint Reserve Base New Orleans': { city: 'Belle Chasse', state: 'LA', zip: '70143' },
  'NOSC Phoenix': { city: 'Phoenix', state: 'AZ', zip: '85008' },
  'NOSC Denver': { city: 'Aurora', state: 'CO', zip: '80011' },
  'NOSC Jacksonville': { city: 'Jacksonville', state: 'FL', zip: '32212' },
  'NOSC Minneapolis': { city: 'Bloomington', state: 'MN', zip: '55425' },

  // ── MARINE CORPS RESERVE ───────────────────────────────────────────────
  // Public addresses from marines.mil/forcesreserve.
  'Marine Forces Reserve HQ New Orleans': { city: 'New Orleans', state: 'LA', zip: '70146' },
  'MCRC Anacostia Annex': { city: 'Washington', state: 'DC', zip: '20373' },
  'MCRC Pasadena': { city: 'Pasadena', state: 'CA', zip: '91103' },
  'MCRC Twin Cities': { city: 'Minneapolis', state: 'MN', zip: '55450' },

  // ── HIGH-PRIORITY MISSING ACTIVE-DUTY ENTRIES ─────────────────────────
  // Surfaced by the content audit. All city/state/zip from public DoD
  // sources. Aliases where station-list name differs from market key.
  'Fort George G. Meade': { city: 'Odenton', state: 'MD', zip: '20755', alias: 'Fort Meade' },
  'West Point (USMA)': { city: 'West Point', state: 'NY', zip: '10996', alias: 'West Point' },
  'USAG Humphreys': { city: 'Pyeongtaek', state: 'South Korea', zip: '17977', alias: 'Camp Humphreys' },
  'USAG Daegu': { city: 'Daegu', state: 'South Korea', zip: '41940' },
  'USAG Yongsan-Casey': { city: 'Dongducheon', state: 'South Korea', zip: '11186' },
  'Camp Walker': { city: 'Daegu', state: 'South Korea', zip: '41940' },
  'Camp Red Cloud': { city: 'Uijeongbu', state: 'South Korea', zip: '11617' },
  'USAG Japan (Camp Zama)': { city: 'Zama', state: 'Japan', zip: '252-8511' },
  'Torii Station (USAG Okinawa)': { city: 'Yomitan', state: 'Japan', zip: '904-0301' },
  'USAG Bavaria (Grafenwöhr)': { city: 'Grafenwöhr', state: 'Germany', zip: '92655', alias: 'USAG Bavaria' },
  'USAG Rheinland-Pfalz (Kaiserslautern)': { city: 'Kaiserslautern', state: 'Germany', zip: '67663' },
  'USAG Wiesbaden HQ': { city: 'Wiesbaden', state: 'Germany', zip: '65205', alias: 'USAG Wiesbaden' },
  'Picatinny Arsenal': { city: 'Rockaway Township', state: 'NJ', zip: '07806' },
  'Carlisle Barracks': { city: 'Carlisle', state: 'PA', zip: '17013' },
  'Anniston Army Depot': { city: 'Anniston', state: 'AL', zip: '36201' },
  'Tobyhanna Army Depot': { city: 'Tobyhanna', state: 'PA', zip: '18466' },
  'Red River Army Depot': { city: 'Texarkana', state: 'TX', zip: '75507' },
  'McAlester Army Ammunition Plant': { city: 'McAlester', state: 'OK', zip: '74501' },
  'Natick Soldier Systems Center': { city: 'Natick', state: 'MA', zip: '01760' },
  'Dugway Proving Ground': { city: 'Dugway', state: 'UT', zip: '84022' },
  'Hunter Army Airfield': { city: 'Savannah', state: 'GA', zip: '31409' },
  'Pine Bluff Arsenal': { city: 'Pine Bluff', state: 'AR', zip: '71602' },
  'Rock Island Arsenal': { city: 'Rock Island', state: 'IL', zip: '61299' },
  'Camp Parks': { city: 'Dublin', state: 'CA', zip: '94568', alias: 'Camp Parks (Parks RFTA)' },
  'Fort Hunter Liggett': { city: 'Jolon', state: 'CA', zip: '93928' },
  'Presidio of Monterey (DLI)': { city: 'Monterey', state: 'CA', zip: '93944', alias: 'Presidio of Monterey' },
  'Fort Richardson': { city: 'Anchorage', state: 'AK', zip: '99505', alias: 'Joint Base Elmendorf-Richardson' },
  'Fort Myer (JBM-HH)': { city: 'Arlington', state: 'VA', zip: '22211', alias: 'Joint Base Myer-Henderson Hall' },

  // ── PRIORITY BATCH 2 · OCONUS + LONG-FORM NAVY NAMES ──────────────────
  // Surfaced by the cross-reference audit. Mostly long-form names
  // that should resolve to existing short-form entries.
  'USAG Baumholder': { city: 'Baumholder', state: 'Germany', zip: '55774' },
  'USAG Hohenfels': { city: 'Hohenfels', state: 'Germany', zip: '92366' },
  'USAG Garmisch': { city: 'Garmisch-Partenkirchen', state: 'Germany', zip: '82467' },
  'USAG Belgium (SHAPE)': { city: 'Mons', state: 'Belgium', zip: '7010' },
  'USAG BENELUX-Brussels': { city: 'Brussels', state: 'Belgium', zip: '1000' },
  'USAG BENELUX Brunssum': { city: 'Brunssum', state: 'Netherlands', zip: '6440' },
  'USAG Italy (Vicenza)': { city: 'Vicenza', state: 'Italy', zip: '36100', alias: 'USAG Italy Vicenza' },
  'USAG Italy (Livorno)': { city: 'Livorno', state: 'Italy', zip: '57124' },
  'USAG Poland': { city: 'Powidz', state: 'Poland', zip: '62-430' },

  // Long-form Navy names aliased to existing short-form market entries
  'Naval Submarine Base New London': { city: 'Groton', state: 'CT', zip: '06349' },
  'Naval Air Station Jacksonville': { city: 'Jacksonville', state: 'FL', zip: '32212', alias: 'NAS Jacksonville' },
  'Naval Air Station Key West': { city: 'Key West', state: 'FL', zip: '33040', alias: 'NAS Key West' },
  'Naval Air Station Pensacola': { city: 'Pensacola', state: 'FL', zip: '32508', alias: 'NAS Pensacola' },
  'Naval Air Station Whiting Field': { city: 'Milton', state: 'FL', zip: '32570' },
  'Naval Support Activity Orlando': { city: 'Orlando', state: 'FL', zip: '32826' },
  'Naval Support Activity Panama City': { city: 'Panama City Beach', state: 'FL', zip: '32407' },
  'Naval Submarine Base Kings Bay': { city: 'Kings Bay', state: 'GA', zip: '31547' },
  'Naval Support Activity Crane': { city: 'Crane', state: 'IN', zip: '47522' },
  'NAS JRB New Orleans': { city: 'Belle Chasse', state: 'LA', zip: '70143', alias: 'NAS Joint Reserve Base New Orleans' },
  'Naval Air Station JRB New Orleans': { city: 'Belle Chasse', state: 'LA', zip: '70143', alias: 'NAS Joint Reserve Base New Orleans' },
  'Portsmouth Naval Shipyard': { city: 'Kittery', state: 'ME', zip: '03904' },
  'Naval Air Station Patuxent River': { city: 'Lexington Park', state: 'MD', zip: '20653', alias: 'NAS Patuxent River' },
  'Naval Support Activity Annapolis (USNA)': { city: 'Annapolis', state: 'MD', zip: '21402' },
  'Naval Support Activity Bethesda': { city: 'Bethesda', state: 'MD', zip: '20889' },
  'Naval Support Activity South Potomac': { city: 'Dahlgren', state: 'VA', zip: '22448' },
  'Naval Air Station Corpus Christi': { city: 'Corpus Christi', state: 'TX', zip: '78419', alias: 'NAS Corpus Christi' },
  'Naval Air Station Kingsville': { city: 'Kingsville', state: 'TX', zip: '78363', alias: 'NAS Kingsville' },
  'Naval Air Station Fallon': { city: 'Fallon', state: 'NV', zip: '89496', alias: 'NAS Fallon' },
  'Naval Air Station Lemoore': { city: 'Lemoore', state: 'CA', zip: '93246', alias: 'NAS Lemoore' },
  'Naval Air Station Whidbey Island': { city: 'Oak Harbor', state: 'WA', zip: '98278', alias: 'NAS Whidbey Island' },
  'Naval Air Station Oceana': { city: 'Virginia Beach', state: 'VA', zip: '23460', alias: 'NAS Oceana' },
  'Naval Air Station Sigonella': { city: 'Sigonella', state: 'Italy', zip: '95040' },
  'Naval Air Station Rota': { city: 'Rota', state: 'Spain', zip: '11530', alias: 'Naval Station Rota' },
  'Naval Air Facility Atsugi': { city: 'Atsugi', state: 'Japan', zip: '252-1101' },
  'Naval Support Facility Diego Garcia': { city: 'Diego Garcia', state: 'British Indian Ocean Territory', zip: '' },
};

const clean = value => String(value || '').trim();
const normalize = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function profileInstallationName(profile) {
  const raw = clean(profile?.gainingInstallation || profile?.installation || profile?.base);
  return raw ? raw.split(',')[0].trim() : '';
}

export function findKnownMarket(input) {
  const target = normalize(input);
  if (!target) return null;
  const direct = Object.entries(INSTALLATION_MARKETS).find(([name]) => normalize(name) === target);
  if (direct) return { installation: direct[0], ...direct[1] };
  const fuzzy = Object.entries(INSTALLATION_MARKETS).find(([name]) => {
    const candidate = normalize(name);
    return target.includes(candidate) || candidate.includes(target);
  });
  return fuzzy ? { installation: fuzzy[0], ...fuzzy[1] } : null;
}

/**
 * Resolves a profile (or manual override) to a market record with the
 * canonical installation name and a "City, ST ZIP" label. Falls back to
 * the raw input when no market entry matches.
 */
export function resolveMarket(profile, manual = '') {
  const selected = clean(manual) || profileInstallationName(profile);
  const known = findKnownMarket(selected);
  if (known) {
    const installation = known.alias || known.installation;
    const market = known.alias ? findKnownMarket(known.alias) || known : known;
    const location = [market.city, market.state, market.zip].filter(Boolean).join(', ');
    return {
      installation,
      city: market.city,
      state: market.state,
      zip: market.zip,
      location,
      label: `${installation} - ${location}`,
      query: `${installation} ${location}`,
      matched: true,
    };
  }
  return {
    installation: selected || 'selected installation',
    city: '',
    state: '',
    zip: '',
    location: selected || '',
    label: selected || 'Enter gaining installation, address, city, or ZIP',
    query: selected || 'military housing',
    matched: false,
  };
}
