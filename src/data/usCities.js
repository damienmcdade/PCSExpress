/*
 * Curated US city + state list for the location-autofill typeahead.
 *
 * Factual reference data (city name + USPS state abbreviation) covering the
 * most populous US cities plus state capitals and military-relevant towns —
 * enough for fast "City, ST" autofill without a network geocoding call (keeps
 * the app offline-capable and private). The input is NOT restricted to this
 * list; a member can still type any location. Lazy-loaded by the
 * LocationAutocomplete component so it never weighs down the eager bundle.
 *
 * Stored as "City, ST" strings.
 */

export const US_CITIES = [
  // AL
  'Birmingham, AL','Montgomery, AL','Huntsville, AL','Mobile, AL','Tuscaloosa, AL','Auburn, AL','Dothan, AL','Enterprise, AL',
  // AK
  'Anchorage, AK','Fairbanks, AK','Juneau, AK',
  // AZ
  'Phoenix, AZ','Tucson, AZ','Mesa, AZ','Chandler, AZ','Scottsdale, AZ','Glendale, AZ','Gilbert, AZ','Tempe, AZ','Sierra Vista, AZ','Yuma, AZ','Flagstaff, AZ',
  // AR
  'Little Rock, AR','Fort Smith, AR','Fayetteville, AR','Jacksonville, AR',
  // CA
  'Los Angeles, CA','San Diego, CA','San Jose, CA','San Francisco, CA','Fresno, CA','Sacramento, CA','Long Beach, CA','Oakland, CA','Bakersfield, CA','Anaheim, CA','Santa Ana, CA','Riverside, CA','Stockton, CA','Irvine, CA','Chula Vista, CA','Fremont, CA','San Bernardino, CA','Modesto, CA','Oceanside, CA','Fontana, CA','Santa Clarita, CA','Oxnard, CA','Fairfield, CA','Vacaville, CA','Monterey, CA','Barstow, CA','Twentynine Palms, CA','Lemoore, CA','Victorville, CA',
  // CO
  'Denver, CO','Colorado Springs, CO','Aurora, CO','Fort Collins, CO','Lakewood, CO','Pueblo, CO','Boulder, CO','Centennial, CO',
  // CT
  'Bridgeport, CT','New Haven, CT','Hartford, CT','Stamford, CT','Groton, CT',
  // DE
  'Wilmington, DE','Dover, DE','Newark, DE',
  // DC
  'Washington, DC',
  // FL
  'Jacksonville, FL','Miami, FL','Tampa, FL','Orlando, FL','St. Petersburg, FL','Tallahassee, FL','Fort Lauderdale, FL','Pensacola, FL','Cape Coral, FL','Gainesville, FL','Hialeah, FL','Port St. Lucie, FL','Clearwater, FL','Panama City, FL','Fort Walton Beach, FL','Key West, FL','Destin, FL','Jacksonville Beach, FL',
  // GA
  'Atlanta, GA','Augusta, GA','Columbus, GA','Savannah, GA','Athens, GA','Macon, GA','Hinesville, GA','Warner Robins, GA','Valdosta, GA','Marietta, GA',
  // HI
  'Honolulu, HI','Pearl City, HI','Hilo, HI','Kailua, HI','Kapolei, HI','Waipahu, HI',
  // ID
  'Boise, ID','Meridian, ID','Nampa, ID','Idaho Falls, ID','Mountain Home, ID',
  // IL
  'Chicago, IL','Aurora, IL','Naperville, IL','Joliet, IL','Rockford, IL','Springfield, IL','Peoria, IL','Champaign, IL','Belleville, IL',
  // IN
  'Indianapolis, IN','Fort Wayne, IN','Evansville, IN','South Bend, IN','Bloomington, IN','Jeffersonville, IN',
  // IA
  'Des Moines, IA','Cedar Rapids, IA','Davenport, IA','Sioux City, IA','Iowa City, IA',
  // KS
  'Wichita, KS','Overland Park, KS','Kansas City, KS','Topeka, KS','Olathe, KS','Junction City, KS','Leavenworth, KS','Manhattan, KS',
  // KY
  'Louisville, KY','Lexington, KY','Bowling Green, KY','Owensboro, KY','Elizabethtown, KY','Radcliff, KY',
  // LA
  'New Orleans, LA','Baton Rouge, LA','Shreveport, LA','Lafayette, LA','Lake Charles, LA','Bossier City, LA','Leesville, LA',
  // ME
  'Portland, ME','Bangor, ME','Augusta, ME',
  // MD
  'Baltimore, MD','Frederick, MD','Rockville, MD','Annapolis, MD','Bethesda, MD','Aberdeen, MD','Waldorf, MD','Lexington Park, MD',
  // MA
  'Boston, MA','Worcester, MA','Springfield, MA','Cambridge, MA','Lowell, MA','Quincy, MA','Fall River, MA',
  // MI
  'Detroit, MI','Grand Rapids, MI','Warren, MI','Ann Arbor, MI','Lansing, MI','Flint, MI','Sterling Heights, MI',
  // MN
  'Minneapolis, MN','Saint Paul, MN','Rochester, MN','Duluth, MN','Bloomington, MN','Saint Cloud, MN',
  // MS
  'Jackson, MS','Gulfport, MS','Biloxi, MS','Hattiesburg, MS','Southaven, MS','Meridian, MS','Columbus, MS',
  // MO
  'Kansas City, MO','St. Louis, MO','Springfield, MO','Columbia, MO','Independence, MO','Saint Robert, MO','Waynesville, MO',
  // MT
  'Billings, MT','Missoula, MT','Great Falls, MT','Bozeman, MT','Helena, MT',
  // NE
  'Omaha, NE','Lincoln, NE','Bellevue, NE',
  // NV
  'Las Vegas, NV','Henderson, NV','Reno, NV','North Las Vegas, NV','Sparks, NV','Carson City, NV',
  // NH
  'Manchester, NH','Nashua, NH','Concord, NH','Portsmouth, NH',
  // NJ
  'Newark, NJ','Jersey City, NJ','Paterson, NJ','Trenton, NJ','Edison, NJ','Atlantic City, NJ',
  // NM
  'Albuquerque, NM','Las Cruces, NM','Santa Fe, NM','Rio Rancho, NM','Roswell, NM','Clovis, NM','Alamogordo, NM',
  // NY
  'New York, NY','Buffalo, NY','Rochester, NY','Yonkers, NY','Syracuse, NY','Albany, NY','New Rochelle, NY','Watertown, NY','Niagara Falls, NY',
  // NC
  'Charlotte, NC','Raleigh, NC','Greensboro, NC','Durham, NC','Winston-Salem, NC','Fayetteville, NC','Wilmington, NC','Jacksonville, NC','Goldsboro, NC','Havelock, NC',
  // ND
  'Fargo, ND','Bismarck, ND','Grand Forks, ND','Minot, ND',
  // OH
  'Columbus, OH','Cleveland, OH','Cincinnati, OH','Toledo, OH','Akron, OH','Dayton, OH','Fairborn, OH',
  // OK
  'Oklahoma City, OK','Tulsa, OK','Norman, OK','Lawton, OK','Edmond, OK','Enid, OK','Altus, OK',
  // OR
  'Portland, OR','Salem, OR','Eugene, OR','Gresham, OR','Hillsboro, OR','Bend, OR',
  // PA
  'Philadelphia, PA','Pittsburgh, PA','Allentown, PA','Erie, PA','Harrisburg, PA','Scranton, PA','Carlisle, PA',
  // RI
  'Providence, RI','Warwick, RI','Cranston, RI','Newport, RI',
  // SC
  'Columbia, SC','Charleston, SC','North Charleston, SC','Greenville, SC','Myrtle Beach, SC','Sumter, SC','Beaufort, SC','Goose Creek, SC',
  // SD
  'Sioux Falls, SD','Rapid City, SD','Aberdeen, SD','Box Elder, SD',
  // TN
  'Nashville, TN','Memphis, TN','Knoxville, TN','Chattanooga, TN','Clarksville, TN','Murfreesboro, TN','Oak Ridge, TN',
  // TX
  'Houston, TX','San Antonio, TX','Dallas, TX','Austin, TX','Fort Worth, TX','El Paso, TX','Arlington, TX','Corpus Christi, TX','Plano, TX','Laredo, TX','Lubbock, TX','Garland, TX','Irving, TX','Killeen, TX','Frisco, TX','McKinney, TX','Waco, TX','Abilene, TX','Wichita Falls, TX','San Angelo, TX','Copperas Cove, TX','Harker Heights, TX','Universal City, TX','Del Rio, TX',
  // UT
  'Salt Lake City, UT','West Valley City, UT','Provo, UT','Ogden, UT','St. George, UT','Layton, UT',
  // VT
  'Burlington, VT','Montpelier, VT',
  // VA
  'Virginia Beach, VA','Norfolk, VA','Chesapeake, VA','Richmond, VA','Newport News, VA','Alexandria, VA','Hampton, VA','Roanoke, VA','Portsmouth, VA','Suffolk, VA','Arlington, VA','Fredericksburg, VA','Fort Belvoir, VA','Williamsburg, VA','Petersburg, VA','Hopewell, VA','Dahlgren, VA',
  // WA
  'Seattle, WA','Spokane, WA','Tacoma, WA','Vancouver, WA','Bellevue, WA','Everett, WA','Olympia, WA','Bremerton, WA','Lakewood, WA','Oak Harbor, WA','Spokane Valley, WA',
  // WV
  'Charleston, WV','Huntington, WV','Morgantown, WV',
  // WI
  'Milwaukee, WI','Madison, WI','Green Bay, WI','Kenosha, WI','Racine, WI','Appleton, WI',
  // WY
  'Cheyenne, WY','Casper, WY','Laramie, WY',
  // Territories
  'San Juan, PR','Bayamon, PR','Carolina, PR','Hagatna, GU','Tamuning, GU','Charlotte Amalie, VI',
];
