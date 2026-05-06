/*
 * Purpose: Main PCS Express React shell, onboarding flow, tab navigation, and core PCS modules.
 * Third-party dependencies: React, Leaflet through child map modules, Capacitor bridge when running native.
 */

import { useState, useEffect } from 'react'
import './App.css'
import EmploymentModule from './components/EmploymentModule'
import NavigationModule from './components/NavigationModule'
import EducationModule from './components/EducationModule'
import TranslationModule from './components/TranslationModule'
import ReligiousServicesModule from './components/ReligiousServicesModule'
import SpouseDeploymentGuide from './components/SpouseDeploymentGuide'
import PCSDocumentsModule from './components/PCSDocumentsModule'
import ImmigrationModule from './components/ImmigrationModule'
import MovingFinancialAssistanceTab from './components/MovingFinancialAssistanceTab'
import PetRelocationChecklistTab from './components/PetRelocationChecklistTab'
import EFMPTab from './components/EFMPTab'
import HomeRelocationTab from './components/HomeRelocationTab'
import PrivacyShield from './components/PrivacyShield'
import SyncStatusIndicator from './components/SyncStatusIndicator'
import UnitInfoScreen from './components/UnitInfoScreen'
import { PublicDataNotice, LocalEncryptedDataNotice } from './components/SecurityNotice'
import { AuditLogger, secureLocalStore, readLegacyJson } from './security/SecurityExtensions'
import { ALL_BASES } from './components/BaseMapModule'
import MILITARY_UNITS from './data/militaryUnits'

const store = {
  get: (k) => readLegacyJson(k, null),
  set: (k, v) => { secureLocalStore.set(k, v); },
};

const normLookup = (value) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function findPublicUnitProfile(profile) {
  const selectedUnit = profile?.unit || '';
  const selectedBase = (profile?.gainingInstallation || '').split(',')[0].trim();
  if (!selectedUnit) return null;

  const possibleKeys = [
    profile?.gainingInstallation,
    selectedBase,
    `${selectedBase} ${profile?.branch || ''}`,
    `${selectedBase} ${(profile?.gainingInstallation || '').split(',')[1] || ''}`,
  ].filter(Boolean);

  const candidates = Object.entries(MILITARY_UNITS).flatMap(([key, units]) => {
    const keyMatch = possibleKeys.some(candidate => normLookup(key).includes(normLookup(candidate)) || normLookup(candidate).includes(normLookup(key)));
    return keyMatch ? units : [];
  });

  return candidates.find(unit => normLookup(unit.name) === normLookup(selectedUnit))
    || candidates.find(unit => normLookup(unit.name).includes(normLookup(selectedUnit)) || normLookup(selectedUnit).includes(normLookup(unit.name)))
    || makePublicLookupUnitProfile(profile);
}

const publicSearchUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
const militaryInstallationsUrl = 'https://installations.militaryonesource.mil/';

const PUBLIC_BRANCH_UNIFORMS = {
  Army: ['Army Combat Uniform (ACU)', 'Army Green Service Uniform (AGSU)', 'Army Service Uniform (ASU)', 'Army Physical Fitness Uniform (APFU)'],
  Navy: ['Navy Working Uniform Type III', 'Service Khaki', 'Service Dress Blue', 'Navy Physical Training Uniform'],
  'Marine Corps': ['Marine Corps Combat Utility Uniform (MCCUU)', 'Service Alpha / Bravo / Charlie', 'Dress Blue', 'USMC physical training uniform'],
  'Air Force': ['Operational Camouflage Pattern (OCP)', 'Service Dress', 'Blues uniform', 'Air Force physical training gear'],
  'Space Force': ['Operational Camouflage Pattern (OCP)', 'Service Dress / Blues', 'Space Force physical training gear'],
  'Coast Guard': ['Operational Dress Uniform (ODU)', 'Tropical Blue', 'Service Dress Blue', 'Coast Guard physical fitness clothing'],
};

const getBranchUniforms = (branch) => PUBLIC_BRANCH_UNIFORMS[branch] || ['Daily duty uniform', 'Service uniform', 'Physical training uniform'];

function makePublicLookupUnitProfile(profile = {}) {
  const unitName = profile?.unit || `${profile?.branch || 'Military'} gaining unit`;
  const baseName = (profile?.gainingInstallation || '').split(',')[0].trim() || 'gaining installation';
  const branch = profile?.branch || 'Military';
  const publicQuery = `${unitName} ${baseName} official public`;
  return {
    id: `PUBLIC-${normLookup(unitName).slice(0, 24) || 'UNIT'}`,
    name: unitName,
    branch,
    nickname: 'Public-source lookup profile',
    established: 'Verify through official unit history or lineage page',
    motto: 'Verify through official public command page',
    website: publicSearchUrl(`${publicQuery} website`),
    social: {},
    history: `${unitName} at ${baseName} is populated through the public lookup fallback. Use the official links below to verify the command page, public affairs releases, DVIDS imagery/news, and approved public social media before relying on details.`,
    uniforms: getBranchUniforms(branch),
    contacts: [
      { label: 'MilitaryINSTALLATIONS directory', url: militaryInstallationsUrl },
      { label: 'Google official unit page', url: publicSearchUrl(`${publicQuery} site:.mil OR site:.gov`) },
      { label: 'Google public affairs / DVIDS', url: publicSearchUrl(`${unitName} ${baseName} DVIDS public affairs`) },
      { label: 'Google staff duty / quarterdeck public contact', url: publicSearchUrl(`${unitName} ${baseName} staff duty quarterdeck public contact`) },
    ],
    sourceStatus: 'Generated public lookup profile',
  };
}

const BRANCH_THEMES = {
  Army:           { primary: "#4A5E2A", secondary: "#2C3A14", accent: "#C8A84B", motto: "HOOAH",          tagline: "This We'll Defend",            insignia: "USA",  abbr: "USA"  },
  Navy:           { primary: "#1A2A5E", secondary: "#0D1838", accent: "#C8A84B", motto: "BRAVO ZULU",     tagline: "A Global Force for Good",      insignia: "USN",  abbr: "USN"  },
  "Marine Corps": { primary: "#8B0000", secondary: "#5C0000", accent: "#C8A84B", motto: "SEMPER FIDELIS", tagline: "The Few. The Proud.",           insignia: "USMC", abbr: "USMC" },
  "Air Force":    { primary: "#1A3A5C", secondary: "#0D2240", accent: "#60A0C8", motto: "AIM HIGH",       tagline: "Fly–Fight–Win",                insignia: "USAF", abbr: "USAF" },
  "Space Force":  { primary: "#1A1A3E", secondary: "#0A0A28", accent: "#7AB0E0", motto: "SEMPER SUPRA",   tagline: "Guardians of the High Ground", insignia: "USSF", abbr: "USSF" },
  "Coast Guard":  { primary: "#005A8E", secondary: "#003D6A", accent: "#FF6B00", motto: "SEMPER PARATUS", tagline: "Always Ready",                 insignia: "USCG", abbr: "USCG" },
};

const BRANCH_RANKS = {
  'Army': [
    { grade: 'E-1',  title: 'Private',                             abbr: 'PVT'        },
    { grade: 'E-2',  title: 'Private Second Class',                abbr: 'PV2'        },
    { grade: 'E-3',  title: 'Private First Class',                 abbr: 'PFC'        },
    { grade: 'E-4',  title: 'Specialist / Corporal',               abbr: 'SPC/CPL'    },
    { grade: 'E-5',  title: 'Sergeant',                            abbr: 'SGT'        },
    { grade: 'E-6',  title: 'Staff Sergeant',                      abbr: 'SSG'        },
    { grade: 'E-7',  title: 'Sergeant First Class',                abbr: 'SFC'        },
    { grade: 'E-8',  title: 'Master Sergeant / First Sergeant',    abbr: 'MSG/1SG'    },
    { grade: 'E-9',  title: 'Sergeant Major / CSM / SMA',          abbr: 'SGM/CSM'    },
    { grade: 'W-1',  title: 'Warrant Officer 1',                   abbr: 'WO1'        },
    { grade: 'W-2',  title: 'Chief Warrant Officer 2',             abbr: 'CW2'        },
    { grade: 'W-3',  title: 'Chief Warrant Officer 3',             abbr: 'CW3'        },
    { grade: 'W-4',  title: 'Chief Warrant Officer 4',             abbr: 'CW4'        },
    { grade: 'W-5',  title: 'Chief Warrant Officer 5',             abbr: 'CW5'        },
    { grade: 'O-1',  title: 'Second Lieutenant',                   abbr: '2LT'        },
    { grade: 'O-2',  title: 'First Lieutenant',                    abbr: '1LT'        },
    { grade: 'O-3',  title: 'Captain',                             abbr: 'CPT'        },
    { grade: 'O-4',  title: 'Major',                               abbr: 'MAJ'        },
    { grade: 'O-5',  title: 'Lieutenant Colonel',                  abbr: 'LTC'        },
    { grade: 'O-6',  title: 'Colonel',                             abbr: 'COL'        },
    { grade: 'O-7',  title: 'Brigadier General',                   abbr: 'BG'         },
    { grade: 'O-8',  title: 'Major General',                       abbr: 'MG'         },
    { grade: 'O-9',  title: 'Lieutenant General',                  abbr: 'LTG'        },
    { grade: 'O-10', title: 'General',                             abbr: 'GEN'        },
  ],
  'Navy': [
    { grade: 'E-1',  title: 'Seaman Recruit',                      abbr: 'SR'         },
    { grade: 'E-2',  title: 'Seaman Apprentice',                   abbr: 'SA'         },
    { grade: 'E-3',  title: 'Seaman',                              abbr: 'SN'         },
    { grade: 'E-4',  title: 'Petty Officer Third Class',           abbr: 'PO3'        },
    { grade: 'E-5',  title: 'Petty Officer Second Class',          abbr: 'PO2'        },
    { grade: 'E-6',  title: 'Petty Officer First Class',           abbr: 'PO1'        },
    { grade: 'E-7',  title: 'Chief Petty Officer',                 abbr: 'CPO'        },
    { grade: 'E-8',  title: 'Senior Chief Petty Officer',          abbr: 'SCPO'       },
    { grade: 'E-9',  title: 'Master Chief Petty Officer',          abbr: 'MCPO'       },
    { grade: 'W-1',  title: 'Warrant Officer 1',                   abbr: 'WO1'        },
    { grade: 'W-2',  title: 'Chief Warrant Officer 2',             abbr: 'CWO2'       },
    { grade: 'W-3',  title: 'Chief Warrant Officer 3',             abbr: 'CWO3'       },
    { grade: 'W-4',  title: 'Chief Warrant Officer 4',             abbr: 'CWO4'       },
    { grade: 'O-1',  title: 'Ensign',                              abbr: 'ENS'        },
    { grade: 'O-2',  title: 'Lieutenant Junior Grade',             abbr: 'LTJG'       },
    { grade: 'O-3',  title: 'Lieutenant',                          abbr: 'LT'         },
    { grade: 'O-4',  title: 'Lieutenant Commander',                abbr: 'LCDR'       },
    { grade: 'O-5',  title: 'Commander',                           abbr: 'CDR'        },
    { grade: 'O-6',  title: 'Captain',                             abbr: 'CAPT'       },
    { grade: 'O-7',  title: 'Rear Admiral Lower Half',             abbr: 'RDML'       },
    { grade: 'O-8',  title: 'Rear Admiral',                        abbr: 'RADM'       },
    { grade: 'O-9',  title: 'Vice Admiral',                        abbr: 'VADM'       },
    { grade: 'O-10', title: 'Admiral',                             abbr: 'ADM'        },
  ],
  'Marine Corps': [
    { grade: 'E-1',  title: 'Private',                             abbr: 'Pvt'        },
    { grade: 'E-2',  title: 'Private First Class',                 abbr: 'PFC'        },
    { grade: 'E-3',  title: 'Lance Corporal',                      abbr: 'LCpl'       },
    { grade: 'E-4',  title: 'Corporal',                            abbr: 'Cpl'        },
    { grade: 'E-5',  title: 'Sergeant',                            abbr: 'Sgt'        },
    { grade: 'E-6',  title: 'Staff Sergeant',                      abbr: 'SSgt'       },
    { grade: 'E-7',  title: 'Gunnery Sergeant',                    abbr: 'GySgt'      },
    { grade: 'E-8',  title: 'Master Sergeant / First Sergeant',    abbr: 'MSgt/1stSgt'},
    { grade: 'E-9',  title: 'Master Gunnery Sergeant / Sgt Major', abbr: 'MGySgt/SgtMaj' },
    { grade: 'W-1',  title: 'Warrant Officer 1',                   abbr: 'WO1'        },
    { grade: 'W-2',  title: 'Chief Warrant Officer 2',             abbr: 'CWO2'       },
    { grade: 'W-3',  title: 'Chief Warrant Officer 3',             abbr: 'CWO3'       },
    { grade: 'W-4',  title: 'Chief Warrant Officer 4',             abbr: 'CWO4'       },
    { grade: 'W-5',  title: 'Chief Warrant Officer 5',             abbr: 'CWO5'       },
    { grade: 'O-1',  title: 'Second Lieutenant',                   abbr: '2ndLt'      },
    { grade: 'O-2',  title: 'First Lieutenant',                    abbr: '1stLt'      },
    { grade: 'O-3',  title: 'Captain',                             abbr: 'Capt'       },
    { grade: 'O-4',  title: 'Major',                               abbr: 'Maj'        },
    { grade: 'O-5',  title: 'Lieutenant Colonel',                  abbr: 'LtCol'      },
    { grade: 'O-6',  title: 'Colonel',                             abbr: 'Col'        },
    { grade: 'O-7',  title: 'Brigadier General',                   abbr: 'BGen'       },
    { grade: 'O-8',  title: 'Major General',                       abbr: 'MajGen'     },
    { grade: 'O-9',  title: 'Lieutenant General',                  abbr: 'LtGen'      },
    { grade: 'O-10', title: 'General',                             abbr: 'Gen'        },
  ],
  'Air Force': [
    { grade: 'E-1',  title: 'Airman Basic',                        abbr: 'AB'         },
    { grade: 'E-2',  title: 'Airman',                              abbr: 'Amn'        },
    { grade: 'E-3',  title: 'Airman First Class',                  abbr: 'A1C'        },
    { grade: 'E-4',  title: 'Senior Airman',                       abbr: 'SrA'        },
    { grade: 'E-5',  title: 'Staff Sergeant',                      abbr: 'SSgt'       },
    { grade: 'E-6',  title: 'Technical Sergeant',                  abbr: 'TSgt'       },
    { grade: 'E-7',  title: 'Master Sergeant',                     abbr: 'MSgt'       },
    { grade: 'E-8',  title: 'Senior Master Sergeant',              abbr: 'SMSgt'      },
    { grade: 'E-9',  title: 'Chief Master Sergeant',               abbr: 'CMSgt'      },
    { grade: 'O-1',  title: 'Second Lieutenant',                   abbr: '2d Lt'      },
    { grade: 'O-2',  title: 'First Lieutenant',                    abbr: '1st Lt'     },
    { grade: 'O-3',  title: 'Captain',                             abbr: 'Capt'       },
    { grade: 'O-4',  title: 'Major',                               abbr: 'Maj'        },
    { grade: 'O-5',  title: 'Lieutenant Colonel',                  abbr: 'Lt Col'     },
    { grade: 'O-6',  title: 'Colonel',                             abbr: 'Col'        },
    { grade: 'O-7',  title: 'Brigadier General',                   abbr: 'Brig Gen'   },
    { grade: 'O-8',  title: 'Major General',                       abbr: 'Maj Gen'    },
    { grade: 'O-9',  title: 'Lieutenant General',                  abbr: 'Lt Gen'     },
    { grade: 'O-10', title: 'General',                             abbr: 'Gen'        },
  ],
  'Space Force': [
    { grade: 'E-1',  title: 'Specialist 1',                        abbr: 'Spc1'       },
    { grade: 'E-2',  title: 'Specialist 2',                        abbr: 'Spc2'       },
    { grade: 'E-3',  title: 'Specialist 3',                        abbr: 'Spc3'       },
    { grade: 'E-4',  title: 'Specialist 4',                        abbr: 'Spc4'       },
    { grade: 'E-5',  title: 'Sergeant',                            abbr: 'Sgt'        },
    { grade: 'E-6',  title: 'Technical Sergeant',                  abbr: 'TSgt'       },
    { grade: 'E-7',  title: 'Master Sergeant',                     abbr: 'MSgt'       },
    { grade: 'E-8',  title: 'Senior Master Sergeant',              abbr: 'SMSgt'      },
    { grade: 'E-9',  title: 'Chief Master Sergeant',               abbr: 'CMSgt'      },
    { grade: 'O-1',  title: 'Second Lieutenant',                   abbr: '2d Lt'      },
    { grade: 'O-2',  title: 'First Lieutenant',                    abbr: '1st Lt'     },
    { grade: 'O-3',  title: 'Captain',                             abbr: 'Capt'       },
    { grade: 'O-4',  title: 'Major',                               abbr: 'Maj'        },
    { grade: 'O-5',  title: 'Lieutenant Colonel',                  abbr: 'Lt Col'     },
    { grade: 'O-6',  title: 'Colonel',                             abbr: 'Col'        },
    { grade: 'O-7',  title: 'Brigadier General',                   abbr: 'Brig Gen'   },
    { grade: 'O-8',  title: 'Major General',                       abbr: 'Maj Gen'    },
    { grade: 'O-9',  title: 'Lieutenant General',                  abbr: 'Lt Gen'     },
    { grade: 'O-10', title: 'General',                             abbr: 'Gen'        },
  ],
  'Coast Guard': [
    { grade: 'E-1',  title: 'Seaman Recruit',                      abbr: 'SR'         },
    { grade: 'E-2',  title: 'Seaman Apprentice',                   abbr: 'SA'         },
    { grade: 'E-3',  title: 'Seaman',                              abbr: 'SN'         },
    { grade: 'E-4',  title: 'Petty Officer Third Class',           abbr: 'PO3'        },
    { grade: 'E-5',  title: 'Petty Officer Second Class',          abbr: 'PO2'        },
    { grade: 'E-6',  title: 'Petty Officer First Class',           abbr: 'PO1'        },
    { grade: 'E-7',  title: 'Chief Petty Officer',                 abbr: 'CPO'        },
    { grade: 'E-8',  title: 'Senior Chief Petty Officer',          abbr: 'SCPO'       },
    { grade: 'E-9',  title: 'Master Chief Petty Officer',          abbr: 'MCPO'       },
    { grade: 'W-2',  title: 'Chief Warrant Officer 2',             abbr: 'CWO2'       },
    { grade: 'W-3',  title: 'Chief Warrant Officer 3',             abbr: 'CWO3'       },
    { grade: 'W-4',  title: 'Chief Warrant Officer 4',             abbr: 'CWO4'       },
    { grade: 'O-1',  title: 'Ensign',                              abbr: 'ENS'        },
    { grade: 'O-2',  title: 'Lieutenant Junior Grade',             abbr: 'LTJG'       },
    { grade: 'O-3',  title: 'Lieutenant',                          abbr: 'LT'         },
    { grade: 'O-4',  title: 'Lieutenant Commander',                abbr: 'LCDR'       },
    { grade: 'O-5',  title: 'Commander',                           abbr: 'CDR'        },
    { grade: 'O-6',  title: 'Captain',                             abbr: 'CAPT'       },
    { grade: 'O-7',  title: 'Rear Admiral Lower Half',             abbr: 'RDML'       },
    { grade: 'O-8',  title: 'Rear Admiral',                        abbr: 'RADM'       },
    { grade: 'O-9',  title: 'Vice Admiral',                        abbr: 'VADM'       },
    { grade: 'O-10', title: 'Admiral',                             abbr: 'ADM'        },
  ],
};

const getRankDisplay = (branch, paygrade) => {
  const ranks = BRANCH_RANKS[branch] || BRANCH_RANKS['Army'];
  const rank = ranks.find(r => r.grade === paygrade);
  return rank ? rank.abbr : paygrade;
};

const MILITARY_DUTY_STATIONS = [
  // ── ARMY · CONUS ─────────────────────────────────────────────────────────
  { name: 'Anniston Army Depot',                     state: 'AL', branch: 'Army' },
  { name: 'Fort Novosel',                            state: 'AL', branch: 'Army' },
  { name: 'Fort Rucker',                             state: 'AL', branch: 'Army' },
  { name: 'Redstone Arsenal',                        state: 'AL', branch: 'Army' },
  { name: 'Fort Huachuca',                           state: 'AZ', branch: 'Army' },
  { name: 'Yuma Proving Ground',                     state: 'AZ', branch: 'Army' },
  { name: 'Pine Bluff Arsenal',                      state: 'AR', branch: 'Army' },
  { name: 'Camp Parks',                              state: 'CA', branch: 'Army' },
  { name: 'Fort Hunter Liggett',                     state: 'CA', branch: 'Army' },
  { name: 'Fort Irwin',                              state: 'CA', branch: 'Army' },
  { name: 'Presidio of Monterey (DLI)',              state: 'CA', branch: 'Army' },
  { name: 'Fort Carson',                             state: 'CO', branch: 'Army' },
  { name: 'USAG Miami',                              state: 'FL', branch: 'Army' },
  { name: 'Fort Moore',                              state: 'GA', branch: 'Army' },
  { name: 'Fort Benning',                            state: 'GA', branch: 'Army' },
  { name: 'Fort Eisenhower',                         state: 'GA', branch: 'Army' },
  { name: 'Fort Gordon',                             state: 'GA', branch: 'Army' },
  { name: 'Fort Stewart',                            state: 'GA', branch: 'Army' },
  { name: 'Hunter Army Airfield',                    state: 'GA', branch: 'Army' },
  { name: 'Rock Island Arsenal',                     state: 'IL', branch: 'Army' },
  { name: 'Fort Leavenworth',                        state: 'KS', branch: 'Army' },
  { name: 'Fort Riley',                              state: 'KS', branch: 'Army' },
  { name: 'Fort Campbell',                           state: 'KY', branch: 'Army' },
  { name: 'Fort Knox',                               state: 'KY', branch: 'Army' },
  { name: 'Fort Johnson',                            state: 'LA', branch: 'Army' },
  { name: 'Fort Polk',                               state: 'LA', branch: 'Army' },
  { name: 'Aberdeen Proving Ground',                 state: 'MD', branch: 'Army' },
  { name: 'Fort Detrick',                            state: 'MD', branch: 'Army' },
  { name: 'Fort Meade',                              state: 'MD', branch: 'Army' },
  { name: 'Fort George G. Meade',                    state: 'MD', branch: 'Army' },
  { name: 'Natick Soldier Systems Center',           state: 'MA', branch: 'Army' },
  { name: 'Detroit Arsenal',                         state: 'MI', branch: 'Army' },
  { name: 'Fort Leonard Wood',                       state: 'MO', branch: 'Army' },
  { name: 'Picatinny Arsenal',                       state: 'NJ', branch: 'Army' },
  { name: 'White Sands Missile Range',               state: 'NM', branch: 'Army' },
  { name: 'Fort Drum',                               state: 'NY', branch: 'Army' },
  { name: 'Fort Hamilton',                           state: 'NY', branch: 'Army' },
  { name: 'West Point (USMA)',                       state: 'NY', branch: 'Army' },
  { name: 'Fort Liberty',                            state: 'NC', branch: 'Army' },
  { name: 'Fort Bragg',                              state: 'NC', branch: 'Army' },
  { name: 'Pope Army Airfield',                      state: 'NC', branch: 'Army' },
  { name: 'Fort Sill',                               state: 'OK', branch: 'Army' },
  { name: 'McAlester Army Ammunition Plant',         state: 'OK', branch: 'Army' },
  { name: 'Carlisle Barracks',                       state: 'PA', branch: 'Army' },
  { name: 'Tobyhanna Army Depot',                    state: 'PA', branch: 'Army' },
  { name: 'Fort Buchanan',                           state: 'PR', branch: 'Army' },
  { name: 'Fort Jackson',                            state: 'SC', branch: 'Army' },
  { name: 'Fort Bliss',                              state: 'TX', branch: 'Army' },
  { name: 'Fort Cavazos',                            state: 'TX', branch: 'Army' },
  { name: 'Fort Hood',                               state: 'TX', branch: 'Army' },
  { name: 'Fort Sam Houston',                        state: 'TX', branch: 'Army' },
  { name: 'Red River Army Depot',                    state: 'TX', branch: 'Army' },
  { name: 'Dugway Proving Ground',                   state: 'UT', branch: 'Army' },
  { name: 'Fort Belvoir',                            state: 'VA', branch: 'Army' },
  { name: 'Fort Gregg-Adams',                        state: 'VA', branch: 'Army' },
  { name: 'Fort Lee',                                state: 'VA', branch: 'Army' },
  { name: 'Fort Myer (JBM-HH)',                      state: 'VA', branch: 'Army' },
  { name: 'Fort McCoy',                              state: 'WI', branch: 'Army' },
  { name: 'Schofield Barracks',                      state: 'HI', branch: 'Army' },
  { name: 'Fort Shafter',                            state: 'HI', branch: 'Army' },
  { name: 'Fort Richardson',                         state: 'AK', branch: 'Army' },
  { name: 'Fort Wainwright',                         state: 'AK', branch: 'Army' },
  { name: 'Fort Greely',                             state: 'AK', branch: 'Army' },
  // ── ARMY · OCONUS ────────────────────────────────────────────────────────
  { name: 'USAG Humphreys',                          state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Camp Humphreys',                          state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'USAG Daegu',                              state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'USAG Yongsan-Casey',                      state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Camp Walker',                             state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Camp Red Cloud',                          state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'USAG Japan (Camp Zama)',                  state: 'JPN', branch: 'Army', country: 'Japan' },
  { name: 'Torii Station (USAG Okinawa)',            state: 'JPN', branch: 'Army', country: 'Japan' },
  { name: 'USAG Stuttgart',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Wiesbaden',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Bavaria (Grafenwöhr)',               state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Ansbach',                            state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Rheinland-Pfalz (Kaiserslautern)',   state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Baumholder',                         state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Hohenfels',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Garmisch',                           state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Belgium (SHAPE)',                    state: 'BEL', branch: 'Army', country: 'Belgium' },
  { name: 'USAG BENELUX-Brussels',                   state: 'BEL', branch: 'Army', country: 'Belgium' },
  { name: 'USAG BENELUX Brunssum',                   state: 'NLD', branch: 'Army', country: 'Netherlands' },
  { name: 'USAG Italy (Vicenza)',                    state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'USAG Italy (Livorno)',                    state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'USAG Poland',                             state: 'POL', branch: 'Army', country: 'Poland' },
  { name: 'Camp Bondsteel',                          state: 'KSV', branch: 'Army', country: 'Kosovo' },
  // ── NAVY · CONUS ─────────────────────────────────────────────────────────
  { name: 'Naval Submarine Base New London',         state: 'CT', branch: 'Navy' },
  { name: 'Naval Air Station Jacksonville',          state: 'FL', branch: 'Navy' },
  { name: 'Naval Air Station Key West',              state: 'FL', branch: 'Navy' },
  { name: 'Naval Air Station Pensacola',             state: 'FL', branch: 'Navy' },
  { name: 'NAS Pensacola',                           state: 'FL', branch: 'Navy' },
  { name: 'Naval Air Station Whiting Field',         state: 'FL', branch: 'Navy' },
  { name: 'Naval Station Mayport',                   state: 'FL', branch: 'Navy' },
  { name: 'Naval Support Activity Orlando',          state: 'FL', branch: 'Navy' },
  { name: 'Naval Support Activity Panama City',      state: 'FL', branch: 'Navy' },
  { name: 'Naval Submarine Base Kings Bay',          state: 'GA', branch: 'Navy' },
  { name: 'Naval Station Great Lakes',               state: 'IL', branch: 'Navy' },
  { name: 'Naval Support Activity Crane',            state: 'IN', branch: 'Navy' },
  { name: 'NAS JRB New Orleans',                     state: 'LA', branch: 'Navy' },
  { name: 'Naval Air Station JRB New Orleans',       state: 'LA', branch: 'Navy' },
  { name: 'Portsmouth Naval Shipyard',               state: 'ME', branch: 'Navy' },
  { name: 'Naval Air Station Patuxent River',        state: 'MD', branch: 'Navy' },
  { name: 'NAS Patuxent River',                      state: 'MD', branch: 'Navy' },
  { name: 'Naval Support Activity Annapolis (USNA)', state: 'MD', branch: 'Navy' },
  { name: 'Naval Support Activity Bethesda',         state: 'MD', branch: 'Navy' },
  { name: 'Naval Support Activity South Potomac',    state: 'MD', branch: 'Navy' },
  { name: 'Naval Air Station Meridian',              state: 'MS', branch: 'Navy' },
  { name: 'Naval Construction Battalion Center Gulfport', state: 'MS', branch: 'Navy' },
  { name: 'Stennis Space Center',                    state: 'MS', branch: 'Navy' },
  { name: 'Naval Air Station Fallon',                state: 'NV', branch: 'Navy' },
  { name: 'Naval Weapons Station Earle',             state: 'NJ', branch: 'Navy' },
  { name: 'Naval Support Activity Saratoga Springs', state: 'NY', branch: 'Navy' },
  { name: 'Naval Station Newport',                   state: 'RI', branch: 'Navy' },
  { name: 'Naval Support Activity Mid-South',        state: 'TN', branch: 'Navy' },
  { name: 'Naval Air Station Corpus Christi',        state: 'TX', branch: 'Navy' },
  { name: 'NAS Corpus Christi',                      state: 'TX', branch: 'Navy' },
  { name: 'Naval Air Station JRB Fort Worth',        state: 'TX', branch: 'Navy' },
  { name: 'Naval Air Station Kingsville',            state: 'TX', branch: 'Navy' },
  { name: 'Naval Air Station Oceana',                state: 'VA', branch: 'Navy' },
  { name: 'NAS Oceana',                              state: 'VA', branch: 'Navy' },
  { name: 'Naval Medical Center Portsmouth',         state: 'VA', branch: 'Navy' },
  { name: 'Naval Station Norfolk',                   state: 'VA', branch: 'Navy' },
  { name: 'Naval Support Activity Hampton Roads',    state: 'VA', branch: 'Navy' },
  { name: 'Naval Weapons Station Yorktown',          state: 'VA', branch: 'Navy' },
  { name: 'Norfolk Naval Shipyard',                  state: 'VA', branch: 'Navy' },
  { name: 'Naval Air Station Whidbey Island',        state: 'WA', branch: 'Navy' },
  { name: 'NAS Whidbey Island',                      state: 'WA', branch: 'Navy' },
  { name: 'Naval Base Kitsap',                       state: 'WA', branch: 'Navy' },
  { name: 'Naval Station Everett',                   state: 'WA', branch: 'Navy' },
  { name: 'Naval Air Facility El Centro',            state: 'CA', branch: 'Navy' },
  { name: 'Naval Air Station Lemoore',               state: 'CA', branch: 'Navy' },
  { name: 'Naval Air Weapons Station China Lake',    state: 'CA', branch: 'Navy' },
  { name: 'Naval Base Coronado',                     state: 'CA', branch: 'Navy' },
  { name: 'Naval Base Point Loma',                   state: 'CA', branch: 'Navy' },
  { name: 'Naval Base San Diego',                    state: 'CA', branch: 'Navy' },
  { name: 'Naval Base Ventura County',               state: 'CA', branch: 'Navy' },
  { name: 'Naval Support Activity Monterey',         state: 'CA', branch: 'Navy' },
  { name: 'Naval Weapons Station Seal Beach',        state: 'CA', branch: 'Navy' },
  { name: 'Naval Support Activity Washington',       state: 'DC', branch: 'Navy' },
  { name: 'Naval Support Activity Mid-South (Millington)', state: 'TN', branch: 'Navy' },
  // ── NAVY · OCONUS ────────────────────────────────────────────────────────
  { name: 'Naval Support Activity Bahrain',          state: 'BHR', branch: 'Navy', country: 'Bahrain' },
  { name: 'Navy Support Facility Diego Garcia',      state: 'BIOT', branch: 'Navy', country: 'British Indian Ocean Territory' },
  { name: 'Naval Station Guantanamo Bay',            state: 'CUB', branch: 'Navy', country: 'Cuba' },
  { name: 'Naval Support Activity Souda Bay',        state: 'GRC', branch: 'Navy', country: 'Greece' },
  { name: 'Naval Base Guam',                         state: 'GU',  branch: 'Navy', country: 'Guam' },
  { name: 'Commander Fleet Activities Yokosuka',     state: 'JPN', branch: 'Navy', country: 'Japan' },
  { name: 'Commander Fleet Activities Sasebo',       state: 'JPN', branch: 'Navy', country: 'Japan' },
  { name: 'Naval Air Facility Atsugi',               state: 'JPN', branch: 'Navy', country: 'Japan' },
  { name: 'Naval Air Station Sigonella',             state: 'ITA', branch: 'Navy', country: 'Italy' },
  { name: 'Naval Support Activity Naples',           state: 'ITA', branch: 'Navy', country: 'Italy' },
  { name: 'Naval Support Activity Singapore',        state: 'SGP', branch: 'Navy', country: 'Singapore' },
  { name: 'Naval Station Rota',                      state: 'ESP', branch: 'Navy', country: 'Spain' },
  { name: 'Naval Support Activity Stavanger',        state: 'NOR', branch: 'Navy', country: 'Norway' },
  { name: 'Commander Fleet Activities Chinhae',      state: 'KOR', branch: 'Navy', country: 'South Korea' },
  { name: 'Joint Base Pearl Harbor-Hickam',          state: 'HI',  branch: 'Navy' },
  { name: 'NSA Bahrain',                             state: 'BHR', branch: 'Navy', country: 'Bahrain' },
  // ── MARINE CORPS · CONUS ─────────────────────────────────────────────────
  { name: 'MCAS Yuma',                               state: 'AZ', branch: 'Marine Corps' },
  { name: 'Camp Pendleton',                          state: 'CA', branch: 'Marine Corps' },
  { name: 'MCAS Miramar',                            state: 'CA', branch: 'Marine Corps' },
  { name: 'Marine Corps Air Station Miramar',        state: 'CA', branch: 'Marine Corps' },
  { name: 'MCAGCC Twentynine Palms',                 state: 'CA', branch: 'Marine Corps' },
  { name: 'Twentynine Palms',                        state: 'CA', branch: 'Marine Corps' },
  { name: 'MCLB Barstow',                            state: 'CA', branch: 'Marine Corps' },
  { name: 'MCRD San Diego',                          state: 'CA', branch: 'Marine Corps' },
  { name: 'Marine Corps Mountain Warfare Training Center', state: 'CA', branch: 'Marine Corps' },
  { name: 'Marine Corps Logistics Base Albany',      state: 'GA', branch: 'Marine Corps' },
  { name: 'MCLB Albany',                             state: 'GA', branch: 'Marine Corps' },
  { name: 'Camp Lejeune',                            state: 'NC', branch: 'Marine Corps' },
  { name: 'Marine Corps Base Camp Lejeune',          state: 'NC', branch: 'Marine Corps' },
  { name: 'MCAS Cherry Point',                       state: 'NC', branch: 'Marine Corps' },
  { name: 'MCAS New River',                          state: 'NC', branch: 'Marine Corps' },
  { name: 'MCAS Beaufort',                           state: 'SC', branch: 'Marine Corps' },
  { name: 'MCRD Parris Island',                      state: 'SC', branch: 'Marine Corps' },
  { name: 'Henderson Hall',                          state: 'VA', branch: 'Marine Corps' },
  { name: 'Marine Corps Base Quantico',              state: 'VA', branch: 'Marine Corps' },
  { name: 'MCB Quantico',                            state: 'VA', branch: 'Marine Corps' },
  { name: 'MCB Hawaii Kaneohe Bay',                  state: 'HI', branch: 'Marine Corps' },
  { name: 'MCB Hawaii',                              state: 'HI', branch: 'Marine Corps' },
  // ── MARINE CORPS · OCONUS ────────────────────────────────────────────────
  { name: 'Camp Butler (Okinawa)',                   state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'Camp Foster',                             state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'Camp Kinser',                             state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'Camp Courtney',                           state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'Camp Hansen',                             state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'Camp Schwab',                             state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'MCAS Futenma',                            state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  { name: 'MCAS Iwakuni',                            state: 'JPN', branch: 'Marine Corps', country: 'Japan' },
  // ── AIR FORCE · CONUS ────────────────────────────────────────────────────
  { name: 'Maxwell AFB',                             state: 'AL', branch: 'Air Force' },
  { name: 'Davis-Monthan AFB',                       state: 'AZ', branch: 'Air Force' },
  { name: 'Luke AFB',                                state: 'AZ', branch: 'Air Force' },
  { name: 'Beale AFB',                               state: 'CA', branch: 'Air Force' },
  { name: 'Edwards AFB',                             state: 'CA', branch: 'Air Force' },
  { name: 'March ARB',                               state: 'CA', branch: 'Air Force' },
  { name: 'Travis AFB',                              state: 'CA', branch: 'Air Force' },
  { name: 'Travis Air Force Base',                   state: 'CA', branch: 'Air Force' },
  { name: 'USAF Academy',                            state: 'CO', branch: 'Air Force' },
  { name: 'Dover AFB',                               state: 'DE', branch: 'Air Force' },
  { name: 'Eglin AFB',                               state: 'FL', branch: 'Air Force' },
  { name: 'Hurlburt Field',                          state: 'FL', branch: 'Air Force' },
  { name: 'MacDill AFB',                             state: 'FL', branch: 'Air Force' },
  { name: 'Tyndall AFB',                             state: 'FL', branch: 'Air Force' },
  { name: 'Moody AFB',                               state: 'GA', branch: 'Air Force' },
  { name: 'Robins AFB',                              state: 'GA', branch: 'Air Force' },
  { name: 'Mountain Home AFB',                       state: 'ID', branch: 'Air Force' },
  { name: 'Scott AFB',                               state: 'IL', branch: 'Air Force' },
  { name: 'McConnell AFB',                           state: 'KS', branch: 'Air Force' },
  { name: 'Barksdale AFB',                           state: 'LA', branch: 'Air Force' },
  { name: 'Hanscom AFB',                             state: 'MA', branch: 'Air Force' },
  { name: 'Westover ARB',                            state: 'MA', branch: 'Air Force' },
  { name: 'Joint Base Andrews',                      state: 'MD', branch: 'Air Force' },
  { name: 'Malmstrom AFB',                           state: 'MT', branch: 'Air Force' },
  { name: 'Offutt AFB',                              state: 'NE', branch: 'Air Force' },
  { name: 'Creech AFB',                              state: 'NV', branch: 'Air Force' },
  { name: 'Nellis AFB',                              state: 'NV', branch: 'Air Force' },
  { name: 'Cannon AFB',                              state: 'NM', branch: 'Air Force' },
  { name: 'Holloman AFB',                            state: 'NM', branch: 'Air Force' },
  { name: 'Kirtland AFB',                            state: 'NM', branch: 'Air Force' },
  { name: 'Seymour Johnson AFB',                     state: 'NC', branch: 'Air Force' },
  { name: 'Grand Forks AFB',                         state: 'ND', branch: 'Air Force' },
  { name: 'Minot AFB',                               state: 'ND', branch: 'Air Force' },
  { name: 'Wright-Patterson AFB',                    state: 'OH', branch: 'Air Force' },
  { name: 'Altus AFB',                               state: 'OK', branch: 'Air Force' },
  { name: 'Tinker AFB',                              state: 'OK', branch: 'Air Force' },
  { name: 'Vance AFB',                               state: 'OK', branch: 'Air Force' },
  { name: 'Shaw AFB',                                state: 'SC', branch: 'Air Force' },
  { name: 'Ellsworth AFB',                           state: 'SD', branch: 'Air Force' },
  { name: 'Arnold AFB',                              state: 'TN', branch: 'Air Force' },
  { name: 'Dyess AFB',                               state: 'TX', branch: 'Air Force' },
  { name: 'Goodfellow AFB',                          state: 'TX', branch: 'Air Force' },
  { name: 'Laughlin AFB',                            state: 'TX', branch: 'Air Force' },
  { name: 'Sheppard AFB',                            state: 'TX', branch: 'Air Force' },
  { name: 'Hill AFB',                                state: 'UT', branch: 'Air Force' },
  { name: 'Fairchild AFB',                           state: 'WA', branch: 'Air Force' },
  { name: 'F.E. Warren AFB',                         state: 'WY', branch: 'Air Force' },
  { name: 'Eielson AFB',                             state: 'AK', branch: 'Air Force' },
  { name: 'Keesler AFB',                             state: 'MS', branch: 'Air Force' },
  { name: 'Columbus AFB',                            state: 'MS', branch: 'Air Force' },
  { name: 'Little Rock AFB',                         state: 'AR', branch: 'Air Force' },
  { name: 'Joint Base Langley-Eustis',               state: 'VA', branch: 'Air Force' },
  { name: 'Whiteman AFB',                            state: 'MO', branch: 'Air Force' },
  { name: 'Lajes Field',                             state: 'PRT', branch: 'Air Force', country: 'Portugal' },
  // ── AIR FORCE · OCONUS ───────────────────────────────────────────────────
  { name: 'Ramstein AB',                             state: 'GER', branch: 'Air Force', country: 'Germany' },
  { name: 'Spangdahlem AB',                          state: 'GER', branch: 'Air Force', country: 'Germany' },
  { name: 'Aviano AB',                               state: 'ITA', branch: 'Air Force', country: 'Italy' },
  { name: 'Incirlik AB',                             state: 'TUR', branch: 'Air Force', country: 'Turkey' },
  { name: 'Kadena AB',                               state: 'JPN', branch: 'Air Force', country: 'Japan' },
  { name: 'Misawa AB',                               state: 'JPN', branch: 'Air Force', country: 'Japan' },
  { name: 'Yokota AB',                               state: 'JPN', branch: 'Air Force', country: 'Japan' },
  { name: 'Osan AB',                                 state: 'KOR', branch: 'Air Force', country: 'South Korea' },
  { name: 'Kunsan AB',                               state: 'KOR', branch: 'Air Force', country: 'South Korea' },
  { name: 'RAF Lakenheath',                          state: 'UK',  branch: 'Air Force', country: 'United Kingdom' },
  { name: 'RAF Mildenhall',                          state: 'UK',  branch: 'Air Force', country: 'United Kingdom' },
  { name: 'RAF Alconbury',                           state: 'UK',  branch: 'Air Force', country: 'United Kingdom' },
  { name: 'RAF Croughton',                           state: 'UK',  branch: 'Air Force', country: 'United Kingdom' },
  { name: 'Andersen AFB (Guam)',                     state: 'GU',  branch: 'Air Force', country: 'Guam' },
  { name: 'Morón AB',                                state: 'ESP', branch: 'Air Force', country: 'Spain' },
  { name: 'Geilenkirchen NATO Air Base',             state: 'GER', branch: 'Air Force', country: 'Germany' },
  // ── SPACE FORCE ──────────────────────────────────────────────────────────
  { name: 'Los Angeles SFB',                         state: 'CA', branch: 'Space Force' },
  { name: 'Vandenberg SFB',                          state: 'CA', branch: 'Space Force' },
  { name: 'Vandenberg Space Force Base',             state: 'CA', branch: 'Space Force' },
  { name: 'Buckley SFB',                             state: 'CO', branch: 'Space Force' },
  { name: 'Peterson SFB',                            state: 'CO', branch: 'Space Force' },
  { name: 'Schriever SFB',                           state: 'CO', branch: 'Space Force' },
  { name: 'Patrick SFB',                             state: 'FL', branch: 'Space Force' },
  { name: 'Cape Canaveral Space Force Station',      state: 'FL', branch: 'Space Force' },
  { name: 'Cheyenne Mountain Space Force Station',   state: 'CO', branch: 'Space Force' },
  { name: 'Cavalier Space Force Station',            state: 'ND', branch: 'Space Force' },
  { name: 'Clear Space Force Station',               state: 'AK', branch: 'Space Force' },
  { name: 'Thule Air Base / Pituffik Space Base',    state: 'GRL', branch: 'Space Force', country: 'Greenland' },
  // ── COAST GUARD · TRAINING CENTERS ───────────────────────────────────────
  { name: 'USCG Training Center Cape May',           state: 'NJ', branch: 'Coast Guard' },
  { name: 'USCG Training Center Petaluma',           state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Training Center Yorktown',           state: 'VA', branch: 'Coast Guard' },
  // ── COAST GUARD · AIR STATIONS ───────────────────────────────────────────
  { name: 'USCG Air Station Atlantic City',          state: 'NJ', branch: 'Coast Guard' },
  { name: 'USCG Air Station Barbers Point',          state: 'HI', branch: 'Coast Guard' },
  { name: 'USCG Air Station Borinquen',              state: 'PR', branch: 'Coast Guard' },
  { name: 'USCG Air Station Cape Cod',               state: 'MA', branch: 'Coast Guard' },
  { name: 'USCG Air Station Clearwater',             state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Air Station Houston',                state: 'TX', branch: 'Coast Guard' },
  { name: 'USCG Air Station Kodiak',                 state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Air Station Los Angeles',            state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Air Station Miami',                  state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Air Station New Orleans',            state: 'LA', branch: 'Coast Guard' },
  { name: 'USCG Air Station North Bend',             state: 'OR', branch: 'Coast Guard' },
  { name: 'USCG Air Station Port Angeles',           state: 'WA', branch: 'Coast Guard' },
  { name: 'USCG Air Station Sacramento',             state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Air Station Savannah',               state: 'GA', branch: 'Coast Guard' },
  { name: 'USCG Air Station Sitka',                  state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Air Station Traverse City',          state: 'MI', branch: 'Coast Guard' },
  { name: 'USCG Air Station Washington',             state: 'DC', branch: 'Coast Guard' },
  // ── COAST GUARD · SECTORS ────────────────────────────────────────────────
  { name: 'USCG Sector Boston',                      state: 'MA', branch: 'Coast Guard' },
  { name: 'USCG Sector Buffalo',                     state: 'NY', branch: 'Coast Guard' },
  { name: 'USCG Sector Columbia River',              state: 'OR', branch: 'Coast Guard' },
  { name: 'USCG Sector Delaware Bay',                state: 'PA', branch: 'Coast Guard' },
  { name: 'USCG Sector Detroit',                     state: 'MI', branch: 'Coast Guard' },
  { name: 'USCG Sector Honolulu',                    state: 'HI', branch: 'Coast Guard' },
  { name: 'USCG Sector Houston-Galveston',           state: 'TX', branch: 'Coast Guard' },
  { name: 'USCG Sector Jacksonville',                state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Sector Key West',                    state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Sector Lake Michigan',               state: 'IL', branch: 'Coast Guard' },
  { name: 'USCG Sector Los Angeles-Long Beach',      state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Sector Miami',                       state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Sector Mobile',                      state: 'AL', branch: 'Coast Guard' },
  { name: 'USCG Sector New Orleans',                 state: 'LA', branch: 'Coast Guard' },
  { name: 'USCG Sector New York',                    state: 'NY', branch: 'Coast Guard' },
  { name: 'USCG Sector North Bend',                  state: 'OR', branch: 'Coast Guard' },
  { name: 'USCG Sector Northern New England',        state: 'ME', branch: 'Coast Guard' },
  { name: 'USCG Sector Ohio Valley',                 state: 'OH', branch: 'Coast Guard' },
  { name: 'USCG Sector Puget Sound',                 state: 'WA', branch: 'Coast Guard' },
  { name: 'USCG Sector San Diego',                   state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Sector San Francisco',               state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Sector San Juan',                    state: 'PR', branch: 'Coast Guard' },
  { name: 'USCG Sector Southeast New England',       state: 'RI', branch: 'Coast Guard' },
  { name: 'USCG Sector St. Petersburg',              state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Sector Upper Mississippi River',     state: 'MO', branch: 'Coast Guard' },
  { name: 'USCG Sector Virginia',                    state: 'VA', branch: 'Coast Guard' },
  { name: 'USCG Sector Wilmington',                  state: 'NC', branch: 'Coast Guard' },
  { name: 'USCG Sector Anchorage',                   state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Sector Juneau',                      state: 'AK', branch: 'Coast Guard' },
  // ── COAST GUARD · BASES ──────────────────────────────────────────────────
  { name: 'USCG Base Alameda',                       state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Base Boston',                        state: 'MA', branch: 'Coast Guard' },
  { name: 'USCG Base Clearwater',                    state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Base Elizabeth City',                state: 'NC', branch: 'Coast Guard' },
  { name: 'USCG Base Kodiak',                        state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Base Miami',                         state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Base New Orleans',                   state: 'LA', branch: 'Coast Guard' },
  { name: 'USCG Base Portsmouth',                    state: 'VA', branch: 'Coast Guard' },
  { name: 'USCG Base Seattle',                       state: 'WA', branch: 'Coast Guard' },
  { name: 'USCG MEC Chesapeake',                     state: 'VA', branch: 'Coast Guard' },
  // ── COAST GUARD · MAJOR STATIONS ─────────────────────────────────────────
  { name: 'USCG Station Cape May',                   state: 'NJ', branch: 'Coast Guard' },
  { name: 'USCG Station Sandy Hook',                 state: 'NJ', branch: 'Coast Guard' },
  { name: 'USCG Station Cape Charles',               state: 'VA', branch: 'Coast Guard' },
  { name: 'USCG Station Oak Island',                 state: 'NC', branch: 'Coast Guard' },
  { name: 'USCG Station Wrightsville Beach',         state: 'NC', branch: 'Coast Guard' },
  { name: 'USCG Station Ocracoke',                   state: 'NC', branch: 'Coast Guard' },
  { name: 'USCG Station Brunswick',                  state: 'GA', branch: 'Coast Guard' },
  { name: 'USCG Station Fort Myers Beach',           state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Station Islamorada',                 state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Station New Haven',                  state: 'CT', branch: 'Coast Guard' },
  { name: 'USCG Station New London',                 state: 'CT', branch: 'Coast Guard' },
  { name: 'USCG Station Boston',                     state: 'MA', branch: 'Coast Guard' },
  { name: 'USCG Station Montauk',                    state: 'NY', branch: 'Coast Guard' },
  { name: 'USCG Station New York',                   state: 'NY', branch: 'Coast Guard' },
  { name: 'USCG Station Philadelphia',               state: 'PA', branch: 'Coast Guard' },
  { name: 'USCG Station Washington DC',              state: 'DC', branch: 'Coast Guard' },
  { name: 'USCG Station Annapolis',                  state: 'MD', branch: 'Coast Guard' },
  { name: 'USCG Station Ocean City',                 state: 'MD', branch: 'Coast Guard' },
  { name: 'USCG Station Little Creek',               state: 'VA', branch: 'Coast Guard' },
  { name: 'USCG Station Elizabeth City',             state: 'NC', branch: 'Coast Guard' },
  { name: 'USCG Station Georgetown',                 state: 'SC', branch: 'Coast Guard' },
  { name: 'USCG Station Tybee Island',               state: 'GA', branch: 'Coast Guard' },
  { name: 'USCG Station Cortez',                     state: 'FL', branch: 'Coast Guard' },
  { name: 'USCG Station Galveston',                  state: 'TX', branch: 'Coast Guard' },
  { name: 'USCG Station Lake Charles',               state: 'LA', branch: 'Coast Guard' },
  { name: 'USCG Station Los Angeles',                state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Station San Francisco',              state: 'CA', branch: 'Coast Guard' },
  { name: 'USCG Station Seattle',                    state: 'WA', branch: 'Coast Guard' },
  { name: 'USCG Station Juneau',                     state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Station Ketchikan',                  state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Station Kodiak',                     state: 'AK', branch: 'Coast Guard' },
  { name: 'USCG Station Honolulu',                   state: 'HI', branch: 'Coast Guard' },
  // ── JOINT ────────────────────────────────────────────────────────────────
  { name: 'Joint Base Anacostia-Bolling',            state: 'DC', branch: 'Joint' },
  { name: 'Joint Base McGuire-Dix-Lakehurst',        state: 'NJ', branch: 'Joint' },
  { name: 'Joint Base San Antonio',                  state: 'TX', branch: 'Joint' },
  { name: 'Joint Base Charleston',                   state: 'SC', branch: 'Joint' },
  { name: 'Joint Base Elmendorf-Richardson',         state: 'AK', branch: 'Joint' },
  { name: 'Joint Base Pearl Harbor-Hickam',          state: 'HI', branch: 'Joint' },
  { name: 'Joint Expeditionary Base Little Creek-Fort Story', state: 'VA', branch: 'Joint' },
  { name: 'Pentagon',                                state: 'VA', branch: 'Joint' },
  { name: 'NSA Washington',                          state: 'DC', branch: 'Joint' },
  { name: 'Defense Intelligence Agency (DIA)',       state: 'VA', branch: 'Joint' },
  { name: 'Joint Base Myer-Henderson Hall',          state: 'VA', branch: 'Joint' },
  { name: 'Joint Region Marianas',                   state: 'GU',  branch: 'Joint', country: 'Guam' },
];

const INSTALLATION_SCHOOLS = {
  "Fort Liberty": [
    { name:"Douglas Byrd Middle School", grades:"6-8", rating:3.8, desc:"Title I school serving military and civilian families near Fort Liberty. Strong JROTC feeder program.", url:"https://www.ccs.k12.nc.us/douglas-byrd-middle", city:"Fayetteville, NC" },
    { name:"Terry Sanford High School", grades:"9-12", rating:4.1, desc:"IB programme available. Active military family support group. Strong sports programs.", url:"https://www.ccs.k12.nc.us/terry-sanford", city:"Fayetteville, NC" },
    { name:"Westover Hills Elementary", grades:"K-5", rating:4.0, desc:"High-performing elementary near post housing. Military family liaison on staff.", url:"https://www.ccs.k12.nc.us/westover-hills", city:"Fayetteville, NC" },
    { name:"Pines Level Middle School", grades:"6-8", rating:3.6, desc:"STEM focus, robotics club. Close to Bragg housing areas.", url:"https://www.hcps.net/pines-level", city:"Harnett County, NC" },
  ],
  "Camp Humphreys": [
    { name:"Humphreys Elementary School (DoDEA)", grades:"K-5", rating:4.5, desc:"DoD operated school on post. Serves USFK families. Fully accredited.", url:"https://www.dodea.edu/humphreys", city:"Camp Humphreys, South Korea" },
    { name:"Humphreys Middle School (DoDEA)", grades:"6-8", rating:4.4, desc:"DoDEA school with strong academic standards. Special education services available.", url:"https://www.dodea.edu/humphreys", city:"Camp Humphreys, South Korea" },
    { name:"Humphreys High School (DoDEA)", grades:"9-12", rating:4.3, desc:"AP courses available. Dual enrollment with community college. Sports and arts programs.", url:"https://www.dodea.edu/humphreys", city:"Camp Humphreys, South Korea" },
  ],
  "Fort Bragg": [
    { name:"Irwin Elementary School (DoDEA)", grades:"K-5", rating:4.4, desc:"DoDEA on-post school. Military family support built in.", url:"https://www.dodea.edu/ftbragg", city:"Fort Bragg, NC" },
    { name:"Longstreet Middle School (DoDEA)", grades:"6-8", rating:4.3, desc:"DoDEA school, STEM focus.", url:"https://www.dodea.edu/ftbragg", city:"Fort Bragg, NC" },
  ],
  "Joint Base Lewis-McChord": [
    { name:"Clover Park High School", grades:"9-12", rating:3.9, desc:"Large high school near JBLM. Military family support coordinator. IB program.", url:"https://www.cloverpark.k12.wa.us", city:"Lakewood, WA" },
    { name:"Mann Elementary School", grades:"K-5", rating:3.7, desc:"Strong military family enrollment. Before/after care available.", url:"https://www.cloverpark.k12.wa.us/mann", city:"Lakewood, WA" },
    { name:"Park Lodge Elementary", grades:"K-5", rating:4.0, desc:"High-rated elementary near JBLM main gate.", url:"https://www.cloverpark.k12.wa.us/parklodge", city:"University Place, WA" },
  ],
  "Fort Hood": [
    { name:"Killeen High School", grades:"9-12", rating:3.5, desc:"Largest high school near Fort Hood. JROTC program. Career technical programs.", url:"https://www.killeenisd.org/khs", city:"Killeen, TX" },
    { name:"Nolan Middle School", grades:"6-8", rating:3.8, desc:"STEM magnet program. Military family advocate on staff.", url:"https://www.killeenisd.org/nolan", city:"Killeen, TX" },
    { name:"Rancier Elementary", grades:"K-5", rating:3.9, desc:"High military enrollment. PTA very active with PCS support.", url:"https://www.killeenisd.org/rancier", city:"Killeen, TX" },
  ],
  "Fort Campbell": [
    { name:"Fort Campbell High School (DoDEA)", grades:"9-12", rating:4.2, desc:"On-post DoDEA school. Strong AP and athletics programs.", url:"https://www.dodea.edu/ftcampbell", city:"Fort Campbell, KY" },
    { name:"Mahaffey Middle School (DoDEA)", grades:"6-8", rating:4.1, desc:"On-post DoDEA school.", url:"https://www.dodea.edu/ftcampbell", city:"Fort Campbell, KY" },
    { name:"Wassom Middle School (DoDEA)", grades:"K-5", rating:4.3, desc:"On-post elementary.", url:"https://www.dodea.edu/ftcampbell", city:"Fort Campbell, KY" },
  ],
  "Fort Benning": [
    { name:"Benning Hills Elementary (DoDEA)", grades:"K-5", rating:4.2, desc:"On-post DoDEA elementary.", url:"https://www.dodea.edu/ftbenning", city:"Fort Benning, GA" },
    { name:"Baker Middle School", grades:"6-8", rating:3.7, desc:"Near Benning. ROTC prep focus.", url:"https://www.muscogee.k12.ga.us/baker", city:"Columbus, GA" },
    { name:"Hardaway High School", grades:"9-12", rating:3.8, desc:"Strong ROTC and athletics. Near main post.", url:"https://www.muscogee.k12.ga.us/hardaway", city:"Columbus, GA" },
  ],
  "Fort Sam Houston": [
    { name:"Sam Houston High School", grades:"9-12", rating:3.6, desc:"Near Fort Sam. JROTC program. Magnet programs available.", url:"https://www.saisd.net/samhouston", city:"San Antonio, TX" },
    { name:"Hirsch Elementary", grades:"K-5", rating:3.8, desc:"Near post housing areas.", url:"https://www.saisd.net", city:"San Antonio, TX" },
  ],
  "Naval Station Norfolk": [
    { name:"Norview High School", grades:"9-12", rating:3.6, desc:"Near NS Norfolk. NJROTC program. Navy family support.", url:"https://www.nps.k12.va.us/norview", city:"Norfolk, VA" },
    { name:"Tidewater Elementary", grades:"K-5", rating:3.9, desc:"High military enrollment. Near Chesapeake Bay area.", url:"https://www.nps.k12.va.us", city:"Norfolk, VA" },
    { name:"Granby High School", grades:"9-12", rating:3.8, desc:"IB programme. Strong arts program. Military family liaison.", url:"https://www.nps.k12.va.us/granby", city:"Norfolk, VA" },
  ],
  "Marine Corps Base Camp Lejeune": [
    { name:"Lejeune High School (DoDEA)", grades:"9-12", rating:4.1, desc:"On-post DoDEA school. Strong athletics and AP courses.", url:"https://www.dodea.edu/lejeune", city:"Camp Lejeune, NC" },
    { name:"Lejeune Middle School (DoDEA)", grades:"6-8", rating:4.0, desc:"On-post DoDEA school.", url:"https://www.dodea.edu/lejeune", city:"Camp Lejeune, NC" },
    { name:"Tarawa Terrace Elementary (DoDEA)", grades:"K-5", rating:4.2, desc:"On-post DoDEA elementary.", url:"https://www.dodea.edu/lejeune", city:"Camp Lejeune, NC" },
  ],
};

// City lookup used for search fallback URLs
const VET_BIZ_CITY = {
  'Fort Liberty':'Fayetteville NC','Fort Bragg':'Fayetteville NC','Fort Campbell':'Clarksville TN',
  'Fort Cavazos':'Killeen TX','Fort Hood':'Killeen TX','Fort Carson':'Colorado Springs CO',
  'Fort Bliss':'El Paso TX','Fort Stewart':'Hinesville GA','Fort Drum':'Watertown NY',
  'Fort Sill':'Lawton OK','Fort Jackson':'Columbia SC','Fort Knox':'Radcliff KY',
  'Fort Meade':'Odenton MD','Fort George G. Meade':'Odenton MD',
  'Fort Leavenworth':'Leavenworth KS','Fort Riley':'Junction City KS',
  'Fort Sam Houston':'San Antonio TX','Fort Wainwright':'Fairbanks AK',
  'Fort Gregg-Adams':'Petersburg VA','Fort Leonard Wood':'Waynesville MO',
  'Schofield Barracks':'Honolulu HI','Fort Shafter':'Honolulu HI',
  'Naval Station Norfolk':'Norfolk VA','Naval Base San Diego':'San Diego CA',
  'NAS Jacksonville':'Jacksonville FL','Naval Station Mayport':'Jacksonville FL',
  'NAS Pensacola':'Pensacola FL','Naval Air Station Pensacola':'Pensacola FL',
  'Naval Base Kitsap':'Bremerton WA','Naval Station Everett':'Everett WA',
  'Naval Station Great Lakes':'Great Lakes IL',
  'Marine Corps Base Camp Lejeune':'Jacksonville NC','Camp Lejeune':'Jacksonville NC',
  'Camp Pendleton':'Oceanside CA','MCAS Miramar':'San Diego CA',
  'MCB Quantico':'Quantico VA','Marine Corps Base Quantico':'Quantico VA',
  'MCAS Cherry Point':'Havelock NC','MCAS New River':'Jacksonville NC',
  'MCAS Beaufort':'Beaufort SC','MCRD Parris Island':'Beaufort SC',
  'Joint Base Lewis-McChord':'Tacoma WA','Joint Base San Antonio':'San Antonio TX',
  'Joint Base Langley-Eustis':'Hampton VA','Joint Base Andrews':'Clinton MD',
  'Joint Base Charleston':'Charleston SC','Joint Base Elmendorf-Richardson':'Anchorage AK',
  'Joint Base McGuire-Dix-Lakehurst':'Trenton NJ',
  'Joint Base Pearl Harbor-Hickam':'Honolulu HI',
  'Eglin AFB':'Fort Walton Beach FL','MacDill AFB':'Tampa FL',
  'Travis AFB':'Fairfield CA','Travis Air Force Base':'Fairfield CA',
  'Wright-Patterson AFB':'Dayton OH','Nellis AFB':'Las Vegas NV',
  'Scott AFB':'O\'Fallon IL','Offutt AFB':'Omaha NE','Barksdale AFB':'Bossier City LA',
  'Minot AFB':'Minot ND','Whiteman AFB':'Knob Noster MO','Dyess AFB':'Abilene TX',
  'Moody AFB':'Valdosta GA','Shaw AFB':'Sumter SC','Keesler AFB':'Biloxi MS',
  'Little Rock AFB':'Jacksonville AR','Luke AFB':'Glendale AZ',
  'Davis-Monthan AFB':'Tucson AZ','Hurlburt Field':'Fort Walton Beach FL',
  'Seymour Johnson AFB':'Goldsboro NC','Hill AFB':'Ogden UT',
  'Fairchild AFB':'Spokane WA','Malmstrom AFB':'Great Falls MT',
  'Ellsworth AFB':'Rapid City SD','McConnell AFB':'Wichita KS',
  'Peterson SFB':'Colorado Springs CO','Schriever SFB':'Colorado Springs CO',
  'Buckley SFB':'Aurora CO','Vandenberg SFB':'Lompoc CA',
  'Camp Humphreys':'Pyeongtaek South Korea',
};

const VETERAN_OWNED_BUSINESSES = {
  // ── ARMY CONUS ────────────────────────────────────────────────────────────
  "Fort Liberty": [
    { name:"Airborne & Special Operations Museum Store", category:"Retail/Museum", desc:"Veteran-run gift shop at the Airborne & Special Operations Museum. Military memorabilia, books, and unit history gear.", url:"https://www.asomf.org", icon:"🎖️" },
    { name:"All American Brewpub", category:"Restaurant/Bar", desc:"Veteran-owned brewery and restaurant in downtown Fayetteville. Craft beers and American fare with military discounts.", url:"https://allamericanbrewpub.com", icon:"🍺" },
    { name:"Cape Fear CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Fort Liberty. Tactical fitness programming, active-duty discounts available.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Fayetteville+NC", icon:"💪" },
    { name:"Patriot Roofing & Construction", category:"Home Services", desc:"Veteran-owned roofing and general contracting serving the Fort Liberty military community.", url:"https://www.google.com/search?q=veteran+owned+roofing+Fayetteville+NC", icon:"🏠" },
    { name:"Find More Near Fort Liberty →", category:"Directory", desc:"Search VeteranOwnedBusiness.com for all verified veteran-owned businesses in the Fayetteville area.", url:"https://veteranownedbusiness.com/search?q=&location=fayetteville+nc", icon:"🔍" },
  ],
  "Fort Bragg": [
    { name:"Airborne & Special Operations Museum Store", category:"Retail/Museum", desc:"Veteran-operated gift shop honoring the 82nd Airborne and Special Operations history.", url:"https://www.asomf.org", icon:"🎖️" },
    { name:"All American Brewpub", category:"Restaurant/Bar", desc:"Veteran-owned brewery near post with craft beers and military discounts.", url:"https://allamericanbrewpub.com", icon:"🍺" },
    { name:"Find More Near Fayetteville →", category:"Directory", desc:"Search for all verified veteran-owned businesses in the greater Fayetteville area.", url:"https://veteranownedbusiness.com/search?q=&location=fayetteville+nc", icon:"🔍" },
  ],
  "Fort Campbell": [
    { name:"Strawberry Alley Ale Works", category:"Brewery/Restaurant", desc:"Veteran co-owned craft brewery in downtown Clarksville. Award-winning ales, lagers and IPAs. Military and veteran discounts offered.", url:"https://www.strawberryalleyaleworks.com", icon:"🍺" },
    { name:"Paradigm Shift Brewing", category:"Brewery", desc:"Veteran-owned nano-brewery in Clarksville, TN. Small-batch craft beers with a military heritage. Taproom open weekends.", url:"https://www.google.com/search?q=Paradigm+Shift+Brewing+Clarksville+TN", icon:"🍺" },
    { name:"Warrior's Path Financial", category:"Financial Services", desc:"Veteran-owned financial planning and wealth management near Fort Campbell. Specializes in military retirement planning.", url:"https://www.google.com/search?q=veteran+owned+financial+advisor+Clarksville+TN", icon:"💰" },
    { name:"Tactical CrossFit Clarksville", category:"Fitness", desc:"Veteran-owned CrossFit gym in Clarksville. Military programming, group classes, and active-duty rates.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Clarksville+TN", icon:"💪" },
    { name:"Find More Near Clarksville →", category:"Directory", desc:"Search VeteranOwnedBusiness.com for all verified veteran-owned businesses near Fort Campbell.", url:"https://veteranownedbusiness.com/search?q=&location=clarksville+tn", icon:"🔍" },
  ],
  "Fort Cavazos": [
    { name:"Killeen Veterans Business Alliance", category:"Network", desc:"Coalition of veteran-owned businesses in the greater Killeen/Fort Cavazos area. Referrals, networking, and mutual support.", url:"https://www.google.com/search?q=Killeen+Veterans+Business+Alliance", icon:"🤝" },
    { name:"Texas Veteran BBQ", category:"Restaurant", desc:"Veteran-owned Texas-style BBQ joint near Fort Cavazos. Brisket, ribs, and pulled pork with a military discount.", url:"https://www.google.com/search?q=veteran+owned+BBQ+Killeen+TX", icon:"🍖" },
    { name:"Lone Star Tactical Fitness", category:"Fitness", desc:"Veteran-owned CrossFit and tactical fitness gym serving the Fort Cavazos community. Monthly active-duty rates available.", url:"https://www.google.com/search?q=veteran+owned+gym+Killeen+TX", icon:"💪" },
    { name:"Combat Veteran Realty", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans and military relocations around Fort Cavazos.", url:"https://www.google.com/search?q=veteran+owned+realtor+Killeen+TX", icon:"🏘️" },
    { name:"Find More Near Killeen →", category:"Directory", desc:"Search for all verified veteran-owned businesses in the Killeen/Temple area.", url:"https://veteranownedbusiness.com/search?q=&location=killeen+tx", icon:"🔍" },
  ],
  "Fort Hood": [
    { name:"Killeen Veterans Business Alliance", category:"Network", desc:"Veteran-owned business network near Fort Hood. Connects military entrepreneurs and patrons.", url:"https://www.google.com/search?q=Killeen+Veterans+Business+Alliance", icon:"🤝" },
    { name:"Texas Veteran BBQ", category:"Restaurant", desc:"Veteran-owned BBQ near Fort Hood. Military discounts available.", url:"https://www.google.com/search?q=veteran+owned+BBQ+Killeen+TX", icon:"🍖" },
    { name:"Find More Near Killeen →", category:"Directory", desc:"Browse all veteran-owned businesses near Fort Hood/Cavazos.", url:"https://veteranownedbusiness.com/search?q=&location=killeen+tx", icon:"🔍" },
  ],
  "Fort Carson": [
    { name:"Pikes Peak Brewing Company", category:"Brewery", desc:"Veteran co-founded craft brewery in Colorado Springs. Community-centered taproom with rotating military appreciation events.", url:"https://pikespeakbrewing.com", icon:"🍺" },
    { name:"BattleBorn Coffee Roasters", category:"Coffee", desc:"Veteran-owned specialty coffee roaster based in Colorado. Ships nationwide; beans available at area shops near Fort Carson.", url:"https://battlebornroasters.com", icon:"☕" },
    { name:"Warrior Roofing & Solar", category:"Home Services", desc:"Veteran-owned roofing and solar installation company in Colorado Springs. Active-duty and veteran discounts available.", url:"https://www.google.com/search?q=veteran+owned+roofing+Colorado+Springs", icon:"🏠" },
    { name:"Tactical Strength & Conditioning", category:"Fitness", desc:"Veteran-owned strength and conditioning gym in Colorado Springs. Military pricing, SFAS/Ranger School prep programming.", url:"https://www.google.com/search?q=veteran+owned+gym+Colorado+Springs", icon:"💪" },
    { name:"Valor Financial (Colorado Springs)", category:"Financial Services", desc:"Veteran-owned financial advisory firm in Colorado Springs. Military TSP rollover and retirement planning specialists.", url:"https://www.google.com/search?q=veteran+owned+financial+advisor+Colorado+Springs", icon:"💰" },
    { name:"Find More Near Colorado Springs →", category:"Directory", desc:"Browse verified veteran-owned businesses near Fort Carson on VeteranOwnedBusiness.com.", url:"https://veteranownedbusiness.com/search?q=&location=colorado+springs+co", icon:"🔍" },
  ],
  "Fort Bliss": [
    { name:"Veteran Coffee House El Paso", category:"Coffee/Community", desc:"Veteran-owned coffee shop and community hub in El Paso. Regular networking events for transitioning service members.", url:"https://www.google.com/search?q=veteran+coffee+house+El+Paso+TX", icon:"☕" },
    { name:"Combat Arms CrossFit El Paso", category:"Fitness", desc:"Veteran-owned CrossFit gym near Fort Bliss. Military discounts, veteran coaching staff.", url:"https://www.google.com/search?q=veteran+owned+crossfit+El+Paso+TX", icon:"💪" },
    { name:"Border Veteran Realty", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans and PCS moves in the El Paso/Fort Bliss area.", url:"https://www.google.com/search?q=veteran+owned+realtor+El+Paso+TX", icon:"🏘️" },
    { name:"El Paso Veterans Business Outreach Center", category:"Network/Resources", desc:"SBA-backed VBOC providing free counseling, training, and resources for veteran entrepreneurs in the El Paso area.", url:"https://sba.gov/offices/district/nm/albuquerque", icon:"🤝" },
    { name:"Find More Near El Paso →", category:"Directory", desc:"Search for verified veteran-owned businesses near Fort Bliss.", url:"https://veteranownedbusiness.com/search?q=&location=el+paso+tx", icon:"🔍" },
  ],
  "Fort Stewart": [
    { name:"Coastal Empire Beer Company", category:"Brewery", desc:"Savannah-area craft brewery with strong military community ties. Veteran-owned staff; military discount on all orders.", url:"https://www.coastalempirebeers.com", icon:"🍺" },
    { name:"Hinesville Veteran Services", category:"Network", desc:"Local veteran business support network serving the Fort Stewart military community. Resources for entrepreneurs and job seekers.", url:"https://www.google.com/search?q=veteran+business+Hinesville+GA", icon:"🤝" },
    { name:"Tactical Fitness Hinesville", category:"Fitness", desc:"Veteran-owned gym and training facility near Fort Stewart. Flexible military membership rates.", url:"https://www.google.com/search?q=veteran+owned+gym+Hinesville+GA", icon:"💪" },
    { name:"Find More Near Hinesville/Savannah →", category:"Directory", desc:"Browse veteran-owned businesses in the Hinesville and Savannah, GA area.", url:"https://veteranownedbusiness.com/search?q=&location=hinesville+ga", icon:"🔍" },
  ],
  "Fort Drum": [
    { name:"Watertown Veteran Business Hub", category:"Network", desc:"Local veteran entrepreneur network near Fort Drum. Monthly meetings, business referrals, and support for transitioning service members.", url:"https://www.google.com/search?q=veteran+owned+business+Watertown+NY", icon:"🤝" },
    { name:"North Country Tactical Gear", category:"Retail/Outdoor", desc:"Veteran-owned outdoor and tactical gear store near Fort Drum. Military discount on all purchases.", url:"https://www.google.com/search?q=veteran+owned+tactical+gear+Watertown+NY", icon:"🎒" },
    { name:"Find More Near Watertown →", category:"Directory", desc:"Search for veteran-owned businesses near Fort Drum in Watertown, NY.", url:"https://veteranownedbusiness.com/search?q=&location=watertown+ny", icon:"🔍" },
  ],
  "Fort Sill": [
    { name:"Lawton Veteran Business Alliance", category:"Network", desc:"Local network of veteran business owners near Fort Sill. Events, referrals, and mutual support for the military community.", url:"https://www.google.com/search?q=veteran+business+Lawton+OK", icon:"🤝" },
    { name:"Thunder CrossFit Lawton", category:"Fitness", desc:"Veteran-owned CrossFit gym in Lawton, OK. Military pricing available for active duty and veterans.", url:"https://www.google.com/search?q=veteran+owned+gym+Lawton+OK", icon:"💪" },
    { name:"Red River Brewing (Lawton)", category:"Brewery", desc:"Veteran-owned craft brewery in Lawton, OK. Oklahoma craft beers with a military roots atmosphere.", url:"https://www.google.com/search?q=veteran+owned+brewery+Lawton+OK", icon:"🍺" },
    { name:"Find More Near Lawton →", category:"Directory", desc:"Search for verified veteran-owned businesses near Fort Sill.", url:"https://veteranownedbusiness.com/search?q=&location=lawton+ok", icon:"🔍" },
  ],
  "Fort Jackson": [
    { name:"Columbia Veteran Business Network", category:"Network", desc:"South Carolina veteran entrepreneur community near Fort Jackson. Free mentorship, referrals, and resources.", url:"https://www.google.com/search?q=veteran+owned+business+Columbia+SC", icon:"🤝" },
    { name:"Palmetto Tactical Fitness", category:"Fitness", desc:"Veteran-owned fitness and training center in Columbia, SC. Group classes and personal training with military rates.", url:"https://www.google.com/search?q=veteran+owned+gym+Columbia+SC", icon:"💪" },
    { name:"Veteran Realty Group Columbia", category:"Real Estate", desc:"VA loan specialists and veteran-owned real estate team helping PCS moves in and around Fort Jackson.", url:"https://www.google.com/search?q=veteran+owned+realtor+Columbia+SC", icon:"🏘️" },
    { name:"Find More Near Columbia →", category:"Directory", desc:"Browse all veteran-owned businesses in the Columbia, SC area.", url:"https://veteranownedbusiness.com/search?q=&location=columbia+sc", icon:"🔍" },
  ],
  "Fort Knox": [
    { name:"Radcliff Veteran Business Hub", category:"Network", desc:"Veteran-owned business network serving the Fort Knox / Radcliff / Louisville corridor. Business referrals and networking events.", url:"https://www.google.com/search?q=veteran+owned+business+Radcliff+KY", icon:"🤝" },
    { name:"Armor CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Fort Knox. Tactical fitness and competitive sport programming. Military discounts.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Radcliff+KY", icon:"💪" },
    { name:"Veteran Auto Service", category:"Automotive", desc:"Veteran-owned auto repair shop serving the Fort Knox military community. Honest service and military discount available.", url:"https://www.google.com/search?q=veteran+owned+auto+repair+Radcliff+KY", icon:"🔧" },
    { name:"Find More Near Fort Knox/Louisville →", category:"Directory", desc:"Search for veteran-owned businesses in the Fort Knox and Louisville, KY area.", url:"https://veteranownedbusiness.com/search?q=&location=radcliff+ky", icon:"🔍" },
  ],
  "Fort Meade": [
    { name:"Annapolis Veteran Business Network", category:"Network", desc:"Maryland veteran entrepreneur network connecting businesses near Fort Meade, Annapolis, and the DC metro corridor.", url:"https://www.google.com/search?q=veteran+owned+business+Odenton+MD", icon:"🤝" },
    { name:"IRONCLAD Coffee Roasters", category:"Coffee", desc:"Veteran-owned specialty coffee roaster in the Baltimore-DC corridor. 10% discount for active duty and veterans.", url:"https://www.google.com/search?q=veteran+owned+coffee+Odenton+MD", icon:"☕" },
    { name:"Cyber Veteran Solutions", category:"Technology", desc:"Veteran-owned IT and cybersecurity consulting firm near Fort Meade and NSA. DoD contractor support.", url:"https://www.google.com/search?q=veteran+owned+cybersecurity+Fort+Meade+MD", icon:"💻" },
    { name:"Find More Near Fort Meade →", category:"Directory", desc:"Search for veteran-owned businesses near Fort Meade in the Odenton/Baltimore area.", url:"https://veteranownedbusiness.com/search?q=&location=odenton+md", icon:"🔍" },
  ],
  "Fort Sam Houston": [
    { name:"Ranger Cattle Company", category:"Food/Retail", desc:"Veteran-owned beef company founded by a former Army Ranger near San Antonio. Premium Texas beef shipped nationwide.", url:"https://www.google.com/search?q=Ranger+Cattle+Company+San+Antonio+TX", icon:"🥩" },
    { name:"Combat Coffee San Antonio", category:"Coffee", desc:"Veteran-owned specialty coffee brand headquartered in San Antonio. Supports veteran employment with every purchase.", url:"https://www.google.com/search?q=veteran+owned+coffee+San+Antonio+TX", icon:"☕" },
    { name:"Veteran Realty of San Antonio", category:"Real Estate", desc:"VA loan certified veteran-owned real estate team. Specializes in military PCS moves and BAH optimization near JBSA.", url:"https://www.google.com/search?q=veteran+owned+realtor+San+Antonio+TX", icon:"🏘️" },
    { name:"SAVETCO (SA Veteran Entrepreneur)", category:"Network", desc:"San Antonio veteran entrepreneur coalition — events, mentorship, and procurement support at the city and state level.", url:"https://www.google.com/search?q=San+Antonio+veteran+entrepreneur+coalition", icon:"🤝" },
    { name:"Find More Near San Antonio →", category:"Directory", desc:"Browse all verified veteran-owned businesses near JBSA / Fort Sam Houston.", url:"https://veteranownedbusiness.com/search?q=&location=san+antonio+tx", icon:"🔍" },
  ],
  "Joint Base San Antonio": [
    { name:"Combat Coffee San Antonio", category:"Coffee", desc:"Veteran-owned specialty coffee. Supports veteran employment.", url:"https://www.google.com/search?q=veteran+owned+coffee+San+Antonio+TX", icon:"☕" },
    { name:"SAVETCO Veteran Entrepreneurs", category:"Network", desc:"San Antonio veteran entrepreneur coalition — city and state procurement support.", url:"https://www.google.com/search?q=San+Antonio+veteran+entrepreneur+coalition", icon:"🤝" },
    { name:"Veteran Realty of San Antonio", category:"Real Estate", desc:"VA loan certified real estate team serving JBSA, Fort Sam Houston, and Lackland AFB military families.", url:"https://www.google.com/search?q=veteran+owned+realtor+San+Antonio+TX", icon:"🏘️" },
    { name:"Find More Near San Antonio →", category:"Directory", desc:"Browse all veteran-owned businesses near JBSA.", url:"https://veteranownedbusiness.com/search?q=&location=san+antonio+tx", icon:"🔍" },
  ],
  "Schofield Barracks": [
    { name:"Koa Brewing Co", category:"Brewery", desc:"Hawaii-based veteran-friendly craft brewery. Local ingredients and military appreciation events near Schofield.", url:"https://www.google.com/search?q=veteran+owned+brewery+Honolulu+HI", icon:"🍺" },
    { name:"Aloha Veteran CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Wahiawa/Honolulu area. Military discount on monthly memberships.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Honolulu+HI", icon:"💪" },
    { name:"Hawaii Veteran Business Hub", category:"Network", desc:"Statewide network of veteran-owned businesses with active members near Schofield Barracks and Honolulu.", url:"https://www.google.com/search?q=veteran+owned+business+Honolulu+HI", icon:"🤝" },
    { name:"Find More Near Honolulu →", category:"Directory", desc:"Search for verified veteran-owned businesses in Hawaii.", url:"https://veteranownedbusiness.com/search?q=&location=honolulu+hi", icon:"🔍" },
  ],
  // ── NAVY ──────────────────────────────────────────────────────────────────
  "Naval Station Norfolk": [
    { name:"Coastal Fermentory", category:"Brewery", desc:"Veteran-owned craft brewery in Hampton Roads. Rotating taps, military discount Fridays.", url:"https://www.google.com/search?q=veteran+owned+brewery+Norfolk+VA", icon:"🍺" },
    { name:"Hampton Roads Veterans Chamber", category:"Network", desc:"Regional chamber connecting veteran-owned businesses across Norfolk, Hampton, and Virginia Beach.", url:"https://www.google.com/search?q=Hampton+Roads+veteran+chamber+of+commerce", icon:"🤝" },
    { name:"Warfare Fitness Norfolk", category:"Fitness", desc:"Veteran-owned functional fitness gym near NS Norfolk. Military-style programming and veteran pricing.", url:"https://www.google.com/search?q=veteran+owned+gym+Norfolk+VA", icon:"💪" },
    { name:"Veteran Realty Hampton Roads", category:"Real Estate", desc:"Veteran-owned VA-loan specialist real estate team serving Norfolk, Chesapeake, and Virginia Beach.", url:"https://www.google.com/search?q=veteran+owned+realtor+Norfolk+VA", icon:"🏘️" },
    { name:"Find More Near Norfolk →", category:"Directory", desc:"Browse verified veteran-owned businesses in the Hampton Roads area.", url:"https://veteranownedbusiness.com/search?q=&location=norfolk+va", icon:"🔍" },
  ],
  "Naval Base San Diego": [
    { name:"Groundwork Coffee Co.", category:"Coffee", desc:"Veteran-co-founded specialty coffee roaster with San Diego roots. Beans sourced from conflict-affected regions worldwide. Multiple locations.", url:"https://groundworkcoffee.com", icon:"☕" },
    { name:"Combat Flip Flops", category:"Apparel/Retail", desc:"Ranger-founded lifestyle brand manufacturing in conflict regions. Sold nationwide; popular at San Diego-area military exchanges.", url:"https://www.combatflipflops.com", icon:"👟" },
    { name:"San Diego Veteran Business Alliance", category:"Network", desc:"Network of 200+ veteran-owned businesses in San Diego County with events, procurement support, and mentorship.", url:"https://www.google.com/search?q=San+Diego+veteran+business+alliance", icon:"🤝" },
    { name:"Warrior CrossFit San Diego", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in San Diego. Tactical strength programming and military membership rates.", url:"https://www.google.com/search?q=veteran+owned+crossfit+San+Diego+CA", icon:"💪" },
    { name:"Find More Near San Diego →", category:"Directory", desc:"Search the full directory of veteran-owned businesses in San Diego.", url:"https://veteranownedbusiness.com/search?q=&location=san+diego+ca", icon:"🔍" },
  ],
  "NAS Jacksonville": [
    { name:"Bold City Brewery", category:"Brewery", desc:"Jacksonville craft brewery with deep military community ties and regular veteran appreciation events.", url:"https://boldcitybrewery.com", icon:"🍺" },
    { name:"Jacksonville Veteran Business Network", category:"Network", desc:"Local network supporting veteran-owned businesses in Jacksonville. Regular meetups and procurement referrals.", url:"https://www.google.com/search?q=veteran+owned+business+Jacksonville+FL", icon:"🤝" },
    { name:"Tactical CrossFit Jacksonville", category:"Fitness", desc:"Veteran-owned CrossFit and functional fitness near NAS Jacksonville. Active-duty monthly rates available.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Jacksonville+FL", icon:"💪" },
    { name:"Find More Near Jacksonville →", category:"Directory", desc:"Browse all verified veteran-owned businesses in Jacksonville, FL.", url:"https://veteranownedbusiness.com/search?q=&location=jacksonville+fl", icon:"🔍" },
  ],
  "Naval Station Mayport": [
    { name:"Bold City Brewery", category:"Brewery", desc:"Jacksonville veteran-friendly craft brewery. Rotating taps and military appreciation events.", url:"https://boldcitybrewery.com", icon:"🍺" },
    { name:"Veteran Realty Jacksonville Beaches", category:"Real Estate", desc:"VA-loan specialist real estate team serving the Mayport/Atlantic Beach/Neptune Beach corridor.", url:"https://www.google.com/search?q=veteran+owned+realtor+Jacksonville+FL+beaches", icon:"🏘️" },
    { name:"Find More Near Jacksonville/Mayport →", category:"Directory", desc:"Browse all veteran-owned businesses in the greater Jacksonville area.", url:"https://veteranownedbusiness.com/search?q=&location=jacksonville+fl", icon:"🔍" },
  ],
  "NAS Pensacola": [
    { name:"Pensacola Veteran Business Hub", category:"Network", desc:"Panhandle area veteran entrepreneur coalition serving NAS Pensacola, Whiting Field, and Eglin AFB military community.", url:"https://www.google.com/search?q=veteran+owned+business+Pensacola+FL", icon:"🤝" },
    { name:"Craft 850 Brewing", category:"Brewery", desc:"Veteran-owned craft brewery in the Pensacola area. Military discount available; proceeds partially fund veteran charities.", url:"https://www.google.com/search?q=veteran+owned+brewery+Pensacola+FL", icon:"🍺" },
    { name:"Emerald Coast Tactical Fitness", category:"Fitness", desc:"Veteran-owned gym near NAS Pensacola. Functional fitness, CrossFit, and military prep programming.", url:"https://www.google.com/search?q=veteran+owned+gym+Pensacola+FL", icon:"💪" },
    { name:"Find More Near Pensacola →", category:"Directory", desc:"Browse verified veteran-owned businesses in Pensacola.", url:"https://veteranownedbusiness.com/search?q=&location=pensacola+fl", icon:"🔍" },
  ],
  "Naval Air Station Pensacola": [
    { name:"Pensacola Veteran Business Hub", category:"Network", desc:"Panhandle veteran entrepreneur coalition — business referrals and community support.", url:"https://www.google.com/search?q=veteran+owned+business+Pensacola+FL", icon:"🤝" },
    { name:"Craft 850 Brewing", category:"Brewery", desc:"Veteran-owned craft brewery in the Pensacola area. Military discount available.", url:"https://www.google.com/search?q=veteran+owned+brewery+Pensacola+FL", icon:"🍺" },
    { name:"Find More Near Pensacola →", category:"Directory", desc:"Browse all veteran-owned businesses near NAS Pensacola.", url:"https://veteranownedbusiness.com/search?q=&location=pensacola+fl", icon:"🔍" },
  ],
  // ── MARINE CORPS ──────────────────────────────────────────────────────────
  "Marine Corps Base Camp Lejeune": [
    { name:"Lejeune Veteran Business Network", category:"Network", desc:"Jacksonville, NC veteran entrepreneur coalition. Business referrals, mentorship, and networking events for the Camp Lejeune community.", url:"https://www.google.com/search?q=veteran+owned+business+Jacksonville+NC", icon:"🤝" },
    { name:"Onslow CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Jacksonville, NC. Military pricing and tactical fitness programming.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Jacksonville+NC", icon:"💪" },
    { name:"Lejeune Veteran Realty", category:"Real Estate", desc:"Marine veteran-owned real estate team. VA loan specialists serving Camp Lejeune PCS families.", url:"https://www.google.com/search?q=veteran+owned+realtor+Jacksonville+NC", icon:"🏘️" },
    { name:"Half Time Beverage", category:"Retail", desc:"Veteran-owned beer, wine, and spirits shop near Camp Lejeune. Large military selection and competitive pricing.", url:"https://www.google.com/search?q=Half+Time+Beverage+Jacksonville+NC", icon:"🛒" },
    { name:"Find More Near Jacksonville, NC →", category:"Directory", desc:"Search for all verified veteran-owned businesses near Camp Lejeune.", url:"https://veteranownedbusiness.com/search?q=&location=jacksonville+nc", icon:"🔍" },
  ],
  "Camp Lejeune": [
    { name:"Onslow CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Camp Lejeune. Military pricing available.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Jacksonville+NC", icon:"💪" },
    { name:"Half Time Beverage", category:"Retail", desc:"Veteran-owned spirits shop near Camp Lejeune.", url:"https://www.google.com/search?q=Half+Time+Beverage+Jacksonville+NC", icon:"🛒" },
    { name:"Find More Near Jacksonville, NC →", category:"Directory", desc:"Browse veteran-owned businesses near Camp Lejeune.", url:"https://veteranownedbusiness.com/search?q=&location=jacksonville+nc", icon:"🔍" },
  ],
  "Camp Pendleton": [
    { name:"Wild Coast Coffee Co.", category:"Coffee", desc:"Veteran-owned specialty coffee shop in Oceanside. Regular military appreciation events and active-duty discounts.", url:"https://www.google.com/search?q=Wild+Coast+Coffee+Oceanside+CA", icon:"☕" },
    { name:"Oceanside CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Oceanside, CA. Marine veteran coaches. Military membership rates.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Oceanside+CA", icon:"💪" },
    { name:"San Diego Veteran Business Alliance", category:"Network", desc:"Large network of veteran-owned businesses covering San Diego County and North County including Oceanside.", url:"https://www.google.com/search?q=San+Diego+veteran+business+alliance", icon:"🤝" },
    { name:"Ironside Brewing (Oceanside)", category:"Brewery", desc:"Veteran-co-owned craft brewery in Oceanside with a military heritage theme.", url:"https://www.google.com/search?q=veteran+owned+brewery+Oceanside+CA", icon:"🍺" },
    { name:"Find More Near Oceanside →", category:"Directory", desc:"Browse verified veteran-owned businesses near Camp Pendleton.", url:"https://veteranownedbusiness.com/search?q=&location=oceanside+ca", icon:"🔍" },
  ],
  "MCAS Miramar": [
    { name:"Groundwork Coffee Co.", category:"Coffee", desc:"Veteran co-founded specialty coffee with San Diego roots. Multiple locations throughout the region.", url:"https://groundworkcoffee.com", icon:"☕" },
    { name:"San Diego Veteran Business Alliance", category:"Network", desc:"200+ veteran-owned businesses in the San Diego area covering all districts.", url:"https://www.google.com/search?q=San+Diego+veteran+business+alliance", icon:"🤝" },
    { name:"Find More Near San Diego →", category:"Directory", desc:"Search the full directory of veteran-owned businesses in San Diego.", url:"https://veteranownedbusiness.com/search?q=&location=san+diego+ca", icon:"🔍" },
  ],
  "MCB Quantico": [
    { name:"Northern Virginia Veteran Business Network", category:"Network", desc:"Regional network covering Quantico, Woodbridge, and the DC metro area. Business referrals and government procurement support.", url:"https://www.google.com/search?q=veteran+owned+business+Quantico+VA", icon:"🤝" },
    { name:"Semper Fit Stafford", category:"Fitness", desc:"Veteran-owned CrossFit and personal training gym near MCB Quantico in Stafford, VA.", url:"https://www.google.com/search?q=veteran+owned+gym+Stafford+VA", icon:"💪" },
    { name:"Find More Near Quantico/NOVA →", category:"Directory", desc:"Browse veteran-owned businesses in Northern Virginia near MCB Quantico.", url:"https://veteranownedbusiness.com/search?q=&location=woodbridge+va", icon:"🔍" },
  ],
  // ── AIR FORCE ─────────────────────────────────────────────────────────────
  "Joint Base Langley-Eustis": [
    { name:"The Winery at Bull Run (nearby)", category:"Winery", desc:"Virginia winery with strong veteran/military community ties in the Hampton Roads area. Regular veteran events.", url:"https://www.google.com/search?q=veteran+owned+brewery+Hampton+VA", icon:"🍷" },
    { name:"Hampton Roads Veterans Chamber", category:"Network", desc:"Regional veteran business chamber covering Hampton, Newport News, and Norfolk. Business directory and advocacy.", url:"https://www.google.com/search?q=Hampton+Roads+veteran+chamber+of+commerce", icon:"🤝" },
    { name:"Peninsula CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate on the Virginia Peninsula. Military pricing available.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Hampton+VA", icon:"💪" },
    { name:"Find More Near Hampton, VA →", category:"Directory", desc:"Browse veteran-owned businesses near Langley-Eustis in Hampton and Newport News.", url:"https://veteranownedbusiness.com/search?q=&location=hampton+va", icon:"🔍" },
  ],
  "Eglin AFB": [
    { name:"Emerald Coast Veteran Business Hub", category:"Network", desc:"Veteran entrepreneur coalition in the Eglin/Hurlburt/Pensacola corridor. Business referrals and SBA support.", url:"https://www.google.com/search?q=veteran+owned+business+Fort+Walton+Beach+FL", icon:"🤝" },
    { name:"Lucky Devil Brewing (Ft. Walton Beach)", category:"Brewery", desc:"Veteran-friendly craft brewery near Eglin AFB in Fort Walton Beach. Military discount on pints and growlers.", url:"https://www.google.com/search?q=veteran+owned+brewery+Fort+Walton+Beach+FL", icon:"🍺" },
    { name:"Destin Tactical & Outdoors", category:"Retail", desc:"Veteran-owned outdoor and tactical gear shop near Eglin AFB. Military discounts and special ordering.", url:"https://www.google.com/search?q=veteran+owned+tactical+gear+Destin+FL", icon:"🎒" },
    { name:"Find More Near Fort Walton Beach →", category:"Directory", desc:"Browse veteran-owned businesses in the Eglin / Fort Walton Beach area.", url:"https://veteranownedbusiness.com/search?q=&location=fort+walton+beach+fl", icon:"🔍" },
  ],
  "Hurlburt Field": [
    { name:"Emerald Coast Veteran Business Hub", category:"Network", desc:"Veteran entrepreneur coalition serving the Eglin/Hurlburt/Pensacola corridor.", url:"https://www.google.com/search?q=veteran+owned+business+Fort+Walton+Beach+FL", icon:"🤝" },
    { name:"Find More Near Fort Walton Beach →", category:"Directory", desc:"Browse veteran-owned businesses near Hurlburt Field.", url:"https://veteranownedbusiness.com/search?q=&location=fort+walton+beach+fl", icon:"🔍" },
  ],
  "MacDill AFB": [
    { name:"Veteran Craft Brewing Co.", category:"Brewery", desc:"Tampa-based veteran-owned craft brewery. Military appreciation nights and active-duty discounts.", url:"https://www.google.com/search?q=veteran+owned+brewery+Tampa+FL", icon:"🍺" },
    { name:"Warrior Weekend Foundation (Tampa)", category:"Network", desc:"Tampa Bay veteran business and community network. Connects SOCOM-area veterans with local business opportunities.", url:"https://www.google.com/search?q=veteran+owned+business+Tampa+FL", icon:"🤝" },
    { name:"Special Ops CrossFit Tampa", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Tampa. SOCOM/SOF community programming. Military rates available.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Tampa+FL", icon:"💪" },
    { name:"Veteran Realty Tampa Bay", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans for MacDill AFB and SOCOM military families.", url:"https://www.google.com/search?q=veteran+owned+realtor+Tampa+FL", icon:"🏘️" },
    { name:"Find More Near Tampa →", category:"Directory", desc:"Browse the full directory of veteran-owned businesses in Tampa.", url:"https://veteranownedbusiness.com/search?q=&location=tampa+fl", icon:"🔍" },
  ],
  "Travis AFB": [
    { name:"Travis Credit Union", category:"Financial Services", desc:"Military-chartered credit union serving Travis AFB members. Competitive rates on VA loans, auto, and personal banking.", url:"https://www.traviscu.org", icon:"💰" },
    { name:"Fairfield Veteran Business Network", category:"Network", desc:"Solano County veteran entrepreneur coalition near Travis AFB. Business referrals and Vet-Biz procurement resources.", url:"https://www.google.com/search?q=veteran+owned+business+Fairfield+CA", icon:"🤝" },
    { name:"North Bay CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Vacaville/Fairfield. Military family discount plans.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Fairfield+CA", icon:"💪" },
    { name:"Find More Near Fairfield/Sacramento →", category:"Directory", desc:"Browse veteran-owned businesses near Travis AFB.", url:"https://veteranownedbusiness.com/search?q=&location=fairfield+ca", icon:"🔍" },
  ],
  "Wright-Patterson AFB": [
    { name:"Dayton Veteran Business Alliance", category:"Network", desc:"Regional veteran business network in Dayton / Montgomery County. Business referrals and WPAFB contractor support.", url:"https://www.google.com/search?q=veteran+owned+business+Dayton+OH", icon:"🤝" },
    { name:"Warped Wing Brewing", category:"Brewery", desc:"Dayton craft brewery with an aviation and veteran-connected heritage. Regular military appreciation events.", url:"https://www.google.com/search?q=Warped+Wing+Brewing+Dayton+OH", icon:"🍺" },
    { name:"Air Force CrossFit Dayton", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Wright-Patterson AFB. Military and DoD civilian membership rates.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Dayton+OH", icon:"💪" },
    { name:"Find More Near Dayton →", category:"Directory", desc:"Browse verified veteran-owned businesses near Wright-Patterson AFB.", url:"https://veteranownedbusiness.com/search?q=&location=dayton+oh", icon:"🔍" },
  ],
  "Nellis AFB": [
    { name:"Battle Born Brewing Company", category:"Brewery", desc:"Veteran-owned Nevada craft brewery. 'Battle Born' is Nevada's state motto — honoring the state's strong military heritage.", url:"https://www.google.com/search?q=Battle+Born+Brewing+Las+Vegas+NV", icon:"🍺" },
    { name:"Las Vegas Veteran Business Network", category:"Network", desc:"Nevada veteran entrepreneur coalition. Business referrals, veteran-owned business directory, and government procurement support.", url:"https://www.google.com/search?q=veteran+owned+business+Las+Vegas+NV", icon:"🤝" },
    { name:"Nellis CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Nellis AFB in Henderson, NV. Fighter pilot and tactical fitness programming.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Las+Vegas+NV", icon:"💪" },
    { name:"Find More Near Las Vegas →", category:"Directory", desc:"Browse verified veteran-owned businesses in the Las Vegas area.", url:"https://veteranownedbusiness.com/search?q=&location=las+vegas+nv", icon:"🔍" },
  ],
  // ── JOINT BASES ───────────────────────────────────────────────────────────
  "Joint Base Lewis-McChord": [
    { name:"Northwest Veteran Business Alliance", category:"Network", desc:"Washington State veteran entrepreneur network. Events, referrals, and 8(a) procurement support for JBLM area veteran businesses.", url:"https://www.google.com/search?q=veteran+owned+business+Tacoma+WA", icon:"🤝" },
    { name:"Black Coffee Roasting Co.", category:"Coffee", desc:"Veteran-owned coffee roaster in Olympia, WA. All-black packaging symbolizing the coffee's strength — military discount for service members.", url:"https://www.google.com/search?q=veteran+owned+coffee+Tacoma+WA", icon:"☕" },
    { name:"Tacoma CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Tacoma. Military programming and monthly active-duty rates near JBLM.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Tacoma+WA", icon:"💪" },
    { name:"Sound Brewing (Tacoma)", category:"Brewery", desc:"Veteran-connected craft brewery in Tacoma with a Navy/military community presence.", url:"https://www.google.com/search?q=veteran+owned+brewery+Tacoma+WA", icon:"🍺" },
    { name:"Find More Near Tacoma →", category:"Directory", desc:"Browse the full directory of veteran-owned businesses near JBLM.", url:"https://veteranownedbusiness.com/search?q=&location=tacoma+wa", icon:"🔍" },
  ],
  "Joint Base Andrews": [
    { name:"National Capital Region Veteran Business Hub", category:"Network", desc:"DC-area veteran business network covering Prince George's County, Northern Virginia, and the Pentagon corridor.", url:"https://www.google.com/search?q=veteran+owned+business+Clinton+MD", icon:"🤝" },
    { name:"Veteran Realty DC Metro", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans for the DC metro area. PCS move specialists near Andrews, Pentagon, and Fort Meade.", url:"https://www.google.com/search?q=veteran+owned+realtor+Clinton+MD", icon:"🏘️" },
    { name:"Capital Beltway CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Joint Base Andrews. Military pricing for active duty and veterans.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Clinton+MD", icon:"💪" },
    { name:"Find More Near DC Metro →", category:"Directory", desc:"Search for veteran-owned businesses in the DC metro area near Joint Base Andrews.", url:"https://veteranownedbusiness.com/search?q=&location=clinton+md", icon:"🔍" },
  ],
  "Joint Base Charleston": [
    { name:"Charleston Veteran Business Network", category:"Network", desc:"South Carolina veteran entrepreneur coalition. Active members near JB Charleston, Naval Weapons Station, and North Charleston.", url:"https://www.google.com/search?q=veteran+owned+business+Charleston+SC", icon:"🤝" },
    { name:"Holy City Brewing", category:"Brewery", desc:"Charleston-area craft brewery with veteran community ties and regular military appreciation tap nights.", url:"https://www.google.com/search?q=veteran+owned+brewery+Charleston+SC", icon:"🍺" },
    { name:"Lowcountry CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in North Charleston. Military membership rates.", url:"https://www.google.com/search?q=veteran+owned+crossfit+Charleston+SC", icon:"💪" },
    { name:"Find More Near Charleston →", category:"Directory", desc:"Browse all veteran-owned businesses in the Charleston, SC area.", url:"https://veteranownedbusiness.com/search?q=&location=charleston+sc", icon:"🔍" },
  ],
  "Joint Base Elmendorf-Richardson": [
    { name:"Anchorage Veteran Business Network", category:"Network", desc:"Alaska veteran entrepreneur coalition. Business referrals and government contracting support for the JBER community.", url:"https://www.google.com/search?q=veteran+owned+business+Anchorage+AK", icon:"🤝" },
    { name:"Broken Tooth Brewing", category:"Brewery", desc:"Anchorage veteran-connected craft brewery. Popular with the JBER military community. Seasonal outdoor programming.", url:"https://www.google.com/search?q=veteran+owned+brewery+Anchorage+AK", icon:"🍺" },
    { name:"Alaska Tactical Fitness", category:"Fitness", desc:"Veteran-owned CrossFit and tactical fitness near JBER. Cold-weather training specialties.", url:"https://www.google.com/search?q=veteran+owned+gym+Anchorage+AK", icon:"💪" },
    { name:"Find More Near Anchorage →", category:"Directory", desc:"Search for veteran-owned businesses near JBER in Anchorage, AK.", url:"https://veteranownedbusiness.com/search?q=&location=anchorage+ak", icon:"🔍" },
  ],
  "Joint Base Pearl Harbor-Hickam": [
    { name:"Koa Brewing Co", category:"Brewery", desc:"Hawaii craft brewery with veteran community ties. Military appreciation events and active-duty discounts.", url:"https://www.google.com/search?q=veteran+owned+brewery+Honolulu+HI", icon:"🍺" },
    { name:"Hawaii Veteran Business Hub", category:"Network", desc:"Statewide veteran entrepreneur network covering JBPHH, Schofield, and all Hawaii military installations.", url:"https://www.google.com/search?q=veteran+owned+business+Honolulu+HI", icon:"🤝" },
    { name:"Find More Near Honolulu →", category:"Directory", desc:"Browse veteran-owned businesses in Hawaii.", url:"https://veteranownedbusiness.com/search?q=&location=honolulu+hi", icon:"🔍" },
  ],
  // ── OCONUS ────────────────────────────────────────────────────────────────
  "Camp Humphreys": [
    { name:"Dragon Hill Lodge (MWR)", category:"Hospitality", desc:"Military-operated lodge on Camp Humphreys. Veteran-staffed hospitality and dining.", url:"https://www.dragonhilllodge.com", icon:"🏨" },
    { name:"Army & Air Force Exchange (AAFES)", category:"Retail", desc:"Exchange-operated retail on post. Prioritizes veteran-owned small businesses as vendors.", url:"https://www.shopmyexchange.com", icon:"🛒" },
    { name:"Search USFK Patron Businesses →", category:"Directory", desc:"Browse MWR-approved and veteran-connected businesses on Camp Humphreys.", url:"https://www.google.com/search?q=veteran+owned+business+Camp+Humphreys+Korea", icon:"🔍" },
  ],
};

const PCS_CHECKLIST = {
  "Orders Received": [
    "Request official PCS orders from unit S1",
    "Review orders for report date and gaining unit",
    "Make copies of orders (keep 10+)",
    "Notify current landlord/housing office",
    "Begin home sale or lease termination process",
    "Notify your chain of command",
  ],
  "90 Days Out": [
    "Schedule transportation appointment (TMO/PPPO)",
    "Create household goods inventory",
    "Research gaining installation housing options",
    "Apply for on-post housing at gaining installation",
    "Research schools for children",
    "Update vehicle registrations and insurance",
    "Arrange POV shipment if going OCONUS",
    "Begin passport/visa process if going OCONUS",
  ],
  "60 Days Out": [
    "Schedule medical/dental appointments",
    "Obtain medical and dental records",
    "Update SGLI and beneficiary info",
    "Obtain school records for children",
    "Notify financial institutions of address change",
    "Begin decluttering for household move",
    "Research employment opportunities at gaining installation",
    "Connect with gaining unit Family Readiness Group",
  ],
  "30 Days Out": [
    "Confirm pack-out dates with moving company",
    "Arrange lodging for travel days",
    "Notify DEERS of upcoming move",
    "Forward mail via USPS",
    "Cancel or transfer local subscriptions/utilities",
    "Settle any outstanding debts locally",
    "Prepare vehicles for long-distance travel",
    "Pack personal bag for travel (do not ship)",
  ],
  "Move Week": [
    "Be present for household goods pack-out",
    "Verify all items on inventory sheet",
    "Photograph all rooms before departure",
    "Do final walkthrough of residence",
    "Return keys, base decals, and library books",
    "Pick up cleared documents from unit",
    "Ensure pets have travel documentation",
    "Verify TRICARE coverage is active and transferable",
    "Transfer TRICARE enrollment to gaining region (tricare.mil)",
    "Check weather and route for travel day",
  ],
  "In-Processing": [
    "Report to gaining unit by report date",
    "Complete in-processing checklist at gaining unit S1",
    "Obtain new base access credentials/decal",
    "Set up bank account or update address at bank",
    "Register children in schools",
    "Transfer vehicles to new state registration",
    "Set up new utilities",
    "Schedule household goods delivery",
    "Update ID cards if expiring",
    "Register with new installation medical (MTF)",
    "Enroll family in TRICARE at gaining installation's MTF",
    "Verify TRICARE Prime/Select enrollment and dependents' coverage",
  ],
};

const SCHOOL_DISTRICTS = {
  'Fort Liberty NC': { name: 'Cumberland County Schools', ages: 'K-12', rating: 4.5 },
  'Naval Station Norfolk VA': { name: 'Norfolk Public Schools', ages: 'K-12', rating: 4.3 },
  'Camp Pendleton CA': { name: 'Oceanside Unified', ages: 'K-12', rating: 4.6 },
};

const DAYCARE_DATA = {
  'Fort Liberty': [
    { name: 'Fort Liberty CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.8, desc: 'DoD Child Development Center — priority for active duty. Subsidized rates based on rank.', phone: '(910) 396-5607', waitlist: '2–4 weeks' },
    { name: 'Fort Liberty School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school care on post. Background-checked staff.', phone: '(910) 396-8750', waitlist: '1–2 weeks' },
    { name: 'YMCA Fort Liberty Area', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.2, desc: 'YMCA near post with military discount. Good backup option when CDC is full.', phone: '(910) 323-9622', waitlist: 'None typically' },
  ],
  'Fort Bragg': [
    { name: 'Fort Bragg CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.8, desc: 'DoD Child Development Center — priority for active duty. Subsidized rates based on rank.', phone: '(910) 396-5607', waitlist: '2–4 weeks' },
  ],
  'Camp Humphreys': [
    { name: 'Humphreys CDC (CYSS)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.6, desc: 'DoDEA/CYSS operated. Priority for dual military and single-parent families. Hourly drop-in also available.', phone: 'DSN 753-6540', waitlist: '1–3 weeks' },
    { name: 'Humphreys School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.4, desc: 'On-post before/after school care. Summer programs available.', phone: 'DSN 753-6540', waitlist: 'None typically' },
  ],
  'Fort Campbell': [
    { name: 'Fort Campbell CDC (Bldg 2200)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Military CDC with subsidized rates. Strong demand — sign up early.', phone: '(270) 798-3290', waitlist: '2–6 weeks' },
    { name: 'Clarksville YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.1, desc: 'YMCA in Clarksville with military family discount program.', phone: '(931) 647-2376', waitlist: 'None typically' },
  ],
  'Joint Base Lewis-McChord': [
    { name: 'JBLM CDC (Pendleton)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'CYSS operated CDC at Lewis-McChord. Waitlist priority for active duty.', phone: '(253) 967-7325', waitlist: '3–5 weeks' },
  ],
  'Naval Station Norfolk': [
    { name: 'NS Norfolk CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Navy CDC with subsidized rates. Contact CYP coordinator for availability.', phone: '(757) 444-7403', waitlist: '2–4 weeks' },
  ],
};

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#F59E0B', fontSize: 13 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function ChecklistTab({ theme, profile, checklistItems, setChecklistItems }) {
  const [activePhase, setActivePhase] = useState(Object.keys(PCS_CHECKLIST)[0]);

  const daysUntil = getDaysUntilDeparture(profile?.departingDate);

  const toggleCheckItem = (phase, idx) => {
    const key = `${phase}-${idx}`;
    setChecklistItems(prev => {
      const next = { ...prev, [key]: !prev[key] };
      secureLocalStore.set('pcs_checklist_checks', next);
      AuditLogger.record('pcs_milestone_status_change', { phase, index: idx, complete: !!next[key] });
      return next;
    });
  };

  const allTasks = Object.entries(PCS_CHECKLIST).flatMap(([phase, tasks]) => tasks.map((_, i) => `${phase}-${i}`));
  const done = allTasks.filter(k => checklistItems[k]).length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  const phaseIsOverdue = daysUntil !== null && PHASE_WINDOWS[activePhase] && daysUntil < PHASE_WINDOWS[activePhase].overdueAt;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 16 }}>PCS Checklist</div>

      {/* Overdue warning banner */}
      {phaseIsOverdue && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #EF9A9A', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#C62828' }}>"{activePhase}" Phase is Past Due</div>
            <div style={{ fontSize: 11, color: '#B71C1C', marginTop: 2 }}>Incomplete tasks are highlighted — complete them immediately.</div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ background: '#FFFFFF', border: `2px solid ${theme.accent}40`, borderRadius: 14, padding: '14px 22px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>Overall Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888' }}>{done}/{allTasks.length} tasks</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: pct === 100 ? '#2E7D32' : theme.accent }}>{pct}%</span>
            {pct === 100 && <span style={{ fontSize: 11, fontWeight: 700, background: '#2E7D32', color: '#FFF', borderRadius: 6, padding: '2px 8px' }}>COMPLETE</span>}
          </div>
        </div>
        <div style={{ height: 10, background: '#E0E0E0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#2E7D32' : theme.accent, borderRadius: 10, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#BBB' }}>
          <span>Orders Received</span><span>In Progress</span><span>Move Complete</span>
        </div>
        {daysUntil !== null && (
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: daysUntil < 0 ? '#C62828' : daysUntil < 30 ? '#E65100' : '#56697C', textAlign: 'center' }}>
            {daysUntil < 0 ? `${Math.abs(daysUntil)}d since departure` : `${daysUntil} days until departure`}
          </div>
        )}
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.keys(PCS_CHECKLIST).map(phase => {
          const phaseTasks = PCS_CHECKLIST[phase].map((_, i) => `${phase}-${i}`);
          const phaseDone = phaseTasks.filter(k => checklistItems[k]).length;
          const phaseOverdue = daysUntil !== null && PHASE_WINDOWS[phase] && daysUntil < PHASE_WINDOWS[phase].overdueAt && phaseDone < phaseTasks.length;
          return (
            <button key={phase} onClick={() => setActivePhase(phase)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${phaseOverdue ? '#EF9A9A' : activePhase === phase ? theme.primary : '#E0E6EE'}`, background: activePhase === phase ? theme.primary : phaseOverdue ? '#FFF5F5' : '#FFF', color: activePhase === phase ? '#FFF' : phaseOverdue ? '#C62828' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: phaseOverdue || activePhase === phase ? 800 : 700, whiteSpace: 'nowrap' }}>
              {phaseOverdue ? '⚠ ' : ''}{phase} ({phaseDone}/{phaseTasks.length})
            </button>
          );
        })}
      </div>

      {/* Tasks */}
      <div>
        {PCS_CHECKLIST[activePhase].map((task, i) => {
          const checked = !!checklistItems[`${activePhase}-${i}`];
          const taskOverdue = phaseIsOverdue && !checked;
          return (
            <div key={i} onClick={() => toggleCheckItem(activePhase, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, background: checked ? '#E8F5E9' : taskOverdue ? '#FFF5F5' : '#FFFFFF', border: `1px solid ${checked ? '#A5D6A7' : taskOverdue ? '#FFCDD2' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#2E7D32' : taskOverdue ? '#E57373' : theme.accent}`, background: checked ? '#2E7D32' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {checked && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: checked ? '#888' : taskOverdue ? '#C62828' : theme.primary, textDecoration: checked ? 'line-through' : 'none', fontWeight: checked ? 400 : 600, lineHeight: 1.4 }}>{task}</span>
                {taskOverdue && <div style={{ fontSize: 10, color: '#E57373', fontWeight: 800, marginTop: 3 }}>PAST DUE — Complete immediately</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SchoolsTab({ theme, profile }) {
  const [section, setSection] = useState('schools');
  const [sortBy, setSortBy] = useState('rating');
  const [showAll, setShowAll] = useState(false);
  const [searchAge, setSearchAge] = useState('');
  const [searchZip, setSearchZip] = useState('');

  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const schools = INSTALLATION_SCHOOLS[instName] || [];
  const daycares = DAYCARE_DATA[instName] || [];

  const agesFromProfile = profile?.childAges?.length > 0
    ? profile.childAges.filter(a => !isNaN(Number(a))).map(Number)
    : (profile?.childrenAges || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  const gradeForAge = age => {
    if (age < 5) return 'Pre-K';
    if (age <= 10) return 'K-5';
    if (age <= 13) return '6-8';
    return '9-12';
  };

  const relevantGrades = new Set(agesFromProfile.map(gradeForAge));
  let filteredSchools = (showAll || agesFromProfile.length === 0)
    ? schools
    : schools.filter(s => [...relevantGrades].some(g => {
        if (g === 'Pre-K') return false;
        const [gStart] = g.split('-');
        return s.grades.includes(gStart) || s.grades === g;
      }));
  if (sortBy === 'rating') filteredSchools = [...filteredSchools].sort((a, b) => b.rating - a.rating);
  else filteredSchools = [...filteredSchools].sort((a, b) => a.name.localeCompare(b.name));

  const handleSearch = () => {
    const grade = gradeForAge(parseInt(searchAge) || 10);
    const url = searchZip
      ? `https://www.greatschools.org/search/search.page?zip=${searchZip}`
      : 'https://www.greatschools.org';
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Schools & Childcare</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 14 }}>
        {instName ? <>Near <strong>{instName}</strong>{agesFromProfile.length > 0 && <> · Child ages: {agesFromProfile.join(', ')}</>}</> : 'Complete onboarding to see local schools.'}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['schools', 'K–12 Schools'], ['daycare', 'Daycare & CDC'], ['search', 'Find Schools']].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{ flex: 1, padding: '8px 4px', borderRadius: 20, border: `1.5px solid ${section === id ? theme.primary : '#E0E6EE'}`, background: section === id ? theme.primary : '#FFF', color: section === id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            {label}
          </button>
        ))}
      </div>

      {/* K-12 Schools */}
      {section === 'schools' && (
        <>
          {filteredSchools.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#888' }}>Sort:</span>
              {[['rating', 'Highest Rated'], ['name', 'A–Z']].map(([id, label]) => (
                <button key={id} onClick={() => setSortBy(id)} style={{ padding: '5px 10px', borderRadius: 14, border: `1.5px solid ${sortBy === id ? theme.primary : '#E0E6EE'}`, background: sortBy === id ? theme.primary : '#FFF', color: sortBy === id ? '#FFF' : '#56697C', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {!instName && <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>Complete onboarding to see schools near your installation.</div>}
          {instName && filteredSchools.length === 0 && <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 12 }}>No school data yet for this installation. Try "Find Schools" above.</div>}
          {filteredSchools.map((school, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{school.name}</div>
                <span style={{ background: `${theme.primary}20`, color: theme.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>Grades {school.grades}</span>
              </div>
              <div style={{ marginBottom: 6 }}><StarRating rating={school.rating} /></div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{school.desc}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>📍 {school.city}</div>
              <a href={school.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '9px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>Visit School Website</a>
            </div>
          ))}
          {agesFromProfile.length > 0 && !showAll && schools.length > filteredSchools.length && (
            <button onClick={() => setShowAll(true)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.accent}`, background: 'transparent', color: theme.primary, fontSize: 12, cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
              Show all {schools.length} schools
            </button>
          )}
        </>
      )}

      {/* Daycare & CDC */}
      {section === 'daycare' && (
        <>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#1D4ED8', lineHeight: 1.5 }}>
            Child Development Centers (CDCs) on-post give priority to active duty families. Contact early — waitlists can be 2–8 weeks.
          </div>
          {daycares.length === 0 && (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 14 }}>
              No CDC data for this installation. Call your installation's Child &amp; Youth Services (CYS) office directly.
            </div>
          )}
          {daycares.map((dc, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{dc.name}</div>
                <span style={{ background: `${theme.primary}15`, color: theme.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{dc.type}</span>
              </div>
              <div style={{ marginBottom: 6 }}><StarRating rating={dc.rating} /></div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{dc.desc}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8, fontSize: 11 }}>
                <div style={{ color: '#666' }}>Ages: <strong style={{ color: '#0D1821' }}>{dc.ages}</strong></div>
                <div style={{ color: '#666' }}>Phone: <strong style={{ color: '#0D1821' }}>{dc.phone}</strong></div>
                <div style={{ color: '#666' }}>Waitlist: <strong style={{ color: dc.waitlist.includes('None') ? '#2E7D32' : '#E65100' }}>{dc.waitlist}</strong></div>
              </div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            <a href="https://usa.childcareaware.org/providers/military/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px', borderRadius: 10, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>ChildCare Aware Military</a>
            <a href="https://childcare.gov" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px', borderRadius: 10, background: theme.secondary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>ChildCare.gov</a>
          </div>
        </>
      )}

      {/* Find Schools online */}
      {section === 'search' && (
        <>
          <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 12 }}>Search by Location</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.primary, display: 'block', marginBottom: 5 }}>STUDENT AGE</label>
                <input type="number" min="4" max="18" value={searchAge} onChange={e => setSearchAge(e.target.value)} placeholder="e.g. 9" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.primary, display: 'block', marginBottom: 5 }}>ZIP CODE</label>
                <input type="text" value={searchZip} onChange={e => setSearchZip(e.target.value)} placeholder="e.g. 28310" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            {searchAge && <div style={{ fontSize: 11, color: '#56697C', marginBottom: 10 }}>Grade level: <strong>{gradeForAge(parseInt(searchAge))}</strong></div>}
            <button onClick={handleSearch} style={{ width: '100%', padding: '12px', borderRadius: 10, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Search on GreatSchools →</button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#56697C', marginBottom: 10 }}>SCHOOL FINDER RESOURCES</div>
          {[
            { name: 'GreatSchools', desc: 'Search by zip code — ratings, reviews, test scores', url: 'https://www.greatschools.org' },
            { name: 'DoDEA School Finder', desc: 'Find DoDEA schools on military installations worldwide', url: 'https://www.dodea.edu/schools.cfm' },
            { name: 'NCES School Finder', desc: 'National Center for Education Statistics school search', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
            { name: 'Military Child Education Coalition', desc: 'Education transition resources for military-connected children', url: 'https://www.militarychild.org' },
            { name: 'School Liaison Officers (SLO)', desc: 'Find your installation SLO — free school transition support', url: 'https://www.dodea.edu/Partnership/schoolLiaisonOfficers.cfm' },
          ].map((r, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>{r.desc}</div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>Open →</a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function VeteranBusinessesTab({ theme, profile }) {
  const [filter, setFilter] = useState('All');
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const localBiz = VETERAN_OWNED_BUSINESSES[instName] || [];
  const categories = ['All', ...new Set(localBiz.map(b => b.category))];
  const filtered = filter === 'All' ? localBiz : localBiz.filter(b => b.category === filter);

  const NATIONAL_DIRS = [
    { name: 'Veteran-Owned Business Directory', icon: '🇺🇸', desc: 'Search thousands of verified veteran-owned businesses by location and category.', url: 'https://veteranownedbusiness.com' },
    { name: 'SBA Veteran Business Outreach', icon: '🏛️', desc: 'Free counseling, training, and procurement opportunities for veteran entrepreneurs.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses' },
    { name: 'V-WISE (Women Vets)', icon: '💪', desc: 'SBA program specifically supporting women veteran business owners.', url: 'https://www.sba.gov/vwise' },
    { name: 'Hire Heroes USA', icon: '✈️', desc: 'Free job placement and career coaching for veterans and military spouses.', url: 'https://www.hireheroesusa.org' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Veteran Owned & Veteran Operated Businesses</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>
        {instName ? <>Local businesses near <strong>{instName}</strong></> : 'Complete onboarding to see businesses near your installation.'}
      </div>

      {/* National directory quick links */}
      <div style={{ background: theme.secondary, borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 10, letterSpacing: '.08em' }}>NATIONAL DIRECTORIES & RESOURCES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {NATIONAL_DIRS.map((d, i) => (
            <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FFF', lineHeight: 1.3 }}>{d.name}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Category filter */}
      {localBiz.length > 0 && categories.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 16, border: `1.5px solid ${filter === cat ? theme.primary : '#E0E6EE'}`, background: filter === cat ? theme.primary : '#FFF', color: filter === cat ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Local listings */}
      {localBiz.length === 0 && (
        <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>No local listings yet for this installation</div>
          <div style={{ fontSize: 11, color: '#888' }}>Use the national directories above to find veteran-owned businesses in your area.</div>
        </div>
      )}

      {filtered.map((biz, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{biz.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{biz.name}</div>
              <span style={{ background: '#F3F4F6', color: '#56697C', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{biz.category}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{biz.desc}</div>
          <a href={biz.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '9px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>
            Visit Website
          </a>
        </div>
      ))}
    </div>
  );
}

const INSTALLATION_COLLEGES = {
  'Fort Liberty': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: 'https://www.methodist.edu/admissions/apply-now/', siteUrl: 'https://www.methodist.edu' },
    { name: 'Fayetteville State University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'HBCU with affordable in-state tuition. Robust veteran services. Strong nursing, social work, and criminal justice programs.', applyUrl: 'https://www.uncfsu.edu/admissions', siteUrl: 'https://www.uncfsu.edu' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. Tuition Assistance accepted.", applyUrl: 'https://www.faytechcc.edu/admissions/apply', siteUrl: 'https://www.faytechcc.edu' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Top-ranked liberal arts and professional school near Fort Liberty. Pharmacy, law, and business schools. Military tuition rates.', applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
    { name: 'UNC Pembroke', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'Affordable UNC system university 30 miles from post. Business, education, and public administration programs.', applyUrl: 'https://www.uncp.edu/admissions/apply', siteUrl: 'https://www.uncp.edu' },
  ],
  'Fort Bragg': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: 'https://www.methodist.edu/admissions/apply-now/', siteUrl: 'https://www.methodist.edu' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. TA accepted.", applyUrl: 'https://www.faytechcc.edu/admissions/apply', siteUrl: 'https://www.faytechcc.edu' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Pharmacy, law, and business schools. Military tuition rates available.', applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
  ],
  'Fort Campbell': [
    { name: 'Austin Peay State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Ranked most military-friendly in Tennessee. Located in Clarksville, minutes from the main gate. Online and in-person options. TA accepted.', applyUrl: 'https://www.apsu.edu/admissions/apply/', siteUrl: 'https://www.apsu.edu' },
    { name: 'Volunteer State Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees in healthcare, business, and technology. Transfer pathway to Tennessee universities.', applyUrl: 'https://www.volstate.edu/admissions', siteUrl: 'https://www.volstate.edu' },
    { name: 'Middle Tennessee State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Over 300 degree programs including aerospace, business, and recording industry. 45 minutes from post.', applyUrl: 'https://www.mtsu.edu/admissions/apply.php', siteUrl: 'https://www.mtsu.edu' },
    { name: 'Nashville State Community College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Technical certificates and associate degrees. Strong IT, business, and healthcare programs. TA-eligible.', applyUrl: 'https://www.nscc.edu/admissions', siteUrl: 'https://www.nscc.edu' },
  ],
  'Fort Cavazos': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college. On-post classes, flexible schedules, and TA accepted. Serves thousands of Fort Cavazos soldiers annually.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online classes. Strong business and computer science.', applyUrl: 'https://www.tamuct.edu/admissions/apply-now.html', siteUrl: 'https://www.tamuct.edu' },
    { name: 'University of Mary Hardin-Baylor', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Belton, TX. Nursing, business, and education programs. Military scholarships and veteran services.', applyUrl: 'https://www.umhb.edu/admissions/apply', siteUrl: 'https://www.umhb.edu' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Workforce-focused associate degrees and certificates. Healthcare, law enforcement, and technology programs. Low tuition.', applyUrl: 'https://www.templejc.edu/admissions', siteUrl: 'https://www.templejc.edu' },
  ],
  'Fort Hood': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college on-post. TA accepted. Associates degrees and certificates.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online options.', applyUrl: 'https://www.tamuct.edu/admissions/apply-now.html', siteUrl: 'https://www.tamuct.edu' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees near Fort Hood. Healthcare, IT, and business.', applyUrl: 'https://www.templejc.edu/admissions', siteUrl: 'https://www.templejc.edu' },
  ],
  'Joint Base Lewis-McChord': [
    { name: 'University of Washington Tacoma', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'UW system campus in Tacoma. Business, engineering, and nursing programs. Active veteran community. 15 minutes from JBLM.', applyUrl: 'https://www.tacoma.uw.edu/admissions/apply', siteUrl: 'https://www.tacoma.uw.edu' },
    { name: 'Tacoma Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'High transfer-rate community college near JBLM. Strong IT, business, and healthcare pathways. TA-eligible.', applyUrl: 'https://www.tacomacc.edu/admissions/apply-now/', siteUrl: 'https://www.tacomacc.edu' },
    { name: 'Pierce College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Two campuses near JBLM. Aviation, business, and computer science. Military welcome center on campus.', applyUrl: 'https://www.pierce.ctc.edu/apply', siteUrl: 'https://www.pierce.ctc.edu' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Liberal arts university in Tacoma. Strong nursing, business, and education programs. Yellow Ribbon certified.', applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
    { name: 'University of Puget Sound', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly ranked private liberal arts college. Business, engineering, and occupational therapy. Yellow Ribbon program.', applyUrl: 'https://www.pugetsound.edu/admission/apply-now', siteUrl: 'https://www.pugetsound.edu' },
  ],
  'Fort Carson': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus adjacent to Fort Carson. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: 'https://www.uccs.edu/admissions/apply', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: 'https://www.ppsc.edu/admissions/apply/', siteUrl: 'https://www.ppsc.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
    { name: 'Colorado Technical University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Career-focused IT, business, and criminal justice degrees. Flexible online and on-campus in Colorado Springs. Military-friendly.', applyUrl: 'https://www.coloradotech.edu/', siteUrl: 'https://www.coloradotech.edu' },
  ],
  'Fort Bliss': [
    { name: 'University of Texas at El Paso', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university minutes from Fort Bliss. Engineering, nursing, and business programs. Strong veteran support office and military TA.', applyUrl: 'https://www.utep.edu/student-affairs/admissions/apply/', siteUrl: 'https://www.utep.edu' },
    { name: 'El Paso Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Five campuses near Fort Bliss. Affordable workforce training, associate degrees, and transfer prep. TA-eligible.', applyUrl: 'https://www.epcc.edu/Admissions/', siteUrl: 'https://www.epcc.edu' },
    { name: 'New Mexico State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Land-grant research university in Las Cruces, NM (45 min). Engineering, agriculture, and business programs. Military-friendly.', applyUrl: 'https://admissions.nmsu.edu/', siteUrl: 'https://www.nmsu.edu' },
  ],
  'Fort Stewart': [
    { name: 'Georgia Southern University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Large public university in Statesboro, GA. Business, education, engineering, and health sciences. Military discount and veteran services.', applyUrl: 'https://admissions.georgiasouthern.edu/', siteUrl: 'https://www.georgiasouthern.edu' },
    { name: 'Savannah State University', type: 'Public', degree: '4-Year University', rating: 3.4, desc: "Georgia's oldest HBCU in Savannah, 40 miles from post. Business, social work, and marine sciences.", applyUrl: 'https://www.savannahstate.edu/admissions/', siteUrl: 'https://www.savannahstate.edu' },
    { name: 'Coastal Pines Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical certificates and associate degrees in healthcare, IT, and welding near Fort Stewart. TA-eligible.', applyUrl: 'https://www.coastalpines.edu/admissions/', siteUrl: 'https://www.coastalpines.edu' },
    { name: 'College of Coastal Georgia', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Small public university in Brunswick, GA. Nursing, business, and liberal studies. Veteran-friendly with flexible scheduling.', applyUrl: 'https://www.ccga.edu/admissions/', siteUrl: 'https://www.ccga.edu' },
  ],
  'Fort Drum': [
    { name: 'Jefferson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'SUNY community college in Watertown — the top choice for Fort Drum soldiers. Business, IT, and health programs. TA accepted.', applyUrl: 'https://www.sunyjefferson.edu/admissions/apply/', siteUrl: 'https://www.sunyjefferson.edu' },
    { name: 'SUNY Polytechnic Institute', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'SUNY technology campus. Business, computer science, and nursing programs. Yellow Ribbon participant.', applyUrl: 'https://sunypoly.edu/admissions/', siteUrl: 'https://sunypoly.edu' },
    { name: 'Clarkson University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Top-ranked private engineering and business university in Potsdam, NY. STEM-focused. Financial aid and Yellow Ribbon.', applyUrl: 'https://www.clarkson.edu/admissions/apply', siteUrl: 'https://www.clarkson.edu' },
  ],
  'Naval Station Norfolk': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Dedicated Monarch Military Center. Engineering, business, and education degrees. TA and GI Bill accepted.', applyUrl: 'https://www.odu.edu/apply', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Strong nursing, business, and IT. Transfer partnerships with ODU and Virginia universities.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology programs. Veteran-friendly campus.', applyUrl: 'https://www.nsu.edu/admissions/apply', siteUrl: 'https://www.nsu.edu' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus options. Military tuition discount.', applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
    { name: 'Virginia Wesleyan University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Liberal arts university in Norfolk/Virginia Beach. Small classes and strong veteran services. Yellow Ribbon certified.', applyUrl: 'https://vwu.edu/admissions/apply/', siteUrl: 'https://vwu.edu' },
  ],
  'Marine Corps Base Camp Lejeune': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'The primary college for Camp Lejeune Marines. Located in Jacksonville, NC. On-post classes available. TA accepted.', applyUrl: 'https://www.coastalcarolina.edu/admissions/how-to-apply/', siteUrl: 'https://www.coastalcarolina.edu' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with a Jacksonville campus near Camp Lejeune. Business, criminal justice, and education.', applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Top-ranked business, nursing, and engineering programs. 1 hour from Camp Lejeune.', applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
  ],
  'Camp Pendleton': [
    { name: 'MiraCosta College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Top-rated community college adjacent to Camp Pendleton. On-post classes, strong veteran services. TA and Post-9/11 GI Bill accepted.', applyUrl: 'https://www.miracosta.edu/admissions/', siteUrl: 'https://www.miracosta.edu' },
    { name: 'California State University San Marcos', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CSU campus near Camp Pendleton. Business, nursing, and STEM programs. Strong veteran resource center and military scholarships.', applyUrl: 'https://www.csusm.edu/admissions/undergraduate/apply/', siteUrl: 'https://www.csusm.edu' },
    { name: 'Palomar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in San Marcos. 200+ degree and certificate programs. Transfer pathway to UC and CSU systems.', applyUrl: 'https://www.palomar.edu/admissions/', siteUrl: 'https://www.palomar.edu' },
    { name: 'University of San Diego', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Highly ranked private Catholic university. Business, law, and engineering. Yellow Ribbon participant. 35 miles from post.', applyUrl: 'https://www.sandiego.edu/admissions/apply/', siteUrl: 'https://www.sandiego.edu' },
  ],
  'Fort Sam Houston': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science programs. Active veteran services and military tuition discounts.', applyUrl: 'https://admissions.utsa.edu/', siteUrl: 'https://www.utsa.edu' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts programs. TA accepted. Low tuition.', applyUrl: 'https://www.alamo.edu/spc/admissions/', siteUrl: 'https://www.alamo.edu/spc/' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: 'https://www.trinity.edu/admissions/apply', siteUrl: 'https://www.trinity.edu' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: 'https://www.alamo.edu/sac/admissions/', siteUrl: 'https://www.alamo.edu/sac/' },
  ],
  'Camp Humphreys': [
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading university for OCONUS military members. On-post classes at Camp Humphreys plus fully online options. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted. Same curriculum as Fort Cavazos.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation, aerospace engineering, and business programs. On-post classes available at major installations.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs: intelligence, security management, and emergency management.', applyUrl: 'https://www.amu.apus.edu/enrollment/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'Ramstein Air Base': [
    { name: 'University of Maryland Global Campus Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: "Europe's leading military-focused university. On-base classes at Ramstein and surrounding installations. TA and GI Bill accepted.", applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Only accredited American residential university campus in Europe. Aviation management and aerospace engineering programs.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Alabama-based public university with classes at Ramstein AB. Business, criminal justice, and social science programs.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Kadena Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Kadena AB. Business, cybersecurity, and public safety management. TA and GI Bill.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation science and aerospace engineering with on-base courses. Popular with Air Force members at Kadena.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Yokota Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC at Yokota AB. Business administration, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'On-base associate degrees and certificates. Flexible and TA-eligible. Same high-quality programs as CONUS campuses.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace management degrees available at Yokota. Online with on-base support sessions.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Fort Meade': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Fort Meade. Engineering, business, and cybersecurity. Strong research and intelligence programs.', applyUrl: 'https://admissions.umd.edu/apply', siteUrl: 'https://www.umd.edu' },
    { name: 'Anne Arundel Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'AACC in Arnold, MD. Strong IT, cybersecurity, and business programs near Fort Meade and NSA. TA accepted.', applyUrl: 'https://www.aacc.edu/admissions/apply/', siteUrl: 'https://www.aacc.edu' },
    { name: 'Capitol Technology University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'STEM-focused university in Laurel, MD. Cybersecurity, aerospace, and engineering management. Popular with intelligence community.', applyUrl: 'https://www.captechu.edu/admissions/apply', siteUrl: 'https://www.captechu.edu' },
  ],
  'Schofield Barracks': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and tropical agriculture. 30 minutes from Schofield Barracks.", applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Pearl City, close to Schofield. Liberal arts, healthcare, and pre-professional pathways. TA accepted.', applyUrl: 'https://www.leeward.hawaii.edu/admissions', siteUrl: 'https://www.leeward.hawaii.edu' },
  ],
  // ── CONUS Army (additional) ──────────────────────────────────────────────────
  'Fort Moore': [
    { name: 'Columbus State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Columbus, GA. Business, education, and health sciences. Strong veteran services and TA-eligible.', applyUrl: 'https://www.columbusstate.edu/admissions/', siteUrl: 'https://www.columbusstate.edu' },
    { name: 'Columbus Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Workforce-focused technical college. Healthcare, IT, and skilled trades. TA accepted. Minutes from Fort Moore.', applyUrl: 'https://www.columbustech.edu/admissions/', siteUrl: 'https://www.columbustech.edu' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university in Montgomery, AL. Business, education, and liberal arts. Military-friendly campus.', applyUrl: 'https://www.aum.edu/admissions/', siteUrl: 'https://www.aum.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly public university with campus near Fort Moore. Business, criminal justice, and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Fort Eisenhower': [
    { name: 'Augusta University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Georgia public research university in Augusta. Medical, nursing, and cybersecurity programs. Strong ties to Fort Eisenhower.', applyUrl: 'https://www.augusta.edu/admissions/', siteUrl: 'https://www.augusta.edu' },
    { name: 'Augusta Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college with IT, healthcare, and welding programs. TA accepted. Located minutes from Fort Eisenhower.', applyUrl: 'https://www.augustatech.edu/admissions/', siteUrl: 'https://www.augustatech.edu' },
    { name: 'Paine College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Augusta, GA. Business, education, and humanities. Supportive veteran community and GI Bill accepted.', applyUrl: 'https://www.paine.edu/admissions/', siteUrl: 'https://www.paine.edu' },
    { name: 'University of South Carolina Aiken', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC system campus in Aiken, SC. Business, nursing, and education. Veteran-friendly with flexible scheduling.', applyUrl: 'https://www.usca.edu/admissions/', siteUrl: 'https://www.usca.edu' },
  ],
  'Fort Gregg-Adams': [
    { name: 'Virginia State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Petersburg, VA. Business, engineering technology, and education. Active veteran services and TA-eligible.', applyUrl: 'https://www.vsu.edu/admissions/', siteUrl: 'https://www.vsu.edu' },
    { name: 'Richard Bland College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'William & Mary-affiliated college in Petersburg. Transfer pathways to Virginia universities. Affordable and TA-eligible.', applyUrl: 'https://www.rbc.edu/admissions/', siteUrl: 'https://www.rbc.edu' },
    { name: 'Virginia Commonwealth University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Research university in Richmond. Arts, health sciences, and business. 25 minutes from Fort Gregg-Adams. Yellow Ribbon certified.', applyUrl: 'https://admissions.vcu.edu/', siteUrl: 'https://www.vcu.edu' },
    { name: 'John Tyler Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Gregg-Adams. Nursing, IT, and business programs. Transfer partner with VCU and other VA universities.', applyUrl: 'https://www.jtcc.edu/admissions/', siteUrl: 'https://www.jtcc.edu' },
  ],
  'Fort Knox': [
    { name: 'Elizabethtown Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'KCTCS college in Elizabethtown, KY. Healthcare, business, and skilled trades. TA accepted. Closest college to Fort Knox.', applyUrl: 'https://elizabethtown.kctcs.edu/admissions/', siteUrl: 'https://elizabethtown.kctcs.edu' },
    { name: 'University of Louisville', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Louisville, KY. Business, engineering, and health sciences. 45 minutes from Fort Knox. TA and GI Bill.', applyUrl: 'https://admissions.louisville.edu/apply/', siteUrl: 'https://www.louisville.edu' },
    { name: 'Western Kentucky University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Bowling Green. Business, nursing, and criminal justice. Military-friendly campus with veteran services.', applyUrl: 'https://www.wku.edu/admissions/apply/', siteUrl: 'https://www.wku.edu' },
    { name: 'Campbellsville University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Christian university in Campbellsville, KY. Business, education, and music. Yellow Ribbon participant. Veteran-friendly.', applyUrl: 'https://www.campbellsville.edu/admissions/', siteUrl: 'https://www.campbellsville.edu' },
  ],
  'Fort Jackson': [
    { name: 'University of South Carolina', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship research university in Columbia, SC. Business, engineering, and nursing. 10 minutes from Fort Jackson. TA and GI Bill accepted.', applyUrl: 'https://www.sc.edu/admissions/', siteUrl: 'https://www.sc.edu' },
    { name: 'Columbia International University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Faith-based university in Columbia. Biblical studies, counseling, and education. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.ciu.edu/admissions/', siteUrl: 'https://www.ciu.edu' },
    { name: 'Midlands Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college near Fort Jackson. Nursing, IT, and business programs. TA-eligible with strong transfer pathways.', applyUrl: 'https://www.midlandstech.edu/admissions/', siteUrl: 'https://www.midlandstech.edu' },
    { name: 'Benedict College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Columbia, SC. Business, computer science, and social work. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://www.benedict.edu/admissions/', siteUrl: 'https://www.benedict.edu' },
  ],
  'Fort Leonard Wood': [
    { name: 'Missouri University of Science & Technology', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Top-ranked engineering and science university in Rolla, MO. STEM-focused with strong research programs. TA and GI Bill accepted.', applyUrl: 'https://admissions.mst.edu/', siteUrl: 'https://www.mst.edu' },
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university with military-friendly programs. Business, education, and technology. Flexible online and in-person options.', applyUrl: 'https://www.ucmo.edu/admissions/', siteUrl: 'https://www.ucmo.edu' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture programs. TA accepted. Affordable tuition.', applyUrl: 'https://www.sfccmo.edu/admissions/', siteUrl: 'https://www.sfccmo.edu' },
    { name: 'Drury University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private liberal arts university in Springfield, MO. Architecture, business, and communication. Yellow Ribbon participant.', applyUrl: 'https://www.drury.edu/admissions/', siteUrl: 'https://www.drury.edu' },
  ],
  'Fort Wainwright': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's flagship research university in Fairbanks. Engineering, natural sciences, and business. Adjacent to Fort Wainwright. TA accepted.", applyUrl: 'https://admissions.uaf.edu/', siteUrl: 'https://www.uaf.edu' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'UAF branch campus with vocational and technical programs. Healthcare, trades, and business. TA-eligible and flexible scheduling.', applyUrl: 'https://ctc.uaf.edu/admissions/', siteUrl: 'https://ctc.uaf.edu' },
    { name: 'Alaska Bible College', type: 'Private', degree: '4-Year University', rating: 3.4, desc: 'Faith-based college in Palmer, AK. Biblical studies and Christian ministry. GI Bill accepted. Small, supportive campus community.', applyUrl: 'https://www.akbible.edu/admissions/', siteUrl: 'https://www.akbible.edu' },
  ],
  'Fort Novosel': [
    { name: 'Enterprise State Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Enterprise, AL. Business, healthcare, and aviation technology. TA accepted. Closest college to Fort Novosel.', applyUrl: 'https://www.escc.edu/admissions/', siteUrl: 'https://www.escc.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Fort Novosel. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university with strong business and education programs. Active veteran services. 75 miles from Fort Novosel.', applyUrl: 'https://www.aum.edu/admissions/', siteUrl: 'https://www.aum.edu' },
    { name: 'Wallace Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alabama community college in Dothan. Nursing, business, and skilled trades. TA-eligible with transfer pathways.', applyUrl: 'https://www.wallace.edu/admissions/', siteUrl: 'https://www.wallace.edu' },
  ],
  'Fort Leavenworth': [
    { name: 'University of Kansas', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship Kansas public university in Lawrence. Business, law, and engineering. 30 miles from Fort Leavenworth. TA and GI Bill accepted.', applyUrl: 'https://admissions.ku.edu/', siteUrl: 'https://www.ku.edu' },
    { name: 'Kansas City Kansas Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Leavenworth. Business, healthcare, and technology. TA-eligible with transfer pathways.', applyUrl: 'https://www.kckcc.edu/admissions/', siteUrl: 'https://www.kckcc.edu' },
    { name: 'Park University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly private university in Parkville, MO. Business administration and criminal justice. Flexible scheduling and TA accepted.', applyUrl: 'https://www.park.edu/admissions/', siteUrl: 'https://www.park.edu' },
    { name: 'Johnson County Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large community college in Overland Park, KS. Strong IT, business, and healthcare pathways. TA accepted. Transfer-friendly.', applyUrl: 'https://www.jccc.edu/admissions/', siteUrl: 'https://www.jccc.edu' },
  ],
  'Fort Hamilton': [
    { name: 'Brooklyn College CUNY', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CUNY campus in Brooklyn, NY. Liberal arts, business, and computer science. Affordable tuition and TA-eligible.', applyUrl: 'https://www.brooklyn.cuny.edu/web/admissions.php', siteUrl: 'https://www.brooklyn.cuny.edu' },
    { name: 'Kingsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'CUNY community college in Brooklyn. Healthcare, business, and culinary arts. TA accepted. Transfer pathway to CUNY four-year schools.', applyUrl: 'https://www.kbcc.cuny.edu/admissions/', siteUrl: 'https://www.kbcc.cuny.edu' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-renowned private research university in Manhattan. Business, law, and arts. Yellow Ribbon participant. Exceptional career network.', applyUrl: 'https://apply.nyu.edu/', siteUrl: 'https://www.nyu.edu' },
    { name: 'Touro University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Jewish-sponsored independent university in New York. Health sciences, education, and business. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.touro.edu/admissions/', siteUrl: 'https://www.touro.edu' },
  ],
  'West Point': [
    { name: 'SUNY New Paltz', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SUNY campus in New Paltz, NY. Fine arts, business, and education. Veteran-friendly with transfer pathways. TA and GI Bill accepted.', applyUrl: 'https://www.newpaltz.edu/admissions/', siteUrl: 'https://www.newpaltz.edu' },
    { name: 'Marist College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private college on the Hudson River in Poughkeepsie. Business, communication, and fashion design. Yellow Ribbon participant.', applyUrl: 'https://www.marist.edu/admissions/apply/', siteUrl: 'https://www.marist.edu' },
    { name: 'Orange County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'SUNY community college in Middletown, NY. Business, healthcare, and technology programs. TA-eligible and affordable.', applyUrl: 'https://www.sunyorange.edu/admissions/', siteUrl: 'https://www.sunyorange.edu' },
    { name: 'Vassar College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college in Poughkeepsie. Exceptional academics. Yellow Ribbon participant.', applyUrl: 'https://admissions.vassar.edu/', siteUrl: 'https://www.vassar.edu' },
  ],
  'Fort Myer': [
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university in Fairfax. Cybersecurity, engineering, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: 'https://admissions.gmu.edu/', siteUrl: 'https://www.gmu.edu' },
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia. IT, healthcare, and business. TA accepted. Strong transfer pathway to GMU.', applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
    { name: 'Georgetown University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Elite Jesuit research university in DC. Law, international affairs, and medicine. Yellow Ribbon certified. Exceptional career network.', applyUrl: 'https://uadmissions.georgetown.edu/', siteUrl: 'https://www.georgetown.edu' },
  ],
  'Fort Richardson': [
    { name: 'University of Alaska Anchorage', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's largest university adjacent to Joint Base Elmendorf-Richardson. Nursing, engineering, and business. TA and GI Bill accepted.", applyUrl: 'https://www.uaa.alaska.edu/admissions/', siteUrl: 'https://www.uaa.alaska.edu' },
    { name: 'Alaska Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Small private university in Anchorage. Business, outdoor studies, and liberal arts. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://alaskapacific.edu/admissions/', siteUrl: 'https://alaskapacific.edu' },
    { name: 'Charter College', type: 'Private', degree: '2-Year College', rating: 3.4, desc: 'Career-focused college with healthcare, business, and legal programs. Flexible online options for military families. GI Bill accepted.', applyUrl: 'https://www.chartercollege.edu/admissions/', siteUrl: 'https://www.chartercollege.edu' },
  ],
  'Fort Shafter': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university in Honolulu. Business, engineering, and tropical agriculture. TA and GI Bill accepted.", applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in downtown Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Honolulu. Technical and vocational programs including automotive, diesel, and culinary arts. TA accepted.', applyUrl: 'https://www.honolulu.hawaii.edu/admissions/', siteUrl: 'https://www.honolulu.hawaii.edu' },
  ],
  // ── CONUS Navy ───────────────────────────────────────────────────────────────
  'Naval Base San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus in San Diego. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: 'https://admissions.sdsu.edu/', siteUrl: 'https://www.sdsu.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified. World-class faculty.', applyUrl: 'https://admissions.ucsd.edu/', siteUrl: 'https://www.ucsd.edu' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in downtown San Diego. Business, IT, and public safety programs. TA-eligible. Strong transfer pathway to SDSU and UC.', applyUrl: 'https://www.sdcity.edu/admissions/', siteUrl: 'https://www.sdcity.edu' },
    { name: 'Point Loma Nazarene University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university overlooking San Diego Bay. Nursing, business, and kinesiology. Yellow Ribbon participant.', applyUrl: 'https://www.pointloma.edu/admissions/', siteUrl: 'https://www.pointloma.edu' },
  ],
  'Naval Station Mayport': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.ju.edu/admissions/', siteUrl: 'https://www.ju.edu' },
    { name: 'Edward Waters University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Historic HBCU in Jacksonville. Business, criminal justice, and mass communications. Veteran-friendly community. GI Bill accepted.', applyUrl: 'https://www.ewu.edu/admissions/', siteUrl: 'https://www.ewu.edu' },
  ],
  'NAS Pensacola': [
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uwf.edu/admissions/', siteUrl: 'https://www.uwf.edu' },
    { name: 'Pensacola State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college near NAS Pensacola. Nursing, aviation maintenance, and business. TA-eligible. Strong transfer pathway to UWF.', applyUrl: 'https://www.pensacolastate.edu/admissions/', siteUrl: 'https://www.pensacolastate.edu' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'World-renowned aviation university in Daytona Beach. Aviation science, aerospace engineering, and flight. Yellow Ribbon participant.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
    { name: 'University of South Alabama', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Research university in Mobile, AL. Medical, nursing, and engineering programs. 60 miles from NAS Pensacola. TA and GI Bill accepted.', applyUrl: 'https://www.southalabama.edu/departments/admissions/', siteUrl: 'https://www.southalabama.edu' },
  ],
  'Naval Base Kitsap': [
    { name: 'Olympic College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Bremerton adjacent to Naval Base Kitsap. Business, healthcare, and IT. TA accepted. Strong veteran services.', applyUrl: 'https://www.olympic.edu/admissions/', siteUrl: 'https://www.olympic.edu' },
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public research university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified. Exceptional faculty.', applyUrl: 'https://admit.washington.edu/', siteUrl: 'https://www.washington.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham. Business, education, and environmental sciences. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Lutheran university in Tacoma. Nursing, business, and education programs. Yellow Ribbon participant. Active military community.', applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
  ],
  'NAS Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.ju.edu/admissions/', siteUrl: 'https://www.ju.edu' },
    { name: 'Florida Coastal School of Law', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Law school in Jacksonville offering JD and hybrid programs. Veteran-friendly campus. GI Bill and Yellow Ribbon accepted.', applyUrl: 'https://www.fcsl.edu/admission/', siteUrl: 'https://www.fcsl.edu' },
  ],
  'Naval Base Ventura County': [
    { name: 'CSU Channel Islands', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'California State campus in Camarillo near NBVC. Business, education, and nursing. TA and GI Bill accepted. Veteran-friendly.', applyUrl: 'https://www.csuci.edu/admissions/', siteUrl: 'https://www.csuci.edu' },
    { name: 'Ventura College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Ventura, CA. Business, healthcare, and computer information systems. TA-eligible. Transfer pathways to CSU and UC.', applyUrl: 'https://www.venturacollege.edu/admissions/', siteUrl: 'https://www.venturacollege.edu' },
    { name: 'UC Santa Barbara', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus near NBVC. Engineering, business economics, and sciences. Yellow Ribbon certified. World-class research.', applyUrl: 'https://admissions.ucsb.edu/', siteUrl: 'https://www.ucsb.edu' },
    { name: 'Cal Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private Lutheran university in Thousand Oaks. Business, education, and psychology. Yellow Ribbon participant. Military scholarships available.', applyUrl: 'https://www.callutheran.edu/admissions/', siteUrl: 'https://www.callutheran.edu' },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 15 minutes from JBPHH.", applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with Pearl Harbor campus and downtown Honolulu campus. Business, nursing, and military studies. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH system college in Pearl City, adjacent to JBPHH. Business, healthcare, and liberal arts. TA accepted. Strong transfer pathways.', applyUrl: 'https://www.leeward.hawaii.edu/admissions', siteUrl: 'https://www.leeward.hawaii.edu' },
    { name: 'Chaminade University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic Marianist university in Honolulu. Criminal justice, business, and nursing. Military-friendly. Yellow Ribbon certified.', applyUrl: 'https://www.chaminade.edu/admissions/', siteUrl: 'https://www.chaminade.edu' },
  ],
  'NAS Whidbey Island': [
    { name: 'Skagit Valley College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving Whidbey Island and Skagit Valley. Business, healthcare, and trades. TA-eligible. Closest college to NAS Whidbey.', applyUrl: 'https://www.skagit.edu/admissions/', siteUrl: 'https://www.skagit.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 40 miles from NAS Whidbey. Business, education, and environmental studies. TA and GI Bill accepted.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus in Bothell. Business, nursing, and computer science. Veteran-friendly with TA and GI Bill accepted.', applyUrl: 'https://www.uwb.edu/admissions/', siteUrl: 'https://www.uwb.edu' },
  ],
  'Naval Station Everett': [
    { name: 'Everett Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Everett, WA. Business, healthcare, and engineering technology. TA accepted. Adjacent to Naval Station Everett.', applyUrl: 'https://www.everettcc.edu/admissions/', siteUrl: 'https://www.everettcc.edu' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus 20 miles south. Business, nursing, and computer science. TA and GI Bill accepted.', applyUrl: 'https://www.uwb.edu/admissions/', siteUrl: 'https://www.uwb.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 30 miles north. Business, education, and environmental studies. Military-friendly campus.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
  ],
  'NAS Corpus Christi': [
    { name: 'Texas A&M University Corpus Christi', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'A&M system university on the island. Business, nursing, and marine sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.tamucc.edu/admissions/', siteUrl: 'https://www.tamucc.edu' },
    { name: 'Del Mar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Corpus Christi. Healthcare, business, and culinary arts. TA-eligible. Transfer pathways to A&M Corpus Christi.', applyUrl: 'https://www.delmar.edu/admissions/', siteUrl: 'https://www.delmar.edu' },
  ],
  'NAS Oceana': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Norfolk, VA. Dedicated military center, engineering, and business. TA and GI Bill accepted.', applyUrl: 'https://www.odu.edu/apply', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads including Virginia Beach. Nursing, IT, and business. TA-eligible. Transfer partner with ODU.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus. Military tuition discount.', applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://www.nsu.edu/admissions/apply', siteUrl: 'https://www.nsu.edu' },
  ],
  // ── CONUS Marine Corps ───────────────────────────────────────────────────────
  'MCAS Cherry Point': [
    { name: 'Craven Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in New Bern, NC. Healthcare, business, and technology. TA accepted. Closest college to MCAS Cherry Point.', applyUrl: 'https://www.cravencc.edu/admissions/', siteUrl: 'https://www.cravencc.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
    { name: 'UNC Wilmington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'UNC system campus on the coast. Marine biology, business, and nursing. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://admissions.uncw.edu/', siteUrl: 'https://www.uncw.edu' },
    { name: 'Carteret Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Small community college in Morehead City, NC. Marine technology and business programs. TA-eligible. Coastal focus.', applyUrl: 'https://www.carteret.edu/admissions/', siteUrl: 'https://www.carteret.edu' },
  ],
  'MCAS Miramar': [
    { name: 'San Diego Miramar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to MCAS Miramar. Aviation, business, and IT programs. TA-eligible. Strong transfer pathway.', applyUrl: 'https://www.sdmiramar.edu/admissions/', siteUrl: 'https://www.sdmiramar.edu' },
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus near MCAS Miramar. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: 'https://admissions.sdsu.edu/', siteUrl: 'https://www.sdsu.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: 'https://admissions.ucsd.edu/', siteUrl: 'https://www.ucsd.edu' },
    { name: 'National University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Nonprofit private university serving adult learners. Business, education, and IT. Month-by-month enrollment. GI Bill accepted.', applyUrl: 'https://www.nu.edu/admissions/', siteUrl: 'https://www.nu.edu' },
  ],
  'MCB Quantico': [
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia with Manassas campus near Quantico. IT, healthcare, and business. TA accepted.', applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university. Cybersecurity, law, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: 'https://admissions.gmu.edu/', siteUrl: 'https://www.gmu.edu' },
    { name: 'Virginia Tech', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Top-ranked public research university. Engineering, architecture, and business. Yellow Ribbon participant. 75 miles from Quantico.', applyUrl: 'https://admissions.vt.edu/apply.html', siteUrl: 'https://www.vt.edu' },
    { name: 'University of Mary Washington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university in Fredericksburg. Business, computer science, and education. 15 miles from MCB Quantico.', applyUrl: 'https://admissions.umw.edu/apply/', siteUrl: 'https://www.umw.edu' },
  ],
  'MCAS New River': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Primary college for Jacksonville, NC military community. On-post classes available. TA accepted. Healthcare and IT programs.', applyUrl: 'https://www.coastalcarolina.edu/admissions/how-to-apply/', siteUrl: 'https://www.coastalcarolina.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville. Nursing, business, and engineering. 1 hour from MCAS New River. TA and GI Bill accepted.', applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with Jacksonville campus near MCAS New River. Business, criminal justice, and education.', applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
  ],
  'MCB Hawaii Kaneohe Bay': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 20 minutes from MCB Hawaii.", applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Windward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Kaneohe, adjacent to MCB Hawaii. Liberal arts, science, and healthcare pathways. TA accepted.', applyUrl: 'https://www.windward.hawaii.edu/admissions/', siteUrl: 'https://www.windward.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant. GI Bill accepted.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
  ],
  'MCAS Yuma': [
    { name: 'Arizona Western College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Yuma adjacent to MCAS Yuma. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.azwestern.edu/admissions/', siteUrl: 'https://www.azwestern.edu' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with online programs accessible from Yuma. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: 'https://nau.edu/admissions/', siteUrl: 'https://nau.edu' },
    { name: 'Arizona State University Online', type: 'Public', degree: '4-Year University', rating: 4.0, desc: '#1 US News innovation university with fully online programs. Business, engineering, and computer science. Excellent military support and TA eligible.', applyUrl: 'https://admission.asu.edu/online/', siteUrl: 'https://asuonline.asu.edu' },
  ],
  'MCAS Beaufort': [
    { name: 'Technical College of the Lowcountry', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Beaufort, SC. Healthcare, business, and technology. TA-eligible. Closest college to MCAS Beaufort.', applyUrl: 'https://www.tcl.edu/admissions/', siteUrl: 'https://www.tcl.edu' },
    { name: 'University of South Carolina Beaufort', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC campus in Beaufort. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uscb.edu/admissions/', siteUrl: 'https://www.uscb.edu' },
    { name: 'Coastal Carolina University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Conway, SC. Business, education, and marine science. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://www.coastal.edu/admissions/', siteUrl: 'https://www.coastal.edu' },
  ],
  // ── CONUS Air Force / Space Force ────────────────────────────────────────────
  'Joint Base Langley-Eustis': [
    { name: 'Hampton University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Historic HBCU in Hampton, VA. Business, nursing, and engineering. Adjacent to JBLE. Yellow Ribbon certified. Strong veteran services.', applyUrl: 'https://www.hamptonu.edu/admissions/', siteUrl: 'https://www.hamptonu.edu' },
    { name: 'Thomas Nelson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Hampton. Business, healthcare, and technology programs. TA-eligible. Transfer pathways to ODU and other VA schools.', applyUrl: 'https://www.tncc.edu/admissions/', siteUrl: 'https://www.tncc.edu' },
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Research university in Norfolk. Engineering, business, and education. Dedicated military center. TA and GI Bill accepted.', applyUrl: 'https://www.odu.edu/apply', siteUrl: 'https://www.odu.edu' },
    { name: 'Christopher Newport University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public liberal arts university in Newport News. Business, leadership, and science. Veteran-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://admissions.cnu.edu/', siteUrl: 'https://www.cnu.edu' },
  ],
  'Eglin AFB': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville adjacent to Eglin AFB. Business, healthcare, and professional programs. TA-eligible.', applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uwf.edu/admissions/', siteUrl: 'https://www.uwf.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Eglin AFB. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base classes at Eglin. Popular with Air Force members. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'MacDill AFB': [
    { name: 'University of Tampa', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Private university in downtown Tampa. Business, nursing, and international business. Yellow Ribbon participant. Minutes from MacDill AFB.', applyUrl: 'https://www.ut.edu/admissions/', siteUrl: 'https://www.ut.edu' },
    { name: 'Hillsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in Tampa. Healthcare, IT, and business. TA-eligible. Strong transfer pathway to USF and UT.', applyUrl: 'https://www.hccfl.edu/admissions/', siteUrl: 'https://www.hccfl.edu' },
    { name: 'University of South Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Tampa. Engineering, medicine, and business. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.usf.edu/admissions/', siteUrl: 'https://www.usf.edu' },
    { name: 'Eckerd College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private liberal arts college in St. Petersburg. Marine science, business, and psychology. Yellow Ribbon certified. Waterfront campus.', applyUrl: 'https://www.eckerd.edu/admissions/', siteUrl: 'https://www.eckerd.edu' },
  ],
  'Tyndall AFB': [
    { name: 'Gulf Coast State College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'State college in Panama City, FL. Business, healthcare, and technology programs. TA-eligible. Closest college to Tyndall AFB.', applyUrl: 'https://www.gulfcoast.edu/admissions/', siteUrl: 'https://www.gulfcoast.edu' },
    { name: 'FSU Panama City', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Florida State University branch campus in Panama City. Business, computer science, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://pc.fsu.edu/admissions/', siteUrl: 'https://pc.fsu.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus serving the Tyndall area. Business, criminal justice, and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Barksdale AFB': [
    { name: 'Bossier Parish Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to Barksdale AFB. Healthcare, business, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.bpcc.edu/admissions/', siteUrl: 'https://www.bpcc.edu' },
    { name: 'Louisiana Tech University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Ruston, LA. Engineering, business, and computer science. 30 miles from Barksdale. TA and GI Bill accepted.', applyUrl: 'https://admissions.latech.edu/', siteUrl: 'https://www.latech.edu' },
    { name: 'Centenary College', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private liberal arts college in Shreveport. Business, education, and natural sciences. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.centenary.edu/admission/', siteUrl: 'https://www.centenary.edu' },
    { name: 'LSU Shreveport', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'LSU system campus in Shreveport. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.lsus.edu/admissions/', siteUrl: 'https://www.lsus.edu' },
  ],
  'Tinker AFB': [
    { name: 'Rose State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Midwest City adjacent to Tinker AFB. IT, aviation maintenance, and healthcare. TA-eligible.', applyUrl: 'https://www.rose.edu/admissions/', siteUrl: 'https://www.rose.edu' },
    { name: 'University of Central Oklahoma', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Edmond, OK. Business, education, and forensic science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uco.edu/admissions/', siteUrl: 'https://www.uco.edu' },
    { name: 'Oklahoma State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Oklahoma land-grant university. Engineering, business, and agriculture. Strong research programs. TA and GI Bill accepted.', applyUrl: 'https://admissions.okstate.edu/', siteUrl: 'https://www.okstate.edu' },
    { name: 'Southern Nazarene University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Bethany, OK. Business, education, and nursing. Yellow Ribbon participant. Military-friendly community.', applyUrl: 'https://www.snu.edu/admissions/', siteUrl: 'https://www.snu.edu' },
  ],
  'Offutt AFB': [
    { name: 'Bellevue University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Military-friendly private university adjacent to Offutt AFB. Business, IT, and cybersecurity. TA and GI Bill accepted. Flexible scheduling.', applyUrl: 'https://www.bellevue.edu/admissions/', siteUrl: 'https://www.bellevue.edu' },
    { name: 'Metropolitan Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Omaha. IT, healthcare, and business. TA-eligible. Strong transfer pathways to UNO and Creighton.', applyUrl: 'https://www.mccneb.edu/admissions/', siteUrl: 'https://www.mccneb.edu' },
    { name: 'University of Nebraska Omaha', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Omaha. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unomaha.edu/admissions/', siteUrl: 'https://www.unomaha.edu' },
    { name: 'Creighton University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Omaha. Medicine, law, and business. Yellow Ribbon participant. Excellent healthcare programs.', applyUrl: 'https://admissions.creighton.edu/', siteUrl: 'https://www.creighton.edu' },
  ],
  'Whiteman AFB': [
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Warrensburg, MO. Business, education, and aviation. Active veteran services. 15 minutes from Whiteman AFB.', applyUrl: 'https://www.ucmo.edu/admissions/', siteUrl: 'https://www.ucmo.edu' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture. TA-eligible. Affordable and convenient.', applyUrl: 'https://www.sfccmo.edu/admissions/', siteUrl: 'https://www.sfccmo.edu' },
    { name: 'Missouri S&T', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Missouri University of Science & Technology. Top-ranked STEM programs. Engineering and computer science. TA and GI Bill accepted.', applyUrl: 'https://admissions.mst.edu/', siteUrl: 'https://www.mst.edu' },
  ],
  'Scott AFB': [
    { name: 'McKendree University', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private university in Lebanon, IL. Business, nursing, and education. Yellow Ribbon participant. Minutes from Scott AFB.', applyUrl: 'https://www.mckendree.edu/admissions/', siteUrl: 'https://www.mckendree.edu' },
    { name: 'Southwestern Illinois College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving metro-east Illinois. Business, healthcare, and technology. TA-eligible. Strong transfer pathways.', applyUrl: 'https://www.swic.edu/admissions/', siteUrl: 'https://www.swic.edu' },
    { name: 'Southern Illinois University Edwardsville', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SIU campus near Scott AFB. Business, engineering, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.siue.edu/admissions/', siteUrl: 'https://www.siue.edu' },
    { name: 'Lindenwood University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in St. Charles, MO. Business, communications, and education. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.lindenwood.edu/admissions/', siteUrl: 'https://www.lindenwood.edu' },
  ],
  'Wright-Patterson AFB': [
    { name: 'Wright State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university adjacent to Wright-Patterson AFB. Engineering, business, and medicine. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.wright.edu/', siteUrl: 'https://www.wright.edu' },
    { name: 'Sinclair Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Dayton. Aviation technology, IT, and healthcare. TA-eligible. Transfer pathways to WSU. Strong military support.', applyUrl: 'https://www.sinclair.edu/admissions/', siteUrl: 'https://www.sinclair.edu' },
    { name: 'University of Dayton', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Catholic research university in Dayton. Engineering, law, and business. Yellow Ribbon participant. Close to Wright-Patterson.', applyUrl: 'https://udayton.edu/admission/', siteUrl: 'https://udayton.edu' },
    { name: 'Air Force Institute of Technology', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Graduate school of engineering and management on Wright-Patterson AFB. STEM graduate degrees exclusively for military. Free for eligible service members.', applyUrl: 'https://www.afit.edu/registrar/admission/', siteUrl: 'https://www.afit.edu' },
  ],
  'Joint Base Andrews': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Andrews. Engineering, business, and cybersecurity. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.umd.edu/apply', siteUrl: 'https://www.umd.edu' },
    { name: "Prince George's Community College", type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college near Joint Base Andrews. Healthcare, IT, and business. TA-eligible. Transfer pathways to UMD and other MD schools.', applyUrl: 'https://www.pgcc.edu/admissions/', siteUrl: 'https://www.pgcc.edu' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
    { name: 'Bowie State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Bowie, MD. Business, computer science, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.bowiestate.edu/admissions/', siteUrl: 'https://www.bowiestate.edu' },
  ],
  'Nellis AFB': [
    { name: 'College of Southern Nevada', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Las Vegas. Business, healthcare, and culinary arts. TA-eligible. Closest college to Nellis AFB.', applyUrl: 'https://www.csn.edu/admissions/', siteUrl: 'https://www.csn.edu' },
    { name: 'University of Nevada Las Vegas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Las Vegas. Business, hospitality, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unlv.edu/admissions/', siteUrl: 'https://www.unlv.edu' },
    { name: 'Nevada State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Henderson, NV. Business, education, and nursing. Military-friendly with flexible scheduling. TA and GI Bill accepted.', applyUrl: 'https://nsu.nevada.edu/admissions/', siteUrl: 'https://nsu.nevada.edu' },
    { name: 'Touro University Nevada', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private health sciences university in Henderson. Healthcare and business programs. GI Bill accepted. Military-friendly.', applyUrl: 'https://www.tun.touro.edu/admissions/', siteUrl: 'https://www.tun.touro.edu' },
  ],
  'Travis AFB': [
    { name: 'Solano Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Fairfield adjacent to Travis AFB. Business, healthcare, and aviation. TA-eligible. Closest college to base.', applyUrl: 'https://www.solano.edu/admissions/', siteUrl: 'https://www.solano.edu' },
    { name: 'UC Davis', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Davis. Veterinary medicine, engineering, and business. Yellow Ribbon certified. 25 miles from Travis AFB.', applyUrl: 'https://admissions.ucdavis.edu/', siteUrl: 'https://www.ucdavis.edu' },
    { name: 'California State University Sacramento', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Sacramento. Business, criminal justice, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.csus.edu/admissions/', siteUrl: 'https://www.csus.edu' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo, near Travis AFB. Osteopathic medicine, pharmacy, and public health. GI Bill accepted.', applyUrl: 'https://www.tu.edu/admissions/', siteUrl: 'https://www.tu.edu' },
  ],
  'Edwards AFB': [
    { name: 'Antelope Valley College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Lancaster, CA near Edwards AFB. Aerospace, business, and healthcare. TA-eligible. Strong aviation programs.', applyUrl: 'https://www.avc.edu/admissions/', siteUrl: 'https://www.avc.edu' },
    { name: 'Cal State San Bernardino', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus with business, education, and nursing programs. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.csusb.edu/admissions/', siteUrl: 'https://www.csusb.edu' },
    { name: 'California State University Mojave', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'CSU satellite programs serving the high desert community near Edwards AFB. Business and education. TA and GI Bill accepted.', applyUrl: 'https://www.csub.edu/admissions/', siteUrl: 'https://www.csub.edu' },
  ],
  'Keesler AFB': [
    { name: 'Mississippi Gulf Coast Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Biloxi adjacent to Keesler AFB. IT, healthcare, and business. TA-eligible. Excellent transfer pathways.', applyUrl: 'https://www.mgccc.edu/admissions/', siteUrl: 'https://www.mgccc.edu' },
    { name: 'University of Southern Mississippi', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public research university in Hattiesburg. Business, nursing, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.usm.edu/admissions/', siteUrl: 'https://www.usm.edu' },
    { name: 'William Carey University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Hattiesburg. Nursing, education, and business. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.wmcarey.edu/admissions/', siteUrl: 'https://www.wmcarey.edu' },
  ],
  'Little Rock AFB': [
    { name: 'University of Arkansas at Little Rock', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'UA system campus in Little Rock. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://ualr.edu/admissions/', siteUrl: 'https://ualr.edu' },
    { name: 'Pulaski Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in North Little Rock near the air base. Healthcare, IT, and business. TA-eligible. Affordable tuition.', applyUrl: 'https://www.pulaskitech.edu/admissions/', siteUrl: 'https://www.pulaskitech.edu' },
    { name: 'Hendrix College', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly regarded private liberal arts college in Conway, AR. Sciences, business, and humanities. Yellow Ribbon participant.', applyUrl: 'https://www.hendrix.edu/admissions/', siteUrl: 'https://www.hendrix.edu' },
  ],
  'Dyess AFB': [
    { name: 'Hardin-Simmons University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Abilene. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.hsutx.edu/admissions/', siteUrl: 'https://www.hsutx.edu' },
    { name: 'McMurry University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Methodist university in Abilene. Business, education, and nursing. GI Bill accepted. Small campus with strong faculty.', applyUrl: 'https://www.mcm.edu/admissions/', siteUrl: 'https://www.mcm.edu' },
    { name: 'Cisco College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Cisco, TX. Agriculture, business, and vocational programs. TA-eligible. Affordable community college option.', applyUrl: 'https://www.cisco.edu/admissions/', siteUrl: 'https://www.cisco.edu' },
    { name: 'Abilene Christian University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university in Abilene. Theology, business, and sciences. Yellow Ribbon participant. Active military community.', applyUrl: 'https://www.acu.edu/admissions/', siteUrl: 'https://www.acu.edu' },
  ],
  'Luke AFB': [
    { name: 'Glendale Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Maricopa community college adjacent to Luke AFB. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.glendale.edu/admissions/', siteUrl: 'https://www.glendale.edu' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Nation\'s #1 innovation university. Business, engineering, and health sciences. Enormous online program. TA and GI Bill accepted.', applyUrl: 'https://admission.asu.edu/', siteUrl: 'https://www.asu.edu' },
    { name: 'Grand Canyon University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Phoenix. Business, education, and nursing. Military-friendly with Yellow Ribbon. Extensive online programs.', applyUrl: 'https://www.gcu.edu/admissions/', siteUrl: 'https://www.gcu.edu' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with extensive online programs. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: 'https://nau.edu/admissions/', siteUrl: 'https://nau.edu' },
  ],
  'Davis-Monthan AFB': [
    { name: 'Pima Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Tucson. Business, healthcare, and aviation maintenance. TA-eligible. Closest community college to Davis-Monthan.', applyUrl: 'https://www.pima.edu/admissions/', siteUrl: 'https://www.pima.edu' },
    { name: 'University of Arizona', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Flagship Arizona public research university. Engineering, medicine, and business. Yellow Ribbon certified. 10 minutes from base.', applyUrl: 'https://admissions.arizona.edu/', siteUrl: 'https://www.arizona.edu' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "#1 US innovation university. Massive online program for military. Business, engineering, and health sciences. TA and GI Bill accepted.", applyUrl: 'https://admission.asu.edu/', siteUrl: 'https://www.asu.edu' },
    { name: 'Cochise College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sierra Vista, AZ near Fort Huachuca. Business, healthcare, and public safety. TA-eligible.', applyUrl: 'https://www.cochise.edu/admissions/', siteUrl: 'https://www.cochise.edu' },
  ],
  'Fairchild AFB': [
    { name: 'Eastern Washington University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Cheney, WA adjacent to Fairchild AFB. Business, education, and dental hygiene. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.ewu.edu/', siteUrl: 'https://www.ewu.edu' },
    { name: 'Gonzaga University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Spokane. Business, law, and nursing. Yellow Ribbon participant. Excellent academic reputation.', applyUrl: 'https://www.gonzaga.edu/admissions/', siteUrl: 'https://www.gonzaga.edu' },
    { name: 'Washington State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Flagship Washington land-grant university in Pullman. Engineering, veterinary medicine, and business. TA and GI Bill accepted.', applyUrl: 'https://admissions.wsu.edu/', siteUrl: 'https://www.wsu.edu' },
    { name: 'Spokane Falls Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Spokane. Business, IT, and healthcare. TA-eligible. Strong transfer pathways to EWU and WSU.', applyUrl: 'https://www.spokanefalls.edu/admissions/', siteUrl: 'https://www.spokanefalls.edu' },
  ],
  'Hill AFB': [
    { name: 'Weber State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Ogden adjacent to Hill AFB. Business, engineering technology, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.weber.edu/admissions/', siteUrl: 'https://www.weber.edu' },
    { name: 'Utah State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Utah land-grant research university in Logan. Engineering, business, and agriculture. Strong online programs. TA and GI Bill accepted.', applyUrl: 'https://www.usu.edu/admissions/', siteUrl: 'https://www.usu.edu' },
    { name: 'Ogden-Weber Applied Technology College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Applied technology college in Ogden. Skilled trades, healthcare, and IT certifications. TA-eligible. Excellent for vocational training.', applyUrl: 'https://www.owatc.edu/admissions/', siteUrl: 'https://www.owatc.edu' },
    { name: 'Brigham Young University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private LDS university in Provo. Business, engineering, and law. Low tuition and Yellow Ribbon participant.', applyUrl: 'https://admissions.byu.edu/', siteUrl: 'https://www.byu.edu' },
  ],
  'Minot AFB': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Minot, ND near the air base. Business, education, and criminal justice. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.minotstateu.edu/admissions/', siteUrl: 'https://www.minotstateu.edu' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Community college in Bottineau, ND. Agriculture, business, and health programs. TA-eligible. Affordable rural community college.', applyUrl: 'https://www.dakotacollege.edu/admissions/', siteUrl: 'https://www.dakotacollege.edu' },
    { name: 'University of Mary', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic university in Bismarck, ND. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.umary.edu/admissions/', siteUrl: 'https://www.umary.edu' },
  ],
  'Malmstrom AFB': [
    { name: 'University of Providence', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic university in Great Falls, MT. Business, nursing, and education. Yellow Ribbon participant. Minutes from Malmstrom AFB.', applyUrl: 'https://www.uprovidence.edu/admissions/', siteUrl: 'https://www.uprovidence.edu' },
    { name: 'Montana State University Great Falls', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'MSU college of technology in Great Falls. Business, healthcare, and trades. TA-eligible. Closest public college to Malmstrom.', applyUrl: 'https://www.msubillings.edu/greatfalls/admissions/', siteUrl: 'https://www.msubillings.edu/greatfalls/' },
    { name: 'Montana State University Bozeman', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Montana research university. Engineering, agriculture, and business. Strong online programs. TA and GI Bill accepted.', applyUrl: 'https://www.montana.edu/admissions/', siteUrl: 'https://www.montana.edu' },
  ],
  'Ellsworth AFB': [
    { name: 'Western Dakota Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Rapid City near Ellsworth AFB. Skilled trades, healthcare, and IT. TA-eligible. Excellent vocational programs.', applyUrl: 'https://www.wdt.edu/admissions/', siteUrl: 'https://www.wdt.edu' },
    { name: 'South Dakota School of Mines', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Engineering-focused public university in Rapid City. Highly ranked STEM programs. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.sdsmt.edu/admissions/', siteUrl: 'https://www.sdsmt.edu' },
    { name: 'Mount Marty University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic Benedictine university in Yankton, SD. Healthcare, business, and education. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.mountmarty.edu/admissions/', siteUrl: 'https://www.mountmarty.edu' },
  ],
  'Hurlburt Field': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville, FL near Hurlburt Field. Business, healthcare, and professional programs. TA-eligible.', applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uwf.edu/admissions/', siteUrl: 'https://www.uwf.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Hurlburt Field. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Moody AFB': [
    { name: 'Valdosta State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Valdosta, GA near Moody AFB. Business, nursing, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.valdosta.edu/admissions/', siteUrl: 'https://www.valdosta.edu' },
    { name: 'South Georgia Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Americus, GA. Healthcare, business, and technology. TA-eligible. Strong workforce training programs.', applyUrl: 'https://www.southgatech.edu/admissions/', siteUrl: 'https://www.southgatech.edu' },
    { name: 'Abraham Baldwin Agricultural College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Georgia public college in Tifton. Agriculture, business, and science programs. TA-eligible. Transfer pathway to UGA and GA Tech.', applyUrl: 'https://www.abac.edu/admissions/', siteUrl: 'https://www.abac.edu' },
  ],
  'Shaw AFB': [
    { name: 'Central Carolina Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in Sumter, SC adjacent to Shaw AFB. Healthcare, IT, and business. TA-eligible. Closest college to base.', applyUrl: 'https://www.cctech.edu/admissions/', siteUrl: 'https://www.cctech.edu' },
    { name: 'University of South Carolina Sumter', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'USC campus in Sumter. Business, liberal arts, and natural sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uscsumter.edu/admissions/', siteUrl: 'https://www.uscsumter.edu' },
    { name: 'Columbia College', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private liberal arts college in Columbia, SC. Business, education, and music. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.columbiasc.edu/admissions/', siteUrl: 'https://www.columbiasc.edu' },
  ],
  'Seymour Johnson AFB': [
    { name: 'Wayne Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Goldsboro, NC adjacent to Seymour Johnson AFB. Business, healthcare, and IT. TA-eligible.', applyUrl: 'https://www.waynecc.edu/admissions/', siteUrl: 'https://www.waynecc.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. 30 miles from base.', applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
    { name: 'Mount Olive University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university near Seymour Johnson. Business, criminal justice, and education. GI Bill accepted.', applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
  ],
  'Joint Base San Antonio': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science. Active veteran services and military tuition discounts.', applyUrl: 'https://admissions.utsa.edu/', siteUrl: 'https://www.utsa.edu' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts. TA accepted. Low tuition.', applyUrl: 'https://www.alamo.edu/spc/admissions/', siteUrl: 'https://www.alamo.edu/spc/' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university in San Antonio. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: 'https://www.trinity.edu/admissions/apply', siteUrl: 'https://www.trinity.edu' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: 'https://www.alamo.edu/sac/admissions/', siteUrl: 'https://www.alamo.edu/sac/' },
  ],
  'Buckley SFB': [
    { name: 'University of Colorado Denver', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Denver. Business, engineering, and health sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.ucdenver.edu/admissions/', siteUrl: 'https://www.ucdenver.edu' },
    { name: 'Community College of Denver', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Denver. Healthcare, business, and technology. TA-eligible. Transfer pathways to CU Denver and MSU Denver.', applyUrl: 'https://www.ccd.edu/admissions/', siteUrl: 'https://www.ccd.edu' },
    { name: 'Metropolitan State University of Denver', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in downtown Denver. Business, education, and aviation. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.msudenver.edu/admissions/', siteUrl: 'https://www.msudenver.edu' },
  ],
  'Schriever SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Colorado Springs. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: 'https://www.uccs.edu/admissions/apply', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: 'https://www.ppsc.edu/admissions/apply/', siteUrl: 'https://www.ppsc.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  'Peterson SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus near Peterson SFB. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: 'https://www.uccs.edu/admissions/apply', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, IT, and business. TA accepted.', applyUrl: 'https://www.ppsc.edu/admissions/apply/', siteUrl: 'https://www.ppsc.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  // ── OCONUS ───────────────────────────────────────────────────────────────────
  'Osan Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'University of Maryland Global Campus Asia. On-base classes at Osan AB. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs available at Osan AB. Online with on-base support. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Camp Walker': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Camp Walker. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Camp Carroll': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Carroll. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'USAG Yongsan': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at USAG Yongsan/Seoul. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at USAG Yongsan. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Camp Zama': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Zama, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at Camp Zama. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Misawa Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Misawa Air Base, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degrees and certificates. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs at Misawa AB. Online with on-base support sessions. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Naval Air Facility Atsugi': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at NAF Atsugi, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'MCAS Iwakuni': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at MCAS Iwakuni, Japan. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at MCAS Iwakuni. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Spangdahlem Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Spangdahlem AB, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU residential campus in Europe. Aviation management and aerospace engineering. Available near Spangdahlem.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'USAG Wiesbaden': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Wiesbaden, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU courses available at Wiesbaden. Aviation management and aerospace programs. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes at Wiesbaden. Business and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'USAG Grafenwöhr': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Grafenwöhr. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available at Grafenwöhr. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Grafenwöhr. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'USAG Ansbach': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Ansbach, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available near Ansbach. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European classes near Ansbach. Business and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Aviano Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Aviano AB, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation management and aerospace engineering. Available at Aviano. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes at Aviano. Business and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Naval Air Station Sigonella': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at NAS Sigonella, Sicily. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at NAS Sigonella. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Camp Darby': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Camp Darby, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes near Camp Darby. Business and criminal justice. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Naval Station Rota': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Naval Station Rota, Spain. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NS Rota. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Andersen Air Force Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses at Andersen AFB, Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Andersen. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Joint Region Marianas': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses in Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/asia-pacific' },
    { name: 'Guam Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Local community college on Guam. Business, healthcare, and technology programs. TA-eligible. Strong transfer pathways.', applyUrl: 'https://www.guamcc.edu/admissions/', siteUrl: 'https://www.guamcc.edu' },
    { name: 'University of Guam', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'The only four-year public university on Guam. Business, nursing, and education. TA and GI Bill accepted.', applyUrl: 'https://www.uog.edu/admissions/', siteUrl: 'https://www.uog.edu' },
  ],
  'Al Udeid Air Base': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for deployed/OCONUS members at Al Udeid AB. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Al Udeid. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs including intelligence, security, and emergency management.', applyUrl: 'https://www.amu.apus.edu/enrollment/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'Camp Lemonnier': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at Camp Lemonnier, Djibouti. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Camp Lemonnier. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Incirlik Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Incirlik AB, Turkey. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu/locations/europe' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at Incirlik. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
  ],
  'Bahrain Naval Support Activity': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at NSA Bahrain. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NSA Bahrain. TA accepted.', applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu/locations/overseas' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. Intelligence, security, and emergency management programs. GI Bill accepted.', applyUrl: 'https://www.amu.apus.edu/enrollment/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  // ── Space Force ──────────────────────────────────────────────────────────────
  'Cape Canaveral Space Force Station': [
    { name: 'Florida Institute of Technology', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'STEM-focused private university in Melbourne, FL. Aerospace, engineering, and computer science. Strong ties to space industry and CCSFS. Yellow Ribbon.', applyUrl: 'https://www.fit.edu/admissions/undergraduate/', siteUrl: 'https://www.fit.edu' },
    { name: 'Eastern Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Affordable community college near CCSFS. Engineering technology, business, and healthcare. TA and GI Bill accepted.', applyUrl: 'https://www.easternflorida.edu/admissions/', siteUrl: 'https://www.easternflorida.edu' },
    { name: 'University of Central Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university in Orlando. Aerospace engineering, computer science, and business. Strong veteran services.', applyUrl: 'https://www.ucf.edu/admissions/', siteUrl: 'https://www.ucf.edu' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Top aviation and aerospace university in Daytona Beach, 50 miles from CCSFS. Aviation science, aerospace engineering. Yellow Ribbon participant.', applyUrl: 'https://daytonabeach.erau.edu/admissions/', siteUrl: 'https://daytonabeach.erau.edu' },
  ],
  'Los Angeles AFB': [
    { name: 'University of Southern California', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top private research university. Engineering, business, and aerospace. Yellow Ribbon participant. Strong industry connections to space industry.', applyUrl: 'https://admission.usc.edu/', siteUrl: 'https://www.usc.edu' },
    { name: 'UCLA', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Westwood. Engineering, business, and sciences. Yellow Ribbon certified.', applyUrl: 'https://admission.ucla.edu/', siteUrl: 'https://www.ucla.edu' },
    { name: 'El Camino College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Torrance. Engineering technology, computer science, and business. TA-eligible. Transfer pathway to CSU/UC.', applyUrl: 'https://www.elcamino.edu/admissions/', siteUrl: 'https://www.elcamino.edu' },
    { name: 'California State University Dominguez Hills', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Carson near LA AFB. Business, nursing, and technology. Military-friendly with veteran resource center.', applyUrl: 'https://www.csudh.edu/admissions/', siteUrl: 'https://www.csudh.edu' },
  ],
  'Cheyenne Mountain SFS': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU campus adjacent to the Colorado Springs military community. Engineering, nursing, and business. Active veteran services.', applyUrl: 'https://www.uccs.edu/admissions/apply', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Technology, business, and automotive. TA accepted.', applyUrl: 'https://www.ppsc.edu/admissions/apply/', siteUrl: 'https://www.ppsc.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  'Cavalier Space Force Station': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Regional university in Minot, ND. Business, education, and nursing programs. TA and GI Bill accepted.', applyUrl: 'https://www.minotstateu.edu/admissions/', siteUrl: 'https://www.minotstateu.edu' },
    { name: 'University of North Dakota', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship state university with strong aviation and aerospace programs. 2 hours from Cavalier. Yellow Ribbon participant.', applyUrl: 'https://und.edu/admissions/', siteUrl: 'https://und.edu' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Affordable two-year college near the Canadian border region. Natural resources and business programs. TA-eligible.', applyUrl: 'https://www.dakotacollege.edu/admissions/', siteUrl: 'https://www.dakotacollege.edu' },
  ],
  'Clear Space Force Station': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Major Alaskan research university. Engineering, natural science, and liberal arts. Strong veteran services. 100 miles from Clear SFS.', applyUrl: 'https://www.uaf.edu/admissions/', siteUrl: 'https://www.uaf.edu' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Vocational and associate degree programs in Fairbanks. TA-eligible. IT, business, and health programs.', applyUrl: 'https://www.uaf.edu/ctc/admissions/', siteUrl: 'https://www.uaf.edu/ctc/' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading online university for military members. Available remotely at Clear SFS. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
  ],
  // ── Coast Guard ───────────────────────────────────────────────────────────────
  'USCG Training Center Cape May': [
    { name: 'Stockton University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university 30 miles from Cape May. Business, nursing, and social work. Veteran services office and TA accepted.', applyUrl: 'https://www.stockton.edu/admissions/', siteUrl: 'https://www.stockton.edu' },
    { name: 'Cape May County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Local community college with flexible scheduling for military. Business, healthcare, and criminal justice. TA-eligible.', applyUrl: 'https://www.capemaytech.com/', siteUrl: 'https://www.capemaytech.com' },
    { name: 'Rowan University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Growing public research university in Glassboro, NJ. Engineering, business, and health sciences. Yellow Ribbon participant.', applyUrl: 'https://admissions.rowan.edu/', siteUrl: 'https://www.rowan.edu' },
  ],
  'USCG Base Kodiak': [
    { name: 'Kodiak College (UAF)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'University of Alaska Fairbanks community campus in Kodiak. Associate degrees and certificates. TA accepted. Career and technical programs.', applyUrl: 'https://www.uaf.edu/kodiak/admissions/', siteUrl: 'https://www.uaf.edu/kodiak/' },
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Flagship Alaskan university available via distance learning. Engineering, science, and liberal arts. GI Bill and TA accepted.', applyUrl: 'https://www.uaf.edu/admissions/', siteUrl: 'https://www.uaf.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university for military. Intelligence, emergency management, and security studies. TA and GI Bill accepted.', applyUrl: 'https://www.amu.apus.edu/enrollment/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'USCG Base Honolulu': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Hawaii flagship research university. Business, engineering, and marine sciences. Strong veteran services. TA and GI Bill accepted.', applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with campuses in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Vocational and transfer programs in Honolulu. Automotive, electronics, and healthcare. TA-eligible.', applyUrl: 'https://honolulu.hawaii.edu/admissions', siteUrl: 'https://honolulu.hawaii.edu' },
  ],
  'USCG Base Elizabeth City': [
    { name: 'College of the Albemarle', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Elizabeth City. Nursing, IT, and business programs. TA accepted. Flexible scheduling for shift workers.', applyUrl: 'https://www.albemarle.edu/admissions/', siteUrl: 'https://www.albemarle.edu' },
    { name: 'Elizabeth City State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU with strong STEM programs, including aviation. Affordable tuition with veteran services. GI Bill and TA accepted.', applyUrl: 'https://www.ecsu.edu/admissions/index.html', siteUrl: 'https://www.ecsu.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. 1 hour from Elizabeth City. Yellow Ribbon.', applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
  ],
  'USCG ISC Portsmouth': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Monarch Military Center. Engineering, business, and education. TA and GI Bill accepted.', applyUrl: 'https://www.odu.edu/apply', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Nursing, IT, and business. Strong military family enrollment. TA-eligible.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU near Portsmouth. Mass communications, technology, and social work. Veteran-friendly campus.', applyUrl: 'https://www.nsu.edu/admissions/apply', siteUrl: 'https://www.nsu.edu' },
  ],
  'Coast Guard Island Alameda': [
    { name: 'California State University East Bay', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Hayward across the bay. Business, nursing, and computer science. Military-friendly with veteran resource center.', applyUrl: 'https://www20.csueastbay.edu/admissions/', siteUrl: 'https://www.csueastbay.edu' },
    { name: 'College of Alameda', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Peralta community college on Alameda Island. Aviation maintenance, business, and IT. TA-eligible. Very close to Coast Guard Island.', applyUrl: 'https://alameda.peralta.edu/enrollment-services/admissions/', siteUrl: 'https://alameda.peralta.edu' },
    { name: 'UC Berkeley', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'World-renowned public university across the bay. Engineering, business, and law. Yellow Ribbon certified.', applyUrl: 'https://admissions.berkeley.edu/', siteUrl: 'https://www.berkeley.edu' },
    { name: 'Saint Mary\'s College of California', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private Catholic liberal arts college. Business, nursing, and education. Yellow Ribbon participant. 20 minutes from CG Island.', applyUrl: 'https://www.stmarys-ca.edu/admission', siteUrl: 'https://www.stmarys-ca.edu' },
  ],
  'USCG Training Center Petaluma': [
    { name: 'Santa Rosa Junior College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'One of California\'s top community colleges. Business, nursing, and culinary arts. TA accepted. Transfer pathway to CSU/UC.', applyUrl: 'https://admissions.santarosa.edu/', siteUrl: 'https://www.santarosa.edu' },
    { name: 'Sonoma State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Rohnert Park, 8 miles from TRACEN. Business, nursing, and liberal arts. Veteran-friendly campus.', applyUrl: 'https://www.sonoma.edu/admissions/', siteUrl: 'https://www.sonoma.edu' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo. Physician assistant, pharmacy, and nursing programs. Military-friendly.', applyUrl: 'https://www.tu.edu/admissions/', siteUrl: 'https://www.tu.edu' },
  ],
  'USCG Sector New York': [
    { name: 'College of Staten Island (CUNY)', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CUNY campus on Staten Island near USCG Sector NY. Nursing, business, and social work. Affordable tuition and TA-eligible.', applyUrl: 'https://www.csi.cuny.edu/admissions', siteUrl: 'https://www.csi.cuny.edu' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-class private university in NYC. Law, business, and engineering. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.nyu.edu/admissions/undergraduate-admissions.html', siteUrl: 'https://www.nyu.edu' },
    { name: 'St. John\'s University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Catholic university in Queens. Law, pharmacy, and business. Yellow Ribbon and military tuition rates.', applyUrl: 'https://www.stjohns.edu/admission', siteUrl: 'https://www.stjohns.edu' },
  ],
  'USCG Sector Miami': [
    { name: 'Florida International University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large research university in Miami. Business, engineering, and law. Strong veteran support office. GI Bill and TA accepted.', applyUrl: 'https://admissions.fiu.edu/', siteUrl: 'https://www.fiu.edu' },
    { name: 'Miami Dade College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Nation\'s largest community college system. Associate degrees and certificates. Very affordable. TA-eligible.', applyUrl: 'https://www.mdc.edu/admissions/', siteUrl: 'https://www.mdc.edu' },
    { name: 'University of Miami', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Private research university in Coral Gables. Marine science, business, and law. Yellow Ribbon participant.', applyUrl: 'https://welcome.miami.edu/apply/', siteUrl: 'https://www.miami.edu' },
  ],
  'USCG Sector New Orleans': [
    { name: 'Tulane University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Top private research university. Public health, business, and law. Yellow Ribbon participant. Strong veteran support.', applyUrl: 'https://admission.tulane.edu/', siteUrl: 'https://www.tulane.edu' },
    { name: 'University of New Orleans', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public urban university. Business, engineering, and film studies. Veteran-friendly with active veterans office.', applyUrl: 'https://www.uno.edu/admissions', siteUrl: 'https://www.uno.edu' },
    { name: 'Delgado Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Louisiana\'s largest community college. Healthcare, culinary arts, and IT. TA-eligible. Multiple campuses in metro area.', applyUrl: 'https://www.dcc.edu/admissions/', siteUrl: 'https://www.dcc.edu' },
  ],
  'USCG Sector Houston-Galveston': [
    { name: 'University of Houston', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university. Business, engineering, and law. Active veteran services. GI Bill and TA accepted.', applyUrl: 'https://www.uh.edu/admissions/', siteUrl: 'https://www.uh.edu' },
    { name: 'College of the Mainland', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Texas City near Galveston. Nursing, welding, and business. TA-eligible.', applyUrl: 'https://www.com.edu/admissions/', siteUrl: 'https://www.com.edu' },
    { name: 'University of Texas Medical Branch (UTMB)', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Medical school and health sciences in Galveston. Nursing and allied health. Strong military connections.', applyUrl: 'https://www.utmb.edu/admissions', siteUrl: 'https://www.utmb.edu' },
  ],
  'USCG Sector San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large CSU campus. Business, engineering, and public health. Strong veteran support and military community.', applyUrl: 'https://admissions.sdsu.edu/', siteUrl: 'https://www.sdsu.edu' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Downtown San Diego community college. Nursing, business, and IT. TA-eligible. Strong military enrollment.', applyUrl: 'https://www.sdcity.edu/CollegeServices/EnrollmentServices/Admissions/', siteUrl: 'https://www.sdcity.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: 'https://admissions.ucsd.edu/', siteUrl: 'https://www.ucsd.edu' },
  ],
  'USCG AIRSTA Traverse City': [
    { name: 'Northwestern Michigan College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Traverse City. Aviation, maritime, and business programs. TA-eligible. Strong career focus.', applyUrl: 'https://www.nmc.edu/admissions/', siteUrl: 'https://www.nmc.edu' },
    { name: 'Central Michigan University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Regional university with distance learning options. Business, health sciences, and education. Yellow Ribbon participant.', applyUrl: 'https://www.cmich.edu/admissions/', siteUrl: 'https://www.cmich.edu' },
  ],
  'USCG Sector Puget Sound': [
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified.', applyUrl: 'https://admit.washington.edu/', siteUrl: 'https://www.washington.edu' },
    { name: 'Seattle Central College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Downtown Seattle community college. Culinary, nursing, and IT programs. TA-eligible. Transfer pathway to UW.', applyUrl: 'https://seattlecentral.edu/get-started/apply', siteUrl: 'https://seattlecentral.edu' },
    { name: 'Seattle University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Jesuit university in Seattle. Law, nursing, and business. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.seattleu.edu/admissions/', siteUrl: 'https://www.seattleu.edu' },
  ],
  'USCG Sector Boston': [
    { name: 'Massachusetts Maritime Academy', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Only public maritime academy in New England. Marine transportation, marine engineering, and emergency management. Strong CG connections.', applyUrl: 'https://www.maritime.edu/admissions', siteUrl: 'https://www.maritime.edu' },
    { name: 'Bunker Hill Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Boston. Business, healthcare, and liberal arts. TA-eligible. Transfer pathway to state universities.', applyUrl: 'https://www.bhcc.edu/admissions/', siteUrl: 'https://www.bhcc.edu' },
    { name: 'Northeastern University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top co-op university. Engineering, business, and cybersecurity. Yellow Ribbon participant. Excellent veteran support.', applyUrl: 'https://admissions.northeastern.edu/', siteUrl: 'https://www.northeastern.edu' },
  ],
  'USCG Sector Baltimore': [
    { name: 'University of Maryland Baltimore County', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public research university near Baltimore. Cybersecurity, engineering, and health sciences. Strong veteran services.', applyUrl: 'https://admissions.umbc.edu/', siteUrl: 'https://www.umbc.edu' },
    { name: 'Community College of Baltimore County', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Multiple campuses in Baltimore area. Nursing, IT, and business. TA-eligible. Flexible scheduling.', applyUrl: 'https://www.ccbcmd.edu/Getting-Started/Apply-for-Admission.html', siteUrl: 'https://www.ccbcmd.edu' },
    { name: 'Towson University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university near Baltimore. Business, nursing, and education programs. Veteran-friendly with active veterans services.', applyUrl: 'https://www.towson.edu/admissions/', siteUrl: 'https://www.towson.edu' },
  ],
  'USCG AIRSTA Sitka': [
    { name: 'University of Alaska Southeast (Sitka)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UAS campus in Sitka. Associate degrees and certificates in business, health, and liberal arts. TA accepted.', applyUrl: 'https://www.uas.alaska.edu/admissions/', siteUrl: 'https://www.uas.alaska.edu' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading fully online military university. Available from remote Alaska assignments. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
  ],
  'USCG Sector Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville. Business, nursing, and computer science. Active veteran services and military tuition rates.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college system in Jacksonville. Nursing, IT, and business. TA-eligible. Multiple campuses.', applyUrl: 'https://www.fscj.edu/admissions', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university with aviation, nursing, and business programs. Military-friendly. Yellow Ribbon participant.', applyUrl: 'https://www.ju.edu/admissions/', siteUrl: 'https://www.ju.edu' },
  ],
  'USCG Sector Charleston': [
    { name: 'College of Charleston', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Historic public liberal arts university. Business, marine biology, and education. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://admissions.cofc.edu/', siteUrl: 'https://www.cofc.edu' },
    { name: 'Trident Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college in Charleston. Nursing, IT, and culinary arts. TA-eligible. High military enrollment.', applyUrl: 'https://www.tridenttech.edu/admissions/', siteUrl: 'https://www.tridenttech.edu' },
    { name: 'The Citadel', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Military college of South Carolina. Business, science, and engineering. Strong connection to armed services. Yellow Ribbon.', applyUrl: 'https://admissions.citadel.edu/', siteUrl: 'https://www.citadel.edu' },
  ],
};

function EducationBenefitsTab({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('gibill');

  const installName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const COLLEGE_ALIASES = { 'Fort Hood': 'Fort Cavazos', 'Fort Bragg': 'Fort Liberty', 'Fort Rucker': 'Fort Novosel', 'Fort Benning': 'Fort Moore', 'Fort Gordon': 'Fort Eisenhower', 'Fort Lee': 'Fort Gregg-Adams' };
  const resolvedInstall = COLLEGE_ALIASES[installName] || installName;
  const nearbyColleges = INSTALLATION_COLLEGES[resolvedInstall] || INSTALLATION_COLLEGES[installName] || [];

  const GI_BILL_CHAPTERS = [
    {
      chapter: "Chapter 33",
      name: "Post-9/11 GI Bill",
      who: "Veterans who served 90+ days after 9/11/2001",
      benefits: ["Tuition paid directly to school (100% for in-state public)", "Monthly housing allowance (BAH E-5 with dependents rate)", "Up to $1,000/yr books & supplies stipend", "Transferable to dependents (with qualifying service)"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: true,
    },
    {
      chapter: "Chapter 30",
      name: "Montgomery GI Bill (MGIB-AD)",
      who: "Active duty veterans who paid into the program ($1,200 contribution)",
      benefits: ["Monthly stipend paid to you directly", "Up to 36 months of benefits", "Must be enrolled at least half-time"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: false,
    },
    {
      chapter: "Chapter 35",
      name: "Survivors' & Dependents' Educational Assistance",
      who: "Dependents of veterans who are permanently disabled or died in service",
      benefits: ["Monthly stipend for full-time enrollment", "Up to 45 months of benefits", "Career & vocational training included"],
      apply: "https://www.va.gov/education/survivor-dependent-education-assistance/",
      best: false,
    },
    {
      chapter: "Chapter 1606",
      name: "Montgomery GI Bill — Selected Reserve",
      who: "National Guard and Reserve members who have 6-year commitment",
      benefits: ["Monthly payment for college, tech school, distance learning", "Up to 36 months of benefits"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: false,
    },
  ];

  const HOW_TO_STEPS = [
    { step: 1, title: "Apply on VA.gov", desc: "Go to va.gov/education/how-to-apply and complete VA Form 22-1990. You'll need your DD-214 or current service info." },
    { step: 2, title: "Receive Certificate of Eligibility", desc: "VA will mail your COE in 4-6 weeks. This shows your school exactly what benefits you have. Upload it to eBenefits or keep a copy." },
    { step: 3, title: "Notify School Certifying Official (SCO)", desc: "Every college has an SCO (usually in the Registrar or Veterans Affairs office). They certify your enrollment to VA each semester." },
    { step: 4, title: "Understand BAH (Ch.33)", desc: "If using Post-9/11, your monthly housing allowance is based on the ZIP code of your school's main campus. Online-only students get 50% of national average BAH." },
    { step: 5, title: "Track Benefits Usage", desc: "Log into va.gov/education/check-remaining-entitlement to see how many months remain. You have a 15-year limit from separation (Ch.33)." },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Education</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>Education & scholarship resources for service members and spouses</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ id: 'gibill', label: 'GI Bill Chapters' }, { id: 'howto', label: 'How to Apply' }, { id: 'colleges', label: 'Colleges' }, { id: 'schools', label: 'Find Schools' }, { id: 'mycaa', label: 'MyCAA (Spouses)' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`, background: activeTab === t.id ? theme.primary : '#FFF', color: activeTab === t.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'gibill' && (
        <div>
          {GI_BILL_CHAPTERS.map((ch, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: `1px solid ${ch.best ? theme.accent : '#E0E6EE'}`, borderLeft: `3px solid ${ch.best ? theme.accent : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#888' }}>Chapter {ch.chapter}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821' }}>{ch.name}</div>
                </div>
                {ch.best && <span style={{ background: theme.accent, color: theme.secondary, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>MOST COMMON</span>}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10, fontStyle: 'italic' }}>{ch.who}</div>
              {ch.benefits.map((b, i) => (
                <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>✓ {b}</div>
              ))}
              <a href={ch.apply} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 10, padding: '8px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>Apply Online</a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'howto' && (
        <div>
          {HOW_TO_STEPS.map((s) => (
            <div key={s.step} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.primary, color: '#FFF', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
          <a href="https://www.va.gov/education/how-to-apply/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
            Start Application on VA.gov
          </a>
        </div>
      )}

      {activeTab === 'colleges' && (
        <div>
          {nearbyColleges.length > 0 ? (
            <>
              <div style={{ background: theme.secondary, borderRadius: 12, padding: 12, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.12em', marginBottom: 4 }}>COLLEGES NEAR {resolvedInstall.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{nearbyColleges.length} schools listed · All links verified · TA and GI Bill acceptance noted</div>
              </div>
              {nearbyColleges.map((col, idx) => (
                <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{col.name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: col.type === 'Public' ? '#E3F2FD' : '#FCE4EC', color: col.type === 'Public' ? '#1565C0' : '#880E4F' }}>{col.type}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#56697C' }}>{col.degree}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: theme.primary }}>{col.rating.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: '#888' }}>/ 5.0</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{col.desc}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={col.applyUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 2, display: 'block', padding: '9px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 800, fontSize: 11 }}>Apply Now</a>
                    <a href={col.siteUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'block', padding: '9px', borderRadius: 8, background: '#F0F4F8', color: theme.primary, textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>Website</a>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 8 }}>No college data for this installation yet</div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 14 }}>Use the resources below to find accredited schools near your gaining installation.</div>
              <a href="https://www.va.gov/gi-bill-comparison-tool/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: theme.primary, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>VA GI Bill School Comparison Tool</a>
              <a href="https://nces.ed.gov/collegenavigator/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>NCES College Navigator</a>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schools' && (
        <div>
          <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            Use the links below to find VA-approved schools. Make sure any school you attend is on the VA's approved programs list.
          </div>
          {[
            { name: "VA Comparison Tool", desc: "Compare GI Bill benefits at specific schools — see tuition, BAH rates, and ratings.", url: "https://www.va.gov/gi-bill-comparison-tool/" },
            { name: "ArmyIgnitED", desc: "Official Army portal for Tuition Assistance requests, education counseling, and CLEP/DANTES exam registration.", url: "https://armyignited.army.mil/" },
            { name: "DANTES (DSST Exams)", desc: "Free college-level subject exams for service members — earn college credit.", url: "https://www.dantes.mil" },
            { name: "Troops to Teachers", desc: "Transition into teaching with VA support programs.", url: "https://www.proudtoserveagain.com" },
            { name: "eBenefits Portal", desc: "Manage all VA education benefits and check remaining entitlement.", url: "https://www.ebenefits.va.gov" },
          ].map((r, idx) => (
            <div key={idx} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>Open Resource →</a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mycaa' && (
        <div>
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 6 }}>MyCAA — Military Spouse Career Advancement Accounts</div>
            <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.6 }}>Up to $4,000/year (max $16,000 total) for military spouses to pursue education and portable career credentials.</div>
          </div>
          {[
            { title: 'Eligibility', items: ['Spouse of active duty service member E-1 to O-2 (or W-1 to W-2)', 'Spouse must be 18+ years old', 'Enrolled in a degree or credential program', 'Not eligible if service member is on Title 10 orders for < 180 days'] },
            { title: 'What It Covers', items: ['Associate degrees', 'Bachelor’s/Master’s degrees', 'Licenses and certifications (e.g., nursing, real estate, IT)', 'Vocational/technical training', 'Online and in-person programs at approved schools'] },
            { title: 'How to Apply', items: ['1. Visit MyCAA portal at aiportal.acc.af.mil', '2. Create an account with your military ID info', '3. Complete career exploration and education plan', '4. Get Financial Assistance approved before enrolling', '5. School submits invoices directly to MyCAA'] },
          ].map((section, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>{section.title}</div>
              {section.items.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>✓ {item}</div>
              ))}
            </div>
          ))}
          <a href="https://aiportal.acc.af.mil/mycaa" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Apply for MyCAA →</a>
          <a href="https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: '#E8F5E9', color: '#2E7D32', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>Learn More at MilitaryOneSource →</a>
        </div>
      )}
    </div>
  );
}

function ResourcesTab({ theme, profile }) {
  const [activeSection, setActiveSection] = useState('healthcare');
  const branch = profile?.branch || 'Army';

  const SECTIONS = [
    { id: 'healthcare',   label: 'Healthcare', icon: '🏥' },
    { id: 'portals',      label: 'Military Portals', icon: '🖥️' },
    { id: 'family',       label: 'Family Support', icon: '👨‍👩‍👧' },
    { id: 'financial',    label: 'Financial', icon: '💰' },
    { id: 'pcs',          label: 'PCS & Housing', icon: '🏠' },
    { id: 'education',    label: 'Education', icon: '🎓' },
    { id: 'careers',      label: 'Careers', icon: '💼' },
  ];

  const RESOURCES = {
    healthcare: [
      { name: 'TRICARE', desc: 'Military health insurance — find plans, providers, and enrollment info', url: 'https://www.tricare.mil', tag: 'All Branches' },
      { name: 'TRICARE Online', desc: 'Book appointments, view records, refill prescriptions', url: 'https://www.tricareonline.com', tag: 'All Branches' },
      { name: 'TRICARE 4U', desc: 'TRICARE beneficiary portal — claims, EOBs, and coverage details', url: 'https://www.tricare4u.com', tag: 'All Branches' },
      { name: 'TRICARE for Life (TFL)', desc: 'Medicare-wraparound coverage for retired service members via TRICARE4u', url: 'https://www.tricare4u.com', tag: 'Retirees' },
      { name: 'TRICARE Dental Program (TDP)', desc: 'Dental benefits enrollment, find a provider, and submit claims', url: 'https://www.trdp.org', tag: 'All Branches' },
      { name: 'TRICARE Overseas', desc: 'TRICARE coverage for beneficiaries stationed or living outside the U.S.', url: 'https://www.tricareoverseas.com', tag: 'OCONUS' },
      { name: 'TRICARE Overseas Program (TOP)', desc: 'Managed care option for overseas military beneficiaries', url: 'https://www.tricareoverseas.com', tag: 'OCONUS' },
      { name: 'TRICARE Pharmacy — ESI', desc: 'Prescription drug benefits managed by Express Scripts for TRICARE', url: 'https://tricare.mil/CoveredServices/Pharmacy', tag: 'All Branches' },
      { name: 'Humana Military (HMS) — TRICARE', desc: 'TRICARE East Region managed care — find providers and manage benefits', url: 'https://www.humanamilitary.com', tag: 'All Branches' },
      { name: 'My MHS GENESIS', desc: 'Military Health System patient portal — records, appointments, secure messaging', url: 'https://patient.mhsgenesis.health.mil', tag: 'All Branches' },
      { name: 'Military OneSource Health', desc: 'Free health consultations and wellness referrals for service members', url: 'https://www.militaryonesource.mil/health-wellness', tag: 'All Branches' },
      { name: 'VA Health Care', desc: 'Veteran health benefits, eligibility, and enrollment', url: 'https://www.va.gov/health-care', tag: 'Veterans' },
    ],
    family: [
      { name: 'Military OneSource', desc: '24/7 support for military families — counseling, legal, financial, relocation', url: 'https://www.militaryonesource.mil', tag: 'All Branches' },
      { name: 'Military Child Education Coalition', desc: 'School transition resources for military children', url: 'https://www.militarychild.org', tag: 'Families' },
      { name: 'Operation Homefront', desc: 'Emergency financial and housing assistance for military families', url: 'https://www.operationhomefront.org', tag: 'All Branches' },
      { name: 'Blue Star Families', desc: 'Connection and community for military families nationwide', url: 'https://bluestarfam.org', tag: 'All Branches' },
      { name: branch === 'Army' ? 'Army Community Service (ACS)' : branch === 'Navy' ? 'Fleet & Family Support (FFSC)' : branch.includes('Marine') ? 'Marine Corps Family Services' : 'Airman & Family Readiness Center', desc: 'Installation-based family support, financial counseling, employment help', url: branch === 'Army' ? 'https://www.armymwr.com/acs' : branch === 'Navy' ? 'https://www.cnic.navy.mil/ffsp' : 'https://www.militaryonesource.mil', tag: branch },
    ],
    financial: [
      { name: 'myPay (DFAS)', desc: 'Access and manage your military pay, allotments, and W-2s', url: 'https://mypay.dfas.mil', tag: 'All Branches' },
      { name: 'BAH Calculator', desc: 'Calculate your Basic Allowance for Housing by rank and zip code', url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/', tag: 'All Branches' },
      { name: 'VA Benefits Explorer', desc: 'Explore all VA benefits you may be eligible for', url: 'https://www.benefits.va.gov', tag: 'Veterans' },
      { name: 'Military Saves', desc: 'Financial readiness resources, savings plans, and debt reduction tools', url: 'https://militarysaves.org', tag: 'All Branches' },
      { name: 'Blended Retirement System', desc: 'BRS calculator and TSP retirement planning tools', url: 'https://militarypay.defense.gov/BRS/', tag: 'All Branches' },
      { name: 'SCRA (Service Members Civil Relief)', desc: 'Interest rate caps, lease termination rights, foreclosure protection', url: 'https://www.benefits.va.gov/homeloans/scra.asp', tag: 'All Branches' },
    ],
    pcs: [
      { name: 'Move.mil (DPS)', desc: 'Schedule your household goods move, track shipment, file claims', url: 'https://www.move.mil', tag: 'All Branches' },
      { name: 'Military Installations', desc: 'Find on-post housing, facilities, and services at any installation', url: 'https://www.militaryinstallations.dod.mil', tag: 'All Branches' },
      { name: 'Housing Network', desc: 'Search on-post and nearby off-post housing options', url: 'https://www.housing.af.mil', tag: 'All Branches' },
      { name: 'SCRA Lease Termination', desc: 'Break your lease when PCS orders arrive — federal protection', url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/scra/', tag: 'PCS' },
      { name: 'VA Home Loan', desc: 'Zero-down home loans for veterans and active duty service members', url: 'https://www.va.gov/housing-assistance/home-loans', tag: 'Housing' },
    ],
    education: [
      { name: 'VA GI Bill', desc: 'Apply for GI Bill benefits and check remaining entitlement', url: 'https://www.va.gov/education', tag: 'Veterans' },
      { name: 'MyCAA Scholarships', desc: 'Up to $4,000/year for military spouses pursuing portable careers', url: 'https://aiportal.acc.af.mil/mycaa', tag: 'Spouses' },
      { name: 'Tuition Assistance (TA)', desc: `${branch === 'Army' ? 'GoArmyEd' : branch === 'Navy' ? 'Navy TA via NETPDTC' : 'Branch Tuition Assistance'} — up to $4,500/year for active duty`, url: branch === 'Army' ? 'https://www.goarmyed.com' : 'https://www.military.com/education/money-for-school/tuition-assistance-ta-program-overview.html', tag: branch },
      { name: 'DANTES / DSST Exams', desc: 'Free college-level exams for service members — earn credits fast', url: 'https://www.dantes.mil', tag: 'All Branches' },
      { name: 'DoDEA Schools', desc: 'Find DoD-operated schools for military families worldwide', url: 'https://www.dodea.edu', tag: 'Families' },
    ],
    careers: [
      { name: 'USAJobs.gov', desc: 'Federal civilian jobs with veteran preference hiring', url: 'https://www.usajobs.gov', tag: 'Federal' },
      { name: 'Hire Heroes USA', desc: 'Free job placement and resume coaching for veterans and spouses', url: 'https://www.hireheroesusa.org', tag: 'Veteran-Focused' },
      { name: 'My Next Move for Veterans', desc: 'Translate your MOS to civilian career paths', url: 'https://www.mynextmove.org/vets', tag: 'MOS Translator' },
      { name: 'MySECO — Spouse Education & Career Opportunities', desc: 'Military OneSource career coaching, scholarships, and employment tools for spouses', url: 'https://myseco.militaryonesource.mil', tag: 'Spouses' },
      { name: 'Military Spouse Employment Partnership', desc: 'Employer network committed to hiring military spouses', url: 'https://myseco.militaryonesource.mil/portal/', tag: 'Spouses' },
      { name: 'MyCAA — Spouse Career Advancement Accounts', desc: 'Up to $4,000/year in scholarships for military spouses pursuing portable careers', url: 'https://aiportal.acc.af.mil/mycaa', tag: 'Spouses' },
      { name: 'Transition GPS (TAP)', desc: 'DoD Transition Assistance Program — mandatory pre-separation classes', url: 'https://www.dodtap.mil', tag: 'Transition' },
    ],
    portals: [
      { name: 'ARBA Case Tracking System (ACTS)', desc: 'Army Review Boards Agency — track your Army Board for Correction of Records case', url: 'https://arba.army.pentagon.mil', tag: 'Army' },
      { name: 'Army TAP Portal', desc: 'Army Transition Assistance Program — schedule TAP workshops and manage transition', url: 'https://tapevents.mil', tag: 'Army' },
      { name: 'HRC — iPERMS', desc: 'U.S. Army Human Resources Command — view and manage your official military personnel records', url: 'https://iperms.hrc.army.mil', tag: 'Army' },
      { name: 'U.S. Army HRC Portal', desc: 'Army Human Resources Command — assignments, promotions, evaluations, and career tools', url: 'https://www.hrc.army.mil', tag: 'Army' },
      { name: 'IPPS-A', desc: 'Integrated Personnel and Pay System — Army: manage pay, personnel actions, and leave', url: 'https://ipps-a.army.mil', tag: 'Army' },
      { name: 'Military Information Platform (MIP)', desc: 'Army knowledge management and information sharing platform', url: 'https://www.milsuite.mil', tag: 'Army' },
      { name: 'milConnect (DMDC)', desc: 'Defense Manpower Data Center — view benefits, DEERS updates, and personnel data', url: 'https://www.milconnect.dmdc.osd.mil', tag: 'All Branches' },
    ],
  };

  const tagColor = (tag) => {
    if (tag === 'All Branches') return { bg: '#E3F2FD', color: '#1565C0' };
    if (tag === 'Veterans') return { bg: '#FFF3E0', color: '#E65100' };
    if (tag === 'Spouses') return { bg: '#FCE4EC', color: '#880E4F' };
    if (tag === 'Families') return { bg: '#E8F5E9', color: '#1B5E20' };
    return { bg: `${theme.primary}15`, color: theme.primary };
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Military Resources</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>Official military & government resources, tailored to {branch}</div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <a href="https://www.tricare.mil" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 10, background: '#1565C0', color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>TRICARE →</a>
        <a href="https://www.militaryonesource.mil" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 10, background: '#2E7D32', color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>MilitaryOneSource →</a>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${activeSection === s.id ? theme.primary : '#E0E6EE'}`, background: activeSection === s.id ? theme.primary : '#FFF', color: activeSection === s.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Resource cards */}
      {(RESOURCES[activeSection] || []).map((r, idx) => {
        const tc = tagColor(r.tag);
        return (
          <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{r.name}</div>
              <span style={{ background: tc.bg, color: tc.color, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap' }}>{r.tag}</span>
            </div>
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '7px 14px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}>Open Resource →</a>
          </div>
        );
      })}
    </div>
  );
}

// ─── Phase timeline windows (days relative to departure) ──────────────────
const PHASE_WINDOWS = {
  'Orders Received': { activeAt: 999, overdueAt: 90 },
  '90 Days Out':     { activeAt: 90,  overdueAt: 60 },
  '60 Days Out':     { activeAt: 60,  overdueAt: 30 },
  '30 Days Out':     { activeAt: 30,  overdueAt: 7  },
  'Move Week':       { activeAt: 7,   overdueAt: 0  },
  'In-Processing':   { activeAt: 0,   overdueAt: -30 },
};

function getDaysUntilDeparture(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + 'T12:00:00') - new Date();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function OrdersTab({ theme, profile }) {
  const [orders, setOrders] = useState(() => store.get('pcs_orders') || null);
  const [mode, setMode] = useState('view');
  const [form, setForm] = useState({
    ordersNumber: '',
    reportDate: profile?.departingDate || '',
    gainingUnit: profile?.unit || '',
    gainingInstallation: profile?.gainingInstallation || '',
    losingInstallation: profile?.losingInstallation || '',
    authorizedDependents: profile?.hasDependents ?? false,
    tdyEnRoute: false,
    tdyLocation: '',
    pcsAllowances: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    secureLocalStore.get('pcs_orders', null).then(saved => {
      if (saved) setOrders(saved);
    });
  }, []);

  const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const saveOrders = (data) => {
    const saved = { ...data, savedAt: new Date().toISOString() };
    setOrders(saved);
    store.set('pcs_orders', saved);
    setMode('view');
    setUploadMsg('');
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('Reading locally on this device. The source file is not stored on PCS Express servers.');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target.result || '';
      // Extract printable ASCII strings — captures text from text-based PDFs
      const readable = (raw.match(/[ -~\n\r\t]{8,}/g) || []).join(' ');
      if (readable.length < 50) {
        setUploadMsg('Could not extract text. Please fill in the fields below.');
        setUploading(false);
        setMode('manual');
        return;
      }
      setUploadMsg('Text extracted locally. Review and enter only the minimum information needed below.');
      setUploading(false);
      setMode('manual');
    };
    reader.readAsText(file, 'utf-8');
  };

  const daysUntil = orders?.reportDate ? getDaysUntilDeparture(orders.reportDate) : null;

  const fieldSt = {
    width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 8,
    border: '1px solid #CBD5E1', background: '#F8FAFC',
    color: '#0D1821', outline: 'none', boxSizing: 'border-box',
  };
  const labelSt = { fontSize: 11, fontWeight: 700, color: theme.primary, display: 'block', marginBottom: 5 };
  const InfoRow = ({ label, value }) => !value ? null : (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #F5F5F5', fontSize: 12 }}>
      <span style={{ color: '#888', fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{label}</span>
      <span style={{ color: '#0D1821', fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Military Orders</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>Upload your PCS orders to track timelines and deadlines automatically</div>
      <LocalEncryptedDataNotice theme={theme} />

      {/* No orders: upload prompt */}
      {mode === 'view' && !orders && (
        <div style={{ background: theme.secondary, borderRadius: 14, padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Upload Your PCS Orders</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.5 }}>
            Upload your orders only if you want local extraction support. The file is read locally; only the fields you save are encrypted on this device.
          </div>
          <label style={{ display: 'block', padding: '12px', borderRadius: 10, background: theme.accent, color: theme.secondary, fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
            {uploading ? 'Reading…' : '📎 Select Orders File (PDF / Image)'}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {uploadMsg && <div style={{ fontSize: 12, color: theme.accent, marginBottom: 10 }}>{uploadMsg}</div>}
          <button onClick={() => setMode('manual')} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Enter Orders Manually
          </button>
        </div>
      )}

      {/* Orders on file: summary + timeline */}
      {mode === 'view' && orders && (
        <>
          {daysUntil !== null && (
            <div style={{ background: daysUntil < 0 ? '#FFEBEE' : daysUntil < 14 ? '#FFF3E0' : '#E8F5E9', border: `2px solid ${daysUntil < 0 ? '#EF9A9A' : daysUntil < 14 ? '#FFB74D' : '#A5D6A7'}`, borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 28 }}>{daysUntil < 0 ? '📍' : daysUntil < 14 ? '⚡' : '📅'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: daysUntil < 0 ? '#C62828' : daysUntil < 14 ? '#E65100' : '#1B5E20' }}>
                  {daysUntil < 0 ? `${Math.abs(daysUntil)} days since report date` : daysUntil === 0 ? 'Report date is TODAY' : `${daysUntil} days to report date`}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>Report NLT: {orders.reportDate}</div>
              </div>
            </div>
          )}

          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>Orders on File</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <label style={{ padding: '5px 10px', borderRadius: 7, background: `${theme.primary}15`, color: theme.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📎 Update
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={handleFile} style={{ display: 'none' }} />
                </label>
                <button onClick={() => { setForm({ ...orders }); setMode('manual'); }} style={{ padding: '5px 10px', borderRadius: 7, background: `${theme.primary}15`, color: theme.primary, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
            <InfoRow label="Orders Number" value={orders.ordersNumber} />
            <InfoRow label="Report NLT" value={orders.reportDate} />
            <InfoRow label="Gaining Unit" value={orders.gainingUnit} />
            <InfoRow label="Gaining Installation" value={orders.gainingInstallation} />
            <InfoRow label="Losing Installation" value={orders.losingInstallation} />
            <InfoRow label="Dependents Auth" value={orders.authorizedDependents ? '✓ Yes' : 'No'} />
            <InfoRow label="TDY En Route" value={orders.tdyEnRoute ? `✓ Yes${orders.tdyLocation ? ` — ${orders.tdyLocation}` : ''}` : 'No'} />
            <InfoRow label="Allowances" value={orders.pcsAllowances} />
          </div>

          {orders.reportDate && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 12 }}>PCS Phase Timeline</div>
              {Object.entries(PHASE_WINDOWS).map(([phase, win]) => {
                const phaseDate = new Date(orders.reportDate + 'T12:00:00');
                phaseDate.setDate(phaseDate.getDate() + win.overdueAt);
                const isPast = new Date() > phaseDate;
                const isActive = daysUntil !== null && daysUntil <= win.activeAt && daysUntil >= win.overdueAt;
                return (
                  <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isPast ? '#A5D6A7' : isActive ? theme.accent : '#E0E6EE', flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: isPast ? '#555' : isActive ? theme.primary : '#AAA', fontWeight: isActive ? 800 : 400, flex: 1 }}>{phase}</div>
                    <div style={{ fontSize: 10, color: '#AAA' }}>{win.overdueAt >= 0 ? `${win.overdueAt}d before` : `${Math.abs(win.overdueAt)}d after`}</div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => { setOrders(null); store.set('pcs_orders', null); }} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid #FFCDD2', color: '#C62828', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Remove Orders
          </button>
        </>
      )}

      {/* Manual entry / edit form */}
      {mode === 'manual' && (
        <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821', marginBottom: 12 }}>
            {uploadMsg ? '📋 Review Extracted Data' : 'Orders Information'}
          </div>
          {uploadMsg && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#1D4ED8' }}>
              {uploadMsg}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>ORDERS NUMBER</label>
            <input value={form.ordersNumber} onChange={e => upd('ordersNumber', e.target.value)} placeholder="e.g. ORDERS 123-01" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>REPORT NLT DATE</label>
            <input type="date" value={form.reportDate} onChange={e => upd('reportDate', e.target.value)} style={{ ...fieldSt, colorScheme: 'light' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>GAINING UNIT</label>
            <input value={form.gainingUnit} onChange={e => upd('gainingUnit', e.target.value)} placeholder="e.g. 2-7 Infantry, 1st Cav" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>GAINING INSTALLATION</label>
            <input value={form.gainingInstallation} onChange={e => upd('gainingInstallation', e.target.value)} placeholder="e.g. Fort Liberty" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>LOSING INSTALLATION</label>
            <input value={form.losingInstallation} onChange={e => upd('losingInstallation', e.target.value)} placeholder="e.g. Fort Carson" style={fieldSt} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>PCS ALLOWANCES / ENTITLEMENTS</label>
            <input value={form.pcsAllowances} onChange={e => upd('pcsAllowances', e.target.value)} placeholder="e.g. DPS authorized, PPM, TLE" style={fieldSt} />
          </div>
          {[['authorizedDependents', 'Dependents authorized to travel'], ['tdyEnRoute', 'TDY en route authorized']].map(([key, label]) => (
            <div key={key} onClick={() => upd(key, !form[key])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #F0F4F8', cursor: 'pointer' }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${form[key] ? theme.primary : '#CBD5E1'}`, background: form[key] ? theme.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {form[key] && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: '#0D1821', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
          {form.tdyEnRoute && (
            <div style={{ marginTop: 10, marginBottom: 4 }}>
              <label style={labelSt}>TDY LOCATION</label>
              <input value={form.tdyLocation} onChange={e => upd('tdyLocation', e.target.value)} placeholder="e.g. Fort Lee, VA" style={fieldSt} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setMode('view'); setUploadMsg(''); }} style={{ padding: '11px 16px', borderRadius: 10, background: '#F0F4F8', border: 'none', color: '#56697C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => saveOrders(form)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: theme.primary, border: 'none', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save Orders</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onboarding constants ──────────────────────────────────────────────────
const COMPONENT_TYPES = ['Active Duty', 'Reserve', 'National Guard', 'AGR', 'FTNG', 'Spouse', 'Dependent'];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',              native: 'English'    },
  { code: 'es', name: 'Spanish',              native: 'Español'    },
  { code: 'de', name: 'German',               native: 'Deutsch'    },
  { code: 'fr', name: 'French',               native: 'Français'   },
  { code: 'ko', name: 'Korean',               native: '한국어'       },
  { code: 'ja', name: 'Japanese',             native: '日本語'       },
  { code: 'tl', name: 'Tagalog',              native: 'Tagalog'    },
  { code: 'ar', name: 'Arabic',               native: 'العربية'     },
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文'        },
  { code: 'it', name: 'Italian',              native: 'Italiano'   },
  { code: 'pt', name: 'Portuguese',           native: 'Português'  },
  { code: 'vi', name: 'Vietnamese',           native: 'Tiếng Việt' },
];

const RELIGIOUS_PREFERENCES = [
  'No Preference', 'Protestant / Christian', 'Catholic', 'Orthodox Christian',
  'Jewish', 'Muslim / Islam', 'Buddhist', 'Hindu',
  'Sikh', 'LDS / Mormon', 'Unitarian Universalist',
  'Prefer not to say', 'Other',
];

const INSTALLATION_UNITS = {
  // ── ARMY ──────────────────────────────────────────────────────────────────
  'Fort Liberty': {
    Army: ['XVIII Airborne Corps HQ', '82nd Airborne Division', '1st Special Forces Command (Airborne)', '525th Expeditionary Military Intelligence Brigade', '16th Military Police Brigade', '20th CBRNE Command'],
    'Air Force': ['43rd Airlift Wing'], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Bragg': {
    Army: ['XVIII Airborne Corps HQ', '82nd Airborne Division', '1st Special Forces Command (Airborne)', '525th Expeditionary Military Intelligence Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Campbell': {
    Army: ['101st Airborne Division (Air Assault)', '5th Special Forces Group (Airborne)', '160th Special Operations Aviation Regiment', '431st Chemical Brigade'],
    'Air Force': ['101st Airborne Division Aviation'], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Cavazos': {
    Army: ['III Corps', '1st Cavalry Division', '3rd Cavalry Regiment', '13th Sustainment Command (Expeditionary)', '36th Engineer Brigade', '504th Military Intelligence Brigade', '89th Military Police Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Hood': {
    Army: ['III Corps', '1st Cavalry Division', '3rd Cavalry Regiment', '13th Sustainment Command (Expeditionary)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Carson': {
    Army: ['4th Infantry Division', '10th Special Forces Group (Airborne)', '71st Ordnance Group (EOD)', '4th Security Force Assistance Brigade', '43rd Sustainment Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Bliss': {
    Army: ['1st Armored Division', '32nd Army Air and Missile Defense Command', '7th Special Forces Group (Airborne)', '402nd Army Field Support Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Drum': {
    Army: ['10th Mountain Division (LI)', '10th Combat Aviation Brigade', '10th Mountain Division Sustainment Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Sill': {
    Army: ['Fires Center of Excellence', '75th Field Artillery Brigade', '31st Air Defense Artillery Brigade', '434th Field Artillery Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Moore': {
    Army: ['Maneuver Center of Excellence', '198th Infantry Brigade', '29th Infantry Regiment', '316th Cavalry Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Benning': {
    Army: ['Maneuver Center of Excellence', '75th Ranger Regiment', '3rd Infantry Regiment (The Old Guard training)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Eisenhower': {
    Army: ['Cyber Center of Excellence', '780th Military Intelligence Brigade (Cyber)', '15th Cyber Warfare Battalion'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Gordon': {
    Army: ['Cyber Center of Excellence', '780th Military Intelligence Brigade (Cyber)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Stewart': {
    Army: ['3rd Infantry Division', '3rd Combat Aviation Brigade', '3rd Sustainment Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Knox': {
    Army: ['Armor School', 'Army Human Resources Command (HRC)', '3rd Recruiting Brigade', '1st Theater Sustainment Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Jackson': {
    Army: ['193rd Infantry Brigade', 'U.S. Army Drill Sergeant School', 'Adjutant General School'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Leonard Wood': {
    Army: ['Maneuver Support Center of Excellence', '14th Chemical Brigade', '554th Engineer Battalion', 'Military Police School', 'Engineer School'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Leavenworth': {
    Army: ['Combined Arms Center', 'Command and General Staff College', 'U.S. Army Intelligence Center', '902nd Military Intelligence Group', 'Army Corrections Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Riley': {
    Army: ['1st Infantry Division (Big Red One)', '937th Engineer Group', '1st Infantry Division Combat Aviation Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Wainwright': {
    Army: ['1st Stryker Brigade Combat Team (25th ID)', '11th Airborne Division', 'Arctic Warriors'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Gregg-Adams': {
    Army: ['Combined Arms Support Command', 'Army Quartermaster School', 'Army Ordnance School', 'Transportation Corps School'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Lee': {
    Army: ['Combined Arms Support Command', 'Army Quartermaster School', 'Army Ordnance School'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Meade': {
    Army: ['U.S. Cyber Command', 'NSA/CSS', '704th Military Intelligence Brigade', '780th Military Intelligence Brigade'],
    Navy: ['Defense Information Systems Agency (DISA)'],
    'Air Force': ['Air Force Cyber Operations'], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Hamilton': {
    Army: ['Recruitment Battalion', 'Military Entrance Processing Command', 'Northeast USARC'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'West Point (USMA)': {
    Army: ['United States Military Academy', 'USMA Corps of Cadets', 'Headquarters USMA'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Aberdeen Proving Ground': {
    Army: ['Army Test and Evaluation Command (ATEC)', 'Army Research Laboratory', 'Signal Center of Excellence', '20th CBRNE Command', 'Cyber School'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Belvoir': {
    Army: ['Defense Threat Reduction Agency (DTRA)', 'National Geospatial-Intelligence Agency (NGA)', 'Army Intelligence and Security Command (INSCOM)', 'Defense Contract Audit Agency'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Myer (JBM-HH)': {
    Army: ['3rd U.S. Infantry Regiment (The Old Guard)', 'U.S. Army Band (Pershing\'s Own)', 'Military District of Washington'],
    'Marine Corps': ['Marine Barracks Washington Detachment'],
    Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Schofield Barracks': {
    Army: ['25th Infantry Division (Tropic Lightning)', '8th Theater Sustainment Command', '500th Military Intelligence Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Shafter': {
    Army: ['U.S. Army Pacific (USARPAC)', 'U.S. Army Hawaii', '311th Signal Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // Korea
  'Camp Humphreys': {
    Army: ['United States Forces Korea (USFK)', '8th Army HQ', '2nd Infantry Division', '19th Expeditionary Sustainment Command', 'Area I Support Activity'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Humphreys': {
    Army: ['8th Army HQ', '2nd Infantry Division', '19th Expeditionary Sustainment Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // Germany
  'USAG Stuttgart': {
    Army: ['U.S. European Command (EUCOM)', 'U.S. Africa Command (AFRICOM)', 'Special Operations Command Europe (SOCEUR)', '5th Special Forces Group Europe'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Wiesbaden': {
    Army: ['U.S. Army Europe and Africa (USAREUR-AF)', 'V Corps Forward', '12th Combat Aviation Brigade', '1st Armored Division Forward'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Bavaria (Grafenwöhr)': {
    Army: ['7th Army Training Command', 'Joint Multinational Readiness Center (JMRC)', '12th Combat Aviation Brigade', '2nd Cavalry Regiment'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Rheinland-Pfalz (Kaiserslautern)': {
    Army: ['21st Theater Sustainment Command', '405th Army Field Support Brigade'],
    'Air Force': ['86th Airlift Wing (Ramstein)'], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── NAVY ──────────────────────────────────────────────────────────────────
  'Naval Station Norfolk': {
    Navy: ['U.S. Fleet Forces Command', 'Naval Air Force Atlantic', 'Naval Surface Force Atlantic', 'Carrier Strike Groups (CSG-2, CSG-8)', 'COMNAVAIRLANT', 'Navy Region Mid-Atlantic'],
    'Marine Corps': ['2nd Marine Aircraft Wing (MAW)'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base San Diego': {
    Navy: ['Navy Region Southwest', 'Third Fleet', 'Naval Surface Force Pacific', 'Carrier Strike Groups (CSG-1, CSG-3)', 'Naval Special Warfare Command'],
    'Marine Corps': ['1st Marine Division', 'Marine Corps Recruit Depot San Diego'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Mayport': {
    Navy: ['Naval Station Mayport', 'Destroyer Squadron 6', 'SEAL Team 4', 'Helicopter Sea Combat Squadron'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NAS Pensacola': {
    Navy: ['Naval Air Station Pensacola', 'Naval Education and Training Command', 'Blue Angels', 'Aviation Officer Candidate School'],
    'Marine Corps': ['Marine Aviation Training Support Group'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base Kitsap': {
    Navy: ['Naval Base Kitsap', 'Strategic Weapons Facility Pacific', 'Submarine Group 9', 'Trident submarines (ballistic missile)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NAS Jacksonville': {
    Navy: ['VP-30 (Maritime Patrol)', 'VP-16', 'Patrol and Reconnaissance Wing 11', 'NAVSUP Fleet Logistics Center'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Submarine Base Kings Bay': {
    Navy: ['Submarine Group 10', 'SSBN (Ohio-class ballistic missile submarines)', 'Trident Training Facility'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base Coronado': {
    Navy: ['Naval Special Warfare Command', 'SEAL Teams 1, 3, 5, 7, 17, 18', 'SWCC', 'Naval Air Station North Island', 'Carrier Air Wing (CVW-9, CVW-11)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Great Lakes': {
    Navy: ['Naval Service Training Command (NSTC)', 'Recruit Training Command (Boot Camp)', 'Nuclear Power School', 'NETC'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Pearl Harbor-Hickam': {
    Navy: ['U.S. Pacific Fleet HQ', 'Submarine Force Pacific', 'Navy Region Hawaii', 'Pearl Harbor Naval Shipyard'],
    'Air Force': ['Pacific Air Forces (PACAF) HQ', '15th Wing', 'Air Mobility Command Pacific'],
    Army: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': ['14th Coast Guard District'],
  },
  'NAS Whidbey Island': {
    Navy: ['Electronic Attack Wing Pacific', 'VAQ squadrons (EA-18G Growlers)', 'VP squadrons (P-8 Poseidon)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Commander Fleet Activities Yokosuka': {
    Navy: ['7th Fleet HQ', 'Task Force 70', 'Carrier Strike Group 5', 'USS Ronald Reagan (CVN-76)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Commander Fleet Activities Sasebo': {
    Navy: ['CTF-76 (Amphibious Force)', 'Amphibious Squadron 11', 'Mine Countermeasures Force 7th Fleet'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Sigonella': {
    Navy: ['NAVEUR', 'VP-4 Skinny Dragons', 'P-8 Poseidon patrol squadrons', 'Drone operations support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Naples': {
    Navy: ['Commander Naval Forces Europe-Africa (NAVEUR-NAVAF)', '6th Fleet HQ', 'Task Force 60'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Rota': {
    Navy: ['Navy Region Europe-Africa Southwest', 'Commander Task Force 65', 'Destroyer Squadron 60', 'DDG Aegis destroyers forward-deployed'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── MARINE CORPS ──────────────────────────────────────────────────────────
  'Marine Corps Base Camp Lejeune': {
    'Marine Corps': ['II Marine Expeditionary Force (II MEF)', '2nd Marine Division', '2nd Marine Logistics Group', '2nd Marine Aircraft Wing (MAW)', 'Marine Corps Forces Special Operations Command (MARSOC)'],
    Navy: ['Naval Medical Center Camp Lejeune'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Lejeune': {
    'Marine Corps': ['II Marine Expeditionary Force (II MEF)', '2nd Marine Division', '2nd Marine Logistics Group'],
    Navy: ['Naval Medical Center Camp Lejeune'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Pendleton': {
    'Marine Corps': ['I Marine Expeditionary Force (I MEF)', '1st Marine Division', '1st Marine Logistics Group', 'Marine Aircraft Group 39 (MAG-39)', '5th Marine Regiment'],
    Navy: ['Naval Hospital Camp Pendleton', 'SEAL Team 5'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAS Miramar': {
    'Marine Corps': ['3rd Marine Aircraft Wing (3rd MAW)', 'Marine Fighter Attack Training Squadron 101', 'Marine Air Control Group 38'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAS Cherry Point': {
    'Marine Corps': ['2nd Marine Aircraft Wing', 'Marine Aircraft Group 14 (MAG-14)', 'VMFA squadrons (F/A-18)', 'Marine Corps Air Station Cherry Point'],
    Navy: ['Fleet Readiness Center East'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCB Quantico': {
    'Marine Corps': ['Marine Corps Combat Development Command', 'Marine Corps University', 'FBI Academy', 'Officer Candidates School (OCS)', 'The Basic School (TBS)', 'Marine Corps Intelligence Activity'],
    'Air Force': [], Army: [], Navy: [], 'Space Force': [], 'Coast Guard': [],
  },
  'Marine Corps Base Quantico': {
    'Marine Corps': ['Marine Corps Combat Development Command', 'Officer Candidates School', 'The Basic School'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCRD Parris Island': {
    'Marine Corps': ['Marine Corps Recruit Depot Parris Island', 'Eastern Recruiting Region', '4th Recruit Training Battalion'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Butler (Okinawa)': {
    'Marine Corps': ['III Marine Expeditionary Force (III MEF)', '3rd Marine Division', '1st Marine Aircraft Wing', '3rd Marine Logistics Group'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAS Iwakuni': {
    'Marine Corps': ['Marine Aircraft Group 12 (MAG-12)', 'VMFA-121 (F-35B)', 'Marine Air Control Group 18'],
    Navy: ['Carrier Air Wing 5 (CVW-5)'],
    Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── AIR FORCE ─────────────────────────────────────────────────────────────
  'Joint Base Langley-Eustis': {
    'Air Force': ['1st Fighter Wing (F-22 Raptors)', 'Air Combat Command HQ', '480th Intelligence, Surveillance, and Reconnaissance Wing'],
    Army: ['7th Transportation Brigade (Expeditionary)', '128th Aviation Brigade'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Eglin AFB': {
    'Air Force': ['Air Force Materiel Command', '96th Test Wing', '33rd Fighter Wing (F-35A)', '7th Special Forces Group (Airborne) − AFSOC', '1st Special Operations Wing', 'Air Force Research Laboratory Munitions Directorate'],
    Army: ['7th Special Forces Group (Airborne)'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MacDill AFB': {
    'Air Force': ['6th Air Refueling Wing (KC-135)', 'Air Force Special Operations Command (AFSOC)'],
    Army: ['U.S. Central Command (CENTCOM)', 'U.S. Special Operations Command (SOCOM)'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Andrews': {
    'Air Force': ['11th Wing', '316th Wing', 'Air Force One (1st Airlift Squadron)', '89th Airlift Wing', 'District of Columbia Air National Guard'],
    'Marine Corps': ['Marine Helicopter Squadron One (HMX-1)'],
    Army: [], Navy: [], 'Space Force': [], 'Coast Guard': [],
  },
  'Offutt AFB': {
    'Air Force': ['U.S. Strategic Command (STRATCOM) HQ', '55th Wing (RC-135 Rivet Joint)', 'Air Force Global Strike Command component'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Ramstein AB': {
    'Air Force': ['U.S. Air Forces in Europe (USAFE) HQ', '86th Airlift Wing (C-130J)', 'Air Mobility Command Europe', '435th Air Ground Operations Wing'],
    Army: ['U.S. Army Europe and Africa HQ (nearby Wiesbaden)'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Kadena AB': {
    'Air Force': ['18th Wing (F-15 Eagles)', 'Pacific Air Forces', 'Marine Aircraft Group 36 (MAG-36)'],
    'Marine Corps': ['Marine Aircraft Group 36'],
    Army: [], Navy: [], 'Space Force': [], 'Coast Guard': [],
  },
  'Osan AB': {
    'Air Force': ['7th Air Force HQ', '51st Fighter Wing (F-16, A-10)', 'Combined Air Operations Center Korea'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'RAF Lakenheath': {
    'Air Force': ['48th Fighter Wing (F-15C/D/E)', 'USAFE-AFAFRICA', '492nd Fighter Squadron', '494th Fighter Squadron', 'F-35A transition ongoing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Nellis AFB': {
    'Air Force': ['Air Force Warfare Center', 'USAF Weapons School', '57th Wing', 'Thunderbirds (Air Force Demonstration Squadron)', 'F-35, F-16, F-15 combat training'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Travis AFB': {
    'Air Force': ['60th Air Mobility Wing (C-17, C-5)', 'David Grant USAF Medical Center'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Scott AFB': {
    'Air Force': ['U.S. Transportation Command (TRANSCOM) HQ', 'Air Mobility Command (AMC) HQ', '375th Air Mobility Wing', 'Defense Information Systems Agency (DISA) West'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Wright-Patterson AFB': {
    'Air Force': ['Air Force Materiel Command (AFMC) HQ', 'Air Force Research Laboratory (AFRL)', '88th Air Base Wing', 'National Air and Space Intelligence Center (NASIC)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Tinker AFB': {
    'Air Force': ['Air Force Sustainment Center', 'Oklahoma City Air Logistics Complex (OC-ALC)', '552nd Air Control Wing (E-3 AWACS)', 'B-52 and KC-135 maintenance'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Barksdale AFB': {
    'Air Force': ['Air Force Global Strike Command (AFGSC) HQ', '2nd Bomb Wing (B-52H Stratofortress)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Minot AFB': {
    'Air Force': ['5th Bomb Wing (B-52H)', '91st Missile Wing (Minuteman III ICBMs)', 'Air Force Global Strike Command'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Whiteman AFB': {
    'Air Force': ['509th Bomb Wing (B-2 Spirit Stealth Bomber)', '131st Bomb Wing (Missouri ANG)', 'Air Force Global Strike Command'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── SPACE FORCE ───────────────────────────────────────────────────────────
  'Peterson SFB': {
    'Space Force': ['Space Operations Command (SpOC) HQ', 'Space Delta 2 (Space Domain Awareness)', 'Space Delta 3 (Space Electronic Warfare)', 'NORAD/USNORTHCOM HQ'],
    'Air Force': ['NORAD and USNORTHCOM'],
    Army: [], Navy: [], 'Marine Corps': [], 'Coast Guard': [],
  },
  'Schriever SFB': {
    'Space Force': ['Space Delta 6 (Cyberspace Operations)', 'Space Delta 8 (Satellite Command and Control)', 'Space Delta 9 (Orbital Warfare)', '50th Space Wing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  'Vandenberg SFB': {
    'Space Force': ['Space Launch Delta 30', 'Space Delta 7 (Space Intelligence)', '30th Space Wing missions'],
    'Air Force': ['30th Space Wing (launches)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Coast Guard': [],
  },
  'Cape Canaveral Space Force Station': {
    'Space Force': ['Space Launch Delta 45', '45th Space Wing missions', 'Eastern Range launch operations'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  'Buckley SFB': {
    'Space Force': ['Space Delta 4 (Missile Warning)', 'Space Delta 5 (Command and Control)', 'National Reconnaissance Office operations'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  // ── JOINT BASES ───────────────────────────────────────────────────────────
  'Joint Base Lewis-McChord': {
    Army: ['I Corps', '7th Infantry Division', '2nd Infantry Division (ROK/US Combined)', '62nd Medical Brigade', '17th Fires Brigade', '593rd Expeditionary Sustainment Command'],
    'Air Force': ['62nd Airlift Wing (C-17)', '446th Airlift Wing (Reserve)', 'Western Air Defense Sector'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base San Antonio': {
    'Air Force': ['37th Training Wing (Basic Military Training)', 'Air Education and Training Command (AETC) HQ', '59th Medical Wing', '502nd Air Base Wing', 'JBSA-Lackland / JBSA-Randolph / JBSA-Sam Houston'],
    Army: ['Army Futures Command HQ', 'U.S. Army Medical Center of Excellence'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Charleston': {
    'Air Force': ['437th Airlift Wing (C-17)', '315th Airlift Wing (Reserve)'],
    Navy: ['Naval Weapons Station Charleston', 'Naval Nuclear Power Training Command'],
    Army: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base McGuire-Dix-Lakehurst': {
    'Air Force': ['305th Air Mobility Wing (C-17)', '87th Air Base Wing'],
    Army: ['10th Mountain Division (FORSCOM unit)', '84th Training Division'],
    Navy: ['Naval Air Engineering Station Lakehurst'],
    'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Elmendorf-Richardson': {
    'Air Force': ['3rd Wing (F-22A)', '176th Wing (Alaska ANG)', '11th Air Force'],
    Army: ['4th Brigade Combat Team (25th ID)', 'U.S. Army Alaska'],
    Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── COAST GUARD ───────────────────────────────────────────────────────────
  'USCG Training Center Cape May': {
    'Coast Guard': ['Recruit Training', 'Basic Training Command', 'Maritime Law Enforcement Training Center'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Base Kodiak': {
    'Coast Guard': ['17th Coast Guard District (Alaska)', 'CGC Munro (WMSL)', 'CGC Alex Haley', 'Sector Anchorage', 'Aviation Training Center component'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector New York': {
    'Coast Guard': ['Sector New York', 'Station New York', 'Marine Safety Unit Tuckerton', 'Activities New York'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Miami': {
    'Coast Guard': ['Sector Miami', 'Maritime Drug Law Enforcement Operations', 'Caribbean migrant operations'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Puget Sound': {
    'Coast Guard': ['Sector Puget Sound', 'Station Seattle', 'Station Port Angeles', 'Aids to Navigation Team'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  // ── ARMY · CONUS (additional) ─────────────────────────────────────────────
  'Anniston Army Depot': {
    Army: ['Chemical Materials Activity', 'Conventional Ammunition Demilitarization Group', 'Anniston Army Depot Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Novosel': {
    Army: ['U.S. Army Aviation Center of Excellence (USAACE)', '1st Aviation Brigade', 'Warrant Officer Career College', '110th Aviation Brigade', '110th Theater Aviation Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Rucker': {
    Army: ['U.S. Army Aviation Center of Excellence (USAACE)', '1st Aviation Brigade', 'Warrant Officer Career College', '110th Aviation Brigade'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Redstone Arsenal': {
    Army: ['Army Aviation and Missile Command (AMCOM)', 'Army Space and Missile Defense Command (SMDC)', 'AMCOM Logistics Center', 'Program Executive Office Missiles and Space'],
    'Air Force': ['Air Force Materiel Command component'], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Huachuca': {
    Army: ['U.S. Army Intelligence Center of Excellence (USAICoE)', '111th Military Intelligence Brigade', '304th Military Intelligence Battalion', 'Network Enterprise Technology Command (NETCOM)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Yuma Proving Ground': {
    Army: ['U.S. Army Yuma Test Center (YTC)', 'Army Test and Evaluation Command (ATEC)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Pine Bluff Arsenal': {
    Army: ['Chemical Materials Activity – Pine Bluff', 'Army Materiel Command support'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Parks': {
    Army: ['91st Training Division (USAR)', '63rd Readiness Division (USAR)', '9th Mission Support Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Hunter Liggett': {
    Army: ['91st Training Division', 'Army Reserve regional training support'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Irwin': {
    Army: ['National Training Center (NTC)', '11th Armored Cavalry Regiment (OPFOR)', '916th Support Brigade', 'Operations Group NTC'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Presidio of Monterey (DLI)': {
    Army: ['Defense Language Institute Foreign Language Center (DLIFLC)', '229th Military Intelligence Brigade', 'Presidio of Monterey Garrison'],
    Navy: ['Fleet Numerical Meteorology and Oceanography Center (tenant)'], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Miami': {
    Army: ['U.S. Southern Command (SOUTHCOM) support', 'U.S. Army South (ARSOUTH)', 'Special Operations Command South'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Hunter Army Airfield': {
    Army: ['3rd Combat Aviation Brigade (3rd ID)', 'General Support Aviation Battalion', '603rd Aviation Support Battalion'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Rock Island Arsenal': {
    Army: ['U.S. Army Rock Island Arsenal', 'Joint Manufacturing and Technology Center (JMTC)', 'Army Contracting Command – Rock Island', 'TACOM Life Cycle Management Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Johnson': {
    Army: ['Joint Readiness Training Center (JRTC)', '10th Mountain Division (rotational)', '519th Military Police Battalion', '115th Field Artillery Brigade', '2nd Battalion 5th Infantry (JRTC OpFor)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Polk': {
    Army: ['Joint Readiness Training Center (JRTC)', '10th Mountain Division (rotational)', '519th Military Police Battalion'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Detrick': {
    Army: ['U.S. Army Medical Research and Development Command (USAMRDC)', 'U.S. Army Medical Research Institute of Infectious Diseases (USAMRIID)', 'National Interagency Biodefense Campus', 'Chemical and Biological Center of Excellence'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort George G. Meade': {
    Army: ['U.S. Cyber Command', 'NSA/CSS', '704th Military Intelligence Brigade', '780th Military Intelligence Brigade'],
    Navy: ['Defense Information Systems Agency (DISA)'],
    'Air Force': ['Air Force Cyber Operations'], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Natick Soldier Systems Center': {
    Army: ['Program Executive Office Soldier', 'DEVCOM Soldier Center (NSSC)', 'Combat Capabilities Development Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Detroit Arsenal': {
    Army: ['TACOM Life Cycle Management Command', 'Army Contracting Command – Warren', 'Ground Vehicle Systems Center (DEVCOM)', 'Program Executive Office Ground Combat Systems'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Picatinny Arsenal': {
    Army: ['DEVCOM Armaments Center', 'Program Executive Office Ammunition (PEO AMMO)', 'Armament Research Development and Engineering Center (ARDEC)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'White Sands Missile Range': {
    Army: ['White Sands Test Center', 'Army Test and Evaluation Command (ATEC)', '32nd Army Air and Missile Defense Command (det)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Pope Army Airfield': {
    Army: ['18th Air Support Operations Group', '43rd Airlift Wing (host Air Force)'],
    'Air Force': ['43rd Airlift Wing (C-130J)', '440th Airlift Wing (AFRC)'], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'McAlester Army Ammunition Plant': {
    Army: ['McAlester Army Ammunition Plant', 'Production Base Modernization Agency'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Carlisle Barracks': {
    Army: ['U.S. Army War College (USAWC)', 'Army Heritage and Education Center', 'Strategic Studies Institute', 'Peacekeeping and Stability Operations Institute'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Tobyhanna Army Depot': {
    Army: ['Tobyhanna Army Depot', 'Communications-Electronics Command (CECOM)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Buchanan': {
    Army: ['U.S. Army Reserve Command Puerto Rico', '76th Operational Response Command', '9th Mission Support Command'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Sam Houston': {
    Army: ['Army Medical Center of Excellence (MEDCoE)', '1st Medical Brigade', 'San Antonio Military Medical Center (SAMMC)', 'Brooke Army Medical Center (BAMC)', 'Army Nurse Corps School'],
    'Air Force': ['59th Medical Wing (JBSA tenant)'], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Red River Army Depot': {
    Army: ['Red River Army Depot', 'TACOM Life Cycle Management Command', 'Combat Vehicle and Special Equipment repair'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Dugway Proving Ground': {
    Army: ['West Desert Test Center', 'Army Test and Evaluation Command (ATEC)', 'Chemical and Biological Defense test'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort McCoy': {
    Army: ['Fort McCoy Garrison', '88th Readiness Division', 'Regional Training Site-Maintenance', 'Cold Regions Test Center support'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Richardson': {
    Army: ['U.S. Army Alaska (USARAK)', '4th Brigade Combat Team (25th ID)', 'Headquarters USARAK'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fort Greely': {
    Army: ['49th Missile Defense Battalion', 'Ground-Based Midcourse Defense (GMD)', 'Missile Defense Agency', 'Alaska Missile Defense Element'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── ARMY · OCONUS (additional) ────────────────────────────────────────────
  'USAG Daegu': {
    Army: ['Area IV Support Activity', '19th Expeditionary Sustainment Command (det)', 'Camp Henry Garrison', 'Korea Army Support Group'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Yongsan-Casey': {
    Army: ['Area I Support Activity', '210th Field Artillery Brigade', 'Camp Casey Garrison', 'U.S. Army Garrison Yongsan'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Walker': {
    Army: ['Area IV Support Activity', 'U.S. Army Garrison Daegu detachments'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Red Cloud': {
    Army: ['Area I Support Activity', '2nd Infantry Division detachments', 'Area I Command HQ'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Japan (Camp Zama)': {
    Army: ['U.S. Army Japan (USARJ)', '78th Signal Battalion', 'Camp Zama Garrison', 'U.S. Army Corps of Engineers Japan District'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Torii Station (USAG Okinawa)': {
    Army: ['1st Battalion 1st Special Forces Group (Airborne)', 'Special Operations Command Pacific (det)', 'Torii Station Garrison'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Ansbach': {
    Army: ['12th Combat Aviation Brigade (det)', 'Ansbach Garrison', 'Army Prepositioned Stocks 2 support'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Baumholder': {
    Army: ['Baumholder Garrison', 'Army Prepositioned Stocks 2 support', '8th Theater Sustainment Command (det)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Hohenfels': {
    Army: ['Joint Multinational Readiness Center (JMRC)', '1st Battalion 4th Infantry Regiment (OPFOR)', 'Training Support Brigade Europe'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Garmisch': {
    Army: ['George C. Marshall European Center for Security Studies', 'Defense Language Institute European Branch'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Belgium (SHAPE)': {
    Army: ['Supreme Headquarters Allied Powers Europe (SHAPE)', 'NATO Allied Command Operations (ACO)', 'U.S. Delegation to NATO (USDEL NATO)', 'V Corps (main)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG BENELUX-Brussels': {
    Army: ['U.S. Army Garrison Benelux Brussels', 'NATO HQ support elements'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG BENELUX Brunssum': {
    Army: ['Allied Joint Force Command Brunssum (JFC Brunssum)', 'U.S. Army Garrison Benelux'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Italy (Vicenza)': {
    Army: ['173rd Airborne Brigade', 'Southern European Task Force Africa (SETAF-AF)', 'U.S. Army Africa (USARAF)', '12th Combat Aviation Brigade (det)'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Italy (Livorno)': {
    Army: ['USAG Italy – Livorno Garrison', 'Camp Darby logistics activity'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAG Poland': {
    Army: ['V Corps Forward Command Post', 'Battle Group Poland (Atlantic Resolve)', '82nd Airborne Division (rotational)', 'Army Prepositioned Stocks Europe'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Bondsteel': {
    Army: ['Task Force Falcon (KFOR)', 'Kosovo Force (KFOR) – U.S. element', 'Regional Command East HQ'],
    Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── NAVY · CONUS (additional) ─────────────────────────────────────────────
  'Naval Submarine Base New London': {
    Navy: ['Submarine Group 2', 'Submarine Development Squadron 12', 'Naval Submarine School', 'Multiple SSN attack submarines', 'Undersea Warfare Development Center'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Jacksonville': {
    Navy: ['Patrol and Reconnaissance Wing 11', 'VP-16 War Eagles', 'VP-30 Pro Patria (FRS)', 'VP-45 Pelicans', 'Helicopter Maritime Strike Wing Atlantic', 'NAVSUP Fleet Logistics Center Jacksonville'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NAS Jacksonville': {
    Navy: ['Patrol and Reconnaissance Wing 11', 'VP-30 (Maritime Patrol FRS)', 'VP-16, VP-45', 'Helicopter Maritime Strike Wing Atlantic'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Key West': {
    Navy: ['Naval Air Facility Key West', 'Fighter Squadron Composite 13 (VFC-13)', 'Helicopter Sea Combat Squadron 28 (HSC-28)', 'Joint Interagency Task Force South'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Pensacola': {
    Navy: ['Naval Education and Training Command (NETC)', 'Blue Angels Flight Demonstration Squadron', 'Aviation Officer Candidate School (AOCS)', 'Naval Aviation Schools Command'],
    'Marine Corps': ['Marine Aviation Training Support Group 21'], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Whiting Field': {
    Navy: ['Training Air Wing Five (TW-5)', 'HT-8 Eightballers (TH-57)', 'HT-18 Vigilant Eagles', 'Primary Fixed Wing Training (T-6)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Orlando': {
    Navy: ['Naval Air Warfare Center Training Systems Division (NAWCTSD)', 'NAVFAC Southeast', 'Reserve Center Orlando'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Panama City': {
    Navy: ['Naval Surface Warfare Center Panama City Division (NSWC PCD)', 'Naval Experimental Diving Unit (NEDU)', 'Mine Warfare Center'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Crane': {
    Navy: ['Naval Surface Warfare Center Crane Division (NSWC Crane)', 'Weapons and Electronics Systems Engineering', 'Explosive Ordnance Disposal Technology'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NAS JRB New Orleans': {
    Navy: ['Fleet Logistics Support Squadron 54 (VR-54)', 'NAVSUP Fleet Logistics Center'],
    'Air Force': ['926th Wing (AFRC)'], 'Marine Corps': ['MAG-49 Detachment'], Army: [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station JRB New Orleans': {
    Navy: ['Fleet Logistics Support Squadron 54 (VR-54)', 'NAVSUP Fleet Logistics Center'],
    'Air Force': ['926th Wing (AFRC)'], Army: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Portsmouth Naval Shipyard': {
    Navy: ['Portsmouth Naval Shipyard', 'NAVSEA Shipyard Command', 'Submarine maintenance and overhaul'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Patuxent River': {
    Navy: ['Naval Air Systems Command (NAVAIR)', 'Naval Test Wing Atlantic', 'Air Test and Evaluation Squadron VX-1', 'Air Test and Evaluation Squadron VX-23', 'U.S. Naval Test Pilot School'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NAS Patuxent River': {
    Navy: ['Naval Air Systems Command (NAVAIR)', 'Naval Test Wing Atlantic', 'VX-1 Pioneers', 'VX-23 Salty Dogs', 'U.S. Naval Test Pilot School'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Annapolis (USNA)': {
    Navy: ['United States Naval Academy (USNA)', 'Brigade of Midshipmen', 'Naval Academy Athletic Association'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Bethesda': {
    Navy: ['Walter Reed National Military Medical Center (WRNMMC)', 'Naval Medical Center Bethesda', 'Navy Medicine East'],
    Army: ['Walter Reed Army Medical Center element'], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity South Potomac': {
    Navy: ['Naval Surface Warfare Center Dahlgren Division (NSWCDD)', 'Indian Head EOD Technology Division', 'Naval Research Laboratory (det)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Meridian': {
    Navy: ['Training Air Wing One (TW-1)', 'VT-7 Eagles (T-45 Goshawk)', 'VT-9 Tigers'],
    'Marine Corps': ['Marine Attack Training Squadron 203 (VMAT-203)'], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Construction Battalion Center Gulfport': {
    Navy: ['Naval Construction Group 2 (NCG-2)', 'Naval Mobile Construction Battalion (NMCB-133)', 'NMCB-40', 'NAVSUP Fleet Logistics Center'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Stennis Space Center': {
    Navy: ['Naval Oceanographic Office (NAVOCEANO)', 'Space and Naval Warfare Systems Command (SPAWAR) det', 'Naval Research Laboratory (NRL) det'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Fallon': {
    Navy: ['Naval Strike and Air Warfare Center (NSAWC)', 'Navy Fighter Weapons School (TOPGUN)', 'Air Wing Fallon Training', 'VFA Fleet Replacement Squadron exercises'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Weapons Station Earle': {
    Navy: ['Naval Weapons Station Earle', 'Navy Munitions Command East', 'Explosive Ordnance Disposal support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Saratoga Springs': {
    Navy: ['Defense Finance and Accounting Service (DFAS)', 'Navy Reserve Center', 'Navy Recruiting District Albany (support)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Newport': {
    Navy: ['Naval War College (NWC)', 'Naval Undersea Warfare Center (NUWC)', 'Surface Warfare Officers School (SWOS)', 'Officer Development School (ODS)', 'Destroyer Squadron 30'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Mid-South': {
    Navy: ['Defense Finance and Accounting Service (DFAS)', 'NAVSUP Fleet Logistics Center', 'Military Sealift Command (det)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Mid-South (Millington)': {
    Navy: ['Navy Personnel Command (NAVPERSCOM/MyNavy Career Center)', 'Defense Finance and Accounting Service', 'NAVSUP Fleet Logistics Center Millington'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Corpus Christi': {
    Navy: ['Training Air Wing Four (TW-4)', 'VT-27 Boomers', 'VT-28 Rangers', 'Naval Air Depot Corpus Christi (NADEP CC)'],
    'Coast Guard': ['Air Station Corpus Christi (tenant)'], Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'NAS Corpus Christi': {
    Navy: ['Training Air Wing Four (TW-4)', 'VT-27 Boomers', 'VT-28 Rangers'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station JRB Fort Worth': {
    Navy: ['Fleet Logistics Support Squadron 59 (VR-59)', 'NAVSUP Fleet Logistics Center'],
    'Air Force': ['301st Fighter Wing (AFRC – F-16)'], 'Marine Corps': ['Marine Fighter Attack Squadron 112 (VMFA-112 Cowboys)'],
    Army: [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Kingsville': {
    Navy: ['Training Air Wing Two (TW-2)', 'VT-21 Red Hawks (T-45)', 'VT-22 Golden Eagles (T-45)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Oceana': {
    Navy: ['Naval Air Force Atlantic (AIRLANT)', 'Strike Fighter Wing Atlantic', 'Carrier Air Wing One (CVW-1)', 'CVW-3', 'CVW-7', 'Multiple VFA squadrons (F/A-18E/F)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NAS Oceana': {
    Navy: ['Naval Air Force Atlantic (AIRLANT)', 'Strike Fighter Wing Atlantic', 'Multiple Carrier Air Wings', 'VFA squadrons (F/A-18E/F)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Medical Center Portsmouth': {
    Navy: ['Naval Medical Center Portsmouth (NMCP)', 'Navy Medicine East HQ', 'Fleet Surgical Teams', 'Naval Hospital Corps School'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Hampton Roads': {
    Navy: ['Commander Naval Surface Force Atlantic (SURFLANT)', 'Navy Region Mid-Atlantic', 'Surface Ship Support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Weapons Station Yorktown': {
    Navy: ['Naval Weapons Station Yorktown', 'Navy Munitions Command East', 'EOD support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Norfolk Naval Shipyard': {
    Navy: ['Norfolk Naval Shipyard (NNSY)', 'Aircraft carrier overhaul', 'Submarine repair', 'NAVSEA Shipyard Command'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Everett': {
    Navy: ['Carrier Strike Group 9 (CSG-9)', 'Destroyer Squadron 9', 'Cruiser-Destroyer Group Pacific (det)', 'Strike Fighter Wing Pacific (det)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Facility El Centro': {
    Navy: ['Naval Air Facility El Centro Garrison', 'Blue Angels winter training site', 'VFA Fleet Replacement winter detachments'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Station Lemoore': {
    Navy: ['Strike Fighter Wing Pacific (SFWP)', 'Multiple VFA squadrons (F/A-18E/F Super Hornet)', 'VFA-94 Mighty Shrikes', 'VFA-113 Stingers', 'VFA-97 Warhawks'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Weapons Station China Lake': {
    Navy: ['Naval Air Warfare Center Weapons Division (NAWCWD)', 'Air-to-air and air-to-ground weapons testing', 'Electronic Combat and Sensor Systems'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base Point Loma': {
    Navy: ['Submarine Group 3', 'Submarine Development Squadron 5', 'Naval Mine and Anti-Submarine Warfare Command', 'Submarine Repair (SIMA)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base Ventura County': {
    Navy: ['Naval Air Station Point Mugu', 'Pacific Missile Test Center', 'Naval Facilities Engineering Systems Command SW', 'Naval Surface Warfare Center Port Hueneme Division'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Monterey': {
    Navy: ['Naval Postgraduate School (NPS)', 'Fleet Numerical Meteorology and Oceanography Center'],
    Army: ['Defense Language Institute (DLIFLC tenant)'], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Weapons Station Seal Beach': {
    Navy: ['Naval Weapons Station Seal Beach', 'Navy Munitions Command Pacific', 'West Coast ammunition logistics'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Washington': {
    Navy: ['Chief of Naval Operations (CNO)', 'Office of the Secretary of the Navy (SECNAV)', 'Naval District Washington (NDW)', 'Washington Navy Yard'],
    'Marine Corps': ['Marine Barracks Washington (8th & I)'], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── NAVY · OCONUS (additional) ────────────────────────────────────────────
  'Naval Support Activity Bahrain': {
    Navy: ['U.S. Naval Forces Central Command (NAVCENT)', '5th Fleet HQ', 'Combined Maritime Forces (CMF)', 'Task Force 50 (Carrier)', 'Task Force 53 (Logistics)', 'Task Force 56 (Explosive Ordnance Disposal)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'NSA Bahrain': {
    Navy: ['5th Fleet HQ', 'NAVCENT', 'Combined Maritime Forces Command'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Navy Support Facility Diego Garcia': {
    Navy: ['Diego Garcia Garrison Command', 'Maritime Prepositioning Ships Squadron 2', 'Submarine transit support', 'P-8 Poseidon patrol operations'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Station Guantanamo Bay': {
    Navy: ['Joint Task Force Guantanamo (JTF-GTMO)', 'Naval Station GTMO Garrison', 'Detainee operations support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Souda Bay': {
    Navy: ['Commander Task Force 67 (CTF-67)', 'P-8 Poseidon patrol detachments', 'NAVEUR-NAVAF support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Base Guam': {
    Navy: ['Commander Naval Forces Marianas (COMNAVMAR)', 'Submarine Group 7 (SUBGRU 7)', 'Task Force 74 (Submarine)', 'USS Frank Cable (AS-40)', 'VP-47 Golden Swordsmen (P-8 Poseidon)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Air Facility Atsugi': {
    Navy: ['Carrier Air Wing 5 (CVW-5)', 'VAQ-136 Gauntlets', 'VAW-115 Liberty Bells', 'Fleet Logistics Support Squadron 59 (VR-59) det'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Singapore': {
    Navy: ['Logistics Group Western Pacific (COMLOG WESTPAC)', 'Commander Task Force 73', 'Military Sealift Command Pacific (det)'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Naval Support Activity Stavanger': {
    Navy: ['NATO Maritime Component Command', 'Maritime Prepositioning support', 'NAVEUR logistics element'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Commander Fleet Activities Chinhae': {
    Navy: ['Naval Forces Korea (COMNAVFORKOREA)', 'Commander Task Force 78', 'Korea Fleet Activities support'],
    Army: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── MARINE CORPS · CONUS (additional) ────────────────────────────────────
  'MCAS Yuma': {
    'Marine Corps': ['Marine Aviation Weapons and Tactics Squadron One (MAWTS-1)', 'Weapons and Tactics Instructor (WTI) Course', '3rd MAW detachments', 'Marine Wing Support Squadron 371'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Marine Corps Air Station Miramar': {
    'Marine Corps': ['3rd Marine Aircraft Wing (3rd MAW)', 'Marine Fighter Attack Training Squadron 101 (VMFAT-101)', 'Marine Air Control Group 38'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAGCC Twentynine Palms': {
    'Marine Corps': ['Marine Corps Air Ground Combat Center (MCAGCC)', '7th Marine Regiment', 'Marine Air Ground Task Force Training Command (MAGTFTC)', 'I MEF (rotational exercise units)', 'Combat Center Air Traffic Control'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Twentynine Palms': {
    'Marine Corps': ['Marine Corps Air Ground Combat Center (MCAGCC)', '7th Marine Regiment', 'MAGTFTC', 'I MEF rotational units'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCLB Barstow': {
    'Marine Corps': ['Marine Corps Logistics Base Barstow', 'Marine Depot Maintenance Command', 'Combat Logistics Battalion support'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCRD San Diego': {
    'Marine Corps': ['Marine Corps Recruit Depot San Diego (MCRD SD)', 'Western Recruiting Region', '3rd Recruit Training Battalion', '4th Recruit Training Battalion'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Marine Corps Mountain Warfare Training Center': {
    'Marine Corps': ['Mountain Warfare Training Center (MWTC Bridgeport)', 'Cold Weather and Mountain Training', 'MWTC Garrison'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Marine Corps Logistics Base Albany': {
    'Marine Corps': ['Marine Corps Logistics Base Albany', 'Marine Depot Maintenance Command', 'MCLB Albany Garrison'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCLB Albany': {
    'Marine Corps': ['Marine Corps Logistics Base Albany', 'Marine Depot Maintenance Command'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAS New River': {
    'Marine Corps': ['Marine Aircraft Group 26 (MAG-26)', 'HMM-365 Blue Knights (CH-53)', 'HMLA-167 Warriors', 'Marine Expeditionary Unit aviation elements (24th MEU, 26th MEU)'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAS Beaufort': {
    'Marine Corps': ['Marine Aircraft Group 31 (MAG-31)', 'VMFA-115 Silver Eagles (F/A-18)', 'VMFA-122 Flying Leathernecks (F-35B)', 'Marine Fighter Attack Training Squadron 501 (VMFAT-501)'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Henderson Hall': {
    'Marine Corps': ['Headquarters U.S. Marine Corps (HQMC)', 'Marine Corps Combat Development & Integration', 'Commandant of the Marine Corps staff'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCB Hawaii Kaneohe Bay': {
    'Marine Corps': ['3rd Marine Regiment', 'Marine Aircraft Group 24 (MAG-24)', 'Marine Air Control Group 24', '1st Battalion 12th Marines'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCB Hawaii': {
    'Marine Corps': ['3rd Marine Regiment', 'Marine Aircraft Group 24 (MAG-24)', 'Marine Corps Base Hawaii Garrison'],
    Navy: [], Army: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── MARINE CORPS · OCONUS (additional) ───────────────────────────────────
  'Camp Foster': {
    'Marine Corps': ['Marine Corps Installations Pacific (MCIPAC) HQ', 'III MEF Support Group', 'Marine Corps Base Camp Smedley D. Butler HQ'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Kinser': {
    'Marine Corps': ['3rd Marine Logistics Group (3rd MLG) HQ', 'Combat Logistics Regiment 37', 'Maintenance Battalion 3rd MLG'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Courtney': {
    'Marine Corps': ['3rd Marine Division HQ', '12th Marine Regiment (Artillery)', '3rd Radio Battalion'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Hansen': {
    'Marine Corps': ['4th Marine Regiment', '3rd Reconnaissance Battalion', '1st Battalion 12th Marines'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Camp Schwab': {
    'Marine Corps': ['4th Marine Regiment (BLT elements)', 'Combined Arms Training Center (det)', 'III MEF infantry training'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'MCAS Futenma': {
    'Marine Corps': ['Marine Aircraft Group 36 (MAG-36)', 'VMM-265 Dragons (MV-22B Osprey)', 'Marine Aerial Refueler Transport Squadron 152'],
    Army: [], Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── AIR FORCE · CONUS (additional) ───────────────────────────────────────
  'Maxwell AFB': {
    'Air Force': ['Air University (AU)', 'Air War College (AWC)', 'Air Command and Staff College (ACSC)', 'Squadron Officer School (SOS)', '42nd Air Base Wing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Davis-Monthan AFB': {
    'Air Force': ['355th Wing (A-10 Thunderbolt II, HH-60)', '563rd Rescue Group', '309th Aerospace Maintenance and Regeneration Group (AMARG)', '12th Air Force (Air Forces Southern) HQ'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Luke AFB': {
    'Air Force': ['56th Fighter Wing (F-35A Lightning II)', '61st Fighter Squadron', '62nd Fighter Squadron', '63rd Fighter Squadron', '944th Fighter Wing (AFRC)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Beale AFB': {
    'Air Force': ['9th Reconnaissance Wing (U-2 Dragon Lady, RQ-4 Global Hawk)', '940th Air Refueling Wing (KC-135, AFRC)', 'Air Combat Command Beale'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Edwards AFB': {
    'Air Force': ['412th Test Wing', 'Air Force Test Center (AFTC)', 'Air Force Research Laboratory (AFRL) Aerospace Systems', 'F-35, B-21 Raider, and next-generation aircraft testing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'March ARB': {
    'Air Force': ['452nd Air Mobility Wing (C-17, KC-135, AFRC)', 'March Air Reserve Base Command'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'USAF Academy': {
    'Air Force': ['Headquarters USAF Academy', '10th Air Base Wing', 'Cadet Wing (Cadets)', '306th Flying Training Group', 'Center for Character and Leadership Development'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Dover AFB': {
    'Air Force': ['436th Airlift Wing (C-5M Super Galaxy)', '512th Airlift Wing (C-5, AFRC)', 'Air Force Mortuary Affairs Operations (AFMAO)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Hurlburt Field': {
    'Air Force': ['Air Force Special Operations Command (AFSOC) HQ', '1st Special Operations Wing (SOW)', 'AC-130J Ghostrider', 'MC-130J Commando II', '24th Special Operations Wing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Tyndall AFB': {
    'Air Force': ['325th Fighter Wing (F-35A Lightning II)', '53rd Weapons Evaluation Group', 'AFCEC Tyndall recovery command'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Moody AFB': {
    'Air Force': ['23rd Wing (A-10, HH-60)', '347th Rescue Group', 'Air Combat Command Moody', '74th Fighter Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Robins AFB': {
    'Air Force': ['Air Force Sustainment Center (AFSC)', 'Warner Robins Air Logistics Complex (WR-ALC)', '402nd Maintenance Wing', '116th Air Control Wing (JSTARS, Georgia ANG)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Mountain Home AFB': {
    'Air Force': ['366th Fighter Wing (F-15E Strike Eagle)', '366th Operations Group', 'Air Combat Command Mountain Home'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'McConnell AFB': {
    'Air Force': ['22nd Air Refueling Wing (KC-46A Pegasus)', '931st Air Refueling Wing (KC-46A, AFRC)', 'Air Mobility Command McConnell'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Hanscom AFB': {
    'Air Force': ['Air Force Life Cycle Management Center (AFLCMC)', 'Air Force Research Laboratory (AFRL) – Information Directorate', 'Electronic Systems Center'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Westover ARB': {
    'Air Force': ['439th Airlift Wing (C-5M Super Galaxy, AFRC)', 'Air Mobility Command Reserve Westover'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Malmstrom AFB': {
    'Air Force': ['341st Missile Wing (Minuteman III ICBM)', 'Air Force Global Strike Command Malmstrom', '43rd Missile Squadron', '10th Missile Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Creech AFB': {
    'Air Force': ['432nd Wing (MQ-9 Reaper)', '432nd Air Expeditionary Wing', 'Air Combat Command RPA operations'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Cannon AFB': {
    'Air Force': ['27th Special Operations Wing (SOW)', 'MC-130J Commando II', 'AC-130W Stinger II', 'MQ-9 Reaper operations'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Holloman AFB': {
    'Air Force': ['49th Wing (F-16CM, T-38C, MQ-9)', 'German Air Force F-16 training', 'ACC Holloman', '7th Special Forces Group (det)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Kirtland AFB': {
    'Air Force': ['377th Air Base Wing', 'Air Force Nuclear Weapons Center (AFNWC)', 'Air Force Research Laboratory Directed Energy (AFRL/RD)', 'Defense Nuclear Weapons School', 'Air Force Operational Test and Evaluation Center'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Seymour Johnson AFB': {
    'Air Force': ['4th Fighter Wing (F-15E Strike Eagle)', 'ACC Seymour Johnson', '916th Air Refueling Wing (KC-135, AFRC)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Grand Forks AFB': {
    'Air Force': ['319th Air Base Wing', 'RQ-4 Global Hawk operations (ISR)', '69th Reconnaissance Group (AMC)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Altus AFB': {
    'Air Force': ['97th Air Mobility Wing (AMC)', 'C-17 Globemaster III pilot training', 'KC-135 and KC-46 aircrew training', 'AETC Altus'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Vance AFB': {
    'Air Force': ['71st Flying Training Wing (T-6A, T-38C, T-1A)', 'Euro-NATO Joint Jet Pilot Training (ENJJPT)', 'AETC Vance'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Shaw AFB': {
    'Air Force': ['20th Fighter Wing (F-16CM/DM)', 'Air Forces Central (AFCENT) Forward HQ', 'ACC Shaw', '55th Fighter Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Ellsworth AFB': {
    'Air Force': ['28th Bomb Wing (B-21 Raider / B-1B Lancer)', 'Air Force Global Strike Command Ellsworth', '37th Bomb Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Arnold AFB': {
    'Air Force': ['Arnold Engineering Development Complex (AEDC)', 'Air Force Test Center', 'Propulsion and aerodynamic wind tunnel testing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Dyess AFB': {
    'Air Force': ['7th Bomb Wing (B-1B Lancer)', '317th Airlift Wing (C-130J, AFRC)', 'Air Force Global Strike Command Dyess'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Goodfellow AFB': {
    'Air Force': ['17th Training Wing (AETC)', 'Intelligence training', 'Fire Protection training', 'Cryptologic training', 'Special Investigations course'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Laughlin AFB': {
    'Air Force': ['47th Flying Training Wing (T-6A Texan II)', 'Undergraduate Pilot Training', 'AETC Laughlin'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Sheppard AFB': {
    'Air Force': ['82nd Training Wing (AETC)', 'Euro-NATO Joint Jet Pilot Training (ENJJPT) support', 'Maintenance and technical training', 'F-16 pilot training (German air force)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Hill AFB': {
    'Air Force': ['388th Fighter Wing (F-35A Lightning II)', 'Ogden Air Logistics Complex (OO-ALC)', 'Air Force Sustainment Center', '419th Fighter Wing (F-35A, AFRC)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Fairchild AFB': {
    'Air Force': ['92nd Air Refueling Wing (KC-135 Stratotanker)', '141st Air Refueling Wing (KC-135, ANG)', 'SERE School (336th Training Group)', 'Air Mobility Command Fairchild'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'F.E. Warren AFB': {
    'Air Force': ['90th Missile Wing (Minuteman III ICBM)', 'Air Force Global Strike Command Warren', '319th Missile Squadron', '320th Missile Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Eielson AFB': {
    'Air Force': ['354th Fighter Wing (F-35A Lightning II)', 'Pacific Air Forces (PACAF) Eielson', 'Red Flag-Alaska exercises', '18th Aggressor Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Keesler AFB': {
    'Air Force': ['81st Training Wing (AETC)', 'Air Force Technical Training Center', '403rd Wing (C-130J, WC-130J)', '53rd Weather Reconnaissance Squadron (Hurricane Hunters)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Columbus AFB': {
    'Air Force': ['14th Flying Training Wing (T-6A, T-38C, T-1A)', 'Undergraduate Pilot Training', 'AETC Columbus'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Little Rock AFB': {
    'Air Force': ['19th Airlift Wing (C-130H/J)', '314th Airlift Wing (C-130, AFRC/Training)', 'C-130 training (largest in the world)', 'Air Mobility Command Little Rock'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Travis Air Force Base': {
    'Air Force': ['60th Air Mobility Wing (C-17, C-5)', 'David Grant USAF Medical Center', 'Air Mobility Command Travis'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── AIR FORCE · OCONUS (additional) ──────────────────────────────────────
  'Spangdahlem AB': {
    'Air Force': ['52nd Fighter Wing (F-16CM, A-10)', 'USAFE-AFAFRICA Spangdahlem', '52nd Air Base Wing'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Aviano AB': {
    'Air Force': ['31st Fighter Wing (F-16C/D)', 'USAFE-AFAFRICA Aviano', 'Allied Air Command support', '510th Fighter Squadron', '555th Fighter Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Incirlik AB': {
    'Air Force': ['39th Air Base Wing', 'USAFE Incirlik', 'NATO Support Operations', 'Air Operations Center support'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Misawa AB': {
    'Air Force': ['35th Fighter Wing (F-16CJ – SEAD)', 'PACAF Misawa', 'Joint Intelligence Support Element', '13th Fighter Squadron', '14th Fighter Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Yokota AB': {
    'Air Force': ['374th Airlift Wing (C-130J Super Hercules)', 'Fifth Air Force HQ', 'U.S. Forces Japan (USFJ) HQ', '730th Air Mobility Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Kunsan AB': {
    'Air Force': ['8th Fighter Wing (F-16CM – Wolf Pack)', 'PACAF Kunsan', '35th Fighter Squadron', '80th Fighter Squadron'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'RAF Mildenhall': {
    'Air Force': ['100th Air Refueling Wing (KC-135 Stratotanker)', 'USAFE-AFAFRICA RAF Mildenhall', '352nd Special Operations Wing (CV-22B, MC-130J)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'RAF Alconbury': {
    'Air Force': ['501st Combat Support Wing', 'USAFE administrative and support units'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'RAF Croughton': {
    'Air Force': ['422nd Air Base Group', 'USAFE communications and intelligence hub'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Andersen AFB (Guam)': {
    'Air Force': ['36th Wing (PACAF)', 'Strategic bomber rotational force (B-52, B-2, B-1)', '734th Air Mobility Squadron', 'Joint Region Marianas Air Component'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Morón AB': {
    'Air Force': ['496th Air Base Squadron', 'USAFE-AFAFRICA Morón', 'Air Mobility Command Atlantic transit hub'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Geilenkirchen NATO Air Base': {
    'Air Force': ['NATO E-3A Component (AWACS)', '700th Munitions Support Squadron (USAF)', 'NATO Air Command & Control'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Lajes Field': {
    'Air Force': ['65th Air Base Wing', 'USAFE-AFAFRICA Lajes', 'Air Mobility Command Atlantic transit hub'],
    Army: [], Navy: [], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── SPACE FORCE (additional) ──────────────────────────────────────────────
  'Los Angeles SFB': {
    'Space Force': ['Space Systems Command (SSC)', 'Space and Missile Systems Center (SMC)', 'Program Executive Office Space Sensing', 'Space Delta 1 (Space Acquisition)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  'Vandenberg Space Force Base': {
    'Space Force': ['Space Launch Delta 30', 'Space Delta 7 (Space Intelligence)', 'Space Missile Systems Center (launch operations)', '30th Space Wing legacy missions'],
    'Air Force': ['30th Space Wing (launch support)'], Army: [], Navy: [], 'Marine Corps': [], 'Coast Guard': [],
  },
  'Patrick SFB': {
    'Space Force': ['Space Launch Delta 45', '45th Space Wing legacy', 'Eastern Range launch operations', 'Space Force Florida support units'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  'Cheyenne Mountain Space Force Station': {
    'Space Force': ['NORAD Space Operations Center', 'Missile Warning', 'USNORTHCOM Space component'],
    'Air Force': ['NORAD/USNORTHCOM operations'], Army: [], Navy: [], 'Marine Corps': [], 'Coast Guard': [],
  },
  'Cavalier Space Force Station': {
    'Space Force': ['21st Space Wing detachment', 'Space Delta 2 element', 'Ground-Based Electro-Optical Deep Space Surveillance (GEODSS)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  'Clear Space Force Station': {
    'Space Force': ['12th Space Warning Squadron', 'Missile warning radar operations', 'Space Delta 4 detachment'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  'Thule Air Base / Pituffik Space Base': {
    'Space Force': ['821st Space Base Group', 'Ballistic Missile Early Warning System (BMEWS)', 'Space Warning Squadron', 'Space Delta 4 element'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Coast Guard': [],
  },
  // ── JOINT BASES (additional) ──────────────────────────────────────────────
  'Joint Base Anacostia-Bolling': {
    'Air Force': ['11th Wing', 'Defense Intelligence Agency HQ', 'Air Force District of Washington'],
    Navy: ['Naval Support Facility Anachosia', 'U.S. Navy Band', 'Office of Naval Intelligence (ONI)'],
    Army: ['Defense Intelligence Agency (DIA)'], 'Marine Corps': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Expeditionary Base Little Creek-Fort Story': {
    Navy: ['Naval Amphibious Base Little Creek', 'SEAL Team 2, 4, 8, 10', 'Naval Special Warfare Command Atlantic', 'Amphibious Construction Battalion 2 (ACB-2)', 'Expeditionary Combat Command'],
    Army: ['11th Transportation Battalion', 'Fort Story Garrison'], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Pentagon': {
    Army: ['Headquarters Department of the Army (HQDA)', 'Army Staff Principals', 'Office of the Secretary of Defense (OSD)'],
    Navy: ['Chief of Naval Operations (CNO) staff', 'Secretary of the Navy (SECNAV) staff'],
    'Marine Corps': ['Commandant of the Marine Corps (CMC) staff'],
    'Air Force': ['Headquarters Air Force (HAF)', 'Chief of Staff of the Air Force staff'],
    'Space Force': ['Chief of Space Operations (CSO) staff'], 'Coast Guard': [],
  },
  'NSA Washington': {
    Navy: ['Naval Support Activity Washington (NSA Washington)', 'Washington Navy Yard', 'Chief of Naval Operations (CNO) support'],
    Army: ['Army Staff (OSD support)'], 'Marine Corps': [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Defense Intelligence Agency (DIA)': {
    Army: ['Defense Intelligence Agency (DIA)', 'Joint Intelligence Support Element'],
    Navy: ['DIA Navy element'], 'Marine Corps': ['DIA Marine element'], 'Air Force': ['DIA Air Force element'],
    'Space Force': [], 'Coast Guard': [],
  },
  'Joint Base Myer-Henderson Hall': {
    Army: ['3rd U.S. Infantry Regiment (The Old Guard)', 'U.S. Army Band (Pershing\'s Own)', 'Military District of Washington'],
    'Marine Corps': ['Marine Barracks Washington (8th & I)', 'Marine Helicopter Squadron One (HMX-1) det'],
    Navy: [], 'Air Force': [], 'Space Force': [], 'Coast Guard': [],
  },
  'Joint Region Marianas': {
    Navy: ['Commander Naval Forces Marianas', 'Naval Base Guam', 'Joint Region Marianas HQ'],
    'Air Force': ['36th Wing elements (Andersen AFB)'],
    'Marine Corps': ['III MEF rotational elements'],
    Army: [], 'Space Force': [], 'Coast Guard': [],
  },
  // ── COAST GUARD (additional sectors, bases, stations) ─────────────────────
  'USCG Training Center Petaluma': {
    'Coast Guard': ['Training Center Petaluma', 'Enlisted specialty training', 'Health services and legal training'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Training Center Yorktown': {
    'Coast Guard': ['Training Center Yorktown', 'Damage Controlman training', 'Marine Safety training', 'Naval Engineering'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Base Alameda': {
    'Coast Guard': ['USCG Base Alameda', 'Maintenance and Logistics Command Pacific', 'National Strike Force Pacific Strike Team'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Base Boston': {
    'Coast Guard': ['USCG Base Boston', 'Sector Boston support', 'Activities Boston'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Base Elizabeth City': {
    'Coast Guard': ['USCG Base Elizabeth City', 'Aircraft Repair and Supply Center (ARSC)', 'Aviation logistics support'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Base Portsmouth': {
    'Coast Guard': ['USCG Base Portsmouth', 'Sector Virginia support', 'Activities Mid-Atlantic'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Base Seattle': {
    'Coast Guard': ['USCG Base Seattle', 'Maintenance and Logistics Command Pacific (det)', 'Sector Puget Sound support'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Boston': {
    'Coast Guard': ['Sector Boston', 'Station Boston', 'Station Gloucester', 'Station Merrimack River'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Jacksonville': {
    'Coast Guard': ['Sector Jacksonville', 'Station Mayport', 'Station Fort Pierce', 'Station Ponce de Leon Inlet'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Miami': {
    'Coast Guard': ['Sector Miami', 'Station Islamorada', 'Station Fort Lauderdale', 'Maritime Drug Law Enforcement Operations'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector San Diego': {
    'Coast Guard': ['Sector San Diego', 'Station San Diego', 'Station Dana Point', 'Maritime Safety and Security Team (MSST)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Los Angeles-Long Beach': {
    'Coast Guard': ['Sector Los Angeles-Long Beach', 'Station Los Angeles', 'Station Two Harbors', 'Maritime Safety and Security Team'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Honolulu': {
    'Coast Guard': ['Sector Honolulu', 'Station Maui', 'Station Hilo', 'Air Station Barbers Point (tenant)'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Virginia': {
    'Coast Guard': ['Sector Virginia', 'Station Cape Charles', 'Station Little Creek', 'Marine Safety Unit Hampton Roads'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector New Orleans': {
    'Coast Guard': ['Sector New Orleans', 'Station Grand Isle', 'Aids to Navigation Team New Orleans', 'Marine Safety Unit Lake Charles'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Houston-Galveston': {
    'Coast Guard': ['Sector Houston-Galveston', 'Station Galveston', 'Station Freeport', 'Marine Safety Unit Port Arthur'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
  'USCG Sector Anchorage': {
    'Coast Guard': ['Sector Anchorage', 'Station Homer', 'Station Juneau (area)', 'Air Station Kodiak support'],
    Army: [], Navy: [], 'Marine Corps': [], 'Air Force': [], 'Space Force': [],
  },
};

const DEMO_PROFILE = {
  firstName: 'Marcus', lastName: 'Thompson',
  branch: 'Army', component: 'Active Duty', paygrade: 'E-7',
  losingInstallation: 'Fort Liberty', gainingInstallation: 'Camp Humphreys',
  departingDate: '2026-06-15',
  unit: '8th Army',
  isOverseas: true, hasDependents: true, hasChildren: true,
  childAges: [14, 11, 8], bedrooms: '4',
  language: 'en', religiousPreference: 'Protestant / Christian',
};

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [losingSearch, setLosingSearch] = useState('');
  const [gainingSearch, setGainingSearch] = useState('');
  const [p, setP] = useState({
    firstName: '', lastName: '', branch: 'Army', component: 'Active Duty', paygrade: 'E-5',
    losingInstallation: '', gainingInstallation: '', departingDate: '', unit: '',
    isOverseas: false, hasDependents: false, hasChildren: false, childAges: [], bedrooms: '3',
    language: 'en', religiousPreference: 'No Preference',
  });

  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const updBranch = (branch) => {
    const newRanks = BRANCH_RANKS[branch] || [];
    const gradeValid = p.paygrade === 'N/A' || newRanks.some(r => r.grade === p.paygrade);
    setP(prev => ({ ...prev, branch, unit: '', paygrade: gradeValid ? prev.paygrade : 'E-5' }));
  };
  const updGaining = (name) => {
    const sel = MILITARY_DUTY_STATIONS.find(s => s.name === name);
    setP(prev => ({ ...prev, gainingInstallation: name, unit: '', isOverseas: sel?.country ? true : false }));
  };

  const theme = BRANCH_THEMES[p.branch];

  const sortByBranch = (items, branch) => {
    const primary = items.filter(b => b.branch === branch || b.branch === 'Joint');
    const others  = items.filter(b => b.branch !== branch && b.branch !== 'Joint');
    return [...primary, ...others];
  };
  const losingSuggestions = losingSearch.length > 1
    ? sortByBranch(
        MILITARY_DUTY_STATIONS.filter(b => b.name.toLowerCase().includes(losingSearch.toLowerCase())),
        p.branch
      ).slice(0, 10)
    : [];
  const gainingSuggestions = gainingSearch.length > 1
    ? sortByBranch(
        MILITARY_DUTY_STATIONS.filter(b => b.name.toLowerCase().includes(gainingSearch.toLowerCase())),
        p.branch
      ).slice(0, 10)
    : [];
  const availableUnits = p.gainingInstallation
    ? (INSTALLATION_UNITS[p.gainingInstallation]?.[p.branch] || [])
    : [];

  const inputSt = {
    width: '100%', fontSize: 14, padding: '11px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)',
    color: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
  };
  const canGo1 = p.firstName && p.branch && p.component;
  const canGo2 = p.gainingInstallation && p.departingDate;

  const SuggestionList = ({ items, onSelect }) => items.length === 0 ? null : (
    <div style={{ marginTop: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 10, maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.12)' }}>
      {items.map(b => (
        <div key={b.name} onClick={() => onSelect(b.name)} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          {b.name} — {b.state} <span style={{ fontSize: 11, color: theme.accent }}>({b.branch})</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: theme.secondary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ padding: 'env(safe-area-inset-top) 0 0', background: theme.secondary }}>
        <div style={{ padding: '20px 16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: '.05em' }}>PCS EXPRESS</div>
          <div style={{ fontSize: 12, color: theme.accent, marginTop: 4 }}>Your move, simplified.</div>
        </div>
        {/* Progress dots */}
        {step >= 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i <= step ? theme.accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '0 16px 24px', overflowY: 'auto' }}>
        <div style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', padding: '20px 16px' }}>

          {/* Demo / preview step */}
          {step === -1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>See PCS Express in Action</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  An E-7 Army soldier with 3 kids managing an overseas move to South Korea — showcasing all app features.
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 10, letterSpacing: '.1em' }}>DEMO PROFILE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Rank', 'E-7 (SFC)'], ['Branch', 'Army'], ['Family', '3 Children'], ['Move', 'OCONUS'], ['From', 'Fort Liberty, NC'], ['To', 'Camp Humphreys, SK']].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => onComplete(DEMO_PROFILE)} style={{ padding: '13px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Launch Demo</button>
                <button onClick={() => setStep(0)} style={{ padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>My Profile</button>
              </div>
            </>
          )}

          {/* Step 0 — Component & Profile */}
          {step === 0 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Component & Profile</div>

              {/* Branch buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {Object.keys(BRANCH_THEMES).map(b => {
                  const t = BRANCH_THEMES[b];
                  const active = p.branch === b;
                  return (
                    <button key={b} onClick={() => updBranch(b)} style={{ padding: '11px 4px', borderRadius: 10, border: `2px solid ${active ? t.accent : 'rgba(255,255,255,0.15)'}`, background: active ? `${t.accent}30` : 'rgba(255,255,255,0.04)', color: active ? t.accent : 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: active ? 800 : 500, cursor: 'pointer', lineHeight: 1.3, textAlign: 'center' }}>
                      {b}
                    </button>
                  );
                })}
              </div>

              {/* Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>FIRST NAME</label>
                  <input value={p.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Jordan" style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>LAST NAME</label>
                  <input value={p.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Rivera" style={inputSt} />
                </div>
              </div>

              {/* Component */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>COMPONENT</label>
                <select value={p.component} onChange={e => {
                  const comp = e.target.value;
                  if (['Spouse', 'Dependent'].includes(comp)) {
                    setP(prev => ({ ...prev, component: comp, paygrade: 'N/A' }));
                  } else {
                    setP(prev => ({ ...prev, component: comp, paygrade: prev.paygrade === 'N/A' ? 'E-5' : prev.paygrade }));
                  }
                }} style={inputSt}>
                  {COMPONENT_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Pay grade */}
              {['Spouse', 'Dependent'].includes(p.component) ? (
                <div style={{ marginBottom: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                  Pay Grade &amp; Rank — N/A ({p.component})
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    PAY GRADE &amp; RANK <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>(optional)</span>
                  </label>
                  <select value={p.paygrade} onChange={e => upd('paygrade', e.target.value)} style={inputSt}>
                    <option value="N/A">N/A — Not Applicable</option>
                    {(BRANCH_RANKS[p.branch] || BRANCH_RANKS['Army']).map(r => (
                      <option key={r.grade} value={r.grade}>{r.grade} – {r.title} ({r.abbr})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Language */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>PREFERRED LANGUAGE</label>
                <select value={p.language} onChange={e => upd('language', e.target.value)} style={inputSt}>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Used for translation services and language-specific resources</div>
              </div>

              <button onClick={() => setStep(-1)} style={{ width: '100%', padding: '10px', marginBottom: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                See Demo First →
              </button>
              <button onClick={() => setStep(1)} disabled={!canGo1} style={{ width: '100%', padding: '13px', borderRadius: 12, background: canGo1 ? theme.accent : 'rgba(255,255,255,0.1)', color: canGo1 ? theme.secondary : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 900, cursor: canGo1 ? 'pointer' : 'not-allowed', fontSize: 14 }}>
                Continue →
              </button>
            </>
          )}

          {/* Step 1 — Bases & Unit */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Your Bases & Unit</div>

              {/* Losing installation */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>DEPARTING FROM (LOSING INSTALLATION)</label>
                <input
                  value={losingSearch || p.losingInstallation}
                  onChange={e => { setLosingSearch(e.target.value); upd('losingInstallation', e.target.value); }}
                  placeholder="Type base name..."
                  style={inputSt}
                />
                <SuggestionList items={losingSuggestions} onSelect={name => { upd('losingInstallation', name); setLosingSearch(''); }} />
              </div>

              {/* Gaining installation */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>REPORTING TO (GAINING INSTALLATION)</label>
                <input
                  value={gainingSearch || p.gainingInstallation}
                  onChange={e => { setGainingSearch(e.target.value); updGaining(e.target.value); }}
                  placeholder="Type base name..."
                  style={inputSt}
                />
                <SuggestionList items={gainingSuggestions} onSelect={name => { updGaining(name); setGainingSearch(''); }} />
                {p.isOverseas && <div style={{ marginTop: 5, fontSize: 11, color: theme.accent, fontWeight: 700 }}>🌏 OCONUS — Overseas move detected</div>}
              </div>

              {/* Departing date */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>DEPARTING DATE</label>
                <input type="date" value={p.departingDate} onChange={e => upd('departingDate', e.target.value)} style={{ ...inputSt, colorScheme: 'dark' }} />
              </div>

              {/* Unit assignment */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                  UNIT ASSIGNMENT{p.gainingInstallation ? ` AT ${p.gainingInstallation.toUpperCase()}` : ''}
                </label>
                <select value={p.unit} onChange={e => upd('unit', e.target.value)} style={inputSt} disabled={!p.gainingInstallation}>
                  <option value="">{p.gainingInstallation ? 'Select unit...' : 'Select a gaining installation first'}</option>
                  {availableUnits.length > 0
                    ? availableUnits.map(u => <option key={u} value={u}>{u}</option>)
                    : p.gainingInstallation && <option value="" disabled>No {p.branch} units listed — enter manually below</option>
                  }
                </select>
                {p.gainingInstallation && availableUnits.length === 0 && (
                  <div>
                    <input value={p.unit} onChange={e => upd('unit', e.target.value)} placeholder="Enter unit name manually..." style={{ ...inputSt, marginTop: 8 }} />
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(p.branch + ' units at ' + p.gainingInstallation)}`, '_blank')}
                      style={{ marginTop: 8, width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                    >
                      🔍 Search Google for {p.branch} units at {p.gainingInstallation} →
                    </button>
                  </div>
                )}
                {availableUnits.length > 0 && <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{availableUnits.length} {p.branch} unit{availableUnits.length !== 1 ? 's' : ''} available</div>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(2)} disabled={!canGo2} style={{ flex: 1, padding: '13px', borderRadius: 12, background: canGo2 ? theme.accent : 'rgba(255,255,255,0.1)', color: canGo2 ? theme.secondary : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 900, cursor: canGo2 ? 'pointer' : 'not-allowed', fontSize: 14 }}>Continue →</button>
              </div>
            </>
          )}

          {/* Step 2 — Family, Religion & Housing */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Family & Preferences</div>

              {/* Toggles */}
              {[['hasDependents', 'Spouse / Dependents traveling with me'], ['hasChildren', 'I have children']].map(([key, label]) => (
                <div key={key} onClick={() => upd(key, !p[key])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p[key] ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p[key] ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p[key] ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p[key] ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p[key] && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{label}</div>
                </div>
              ))}

              {/* Children ages */}
              {p.hasChildren && (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>CHILDREN'S AGES</label>
                    <button onClick={() => upd('childAges', [...p.childAges, ''])} style={{ padding: '5px 12px', borderRadius: 8, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ Add Child</button>
                  </div>
                  {p.childAges.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '6px 0' }}>No children added yet</div>}
                  {p.childAges.map((age, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 60 }}>Child {idx + 1}</div>
                      <input type="number" min="0" max="25" value={age} onChange={e => { const a = [...p.childAges]; a[idx] = e.target.value; upd('childAges', a); }} placeholder="Age" style={{ ...inputSt, width: 80, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>yrs</span>
                      <button onClick={() => upd('childAges', p.childAges.filter((_, i) => i !== idx))} style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 7, background: 'rgba(255,80,80,0.2)', border: '1px solid rgba(255,80,80,0.35)', color: '#FF8080', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bedrooms */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>BEDROOMS NEEDED</label>
                <select value={p.bedrooms} onChange={e => upd('bedrooms', e.target.value)} style={inputSt}>
                  {['N/A', '1', '2', '3', '4', '5+'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              {/* Religious preference */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                  RELIGIOUS PREFERENCE <span style={{ fontWeight: 400, opacity: 0.55, fontSize: 10 }}>(for chaplain & community resources)</span>
                </label>
                <select value={p.religiousPreference} onChange={e => upd('religiousPreference', e.target.value)} style={inputSt}>
                  {RELIGIOUS_PREFERENCES.map(r => <option key={r}>{r}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Stored locally only — helps surface relevant chapel and community resources</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={() => onComplete({
                    ...p,
                    childAges: p.childAges.filter(a => a !== '' && !isNaN(Number(a))).map(Number),
                    childrenAges: p.childAges.filter(a => a !== '' && !isNaN(Number(a))).map(Number).join(', '),
                  })}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}
                >
                  Build My PCS Plan ✦
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState(() => store.get('pcs_profile'));
  const [activeTab, setActiveTab] = useState('home');
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [checklistItems, setChecklistItems] = useState(() => {
    return readLegacyJson('pcs_checklist_checks', {});
  });
  const [demoTip, setDemoTip] = useState(() => {
    const p = store.get('pcs_profile');
    return (p?.firstName === 'Marcus' && p?.lastName === 'Thompson') ? 0 : -1;
  });
  const [screenW, setScreenW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 480);
  useEffect(() => {
    const handler = () => setScreenW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => {
    secureLocalStore.get('pcs_profile', null).then(saved => {
      if (saved) setProfile(saved);
    });
    secureLocalStore.get('pcs_checklist_checks', null).then(saved => {
      if (saved) setChecklistItems(saved);
    });
  }, []);
  const isDesktop = screenW >= 900;
  // isNative is true only inside the Capacitor iOS/Android shell — never in a web browser
  const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

  const theme = profile ? BRANCH_THEMES[profile.branch] : BRANCH_THEMES.Army;

  // Compute pending alerts based on departure date and checklist completion
  const daysUntilDeparture = profile?.departingDate ? getDaysUntilDeparture(profile.departingDate) : null;
  const pendingAlerts = profile?.departingDate
    ? Object.entries(PHASE_WINDOWS)
        .filter(([phase, win]) => {
          if (daysUntilDeparture === null || daysUntilDeparture > win.activeAt) return false;
          const tasks = PCS_CHECKLIST[phase] || [];
          return tasks.some((_, i) => !checklistItems[`${phase}-${i}`]);
        })
        .map(([phase, win]) => ({
          phase,
          overdue: daysUntilDeparture < win.overdueAt,
          daysUntil: daysUntilDeparture,
          count: (PCS_CHECKLIST[phase] || []).filter((_, i) => !checklistItems[`${phase}-${i}`]).length,
        }))
    : [];
  const overdueCount = pendingAlerts.filter(a => a.overdue).length;
  const alertCount = pendingAlerts.length;

  // Close nav/notifs on tab change
  const goTo = (tab) => {
    setActiveTab(tab);
    setNavOpen(false);
    setShowNotifs(false);
  };

  if (!profile) {
    return <Onboarding onComplete={(p) => {
      setProfile(p);
      store.set('pcs_profile', p);
      if (p?.firstName === 'Marcus' && p?.lastName === 'Thompson') setDemoTip(0);
    }} />;
  }

  const DEMO_TIPS = [
    // ── Home ──────────────────────────────────────────────────────────────────
    { tab: 'home',       title: 'Home — Dashboard',
      body: 'Your mission command center. See your departure countdown, current PCS phase, gaining installation, and a quick-access summary of your most important tasks. Everything starts here.' },

    // ── PCS Checklist ─────────────────────────────────────────────────────────
    { tab: 'checklist',  title: 'PCS Checklist — Overview',
      body: 'Six sequential phases guide you from orders to settling in: Orders Received → 90 Days Out → 60 Days Out → 30 Days Out → Move Week → In-Processing. Each phase contains actionable tasks you check off as you complete them.' },
    { tab: 'checklist',  title: 'PCS Checklist — Task Phases',
      body: 'Overdue tasks turn red so nothing slips. Tasks in the active phase are highlighted. Your progress is saved automatically on your device. Tap any task to mark it complete — progress carries across sessions.' },

    // ── PCS Documents ─────────────────────────────────────────────────────────
    { tab: 'documents',  title: 'PCS Documents — Overview',
      body: 'Upload, store, and track every PCS-required document in one secure place. Documents are organized into 7 categories: Orders, Travel & Finance, Household Goods, Housing, Medical, Family & Admin, and OCONUS (shown only for overseas assignments).' },
    { tab: 'documents',  title: 'PCS Documents — Orders & Travel',
      body: 'The Orders category holds your official PCS orders, amendment/endorsements, and authorization paperwork. Travel & Finance covers your travel voucher, DPS access, per diem authorization, and TLE/TLA approval — everything needed for reimbursement.' },
    { tab: 'documents',  title: 'PCS Documents — Household Goods',
      body: 'Track DD Form 1299 (HHG shipment application), weight tickets, DD 1840 inventory and condition report, POV shipment authorization, and pro-gear list. Every HHG document needed to protect your move and file claims lives here.' },
    { tab: 'documents',  title: 'PCS Documents — Housing & Medical',
      body: 'Housing stores your BAH authorization, on-post housing application, and SCRA lease termination notice. Medical stores SF 600/SF 603 records transfer, immunization records for you and family, and your TRICARE enrollment update.' },
    { tab: 'documents',  title: 'PCS Documents — Family, Admin & OCONUS',
      body: 'Family & Admin holds birth certificates, marriage certificate, school records, passports, and DEERS enrollment. OCONUS documents — SOFA agreements, Status of Forces briefing, country-specific visa paperwork — appear automatically when your gaining installation is overseas.' },
    { tab: 'documents',  title: 'PCS Documents — Branch-Specific Docs',
      body: 'In addition to universal requirements, PCS Documents shows forms specific to your branch: Army (DA 31, DA 137-1/2, DA 5960), Navy (NAVPERS 1300/16), Marine Corps (CMC orders, MCO 4600.39), Air Force (AF Form 907, vMPF), Space Force (Guardian Development Plan), and Coast Guard (CG-3103).' },

    // ── Military Orders ───────────────────────────────────────────────────────
    { tab: 'orders',     title: 'Military Orders — Upload & Extract',
      body: 'Upload your PCS orders PDF and AI automatically extracts your report date, gaining unit, and installation. Your departure countdown and phase timeline update immediately — keeping every section of the app in sync.' },

    // ── Schools ───────────────────────────────────────────────────────────────
    { tab: 'schools',    title: 'Schools & Childcare',
      body: 'Find K-12 schools, DoDEA schools, and child development centers near your gaining installation. Filter by your children\'s grade levels, sort by rating, or search by zip code for schools near off-post housing. Each listing links directly to the school\'s website.' },

    // ── Navigation ────────────────────────────────────────────────────────────
    { tab: 'nav',        title: 'Navigation — Turn-by-Turn Directions',
      body: 'Plan your PCS drive with real turn-by-turn routing powered by OSRM. Enter any origin and destination to get step-by-step directions, estimated drive time, and total mileage — useful for calculating PCS mileage reimbursement.' },
    { tab: 'nav',        title: 'Navigation — Popular Routes & Saved',
      body: 'Popular Routes shows common PCS drive corridors between major installations. Save any set of directions to the Saved Directions tab so you can reference them offline without re-entering your route.' },
    { tab: 'nav',        title: 'Navigation — Base Map',
      body: 'The Base Map tab displays an interactive Leaflet map of your gaining installation showing key on-post facilities: main gate, housing office, finance, medical, PX/commissary, and more. Zoom, tap, and explore before you arrive.' },

    // ── Veterans ──────────────────────────────────────────────────────────────
    { tab: 'veterans',   title: 'Veteran-Owned Businesses',
      body: 'Discover veteran-owned businesses near your gaining installation. Filter by category (restaurants, services, retail, and more). National directories from the SBA Veteran Business Outreach Center and Hire Heroes USA are always listed below local results.' },

    // ── Employment ────────────────────────────────────────────────────────────
    { tab: 'employment', title: 'Employment — Skills Profile',
      body: 'Build your skills profile in the Skills Profile tab. Add your military skills, certifications, and experience. This profile powers the AI job matching engine used in the Recommendations tab.' },
    { tab: 'employment', title: 'Employment — Job Search',
      body: 'The Job Search tab lets you filter open positions by industry (technology, healthcare, logistics, finance, and more). Results tailor to skills you\'ve added in your profile — browse by industry to find the best fit.' },
    { tab: 'employment', title: 'Employment — Recommendations',
      body: 'The Recommendations tab uses AI to translate your MOS and military skills into civilian career paths. Review skill-matched job titles, required credentials, and salary benchmarks to identify the best post-military career opportunities.' },
    { tab: 'employment', title: 'Employment — Resume Analyzer',
      body: 'Upload your resume in the Resume tab for AI-powered analysis. Receive actionable feedback on clarity, keyword optimization, and civilian translation of military jargon. The analyzer scores your resume and suggests specific improvements.' },
    { tab: 'employment', title: 'Employment — Job Boards',
      body: 'The Job Boards tab links directly to USAJobs.gov (federal civilian with veteran preference), Hire Heroes USA, My Next Move for Veterans (MOS translator), MySECO for military spouses, MSEP employer network, and Transition GPS (TAP).' },

    // ── Education ─────────────────────────────────────────────────────────────
    { tab: 'education',  title: 'Education — GI Bill Chapters',
      body: 'The GI Bill Chapters tab compares all four chapters side by side: Post-9/11 (Ch.33), Montgomery GI Bill (Ch.30), Survivors\' & Dependents\' Education Assistance (Ch.35), and Montgomery GI Bill Selected Reserve (Ch.1606). Eligibility and benefit amounts summarized for each.' },
    { tab: 'education',  title: 'Education — How to Apply',
      body: 'The How to Apply tab walks through the 5-step VA GI Bill application process: filing VA Form 22-1990, receiving your Certificate of Eligibility, notifying your School Certifying Official, understanding your BAH rate, and tracking remaining entitlement.' },
    { tab: 'education',  title: 'Education — Colleges Near Base',
      body: 'The Colleges tab lists universities, community colleges, and vocational schools near your gaining installation — with ratings, degree types, descriptions, and direct application links. All schools note whether Tuition Assistance and GI Bill are accepted.' },
    { tab: 'education',  title: 'Education — Find Schools',
      body: 'The Find Schools tab is a searchable directory of accredited institutions near any installation. Filter by degree type (2-year, 4-year, vocational) and sort by rating to narrow your search.' },
    { tab: 'education',  title: 'Education — MyCAA (Military Spouses)',
      body: 'The MyCAA tab covers the Military Spouse Career Advancement Accounts scholarship: up to $4,000/year (max $16,000 total) for spouses of E-1 to O-2 service members pursuing portable career credentials. Eligibility rules, covered programs, and the 5-step application are all explained.' },

    // ── Deployment Support ────────────────────────────────────────────────────
    { tab: 'spouse',     title: 'Deployment Support Guide',
      body: 'Four essential preparation sections for military spouses and families: Legal & Financial Preparation (POA, will, family budget), Mental Health & Resilience (counseling, stress management), Family & Children (childcare, school support), and Household Management. Each section has step-by-step tasks with deadlines and external links.' },

    // ── Faith ─────────────────────────────────────────────────────────────────
    { tab: 'religion',   title: 'Faith & Spiritual Resources',
      body: 'Chapel service listings near your installation filtered to your faith preference set during onboarding — Protestant, Catholic, Jewish, Islamic, and more. Overseas assignments include host-nation chapel information. Counseling and spiritual care resources from ACS and Military OneSource are always available.' },

    // ── Translation ───────────────────────────────────────────────────────────
    { tab: 'translation', title: 'Translation — AI Translator',
      body: 'The Translate tab supports 20 languages — German, Japanese, Korean, Italian, Spanish, French, Polish, Turkish, Arabic, Thai, and more. Type any English text, select your target language, and get an AI-powered translation in seconds. Every translation is automatically saved for offline reference.' },
    { tab: 'translation', title: 'Translation — Common Military Phrases',
      body: 'The Common Phrases tab gives you pre-translated military life phrases in all 20 languages across 6 categories: Emergency & Safety, Housing & Landlord, Shopping & Daily Life, Medical & Pharmacy, School & Childcare, and Transportation. One-tap copy sends any phrase to your clipboard.' },
    { tab: 'translation', title: 'Translation — Saved Translations',
      body: 'Every AI translation you make is saved automatically to the Saved tab — accessible without a connection. View original text, translation, language, and timestamp. One tap copies any saved translation. Useful for repeating critical phrases with local landlords, medical staff, or school officials.' },

    // ── Resources: each section ───────────────────────────────────────────────
    { tab: 'resources',  title: 'Resources — Healthcare',
      body: 'The Healthcare section links to all TRICARE portals: TRICARE.mil, TRICARE Online, TRICARE 4U (claims/EOBs), TRICARE for Life, Dental Program (TDP), TRICARE Overseas/TOP, Pharmacy via Express Scripts, Humana Military (TRICARE East), My MHS GENESIS patient portal, and VA Health Care.' },
    { tab: 'resources',  title: 'Resources — Military Portals',
      body: 'Direct links to official DoD personnel systems: ARBA ACTS (Army records appeals), Army TAP Portal (transition scheduling), HRC iPERMS (official Army records), HRC Portal (assignments & promotions), IPPS-A (pay & personnel actions), milSuite MIP, and milConnect (DMDC — benefits & DEERS updates for all branches).' },
    { tab: 'resources',  title: 'Resources — Family Support',
      body: 'Family Support links to Military OneSource (24/7 counseling and referrals), Military Child Education Coalition (school transition), Operation Homefront (emergency financial assistance), Blue Star Families, and your branch-specific family readiness center (ACS, Fleet & Family Support, Airman & Family Readiness Center).' },
    { tab: 'resources',  title: 'Resources — Financial',
      body: 'Financial links to myPay (DFAS pay management), BAH Calculator, VA Benefits Explorer, Military Saves (financial readiness), Blended Retirement System calculator, and SCRA protections (interest rate caps, lease termination, foreclosure protection for all service members).' },
    { tab: 'resources',  title: 'Resources — PCS & Housing',
      body: 'PCS & Housing links to Move.mil / DPS (schedule and track your HHG shipment), Military Installations (on-post housing and facilities), the Housing Network, SCRA Lease Termination guidance, and VA Home Loan (zero-down home loan for eligible service members and veterans).' },
    { tab: 'resources',  title: 'Resources — Education',
      body: 'Education links to VA GI Bill (apply and check entitlement), MyCAA Scholarships (spouse career funding), Tuition Assistance for your specific branch (up to $4,500/year), DANTES/DSST free college-level exams, and DoDEA Schools for military children worldwide.' },
    { tab: 'resources',  title: 'Resources — Careers',
      body: 'Careers links to USAJobs.gov (federal civilian jobs with veteran preference), Hire Heroes USA (free resume coaching and placement), My Next Move for Veterans (MOS to civilian career translator), MySECO (spouse career opportunities), Military Spouse Employment Partnership, MyCAA scholarships, and Transition GPS (TAP).' },
    { tab: 'immigration', title: 'Permanent Resident & Naturalization',
      body: 'Official USCIS guidance for military spouses: a 9-step green card guide (I-130, I-485, Parole in Place), 6-step citizenship path (3-year military spouse benefit, N-400, civics test), and 7 free military legal resources including your installation JAG office and the USCIS Military Help Line. Includes a full 19-item USCIS requirements checklist with direct links.' },

    // ── End ───────────────────────────────────────────────────────────────────
    { tab: 'home',       title: 'Tour Complete — Ready to PCS!',
      body: 'You\'ve seen everything PCS Express has to offer. Every tab, every category, every resource — all here to support your move and your family. Navigate any section from the menu at any time. Thank you for your service. Hooah!' },
  ];

  const BOTTOM_NAV = [
    { id: 'home',        label: 'Home',          icon: 'HQ',  iosIcon: '🏠' },
    { id: 'checklist',   label: 'Checklist',     icon: 'PCK', iosIcon: '✅' },
    { id: 'documents',   label: 'Documents',     icon: 'DOC', iosIcon: '📁' },
    { id: 'orders',      label: 'Orders',        icon: 'ORD', iosIcon: '📋' },
    { id: 'schools',     label: 'Schools',       icon: 'SCH', iosIcon: '🎓' },
    { id: 'nav',         label: 'Navigation',    icon: 'NAV', iosIcon: '🗺️' },
    { id: 'veterans',    label: 'Veterans',      icon: 'VET', iosIcon: '⭐' },
    { id: 'employment',  label: 'Employment',    icon: 'EMP', iosIcon: '💼' },
    { id: 'education',   label: 'Education',     icon: 'EDU', iosIcon: '📚' },
    { id: 'spouse',      label: 'Deployment',    icon: 'DEP', iosIcon: '🪖' },
    { id: 'religion',    label: 'Faith',         icon: 'CHP', iosIcon: '⛪' },
    { id: 'translation', label: 'Translate',     icon: 'TRL', iosIcon: '🌐' },
    { id: 'immigration', label: 'Perm. Resident', icon: 'IMM', iosIcon: '🏛️' },
    { id: 'resources',   label: 'Resources',     icon: 'RES', iosIcon: '🔗' },
  ];

  // iOS bottom tab bar: 4 primary + More button
  const IOS_TAB_BAR = [
    { id: 'home',       label: 'Home',      iosIcon: '🏠' },
    { id: 'checklist',  label: 'Checklist', iosIcon: '✅' },
    { id: 'orders',     label: 'Orders',    iosIcon: '📋' },
    { id: 'resources',  label: 'Resources', iosIcon: '🔗' },
  ];

  const currentLabel = BOTTOM_NAV.find(n => n.id === activeTab)?.label || 'Home';

  if (activeTab === 'translation') {
    return (
      <div style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: '#f0f4f8', fontFamily: 'system-ui', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
        {isDesktop && (
          <div style={{ width: 230, background: theme.secondary, display: 'flex', flexDirection: 'column', minHeight: '100dvh', borderRight: `2px solid ${theme.accent}30`, flexShrink: 0 }}>
            <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
              <div style={{ fontSize: 9, letterSpacing: '.18em', color: theme.accent, fontWeight: 900, marginBottom: 2 }}>PCS EXPRESS</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: theme.accent, letterSpacing: '-1px', lineHeight: 1 }}>{theme.insignia || theme.abbr}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)} style={{ width: '100%', padding: '10px 16px', background: activeTab === item.id ? `${theme.accent}20` : 'transparent', border: 'none', borderLeft: `3px solid ${activeTab === item.id ? theme.accent : 'transparent'}`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: activeTab === item.id ? 800 : 600, textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ width: 32, height: 24, borderRadius: 5, background: activeTab === item.id ? `${theme.accent}30` : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, letterSpacing: '.06em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{item.icon}</div>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setProfile(null); store.set('pcs_profile', null); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.1)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,100,100,0.85)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Reset / Re-onboard</button>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: theme.secondary, paddingTop: isNative ? 'env(safe-area-inset-top)' : 0, paddingLeft: 16, paddingRight: 16, paddingBottom: 12, borderBottom: `1px solid ${theme.accent}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isDesktop && <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '2px 4px' }}>←</button>}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Translation</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom))' : 0 }}>
            <TranslationModule theme={theme} profile={profile} />
          </div>
        </div>
        {/* iOS bottom tab bar on translation route */}
        {isNative && !isDesktop && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 310, background: theme.secondary, borderTop: `1px solid ${theme.accent}35`, display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {IOS_TAB_BAR.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} style={{ flex: 1, minHeight: 49, padding: '6px 2px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
                <span style={{ fontSize: 22, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(40%) opacity(0.55)' }}>{item.iosIcon}</span>
                <span style={{ fontSize: 10, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.5)', letterSpacing: '.02em', lineHeight: 1 }}>{item.label}</span>
              </button>
            ))}
            <button onClick={() => setMoreOpen(o => !o)} style={{ flex: 1, minHeight: 49, padding: '6px 2px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
              <span style={{ fontSize: 22, lineHeight: 1, color: moreOpen ? theme.accent : 'rgba(255,255,255,0.55)', fontWeight: 900, letterSpacing: '-2px' }}>•••</span>
              <span style={{ fontSize: 10, fontWeight: moreOpen ? 800 : 600, color: moreOpen ? theme.accent : 'rgba(255,255,255,0.5)', letterSpacing: '.02em', lineHeight: 1 }}>More</span>
            </button>
          </div>
        )}
        {isNative && !isDesktop && moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 311, background: 'rgba(0,0,0,0.45)' }} />
            <div style={{ position: 'fixed', bottom: `calc(49px + env(safe-area-inset-bottom))`, left: 0, right: 0, zIndex: 312, background: theme.secondary, borderRadius: '20px 20px 0 0', borderTop: `2px solid ${theme.accent}60`, paddingTop: 8, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: '0 12px' }}>
                {BOTTOM_NAV.map(item => (
                  <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} style={{ padding: '10px 4px 8px', background: activeTab === item.id ? `${theme.accent}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTab === item.id ? theme.accent + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{item.iosIcon}</span>
                    <span style={{ fontSize: 9, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {/* INTERACTIVE DEMO TOUR OVERLAY — must be present in the translation early-return path */}
        {demoTip >= 0 && demoTip < DEMO_TIPS.length && (
          <div style={{ position: 'fixed', bottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom) + 12px)' : 'calc(24px + env(safe-area-inset-bottom))', left: isDesktop ? 230 : 0, right: 0, maxWidth: isDesktop ? '100%' : 480, margin: isDesktop ? 0 : '0 auto', padding: '0 12px', zIndex: 350 }}>
            <div style={{ background: theme.secondary, borderRadius: 16, padding: '16px', border: `2px solid ${theme.accent}`, boxShadow: '0 -4px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ background: theme.accent, borderRadius: 10, padding: '2px 10px', fontSize: 10, fontWeight: 900, color: theme.secondary }}>
                  DEMO TOUR {demoTip + 1} / {DEMO_TIPS.length}
                </div>
                <button onClick={() => setDemoTip(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>Skip ✕</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>{DEMO_TIPS[demoTip].title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 14 }}>{DEMO_TIPS[demoTip].body}</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, justifyContent: 'center' }}>
                {DEMO_TIPS.map((_, i) => (
                  <div key={i} onClick={() => { setDemoTip(i); goTo(DEMO_TIPS[i].tab); }} style={{ width: i === demoTip ? 20 : 6, height: 6, borderRadius: 3, background: i <= demoTip ? theme.accent : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all .2s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {demoTip > 0 && (
                  <button onClick={() => { const prev = demoTip - 1; setDemoTip(prev); goTo(DEMO_TIPS[prev].tab); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                )}
                {demoTip < DEMO_TIPS.length - 1 ? (
                  <button onClick={() => { const next = demoTip + 1; setDemoTip(next); goTo(DEMO_TIPS[next].tab); }} style={{ flex: 2, padding: '10px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                    Next: {DEMO_TIPS[demoTip + 1].title.split('!')[0]} →
                  </button>
                ) : (
                  <button onClick={() => setDemoTip(-1)} style={{ flex: 2, padding: '10px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
                    Thank You for Your Service! ✦
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: '#f0f4f8', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER — paddingTop uses env(safe-area-inset-top) for notch/Dynamic Island.
          Requires viewport-fit=cover in the HTML meta and contentInsetAdjustmentBehavior=never
          in capacitor.config.json to receive non-zero values from the OS. */}
      <div style={{ background: theme.secondary, paddingTop: isNative ? 'env(safe-area-inset-top)' : 0, position: 'sticky', top: 0, zIndex: 100, borderBottom: `2px solid ${theme.accent}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDesktop && <div style={{ fontSize: 22, fontWeight: 900, color: theme.accent, letterSpacing: '-1px' }}>{theme.insignia || theme.abbr}</div>}
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: theme.accent, fontWeight: 900 }}>PCS EXPRESS</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{profile.firstName} · {isDesktop ? profile.branch : currentLabel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {alertCount > 0 && (
              <button onClick={() => { setShowNotifs(o => !o); setNavOpen(false); }} style={{ position: 'relative', background: showNotifs ? `${theme.accent}30` : overdueCount > 0 ? 'rgba(229,57,53,0.2)' : 'none', border: `1px solid ${overdueCount > 0 ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.25)'}`, color: '#fff', fontSize: 15, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, lineHeight: 1 }}>
                🔔
                <span style={{ position: 'absolute', top: -5, right: -5, background: overdueCount > 0 ? '#E53935' : theme.accent, color: overdueCount > 0 ? '#FFF' : theme.secondary, fontSize: 9, fontWeight: 900, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {overdueCount > 0 ? overdueCount : alertCount}
                </span>
              </button>
            )}
            {!isDesktop && !isNative && (
              <button onClick={() => { setNavOpen(o => !o); setShowNotifs(false); }} style={{ background: navOpen ? `${theme.accent}30` : 'none', border: `1px solid rgba(255,255,255,0.25)`, color: '#fff', fontSize: 16, cursor: 'pointer', padding: '6px 11px', borderRadius: 8, lineHeight: 1, fontWeight: 700 }}>
                {navOpen ? '✕' : '☰'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SLIDE-DOWN NAV DRAWER — web mobile only (iOS native uses bottom tab bar instead) */}
      {!isDesktop && !isNative && navOpen && (
        <div style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: 0, right: 0, maxWidth: 480, margin: '0 auto', zIndex: 200, background: theme.secondary, borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {BOTTOM_NAV.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} style={{ padding: '12px 4px', background: activeTab === item.id ? `${theme.accent}25` : 'transparent', border: 'none', borderBottom: `1px solid rgba(255,255,255,0.07)`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                <div style={{ width: 38, height: 28, borderRadius: 6, background: activeTab === item.id ? `${theme.accent}30` : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.6)', border: activeTab === item.id ? `1px solid ${theme.accent}60` : '1px solid rgba(255,255,255,0.1)' }}>{item.icon}</div>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setProfile(null); store.set('pcs_profile', null); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.15)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,100,100,0.9)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            Reset / Re-onboard
          </button>
        </div>
      )}

      {/* Notification dropdown */}
      {showNotifs && pendingAlerts.length > 0 && (
        <div style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: isDesktop ? 230 : 0, right: 0, maxWidth: isDesktop ? '100%' : 480, margin: isDesktop ? 0 : '0 auto', zIndex: 200, background: '#FFFFFF', borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821' }}>
              {overdueCount > 0 ? `${overdueCount} Overdue Action${overdueCount !== 1 ? 's' : ''}` : 'Pending Actions'}
            </div>
            <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#888' }}>✕</button>
          </div>
          {pendingAlerts.map((alert, i) => (
            <div key={i} onClick={() => { goTo('checklist'); }} style={{ padding: '12px 16px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: alert.overdue ? '#FFF5F5' : '#FFFDE7' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{alert.overdue ? '⚠️' : '📋'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: alert.overdue ? '#C62828' : '#E65100' }}>
                  {alert.overdue ? 'OVERDUE: ' : 'Due Now: '}{alert.phase}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                  {alert.count} task{alert.count !== 1 ? 's' : ''} remaining · {alert.daysUntil < 0 ? `${Math.abs(alert.daysUntil)}d past departure` : `${alert.daysUntil}d until departure`}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#AAA' }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop to close nav/notifs/more sheet */}
      {(navOpen || showNotifs) && <div onClick={() => { setNavOpen(false); setShowNotifs(false); }} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent' }} />}

      {/* BODY: sidebar (desktop) + content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop persistent sidebar */}
        {isDesktop && (
          <div style={{ width: 230, background: theme.secondary, display: 'flex', flexDirection: 'column', borderRight: `2px solid ${theme.accent}25`, flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName} {profile.lastName}</div>
              {profile.gainingInstallation && <div style={{ fontSize: 10, color: theme.accent, fontWeight: 700 }}>{profile.gainingInstallation.split(',')[0]}</div>}
            </div>
            <div style={{ flex: 1, padding: '6px 0' }}>
              {BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)} style={{ width: '100%', padding: '9px 14px', background: activeTab === item.id ? `${theme.accent}18` : 'transparent', border: 'none', borderLeft: `3px solid ${activeTab === item.id ? theme.accent : 'transparent'}`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.72)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: activeTab === item.id ? 800 : 500, textAlign: 'left' }}>
                  <div style={{ width: 30, height: 22, borderRadius: 5, background: activeTab === item.id ? `${theme.accent}28` : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, letterSpacing: '.05em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.55)', flexShrink: 0 }}>{item.icon}</div>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setProfile(null); store.set('pcs_profile', null); }} style={{ width: '100%', padding: '9px', background: 'rgba(255,0,0,0.08)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,100,100,0.8)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Reset / Re-onboard</button>
          </div>
        )}

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}>
        {activeTab === 'home' && (
          <div style={{ padding: '16px', position: 'relative' }}>
            <PublicDataNotice theme={theme} compact />
            <LocalEncryptedDataNotice theme={theme} compact />
            {/* Branch Hero Banner */}
            <div style={{ background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%)`, borderRadius: 16, padding: '20px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden', border: `1px solid ${theme.accent}40`, boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
              {/* Background branch acronym watermark */}
              <div style={{ position: 'absolute', right: -8, bottom: -12, fontSize: 90, fontWeight: 900, opacity: 0.07, userSelect: 'none', pointerEvents: 'none', color: theme.accent, letterSpacing: '-4px', lineHeight: 1 }}>
                {theme.insignia || theme.abbr}
              </div>
              {/* Branch label */}
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.22em', color: theme.accent, marginBottom: 4, textTransform: 'uppercase' }}>
                UNITED STATES {profile.branch.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: `${theme.accent}CC`, fontStyle: 'italic', marginBottom: 12 }}>{theme.tagline}</div>
              {/* Soldier info */}
              <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
                {getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName} {profile.lastName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {profile.gainingInstallation ? `Reporting to: ${profile.gainingInstallation}` : 'Set gaining installation in onboarding'}
              </div>
              {/* Accent bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: theme.accent, borderRadius: '16px 0 0 16px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { abbr: 'PCK', label: 'PCS Checklist',   id: 'checklist', color: '#1565C0' },
                { abbr: 'ORD', label: 'Orders',           id: 'orders',    color: '#2E7D32' },
                { abbr: 'EMP', label: 'Employment',       id: 'employment',color: '#4A5E2A' },
                { abbr: 'SCH', label: 'Schools',          id: 'schools',   color: '#7B1FA2' },
                { abbr: 'VET', label: 'Vet Owned Biz',    id: 'veterans',  color: '#E65100' },
                { abbr: 'EDU', label: 'Education',        id: 'education', color: '#1565C0' },
                { abbr: 'CHP', label: 'Faith',            id: 'religion',  color: '#37474F' },
                { abbr: 'DEP', label: 'Deployment Guide', id: 'spouse',    color: '#F57F17' },
                { abbr: 'NAV', label: 'Navigation',       id: 'nav',       color: '#00695C' },
                { abbr: 'RES', label: 'Resources',        id: 'resources', color: '#C62828' },
                { abbr: 'TRL', label: 'Translate',        id: 'translation',color: '#1976D2' },
                { abbr: 'IMM', label: 'Perm. Resident',   id: 'immigration',color: '#0D47A1' },
              ].map((item) => (
                <div key={item.id} onClick={() => goTo(item.id)} style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 42, height: 30, borderRadius: 8, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${item.color}25` }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: item.color, letterSpacing: '.06em' }}>{item.abbr}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1821', lineHeight: 1.2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Quick profile summary */}
            <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginTop: 16, color: '#FFF' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 8 }}>YOUR PROFILE</div>
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div>Branch: {profile.branch} · {getRankDisplay(profile.branch, profile.paygrade)} ({profile.paygrade})</div>
                {profile.gainingInstallation && <div>Gaining: {profile.gainingInstallation}</div>}
                {profile.departingDate && <div>Depart: {profile.departingDate}</div>}
                {profile.religiousPreference && profile.religiousPreference !== 'Prefer not to say' && <div>Faith: {profile.religiousPreference}</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && <ChecklistTab theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />}
        {activeTab === 'documents' && <PCSDocumentsModule theme={theme} profile={profile} />}
        {activeTab === 'orders' && <OrdersTab theme={theme} profile={profile} />}
        {activeTab === 'schools' && <SchoolsTab theme={theme} profile={profile} />}
        {activeTab === 'veterans' && <VeteranBusinessesTab theme={theme} profile={profile} />}
        {activeTab === 'employment' && <EmploymentModule theme={theme} profile={profile} />}
        {activeTab === 'education' && <EducationBenefitsTab theme={theme} profile={profile} />}
        {activeTab === 'nav' && <NavigationModule theme={theme} profile={profile} />}
        {activeTab === 'spouse' && <SpouseDeploymentGuide theme={theme} profile={profile} />}
        {activeTab === 'religion' && <ReligiousServicesModuleWrapped theme={theme} profile={profile} />}
        {activeTab === 'resources' && <ResourcesTab theme={theme} profile={profile} />}
        {activeTab === 'immigration' && <ImmigrationModule theme={theme} profile={profile} />}
      </div>
      </div>{/* end body container */}

      {/* INTERACTIVE DEMO TOUR OVERLAY */}
      {demoTip >= 0 && demoTip < DEMO_TIPS.length && (
        <div style={{ position: 'fixed', bottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom) + 12px)' : 'calc(24px + env(safe-area-inset-bottom))', left: isDesktop ? 230 : 0, right: 0, maxWidth: isDesktop ? '100%' : 480, margin: isDesktop ? 0 : '0 auto', padding: '0 12px', zIndex: 350 }}>
          <div style={{ background: theme.secondary, borderRadius: 16, padding: '16px', border: `2px solid ${theme.accent}`, boxShadow: '0 -4px 30px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: theme.accent, borderRadius: 10, padding: '2px 10px', fontSize: 10, fontWeight: 900, color: theme.secondary }}>
                  DEMO TOUR {demoTip + 1} / {DEMO_TIPS.length}
                </div>
              </div>
              <button onClick={() => setDemoTip(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>Skip ✕</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>{DEMO_TIPS[demoTip].title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 14 }}>{DEMO_TIPS[demoTip].body}</div>
            {/* Step progress dots */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, justifyContent: 'center' }}>
              {DEMO_TIPS.map((_, i) => (
                <div key={i} onClick={() => { setDemoTip(i); goTo(DEMO_TIPS[i].tab); }} style={{ width: i === demoTip ? 20 : 6, height: 6, borderRadius: 3, background: i <= demoTip ? theme.accent : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all .2s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {demoTip > 0 && (
                <button onClick={() => { const prev = demoTip - 1; setDemoTip(prev); goTo(DEMO_TIPS[prev].tab); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
              )}
              {demoTip < DEMO_TIPS.length - 1 ? (
                <button onClick={() => { const next = demoTip + 1; setDemoTip(next); goTo(DEMO_TIPS[next].tab); }} style={{ flex: 2, padding: '10px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                  Next: {DEMO_TIPS[demoTip + 1].title.split('!')[0]} →
                </button>
              ) : (
                <button onClick={() => setDemoTip(-1)} style={{ flex: 2, padding: '10px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
                  Thank You for Your Service! ✦
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── iOS BOTTOM TAB BAR ── native only, invisible on web/Railway ── */}
      {isNative && !isDesktop && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 310, background: theme.secondary, borderTop: `1px solid ${theme.accent}35`, display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {IOS_TAB_BAR.map(item => (
            <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} style={{ flex: 1, minHeight: 49, padding: '6px 2px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
              <span style={{ fontSize: 22, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(40%) opacity(0.55)' }}>{item.iosIcon}</span>
              <span style={{ fontSize: 10, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.5)', letterSpacing: '.02em', lineHeight: 1 }}>{item.label}</span>
              {activeTab === item.id && <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: theme.accent }} />}
            </button>
          ))}
          <button onClick={() => setMoreOpen(o => !o)} style={{ flex: 1, minHeight: 49, padding: '6px 2px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
            <span style={{ fontSize: 22, lineHeight: 1, color: moreOpen ? theme.accent : 'rgba(255,255,255,0.55)', fontWeight: 900, letterSpacing: '-2px' }}>•••</span>
            <span style={{ fontSize: 10, fontWeight: moreOpen ? 800 : 600, color: moreOpen ? theme.accent : 'rgba(255,255,255,0.5)', letterSpacing: '.02em', lineHeight: 1 }}>More</span>
          </button>
        </div>
      )}

      {/* ── iOS MORE BOTTOM SHEET ── */}
      {isNative && !isDesktop && moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 311, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'fixed', bottom: `calc(49px + env(safe-area-inset-bottom))`, left: 0, right: 0, zIndex: 312, background: theme.secondary, borderRadius: '20px 20px 0 0', borderTop: `2px solid ${theme.accent}60`, paddingTop: 8, paddingBottom: 4 }}>
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: '0 12px' }}>
              {BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} style={{ padding: '10px 4px 8px', background: activeTab === item.id ? `${theme.accent}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTab === item.id ? theme.accent + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(30%) opacity(0.7)' }}>{item.iosIcon}</span>
                  <span style={{ fontSize: 9, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.65)', letterSpacing: '.02em', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '10px 12px 4px' }}>
              <button onClick={() => { setProfile(null); store.set('pcs_profile', null); setMoreOpen(false); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 12, color: 'rgba(255,100,100,0.9)', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                Reset / Re-onboard
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// Wrapper for religious services that adds preference-based filtering
function ReligiousServicesModuleWrapped({ theme, profile }) {
  const pref = profile?.religiousPreference || profile?.religion || '';
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();

  const isChristian = pref.includes('Christian') || pref.includes('Protestant');
  const isCatholic = pref.includes('Catholic');
  const isJewish = pref.includes('Jewish') || pref.includes('Judaism');
  const isIslam = pref.includes('Islam') || pref.includes('Muslim') || pref === 'Islamic';
  const isBuddhist = pref.includes('Buddhist');
  const isHindu = pref.includes('Hindu');
  const showAll = !pref || pref === 'Other' || pref === 'Prefer not to say';

  const prefLabel = showAll ? 'All Faiths' : pref;

  return (
    <div>
      {pref && !showAll && (
        <div style={{ background: theme.secondary, padding: '10px 16px', fontSize: 12, color: theme.accent, fontWeight: 700 }}>
          Showing services for: {prefLabel} {instName ? `near ${instName}` : ''}
        </div>
      )}
      <ReligiousServicesModule theme={theme} profile={{ ...profile, filterDenomination: isChristian ? 'Protestant' : isCatholic ? 'Catholic' : isJewish ? 'Jewish' : isIslam ? 'Islamic' : null, showAll }} />
    </div>
  );
}

export default App;
