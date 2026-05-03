import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: null, iconRetinaUrl: null, shadowUrl: null });

// ─── Facility type definitions ─────────────────────────────────────────────
const FACILITY_TYPES = {
  gate:       { icon: '🚧', label: 'Gate / Entry Point',      color: '#E74C3C' },
  medical:    { icon: '🏥', label: 'Hospital / Medical',      color: '#27AE60' },
  commissary: { icon: '🛒', label: 'Commissary',              color: '#2980B9' },
  exchange:   { icon: '🏬', label: 'PX / BX / Exchange',      color: '#8E44AD' },
  chapel:     { icon: '⛪', label: 'Chapel',                  color: '#F39C12' },
  gym:        { icon: '💪', label: 'Fitness Center',          color: '#16A085' },
  housing:    { icon: '🏠', label: 'Housing Office',          color: '#D35400' },
  education:  { icon: '📚', label: 'Education Center',        color: '#2C3E50' },
  finance:    { icon: '🏦', label: 'Finance / Bank',          color: '#1ABC9C' },
  dining:     { icon: '🍽️', label: 'DFAC / Dining Facility',  color: '#C0392B' },
  gas:        { icon: '⛽', label: 'Shoppette / Gas',         color: '#7F8C8D' },
  visitor:    { icon: '🎫', label: 'Visitor Control',         color: '#3498DB' },
  legal:      { icon: '⚖️', label: 'Legal Assistance',        color: '#34495E' },
  recreation: { icon: '🎯', label: 'Recreation Center',       color: '#E67E22' },
  hq:         { icon: '⭐', label: 'Headquarters',            color: '#2C3E50' },
  childcare:  { icon: '🧒', label: 'Child Development',       color: '#E91E63' },
};

// ─── All military installations with center coords ─────────────────────────
export const ALL_BASES = [
  // ARMY · CONUS
  { name: 'Fort Liberty',                   state: 'NC', branch: 'Army',         lat: 35.1396, lng: -79.0059, zoom: 13 },
  { name: 'Fort Bragg',                     state: 'NC', branch: 'Army',         lat: 35.1396, lng: -79.0059, zoom: 13 },
  { name: 'Fort Campbell',                  state: 'KY', branch: 'Army',         lat: 36.6723, lng: -87.4702, zoom: 13 },
  { name: 'Fort Hood',                      state: 'TX', branch: 'Army',         lat: 31.1371, lng: -97.7862, zoom: 13 },
  { name: 'Fort Cavazos',                   state: 'TX', branch: 'Army',         lat: 31.1371, lng: -97.7862, zoom: 13 },
  { name: 'Joint Base Lewis-McChord',       state: 'WA', branch: 'Army',         lat: 47.1043, lng: -122.5774, zoom: 13 },
  { name: 'Fort Bliss',                     state: 'TX', branch: 'Army',         lat: 31.8138, lng: -106.4181, zoom: 12 },
  { name: 'Fort Carson',                    state: 'CO', branch: 'Army',         lat: 38.7399, lng: -104.7869, zoom: 13 },
  { name: 'Fort Stewart',                   state: 'GA', branch: 'Army',         lat: 31.8690, lng: -81.6085,  zoom: 13 },
  { name: 'Fort Drum',                      state: 'NY', branch: 'Army',         lat: 44.0534, lng: -75.7722,  zoom: 13 },
  { name: 'Fort Sill',                      state: 'OK', branch: 'Army',         lat: 34.6508, lng: -98.4042,  zoom: 13 },
  { name: 'Fort Moore',                     state: 'GA', branch: 'Army',         lat: 32.3629, lng: -84.9499,  zoom: 13 },
  { name: 'Fort Benning',                   state: 'GA', branch: 'Army',         lat: 32.3629, lng: -84.9499,  zoom: 13 },
  { name: 'Fort Wainwright',                state: 'AK', branch: 'Army',         lat: 64.8288, lng: -147.6448, zoom: 13 },
  { name: 'Fort Meade',                     state: 'MD', branch: 'Army',         lat: 39.1040, lng: -76.7307,  zoom: 13 },
  { name: 'Fort Knox',                      state: 'KY', branch: 'Army',         lat: 37.8958, lng: -85.9633,  zoom: 13 },
  { name: 'Fort Jackson',                   state: 'SC', branch: 'Army',         lat: 34.0149, lng: -80.9079,  zoom: 13 },
  { name: 'Fort Leonard Wood',              state: 'MO', branch: 'Army',         lat: 37.7283, lng: -92.1416,  zoom: 13 },
  { name: 'Fort Eisenhower',                state: 'GA', branch: 'Army',         lat: 33.4152, lng: -82.1534,  zoom: 13 },
  { name: 'Fort Gregg-Adams',               state: 'VA', branch: 'Army',         lat: 37.2351, lng: -77.3342,  zoom: 13 },
  { name: 'Fort Sam Houston',               state: 'TX', branch: 'Army',         lat: 29.4472, lng: -98.4394,  zoom: 13 },
  { name: 'Fort Hamilton',                  state: 'NY', branch: 'Army',         lat: 40.6060, lng: -74.0338,  zoom: 14 },
  { name: 'West Point',                     state: 'NY', branch: 'Army',         lat: 41.3912, lng: -73.9550,  zoom: 14 },
  { name: 'Fort Leavenworth',               state: 'KS', branch: 'Army',         lat: 39.3600, lng: -94.9213,  zoom: 13 },
  { name: 'Fort Novosel',                   state: 'AL', branch: 'Army',         lat: 31.3691, lng: -85.7130,  zoom: 13 },
  { name: 'Fort Rucker',                    state: 'AL', branch: 'Army',         lat: 31.3691, lng: -85.7130,  zoom: 13 },
  { name: 'Schofield Barracks',             state: 'HI', branch: 'Army',         lat: 21.4800, lng: -158.0600, zoom: 13 },
  { name: 'Fort Shafter',                   state: 'HI', branch: 'Army',         lat: 21.3400, lng: -157.9100, zoom: 14 },
  { name: 'Fort Myer',                      state: 'VA', branch: 'Army',         lat: 38.8793, lng: -77.0705,  zoom: 14 },
  { name: 'Fort Richardson',                state: 'AK', branch: 'Army',         lat: 61.2660, lng: -149.6774, zoom: 14 },
  // NAVY · CONUS
  { name: 'Naval Station Norfolk',          state: 'VA', branch: 'Navy',          lat: 36.9484, lng: -76.3290,  zoom: 13 },
  { name: 'Naval Base San Diego',           state: 'CA', branch: 'Navy',          lat: 32.6960, lng: -117.2073, zoom: 13 },
  { name: 'Naval Station Mayport',          state: 'FL', branch: 'Navy',          lat: 30.3944, lng: -81.4250,  zoom: 13 },
  { name: 'NAS Pensacola',                  state: 'FL', branch: 'Navy',          lat: 30.3520, lng: -87.3186,  zoom: 13 },
  { name: 'Naval Base Kitsap',              state: 'WA', branch: 'Navy',          lat: 47.5575, lng: -122.6321, zoom: 13 },
  { name: 'NAS Jacksonville',               state: 'FL', branch: 'Navy',          lat: 30.2206, lng: -81.6709,  zoom: 13 },
  { name: 'Naval Base Ventura County',      state: 'CA', branch: 'Navy',          lat: 34.1677, lng: -119.1127, zoom: 13 },
  { name: 'Joint Base Pearl Harbor-Hickam', state: 'HI', branch: 'Navy',          lat: 21.3500, lng: -157.9500, zoom: 13 },
  { name: 'NAS Whidbey Island',             state: 'WA', branch: 'Navy',          lat: 48.3513, lng: -122.6554, zoom: 13 },
  { name: 'Naval Station Everett',          state: 'WA', branch: 'Navy',          lat: 47.9920, lng: -122.2268, zoom: 13 },
  { name: 'NAS Corpus Christi',             state: 'TX', branch: 'Navy',          lat: 27.6926, lng: -97.2867,  zoom: 13 },
  { name: 'NAS Oceana',                     state: 'VA', branch: 'Navy',          lat: 36.8207, lng: -76.0358,  zoom: 13 },
  // MARINE CORPS · CONUS
  { name: 'Camp Pendleton',                 state: 'CA', branch: 'Marine Corps',  lat: 33.2219, lng: -117.3853, zoom: 12 },
  { name: 'Marine Corps Base Camp Lejeune', state: 'NC', branch: 'Marine Corps',  lat: 34.6879, lng: -77.3459,  zoom: 12 },
  { name: 'MCAS Cherry Point',              state: 'NC', branch: 'Marine Corps',  lat: 34.9005, lng: -76.8798,  zoom: 13 },
  { name: 'MCAS Miramar',                   state: 'CA', branch: 'Marine Corps',  lat: 32.8680, lng: -117.1432, zoom: 13 },
  { name: 'MCB Quantico',                   state: 'VA', branch: 'Marine Corps',  lat: 38.5207, lng: -77.3109,  zoom: 13 },
  { name: 'MCAS New River',                 state: 'NC', branch: 'Marine Corps',  lat: 34.7001, lng: -77.4394,  zoom: 13 },
  { name: 'MCB Hawaii Kaneohe Bay',         state: 'HI', branch: 'Marine Corps',  lat: 21.4512, lng: -157.7503, zoom: 13 },
  { name: 'MCAS Yuma',                      state: 'AZ', branch: 'Marine Corps',  lat: 32.6555, lng: -114.6155, zoom: 13 },
  { name: 'MCAS Beaufort',                  state: 'SC', branch: 'Marine Corps',  lat: 32.4736, lng: -80.7233,  zoom: 13 },
  // AIR FORCE / SPACE FORCE · CONUS
  { name: 'Joint Base Langley-Eustis',      state: 'VA', branch: 'Air Force',     lat: 37.0811, lng: -76.3585,  zoom: 13 },
  { name: 'Eglin AFB',                      state: 'FL', branch: 'Air Force',     lat: 30.4785, lng: -86.5256,  zoom: 12 },
  { name: 'MacDill AFB',                    state: 'FL', branch: 'Air Force',     lat: 27.8492, lng: -82.5021,  zoom: 13 },
  { name: 'Tyndall AFB',                    state: 'FL', branch: 'Air Force',     lat: 30.0779, lng: -85.6092,  zoom: 13 },
  { name: 'Barksdale AFB',                  state: 'LA', branch: 'Air Force',     lat: 32.5018, lng: -93.6648,  zoom: 13 },
  { name: 'Tinker AFB',                     state: 'OK', branch: 'Air Force',     lat: 35.4147, lng: -97.3866,  zoom: 13 },
  { name: 'Offutt AFB',                     state: 'NE', branch: 'Air Force',     lat: 41.1183, lng: -95.9125,  zoom: 13 },
  { name: 'Whiteman AFB',                   state: 'MO', branch: 'Air Force',     lat: 38.7217, lng: -93.5484,  zoom: 13 },
  { name: 'Scott AFB',                      state: 'IL', branch: 'Air Force',     lat: 38.5452, lng: -89.8499,  zoom: 13 },
  { name: 'Wright-Patterson AFB',           state: 'OH', branch: 'Air Force',     lat: 39.8260, lng: -84.0495,  zoom: 13 },
  { name: 'Joint Base Andrews',             state: 'MD', branch: 'Air Force',     lat: 38.8108, lng: -76.8660,  zoom: 13 },
  { name: 'Nellis AFB',                     state: 'NV', branch: 'Air Force',     lat: 36.2360, lng: -115.0340, zoom: 13 },
  { name: 'Travis AFB',                     state: 'CA', branch: 'Air Force',     lat: 38.2627, lng: -121.9266, zoom: 13 },
  { name: 'Edwards AFB',                    state: 'CA', branch: 'Air Force',     lat: 34.9054, lng: -117.8844, zoom: 12 },
  { name: 'Keesler AFB',                    state: 'MS', branch: 'Air Force',     lat: 30.4142, lng: -88.9239,  zoom: 13 },
  { name: 'Little Rock AFB',                state: 'AR', branch: 'Air Force',     lat: 34.9164, lng: -92.1413,  zoom: 13 },
  { name: 'Dyess AFB',                      state: 'TX', branch: 'Air Force',     lat: 32.4208, lng: -99.8546,  zoom: 13 },
  { name: 'Luke AFB',                       state: 'AZ', branch: 'Air Force',     lat: 33.5350, lng: -112.3833, zoom: 13 },
  { name: 'Davis-Monthan AFB',              state: 'AZ', branch: 'Air Force',     lat: 32.1665, lng: -110.8833, zoom: 13 },
  { name: 'Fairchild AFB',                  state: 'WA', branch: 'Air Force',     lat: 47.6151, lng: -117.6557, zoom: 13 },
  { name: 'Hill AFB',                       state: 'UT', branch: 'Air Force',     lat: 41.1238, lng: -111.9734, zoom: 13 },
  { name: 'Minot AFB',                      state: 'ND', branch: 'Air Force',     lat: 48.4154, lng: -101.3578, zoom: 13 },
  { name: 'Malmstrom AFB',                  state: 'MT', branch: 'Air Force',     lat: 47.5049, lng: -111.1843, zoom: 13 },
  { name: 'Ellsworth AFB',                  state: 'SD', branch: 'Air Force',     lat: 44.1453, lng: -103.1011, zoom: 13 },
  { name: 'Hurlburt Field',                 state: 'FL', branch: 'Air Force',     lat: 30.4275, lng: -86.6857,  zoom: 13 },
  { name: 'Moody AFB',                      state: 'GA', branch: 'Air Force',     lat: 30.9679, lng: -83.1930,  zoom: 13 },
  { name: 'Shaw AFB',                       state: 'SC', branch: 'Air Force',     lat: 33.9717, lng: -80.4757,  zoom: 13 },
  { name: 'Seymour Johnson AFB',            state: 'NC', branch: 'Air Force',     lat: 35.3395, lng: -77.9606,  zoom: 13 },
  { name: 'Joint Base San Antonio',         state: 'TX', branch: 'Air Force',     lat: 29.3838, lng: -98.6202,  zoom: 12 },
  { name: 'Buckley SFB',                    state: 'CO', branch: 'Space Force',   lat: 39.7166, lng: -104.7513, zoom: 13 },
  { name: 'Schriever SFB',                  state: 'CO', branch: 'Space Force',   lat: 38.8019, lng: -104.5269, zoom: 13 },
  { name: 'Peterson SFB',                   state: 'CO', branch: 'Space Force',   lat: 38.8196, lng: -104.7005, zoom: 13 },
  { name: 'Patrick SFB',                    state: 'FL', branch: 'Space Force',   lat: 28.2348, lng: -80.6106,  zoom: 13 },
  { name: 'Vandenberg SFB',                 state: 'CA', branch: 'Space Force',   lat: 34.7420, lng: -120.5625, zoom: 13 },
  // OCONUS
  { name: 'Camp Humphreys',                 state: 'South Korea', branch: 'Army',        lat: 36.9765, lng: 127.0277,  zoom: 13, country: 'South Korea' },
  { name: 'Osan Air Base',                  state: 'South Korea', branch: 'Air Force',   lat: 37.0903, lng: 127.0297,  zoom: 13, country: 'South Korea' },
  { name: 'Camp Walker',                    state: 'South Korea', branch: 'Army',        lat: 35.8703, lng: 128.5996,  zoom: 14, country: 'South Korea' },
  { name: 'Camp Carroll',                   state: 'South Korea', branch: 'Army',        lat: 35.9795, lng: 128.3677,  zoom: 14, country: 'South Korea' },
  { name: 'USAG Yongsan',                   state: 'South Korea', branch: 'Army',        lat: 37.5297, lng: 126.9754,  zoom: 14, country: 'South Korea' },
  { name: 'Kadena Air Base',                state: 'Japan',       branch: 'Air Force',   lat: 26.3557, lng: 127.7678,  zoom: 13, country: 'Japan' },
  { name: 'Yokota Air Base',                state: 'Japan',       branch: 'Air Force',   lat: 35.7479, lng: 139.3486,  zoom: 13, country: 'Japan' },
  { name: 'Camp Foster',                    state: 'Japan',       branch: 'Marine Corps', lat: 26.2700, lng: 127.7700, zoom: 13, country: 'Japan' },
  { name: 'Camp Zama',                      state: 'Japan',       branch: 'Army',        lat: 35.5000, lng: 139.4000,  zoom: 14, country: 'Japan' },
  { name: 'Misawa Air Base',                state: 'Japan',       branch: 'Air Force',   lat: 40.7036, lng: 141.3685,  zoom: 13, country: 'Japan' },
  { name: 'Naval Air Facility Atsugi',      state: 'Japan',       branch: 'Navy',        lat: 35.4533, lng: 139.4498,  zoom: 13, country: 'Japan' },
  { name: 'MCAS Iwakuni',                   state: 'Japan',       branch: 'Marine Corps', lat: 34.1445, lng: 132.2354, zoom: 13, country: 'Japan' },
  { name: 'Ramstein Air Base',              state: 'Germany',     branch: 'Air Force',   lat: 49.4369, lng: 7.6007,    zoom: 13, country: 'Germany' },
  { name: 'Spangdahlem Air Base',           state: 'Germany',     branch: 'Air Force',   lat: 49.9728, lng: 6.6924,    zoom: 13, country: 'Germany' },
  { name: 'USAG Wiesbaden',                 state: 'Germany',     branch: 'Army',        lat: 50.0658, lng: 8.2438,    zoom: 13, country: 'Germany' },
  { name: 'USAG Stuttgart',                 state: 'Germany',     branch: 'Army',        lat: 48.7328, lng: 9.2267,    zoom: 13, country: 'Germany' },
  { name: 'USAG Grafenwöhr',               state: 'Germany',     branch: 'Army',        lat: 49.7006, lng: 11.9022,   zoom: 12, country: 'Germany' },
  { name: 'USAG Ansbach',                   state: 'Germany',     branch: 'Army',        lat: 49.3184, lng: 10.5809,   zoom: 13, country: 'Germany' },
  { name: 'Aviano Air Base',                state: 'Italy',       branch: 'Air Force',   lat: 46.0319, lng: 12.5959,   zoom: 13, country: 'Italy' },
  { name: 'Naval Air Station Sigonella',    state: 'Italy',       branch: 'Navy',        lat: 37.4017, lng: 14.9236,   zoom: 13, country: 'Italy' },
  { name: 'Camp Darby',                     state: 'Italy',       branch: 'Army',        lat: 43.6534, lng: 10.3139,   zoom: 14, country: 'Italy' },
  { name: 'Naval Station Rota',             state: 'Spain',       branch: 'Navy',        lat: 36.6442, lng: -6.3492,   zoom: 13, country: 'Spain' },
  { name: 'Camp Lemonnier',                 state: 'Djibouti',    branch: 'Navy',        lat: 11.5539, lng: 43.1540,   zoom: 13, country: 'Djibouti' },
  { name: 'Andersen Air Force Base',        state: 'Guam',        branch: 'Air Force',   lat: 13.5840, lng: 144.9295,  zoom: 13 },
  { name: 'Joint Region Marianas',          state: 'Guam',        branch: 'Navy',        lat: 13.4537, lng: 144.6454,  zoom: 13 },
  { name: 'Al Udeid Air Base',              state: 'Qatar',       branch: 'Air Force',   lat: 25.1172, lng: 51.3148,   zoom: 13, country: 'Qatar' },
  { name: 'Lajes Field',                    state: 'Azores',      branch: 'Air Force',   lat: 38.7608, lng: -27.0908,  zoom: 13, country: 'Portugal' },
  { name: 'Bahrain Naval Support Activity', state: 'Bahrain',     branch: 'Navy',        lat: 26.2290, lng: 50.5979,   zoom: 14, country: 'Bahrain' },
  { name: 'Incirlik Air Base',              state: 'Turkey',      branch: 'Air Force',   lat: 37.0019, lng: 35.4269,   zoom: 13, country: 'Turkey' },
  // Space Force
  { name: 'Cape Canaveral Space Force Station', state: 'FL', branch: 'Space Force', lat: 28.4889, lng: -80.5778, zoom: 13 },
  { name: 'Los Angeles AFB',                   state: 'CA', branch: 'Space Force', lat: 33.9167, lng: -118.3833, zoom: 14 },
  { name: 'Cheyenne Mountain SFS',             state: 'CO', branch: 'Space Force', lat: 38.7441, lng: -104.8475, zoom: 14 },
  { name: 'Cavalier Space Force Station',      state: 'ND', branch: 'Space Force', lat: 48.7137, lng: -97.8974, zoom: 14 },
  { name: 'Clear Space Force Station',         state: 'AK', branch: 'Space Force', lat: 64.2944, lng: -149.1167, zoom: 13 },
  // Coast Guard
  { name: 'USCG Training Center Cape May',     state: 'NJ', branch: 'Coast Guard', lat: 38.9347, lng: -74.9015, zoom: 13 },
  { name: 'USCG Base Kodiak',                  state: 'AK', branch: 'Coast Guard', lat: 57.7896, lng: -152.3680, zoom: 13 },
  { name: 'USCG Base Honolulu',                state: 'HI', branch: 'Coast Guard', lat: 21.3110, lng: -157.8654, zoom: 14 },
  { name: 'USCG Base Elizabeth City',          state: 'NC', branch: 'Coast Guard', lat: 36.2760, lng: -76.2155, zoom: 13 },
  { name: 'USCG ISC Portsmouth',               state: 'VA', branch: 'Coast Guard', lat: 36.8331, lng: -76.2972, zoom: 14 },
  { name: 'Coast Guard Island Alameda',        state: 'CA', branch: 'Coast Guard', lat: 37.7737, lng: -122.3001, zoom: 14 },
  { name: 'USCG Training Center Petaluma',     state: 'CA', branch: 'Coast Guard', lat: 38.2377, lng: -122.6463, zoom: 13 },
  { name: 'USCG Sector New York',              state: 'NY', branch: 'Coast Guard', lat: 40.6892, lng: -74.0445, zoom: 14 },
  { name: 'USCG Sector Miami',                 state: 'FL', branch: 'Coast Guard', lat: 25.7615, lng: -80.1793, zoom: 14 },
  { name: 'USCG Sector New Orleans',           state: 'LA', branch: 'Coast Guard', lat: 29.9352, lng: -90.0715, zoom: 14 },
  { name: 'USCG Sector Houston-Galveston',     state: 'TX', branch: 'Coast Guard', lat: 29.3013, lng: -94.7977, zoom: 14 },
  { name: 'USCG Sector San Diego',             state: 'CA', branch: 'Coast Guard', lat: 32.7157, lng: -117.1611, zoom: 14 },
  { name: 'USCG AIRSTA Traverse City',         state: 'MI', branch: 'Coast Guard', lat: 44.7436, lng: -85.5824, zoom: 14 },
  { name: 'USCG Sector Puget Sound',           state: 'WA', branch: 'Coast Guard', lat: 47.6062, lng: -122.3321, zoom: 14 },
  { name: 'USCG Sector Boston',                state: 'MA', branch: 'Coast Guard', lat: 42.3601, lng: -71.0589, zoom: 14 },
  { name: 'USCG Sector Baltimore',             state: 'MD', branch: 'Coast Guard', lat: 39.2904, lng: -76.6122, zoom: 14 },
  { name: 'USCG AIRSTA Sitka',                 state: 'AK', branch: 'Coast Guard', lat: 57.0531, lng: -135.3300, zoom: 13 },
  { name: 'USCG Sector Jacksonville',         state: 'FL', branch: 'Coast Guard', lat: 30.3322, lng: -81.6557, zoom: 14 },
  { name: 'USCG Sector Charleston',           state: 'SC', branch: 'Coast Guard', lat: 32.7765, lng: -79.9311, zoom: 14 },
];

// ─── Facility data for major installations ──────────────────────────────────
const FACILITIES = {
  'Fort Liberty': [
    { type: 'gate',       name: 'Yadkin Road Gate (Main)',         lat: 35.1294, lng: -79.0186 },
    { type: 'gate',       name: 'All-American Gate (Gate 1)',      lat: 35.1546, lng: -78.9869 },
    { type: 'gate',       name: 'Bragg Blvd Gate',                 lat: 35.1590, lng: -79.0110 },
    { type: 'medical',    name: 'Womack Army Medical Center',      lat: 35.1490, lng: -79.0015 },
    { type: 'commissary', name: 'Fort Liberty Commissary',         lat: 35.1420, lng: -79.0130 },
    { type: 'exchange',   name: 'Main Exchange (PX)',              lat: 35.1430, lng: -79.0120 },
    { type: 'chapel',     name: 'Main Post Chapel',                lat: 35.1466, lng: -79.0055 },
    { type: 'gym',        name: 'Towle Community Center',          lat: 35.1455, lng: -79.0075 },
    { type: 'housing',    name: 'Housing Welcome Center',          lat: 35.1375, lng: -79.0150 },
    { type: 'education',  name: 'Army Education Center',           lat: 35.1485, lng: -79.0070 },
    { type: 'finance',    name: 'AAFCU / Finance Office',          lat: 35.1470, lng: -79.0100 },
    { type: 'dining',     name: 'Bragg Bistro DFAC',               lat: 35.1450, lng: -79.0060 },
    { type: 'gas',        name: 'Shoppette / Gas Station',         lat: 35.1440, lng: -79.0140 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 35.1305, lng: -79.0192 },
    { type: 'legal',      name: 'Trial Defense Services',          lat: 35.1480, lng: -79.0040 },
    { type: 'childcare',  name: 'CDC Main Post',                   lat: 35.1460, lng: -79.0090 },
    { type: 'hq',         name: 'XVIII Airborne Corps HQ',         lat: 35.1500, lng: -79.0035 },
    { type: 'recreation', name: 'Ritz-Epps Physical Fitness',      lat: 35.1445, lng: -79.0045 },
  ],
  'Fort Bragg': [
    { type: 'gate',       name: 'Yadkin Road Gate (Main)',         lat: 35.1294, lng: -79.0186 },
    { type: 'medical',    name: 'Womack Army Medical Center',      lat: 35.1490, lng: -79.0015 },
    { type: 'commissary', name: 'Fort Liberty Commissary',         lat: 35.1420, lng: -79.0130 },
    { type: 'exchange',   name: 'Main Exchange (PX)',              lat: 35.1430, lng: -79.0120 },
    { type: 'hq',         name: 'XVIII Airborne Corps HQ',         lat: 35.1500, lng: -79.0035 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 35.1305, lng: -79.0192 },
  ],
  'Fort Campbell': [
    { type: 'gate',       name: 'Gate 4 (Main Gate / Screaming Eagle)', lat: 36.6622, lng: -87.4803 },
    { type: 'gate',       name: 'Gate 7 (Tennessee Ave)',          lat: 36.6900, lng: -87.4590 },
    { type: 'gate',       name: 'Gate 1 (Clarksville)',            lat: 36.6810, lng: -87.4840 },
    { type: 'medical',    name: 'Blanchfield Army Community Hospital', lat: 36.6750, lng: -87.4650 },
    { type: 'commissary', name: 'Fort Campbell Commissary',        lat: 36.6730, lng: -87.4715 },
    { type: 'exchange',   name: 'Main Exchange (PX)',              lat: 36.6740, lng: -87.4700 },
    { type: 'chapel',     name: 'Main Post Chapel',                lat: 36.6762, lng: -87.4688 },
    { type: 'gym',        name: 'Sportsman Recreation Center',     lat: 36.6772, lng: -87.4698 },
    { type: 'housing',    name: 'Housing Division Office',         lat: 36.6652, lng: -87.4778 },
    { type: 'education',  name: 'Education Center (Bldg 2200)',    lat: 36.6780, lng: -87.4680 },
    { type: 'finance',    name: 'AAFCU / Finance Office',          lat: 36.6720, lng: -87.4726 },
    { type: 'dining',     name: '101st DFAC',                      lat: 36.6760, lng: -87.4660 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 36.6633, lng: -87.4792 },
    { type: 'childcare',  name: 'Child Development Center',        lat: 36.6700, lng: -87.4710 },
    { type: 'hq',         name: '101st Airborne Division HQ',      lat: 36.6800, lng: -87.4660 },
    { type: 'legal',      name: 'Legal Assistance Office',         lat: 36.6790, lng: -87.4670 },
  ],
  'Fort Hood': [
    { type: 'gate',       name: 'Clear Creek Gate (Main)',         lat: 31.1255, lng: -97.7974 },
    { type: 'gate',       name: 'Fort Hood Gate (Hwy 190)',        lat: 31.1509, lng: -97.8230 },
    { type: 'medical',    name: 'Carl R. Darnall Medical Center',  lat: 31.1408, lng: -97.7862 },
    { type: 'commissary', name: 'Fort Hood Commissary',            lat: 31.1380, lng: -97.7870 },
    { type: 'exchange',   name: 'Fort Hood AAFES Exchange',        lat: 31.1392, lng: -97.7855 },
    { type: 'chapel',     name: 'Main Post Chapel',                lat: 31.1405, lng: -97.7840 },
    { type: 'gym',        name: 'Sports, Fitness & Aquatics',      lat: 31.1415, lng: -97.7845 },
    { type: 'housing',    name: 'Housing Division',                lat: 31.1275, lng: -97.7965 },
    { type: 'education',  name: 'Education Center',                lat: 31.1420, lng: -97.7830 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 31.1260, lng: -97.7980 },
    { type: 'hq',         name: 'III Corps HQ',                    lat: 31.1430, lng: -97.7820 },
    { type: 'childcare',  name: 'Child & Youth Services',          lat: 31.1360, lng: -97.7890 },
  ],
  'Joint Base Lewis-McChord': [
    { type: 'gate',       name: 'Main Gate (I-5 / Berkley Ave)',   lat: 47.0872, lng: -122.5803 },
    { type: 'gate',       name: 'North Fort Gate',                 lat: 47.1380, lng: -122.5644 },
    { type: 'medical',    name: 'Madigan Army Medical Center',     lat: 47.1012, lng: -122.5714 },
    { type: 'commissary', name: 'JBLM Commissary',                 lat: 47.1050, lng: -122.5770 },
    { type: 'exchange',   name: 'AAFES Exchange',                  lat: 47.1060, lng: -122.5758 },
    { type: 'chapel',     name: 'Main Post Chapel',                lat: 47.1070, lng: -122.5745 },
    { type: 'gym',        name: 'Waller Hall Fitness Center',      lat: 47.1080, lng: -122.5732 },
    { type: 'housing',    name: 'Housing Services Office',         lat: 47.0900, lng: -122.5820 },
    { type: 'education',  name: 'Education Center',                lat: 47.1090, lng: -122.5718 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 47.0880, lng: -122.5815 },
    { type: 'hq',         name: 'I Corps HQ',                      lat: 47.1100, lng: -122.5704 },
    { type: 'childcare',  name: 'Child Development Center',        lat: 47.1040, lng: -122.5780 },
    { type: 'legal',      name: 'Legal Assistance',                lat: 47.1095, lng: -122.5710 },
  ],
  'Fort Carson': [
    { type: 'gate',       name: 'Main Gate (Gate 1 / Interquest)', lat: 38.7276, lng: -104.7933 },
    { type: 'gate',       name: 'South Gate (Nevada Ave)',         lat: 38.7112, lng: -104.7940 },
    { type: 'medical',    name: 'Evans Army Community Hospital',   lat: 38.7399, lng: -104.7856 },
    { type: 'commissary', name: 'Fort Carson Commissary',          lat: 38.7380, lng: -104.7868 },
    { type: 'exchange',   name: 'Mountain Post Exchange',          lat: 38.7390, lng: -104.7855 },
    { type: 'chapel',     name: 'Post Chapel',                     lat: 38.7400, lng: -104.7840 },
    { type: 'gym',        name: 'Iron Horse Sports & Fitness',     lat: 38.7410, lng: -104.7828 },
    { type: 'housing',    name: 'Mountain Post Housing',           lat: 38.7290, lng: -104.7920 },
    { type: 'education',  name: 'Education Center',                lat: 38.7420, lng: -104.7815 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 38.7285, lng: -104.7928 },
    { type: 'hq',         name: '4th Infantry Division HQ',        lat: 38.7430, lng: -104.7802 },
    { type: 'childcare',  name: 'Child Development Center',        lat: 38.7360, lng: -104.7880 },
  ],
  'Naval Station Norfolk': [
    { type: 'gate',       name: 'Gate 1 (Hampton Blvd)',           lat: 36.9381, lng: -76.3176 },
    { type: 'gate',       name: 'Gate 2 (Norfolk Ave)',            lat: 36.9482, lng: -76.3380 },
    { type: 'gate',       name: 'Gate 5 (Pier Side)',              lat: 36.9600, lng: -76.3350 },
    { type: 'medical',    name: 'Naval Medical Center Portsmouth', lat: 36.8349, lng: -76.2984 },
    { type: 'commissary', name: 'Naval Station Commissary',        lat: 36.9500, lng: -76.3310 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',             lat: 36.9510, lng: -76.3295 },
    { type: 'chapel',     name: 'Naval Station Chapel',            lat: 36.9490, lng: -76.3270 },
    { type: 'gym',        name: 'Fitness Center',                  lat: 36.9475, lng: -76.3300 },
    { type: 'housing',    name: 'Housing Services Office',         lat: 36.9460, lng: -76.3320 },
    { type: 'education',  name: 'Navy College / Education',        lat: 36.9520, lng: -76.3258 },
    { type: 'finance',    name: 'Navy Federal Credit Union',       lat: 36.9450, lng: -76.3280 },
    { type: 'dining',     name: 'Main Galley',                     lat: 36.9495, lng: -76.3302 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 36.9392, lng: -76.3188 },
    { type: 'hq',         name: 'Fleet Forces Command HQ',         lat: 36.9530, lng: -76.3245 },
  ],
  'Marine Corps Base Camp Lejeune': [
    { type: 'gate',       name: 'Main Gate (Holcomb Blvd)',        lat: 34.6745, lng: -77.3642 },
    { type: 'gate',       name: 'Back Gate (US-17)',               lat: 34.7100, lng: -77.3200 },
    { type: 'medical',    name: 'Naval Medical Center Camp Lejeune', lat: 34.6879, lng: -77.3450 },
    { type: 'commissary', name: 'Camp Lejeune Commissary',         lat: 34.6860, lng: -77.3470 },
    { type: 'exchange',   name: 'Marine Corps Exchange (MCX)',     lat: 34.6870, lng: -77.3460 },
    { type: 'chapel',     name: 'Main Post Chapel',                lat: 34.6890, lng: -77.3440 },
    { type: 'gym',        name: 'Tarawa Terrace Community Center', lat: 34.6900, lng: -77.3430 },
    { type: 'housing',    name: 'Housing Office',                  lat: 34.6770, lng: -77.3610 },
    { type: 'education',  name: 'Marine Corps University Center',  lat: 34.6910, lng: -77.3420 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 34.6755, lng: -77.3635 },
    { type: 'hq',         name: 'II Marine Expeditionary Force HQ', lat: 34.6920, lng: -77.3410 },
  ],
  'Camp Pendleton': [
    { type: 'gate',       name: 'Mainside Gate (Las Pulgas)',      lat: 33.3600, lng: -117.3500 },
    { type: 'gate',       name: 'Stuart Mesa Gate (I-5)',          lat: 33.2219, lng: -117.4100 },
    { type: 'medical',    name: 'Naval Hospital Camp Pendleton',   lat: 33.3620, lng: -117.3490 },
    { type: 'commissary', name: 'Camp Pendleton Commissary',       lat: 33.3610, lng: -117.3505 },
    { type: 'exchange',   name: 'Marine Corps Exchange',           lat: 33.3615, lng: -117.3498 },
    { type: 'chapel',     name: 'Main Post Chapel',                lat: 33.3625, lng: -117.3480 },
    { type: 'gym',        name: 'Physical Fitness Center',         lat: 33.3630, lng: -117.3470 },
    { type: 'housing',    name: 'Housing Office',                  lat: 33.3590, lng: -117.3520 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 33.2230, lng: -117.4090 },
  ],
  'Camp Humphreys': [
    { type: 'gate',       name: 'Main Gate (North)',               lat: 36.9835, lng: 127.0265 },
    { type: 'gate',       name: 'Back Gate (South)',               lat: 36.9698, lng: 127.0290 },
    { type: 'medical',    name: 'Brian D. Allgood Army Community Hospital', lat: 36.9780, lng: 127.0280 },
    { type: 'commissary', name: 'Humphreys Commissary',            lat: 36.9760, lng: 127.0270 },
    { type: 'exchange',   name: 'AAFES Exchange',                  lat: 36.9770, lng: 127.0265 },
    { type: 'chapel',     name: 'Camp Humphreys Chapel',           lat: 36.9775, lng: 127.0255 },
    { type: 'gym',        name: 'Fitness Center',                  lat: 36.9780, lng: 127.0245 },
    { type: 'housing',    name: 'Housing Services Office',         lat: 36.9750, lng: 127.0285 },
    { type: 'education',  name: 'Humphreys HS (DoDEA)',            lat: 36.9790, lng: 127.0235 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 36.9840, lng: 127.0258 },
    { type: 'hq',         name: 'USFK / 8th Army HQ',             lat: 36.9795, lng: 127.0225 },
    { type: 'childcare',  name: 'Child Development Center',        lat: 36.9755, lng: 127.0295 },
    { type: 'recreation', name: 'Warrior Zone Recreation',         lat: 36.9765, lng: 127.0260 },
  ],
  'Ramstein Air Base': [
    { type: 'gate',       name: 'Main Gate (Römerberg)',           lat: 49.4319, lng: 7.5930 },
    { type: 'gate',       name: 'Back Gate (Landstuhl direction)', lat: 49.4420, lng: 7.6090 },
    { type: 'medical',    name: 'Landstuhl Regional Medical Center', lat: 49.3960, lng: 7.5786 },
    { type: 'commissary', name: 'Ramstein Commissary',             lat: 49.4365, lng: 7.5990 },
    { type: 'exchange',   name: 'BX / Base Exchange',              lat: 49.4375, lng: 7.5980 },
    { type: 'chapel',     name: 'Ramstein Chapel',                 lat: 49.4380, lng: 7.5970 },
    { type: 'gym',        name: 'Sports and Fitness Center',       lat: 49.4390, lng: 7.5960 },
    { type: 'housing',    name: 'Housing Office',                  lat: 49.4330, lng: 7.5945 },
    { type: 'education',  name: 'Kaiserslautern Military Community Education', lat: 49.4400, lng: 7.5950 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 49.4325, lng: 7.5938 },
    { type: 'hq',         name: 'US Air Forces in Europe HQ (USAFE)', lat: 49.4410, lng: 7.5940 },
    { type: 'childcare',  name: 'Child Development Center',        lat: 49.4345, lng: 7.5975 },
  ],
  'Kadena Air Base': [
    { type: 'gate',       name: 'Gate 1 (Main)',                   lat: 26.3490, lng: 127.7590 },
    { type: 'gate',       name: 'Gate 2 (North)',                  lat: 26.3640, lng: 127.7670 },
    { type: 'medical',    name: 'Kadena Medical Group',            lat: 26.3557, lng: 127.7655 },
    { type: 'commissary', name: 'Kadena Commissary',               lat: 26.3545, lng: 127.7660 },
    { type: 'exchange',   name: 'BX / Base Exchange',              lat: 26.3550, lng: 127.7650 },
    { type: 'chapel',     name: 'Kadena Chapel',                   lat: 26.3560, lng: 127.7640 },
    { type: 'gym',        name: 'Risner Fitness Center',           lat: 26.3570, lng: 127.7630 },
    { type: 'housing',    name: 'Housing Office',                  lat: 26.3530, lng: 127.7668 },
    { type: 'education',  name: 'Kadena DoDEA High School',        lat: 26.3580, lng: 127.7620 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 26.3495, lng: 127.7598 },
    { type: 'hq',         name: '18th Wing HQ',                    lat: 26.3590, lng: 127.7610 },
    { type: 'recreation', name: 'Outdoor Recreation',              lat: 26.3535, lng: 127.7675 },
  ],
  'Yokota Air Base': [
    { type: 'gate',       name: 'Main Gate',                       lat: 35.7415, lng: 139.3432 },
    { type: 'medical',    name: 'Yokota Medical Group',            lat: 35.7479, lng: 139.3475 },
    { type: 'commissary', name: 'Yokota Commissary',               lat: 35.7466, lng: 139.3465 },
    { type: 'exchange',   name: 'BX / Base Exchange',              lat: 35.7470, lng: 139.3455 },
    { type: 'chapel',     name: 'Yokota Chapel',                   lat: 35.7480, lng: 139.3444 },
    { type: 'gym',        name: 'Taiyo Community Center / Fitness', lat: 35.7490, lng: 139.3434 },
    { type: 'housing',    name: 'Housing Office',                  lat: 35.7455, lng: 139.3475 },
    { type: 'education',  name: 'Yokota DoDEA High School',        lat: 35.7500, lng: 139.3424 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 35.7420, lng: 139.3438 },
    { type: 'hq',         name: '374th Airlift Wing HQ',           lat: 35.7510, lng: 139.3414 },
  ],
  'Fort Bliss': [
    { type: 'gate',       name: 'Cassidy Gate (Main / Gateway Blvd)',  lat: 31.7855, lng: -106.3888 },
    { type: 'gate',       name: 'Biggs Gate (Airport)',                lat: 31.8480, lng: -106.3800 },
    { type: 'gate',       name: 'Montana Gate (West)',                 lat: 31.8200, lng: -106.4550 },
    { type: 'medical',    name: 'William Beaumont Army Medical Center', lat: 31.8476, lng: -106.4124 },
    { type: 'commissary', name: 'Fort Bliss Commissary',               lat: 31.8320, lng: -106.4160 },
    { type: 'exchange',   name: 'Main Post Exchange (PX)',             lat: 31.8310, lng: -106.4148 },
    { type: 'chapel',     name: 'Main Post Chapel',                    lat: 31.8340, lng: -106.4130 },
    { type: 'gym',        name: 'Stout Physical Fitness Center',       lat: 31.8355, lng: -106.4118 },
    { type: 'housing',    name: 'Housing Division Office',             lat: 31.8290, lng: -106.4175 },
    { type: 'education',  name: 'Education Center',                    lat: 31.8365, lng: -106.4105 },
    { type: 'finance',    name: 'Fort Bliss Federal Credit Union',     lat: 31.8300, lng: -106.4162 },
    { type: 'visitor',    name: 'Visitor Control Center (Cassidy Gate)', lat: 31.7862, lng: -106.3895 },
    { type: 'hq',         name: '1st Armored Division HQ',             lat: 31.8380, lng: -106.4090 },
    { type: 'childcare',  name: 'Child Development Center',            lat: 31.8330, lng: -106.4145 },
    { type: 'recreation', name: 'Sergeant Major of the Army Museum',   lat: 31.8140, lng: -106.4183 },
  ],
  'Fort Sam Houston': [
    { type: 'gate',       name: 'New Braunfels Gate (Main)',           lat: 29.4412, lng: -98.4282 },
    { type: 'gate',       name: 'MacArthur Gate (South)',              lat: 29.4325, lng: -98.4350 },
    { type: 'medical',    name: 'Brooke Army Medical Center (BAMC)',   lat: 29.4990, lng: -98.4075 },
    { type: 'commissary', name: 'Fort Sam Houston Commissary',         lat: 29.4490, lng: -98.4405 },
    { type: 'exchange',   name: 'Army & Air Force Exchange (PX)',      lat: 29.4500, lng: -98.4390 },
    { type: 'chapel',     name: 'Main Post Chapel',                    lat: 29.4510, lng: -98.4375 },
    { type: 'gym',        name: 'MacArthur Physical Fitness Center',   lat: 29.4520, lng: -98.4360 },
    { type: 'housing',    name: 'Housing Services Office',             lat: 29.4420, lng: -98.4415 },
    { type: 'education',  name: 'Education Center (Bldg 2261)',        lat: 29.4530, lng: -98.4345 },
    { type: 'visitor',    name: 'Visitor Control Center',              lat: 29.4418, lng: -98.4288 },
    { type: 'hq',         name: 'U.S. Army North / JBSA HQ',          lat: 29.4545, lng: -98.4330 },
    { type: 'childcare',  name: 'Child Development Center',            lat: 29.4475, lng: -98.4395 },
    { type: 'legal',      name: 'Legal Assistance Office',             lat: 29.4535, lng: -98.4335 },
  ],
  'Fort Stewart': [
    { type: 'gate',       name: 'Holbrook Gate (Main)',                lat: 31.8456, lng: -81.5907 },
    { type: 'gate',       name: 'North Gate (US-84)',                  lat: 31.9200, lng: -81.6030 },
    { type: 'medical',    name: 'Winn Army Community Hospital',        lat: 31.8690, lng: -81.6090 },
    { type: 'commissary', name: 'Fort Stewart Commissary',             lat: 31.8670, lng: -81.6108 },
    { type: 'exchange',   name: 'Main Post Exchange (PX)',             lat: 31.8680, lng: -81.6095 },
    { type: 'chapel',     name: 'Post Chapel',                         lat: 31.8700, lng: -81.6080 },
    { type: 'gym',        name: 'Fitness Center',                      lat: 31.8710, lng: -81.6068 },
    { type: 'housing',    name: 'Housing Division Office',             lat: 31.8460, lng: -81.5915 },
    { type: 'education',  name: 'Education Center',                    lat: 31.8720, lng: -81.6055 },
    { type: 'visitor',    name: 'Visitor Control Center',              lat: 31.8462, lng: -81.5912 },
    { type: 'hq',         name: '3rd Infantry Division HQ',            lat: 31.8730, lng: -81.6042 },
    { type: 'childcare',  name: 'Child Development Center',            lat: 31.8660, lng: -81.6118 },
  ],
  'Fort Drum': [
    { type: 'gate',       name: 'Wheeler-Sack Gate (Main)',            lat: 44.0315, lng: -75.7912 },
    { type: 'gate',       name: 'North Gate (NY-11)',                  lat: 44.0870, lng: -75.7650 },
    { type: 'medical',    name: 'Guthrie Army Health Clinic',          lat: 44.0530, lng: -75.7718 },
    { type: 'commissary', name: 'Fort Drum Commissary',                lat: 44.0510, lng: -75.7730 },
    { type: 'exchange',   name: 'Main Post Exchange (PX)',             lat: 44.0520, lng: -75.7722 },
    { type: 'chapel',     name: 'Post Chapel',                         lat: 44.0535, lng: -75.7710 },
    { type: 'gym',        name: 'Physical Fitness Center',             lat: 44.0545, lng: -75.7698 },
    { type: 'housing',    name: 'Housing Services Office',             lat: 44.0325, lng: -75.7920 },
    { type: 'education',  name: 'Education Center (McGill Hall)',      lat: 44.0555, lng: -75.7685 },
    { type: 'visitor',    name: 'Visitor Control Center',              lat: 44.0320, lng: -75.7918 },
    { type: 'hq',         name: '10th Mountain Division HQ',           lat: 44.0565, lng: -75.7672 },
    { type: 'childcare',  name: 'Child Development Center',            lat: 44.0498, lng: -75.7742 },
    { type: 'legal',      name: 'Legal Assistance Office',             lat: 44.0558, lng: -75.7679 },
  ],
  'Fort Sill': [
    { type: 'gate',       name: 'Sheridan Gate (Main)',                lat: 34.6408, lng: -98.4120 },
    { type: 'gate',       name: 'Key Gate (West / Cache Rd)',          lat: 34.6510, lng: -98.4240 },
    { type: 'medical',    name: 'Reynolds Army Health Clinic',         lat: 34.6500, lng: -98.4040 },
    { type: 'commissary', name: 'Fort Sill Commissary',                lat: 34.6480, lng: -98.4058 },
    { type: 'exchange',   name: 'Main Post Exchange (PX)',             lat: 34.6490, lng: -98.4048 },
    { type: 'chapel',     name: 'Post Chapel',                         lat: 34.6502, lng: -98.4035 },
    { type: 'gym',        name: 'Fitness Center',                      lat: 34.6512, lng: -98.4022 },
    { type: 'housing',    name: 'Housing Division',                    lat: 34.6415, lng: -98.4125 },
    { type: 'education',  name: 'Education Center',                    lat: 34.6520, lng: -98.4010 },
    { type: 'visitor',    name: 'Visitor Control Center',              lat: 34.6412, lng: -98.4128 },
    { type: 'hq',         name: 'Field Artillery School HQ',           lat: 34.6530, lng: -98.3998 },
    { type: 'childcare',  name: 'Child Development Center',            lat: 34.6470, lng: -98.4070 },
  ],
  'Naval Base San Diego': [
    { type: 'gate',       name: 'Gate 1 (Main / Harbor Dr)',           lat: 32.6840, lng: -117.1980 },
    { type: 'gate',       name: 'Gate 4 (Chollas Pkwy)',               lat: 32.7040, lng: -117.1810 },
    { type: 'medical',    name: 'Naval Medical Center San Diego',       lat: 32.7197, lng: -117.1560 },
    { type: 'commissary', name: 'Naval Base Commissary',               lat: 32.6960, lng: -117.2050 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',                  lat: 32.6970, lng: -117.2040 },
    { type: 'chapel',     name: 'Naval Station Chapel',                lat: 32.6980, lng: -117.2028 },
    { type: 'gym',        name: 'Fitness Center',                      lat: 32.6990, lng: -117.2018 },
    { type: 'housing',    name: 'Housing Services Office',             lat: 32.6950, lng: -117.2058 },
    { type: 'education',  name: 'Navy College Office',                 lat: 32.7000, lng: -117.2008 },
    { type: 'visitor',    name: 'Visitor Control Center',              lat: 32.6845, lng: -117.1988 },
    { type: 'hq',         name: 'Commander, Naval Base San Diego',     lat: 32.7010, lng: -117.1998 },
    { type: 'finance',    name: 'Navy Federal Credit Union',           lat: 32.6960, lng: -117.2062 },
  ],
  'Schofield Barracks': [
    { type: 'gate',       name: 'Lyman Gate (Main)',                   lat: 21.4838, lng: -158.0640 },
    { type: 'gate',       name: 'Foote Gate (South)',                  lat: 21.4680, lng: -158.0558 },
    { type: 'medical',    name: 'Tripler Army Medical Center',         lat: 21.3620, lng: -157.9200 },
    { type: 'commissary', name: 'Schofield Commissary',               lat: 21.4800, lng: -158.0600 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                  lat: 21.4810, lng: -158.0590 },
    { type: 'chapel',     name: 'Schofield Barracks Chapel',          lat: 21.4820, lng: -158.0580 },
    { type: 'gym',        name: 'Fitness Center',                      lat: 21.4830, lng: -158.0570 },
    { type: 'housing',    name: 'Housing Division Office',             lat: 21.4790, lng: -158.0615 },
    { type: 'education',  name: 'Education Center',                    lat: 21.4840, lng: -158.0560 },
    { type: 'visitor',    name: 'Visitor Control Center',              lat: 21.4842, lng: -158.0648 },
    { type: 'hq',         name: '25th Infantry Division HQ',           lat: 21.4850, lng: -158.0550 },
    { type: 'childcare',  name: 'Child Development Center',            lat: 21.4796, lng: -158.0608 },
  ],
  'USAG Stuttgart': [
    { type: 'gate',       name: 'Patch Barracks Main Gate',        lat: 48.7260, lng: 9.2190 },
    { type: 'gate',       name: 'Kelley Barracks Gate',            lat: 48.7190, lng: 9.2340 },
    { type: 'medical',    name: 'Patch Barracks Health Clinic',    lat: 48.7270, lng: 9.2200 },
    { type: 'commissary', name: 'Stuttgart Commissary',            lat: 48.7280, lng: 9.2210 },
    { type: 'exchange',   name: 'AAFES Exchange',                  lat: 48.7285, lng: 9.2205 },
    { type: 'chapel',     name: 'Patch Chapel',                    lat: 48.7290, lng: 9.2198 },
    { type: 'gym',        name: 'Physical Fitness Center',         lat: 48.7295, lng: 9.2188 },
    { type: 'housing',    name: 'Housing Office',                  lat: 48.7255, lng: 9.2195 },
    { type: 'education',  name: 'Stuttgart DoDEA High School',     lat: 48.7300, lng: 9.2180 },
    { type: 'visitor',    name: 'Visitor Control Center',          lat: 48.7265, lng: 9.2183 },
    { type: 'hq',         name: 'US European Command (EUCOM)',     lat: 48.7310, lng: 9.2170 },
  ],
  // ── Army (additional) ────────────────────────────────────────────────────────
  'Fort Moore': [
    { type: 'gate',       name: 'Fort Moore Main Gate',                      lat: 32.348,  lng: -85.000 },
    { type: 'medical',    name: 'Martin Army Community Hospital',             lat: 32.355,  lng: -84.981 },
    { type: 'commissary', name: 'Fort Moore Commissary',                      lat: 32.360,  lng: -84.982 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 32.361,  lng: -84.981 },
    { type: 'chapel',     name: 'Fort Moore Chapel',                          lat: 32.362,  lng: -84.979 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 32.363,  lng: -84.977 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 32.351,  lng: -84.998 },
    { type: 'education',  name: 'Education Center',                           lat: 32.364,  lng: -84.976 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 32.349,  lng: -85.001 },
    { type: 'hq',         name: 'Maneuver Center of Excellence',              lat: 32.365,  lng: -84.974 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 32.358,  lng: -84.984 },
  ],
  'Fort Eisenhower': [
    { type: 'gate',       name: 'Fort Eisenhower Main Gate',                  lat: 33.409,  lng: -82.148 },
    { type: 'medical',    name: 'Dwight D. Eisenhower Army Medical Center',   lat: 33.420,  lng: -82.148 },
    { type: 'commissary', name: 'Fort Eisenhower Commissary',                 lat: 33.418,  lng: -82.150 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 33.419,  lng: -82.149 },
    { type: 'chapel',     name: 'Fort Eisenhower Chapel',                     lat: 33.420,  lng: -82.147 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 33.421,  lng: -82.146 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 33.411,  lng: -82.149 },
    { type: 'education',  name: 'Education Center',                           lat: 33.422,  lng: -82.145 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 33.410,  lng: -82.149 },
    { type: 'hq',         name: 'Fort Eisenhower Headquarters',               lat: 33.423,  lng: -82.144 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 33.416,  lng: -82.151 },
  ],
  'Fort Gregg-Adams': [
    { type: 'gate',       name: 'Fort Gregg-Adams Main Gate',                 lat: 37.229,  lng: -77.330 },
    { type: 'medical',    name: 'Fort Gregg-Adams Health Clinic',             lat: 37.238,  lng: -77.330 },
    { type: 'commissary', name: 'Fort Gregg-Adams Commissary',                lat: 37.237,  lng: -77.332 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 37.238,  lng: -77.331 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 37.230,  lng: -77.331 },
    { type: 'hq',         name: 'Fort Gregg-Adams Headquarters',              lat: 37.239,  lng: -77.329 },
    { type: 'education',  name: 'Education Center',                           lat: 37.240,  lng: -77.328 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 37.232,  lng: -77.333 },
  ],
  'Fort Knox': [
    { type: 'gate',       name: 'Fort Knox Main Gate',                        lat: 37.886,  lng: -85.968 },
    { type: 'medical',    name: 'Ireland Army Health Clinic',                 lat: 37.892,  lng: -85.962 },
    { type: 'commissary', name: 'Fort Knox Commissary',                       lat: 37.890,  lng: -85.964 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 37.891,  lng: -85.963 },
    { type: 'chapel',     name: 'Fort Knox Chapel',                           lat: 37.893,  lng: -85.961 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 37.894,  lng: -85.960 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 37.888,  lng: -85.966 },
    { type: 'education',  name: 'Education Center',                           lat: 37.895,  lng: -85.959 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 37.887,  lng: -85.969 },
    { type: 'hq',         name: 'Armor School Headquarters',                  lat: 37.896,  lng: -85.958 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 37.889,  lng: -85.965 },
  ],
  'Fort Jackson': [
    { type: 'gate',       name: 'Fort Jackson Main Gate',                     lat: 34.006,  lng: -80.914 },
    { type: 'medical',    name: 'Moncrief Army Health Clinic',                lat: 34.012,  lng: -80.907 },
    { type: 'commissary', name: 'Fort Jackson Commissary',                    lat: 34.013,  lng: -80.908 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 34.014,  lng: -80.907 },
    { type: 'chapel',     name: 'Fort Jackson Chapel',                        lat: 34.015,  lng: -80.906 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 34.016,  lng: -80.905 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 34.008,  lng: -80.912 },
    { type: 'education',  name: 'Education Center',                           lat: 34.017,  lng: -80.904 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 34.007,  lng: -80.915 },
    { type: 'hq',         name: 'Training Center Headquarters',               lat: 34.018,  lng: -80.903 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 34.011,  lng: -80.909 },
  ],
  'Fort Leonard Wood': [
    { type: 'gate',       name: 'Fort Leonard Wood Main Gate',                lat: 37.720,  lng: -92.148 },
    { type: 'medical',    name: 'General Leonard Wood Army Community Hospital', lat: 37.725, lng: -92.141 },
    { type: 'commissary', name: 'Fort Leonard Wood Commissary',               lat: 37.726,  lng: -92.142 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 37.727,  lng: -92.141 },
    { type: 'chapel',     name: 'Fort Leonard Wood Chapel',                   lat: 37.728,  lng: -92.140 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 37.729,  lng: -92.139 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 37.722,  lng: -92.146 },
    { type: 'education',  name: 'Education Center',                           lat: 37.730,  lng: -92.138 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 37.721,  lng: -92.149 },
    { type: 'hq',         name: 'Fort Leonard Wood Headquarters',             lat: 37.731,  lng: -92.137 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 37.724,  lng: -92.143 },
  ],
  'Fort Wainwright': [
    { type: 'gate',       name: 'Fort Wainwright Main Gate',                  lat: 64.822,  lng: -147.651 },
    { type: 'medical',    name: 'Bassett Army Community Hospital',            lat: 64.826,  lng: -147.643 },
    { type: 'commissary', name: 'Fort Wainwright Commissary',                 lat: 64.827,  lng: -147.644 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 64.828,  lng: -147.643 },
    { type: 'chapel',     name: 'Fort Wainwright Chapel',                     lat: 64.829,  lng: -147.642 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 64.830,  lng: -147.641 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 64.824,  lng: -147.648 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 64.823,  lng: -147.652 },
    { type: 'hq',         name: '1st Stryker Brigade Combat Team HQ',         lat: 64.831,  lng: -147.640 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 64.825,  lng: -147.646 },
  ],
  'Fort Novosel': [
    { type: 'gate',       name: 'Fort Novosel Main Gate',                     lat: 31.362,  lng: -85.720 },
    { type: 'medical',    name: 'Lyster Army Health Clinic',                  lat: 31.366,  lng: -85.713 },
    { type: 'commissary', name: 'Fort Novosel Commissary',                    lat: 31.367,  lng: -85.714 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 31.368,  lng: -85.713 },
    { type: 'chapel',     name: 'Fort Novosel Chapel',                        lat: 31.369,  lng: -85.712 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 31.370,  lng: -85.711 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 31.364,  lng: -85.718 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 31.363,  lng: -85.721 },
    { type: 'hq',         name: 'Army Aviation Center of Excellence HQ',      lat: 31.371,  lng: -85.710 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 31.365,  lng: -85.716 },
  ],
  'Fort Leavenworth': [
    { type: 'gate',       name: 'Fort Leavenworth Main Gate',                 lat: 39.354,  lng: -94.928 },
    { type: 'medical',    name: 'Munson Army Health Center',                  lat: 39.358,  lng: -94.921 },
    { type: 'commissary', name: 'Fort Leavenworth Commissary',                lat: 39.359,  lng: -94.922 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 39.360,  lng: -94.921 },
    { type: 'chapel',     name: 'Fort Leavenworth Chapel',                    lat: 39.361,  lng: -94.920 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 39.362,  lng: -94.919 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 39.356,  lng: -94.926 },
    { type: 'education',  name: 'Command and General Staff College',          lat: 39.363,  lng: -94.918 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 39.355,  lng: -94.929 },
    { type: 'hq',         name: 'CGSC Headquarters',                          lat: 39.364,  lng: -94.917 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 39.357,  lng: -94.924 },
  ],
  'Fort Meade': [
    { type: 'gate',       name: 'Fort Meade Main Gate',                       lat: 39.097,  lng: -76.737 },
    { type: 'medical',    name: 'Kimbrough Ambulatory Care Center',           lat: 39.100,  lng: -76.731 },
    { type: 'commissary', name: 'Fort Meade Commissary',                      lat: 39.101,  lng: -76.732 },
    { type: 'exchange',   name: 'Main Exchange (PX)',                         lat: 39.102,  lng: -76.731 },
    { type: 'chapel',     name: 'Fort Meade Chapel',                          lat: 39.103,  lng: -76.730 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 39.104,  lng: -76.729 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 39.099,  lng: -76.735 },
    { type: 'education',  name: 'Education Center',                           lat: 39.105,  lng: -76.728 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 39.098,  lng: -76.738 },
    { type: 'hq',         name: 'NSA/CSS Headquarters',                       lat: 39.106,  lng: -76.727 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 39.100,  lng: -76.733 },
  ],
  // ── Navy (additional) ────────────────────────────────────────────────────────
  'Naval Station Mayport': [
    { type: 'gate',       name: 'Naval Station Mayport Main Gate',            lat: 30.388,  lng: -81.432 },
    { type: 'medical',    name: 'Naval Branch Health Clinic Mayport',         lat: 30.392,  lng: -81.427 },
    { type: 'commissary', name: 'Mayport Commissary',                         lat: 30.393,  lng: -81.428 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',                        lat: 30.394,  lng: -81.427 },
    { type: 'chapel',     name: 'Naval Station Mayport Chapel',               lat: 30.395,  lng: -81.426 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 30.396,  lng: -81.425 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 30.390,  lng: -81.430 },
    { type: 'education',  name: 'Navy College Office',                        lat: 30.397,  lng: -81.424 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 30.389,  lng: -81.433 },
    { type: 'hq',         name: 'Naval Station Mayport Headquarters',         lat: 30.398,  lng: -81.423 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 30.391,  lng: -81.429 },
  ],
  'NAS Pensacola': [
    { type: 'gate',       name: 'NAS Pensacola Main Gate',                    lat: 30.345,  lng: -87.325 },
    { type: 'medical',    name: 'Naval Hospital Pensacola',                   lat: 30.349,  lng: -87.321 },
    { type: 'commissary', name: 'NAS Pensacola Commissary',                   lat: 30.350,  lng: -87.320 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',                        lat: 30.351,  lng: -87.319 },
    { type: 'chapel',     name: 'NAS Pensacola Chapel',                       lat: 30.352,  lng: -87.318 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 30.353,  lng: -87.317 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 30.347,  lng: -87.323 },
    { type: 'education',  name: 'Navy College Office',                        lat: 30.354,  lng: -87.316 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 30.346,  lng: -87.326 },
    { type: 'hq',         name: 'NAS Pensacola Headquarters',                 lat: 30.355,  lng: -87.315 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 30.348,  lng: -87.322 },
  ],
  'Naval Base Kitsap': [
    { type: 'gate',       name: 'Naval Base Kitsap Main Gate',                lat: 47.550,  lng: -122.639 },
    { type: 'medical',    name: 'Naval Hospital Bremerton',                   lat: 47.554,  lng: -122.634 },
    { type: 'commissary', name: 'Naval Base Kitsap Commissary',               lat: 47.555,  lng: -122.633 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',                        lat: 47.556,  lng: -122.632 },
    { type: 'chapel',     name: 'Naval Base Kitsap Chapel',                   lat: 47.557,  lng: -122.631 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 47.558,  lng: -122.630 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 47.552,  lng: -122.637 },
    { type: 'education',  name: 'Navy College Office',                        lat: 47.559,  lng: -122.629 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 47.551,  lng: -122.640 },
    { type: 'hq',         name: 'Naval Base Kitsap Headquarters',             lat: 47.560,  lng: -122.628 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 47.553,  lng: -122.635 },
  ],
  'NAS Jacksonville': [
    { type: 'gate',       name: 'NAS Jacksonville Main Gate',                 lat: 30.214,  lng: -81.678 },
    { type: 'medical',    name: 'Naval Air Station Jacksonville Branch Clinic', lat: 30.218, lng: -81.673 },
    { type: 'commissary', name: 'NAS Jacksonville Commissary',                lat: 30.219,  lng: -81.672 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',                        lat: 30.220,  lng: -81.671 },
    { type: 'chapel',     name: 'NAS Jacksonville Chapel',                    lat: 30.221,  lng: -81.670 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 30.222,  lng: -81.669 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 30.216,  lng: -81.676 },
    { type: 'education',  name: 'Navy College Office',                        lat: 30.223,  lng: -81.668 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 30.215,  lng: -81.679 },
    { type: 'hq',         name: 'NAS Jacksonville Headquarters',              lat: 30.224,  lng: -81.667 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 30.217,  lng: -81.674 },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { type: 'gate',       name: 'Joint Base Pearl Harbor-Hickam Main Gate',   lat: 21.343,  lng: -157.957 },
    { type: 'medical',    name: 'Tripler Army Medical Center',                lat: 21.362,  lng: -157.920 },
    { type: 'commissary', name: 'Pearl Harbor Commissary',                    lat: 21.347,  lng: -157.953 },
    { type: 'exchange',   name: 'Navy Exchange (NEX)',                        lat: 21.348,  lng: -157.952 },
    { type: 'chapel',     name: 'JBPHH Chapel',                              lat: 21.349,  lng: -157.951 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 21.350,  lng: -157.950 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 21.345,  lng: -157.955 },
    { type: 'education',  name: 'Navy College Office',                        lat: 21.351,  lng: -157.949 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 21.344,  lng: -157.958 },
    { type: 'hq',         name: 'US Pacific Fleet Headquarters',              lat: 21.352,  lng: -157.948 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 21.346,  lng: -157.954 },
  ],
  // ── Marine Corps (additional) ────────────────────────────────────────────────
  'MCB Quantico': [
    { type: 'gate',       name: 'MCB Quantico Main Gate',                     lat: 38.514,  lng: -77.318 },
    { type: 'medical',    name: 'Naval Health Clinic Quantico',               lat: 38.518,  lng: -77.313 },
    { type: 'commissary', name: 'MCB Quantico Commissary',                    lat: 38.519,  lng: -77.312 },
    { type: 'exchange',   name: 'Marine Corps Exchange (MCX)',                lat: 38.520,  lng: -77.311 },
    { type: 'chapel',     name: 'MCB Quantico Chapel',                        lat: 38.521,  lng: -77.310 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 38.522,  lng: -77.309 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 38.516,  lng: -77.316 },
    { type: 'education',  name: 'Education Center',                           lat: 38.523,  lng: -77.308 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 38.515,  lng: -77.319 },
    { type: 'hq',         name: 'Marine Corps Base Quantico Headquarters',    lat: 38.524,  lng: -77.307 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 38.517,  lng: -77.314 },
  ],
  'MCAS Miramar': [
    { type: 'gate',       name: 'MCAS Miramar Main Gate',                     lat: 32.861,  lng: -117.150 },
    { type: 'medical',    name: 'Branch Health Clinic Miramar',               lat: 32.865,  lng: -117.146 },
    { type: 'commissary', name: 'MCAS Miramar Commissary',                    lat: 32.866,  lng: -117.145 },
    { type: 'exchange',   name: 'Marine Corps Exchange (MCX)',                lat: 32.867,  lng: -117.144 },
    { type: 'chapel',     name: 'MCAS Miramar Chapel',                        lat: 32.868,  lng: -117.143 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 32.869,  lng: -117.142 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 32.863,  lng: -117.148 },
    { type: 'education',  name: 'Education Center',                           lat: 32.870,  lng: -117.141 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 32.862,  lng: -117.151 },
    { type: 'hq',         name: '3rd Marine Aircraft Wing Headquarters',      lat: 32.871,  lng: -117.140 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 32.864,  lng: -117.147 },
  ],
  'MCAS Cherry Point': [
    { type: 'gate',       name: 'MCAS Cherry Point Main Gate',                lat: 34.894,  lng: -76.887 },
    { type: 'medical',    name: 'Branch Health Clinic Cherry Point',          lat: 34.898,  lng: -76.883 },
    { type: 'commissary', name: 'MCAS Cherry Point Commissary',               lat: 34.899,  lng: -76.882 },
    { type: 'exchange',   name: 'Marine Corps Exchange (MCX)',                lat: 34.900,  lng: -76.881 },
    { type: 'chapel',     name: 'MCAS Cherry Point Chapel',                   lat: 34.901,  lng: -76.880 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 34.902,  lng: -76.879 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 34.896,  lng: -76.885 },
    { type: 'education',  name: 'Education Center',                           lat: 34.903,  lng: -76.878 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 34.895,  lng: -76.888 },
    { type: 'hq',         name: '2nd Marine Aircraft Wing Headquarters',      lat: 34.904,  lng: -76.877 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 34.897,  lng: -76.884 },
  ],
  'MCB Hawaii Kaneohe Bay': [
    { type: 'gate',       name: 'MCB Hawaii Main Gate',                       lat: 21.445,  lng: -157.757 },
    { type: 'medical',    name: 'Branch Health Clinic Hawaii',                lat: 21.449,  lng: -157.753 },
    { type: 'commissary', name: 'MCB Hawaii Commissary',                      lat: 21.450,  lng: -157.752 },
    { type: 'exchange',   name: 'Marine Corps Exchange (MCX)',                lat: 21.451,  lng: -157.751 },
    { type: 'chapel',     name: 'MCB Hawaii Chapel',                          lat: 21.452,  lng: -157.750 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 21.453,  lng: -157.749 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 21.447,  lng: -157.755 },
    { type: 'education',  name: 'Education Center',                           lat: 21.454,  lng: -157.748 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 21.446,  lng: -157.758 },
    { type: 'hq',         name: 'Marine Corps Base Hawaii Headquarters',      lat: 21.455,  lng: -157.747 },
  ],
  // ── Air Force (additional) ───────────────────────────────────────────────────
  'Joint Base Langley-Eustis': [
    { type: 'gate',       name: 'Joint Base Langley-Eustis Main Gate',        lat: 37.074,  lng: -76.366 },
    { type: 'medical',    name: 'Langley AFB Health Clinic',                  lat: 37.078,  lng: -76.361 },
    { type: 'commissary', name: 'JBLE Commissary',                            lat: 37.079,  lng: -76.360 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 37.080,  lng: -76.359 },
    { type: 'chapel',     name: 'JBLE Chapel',                               lat: 37.081,  lng: -76.358 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 37.082,  lng: -76.357 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 37.076,  lng: -76.364 },
    { type: 'education',  name: 'Education Center',                           lat: 37.083,  lng: -76.356 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 37.075,  lng: -76.367 },
    { type: 'hq',         name: 'Air Combat Command Headquarters',            lat: 37.084,  lng: -76.355 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 37.077,  lng: -76.362 },
  ],
  'MacDill AFB': [
    { type: 'gate',       name: 'MacDill AFB Main Gate',                      lat: 27.842,  lng: -82.509 },
    { type: 'medical',    name: 'MacDill Air Force Base Clinic',              lat: 27.846,  lng: -82.505 },
    { type: 'commissary', name: 'MacDill Commissary',                         lat: 27.847,  lng: -82.504 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 27.848,  lng: -82.503 },
    { type: 'chapel',     name: 'MacDill AFB Chapel',                         lat: 27.849,  lng: -82.502 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 27.850,  lng: -82.501 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 27.844,  lng: -82.507 },
    { type: 'education',  name: 'Education Center',                           lat: 27.851,  lng: -82.500 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 27.843,  lng: -82.510 },
    { type: 'hq',         name: 'US Central Command (CENTCOM) Headquarters',  lat: 27.852,  lng: -82.499 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 27.845,  lng: -82.506 },
  ],
  'Eglin AFB': [
    { type: 'gate',       name: 'Eglin AFB Main Gate',                        lat: 30.472,  lng: -86.532 },
    { type: 'medical',    name: 'Eglin AFB Hospital',                         lat: 30.476,  lng: -86.528 },
    { type: 'commissary', name: 'Eglin Commissary',                           lat: 30.477,  lng: -86.527 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 30.478,  lng: -86.526 },
    { type: 'chapel',     name: 'Eglin AFB Chapel',                           lat: 30.479,  lng: -86.525 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 30.480,  lng: -86.524 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 30.474,  lng: -86.530 },
    { type: 'education',  name: 'Education Center',                           lat: 30.481,  lng: -86.523 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 30.473,  lng: -86.533 },
    { type: 'hq',         name: 'Air Force Materiel Command Detachment HQ',   lat: 30.482,  lng: -86.522 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 30.475,  lng: -86.529 },
  ],
  'Wright-Patterson AFB': [
    { type: 'gate',       name: 'Wright-Patterson AFB Main Gate',             lat: 39.819,  lng: -84.056 },
    { type: 'medical',    name: 'Wright-Patterson Medical Center',            lat: 39.823,  lng: -84.052 },
    { type: 'commissary', name: 'Wright-Patterson Commissary',                lat: 39.824,  lng: -84.051 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 39.825,  lng: -84.050 },
    { type: 'chapel',     name: 'Wright-Patterson AFB Chapel',                lat: 39.826,  lng: -84.049 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 39.827,  lng: -84.048 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 39.821,  lng: -84.054 },
    { type: 'education',  name: 'Education Center',                           lat: 39.828,  lng: -84.047 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 39.820,  lng: -84.057 },
    { type: 'hq',         name: 'Air Force Materiel Command (AFMC) Headquarters', lat: 39.829, lng: -84.046 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 39.822,  lng: -84.053 },
  ],
  'Nellis AFB': [
    { type: 'gate',       name: 'Nellis AFB Main Gate',                       lat: 36.229,  lng: -115.041 },
    { type: 'medical',    name: 'Mike O\'Callaghan Military Medical Center',  lat: 36.233,  lng: -115.037 },
    { type: 'commissary', name: 'Nellis Commissary',                          lat: 36.234,  lng: -115.036 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 36.235,  lng: -115.035 },
    { type: 'chapel',     name: 'Nellis AFB Chapel',                          lat: 36.236,  lng: -115.034 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 36.237,  lng: -115.033 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 36.231,  lng: -115.039 },
    { type: 'education',  name: 'Education Center',                           lat: 36.238,  lng: -115.032 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 36.230,  lng: -115.042 },
    { type: 'hq',         name: 'USAF Warfare Center Headquarters',           lat: 36.239,  lng: -115.031 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 36.232,  lng: -115.038 },
  ],
  'Travis AFB': [
    { type: 'gate',       name: 'Travis AFB Main Gate',                       lat: 38.256,  lng: -121.933 },
    { type: 'medical',    name: 'David Grant USAF Medical Center',            lat: 38.260,  lng: -121.929 },
    { type: 'commissary', name: 'Travis Commissary',                          lat: 38.261,  lng: -121.928 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 38.262,  lng: -121.927 },
    { type: 'chapel',     name: 'Travis AFB Chapel',                          lat: 38.263,  lng: -121.926 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 38.264,  lng: -121.925 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 38.258,  lng: -121.931 },
    { type: 'education',  name: 'Education Center',                           lat: 38.265,  lng: -121.924 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 38.257,  lng: -121.934 },
    { type: 'hq',         name: 'Air Mobility Command Detachment HQ',         lat: 38.266,  lng: -121.923 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 38.259,  lng: -121.930 },
  ],
  'Joint Base Andrews': [
    { type: 'gate',       name: 'Joint Base Andrews Main Gate',               lat: 38.804,  lng: -76.873 },
    { type: 'medical',    name: 'Joint Base Andrews Health Clinic',           lat: 38.808,  lng: -76.869 },
    { type: 'commissary', name: 'Joint Base Andrews Commissary',              lat: 38.809,  lng: -76.868 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 38.810,  lng: -76.867 },
    { type: 'chapel',     name: 'Joint Base Andrews Chapel',                  lat: 38.811,  lng: -76.866 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 38.812,  lng: -76.865 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 38.806,  lng: -76.871 },
    { type: 'education',  name: 'Education Center',                           lat: 38.813,  lng: -76.864 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 38.805,  lng: -76.874 },
    { type: 'hq',         name: 'Air Force District of Washington Headquarters', lat: 38.814, lng: -76.863 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 38.807,  lng: -76.870 },
  ],
  'Barksdale AFB': [
    { type: 'gate',       name: 'Barksdale AFB Main Gate',                    lat: 32.495,  lng: -93.672 },
    { type: 'medical',    name: 'Barksdale AFB Health Clinic',                lat: 32.499,  lng: -93.668 },
    { type: 'commissary', name: 'Barksdale Commissary',                       lat: 32.500,  lng: -93.667 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 32.501,  lng: -93.666 },
    { type: 'chapel',     name: 'Barksdale AFB Chapel',                       lat: 32.502,  lng: -93.665 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 32.503,  lng: -93.664 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 32.497,  lng: -93.670 },
    { type: 'education',  name: 'Education Center',                           lat: 32.504,  lng: -93.663 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 32.496,  lng: -93.673 },
    { type: 'hq',         name: 'Air Force Global Strike Command Headquarters', lat: 32.505, lng: -93.662 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 32.498,  lng: -93.669 },
  ],
  'Scott AFB': [
    { type: 'gate',       name: 'Scott AFB Main Gate',                        lat: 38.538,  lng: -89.857 },
    { type: 'medical',    name: 'Scott AFB Health Clinic',                    lat: 38.542,  lng: -89.853 },
    { type: 'commissary', name: 'Scott Commissary',                           lat: 38.543,  lng: -89.852 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 38.544,  lng: -89.851 },
    { type: 'chapel',     name: 'Scott AFB Chapel',                           lat: 38.545,  lng: -89.850 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 38.546,  lng: -89.849 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 38.540,  lng: -89.855 },
    { type: 'education',  name: 'Education Center',                           lat: 38.547,  lng: -89.848 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 38.539,  lng: -89.858 },
    { type: 'hq',         name: 'Air Mobility Command Headquarters',          lat: 38.548,  lng: -89.847 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 38.541,  lng: -89.854 },
  ],
  'Hill AFB': [
    { type: 'gate',       name: 'Hill AFB Main Gate',                         lat: 41.117,  lng: -111.980 },
    { type: 'medical',    name: '75th Medical Group Clinic',                  lat: 41.121,  lng: -111.976 },
    { type: 'commissary', name: 'Hill AFB Commissary',                        lat: 41.122,  lng: -111.975 },
    { type: 'exchange',   name: 'Base Exchange (BX)',                         lat: 41.123,  lng: -111.974 },
    { type: 'chapel',     name: 'Hill AFB Chapel',                            lat: 41.124,  lng: -111.973 },
    { type: 'gym',        name: 'Fitness Center',                             lat: 41.125,  lng: -111.972 },
    { type: 'housing',    name: 'Housing Division Office',                    lat: 41.119,  lng: -111.978 },
    { type: 'education',  name: 'Education Center',                           lat: 41.126,  lng: -111.971 },
    { type: 'visitor',    name: 'Visitor Control Center',                     lat: 41.118,  lng: -111.981 },
    { type: 'hq',         name: 'Ogden Air Logistics Complex Headquarters',   lat: 41.127,  lng: -111.970 },
    { type: 'childcare',  name: 'Child Development Center',                   lat: 41.120,  lng: -111.977 },
  ],
  // ── Space Force ────────────────────────────────────────────────────────────
  'Cape Canaveral Space Force Station': [
    { type: 'gate',       name: 'CCSFS Main Gate',                       lat: 28.4820, lng: -80.5740 },
    { type: 'hq',         name: '45th Space Wing / Space Launch Delta HQ', lat: 28.4889, lng: -80.5778 },
    { type: 'medical',    name: 'CCSFS Health Clinic',                   lat: 28.4860, lng: -80.5760 },
    { type: 'exchange',   name: 'BX / Shoppette',                        lat: 28.4870, lng: -80.5750 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 28.4880, lng: -80.5740 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 28.4825, lng: -80.5745 },
    { type: 'education',  name: 'Education Center',                      lat: 28.4895, lng: -80.5730 },
  ],
  'Los Angeles AFB': [
    { type: 'gate',       name: 'Main Gate (El Segundo Blvd)',            lat: 33.9155, lng: -118.3850 },
    { type: 'hq',         name: 'Space Systems Command HQ',              lat: 33.9167, lng: -118.3833 },
    { type: 'medical',    name: 'LA AFB Health & Wellness Center',       lat: 33.9175, lng: -118.3820 },
    { type: 'exchange',   name: 'BX / Shoppette',                        lat: 33.9170, lng: -118.3828 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 33.9180, lng: -118.3818 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 33.9160, lng: -118.3848 },
    { type: 'education',  name: 'Education Center',                      lat: 33.9185, lng: -118.3810 },
  ],
  'Cheyenne Mountain SFS': [
    { type: 'gate',       name: 'Main Gate (Peterson Access)',            lat: 38.7410, lng: -104.8510 },
    { type: 'hq',         name: 'NORAD / USSPACECOM Command Center',     lat: 38.7441, lng: -104.8475 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 38.7415, lng: -104.8505 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 38.7450, lng: -104.8465 },
  ],
  'Buckley SFB': [
    { type: 'gate',       name: 'Main Gate (Buckley Rd)',                 lat: 39.7110, lng: -104.7560 },
    { type: 'gate',       name: 'South Gate',                            lat: 39.7060, lng: -104.7490 },
    { type: 'medical',    name: 'Buckley Health Clinic',                 lat: 39.7166, lng: -104.7513 },
    { type: 'commissary', name: 'Commissary',                            lat: 39.7175, lng: -104.7520 },
    { type: 'exchange',   name: 'BX / Base Exchange',                    lat: 39.7180, lng: -104.7510 },
    { type: 'chapel',     name: 'Chapel',                                lat: 39.7185, lng: -104.7500 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 39.7190, lng: -104.7490 },
    { type: 'housing',    name: 'Housing Office',                        lat: 39.7120, lng: -104.7555 },
    { type: 'education',  name: 'Education Center',                      lat: 39.7195, lng: -104.7480 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 39.7115, lng: -104.7558 },
    { type: 'hq',         name: 'Space Base Delta 1 HQ',                 lat: 39.7200, lng: -104.7470 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 39.7170, lng: -104.7528 },
  ],
  'Schriever SFB': [
    { type: 'gate',       name: 'Main Gate (Space Vista Blvd)',          lat: 38.7970, lng: -104.5320 },
    { type: 'medical',    name: 'Schriever Health Clinic',               lat: 38.8019, lng: -104.5269 },
    { type: 'commissary', name: 'Shoppette',                             lat: 38.8030, lng: -104.5260 },
    { type: 'exchange',   name: 'BX / Shoppette',                        lat: 38.8035, lng: -104.5250 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 38.8040, lng: -104.5240 },
    { type: 'housing',    name: 'Housing Office',                        lat: 38.7980, lng: -104.5315 },
    { type: 'education',  name: 'Education Center',                      lat: 38.8045, lng: -104.5230 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 38.7975, lng: -104.5325 },
    { type: 'hq',         name: '50th Space Wing HQ',                    lat: 38.8050, lng: -104.5220 },
  ],
  'Peterson SFB': [
    { type: 'gate',       name: 'Main Gate (Space Command Way)',         lat: 38.8140, lng: -104.7060 },
    { type: 'medical',    name: 'Peterson Health Clinic',                lat: 38.8196, lng: -104.7005 },
    { type: 'commissary', name: 'Commissary',                            lat: 38.8205, lng: -104.6995 },
    { type: 'exchange',   name: 'BX / Base Exchange',                    lat: 38.8210, lng: -104.6985 },
    { type: 'chapel',     name: 'Chapel',                                lat: 38.8215, lng: -104.6975 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 38.8220, lng: -104.6965 },
    { type: 'housing',    name: 'Housing Office',                        lat: 38.8150, lng: -104.7055 },
    { type: 'education',  name: 'Education Center',                      lat: 38.8225, lng: -104.6955 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 38.8145, lng: -104.7063 },
    { type: 'hq',         name: 'U.S. Space Command (USSPACECOM) HQ',   lat: 38.8230, lng: -104.6945 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 38.8200, lng: -104.7000 },
  ],
  'Patrick SFB': [
    { type: 'gate',       name: 'Main Gate (AIA Pkwy)',                  lat: 28.2290, lng: -80.6150 },
    { type: 'medical',    name: 'Patrick SFB Clinic',                    lat: 28.2348, lng: -80.6106 },
    { type: 'commissary', name: 'Commissary',                            lat: 28.2360, lng: -80.6095 },
    { type: 'exchange',   name: 'BX / Base Exchange',                    lat: 28.2365, lng: -80.6085 },
    { type: 'chapel',     name: 'Chapel',                                lat: 28.2370, lng: -80.6075 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 28.2375, lng: -80.6065 },
    { type: 'housing',    name: 'Housing Office',                        lat: 28.2300, lng: -80.6145 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 28.2295, lng: -80.6155 },
    { type: 'hq',         name: 'Space Base Delta 2 HQ',                 lat: 28.2380, lng: -80.6055 },
    { type: 'education',  name: 'Education Center',                      lat: 28.2385, lng: -80.6045 },
  ],
  'Vandenberg SFB': [
    { type: 'gate',       name: 'Main Gate (California Blvd)',           lat: 34.7360, lng: -120.5680 },
    { type: 'gate',       name: 'North Vandenberg Gate',                 lat: 34.7900, lng: -120.5560 },
    { type: 'medical',    name: 'Vandenberg SFB Medical Group',         lat: 34.7420, lng: -120.5625 },
    { type: 'commissary', name: 'Commissary',                            lat: 34.7430, lng: -120.5615 },
    { type: 'exchange',   name: 'BX / Base Exchange',                    lat: 34.7435, lng: -120.5605 },
    { type: 'chapel',     name: 'Chapel',                                lat: 34.7440, lng: -120.5595 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 34.7445, lng: -120.5585 },
    { type: 'housing',    name: 'Housing Office',                        lat: 34.7370, lng: -120.5675 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 34.7365, lng: -120.5685 },
    { type: 'hq',         name: 'Space Launch Delta 30 HQ',             lat: 34.7450, lng: -120.5575 },
    { type: 'education',  name: 'Education Center',                      lat: 34.7455, lng: -120.5565 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 34.7425, lng: -120.5620 },
  ],
  // ── Coast Guard ────────────────────────────────────────────────────────────
  'USCG Training Center Cape May': [
    { type: 'gate',       name: 'Main Gate (Seashore Rd)',               lat: 38.9280, lng: -74.9080 },
    { type: 'medical',    name: 'Health Services Office',                lat: 38.9347, lng: -74.9015 },
    { type: 'commissary', name: 'Commissary / Exchange',                 lat: 38.9355, lng: -74.9005 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 38.9360, lng: -74.9000 },
    { type: 'chapel',     name: 'Chapel',                                lat: 38.9365, lng: -74.8995 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 38.9370, lng: -74.8990 },
    { type: 'housing',    name: 'Barracks / Housing',                    lat: 38.9290, lng: -74.9075 },
    { type: 'hq',         name: 'TRACEN Cape May HQ (Boot Camp)',       lat: 38.9375, lng: -74.8985 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 38.9285, lng: -74.9083 },
    { type: 'dining',     name: 'Galley (Dining Facility)',              lat: 38.9350, lng: -74.9010 },
  ],
  'USCG Base Kodiak': [
    { type: 'gate',       name: 'Main Gate (Rezanof Dr)',                lat: 57.7840, lng: -152.3730 },
    { type: 'medical',    name: 'USCG Base Kodiak Clinic',               lat: 57.7896, lng: -152.3680 },
    { type: 'commissary', name: 'Commissary',                            lat: 57.7905, lng: -152.3670 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 57.7910, lng: -152.3660 },
    { type: 'chapel',     name: 'Chapel',                                lat: 57.7915, lng: -152.3650 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 57.7920, lng: -152.3640 },
    { type: 'housing',    name: 'Housing Office',                        lat: 57.7850, lng: -152.3725 },
    { type: 'hq',         name: 'Sector Anchorage / Base Kodiak HQ',    lat: 57.7925, lng: -152.3630 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 57.7845, lng: -152.3728 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 57.7900, lng: -152.3675 },
  ],
  'USCG Base Honolulu': [
    { type: 'gate',       name: 'Main Gate (Sand Island Access Rd)',     lat: 21.3050, lng: -157.8700 },
    { type: 'medical',    name: 'USCG Base Honolulu Clinic',             lat: 21.3110, lng: -157.8654 },
    { type: 'commissary', name: 'Commissary',                            lat: 21.3120, lng: -157.8645 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 21.3125, lng: -157.8638 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 21.3130, lng: -157.8630 },
    { type: 'housing',    name: 'Housing Office',                        lat: 21.3060, lng: -157.8695 },
    { type: 'hq',         name: 'Sector Honolulu HQ',                   lat: 21.3135, lng: -157.8622 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 21.3055, lng: -157.8698 },
  ],
  'USCG Base Elizabeth City': [
    { type: 'gate',       name: 'Main Gate (Halstead Blvd)',             lat: 36.2700, lng: -76.2210 },
    { type: 'medical',    name: 'Health Services Office',                lat: 36.2760, lng: -76.2155 },
    { type: 'commissary', name: 'Commissary',                            lat: 36.2770, lng: -76.2145 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 36.2775, lng: -76.2138 },
    { type: 'chapel',     name: 'Chapel',                                lat: 36.2780, lng: -76.2130 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 36.2785, lng: -76.2122 },
    { type: 'housing',    name: 'Housing Office',                        lat: 36.2710, lng: -76.2205 },
    { type: 'hq',         name: 'AIRSTA Elizabeth City / Base HQ',      lat: 36.2790, lng: -76.2115 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 36.2705, lng: -76.2208 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 36.2765, lng: -76.2150 },
  ],
  'USCG ISC Portsmouth': [
    { type: 'gate',       name: 'Main Gate (Portsmouth ISC)',            lat: 36.8275, lng: -76.3015 },
    { type: 'medical',    name: 'Health Services Office',                lat: 36.8331, lng: -76.2972 },
    { type: 'commissary', name: 'Commissary',                            lat: 36.8340, lng: -76.2963 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 36.8345, lng: -76.2955 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 36.8350, lng: -76.2948 },
    { type: 'housing',    name: 'Housing Office',                        lat: 36.8280, lng: -76.3010 },
    { type: 'hq',         name: 'ISC Portsmouth HQ',                    lat: 36.8355, lng: -76.2940 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 36.8278, lng: -76.3013 },
  ],
  'Coast Guard Island Alameda': [
    { type: 'gate',       name: 'Main Gate (Coast Guard Island)',        lat: 37.7690, lng: -122.3050 },
    { type: 'medical',    name: 'Health Services Office',                lat: 37.7737, lng: -122.3001 },
    { type: 'commissary', name: 'Commissary',                            lat: 37.7745, lng: -122.2992 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 37.7750, lng: -122.2985 },
    { type: 'chapel',     name: 'Chapel',                                lat: 37.7755, lng: -122.2978 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 37.7760, lng: -122.2970 },
    { type: 'housing',    name: 'Housing Office',                        lat: 37.7695, lng: -122.3045 },
    { type: 'hq',         name: 'USCG Pacific Area HQ',                 lat: 37.7765, lng: -122.2963 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 37.7693, lng: -122.3048 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 37.7742, lng: -122.2997 },
  ],
  'USCG Training Center Petaluma': [
    { type: 'gate',       name: 'Main Gate (TRACEN Petaluma)',           lat: 38.2320, lng: -122.6510 },
    { type: 'medical',    name: 'Health Services Office',                lat: 38.2377, lng: -122.6463 },
    { type: 'commissary', name: 'Commissary',                            lat: 38.2385, lng: -122.6455 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 38.2390, lng: -122.6448 },
    { type: 'chapel',     name: 'Chapel',                                lat: 38.2395, lng: -122.6440 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 38.2400, lng: -122.6433 },
    { type: 'housing',    name: 'Barracks / Housing',                    lat: 38.2325, lng: -122.6505 },
    { type: 'hq',         name: 'TRACEN Petaluma HQ',                   lat: 38.2405, lng: -122.6425 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 38.2322, lng: -122.6508 },
    { type: 'childcare',  name: 'Child Development Center',              lat: 38.2382, lng: -122.6460 },
  ],
  'USCG Sector New York': [
    { type: 'gate',       name: 'Main Gate (Staten Island)',             lat: 40.6840, lng: -74.0490 },
    { type: 'medical',    name: 'Health Services Office',                lat: 40.6892, lng: -74.0445 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 40.6900, lng: -74.0438 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 40.6905, lng: -74.0430 },
    { type: 'hq',         name: 'Sector New York HQ',                   lat: 40.6910, lng: -74.0423 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 40.6845, lng: -74.0488 },
  ],
  'USCG Sector Miami': [
    { type: 'gate',       name: 'Main Gate (Miami USCG Base)',           lat: 25.7560, lng: -80.1840 },
    { type: 'medical',    name: 'Health Services Office',                lat: 25.7615, lng: -80.1793 },
    { type: 'exchange',   name: 'Coast Guard Exchange',                  lat: 25.7622, lng: -80.1786 },
    { type: 'gym',        name: 'Fitness Center',                        lat: 25.7628, lng: -80.1778 },
    { type: 'hq',         name: 'Sector Miami HQ',                      lat: 25.7634, lng: -80.1770 },
    { type: 'visitor',    name: 'Visitor Control Center',                lat: 25.7565, lng: -80.1837 },
  ],
};

// ─── Build lookup map: normalize base name variants ─────────────────────────
const NORM = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const facilityKeys = Object.keys(FACILITIES);
const getFacilities = (name) => {
  const n = NORM(name);
  const key = facilityKeys.find(k => NORM(k) === n || NORM(name).includes(NORM(k)) || NORM(k).includes(NORM(name)));
  return key ? FACILITIES[key] : [];
};

const getBaseData = (installationLabel) => {
  // installationLabel may be "Fort Liberty, NC" format
  const baseName = (installationLabel || '').split(',')[0].trim();
  const baseInfo = ALL_BASES.find(b => NORM(b.name) === NORM(baseName)) || ALL_BASES.find(b => NORM(baseName).includes(NORM(b.name)) || NORM(b.name).includes(NORM(baseName)));
  return baseInfo || null;
};

// ─── Create emoji divIcon ────────────────────────────────────────────────────
const makeIcon = (emoji, color) => L.divIcon({
  html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));text-align:center;">${emoji}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const makeBaseIcon = () => L.divIcon({
  html: `<div style="background:#0A1628;border:3px solid #C8A84B;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.5);">🎖️</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function BaseMapModule({ theme, profile }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({});
  const [selectedBase, setSelectedBase] = useState('');
  const [activeFilters, setActiveFilters] = useState(() => new Set(Object.keys(FACILITY_TYPES)));
  const [showLegend, setShowLegend] = useState(false);
  const [noData, setNoData] = useState(false);

  // Sync selected base from profile gaining installation
  useEffect(() => {
    if (profile?.gainingInstallation) {
      const baseName = profile.gainingInstallation.split(',')[0].trim();
      setSelectedBase(baseName);
    } else if (ALL_BASES.length > 0) {
      setSelectedBase(ALL_BASES[0].name);
    }
  }, [profile?.gainingInstallation]);

  // Build / rebuild map when selected base changes
  useEffect(() => {
    if (!mapRef.current || !selectedBase) return;

    // Destroy old map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      layerGroupsRef.current = {};
    }

    const baseInfo = getBaseData(selectedBase);
    if (!baseInfo) {
      setNoData(true);
      return;
    }
    setNoData(false);

    const map = L.map(mapRef.current, {
      center: [baseInfo.lat, baseInfo.lng],
      zoom: baseInfo.zoom || 13,
      zoomControl: true,
      attributionControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Base center marker
    L.marker([baseInfo.lat, baseInfo.lng], { icon: makeBaseIcon() })
      .bindPopup(`<b>${baseInfo.name}</b><br/>${baseInfo.branch} · ${baseInfo.state}`)
      .addTo(map);

    // Create layer groups per facility type
    const groups = {};
    Object.keys(FACILITY_TYPES).forEach(t => {
      groups[t] = L.layerGroup().addTo(map);
    });
    layerGroupsRef.current = groups;

    // Add facility markers
    const facilities = getFacilities(selectedBase);
    facilities.forEach(f => {
      const ft = FACILITY_TYPES[f.type] || FACILITY_TYPES.hq;
      const marker = L.marker([f.lat, f.lng], { icon: makeIcon(ft.icon, ft.color) })
        .bindPopup(`<b>${ft.icon} ${f.name}</b><br/><span style="font-size:11px;color:#555;">${ft.label}</span>`);
      groups[f.type]?.addLayer(marker);
    });

    if (facilities.length === 0) {
      L.popup()
        .setLatLng([baseInfo.lat, baseInfo.lng])
        .setContent(`<b>${baseInfo.name}</b><br/>${baseInfo.branch} · ${baseInfo.state}<br/><small>For full installation maps and facility directories, visit:<br/><a href="https://www.militaryinstallations.dod.mil/" target="_blank">militaryinstallations.dod.mil</a></small>`)
        .openOn(map);
    }

    // Force redraw after container becomes visible
    setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupsRef.current = {};
      }
    };
  }, [selectedBase]);

  // Toggle layer visibility when filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    Object.entries(layerGroupsRef.current).forEach(([type, group]) => {
      if (activeFilters.has(type)) {
        if (!map.hasLayer(group)) map.addLayer(group);
      } else {
        if (map.hasLayer(group)) map.removeLayer(group);
      }
    });
  }, [activeFilters]);

  const toggleFilter = (type) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const toggleAll = () => {
    if (activeFilters.size === Object.keys(FACILITY_TYPES).length) {
      setActiveFilters(new Set());
    } else {
      setActiveFilters(new Set(Object.keys(FACILITY_TYPES)));
    }
  };

  const baseInfo = getBaseData(selectedBase);
  const facilityCount = getFacilities(selectedBase).length;
  const sortedBases = [...ALL_BASES].sort((a, b) => a.name.localeCompare(b.name));
  const conus = sortedBases.filter(b => !b.country);
  const oconus = sortedBases.filter(b => b.country);

  return (
    <div style={{ fontFamily: 'system-ui', background: '#f0f4f8', minHeight: '100%' }}>
      {/* Base selector */}
      <div style={{ padding: '12px 14px', background: theme.secondary, borderBottom: `1px solid ${theme.accent}30` }}>
        <div style={{ fontSize: 10, color: theme.accent, fontWeight: 800, marginBottom: 6, letterSpacing: '.1em' }}>
          SELECT INSTALLATION
        </div>
        <select
          value={selectedBase}
          onChange={e => setSelectedBase(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${theme.accent}40`, background: '#FFFFFF', fontSize: 12, fontWeight: 700, color: '#0D1821', appearance: 'none' }}
        >
          <optgroup label="── CONUS ──────────────────────">
            {conus.map(b => <option key={b.name} value={b.name}>{b.name}, {b.state} ({b.branch})</option>)}
          </optgroup>
          <optgroup label="── OCONUS ─────────────────────">
            {oconus.map(b => <option key={b.name} value={b.name}>{b.name}, {b.state} ({b.branch})</option>)}
          </optgroup>
        </select>
        {baseInfo && (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 10, background: theme.primary, color: '#FFF', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{baseInfo.branch}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{facilityCount > 0 ? `${facilityCount} facilities mapped` : 'Base location only'}</span>
              {baseInfo.country && <span style={{ fontSize: 10, background: '#E74C3C', color: '#FFF', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>OCONUS</span>}
            </div>
            <a href="https://www.militaryinstallations.dod.mil/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 10, color: theme.accent, fontWeight: 700, textDecoration: 'none', letterSpacing: '.04em' }}>
              Official Installation Directory →
            </a>
          </div>
        )}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ width: '100%', height: '52vh', background: '#e8f0f8', position: 'relative' }}
      />

      {/* Legend toggle button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderBottom: '1px solid #E0E6EE' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821' }}>
          {facilityCount > 0 ? `📍 ${facilityCount} facilities` : '📍 Base location only'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleAll} style={{ fontSize: 10, padding: '4px 10px', background: activeFilters.size === Object.keys(FACILITY_TYPES).length ? theme.primary : '#E0E6EE', color: activeFilters.size === Object.keys(FACILITY_TYPES).length ? '#FFF' : '#556', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            {activeFilters.size === Object.keys(FACILITY_TYPES).length ? 'Hide All' : 'Show All'}
          </button>
          <button onClick={() => setShowLegend(v => !v)} style={{ fontSize: 10, padding: '4px 10px', background: showLegend ? theme.accent : '#E0E6EE', color: showLegend ? '#0D1821' : '#556', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            {showLegend ? '▲ Legend' : '▼ Legend'}
          </button>
        </div>
      </div>

      {/* Legend / filter panel */}
      {showLegend && (
        <div style={{ background: '#FFFFFF', padding: '10px 14px', borderBottom: '1px solid #E0E6EE' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#56697C', marginBottom: 8, letterSpacing: '.08em' }}>TAP TO TOGGLE FACILITY LAYERS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(FACILITY_TYPES).map(([key, ft]) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${activeFilters.has(key) ? ft.color : '#E0E6EE'}`,
                  background: activeFilters.has(key) ? ft.color + '18' : '#F8F9FA',
                  opacity: activeFilters.has(key) ? 1 : 0.5,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{ft.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: activeFilters.has(key) ? ft.color : '#888', lineHeight: 1.2 }}>{ft.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick reference list */}
      {getFacilities(selectedBase).length > 0 && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', marginBottom: 10, letterSpacing: '.08em' }}>KEY LOCATIONS</div>
          {getFacilities(selectedBase).filter(f => activeFilters.has(f.type)).map((f, i) => {
            const ft = FACILITY_TYPES[f.type] || FACILITY_TYPES.hq;
            return (
              <div key={i} style={{ background: '#FFFFFF', borderRadius: 10, padding: '10px 12px', marginBottom: 8, borderLeft: `3px solid ${ft.color}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{ft.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: '#56697C' }}>{ft.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {noData && (
        <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
          <div style={{ fontWeight: 700 }}>Base not found in database</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Try selecting a base from the dropdown above</div>
        </div>
      )}
    </div>
  );
}
