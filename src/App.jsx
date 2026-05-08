/*
 * Purpose: Main PCS Express React shell, onboarding flow, tab navigation, and core PCS modules.
 * Third-party dependencies: React, Leaflet through child map modules, Capacitor bridge when running native.
 */

import { Component, useState, useEffect } from 'react'
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
import HomeLocatorTab from './components/HomeLocatorTab'
import PrivacyShield from './components/PrivacyShield'
import SyncStatusIndicator from './components/SyncStatusIndicator'
import { AuditLogger, secureLocalStore, readLegacyJson } from './security/SecurityExtensions'
import { ALL_BASES } from './components/BaseMapModule'

const store = {
  get: (k) => readLegacyJson(k, null),
  set: (k, v) => { secureLocalStore.set(k, v); },
};

const DEMO_PROFILE_KEY = 'pcs_demo_profile';

function getSessionDemoProfile() {
  try {
    const raw = sessionStorage.getItem(DEMO_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSessionDemoProfile(profile) {
  try {
    sessionStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

function clearSessionDemoProfile() {
  try {
    sessionStorage.removeItem(DEMO_PROFILE_KEY);
  } catch {}
}

function prepareInteractiveDemoLaunch() {
  clearSessionDemoProfile();
}

const PROFILE_DEFAULTS = {
  firstName: '',
  lastName: '',
  branch: 'Army',
  component: 'Active Duty',
  paygrade: 'E-5',
  losingInstallation: '',
  gainingInstallation: '',
  departingDate: '',
  isOverseas: false,
  hasDependents: false,
  hasChildren: false,
  childAges: [],
  childrenAges: '',
  language: 'en',
  religiousPreference: 'No Preference',
};

function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const branch = BRANCH_THEMES[raw.branch] ? raw.branch : PROFILE_DEFAULTS.branch;
  const childAges = Array.isArray(raw.childAges)
    ? raw.childAges.filter(a => a !== '' && !isNaN(Number(a))).map(Number)
    : String(raw.childrenAges || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  return {
    ...PROFILE_DEFAULTS,
    ...raw,
    branch,
    firstName: String(raw.firstName || ''),
    lastName: String(raw.lastName || ''),
    component: ['FTNG', 'Spouse'].includes(raw.component) ? PROFILE_DEFAULTS.component : (raw.component || PROFILE_DEFAULTS.component),
    paygrade: raw.paygrade || PROFILE_DEFAULTS.paygrade,
    losingInstallation: String(raw.losingInstallation || ''),
    gainingInstallation: String(raw.gainingInstallation || ''),
    departingDate: String(raw.departingDate || ''),
    childAges,
    childrenAges: childAges.join(', '),
    hasChildren: childAges.length > 0,
    language: raw.language || PROFILE_DEFAULTS.language,
    religiousPreference: raw.religiousPreference || raw.religion || PROFILE_DEFAULTS.religiousPreference,
    demoMode: raw.demoMode === true || raw.isDemo === true,
  };
}

function recoverWithoutDeletingProgress() {
  clearSessionDemoProfile();
  window.location.reload();
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('PCS Express startup error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#F0F4F8', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: 420, width: '100%', background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 18, boxShadow: '0 8px 28px rgba(13,24,33,0.12)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 8 }}>PCS Express needs to reload this screen</div>
          <div style={{ fontSize: 12, color: '#56697C', lineHeight: 1.6, marginBottom: 14 }}>
            PCS Express hit a temporary screen error. Reloading clears only the demo session preview and does not delete your saved PCS profile or checklist progress.
          </div>
          <button onClick={recoverWithoutDeletingProgress} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: '#1565C0', color: '#FFFFFF', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
            Reload Without Deleting Progress
          </button>
        </div>
      </div>
    );
  }
}

const BRANCH_MARK_SOURCE_NOTES = {
  Army: 'https://www.army.mil/socialmedia/operations/index.html',
  Navy: 'https://www.navy.mil/TRADEMARKS/',
  'Marine Corps': 'https://www.trademark.marines.mil/',
  'Air Force': 'https://www.trademark.af.mil/Branding/Air-Force-Symbol/',
  'Space Force': 'https://www.spaceforce.mil/About-Us/',
  'Coast Guard': 'https://www.uscg.mil/',
};

const BRANCH_HOME_INSIGNIA = {
  Army: 'USA',
  Navy: 'USN',
  'Marine Corps': 'USMC',
  'Air Force': 'USAF',
  'Space Force': 'USSF',
  'Coast Guard': 'USCG',
};

function getHomeBranchInsignia(branch) {
  const theme = BRANCH_THEMES[branch] || BRANCH_THEMES.Army;
  return BRANCH_HOME_INSIGNIA[branch] || theme.insignia || theme.abbr || 'PCS';
}

const UI_PALETTE = {
  page: '#F7F4EA',
  pageAlt: '#EFE8D6',
  surface: '#FFFFFF',
  surfaceSoft: '#FBFAF5',
  text: '#111827',
  muted: '#56616F',
  line: '#DDD5C2',
  tactical: '#4F5D35',
  tacticalDark: '#26351F',
  gold: '#B8943A',
  danger: '#7F1D1D',
};

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
    { name:"Airborne & Special Operations Museum Store", category:"Retail/Museum", desc:"Veteran-run gift shop at the Airborne & Special Operations Museum. Military memorabilia, books, and unit history gear.", url:"", icon:"🎖️" },
    { name:"All American Brewpub", category:"Restaurant/Bar", desc:"Veteran-owned brewery and restaurant in downtown Fayetteville. Craft beers and American fare with military discounts.", url:"", icon:"🍺" },
    { name:"Cape Fear CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Fort Liberty. Tactical fitness programming, active-duty discounts available.", url:"", icon:"💪" },
    { name:"Patriot Roofing & Construction", category:"Home Services", desc:"Veteran-owned roofing and general contracting serving the Fort Liberty military community.", url:"", icon:"🏠" },
    { name:"Find More Near Fort Liberty →", category:"Directory", desc:"Search VeteranOwnedBusiness.com for all verified veteran-owned businesses in the Fayetteville area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Bragg": [
    { name:"Airborne & Special Operations Museum Store", category:"Retail/Museum", desc:"Veteran-operated gift shop honoring the 82nd Airborne and Special Operations history.", url:"", icon:"🎖️" },
    { name:"All American Brewpub", category:"Restaurant/Bar", desc:"Veteran-owned brewery near post with craft beers and military discounts.", url:"", icon:"🍺" },
    { name:"Find More Near Fayetteville →", category:"Directory", desc:"Search for all verified veteran-owned businesses in the greater Fayetteville area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Campbell": [
    { name:"Strawberry Alley Ale Works", category:"Brewery/Restaurant", desc:"Veteran co-owned craft brewery in downtown Clarksville. Award-winning ales, lagers and IPAs. Military and veteran discounts offered.", url:"", icon:"🍺" },
    { name:"Paradigm Shift Brewing", category:"Brewery", desc:"Veteran-owned nano-brewery in Clarksville, TN. Small-batch craft beers with a military heritage. Taproom open weekends.", url:"", icon:"🍺" },
    { name:"Warrior's Path Financial", category:"Financial Services", desc:"Veteran-owned financial planning and wealth management near Fort Campbell. Specializes in military retirement planning.", url:"", icon:"💰" },
    { name:"Tactical CrossFit Clarksville", category:"Fitness", desc:"Veteran-owned CrossFit gym in Clarksville. Military programming, group classes, and active-duty rates.", url:"", icon:"💪" },
    { name:"Find More Near Clarksville →", category:"Directory", desc:"Search VeteranOwnedBusiness.com for all verified veteran-owned businesses near Fort Campbell.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Cavazos": [
    { name:"Killeen Veterans Business Alliance", category:"Network", desc:"Coalition of veteran-owned businesses in the greater Killeen/Fort Cavazos area. Referrals, networking, and mutual support.", url:"", icon:"🤝" },
    { name:"Texas Veteran BBQ", category:"Restaurant", desc:"Veteran-owned Texas-style BBQ joint near Fort Cavazos. Brisket, ribs, and pulled pork with a military discount.", url:"", icon:"🍖" },
    { name:"Lone Star Tactical Fitness", category:"Fitness", desc:"Veteran-owned CrossFit and tactical fitness gym serving the Fort Cavazos community. Monthly active-duty rates available.", url:"", icon:"💪" },
    { name:"Combat Veteran Realty", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans and military relocations around Fort Cavazos.", url:"", icon:"🏘️" },
    { name:"Find More Near Killeen →", category:"Directory", desc:"Search for all verified veteran-owned businesses in the Killeen/Temple area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Hood": [
    { name:"Killeen Veterans Business Alliance", category:"Network", desc:"Veteran-owned business network near Fort Hood. Connects military entrepreneurs and patrons.", url:"", icon:"🤝" },
    { name:"Texas Veteran BBQ", category:"Restaurant", desc:"Veteran-owned BBQ near Fort Hood. Military discounts available.", url:"", icon:"🍖" },
    { name:"Find More Near Killeen →", category:"Directory", desc:"Browse all veteran-owned businesses near Fort Hood/Cavazos.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Carson": [
    { name:"Pikes Peak Brewing Company", category:"Brewery", desc:"Veteran co-founded craft brewery in Colorado Springs. Community-centered taproom with rotating military appreciation events.", url:"", icon:"🍺" },
    { name:"BattleBorn Coffee Roasters", category:"Coffee", desc:"Veteran-owned specialty coffee roaster based in Colorado. Ships nationwide; beans available at area shops near Fort Carson.", url:"", icon:"☕" },
    { name:"Warrior Roofing & Solar", category:"Home Services", desc:"Veteran-owned roofing and solar installation company in Colorado Springs. Active-duty and veteran discounts available.", url:"", icon:"🏠" },
    { name:"Tactical Strength & Conditioning", category:"Fitness", desc:"Veteran-owned strength and conditioning gym in Colorado Springs. Military pricing, SFAS/Ranger School prep programming.", url:"", icon:"💪" },
    { name:"Valor Financial (Colorado Springs)", category:"Financial Services", desc:"Veteran-owned financial advisory firm in Colorado Springs. Military TSP rollover and retirement planning specialists.", url:"", icon:"💰" },
    { name:"Find More Near Colorado Springs →", category:"Directory", desc:"Browse verified veteran-owned businesses near Fort Carson on VeteranOwnedBusiness.com.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Bliss": [
    { name:"Veteran Coffee House El Paso", category:"Coffee/Community", desc:"Veteran-owned coffee shop and community hub in El Paso. Regular networking events for transitioning service members.", url:"", icon:"☕" },
    { name:"Combat Arms CrossFit El Paso", category:"Fitness", desc:"Veteran-owned CrossFit gym near Fort Bliss. Military discounts, veteran coaching staff.", url:"", icon:"💪" },
    { name:"Border Veteran Realty", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans and PCS moves in the El Paso/Fort Bliss area.", url:"", icon:"🏘️" },
    { name:"El Paso Veterans Business Outreach Center", category:"Network/Resources", desc:"SBA-backed VBOC providing free counseling, training, and resources for veteran entrepreneurs in the El Paso area.", url:"https://sba.gov/offices/district/nm/albuquerque", icon:"🤝" },
    { name:"Find More Near El Paso →", category:"Directory", desc:"Search for verified veteran-owned businesses near Fort Bliss.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Stewart": [
    { name:"Coastal Empire Beer Company", category:"Brewery", desc:"Savannah-area craft brewery with strong military community ties. Veteran-owned staff; military discount on all orders.", url:"", icon:"🍺" },
    { name:"Hinesville Veteran Services", category:"Network", desc:"Local veteran business support network serving the Fort Stewart military community. Resources for entrepreneurs and job seekers.", url:"", icon:"🤝" },
    { name:"Tactical Fitness Hinesville", category:"Fitness", desc:"Veteran-owned gym and training facility near Fort Stewart. Flexible military membership rates.", url:"", icon:"💪" },
    { name:"Find More Near Hinesville/Savannah →", category:"Directory", desc:"Browse veteran-owned businesses in the Hinesville and Savannah, GA area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Drum": [
    { name:"Watertown Veteran Business Hub", category:"Network", desc:"Local veteran entrepreneur network near Fort Drum. Monthly meetings, business referrals, and support for transitioning service members.", url:"", icon:"🤝" },
    { name:"North Country Tactical Gear", category:"Retail/Outdoor", desc:"Veteran-owned outdoor and tactical gear store near Fort Drum. Military discount on all purchases.", url:"", icon:"🎒" },
    { name:"Find More Near Watertown →", category:"Directory", desc:"Search for veteran-owned businesses near Fort Drum in Watertown, NY.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Sill": [
    { name:"Lawton Veteran Business Alliance", category:"Network", desc:"Local network of veteran business owners near Fort Sill. Events, referrals, and mutual support for the military community.", url:"", icon:"🤝" },
    { name:"Thunder CrossFit Lawton", category:"Fitness", desc:"Veteran-owned CrossFit gym in Lawton, OK. Military pricing available for active duty and veterans.", url:"", icon:"💪" },
    { name:"Red River Brewing (Lawton)", category:"Brewery", desc:"Veteran-owned craft brewery in Lawton, OK. Oklahoma craft beers with a military roots atmosphere.", url:"", icon:"🍺" },
    { name:"Find More Near Lawton →", category:"Directory", desc:"Search for verified veteran-owned businesses near Fort Sill.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Jackson": [
    { name:"Columbia Veteran Business Network", category:"Network", desc:"South Carolina veteran entrepreneur community near Fort Jackson. Free mentorship, referrals, and resources.", url:"", icon:"🤝" },
    { name:"Palmetto Tactical Fitness", category:"Fitness", desc:"Veteran-owned fitness and training center in Columbia, SC. Group classes and personal training with military rates.", url:"", icon:"💪" },
    { name:"Veteran Realty Group Columbia", category:"Real Estate", desc:"VA loan specialists and veteran-owned real estate team helping PCS moves in and around Fort Jackson.", url:"", icon:"🏘️" },
    { name:"Find More Near Columbia →", category:"Directory", desc:"Browse all veteran-owned businesses in the Columbia, SC area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Knox": [
    { name:"Radcliff Veteran Business Hub", category:"Network", desc:"Veteran-owned business network serving the Fort Knox / Radcliff / Louisville corridor. Business referrals and networking events.", url:"", icon:"🤝" },
    { name:"Armor CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Fort Knox. Tactical fitness and competitive sport programming. Military discounts.", url:"", icon:"💪" },
    { name:"Veteran Auto Service", category:"Automotive", desc:"Veteran-owned auto repair shop serving the Fort Knox military community. Honest service and military discount available.", url:"", icon:"🔧" },
    { name:"Find More Near Fort Knox/Louisville →", category:"Directory", desc:"Search for veteran-owned businesses in the Fort Knox and Louisville, KY area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Meade": [
    { name:"Annapolis Veteran Business Network", category:"Network", desc:"Maryland veteran entrepreneur network connecting businesses near Fort Meade, Annapolis, and the DC metro corridor.", url:"", icon:"🤝" },
    { name:"IRONCLAD Coffee Roasters", category:"Coffee", desc:"Veteran-owned specialty coffee roaster in the Baltimore-DC corridor. 10% discount for active duty and veterans.", url:"", icon:"☕" },
    { name:"Cyber Veteran Solutions", category:"Technology", desc:"Veteran-owned IT and cybersecurity consulting firm near Fort Meade and NSA. DoD contractor support.", url:"", icon:"💻" },
    { name:"Find More Near Fort Meade →", category:"Directory", desc:"Search for veteran-owned businesses near Fort Meade in the Odenton/Baltimore area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Fort Sam Houston": [
    { name:"Ranger Cattle Company", category:"Food/Retail", desc:"Veteran-owned beef company founded by a former Army Ranger near San Antonio. Premium Texas beef shipped nationwide.", url:"", icon:"🥩" },
    { name:"Combat Coffee San Antonio", category:"Coffee", desc:"Veteran-owned specialty coffee brand headquartered in San Antonio. Supports veteran employment with every purchase.", url:"", icon:"☕" },
    { name:"Veteran Realty of San Antonio", category:"Real Estate", desc:"VA loan certified veteran-owned real estate team. Specializes in military PCS moves and BAH optimization near JBSA.", url:"", icon:"🏘️" },
    { name:"SAVETCO (SA Veteran Entrepreneur)", category:"Network", desc:"San Antonio veteran entrepreneur coalition — events, mentorship, and procurement support at the city and state level.", url:"", icon:"🤝" },
    { name:"Find More Near San Antonio →", category:"Directory", desc:"Browse all verified veteran-owned businesses near JBSA / Fort Sam Houston.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Joint Base San Antonio": [
    { name:"Combat Coffee San Antonio", category:"Coffee", desc:"Veteran-owned specialty coffee. Supports veteran employment.", url:"", icon:"☕" },
    { name:"SAVETCO Veteran Entrepreneurs", category:"Network", desc:"San Antonio veteran entrepreneur coalition — city and state procurement support.", url:"", icon:"🤝" },
    { name:"Veteran Realty of San Antonio", category:"Real Estate", desc:"VA loan certified real estate team serving JBSA, Fort Sam Houston, and Lackland AFB military families.", url:"", icon:"🏘️" },
    { name:"Find More Near San Antonio →", category:"Directory", desc:"Browse all veteran-owned businesses near JBSA.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Schofield Barracks": [
    { name:"Koa Brewing Co", category:"Brewery", desc:"Hawaii-based veteran-friendly craft brewery. Local ingredients and military appreciation events near Schofield.", url:"", icon:"🍺" },
    { name:"Aloha Veteran CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Wahiawa/Honolulu area. Military discount on monthly memberships.", url:"", icon:"💪" },
    { name:"Hawaii Veteran Business Hub", category:"Network", desc:"Statewide network of veteran-owned businesses with active members near Schofield Barracks and Honolulu.", url:"", icon:"🤝" },
    { name:"Find More Near Honolulu →", category:"Directory", desc:"Search for verified veteran-owned businesses in Hawaii.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  // ── NAVY ──────────────────────────────────────────────────────────────────
  "Naval Station Norfolk": [
    { name:"Coastal Fermentory", category:"Brewery", desc:"Veteran-owned craft brewery in Hampton Roads. Rotating taps, military discount Fridays.", url:"", icon:"🍺" },
    { name:"Hampton Roads Veterans Chamber", category:"Network", desc:"Regional chamber connecting veteran-owned businesses across Norfolk, Hampton, and Virginia Beach.", url:"", icon:"🤝" },
    { name:"Warfare Fitness Norfolk", category:"Fitness", desc:"Veteran-owned functional fitness gym near NS Norfolk. Military-style programming and veteran pricing.", url:"", icon:"💪" },
    { name:"Veteran Realty Hampton Roads", category:"Real Estate", desc:"Veteran-owned VA-loan specialist real estate team serving Norfolk, Chesapeake, and Virginia Beach.", url:"", icon:"🏘️" },
    { name:"Find More Near Norfolk →", category:"Directory", desc:"Browse verified veteran-owned businesses in the Hampton Roads area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Naval Base San Diego": [
    { name:"Groundwork Coffee Co.", category:"Coffee", desc:"Veteran-co-founded specialty coffee roaster with San Diego roots. Beans sourced from conflict-affected regions worldwide. Multiple locations.", url:"", icon:"☕" },
    { name:"Combat Flip Flops", category:"Apparel/Retail", desc:"Ranger-founded lifestyle brand manufacturing in conflict regions. Sold nationwide; popular at San Diego-area military exchanges.", url:"", icon:"👟" },
    { name:"San Diego Veteran Business Alliance", category:"Network", desc:"Network of 200+ veteran-owned businesses in San Diego County with events, procurement support, and mentorship.", url:"", icon:"🤝" },
    { name:"Warrior CrossFit San Diego", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in San Diego. Tactical strength programming and military membership rates.", url:"", icon:"💪" },
    { name:"Find More Near San Diego →", category:"Directory", desc:"Search the full directory of veteran-owned businesses in San Diego.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "NAS Jacksonville": [
    { name:"Bold City Brewery", category:"Brewery", desc:"Jacksonville craft brewery with deep military community ties and regular veteran appreciation events.", url:"", icon:"🍺" },
    { name:"Jacksonville Veteran Business Network", category:"Network", desc:"Local network supporting veteran-owned businesses in Jacksonville. Regular meetups and procurement referrals.", url:"", icon:"🤝" },
    { name:"Tactical CrossFit Jacksonville", category:"Fitness", desc:"Veteran-owned CrossFit and functional fitness near NAS Jacksonville. Active-duty monthly rates available.", url:"", icon:"💪" },
    { name:"Find More Near Jacksonville →", category:"Directory", desc:"Browse all verified veteran-owned businesses in Jacksonville, FL.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Naval Station Mayport": [
    { name:"Bold City Brewery", category:"Brewery", desc:"Jacksonville veteran-friendly craft brewery. Rotating taps and military appreciation events.", url:"", icon:"🍺" },
    { name:"Veteran Realty Jacksonville Beaches", category:"Real Estate", desc:"VA-loan specialist real estate team serving the Mayport/Atlantic Beach/Neptune Beach corridor.", url:"", icon:"🏘️" },
    { name:"Find More Near Jacksonville/Mayport →", category:"Directory", desc:"Browse all veteran-owned businesses in the greater Jacksonville area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "NAS Pensacola": [
    { name:"Pensacola Veteran Business Hub", category:"Network", desc:"Panhandle area veteran entrepreneur coalition serving NAS Pensacola, Whiting Field, and Eglin AFB military community.", url:"", icon:"🤝" },
    { name:"Craft 850 Brewing", category:"Brewery", desc:"Veteran-owned craft brewery in the Pensacola area. Military discount available; proceeds partially fund veteran charities.", url:"", icon:"🍺" },
    { name:"Emerald Coast Tactical Fitness", category:"Fitness", desc:"Veteran-owned gym near NAS Pensacola. Functional fitness, CrossFit, and military prep programming.", url:"", icon:"💪" },
    { name:"Find More Near Pensacola →", category:"Directory", desc:"Browse verified veteran-owned businesses in Pensacola.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Naval Air Station Pensacola": [
    { name:"Pensacola Veteran Business Hub", category:"Network", desc:"Panhandle veteran entrepreneur coalition — business referrals and community support.", url:"", icon:"🤝" },
    { name:"Craft 850 Brewing", category:"Brewery", desc:"Veteran-owned craft brewery in the Pensacola area. Military discount available.", url:"", icon:"🍺" },
    { name:"Find More Near Pensacola →", category:"Directory", desc:"Browse all veteran-owned businesses near NAS Pensacola.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  // ── MARINE CORPS ──────────────────────────────────────────────────────────
  "Marine Corps Base Camp Lejeune": [
    { name:"Lejeune Veteran Business Network", category:"Network", desc:"Jacksonville, NC veteran entrepreneur coalition. Business referrals, mentorship, and networking events for the Camp Lejeune community.", url:"", icon:"🤝" },
    { name:"Onslow CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Jacksonville, NC. Military pricing and tactical fitness programming.", url:"", icon:"💪" },
    { name:"Lejeune Veteran Realty", category:"Real Estate", desc:"Marine veteran-owned real estate team. VA loan specialists serving Camp Lejeune PCS families.", url:"", icon:"🏘️" },
    { name:"Half Time Beverage", category:"Retail", desc:"Veteran-owned beer, wine, and spirits shop near Camp Lejeune. Large military selection and competitive pricing.", url:"", icon:"🛒" },
    { name:"Find More Near Jacksonville, NC →", category:"Directory", desc:"Search for all verified veteran-owned businesses near Camp Lejeune.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Camp Lejeune": [
    { name:"Onslow CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Camp Lejeune. Military pricing available.", url:"", icon:"💪" },
    { name:"Half Time Beverage", category:"Retail", desc:"Veteran-owned spirits shop near Camp Lejeune.", url:"", icon:"🛒" },
    { name:"Find More Near Jacksonville, NC →", category:"Directory", desc:"Browse veteran-owned businesses near Camp Lejeune.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Camp Pendleton": [
    { name:"Wild Coast Coffee Co.", category:"Coffee", desc:"Veteran-owned specialty coffee shop in Oceanside. Regular military appreciation events and active-duty discounts.", url:"", icon:"☕" },
    { name:"Oceanside CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Oceanside, CA. Marine veteran coaches. Military membership rates.", url:"", icon:"💪" },
    { name:"San Diego Veteran Business Alliance", category:"Network", desc:"Large network of veteran-owned businesses covering San Diego County and North County including Oceanside.", url:"", icon:"🤝" },
    { name:"Ironside Brewing (Oceanside)", category:"Brewery", desc:"Veteran-co-owned craft brewery in Oceanside with a military heritage theme.", url:"", icon:"🍺" },
    { name:"Find More Near Oceanside →", category:"Directory", desc:"Browse verified veteran-owned businesses near Camp Pendleton.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "MCAS Miramar": [
    { name:"Groundwork Coffee Co.", category:"Coffee", desc:"Veteran co-founded specialty coffee with San Diego roots. Multiple locations throughout the region.", url:"", icon:"☕" },
    { name:"San Diego Veteran Business Alliance", category:"Network", desc:"200+ veteran-owned businesses in the San Diego area covering all districts.", url:"", icon:"🤝" },
    { name:"Find More Near San Diego →", category:"Directory", desc:"Search the full directory of veteran-owned businesses in San Diego.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "MCB Quantico": [
    { name:"Northern Virginia Veteran Business Network", category:"Network", desc:"Regional network covering Quantico, Woodbridge, and the DC metro area. Business referrals and government procurement support.", url:"", icon:"🤝" },
    { name:"Semper Fit Stafford", category:"Fitness", desc:"Veteran-owned CrossFit and personal training gym near MCB Quantico in Stafford, VA.", url:"", icon:"💪" },
    { name:"Find More Near Quantico/NOVA →", category:"Directory", desc:"Browse veteran-owned businesses in Northern Virginia near MCB Quantico.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  // ── AIR FORCE ─────────────────────────────────────────────────────────────
  "Joint Base Langley-Eustis": [
    { name:"The Winery at Bull Run (nearby)", category:"Winery", desc:"Virginia winery with strong veteran/military community ties in the Hampton Roads area. Regular veteran events.", url:"", icon:"🍷" },
    { name:"Hampton Roads Veterans Chamber", category:"Network", desc:"Regional veteran business chamber covering Hampton, Newport News, and Norfolk. Business directory and advocacy.", url:"", icon:"🤝" },
    { name:"Peninsula CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate on the Virginia Peninsula. Military pricing available.", url:"", icon:"💪" },
    { name:"Find More Near Hampton, VA →", category:"Directory", desc:"Browse veteran-owned businesses near Langley-Eustis in Hampton and Newport News.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Eglin AFB": [
    { name:"Emerald Coast Veteran Business Hub", category:"Network", desc:"Veteran entrepreneur coalition in the Eglin/Hurlburt/Pensacola corridor. Business referrals and SBA support.", url:"", icon:"🤝" },
    { name:"Lucky Devil Brewing (Ft. Walton Beach)", category:"Brewery", desc:"Veteran-friendly craft brewery near Eglin AFB in Fort Walton Beach. Military discount on pints and growlers.", url:"", icon:"🍺" },
    { name:"Destin Tactical & Outdoors", category:"Retail", desc:"Veteran-owned outdoor and tactical gear shop near Eglin AFB. Military discounts and special ordering.", url:"", icon:"🎒" },
    { name:"Find More Near Fort Walton Beach →", category:"Directory", desc:"Browse veteran-owned businesses in the Eglin / Fort Walton Beach area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Hurlburt Field": [
    { name:"Emerald Coast Veteran Business Hub", category:"Network", desc:"Veteran entrepreneur coalition serving the Eglin/Hurlburt/Pensacola corridor.", url:"", icon:"🤝" },
    { name:"Find More Near Fort Walton Beach →", category:"Directory", desc:"Browse veteran-owned businesses near Hurlburt Field.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "MacDill AFB": [
    { name:"Veteran Craft Brewing Co.", category:"Brewery", desc:"Tampa-based veteran-owned craft brewery. Military appreciation nights and active-duty discounts.", url:"", icon:"🍺" },
    { name:"Warrior Weekend Foundation (Tampa)", category:"Network", desc:"Tampa Bay veteran business and community network. Connects SOCOM-area veterans with local business opportunities.", url:"", icon:"🤝" },
    { name:"Special Ops CrossFit Tampa", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Tampa. SOCOM/SOF community programming. Military rates available.", url:"", icon:"💪" },
    { name:"Veteran Realty Tampa Bay", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans for MacDill AFB and SOCOM military families.", url:"", icon:"🏘️" },
    { name:"Find More Near Tampa →", category:"Directory", desc:"Browse the full directory of veteran-owned businesses in Tampa.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Travis AFB": [
    { name:"Travis Credit Union", category:"Financial Services", desc:"Military-chartered credit union serving Travis AFB members. Competitive rates on VA loans, auto, and personal banking.", url:"", icon:"💰" },
    { name:"Fairfield Veteran Business Network", category:"Network", desc:"Solano County veteran entrepreneur coalition near Travis AFB. Business referrals and Vet-Biz procurement resources.", url:"", icon:"🤝" },
    { name:"North Bay CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Vacaville/Fairfield. Military family discount plans.", url:"", icon:"💪" },
    { name:"Find More Near Fairfield/Sacramento →", category:"Directory", desc:"Browse veteran-owned businesses near Travis AFB.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Wright-Patterson AFB": [
    { name:"Dayton Veteran Business Alliance", category:"Network", desc:"Regional veteran business network in Dayton / Montgomery County. Business referrals and WPAFB contractor support.", url:"", icon:"🤝" },
    { name:"Warped Wing Brewing", category:"Brewery", desc:"Dayton craft brewery with an aviation and veteran-connected heritage. Regular military appreciation events.", url:"", icon:"🍺" },
    { name:"Air Force CrossFit Dayton", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Wright-Patterson AFB. Military and DoD civilian membership rates.", url:"", icon:"💪" },
    { name:"Find More Near Dayton →", category:"Directory", desc:"Browse verified veteran-owned businesses near Wright-Patterson AFB.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Nellis AFB": [
    { name:"Battle Born Brewing Company", category:"Brewery", desc:"Veteran-owned Nevada craft brewery. 'Battle Born' is Nevada's state motto — honoring the state's strong military heritage.", url:"", icon:"🍺" },
    { name:"Las Vegas Veteran Business Network", category:"Network", desc:"Nevada veteran entrepreneur coalition. Business referrals, veteran-owned business directory, and government procurement support.", url:"", icon:"🤝" },
    { name:"Nellis CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Nellis AFB in Henderson, NV. Fighter pilot and tactical fitness programming.", url:"", icon:"💪" },
    { name:"Find More Near Las Vegas →", category:"Directory", desc:"Browse verified veteran-owned businesses in the Las Vegas area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  // ── JOINT BASES ───────────────────────────────────────────────────────────
  "Joint Base Lewis-McChord": [
    { name:"Northwest Veteran Business Alliance", category:"Network", desc:"Washington State veteran entrepreneur network. Events, referrals, and 8(a) procurement support for JBLM area veteran businesses.", url:"", icon:"🤝" },
    { name:"Black Coffee Roasting Co.", category:"Coffee", desc:"Veteran-owned coffee roaster in Olympia, WA. All-black packaging symbolizing the coffee's strength — military discount for service members.", url:"", icon:"☕" },
    { name:"Tacoma CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in Tacoma. Military programming and monthly active-duty rates near JBLM.", url:"", icon:"💪" },
    { name:"Sound Brewing (Tacoma)", category:"Brewery", desc:"Veteran-connected craft brewery in Tacoma with a Navy/military community presence.", url:"", icon:"🍺" },
    { name:"Find More Near Tacoma →", category:"Directory", desc:"Browse the full directory of veteran-owned businesses near JBLM.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Joint Base Andrews": [
    { name:"National Capital Region Veteran Business Hub", category:"Network", desc:"DC-area veteran business network covering Prince George's County, Northern Virginia, and the Pentagon corridor.", url:"", icon:"🤝" },
    { name:"Veteran Realty DC Metro", category:"Real Estate", desc:"Veteran-owned real estate team specializing in VA loans for the DC metro area. PCS move specialists near Andrews, Pentagon, and Fort Meade.", url:"", icon:"🏘️" },
    { name:"Capital Beltway CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate near Joint Base Andrews. Military pricing for active duty and veterans.", url:"", icon:"💪" },
    { name:"Find More Near DC Metro →", category:"Directory", desc:"Search for veteran-owned businesses in the DC metro area near Joint Base Andrews.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Joint Base Charleston": [
    { name:"Charleston Veteran Business Network", category:"Network", desc:"South Carolina veteran entrepreneur coalition. Active members near JB Charleston, Naval Weapons Station, and North Charleston.", url:"", icon:"🤝" },
    { name:"Holy City Brewing", category:"Brewery", desc:"Charleston-area craft brewery with veteran community ties and regular military appreciation tap nights.", url:"", icon:"🍺" },
    { name:"Lowcountry CrossFit", category:"Fitness", desc:"Veteran-owned CrossFit affiliate in North Charleston. Military membership rates.", url:"", icon:"💪" },
    { name:"Find More Near Charleston →", category:"Directory", desc:"Browse all veteran-owned businesses in the Charleston, SC area.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Joint Base Elmendorf-Richardson": [
    { name:"Anchorage Veteran Business Network", category:"Network", desc:"Alaska veteran entrepreneur coalition. Business referrals and government contracting support for the JBER community.", url:"", icon:"🤝" },
    { name:"Broken Tooth Brewing", category:"Brewery", desc:"Anchorage veteran-connected craft brewery. Popular with the JBER military community. Seasonal outdoor programming.", url:"", icon:"🍺" },
    { name:"Alaska Tactical Fitness", category:"Fitness", desc:"Veteran-owned CrossFit and tactical fitness near JBER. Cold-weather training specialties.", url:"", icon:"💪" },
    { name:"Find More Near Anchorage →", category:"Directory", desc:"Search for veteran-owned businesses near JBER in Anchorage, AK.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  "Joint Base Pearl Harbor-Hickam": [
    { name:"Koa Brewing Co", category:"Brewery", desc:"Hawaii craft brewery with veteran community ties. Military appreciation events and active-duty discounts.", url:"", icon:"🍺" },
    { name:"Hawaii Veteran Business Hub", category:"Network", desc:"Statewide veteran entrepreneur network covering JBPHH, Schofield, and all Hawaii military installations.", url:"", icon:"🤝" },
    { name:"Find More Near Honolulu →", category:"Directory", desc:"Browse veteran-owned businesses in Hawaii.", url:"https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", icon:"🔍" },
  ],
  // ── OCONUS ────────────────────────────────────────────────────────────────
  "Camp Humphreys": [
    { name:"Dragon Hill Lodge (MWR)", category:"Hospitality", desc:"Military-operated lodge on Camp Humphreys. Veteran-staffed hospitality and dining.", url:"", icon:"🏨" },
    { name:"Army & Air Force Exchange (AAFES)", category:"Retail", desc:"Exchange-operated retail on post. Prioritizes veteran-owned small businesses as vendors.", url:"", icon:"🛒" },
    { name:"Search USFK Patron Businesses →", category:"Directory", desc:"Browse MWR-approved and veteran-connected businesses on Camp Humphreys.", url:"", icon:"🔍" },
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
      ? `https://nces.ed.gov/ccd/schoolsearch//search/search.page?zip=${searchZip}`
      : 'https://nces.ed.gov/ccd/schoolsearch/';
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
            <a href="https://installations.militaryonesource.mil/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px', borderRadius: 10, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>ChildCare Aware Military</a>
            <a href="https://www.militaryonesource.mil/parenting/child-care/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px', borderRadius: 10, background: theme.secondary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>ChildCare.gov</a>
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
            { name: 'GreatSchools', desc: 'Search by zip code — ratings, reviews, test scores', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
            { name: 'DoDEA School Finder', desc: 'Find DoDEA schools on military installations worldwide', url: '' },
            { name: 'NCES School Finder', desc: 'National Center for Education Statistics school search', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
            { name: 'Military Child Education Coalition', desc: 'Education transition resources for military-connected children', url: '' },
            { name: 'School Liaison Officers (SLO)', desc: 'Find your installation SLO — free school transition support', url: '' },
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
    { name: 'Veteran-Owned Business Directory', icon: '🇺🇸', desc: 'Search thousands of verified veteran-owned businesses by location and category.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses' },
    { name: 'SBA Veteran Business Outreach', icon: '🏛️', desc: 'Free counseling, training, and procurement opportunities for veteran entrepreneurs.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses' },
    { name: 'V-WISE (Women Vets)', icon: '💪', desc: 'SBA program specifically supporting women veteran business owners.', url: '' },
    { name: 'Hire Heroes USA', icon: '✈️', desc: 'Free job placement and career coaching for veterans and military spouses.', url: 'https://www.dol.gov/agencies/vets' },
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
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: '', siteUrl: '' },
    { name: 'Fayetteville State University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'HBCU with affordable in-state tuition. Robust veteran services. Strong nursing, social work, and criminal justice programs.', applyUrl: '', siteUrl: '' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. Tuition Assistance accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Top-ranked liberal arts and professional school near Fort Liberty. Pharmacy, law, and business schools. Military tuition rates.', applyUrl: '', siteUrl: '' },
    { name: 'UNC Pembroke', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'Affordable UNC system university 30 miles from post. Business, education, and public administration programs.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Bragg': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: '', siteUrl: '' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. TA accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Pharmacy, law, and business schools. Military tuition rates available.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Campbell': [
    { name: 'Austin Peay State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Ranked most military-friendly in Tennessee. Located in Clarksville, minutes from the main gate. Online and in-person options. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Volunteer State Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees in healthcare, business, and technology. Transfer pathway to Tennessee universities.', applyUrl: '', siteUrl: '' },
    { name: 'Middle Tennessee State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Over 300 degree programs including aerospace, business, and recording industry. 45 minutes from post.', applyUrl: '', siteUrl: '' },
    { name: 'Nashville State Community College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Technical certificates and associate degrees. Strong IT, business, and healthcare programs. TA-eligible.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Cavazos': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college. On-post classes, flexible schedules, and TA accepted. Serves thousands of Fort Cavazos soldiers annually.', applyUrl: '', siteUrl: '' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online classes. Strong business and computer science.', applyUrl: '', siteUrl: '' },
    { name: 'University of Mary Hardin-Baylor', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Belton, TX. Nursing, business, and education programs. Military scholarships and veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Workforce-focused associate degrees and certificates. Healthcare, law enforcement, and technology programs. Low tuition.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Hood': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college on-post. TA accepted. Associates degrees and certificates.', applyUrl: '', siteUrl: '' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online options.', applyUrl: '', siteUrl: '' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees near Fort Hood. Healthcare, IT, and business.', applyUrl: '', siteUrl: '' },
  ],
  'Joint Base Lewis-McChord': [
    { name: 'University of Washington Tacoma', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'UW system campus in Tacoma. Business, engineering, and nursing programs. Active veteran community. 15 minutes from JBLM.', applyUrl: '', siteUrl: '' },
    { name: 'Tacoma Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'High transfer-rate community college near JBLM. Strong IT, business, and healthcare pathways. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Pierce College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Two campuses near JBLM. Aviation, business, and computer science. Military welcome center on campus.', applyUrl: '', siteUrl: '' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Liberal arts university in Tacoma. Strong nursing, business, and education programs. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
    { name: 'University of Puget Sound', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly ranked private liberal arts college. Business, engineering, and occupational therapy. Yellow Ribbon program.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Carson': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus adjacent to Fort Carson. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: '', siteUrl: '' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Colorado Technical University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Career-focused IT, business, and criminal justice degrees. Flexible online and on-campus in Colorado Springs. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Bliss': [
    { name: 'University of Texas at El Paso', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university minutes from Fort Bliss. Engineering, nursing, and business programs. Strong veteran support office and military TA.', applyUrl: '', siteUrl: '' },
    { name: 'El Paso Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Five campuses near Fort Bliss. Affordable workforce training, associate degrees, and transfer prep. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'New Mexico State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Land-grant research university in Las Cruces, NM (45 min). Engineering, agriculture, and business programs. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Stewart': [
    { name: 'Georgia Southern University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Large public university in Statesboro, GA. Business, education, engineering, and health sciences. Military discount and veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Savannah State University', type: 'Public', degree: '4-Year University', rating: 3.4, desc: "Georgia's oldest HBCU in Savannah, 40 miles from post. Business, social work, and marine sciences.", applyUrl: '', siteUrl: '' },
    { name: 'Coastal Pines Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical certificates and associate degrees in healthcare, IT, and welding near Fort Stewart. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'College of Coastal Georgia', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Small public university in Brunswick, GA. Nursing, business, and liberal studies. Veteran-friendly with flexible scheduling.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Drum': [
    { name: 'Jefferson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'SUNY community college in Watertown — the top choice for Fort Drum soldiers. Business, IT, and health programs. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'SUNY Polytechnic Institute', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'SUNY technology campus. Business, computer science, and nursing programs. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Clarkson University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Top-ranked private engineering and business university in Potsdam, NY. STEM-focused. Financial aid and Yellow Ribbon.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Station Norfolk': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Dedicated Monarch Military Center. Engineering, business, and education degrees. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Strong nursing, business, and IT. Transfer partnerships with ODU and Virginia universities.', applyUrl: '', siteUrl: '' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology programs. Veteran-friendly campus.', applyUrl: '', siteUrl: '' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus options. Military tuition discount.', applyUrl: '', siteUrl: '' },
    { name: 'Virginia Wesleyan University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Liberal arts university in Norfolk/Virginia Beach. Small classes and strong veteran services. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
  ],
  'Marine Corps Base Camp Lejeune': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'The primary college for Camp Lejeune Marines. Located in Jacksonville, NC. On-post classes available. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with a Jacksonville campus near Camp Lejeune. Business, criminal justice, and education.', applyUrl: '', siteUrl: '' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Top-ranked business, nursing, and engineering programs. 1 hour from Camp Lejeune.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Pendleton': [
    { name: 'MiraCosta College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Top-rated community college adjacent to Camp Pendleton. On-post classes, strong veteran services. TA and Post-9/11 GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'California State University San Marcos', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CSU campus near Camp Pendleton. Business, nursing, and STEM programs. Strong veteran resource center and military scholarships.', applyUrl: '', siteUrl: '' },
    { name: 'Palomar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in San Marcos. 200+ degree and certificate programs. Transfer pathway to UC and CSU systems.', applyUrl: '', siteUrl: '' },
    { name: 'University of San Diego', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Highly ranked private Catholic university. Business, law, and engineering. Yellow Ribbon participant. 35 miles from post.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Sam Houston': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science programs. Active veteran services and military tuition discounts.', applyUrl: '', siteUrl: '' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts programs. TA accepted. Low tuition.', applyUrl: '', siteUrl: '' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Humphreys': [
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading university for OCONUS military members. On-post classes at Camp Humphreys plus fully online options. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted. Same curriculum as Fort Cavazos.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation, aerospace engineering, and business programs. On-post classes available at major installations.', applyUrl: '', siteUrl: '' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs: intelligence, security management, and emergency management.', applyUrl: '', siteUrl: '' },
  ],
  'Ramstein Air Base': [
    { name: 'University of Maryland Global Campus Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: "Europe's leading military-focused university. On-base classes at Ramstein and surrounding installations. TA and GI Bill accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Only accredited American residential university campus in Europe. Aviation management and aerospace engineering programs.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Alabama-based public university with classes at Ramstein AB. Business, criminal justice, and social science programs.', applyUrl: '', siteUrl: '' },
  ],
  'Kadena Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Kadena AB. Business, cybersecurity, and public safety management. TA and GI Bill.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation science and aerospace engineering with on-base courses. Popular with Air Force members at Kadena.', applyUrl: '', siteUrl: '' },
  ],
  'Yokota Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC at Yokota AB. Business administration, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'On-base associate degrees and certificates. Flexible and TA-eligible. Same high-quality programs as CONUS campuses.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace management degrees available at Yokota. Online with on-base support sessions.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Meade': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Fort Meade. Engineering, business, and cybersecurity. Strong research and intelligence programs.', applyUrl: '', siteUrl: '' },
    { name: 'Anne Arundel Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'AACC in Arnold, MD. Strong IT, cybersecurity, and business programs near Fort Meade and NSA. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Capitol Technology University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'STEM-focused university in Laurel, MD. Cybersecurity, aerospace, and engineering management. Popular with intelligence community.', applyUrl: '', siteUrl: '' },
  ],
  'Schofield Barracks': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and tropical agriculture. 30 minutes from Schofield Barracks.", applyUrl: '', siteUrl: '' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Pearl City, close to Schofield. Liberal arts, healthcare, and pre-professional pathways. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── CONUS Army (additional) ──────────────────────────────────────────────────
  'Fort Moore': [
    { name: 'Columbus State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Columbus, GA. Business, education, and health sciences. Strong veteran services and TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Columbus Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Workforce-focused technical college. Healthcare, IT, and skilled trades. TA accepted. Minutes from Fort Moore.', applyUrl: '', siteUrl: '' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university in Montgomery, AL. Business, education, and liberal arts. Military-friendly campus.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly public university with campus near Fort Moore. Business, criminal justice, and social sciences. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Eisenhower': [
    { name: 'Augusta University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Georgia public research university in Augusta. Medical, nursing, and cybersecurity programs. Strong ties to Fort Eisenhower.', applyUrl: '', siteUrl: '' },
    { name: 'Augusta Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college with IT, healthcare, and welding programs. TA accepted. Located minutes from Fort Eisenhower.', applyUrl: '', siteUrl: '' },
    { name: 'Paine College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Augusta, GA. Business, education, and humanities. Supportive veteran community and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of South Carolina Aiken', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC system campus in Aiken, SC. Business, nursing, and education. Veteran-friendly with flexible scheduling.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Gregg-Adams': [
    { name: 'Virginia State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Petersburg, VA. Business, engineering technology, and education. Active veteran services and TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Richard Bland College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'William & Mary-affiliated college in Petersburg. Transfer pathways to Virginia universities. Affordable and TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Virginia Commonwealth University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Research university in Richmond. Arts, health sciences, and business. 25 minutes from Fort Gregg-Adams. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
    { name: 'John Tyler Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Gregg-Adams. Nursing, IT, and business programs. Transfer partner with VCU and other VA universities.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Knox': [
    { name: 'Elizabethtown Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'KCTCS college in Elizabethtown, KY. Healthcare, business, and skilled trades. TA accepted. Closest college to Fort Knox.', applyUrl: '', siteUrl: '' },
    { name: 'University of Louisville', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Louisville, KY. Business, engineering, and health sciences. 45 minutes from Fort Knox. TA and GI Bill.', applyUrl: '', siteUrl: '' },
    { name: 'Western Kentucky University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Bowling Green. Business, nursing, and criminal justice. Military-friendly campus with veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Campbellsville University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Christian university in Campbellsville, KY. Business, education, and music. Yellow Ribbon participant. Veteran-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Jackson': [
    { name: 'University of South Carolina', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship research university in Columbia, SC. Business, engineering, and nursing. 10 minutes from Fort Jackson. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Columbia International University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Faith-based university in Columbia. Biblical studies, counseling, and education. Military-friendly with GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Midlands Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college near Fort Jackson. Nursing, IT, and business programs. TA-eligible with strong transfer pathways.', applyUrl: '', siteUrl: '' },
    { name: 'Benedict College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Columbia, SC. Business, computer science, and social work. Veteran-friendly campus. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Leonard Wood': [
    { name: 'Missouri University of Science & Technology', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Top-ranked engineering and science university in Rolla, MO. STEM-focused with strong research programs. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university with military-friendly programs. Business, education, and technology. Flexible online and in-person options.', applyUrl: '', siteUrl: '' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture programs. TA accepted. Affordable tuition.', applyUrl: '', siteUrl: '' },
    { name: 'Drury University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private liberal arts university in Springfield, MO. Architecture, business, and communication. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Wainwright': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's flagship research university in Fairbanks. Engineering, natural sciences, and business. Adjacent to Fort Wainwright. TA accepted.", applyUrl: '', siteUrl: '' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'UAF branch campus with vocational and technical programs. Healthcare, trades, and business. TA-eligible and flexible scheduling.', applyUrl: '', siteUrl: '' },
    { name: 'Alaska Bible College', type: 'Private', degree: '4-Year University', rating: 3.4, desc: 'Faith-based college in Palmer, AK. Biblical studies and Christian ministry. GI Bill accepted. Small, supportive campus community.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Novosel': [
    { name: 'Enterprise State Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Enterprise, AL. Business, healthcare, and aviation technology. TA accepted. Closest college to Fort Novosel.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Fort Novosel. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university with strong business and education programs. Active veteran services. 75 miles from Fort Novosel.', applyUrl: '', siteUrl: '' },
    { name: 'Wallace Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alabama community college in Dothan. Nursing, business, and skilled trades. TA-eligible with transfer pathways.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Leavenworth': [
    { name: 'University of Kansas', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship Kansas public university in Lawrence. Business, law, and engineering. 30 miles from Fort Leavenworth. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Kansas City Kansas Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Leavenworth. Business, healthcare, and technology. TA-eligible with transfer pathways.', applyUrl: '', siteUrl: '' },
    { name: 'Park University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly private university in Parkville, MO. Business administration and criminal justice. Flexible scheduling and TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Johnson County Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large community college in Overland Park, KS. Strong IT, business, and healthcare pathways. TA accepted. Transfer-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Hamilton': [
    { name: 'Brooklyn College CUNY', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CUNY campus in Brooklyn, NY. Liberal arts, business, and computer science. Affordable tuition and TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Kingsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'CUNY community college in Brooklyn. Healthcare, business, and culinary arts. TA accepted. Transfer pathway to CUNY four-year schools.', applyUrl: '', siteUrl: '' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-renowned private research university in Manhattan. Business, law, and arts. Yellow Ribbon participant. Exceptional career network.', applyUrl: '', siteUrl: '' },
    { name: 'Touro University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Jewish-sponsored independent university in New York. Health sciences, education, and business. Military-friendly with GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'West Point': [
    { name: 'SUNY New Paltz', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SUNY campus in New Paltz, NY. Fine arts, business, and education. Veteran-friendly with transfer pathways. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Marist College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private college on the Hudson River in Poughkeepsie. Business, communication, and fashion design. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Orange County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'SUNY community college in Middletown, NY. Business, healthcare, and technology programs. TA-eligible and affordable.', applyUrl: '', siteUrl: '' },
    { name: 'Vassar College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college in Poughkeepsie. Exceptional academics. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Myer': [
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university in Fairfax. Cybersecurity, engineering, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia. IT, healthcare, and business. TA accepted. Strong transfer pathway to GMU.', applyUrl: '', siteUrl: '' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Georgetown University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Elite Jesuit research university in DC. Law, international affairs, and medicine. Yellow Ribbon certified. Exceptional career network.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Richardson': [
    { name: 'University of Alaska Anchorage', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's largest university adjacent to Joint Base Elmendorf-Richardson. Nursing, engineering, and business. TA and GI Bill accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Alaska Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Small private university in Anchorage. Business, outdoor studies, and liberal arts. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
    { name: 'Charter College', type: 'Private', degree: '2-Year College', rating: 3.4, desc: 'Career-focused college with healthcare, business, and legal programs. Flexible online options for military families. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Shafter': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university in Honolulu. Business, engineering, and tropical agriculture. TA and GI Bill accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in downtown Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Honolulu. Technical and vocational programs including automotive, diesel, and culinary arts. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── CONUS Navy ───────────────────────────────────────────────────────────────
  'Naval Base San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus in San Diego. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified. World-class faculty.', applyUrl: '', siteUrl: '' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in downtown San Diego. Business, IT, and public safety programs. TA-eligible. Strong transfer pathway to SDSU and UC.', applyUrl: '', siteUrl: '' },
    { name: 'Point Loma Nazarene University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university overlooking San Diego Bay. Nursing, business, and kinesiology. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Station Mayport': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
    { name: 'Edward Waters University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Historic HBCU in Jacksonville. Business, criminal justice, and mass communications. Veteran-friendly community. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'NAS Pensacola': [
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Pensacola State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college near NAS Pensacola. Nursing, aviation maintenance, and business. TA-eligible. Strong transfer pathway to UWF.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'World-renowned aviation university in Daytona Beach. Aviation science, aerospace engineering, and flight. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'University of South Alabama', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Research university in Mobile, AL. Medical, nursing, and engineering programs. 60 miles from NAS Pensacola. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Base Kitsap': [
    { name: 'Olympic College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Bremerton adjacent to Naval Base Kitsap. Business, healthcare, and IT. TA accepted. Strong veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public research university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified. Exceptional faculty.', applyUrl: '', siteUrl: '' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham. Business, education, and environmental sciences. Military-friendly campus. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Lutheran university in Tacoma. Nursing, business, and education programs. Yellow Ribbon participant. Active military community.', applyUrl: '', siteUrl: '' },
  ],
  'NAS Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
    { name: 'Florida Coastal School of Law', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Law school in Jacksonville offering JD and hybrid programs. Veteran-friendly campus. GI Bill and Yellow Ribbon accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Base Ventura County': [
    { name: 'CSU Channel Islands', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'California State campus in Camarillo near NBVC. Business, education, and nursing. TA and GI Bill accepted. Veteran-friendly.', applyUrl: '', siteUrl: '' },
    { name: 'Ventura College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Ventura, CA. Business, healthcare, and computer information systems. TA-eligible. Transfer pathways to CSU and UC.', applyUrl: '', siteUrl: '' },
    { name: 'UC Santa Barbara', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus near NBVC. Engineering, business economics, and sciences. Yellow Ribbon certified. World-class research.', applyUrl: '', siteUrl: '' },
    { name: 'Cal Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private Lutheran university in Thousand Oaks. Business, education, and psychology. Yellow Ribbon participant. Military scholarships available.', applyUrl: '', siteUrl: '' },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 15 minutes from JBPHH.", applyUrl: '', siteUrl: '' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with Pearl Harbor campus and downtown Honolulu campus. Business, nursing, and military studies. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH system college in Pearl City, adjacent to JBPHH. Business, healthcare, and liberal arts. TA accepted. Strong transfer pathways.', applyUrl: '', siteUrl: '' },
    { name: 'Chaminade University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic Marianist university in Honolulu. Criminal justice, business, and nursing. Military-friendly. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
  ],
  'NAS Whidbey Island': [
    { name: 'Skagit Valley College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving Whidbey Island and Skagit Valley. Business, healthcare, and trades. TA-eligible. Closest college to NAS Whidbey.', applyUrl: '', siteUrl: '' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 40 miles from NAS Whidbey. Business, education, and environmental studies. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus in Bothell. Business, nursing, and computer science. Veteran-friendly with TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Station Everett': [
    { name: 'Everett Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Everett, WA. Business, healthcare, and engineering technology. TA accepted. Adjacent to Naval Station Everett.', applyUrl: '', siteUrl: '' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus 20 miles south. Business, nursing, and computer science. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 30 miles north. Business, education, and environmental studies. Military-friendly campus.', applyUrl: '', siteUrl: '' },
  ],
  'NAS Corpus Christi': [
    { name: 'Texas A&M University Corpus Christi', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'A&M system university on the island. Business, nursing, and marine sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Del Mar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Corpus Christi. Healthcare, business, and culinary arts. TA-eligible. Transfer pathways to A&M Corpus Christi.', applyUrl: '', siteUrl: '' },
  ],
  'NAS Oceana': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Norfolk, VA. Dedicated military center, engineering, and business. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads including Virginia Beach. Nursing, IT, and business. TA-eligible. Transfer partner with ODU.', applyUrl: '', siteUrl: '' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus. Military tuition discount.', applyUrl: '', siteUrl: '' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology. Veteran-friendly campus. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── CONUS Marine Corps ───────────────────────────────────────────────────────
  'MCAS Cherry Point': [
    { name: 'Craven Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in New Bern, NC. Healthcare, business, and technology. TA accepted. Closest college to MCAS Cherry Point.', applyUrl: '', siteUrl: '' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'UNC Wilmington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'UNC system campus on the coast. Marine biology, business, and nursing. Military-friendly campus. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Carteret Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Small community college in Morehead City, NC. Marine technology and business programs. TA-eligible. Coastal focus.', applyUrl: '', siteUrl: '' },
  ],
  'MCAS Miramar': [
    { name: 'San Diego Miramar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to MCAS Miramar. Aviation, business, and IT programs. TA-eligible. Strong transfer pathway.', applyUrl: '', siteUrl: '' },
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus near MCAS Miramar. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
    { name: 'National University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Nonprofit private university serving adult learners. Business, education, and IT. Month-by-month enrollment. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'MCB Quantico': [
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia with Manassas campus near Quantico. IT, healthcare, and business. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university. Cybersecurity, law, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Virginia Tech', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Top-ranked public research university. Engineering, architecture, and business. Yellow Ribbon participant. 75 miles from Quantico.', applyUrl: '', siteUrl: '' },
    { name: 'University of Mary Washington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university in Fredericksburg. Business, computer science, and education. 15 miles from MCB Quantico.', applyUrl: '', siteUrl: '' },
  ],
  'MCAS New River': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Primary college for Jacksonville, NC military community. On-post classes available. TA accepted. Healthcare and IT programs.', applyUrl: '', siteUrl: '' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville. Nursing, business, and engineering. 1 hour from MCAS New River. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with Jacksonville campus near MCAS New River. Business, criminal justice, and education.', applyUrl: '', siteUrl: '' },
  ],
  'MCB Hawaii Kaneohe Bay': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 20 minutes from MCB Hawaii.", applyUrl: '', siteUrl: '' },
    { name: 'Windward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Kaneohe, adjacent to MCB Hawaii. Liberal arts, science, and healthcare pathways. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'MCAS Yuma': [
    { name: 'Arizona Western College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Yuma adjacent to MCAS Yuma. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: '', siteUrl: '' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with online programs accessible from Yuma. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Arizona State University Online', type: 'Public', degree: '4-Year University', rating: 4.0, desc: '#1 US News innovation university with fully online programs. Business, engineering, and computer science. Excellent military support and TA eligible.', applyUrl: '', siteUrl: '' },
  ],
  'MCAS Beaufort': [
    { name: 'Technical College of the Lowcountry', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Beaufort, SC. Healthcare, business, and technology. TA-eligible. Closest college to MCAS Beaufort.', applyUrl: '', siteUrl: '' },
    { name: 'University of South Carolina Beaufort', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC campus in Beaufort. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Coastal Carolina University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Conway, SC. Business, education, and marine science. Military-friendly campus. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── CONUS Air Force / Space Force ────────────────────────────────────────────
  'Joint Base Langley-Eustis': [
    { name: 'Hampton University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Historic HBCU in Hampton, VA. Business, nursing, and engineering. Adjacent to JBLE. Yellow Ribbon certified. Strong veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Thomas Nelson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Hampton. Business, healthcare, and technology programs. TA-eligible. Transfer pathways to ODU and other VA schools.', applyUrl: '', siteUrl: '' },
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Research university in Norfolk. Engineering, business, and education. Dedicated military center. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Christopher Newport University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public liberal arts university in Newport News. Business, leadership, and science. Veteran-friendly campus. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Eglin AFB': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville adjacent to Eglin AFB. Business, healthcare, and professional programs. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Eglin AFB. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base classes at Eglin. Popular with Air Force members. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'MacDill AFB': [
    { name: 'University of Tampa', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Private university in downtown Tampa. Business, nursing, and international business. Yellow Ribbon participant. Minutes from MacDill AFB.', applyUrl: '', siteUrl: '' },
    { name: 'Hillsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in Tampa. Healthcare, IT, and business. TA-eligible. Strong transfer pathway to USF and UT.', applyUrl: '', siteUrl: '' },
    { name: 'University of South Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Tampa. Engineering, medicine, and business. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Eckerd College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private liberal arts college in St. Petersburg. Marine science, business, and psychology. Yellow Ribbon certified. Waterfront campus.', applyUrl: '', siteUrl: '' },
  ],
  'Tyndall AFB': [
    { name: 'Gulf Coast State College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'State college in Panama City, FL. Business, healthcare, and technology programs. TA-eligible. Closest college to Tyndall AFB.', applyUrl: '', siteUrl: '' },
    { name: 'FSU Panama City', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Florida State University branch campus in Panama City. Business, computer science, and social sciences. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus serving the Tyndall area. Business, criminal justice, and social sciences. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Barksdale AFB': [
    { name: 'Bossier Parish Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to Barksdale AFB. Healthcare, business, and technology. TA-eligible. Closest college to base.', applyUrl: '', siteUrl: '' },
    { name: 'Louisiana Tech University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Ruston, LA. Engineering, business, and computer science. 30 miles from Barksdale. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Centenary College', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private liberal arts college in Shreveport. Business, education, and natural sciences. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
    { name: 'LSU Shreveport', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'LSU system campus in Shreveport. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Tinker AFB': [
    { name: 'Rose State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Midwest City adjacent to Tinker AFB. IT, aviation maintenance, and healthcare. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'University of Central Oklahoma', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Edmond, OK. Business, education, and forensic science. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Oklahoma State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Oklahoma land-grant university. Engineering, business, and agriculture. Strong research programs. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Southern Nazarene University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Bethany, OK. Business, education, and nursing. Yellow Ribbon participant. Military-friendly community.', applyUrl: '', siteUrl: '' },
  ],
  'Offutt AFB': [
    { name: 'Bellevue University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Military-friendly private university adjacent to Offutt AFB. Business, IT, and cybersecurity. TA and GI Bill accepted. Flexible scheduling.', applyUrl: '', siteUrl: '' },
    { name: 'Metropolitan Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Omaha. IT, healthcare, and business. TA-eligible. Strong transfer pathways to UNO and Creighton.', applyUrl: '', siteUrl: '' },
    { name: 'University of Nebraska Omaha', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Omaha. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Creighton University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Omaha. Medicine, law, and business. Yellow Ribbon participant. Excellent healthcare programs.', applyUrl: '', siteUrl: '' },
  ],
  'Whiteman AFB': [
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Warrensburg, MO. Business, education, and aviation. Active veteran services. 15 minutes from Whiteman AFB.', applyUrl: '', siteUrl: '' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture. TA-eligible. Affordable and convenient.', applyUrl: '', siteUrl: '' },
    { name: 'Missouri S&T', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Missouri University of Science & Technology. Top-ranked STEM programs. Engineering and computer science. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Scott AFB': [
    { name: 'McKendree University', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private university in Lebanon, IL. Business, nursing, and education. Yellow Ribbon participant. Minutes from Scott AFB.', applyUrl: '', siteUrl: '' },
    { name: 'Southwestern Illinois College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving metro-east Illinois. Business, healthcare, and technology. TA-eligible. Strong transfer pathways.', applyUrl: '', siteUrl: '' },
    { name: 'Southern Illinois University Edwardsville', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SIU campus near Scott AFB. Business, engineering, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Lindenwood University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in St. Charles, MO. Business, communications, and education. Military-friendly with GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Wright-Patterson AFB': [
    { name: 'Wright State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university adjacent to Wright-Patterson AFB. Engineering, business, and medicine. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Sinclair Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Dayton. Aviation technology, IT, and healthcare. TA-eligible. Transfer pathways to WSU. Strong military support.', applyUrl: '', siteUrl: '' },
    { name: 'University of Dayton', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Catholic research university in Dayton. Engineering, law, and business. Yellow Ribbon participant. Close to Wright-Patterson.', applyUrl: '', siteUrl: '' },
    { name: 'Air Force Institute of Technology', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Graduate school of engineering and management on Wright-Patterson AFB. STEM graduate degrees exclusively for military. Free for eligible service members.', applyUrl: '', siteUrl: '' },
  ],
  'Joint Base Andrews': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Andrews. Engineering, business, and cybersecurity. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: "Prince George's Community College", type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college near Joint Base Andrews. Healthcare, IT, and business. TA-eligible. Transfer pathways to UMD and other MD schools.', applyUrl: '', siteUrl: '' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Bowie State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Bowie, MD. Business, computer science, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Nellis AFB': [
    { name: 'College of Southern Nevada', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Las Vegas. Business, healthcare, and culinary arts. TA-eligible. Closest college to Nellis AFB.', applyUrl: '', siteUrl: '' },
    { name: 'University of Nevada Las Vegas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Las Vegas. Business, hospitality, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Nevada State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Henderson, NV. Business, education, and nursing. Military-friendly with flexible scheduling. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Touro University Nevada', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private health sciences university in Henderson. Healthcare and business programs. GI Bill accepted. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Travis AFB': [
    { name: 'Solano Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Fairfield adjacent to Travis AFB. Business, healthcare, and aviation. TA-eligible. Closest college to base.', applyUrl: '', siteUrl: '' },
    { name: 'UC Davis', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Davis. Veterinary medicine, engineering, and business. Yellow Ribbon certified. 25 miles from Travis AFB.', applyUrl: '', siteUrl: '' },
    { name: 'California State University Sacramento', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Sacramento. Business, criminal justice, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo, near Travis AFB. Osteopathic medicine, pharmacy, and public health. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Edwards AFB': [
    { name: 'Antelope Valley College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Lancaster, CA near Edwards AFB. Aerospace, business, and healthcare. TA-eligible. Strong aviation programs.', applyUrl: '', siteUrl: '' },
    { name: 'Cal State San Bernardino', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus with business, education, and nursing programs. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'California State University Mojave', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'CSU satellite programs serving the high desert community near Edwards AFB. Business and education. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Keesler AFB': [
    { name: 'Mississippi Gulf Coast Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Biloxi adjacent to Keesler AFB. IT, healthcare, and business. TA-eligible. Excellent transfer pathways.', applyUrl: '', siteUrl: '' },
    { name: 'University of Southern Mississippi', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public research university in Hattiesburg. Business, nursing, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'William Carey University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Hattiesburg. Nursing, education, and business. Yellow Ribbon participant. Military-friendly campus.', applyUrl: '', siteUrl: '' },
  ],
  'Little Rock AFB': [
    { name: 'University of Arkansas at Little Rock', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'UA system campus in Little Rock. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Pulaski Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in North Little Rock near the air base. Healthcare, IT, and business. TA-eligible. Affordable tuition.', applyUrl: '', siteUrl: '' },
    { name: 'Hendrix College', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly regarded private liberal arts college in Conway, AR. Sciences, business, and humanities. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Dyess AFB': [
    { name: 'Hardin-Simmons University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Abilene. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: '', siteUrl: '' },
    { name: 'McMurry University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Methodist university in Abilene. Business, education, and nursing. GI Bill accepted. Small campus with strong faculty.', applyUrl: '', siteUrl: '' },
    { name: 'Cisco College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Cisco, TX. Agriculture, business, and vocational programs. TA-eligible. Affordable community college option.', applyUrl: '', siteUrl: '' },
    { name: 'Abilene Christian University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university in Abilene. Theology, business, and sciences. Yellow Ribbon participant. Active military community.', applyUrl: '', siteUrl: '' },
  ],
  'Luke AFB': [
    { name: 'Glendale Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Maricopa community college adjacent to Luke AFB. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: '', siteUrl: '' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Nation\'s #1 innovation university. Business, engineering, and health sciences. Enormous online program. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Grand Canyon University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Phoenix. Business, education, and nursing. Military-friendly with Yellow Ribbon. Extensive online programs.', applyUrl: '', siteUrl: '' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with extensive online programs. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Davis-Monthan AFB': [
    { name: 'Pima Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Tucson. Business, healthcare, and aviation maintenance. TA-eligible. Closest community college to Davis-Monthan.', applyUrl: '', siteUrl: '' },
    { name: 'University of Arizona', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Flagship Arizona public research university. Engineering, medicine, and business. Yellow Ribbon certified. 10 minutes from base.', applyUrl: '', siteUrl: '' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "#1 US innovation university. Massive online program for military. Business, engineering, and health sciences. TA and GI Bill accepted.", applyUrl: '', siteUrl: '' },
    { name: 'Cochise College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sierra Vista, AZ near Fort Huachuca. Business, healthcare, and public safety. TA-eligible.', applyUrl: '', siteUrl: '' },
  ],
  'Fairchild AFB': [
    { name: 'Eastern Washington University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Cheney, WA adjacent to Fairchild AFB. Business, education, and dental hygiene. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Gonzaga University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Spokane. Business, law, and nursing. Yellow Ribbon participant. Excellent academic reputation.', applyUrl: '', siteUrl: '' },
    { name: 'Washington State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Flagship Washington land-grant university in Pullman. Engineering, veterinary medicine, and business. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Spokane Falls Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Spokane. Business, IT, and healthcare. TA-eligible. Strong transfer pathways to EWU and WSU.', applyUrl: '', siteUrl: '' },
  ],
  'Hill AFB': [
    { name: 'Weber State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Ogden adjacent to Hill AFB. Business, engineering technology, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Utah State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Utah land-grant research university in Logan. Engineering, business, and agriculture. Strong online programs. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Ogden-Weber Applied Technology College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Applied technology college in Ogden. Skilled trades, healthcare, and IT certifications. TA-eligible. Excellent for vocational training.', applyUrl: '', siteUrl: '' },
    { name: 'Brigham Young University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private LDS university in Provo. Business, engineering, and law. Low tuition and Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Minot AFB': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Minot, ND near the air base. Business, education, and criminal justice. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Community college in Bottineau, ND. Agriculture, business, and health programs. TA-eligible. Affordable rural community college.', applyUrl: '', siteUrl: '' },
    { name: 'University of Mary', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic university in Bismarck, ND. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: '', siteUrl: '' },
  ],
  'Malmstrom AFB': [
    { name: 'University of Providence', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic university in Great Falls, MT. Business, nursing, and education. Yellow Ribbon participant. Minutes from Malmstrom AFB.', applyUrl: '', siteUrl: '' },
    { name: 'Montana State University Great Falls', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'MSU college of technology in Great Falls. Business, healthcare, and trades. TA-eligible. Closest public college to Malmstrom.', applyUrl: '', siteUrl: '' },
    { name: 'Montana State University Bozeman', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Montana research university. Engineering, agriculture, and business. Strong online programs. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Ellsworth AFB': [
    { name: 'Western Dakota Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Rapid City near Ellsworth AFB. Skilled trades, healthcare, and IT. TA-eligible. Excellent vocational programs.', applyUrl: '', siteUrl: '' },
    { name: 'South Dakota School of Mines', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Engineering-focused public university in Rapid City. Highly ranked STEM programs. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Mount Marty University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic Benedictine university in Yankton, SD. Healthcare, business, and education. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Hurlburt Field': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville, FL near Hurlburt Field. Business, healthcare, and professional programs. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Hurlburt Field. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Moody AFB': [
    { name: 'Valdosta State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Valdosta, GA near Moody AFB. Business, nursing, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'South Georgia Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Americus, GA. Healthcare, business, and technology. TA-eligible. Strong workforce training programs.', applyUrl: '', siteUrl: '' },
    { name: 'Abraham Baldwin Agricultural College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Georgia public college in Tifton. Agriculture, business, and science programs. TA-eligible. Transfer pathway to UGA and GA Tech.', applyUrl: '', siteUrl: '' },
  ],
  'Shaw AFB': [
    { name: 'Central Carolina Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in Sumter, SC adjacent to Shaw AFB. Healthcare, IT, and business. TA-eligible. Closest college to base.', applyUrl: '', siteUrl: '' },
    { name: 'University of South Carolina Sumter', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'USC campus in Sumter. Business, liberal arts, and natural sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Columbia College', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private liberal arts college in Columbia, SC. Business, education, and music. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Seymour Johnson AFB': [
    { name: 'Wayne Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Goldsboro, NC adjacent to Seymour Johnson AFB. Business, healthcare, and IT. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. 30 miles from base.', applyUrl: '', siteUrl: '' },
    { name: 'Mount Olive University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university near Seymour Johnson. Business, criminal justice, and education. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Joint Base San Antonio': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science. Active veteran services and military tuition discounts.', applyUrl: '', siteUrl: '' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts. TA accepted. Low tuition.', applyUrl: '', siteUrl: '' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university in San Antonio. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: '', siteUrl: '' },
  ],
  'Buckley SFB': [
    { name: 'University of Colorado Denver', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Denver. Business, engineering, and health sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Community College of Denver', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Denver. Healthcare, business, and technology. TA-eligible. Transfer pathways to CU Denver and MSU Denver.', applyUrl: '', siteUrl: '' },
    { name: 'Metropolitan State University of Denver', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in downtown Denver. Business, education, and aviation. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Schriever SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Colorado Springs. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: '', siteUrl: '' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Peterson SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus near Peterson SFB. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: '', siteUrl: '' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, IT, and business. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  // ── OCONUS ───────────────────────────────────────────────────────────────────
  'Osan Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'University of Maryland Global Campus Asia. On-base classes at Osan AB. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs available at Osan AB. Online with on-base support. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Walker': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Camp Walker. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Carroll': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Carroll. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'USAG Yongsan': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at USAG Yongsan/Seoul. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at USAG Yongsan. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Zama': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Zama, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at Camp Zama. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Misawa Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Misawa Air Base, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degrees and certificates. Flexible scheduling. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs at Misawa AB. Online with on-base support sessions. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Air Facility Atsugi': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at NAF Atsugi, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'MCAS Iwakuni': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at MCAS Iwakuni, Japan. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at MCAS Iwakuni. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Spangdahlem Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Spangdahlem AB, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU residential campus in Europe. Aviation management and aerospace engineering. Available near Spangdahlem.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'USAG Wiesbaden': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Wiesbaden, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU courses available at Wiesbaden. Aviation management and aerospace programs. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes at Wiesbaden. Business and social sciences. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'USAG Grafenwöhr': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Grafenwöhr. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available at Grafenwöhr. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Grafenwöhr. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'USAG Ansbach': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Ansbach, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available near Ansbach. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European classes near Ansbach. Business and social sciences. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Aviano Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Aviano AB, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation management and aerospace engineering. Available at Aviano. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes at Aviano. Business and social sciences. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Air Station Sigonella': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at NAS Sigonella, Sicily. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at NAS Sigonella. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Darby': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Camp Darby, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes near Camp Darby. Business and criminal justice. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Station Rota': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Naval Station Rota, Spain. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NS Rota. Flexible scheduling. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Andersen Air Force Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses at Andersen AFB, Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Andersen. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Joint Region Marianas': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses in Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Guam Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Local community college on Guam. Business, healthcare, and technology programs. TA-eligible. Strong transfer pathways.', applyUrl: '', siteUrl: '' },
    { name: 'University of Guam', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'The only four-year public university on Guam. Business, nursing, and education. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Al Udeid Air Base': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for deployed/OCONUS members at Al Udeid AB. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Al Udeid. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs including intelligence, security, and emergency management.', applyUrl: '', siteUrl: '' },
  ],
  'Camp Lemonnier': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at Camp Lemonnier, Djibouti. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Camp Lemonnier. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Incirlik Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Incirlik AB, Turkey. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at Incirlik. Flexible scheduling. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Bahrain Naval Support Activity': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at NSA Bahrain. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NSA Bahrain. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. Intelligence, security, and emergency management programs. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── Space Force ──────────────────────────────────────────────────────────────
  'Cape Canaveral Space Force Station': [
    { name: 'Florida Institute of Technology', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'STEM-focused private university in Melbourne, FL. Aerospace, engineering, and computer science. Strong ties to space industry and CCSFS. Yellow Ribbon.', applyUrl: '', siteUrl: '' },
    { name: 'Eastern Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Affordable community college near CCSFS. Engineering technology, business, and healthcare. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of Central Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university in Orlando. Aerospace engineering, computer science, and business. Strong veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Top aviation and aerospace university in Daytona Beach, 50 miles from CCSFS. Aviation science, aerospace engineering. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Los Angeles AFB': [
    { name: 'University of Southern California', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top private research university. Engineering, business, and aerospace. Yellow Ribbon participant. Strong industry connections to space industry.', applyUrl: '', siteUrl: '' },
    { name: 'UCLA', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Westwood. Engineering, business, and sciences. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
    { name: 'El Camino College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Torrance. Engineering technology, computer science, and business. TA-eligible. Transfer pathway to CSU/UC.', applyUrl: '', siteUrl: '' },
    { name: 'California State University Dominguez Hills', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Carson near LA AFB. Business, nursing, and technology. Military-friendly with veteran resource center.', applyUrl: '', siteUrl: '' },
  ],
  'Cheyenne Mountain SFS': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU campus adjacent to the Colorado Springs military community. Engineering, nursing, and business. Active veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Technology, business, and automotive. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'Cavalier Space Force Station': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Regional university in Minot, ND. Business, education, and nursing programs. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of North Dakota', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship state university with strong aviation and aerospace programs. 2 hours from Cavalier. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Affordable two-year college near the Canadian border region. Natural resources and business programs. TA-eligible.', applyUrl: '', siteUrl: '' },
  ],
  'Clear Space Force Station': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Major Alaskan research university. Engineering, natural science, and liberal arts. Strong veteran services. 100 miles from Clear SFS.', applyUrl: '', siteUrl: '' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Vocational and associate degree programs in Fairbanks. TA-eligible. IT, business, and health programs.', applyUrl: '', siteUrl: '' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading online university for military members. Available remotely at Clear SFS. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── Coast Guard ───────────────────────────────────────────────────────────────
  'USCG Training Center Cape May': [
    { name: 'Stockton University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university 30 miles from Cape May. Business, nursing, and social work. Veteran services office and TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Cape May County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Local community college with flexible scheduling for military. Business, healthcare, and criminal justice. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Rowan University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Growing public research university in Glassboro, NJ. Engineering, business, and health sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Base Kodiak': [
    { name: 'Kodiak College (UAF)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'University of Alaska Fairbanks community campus in Kodiak. Associate degrees and certificates. TA accepted. Career and technical programs.', applyUrl: '', siteUrl: '' },
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Flagship Alaskan university available via distance learning. Engineering, science, and liberal arts. GI Bill and TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university for military. Intelligence, emergency management, and security studies. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Base Honolulu': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Hawaii flagship research university. Business, engineering, and marine sciences. Strong veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with campuses in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Vocational and transfer programs in Honolulu. Automotive, electronics, and healthcare. TA-eligible.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Base Elizabeth City': [
    { name: 'College of the Albemarle', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Elizabeth City. Nursing, IT, and business programs. TA accepted. Flexible scheduling for shift workers.', applyUrl: '', siteUrl: '' },
    { name: 'Elizabeth City State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU with strong STEM programs, including aviation. Affordable tuition with veteran services. GI Bill and TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. 1 hour from Elizabeth City. Yellow Ribbon.', applyUrl: '', siteUrl: '' },
  ],
  'USCG ISC Portsmouth': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Monarch Military Center. Engineering, business, and education. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Nursing, IT, and business. Strong military family enrollment. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU near Portsmouth. Mass communications, technology, and social work. Veteran-friendly campus.', applyUrl: '', siteUrl: '' },
  ],
  'Coast Guard Island Alameda': [
    { name: 'California State University East Bay', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Hayward across the bay. Business, nursing, and computer science. Military-friendly with veteran resource center.', applyUrl: '', siteUrl: '' },
    { name: 'College of Alameda', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Peralta community college on Alameda Island. Aviation maintenance, business, and IT. TA-eligible. Very close to Coast Guard Island.', applyUrl: '', siteUrl: '' },
    { name: 'UC Berkeley', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'World-renowned public university across the bay. Engineering, business, and law. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
    { name: 'Saint Mary\'s College of California', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private Catholic liberal arts college. Business, nursing, and education. Yellow Ribbon participant. 20 minutes from CG Island.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Training Center Petaluma': [
    { name: 'Santa Rosa Junior College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'One of California\'s top community colleges. Business, nursing, and culinary arts. TA accepted. Transfer pathway to CSU/UC.', applyUrl: '', siteUrl: '' },
    { name: 'Sonoma State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Rohnert Park, 8 miles from TRACEN. Business, nursing, and liberal arts. Veteran-friendly campus.', applyUrl: '', siteUrl: '' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo. Physician assistant, pharmacy, and nursing programs. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector New York': [
    { name: 'College of Staten Island (CUNY)', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CUNY campus on Staten Island near USCG Sector NY. Nursing, business, and social work. Affordable tuition and TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-class private university in NYC. Law, business, and engineering. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
    { name: 'St. John\'s University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Catholic university in Queens. Law, pharmacy, and business. Yellow Ribbon and military tuition rates.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Miami': [
    { name: 'Florida International University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large research university in Miami. Business, engineering, and law. Strong veteran support office. GI Bill and TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Miami Dade College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Nation\'s largest community college system. Associate degrees and certificates. Very affordable. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'University of Miami', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Private research university in Coral Gables. Marine science, business, and law. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector New Orleans': [
    { name: 'Tulane University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Top private research university. Public health, business, and law. Yellow Ribbon participant. Strong veteran support.', applyUrl: '', siteUrl: '' },
    { name: 'University of New Orleans', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public urban university. Business, engineering, and film studies. Veteran-friendly with active veterans office.', applyUrl: '', siteUrl: '' },
    { name: 'Delgado Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Louisiana\'s largest community college. Healthcare, culinary arts, and IT. TA-eligible. Multiple campuses in metro area.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Houston-Galveston': [
    { name: 'University of Houston', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university. Business, engineering, and law. Active veteran services. GI Bill and TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'College of the Mainland', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Texas City near Galveston. Nursing, welding, and business. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'University of Texas Medical Branch (UTMB)', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Medical school and health sciences in Galveston. Nursing and allied health. Strong military connections.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large CSU campus. Business, engineering, and public health. Strong veteran support and military community.', applyUrl: '', siteUrl: '' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Downtown San Diego community college. Nursing, business, and IT. TA-eligible. Strong military enrollment.', applyUrl: '', siteUrl: '' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
  ],
  'USCG AIRSTA Traverse City': [
    { name: 'Northwestern Michigan College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Traverse City. Aviation, maritime, and business programs. TA-eligible. Strong career focus.', applyUrl: '', siteUrl: '' },
    { name: 'Central Michigan University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Regional university with distance learning options. Business, health sciences, and education. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Puget Sound': [
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified.', applyUrl: '', siteUrl: '' },
    { name: 'Seattle Central College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Downtown Seattle community college. Culinary, nursing, and IT programs. TA-eligible. Transfer pathway to UW.', applyUrl: '', siteUrl: '' },
    { name: 'Seattle University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Jesuit university in Seattle. Law, nursing, and business. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Boston': [
    { name: 'Massachusetts Maritime Academy', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Only public maritime academy in New England. Marine transportation, marine engineering, and emergency management. Strong CG connections.', applyUrl: '', siteUrl: '' },
    { name: 'Bunker Hill Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Boston. Business, healthcare, and liberal arts. TA-eligible. Transfer pathway to state universities.', applyUrl: '', siteUrl: '' },
    { name: 'Northeastern University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top co-op university. Engineering, business, and cybersecurity. Yellow Ribbon participant. Excellent veteran support.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Baltimore': [
    { name: 'University of Maryland Baltimore County', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public research university near Baltimore. Cybersecurity, engineering, and health sciences. Strong veteran services.', applyUrl: '', siteUrl: '' },
    { name: 'Community College of Baltimore County', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Multiple campuses in Baltimore area. Nursing, IT, and business. TA-eligible. Flexible scheduling.', applyUrl: '', siteUrl: '' },
    { name: 'Towson University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university near Baltimore. Business, nursing, and education programs. Veteran-friendly with active veterans services.', applyUrl: '', siteUrl: '' },
  ],
  'USCG AIRSTA Sitka': [
    { name: 'University of Alaska Southeast (Sitka)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UAS campus in Sitka. Associate degrees and certificates in business, health, and liberal arts. TA accepted.', applyUrl: '', siteUrl: '' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading fully online military university. Available from remote Alaska assignments. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville. Business, nursing, and computer science. Active veteran services and military tuition rates.', applyUrl: '', siteUrl: '' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college system in Jacksonville. Nursing, IT, and business. TA-eligible. Multiple campuses.', applyUrl: '', siteUrl: '' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university with aviation, nursing, and business programs. Military-friendly. Yellow Ribbon participant.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Sector Charleston': [
    { name: 'College of Charleston', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Historic public liberal arts university. Business, marine biology, and education. Veteran-friendly campus. GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Trident Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college in Charleston. Nursing, IT, and culinary arts. TA-eligible. High military enrollment.', applyUrl: '', siteUrl: '' },
    { name: 'The Citadel', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Military college of South Carolina. Business, science, and engineering. Strong connection to armed services. Yellow Ribbon.', applyUrl: '', siteUrl: '' },
  ],
};


const COLLEGE_ENROLLMENT_LINKS = {
  'Abilene Christian University': { applyUrl: 'https://www.acu.edu/admissions/', siteUrl: 'https://www.acu.edu' },
  'Abraham Baldwin Agricultural College': { applyUrl: 'https://www.abac.edu/admissions/', siteUrl: 'https://www.abac.edu' },
  'Air Force Institute of Technology': { applyUrl: 'https://www.afit.edu/registrar/admission/', siteUrl: 'https://www.afit.edu' },
  'Alaska Bible College': { applyUrl: 'https://www.akbible.edu/admissions/', siteUrl: 'https://www.akbible.edu' },
  'Alaska Pacific University': { applyUrl: 'https://alaskapacific.edu/admissions/', siteUrl: 'https://alaskapacific.edu' },
  'American Military University': { applyUrl: 'https://www.amu.apus.edu/enrollment/', siteUrl: 'https://www.amu.apus.edu' },
  'American University': { applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
  'Anne Arundel Community College': { applyUrl: 'https://www.aacc.edu/admissions/apply/', siteUrl: 'https://www.aacc.edu' },
  'Antelope Valley College': { applyUrl: 'https://www.avc.edu/admissions/', siteUrl: 'https://www.avc.edu' },
  'Arizona State University': { applyUrl: 'https://admission.asu.edu/', siteUrl: 'https://www.asu.edu' },
  'Arizona State University Online': { applyUrl: 'https://admission.asu.edu/online/', siteUrl: 'https://asuonline.asu.edu' },
  'Arizona Western College': { applyUrl: 'https://www.azwestern.edu/admissions/', siteUrl: 'https://www.azwestern.edu' },
  'Auburn University at Montgomery': { applyUrl: 'https://www.aum.edu/admissions/', siteUrl: 'https://www.aum.edu' },
  'Augusta Technical College': { applyUrl: 'https://www.augustatech.edu/admissions/', siteUrl: 'https://www.augustatech.edu' },
  'Augusta University': { applyUrl: 'https://www.augusta.edu/admissions/', siteUrl: 'https://www.augusta.edu' },
  'Austin Peay State University': { applyUrl: 'https://www.apsu.edu/admissions/apply/', siteUrl: 'https://www.apsu.edu' },
  'Bellevue University': { applyUrl: 'https://www.bellevue.edu/admissions/', siteUrl: 'https://www.bellevue.edu' },
  'Benedict College': { applyUrl: 'https://www.benedict.edu/admissions/', siteUrl: 'https://www.benedict.edu' },
  'Bossier Parish Community College': { applyUrl: 'https://www.bpcc.edu/admissions/', siteUrl: 'https://www.bpcc.edu' },
  'Bowie State University': { applyUrl: 'https://www.bowiestate.edu/admissions/', siteUrl: 'https://www.bowiestate.edu' },
  'Brigham Young University': { applyUrl: 'https://admissions.byu.edu/', siteUrl: 'https://www.byu.edu' },
  'Brooklyn College CUNY': { applyUrl: 'https://www.brooklyn.cuny.edu/web/admissions.php', siteUrl: 'https://www.brooklyn.cuny.edu' },
  'Bunker Hill Community College': { applyUrl: 'https://www.bhcc.edu/admissions/', siteUrl: 'https://www.bhcc.edu' },
  'CSU Channel Islands': { applyUrl: 'https://www.csuci.edu/admissions/', siteUrl: 'https://www.csuci.edu' },
  'Cal Lutheran University': { applyUrl: 'https://www.callutheran.edu/admissions/', siteUrl: 'https://www.callutheran.edu' },
  'Cal State San Bernardino': { applyUrl: 'https://www.csusb.edu/admissions/', siteUrl: 'https://www.csusb.edu' },
  'California State University Dominguez Hills': { applyUrl: 'https://www.csudh.edu/admissions/', siteUrl: 'https://www.csudh.edu' },
  'California State University Sacramento': { applyUrl: 'https://www.csus.edu/admissions/', siteUrl: 'https://www.csus.edu' },
  'California State University San Marcos': { applyUrl: 'https://www.csusm.edu/admissions/undergraduate/apply/', siteUrl: 'https://www.csusm.edu' },
  'Campbell University': { applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
  'Campbellsville University': { applyUrl: 'https://www.campbellsville.edu/admissions/', siteUrl: 'https://www.campbellsville.edu' },
  'Capitol Technology University': { applyUrl: 'https://www.captechu.edu/admissions/apply', siteUrl: 'https://www.captechu.edu' },
  'Carteret Community College': { applyUrl: 'https://www.carteret.edu/admissions/', siteUrl: 'https://www.carteret.edu' },
  'Central Carolina Technical College': { applyUrl: 'https://www.cctech.edu/admissions/', siteUrl: 'https://www.cctech.edu' },
  'Central Michigan University': { applyUrl: 'https://www.cmich.edu/admissions/', siteUrl: 'https://www.cmich.edu' },
  'Central Texas College': { applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu' },
  'Chaminade University': { applyUrl: 'https://www.chaminade.edu/admissions/', siteUrl: 'https://www.chaminade.edu' },
  'Christopher Newport University': { applyUrl: 'https://admissions.cnu.edu/', siteUrl: 'https://www.cnu.edu' },
  'Cisco College': { applyUrl: 'https://www.cisco.edu/admissions/', siteUrl: 'https://www.cisco.edu' },
  'Clarkson University': { applyUrl: 'https://www.clarkson.edu/admissions/apply', siteUrl: 'https://www.clarkson.edu' },
  'Coastal Carolina Community College': { applyUrl: 'https://www.coastalcarolina.edu/admissions/how-to-apply/', siteUrl: 'https://www.coastalcarolina.edu' },
  'Coastal Carolina University': { applyUrl: 'https://www.coastal.edu/admissions/', siteUrl: 'https://www.coastal.edu' },
  'Coastal Pines Technical College': { applyUrl: 'https://www.coastalpines.edu/admissions/', siteUrl: 'https://www.coastalpines.edu' },
  'Cochise College': { applyUrl: 'https://www.cochise.edu/admissions/', siteUrl: 'https://www.cochise.edu' },
  'College of Alameda': { applyUrl: 'https://alameda.peralta.edu/enrollment-services/admissions/', siteUrl: 'https://alameda.peralta.edu' },
  'College of Charleston': { applyUrl: 'https://admissions.cofc.edu/', siteUrl: 'https://www.cofc.edu' },
  'College of Coastal Georgia': { applyUrl: 'https://www.ccga.edu/admissions/', siteUrl: 'https://www.ccga.edu' },
  'College of Southern Nevada': { applyUrl: 'https://www.csn.edu/admissions/', siteUrl: 'https://www.csn.edu' },
  'College of Staten Island (CUNY)': { applyUrl: 'https://www.csi.cuny.edu/admissions', siteUrl: 'https://www.csi.cuny.edu' },
  'College of the Albemarle': { applyUrl: 'https://www.albemarle.edu/admissions/', siteUrl: 'https://www.albemarle.edu' },
  'College of the Mainland': { applyUrl: 'https://www.com.edu/admissions/', siteUrl: 'https://www.com.edu' },
  'Colorado College': { applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  'Columbia College': { applyUrl: 'https://www.columbiasc.edu/admissions/', siteUrl: 'https://www.columbiasc.edu' },
  'Columbia International University': { applyUrl: 'https://www.ciu.edu/admissions/', siteUrl: 'https://www.ciu.edu' },
  'Columbus State University': { applyUrl: 'https://www.columbusstate.edu/admissions/', siteUrl: 'https://www.columbusstate.edu' },
  'Columbus Technical College': { applyUrl: 'https://www.columbustech.edu/admissions/', siteUrl: 'https://www.columbustech.edu' },
  'Community College of Baltimore County': { applyUrl: 'https://www.ccbcmd.edu/Getting-Started/Apply-for-Admission.html', siteUrl: 'https://www.ccbcmd.edu' },
  'Community College of Denver': { applyUrl: 'https://www.ccd.edu/admissions/', siteUrl: 'https://www.ccd.edu' },
  'Craven Community College': { applyUrl: 'https://www.cravencc.edu/admissions/', siteUrl: 'https://www.cravencc.edu' },
  'Creighton University': { applyUrl: 'https://admissions.creighton.edu/', siteUrl: 'https://www.creighton.edu' },
  'Dakota College at Bottineau': { applyUrl: 'https://www.dakotacollege.edu/admissions/', siteUrl: 'https://www.dakotacollege.edu' },
  'Del Mar College': { applyUrl: 'https://www.delmar.edu/admissions/', siteUrl: 'https://www.delmar.edu' },
  'Delgado Community College': { applyUrl: 'https://www.dcc.edu/admissions/', siteUrl: 'https://www.dcc.edu' },
  'Drury University': { applyUrl: 'https://www.drury.edu/admissions/', siteUrl: 'https://www.drury.edu' },
  'East Carolina University': { applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
  'Eastern Florida State College': { applyUrl: 'https://www.easternflorida.edu/admissions/', siteUrl: 'https://www.easternflorida.edu' },
  'Eastern Washington University': { applyUrl: 'https://www.ewu.edu/admissions/', siteUrl: 'https://www.ewu.edu' },
  'Eckerd College': { applyUrl: 'https://www.eckerd.edu/admissions/', siteUrl: 'https://www.eckerd.edu' },
  'El Camino College': { applyUrl: 'https://www.elcamino.edu/admissions/', siteUrl: 'https://www.elcamino.edu' },
  'El Paso Community College': { applyUrl: 'https://www.epcc.edu/Admissions/', siteUrl: 'https://www.epcc.edu' },
  'Elizabeth City State University': { applyUrl: 'https://www.ecsu.edu/admissions/index.html', siteUrl: 'https://www.ecsu.edu' },
  'Elizabethtown Community & Technical College': { applyUrl: 'https://elizabethtown.kctcs.edu/admissions/', siteUrl: 'https://elizabethtown.kctcs.edu' },
  'Embry-Riddle Aeronautical University': { applyUrl: 'https://daytonabeach.erau.edu/admissions/', siteUrl: 'https://daytonabeach.erau.edu' },
  'Embry-Riddle Aeronautical University Worldwide': { applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  'Embry-Riddle European Campus': { applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
  'Enterprise State Community College': { applyUrl: 'https://www.escc.edu/admissions/', siteUrl: 'https://www.escc.edu' },
  'Everett Community College': { applyUrl: 'https://www.everettcc.edu/admissions/', siteUrl: 'https://www.everettcc.edu' },
  'FSU Panama City': { applyUrl: 'https://pc.fsu.edu/admissions/', siteUrl: 'https://pc.fsu.edu' },
  'Fayetteville State University': { applyUrl: 'https://www.uncfsu.edu/admissions', siteUrl: 'https://www.uncfsu.edu' },
  'Fayetteville Technical Community College': { applyUrl: 'https://www.faytechcc.edu/admissions/apply', siteUrl: 'https://www.faytechcc.edu' },
  'Florida Institute of Technology': { applyUrl: 'https://www.fit.edu/admissions/undergraduate/', siteUrl: 'https://www.fit.edu' },
  'Florida International University': { applyUrl: 'https://admissions.fiu.edu/', siteUrl: 'https://www.fiu.edu' },
  'Florida State College at Jacksonville': { applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
  'George Mason University': { applyUrl: 'https://admissions.gmu.edu/', siteUrl: 'https://www.gmu.edu' },
  'Georgetown University': { applyUrl: 'https://uadmissions.georgetown.edu/', siteUrl: 'https://www.georgetown.edu' },
  'Georgia Southern University': { applyUrl: 'https://admissions.georgiasouthern.edu/', siteUrl: 'https://www.georgiasouthern.edu' },
  'Glendale Community College': { applyUrl: 'https://www.glendale.edu/admissions/', siteUrl: 'https://www.glendale.edu' },
  'Gonzaga University': { applyUrl: 'https://www.gonzaga.edu/admissions/', siteUrl: 'https://www.gonzaga.edu' },
  'Grand Canyon University': { applyUrl: 'https://www.gcu.edu/admissions/', siteUrl: 'https://www.gcu.edu' },
  'Guam Community College': { applyUrl: 'https://www.guamcc.edu/admissions/', siteUrl: 'https://www.guamcc.edu' },
  'Gulf Coast State College': { applyUrl: 'https://www.gulfcoast.edu/admissions/', siteUrl: 'https://www.gulfcoast.edu' },
  'Hampton University': { applyUrl: 'https://www.hamptonu.edu/admissions/', siteUrl: 'https://www.hamptonu.edu' },
  'Hardin-Simmons University': { applyUrl: 'https://www.hsutx.edu/admissions/', siteUrl: 'https://www.hsutx.edu' },
  'Hawaii Pacific University': { applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
  'Hendrix College': { applyUrl: 'https://www.hendrix.edu/admissions/', siteUrl: 'https://www.hendrix.edu' },
  'Hillsborough Community College': { applyUrl: 'https://www.hccfl.edu/admissions/', siteUrl: 'https://www.hccfl.edu' },
  'Honolulu Community College': { applyUrl: 'https://honolulu.hawaii.edu/admissions', siteUrl: 'https://honolulu.hawaii.edu' },
  'Jacksonville University': { applyUrl: 'https://www.ju.edu/admissions/', siteUrl: 'https://www.ju.edu' },
  'Jefferson Community College': { applyUrl: 'https://www.sunyjefferson.edu/admissions/apply/', siteUrl: 'https://www.sunyjefferson.edu' },
  'John Tyler Community College': { applyUrl: 'https://www.jtcc.edu/admissions/', siteUrl: 'https://www.jtcc.edu' },
  'Johnson County Community College': { applyUrl: 'https://www.jccc.edu/admissions/', siteUrl: 'https://www.jccc.edu' },
  'Kansas City Kansas Community College': { applyUrl: 'https://www.kckcc.edu/admissions/', siteUrl: 'https://www.kckcc.edu' },
  'Kingsborough Community College': { applyUrl: 'https://www.kbcc.cuny.edu/admissions/', siteUrl: 'https://www.kbcc.cuny.edu' },
  'Kodiak College (UAF)': { applyUrl: 'https://www.uaf.edu/kodiak/admissions/', siteUrl: 'https://www.uaf.edu/kodiak/' },
  'LSU Shreveport': { applyUrl: 'https://www.lsus.edu/admissions/', siteUrl: 'https://www.lsus.edu' },
  'Leeward Community College': { applyUrl: 'https://www.leeward.hawaii.edu/admissions', siteUrl: 'https://www.leeward.hawaii.edu' },
  'Lindenwood University': { applyUrl: 'https://www.lindenwood.edu/admissions/', siteUrl: 'https://www.lindenwood.edu' },
  'Louisiana Tech University': { applyUrl: 'https://admissions.latech.edu/', siteUrl: 'https://www.latech.edu' },
  'Marist College': { applyUrl: 'https://www.marist.edu/admissions/apply/', siteUrl: 'https://www.marist.edu' },
  'Massachusetts Maritime Academy': { applyUrl: 'https://www.maritime.edu/admissions', siteUrl: 'https://www.maritime.edu' },
  'McKendree University': { applyUrl: 'https://www.mckendree.edu/admissions/', siteUrl: 'https://www.mckendree.edu' },
  'McMurry University': { applyUrl: 'https://www.mcm.edu/admissions/', siteUrl: 'https://www.mcm.edu' },
  'Methodist University': { applyUrl: 'https://www.methodist.edu/admissions/apply-now/', siteUrl: 'https://www.methodist.edu' },
  'Metropolitan Community College': { applyUrl: 'https://www.mccneb.edu/admissions/', siteUrl: 'https://www.mccneb.edu' },
  'Metropolitan State University of Denver': { applyUrl: 'https://www.msudenver.edu/admissions/', siteUrl: 'https://www.msudenver.edu' },
  'Miami Dade College': { applyUrl: 'https://www.mdc.edu/admissions/', siteUrl: 'https://www.mdc.edu' },
  'Middle Tennessee State University': { applyUrl: 'https://www.mtsu.edu/admissions/apply.php', siteUrl: 'https://www.mtsu.edu' },
  'Midlands Technical College': { applyUrl: 'https://www.midlandstech.edu/admissions/', siteUrl: 'https://www.midlandstech.edu' },
  'Minot State University': { applyUrl: 'https://www.minotstateu.edu/admissions/', siteUrl: 'https://www.minotstateu.edu' },
  'MiraCosta College': { applyUrl: 'https://www.miracosta.edu/admissions/', siteUrl: 'https://www.miracosta.edu' },
  'Mississippi Gulf Coast Community College': { applyUrl: 'https://www.mgccc.edu/admissions/', siteUrl: 'https://www.mgccc.edu' },
  'Missouri S&T': { applyUrl: 'https://admissions.mst.edu/', siteUrl: 'https://www.mst.edu' },
  'Missouri University of Science & Technology': { applyUrl: 'https://admissions.mst.edu/', siteUrl: 'https://www.mst.edu' },
  'Montana State University Bozeman': { applyUrl: 'https://www.montana.edu/admissions/', siteUrl: 'https://www.montana.edu' },
  'Montana State University Great Falls': { applyUrl: 'https://www.msubillings.edu/greatfalls/admissions/', siteUrl: 'https://www.msubillings.edu/greatfalls/' },
  'Mount Marty University': { applyUrl: 'https://www.mountmarty.edu/admissions/', siteUrl: 'https://www.mountmarty.edu' },
  'Mount Olive University': { applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
  'Nashville State Community College': { applyUrl: 'https://www.nscc.edu/admissions', siteUrl: 'https://www.nscc.edu' },
  'National University': { applyUrl: 'https://www.nu.edu/admissions/', siteUrl: 'https://www.nu.edu' },
  'Nevada State University': { applyUrl: 'https://nsu.nevada.edu/admissions/', siteUrl: 'https://nsu.nevada.edu' },
  'New Mexico State University': { applyUrl: 'https://admissions.nmsu.edu/', siteUrl: 'https://www.nmsu.edu' },
  'New York University': { applyUrl: 'https://www.nyu.edu/admissions/undergraduate-admissions.html', siteUrl: 'https://www.nyu.edu' },
  'Norfolk State University': { applyUrl: 'https://www.nsu.edu/admissions/apply', siteUrl: 'https://www.nsu.edu' },
  'Northeastern University': { applyUrl: 'https://admissions.northeastern.edu/', siteUrl: 'https://www.northeastern.edu' },
  'Northern Arizona University': { applyUrl: 'https://nau.edu/admissions/', siteUrl: 'https://nau.edu' },
  'Northern Virginia Community College': { applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
  'Northwest Florida State College': { applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
  'Northwestern Michigan College': { applyUrl: 'https://www.nmc.edu/admissions/', siteUrl: 'https://www.nmc.edu' },
  'Oklahoma State University': { applyUrl: 'https://admissions.okstate.edu/', siteUrl: 'https://www.okstate.edu' },
  'Old Dominion University': { applyUrl: 'https://www.odu.edu/apply', siteUrl: 'https://www.odu.edu' },
  'Olympic College': { applyUrl: 'https://www.olympic.edu/admissions/', siteUrl: 'https://www.olympic.edu' },
  'Orange County Community College': { applyUrl: 'https://www.sunyorange.edu/admissions/', siteUrl: 'https://www.sunyorange.edu' },
  'Pacific Lutheran University': { applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
  'Paine College': { applyUrl: 'https://www.paine.edu/admissions/', siteUrl: 'https://www.paine.edu' },
  'Palomar College': { applyUrl: 'https://www.palomar.edu/admissions/', siteUrl: 'https://www.palomar.edu' },
  'Park University': { applyUrl: 'https://www.park.edu/admissions/', siteUrl: 'https://www.park.edu' },
  'Pensacola State College': { applyUrl: 'https://www.pensacolastate.edu/admissions/', siteUrl: 'https://www.pensacolastate.edu' },
  'Pierce College': { applyUrl: 'https://www.pierce.ctc.edu/apply', siteUrl: 'https://www.pierce.ctc.edu' },
  'Pikes Peak State College': { applyUrl: 'https://www.ppsc.edu/admissions/apply/', siteUrl: 'https://www.ppsc.edu' },
  'Pima Community College': { applyUrl: 'https://www.pima.edu/admissions/', siteUrl: 'https://www.pima.edu' },
  'Point Loma Nazarene University': { applyUrl: 'https://www.pointloma.edu/admissions/', siteUrl: 'https://www.pointloma.edu' },
  'Prince George\'s Community College': { applyUrl: 'https://www.pgcc.edu/admissions/', siteUrl: 'https://www.pgcc.edu' },
  'Pulaski Technical College': { applyUrl: 'https://www.pulaskitech.edu/admissions/', siteUrl: 'https://www.pulaskitech.edu' },
  'Regent University': { applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
  'Richard Bland College': { applyUrl: 'https://www.rbc.edu/admissions/', siteUrl: 'https://www.rbc.edu' },
  'Rose State College': { applyUrl: 'https://www.rose.edu/admissions/', siteUrl: 'https://www.rose.edu' },
  'Rowan University': { applyUrl: 'https://admissions.rowan.edu/', siteUrl: 'https://www.rowan.edu' },
  'SUNY New Paltz': { applyUrl: 'https://www.newpaltz.edu/admissions/', siteUrl: 'https://www.newpaltz.edu' },
  'SUNY Polytechnic Institute': { applyUrl: 'https://sunypoly.edu/admissions/', siteUrl: 'https://sunypoly.edu' },
  'San Antonio College': { applyUrl: 'https://www.alamo.edu/sac/admissions/', siteUrl: 'https://www.alamo.edu/sac/' },
  'San Diego City College': { applyUrl: 'https://www.sdcity.edu/CollegeServices/EnrollmentServices/Admissions/', siteUrl: 'https://www.sdcity.edu' },
  'San Diego Miramar College': { applyUrl: 'https://www.sdmiramar.edu/admissions/', siteUrl: 'https://www.sdmiramar.edu' },
  'San Diego State University': { applyUrl: 'https://admissions.sdsu.edu/', siteUrl: 'https://www.sdsu.edu' },
  'Santa Rosa Junior College': { applyUrl: 'https://admissions.santarosa.edu/', siteUrl: 'https://www.santarosa.edu' },
  'Savannah State University': { applyUrl: 'https://www.savannahstate.edu/admissions/', siteUrl: 'https://www.savannahstate.edu' },
  'Seattle Central College': { applyUrl: 'https://seattlecentral.edu/get-started/apply', siteUrl: 'https://seattlecentral.edu' },
  'Seattle University': { applyUrl: 'https://www.seattleu.edu/admissions/', siteUrl: 'https://www.seattleu.edu' },
  'Sinclair Community College': { applyUrl: 'https://www.sinclair.edu/admissions/', siteUrl: 'https://www.sinclair.edu' },
  'Skagit Valley College': { applyUrl: 'https://www.skagit.edu/admissions/', siteUrl: 'https://www.skagit.edu' },
  'Solano Community College': { applyUrl: 'https://www.solano.edu/admissions/', siteUrl: 'https://www.solano.edu' },
  'Sonoma State University': { applyUrl: 'https://www.sonoma.edu/admissions/', siteUrl: 'https://www.sonoma.edu' },
  'South Dakota School of Mines': { applyUrl: 'https://www.sdsmt.edu/admissions/', siteUrl: 'https://www.sdsmt.edu' },
  'South Georgia Technical College': { applyUrl: 'https://www.southgatech.edu/admissions/', siteUrl: 'https://www.southgatech.edu' },
  'Southern Illinois University Edwardsville': { applyUrl: 'https://www.siue.edu/admissions/', siteUrl: 'https://www.siue.edu' },
  'Southern Nazarene University': { applyUrl: 'https://www.snu.edu/admissions/', siteUrl: 'https://www.snu.edu' },
  'Southwestern Illinois College': { applyUrl: 'https://www.swic.edu/admissions/', siteUrl: 'https://www.swic.edu' },
  'Spokane Falls Community College': { applyUrl: 'https://www.spokanefalls.edu/admissions/', siteUrl: 'https://www.spokanefalls.edu' },
  'St. Philip\'s College': { applyUrl: 'https://www.alamo.edu/spc/admissions/', siteUrl: 'https://www.alamo.edu/spc/' },
  'State Fair Community College': { applyUrl: 'https://www.sfccmo.edu/admissions/', siteUrl: 'https://www.sfccmo.edu' },
  'Stockton University': { applyUrl: 'https://www.stockton.edu/admissions/', siteUrl: 'https://www.stockton.edu' },
  'Tacoma Community College': { applyUrl: 'https://www.tacomacc.edu/admissions/apply-now/', siteUrl: 'https://www.tacomacc.edu' },
  'Technical College of the Lowcountry': { applyUrl: 'https://www.tcl.edu/admissions/', siteUrl: 'https://www.tcl.edu' },
  'Temple College': { applyUrl: 'https://www.templejc.edu/admissions', siteUrl: 'https://www.templejc.edu' },
  'Texas A&M University Corpus Christi': { applyUrl: 'https://www.tamucc.edu/admissions/', siteUrl: 'https://www.tamucc.edu' },
  'Texas A&M University – Central Texas': { applyUrl: 'https://www.tamuct.edu/admissions/apply-now.html', siteUrl: 'https://www.tamuct.edu' },
  'The Citadel': { applyUrl: 'https://admissions.citadel.edu/', siteUrl: 'https://www.citadel.edu' },
  'Thomas Nelson Community College': { applyUrl: 'https://www.tncc.edu/admissions/', siteUrl: 'https://www.tncc.edu' },
  'Tidewater Community College': { applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
  'Touro University': { applyUrl: 'https://www.touro.edu/admissions/', siteUrl: 'https://www.touro.edu' },
  'Touro University California': { applyUrl: 'https://www.tu.edu/admissions/', siteUrl: 'https://www.tu.edu' },
  'Touro University Nevada': { applyUrl: 'https://www.tun.touro.edu/admissions/', siteUrl: 'https://www.tun.touro.edu' },
  'Towson University': { applyUrl: 'https://www.towson.edu/admissions/', siteUrl: 'https://www.towson.edu' },
  'Trident Technical College': { applyUrl: 'https://www.tridenttech.edu/admissions/', siteUrl: 'https://www.tridenttech.edu' },
  'Trinity University': { applyUrl: 'https://www.trinity.edu/admissions/apply', siteUrl: 'https://www.trinity.edu' },
  'Troy University': { applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  'Tulane University': { applyUrl: 'https://admission.tulane.edu/', siteUrl: 'https://www.tulane.edu' },
  'UAF Community & Technical College': { applyUrl: 'https://ctc.uaf.edu/admissions/', siteUrl: 'https://ctc.uaf.edu' },
  'UC Berkeley': { applyUrl: 'https://admissions.berkeley.edu/', siteUrl: 'https://www.berkeley.edu' },
  'UC Davis': { applyUrl: 'https://admissions.ucdavis.edu/', siteUrl: 'https://www.ucdavis.edu' },
  'UC San Diego': { applyUrl: 'https://admissions.ucsd.edu/', siteUrl: 'https://www.ucsd.edu' },
  'UC Santa Barbara': { applyUrl: 'https://admissions.ucsb.edu/', siteUrl: 'https://www.ucsb.edu' },
  'UCLA': { applyUrl: 'https://admission.ucla.edu/', siteUrl: 'https://www.ucla.edu' },
  'UMGC Worldwide Online': { applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
  'UNC Pembroke': { applyUrl: 'https://www.uncp.edu/admissions/apply', siteUrl: 'https://www.uncp.edu' },
  'UNC Wilmington': { applyUrl: 'https://admissions.uncw.edu/', siteUrl: 'https://www.uncw.edu' },
  'UW Bothell': { applyUrl: 'https://www.uwb.edu/admissions/', siteUrl: 'https://www.uwb.edu' },
  'University of Alaska Anchorage': { applyUrl: 'https://www.uaa.alaska.edu/admissions/', siteUrl: 'https://www.uaa.alaska.edu' },
  'University of Alaska Fairbanks': { applyUrl: 'https://www.uaf.edu/admissions/', siteUrl: 'https://www.uaf.edu' },
  'University of Alaska Southeast (Sitka)': { applyUrl: 'https://www.uas.alaska.edu/admissions/', siteUrl: 'https://www.uas.alaska.edu' },
  'University of Arizona': { applyUrl: 'https://admissions.arizona.edu/', siteUrl: 'https://www.arizona.edu' },
  'University of Arkansas at Little Rock': { applyUrl: 'https://ualr.edu/admissions/', siteUrl: 'https://ualr.edu' },
  'University of Central Florida': { applyUrl: 'https://www.ucf.edu/admissions/', siteUrl: 'https://www.ucf.edu' },
  'University of Central Missouri': { applyUrl: 'https://www.ucmo.edu/admissions/', siteUrl: 'https://www.ucmo.edu' },
  'University of Central Oklahoma': { applyUrl: 'https://www.uco.edu/admissions/', siteUrl: 'https://www.uco.edu' },
  'University of Colorado Colorado Springs': { applyUrl: 'https://www.uccs.edu/admissions/apply', siteUrl: 'https://www.uccs.edu' },
  'University of Colorado Denver': { applyUrl: 'https://www.ucdenver.edu/admissions/', siteUrl: 'https://www.ucdenver.edu' },
  'University of Dayton': { applyUrl: 'https://udayton.edu/admission/', siteUrl: 'https://udayton.edu' },
  'University of Guam': { applyUrl: 'https://www.uog.edu/admissions/', siteUrl: 'https://www.uog.edu' },
  'University of Hawaii at Manoa': { applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
  'University of Houston': { applyUrl: 'https://www.uh.edu/admissions/', siteUrl: 'https://www.uh.edu' },
  'University of Kansas': { applyUrl: 'https://admissions.ku.edu/', siteUrl: 'https://www.ku.edu' },
  'University of Louisville': { applyUrl: 'https://admissions.louisville.edu/apply/', siteUrl: 'https://www.louisville.edu' },
  'University of Mary': { applyUrl: 'https://www.umary.edu/admissions/', siteUrl: 'https://www.umary.edu' },
  'University of Mary Hardin-Baylor': { applyUrl: 'https://www.umhb.edu/admissions/apply', siteUrl: 'https://www.umhb.edu' },
  'University of Mary Washington': { applyUrl: 'https://admissions.umw.edu/apply/', siteUrl: 'https://www.umw.edu' },
  'University of Maryland': { applyUrl: 'https://admissions.umd.edu/apply', siteUrl: 'https://www.umd.edu' },
  'University of Maryland Baltimore County': { applyUrl: 'https://admissions.umbc.edu/', siteUrl: 'https://www.umbc.edu' },
  'University of Maryland Global Campus': { applyUrl: 'https://www.umgc.edu/admission/steps-to-enroll/', siteUrl: 'https://www.umgc.edu' },
  'University of Miami': { applyUrl: 'https://welcome.miami.edu/apply/', siteUrl: 'https://www.miami.edu' },
  'University of Mount Olive': { applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
  'University of Nebraska Omaha': { applyUrl: 'https://www.unomaha.edu/admissions/', siteUrl: 'https://www.unomaha.edu' },
  'University of Nevada Las Vegas': { applyUrl: 'https://www.unlv.edu/admissions/', siteUrl: 'https://www.unlv.edu' },
  'University of New Orleans': { applyUrl: 'https://www.uno.edu/admissions', siteUrl: 'https://www.uno.edu' },
  'University of North Dakota': { applyUrl: 'https://und.edu/admissions/', siteUrl: 'https://und.edu' },
  'University of North Florida': { applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
  'University of Providence': { applyUrl: 'https://www.uprovidence.edu/admissions/', siteUrl: 'https://www.uprovidence.edu' },
  'University of Puget Sound': { applyUrl: 'https://www.pugetsound.edu/admission/apply-now', siteUrl: 'https://www.pugetsound.edu' },
  'University of San Diego': { applyUrl: 'https://www.sandiego.edu/admissions/apply/', siteUrl: 'https://www.sandiego.edu' },
  'University of South Alabama': { applyUrl: 'https://www.southalabama.edu/departments/admissions/', siteUrl: 'https://www.southalabama.edu' },
  'University of South Carolina': { applyUrl: 'https://www.sc.edu/admissions/', siteUrl: 'https://www.sc.edu' },
  'University of South Carolina Aiken': { applyUrl: 'https://www.usca.edu/admissions/', siteUrl: 'https://www.usca.edu' },
  'University of South Carolina Beaufort': { applyUrl: 'https://www.uscb.edu/admissions/', siteUrl: 'https://www.uscb.edu' },
  'University of South Carolina Sumter': { applyUrl: 'https://www.uscsumter.edu/admissions/', siteUrl: 'https://www.uscsumter.edu' },
  'University of South Florida': { applyUrl: 'https://www.usf.edu/admissions/', siteUrl: 'https://www.usf.edu' },
  'University of Southern California': { applyUrl: 'https://admission.usc.edu/', siteUrl: 'https://www.usc.edu' },
  'University of Southern Mississippi': { applyUrl: 'https://www.usm.edu/admissions/', siteUrl: 'https://www.usm.edu' },
  'University of Tampa': { applyUrl: 'https://www.ut.edu/admissions/', siteUrl: 'https://www.ut.edu' },
  'University of Texas Medical Branch (UTMB)': { applyUrl: 'https://www.utmb.edu/admissions', siteUrl: 'https://www.utmb.edu' },
  'University of Texas at El Paso': { applyUrl: 'https://www.utep.edu/student-affairs/admissions/apply/', siteUrl: 'https://www.utep.edu' },
  'University of Texas at San Antonio': { applyUrl: 'https://admissions.utsa.edu/', siteUrl: 'https://www.utsa.edu' },
  'University of Washington Tacoma': { applyUrl: 'https://www.tacoma.uw.edu/admissions/apply', siteUrl: 'https://www.tacoma.uw.edu' },
  'University of West Florida': { applyUrl: 'https://www.uwf.edu/admissions/', siteUrl: 'https://www.uwf.edu' },
  'Utah State University': { applyUrl: 'https://www.usu.edu/admissions/', siteUrl: 'https://www.usu.edu' },
  'Valdosta State University': { applyUrl: 'https://www.valdosta.edu/admissions/', siteUrl: 'https://www.valdosta.edu' },
  'Vassar College': { applyUrl: 'https://admissions.vassar.edu/', siteUrl: 'https://www.vassar.edu' },
  'Ventura College': { applyUrl: 'https://www.venturacollege.edu/admissions/', siteUrl: 'https://www.venturacollege.edu' },
  'Virginia Commonwealth University': { applyUrl: 'https://admissions.vcu.edu/', siteUrl: 'https://www.vcu.edu' },
  'Virginia State University': { applyUrl: 'https://www.vsu.edu/admissions/', siteUrl: 'https://www.vsu.edu' },
  'Virginia Tech': { applyUrl: 'https://admissions.vt.edu/apply.html', siteUrl: 'https://www.vt.edu' },
  'Virginia Wesleyan University': { applyUrl: 'https://vwu.edu/admissions/apply/', siteUrl: 'https://vwu.edu' },
  'Volunteer State Community College': { applyUrl: 'https://www.volstate.edu/admissions', siteUrl: 'https://www.volstate.edu' },
  'Wallace Community College': { applyUrl: 'https://www.wallace.edu/admissions/', siteUrl: 'https://www.wallace.edu' },
  'Washington State University': { applyUrl: 'https://admissions.wsu.edu/', siteUrl: 'https://www.wsu.edu' },
  'Wayne Community College': { applyUrl: 'https://www.waynecc.edu/admissions/', siteUrl: 'https://www.waynecc.edu' },
  'Weber State University': { applyUrl: 'https://www.weber.edu/admissions/', siteUrl: 'https://www.weber.edu' },
  'Western Dakota Technical College': { applyUrl: 'https://www.wdt.edu/admissions/', siteUrl: 'https://www.wdt.edu' },
  'Western Kentucky University': { applyUrl: 'https://www.wku.edu/admissions/apply/', siteUrl: 'https://www.wku.edu' },
  'Western Washington University': { applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
  'William Carey University': { applyUrl: 'https://www.wmcarey.edu/admissions/', siteUrl: 'https://www.wmcarey.edu' },
  'Windward Community College': { applyUrl: 'https://www.windward.hawaii.edu/admissions/', siteUrl: 'https://www.windward.hawaii.edu' },
  'Wright State University': { applyUrl: 'https://admissions.wright.edu/', siteUrl: 'https://www.wright.edu' },
};

function getCollegeEnrollmentLinks(col) {
  const fromMap = COLLEGE_ENROLLMENT_LINKS[col?.name] || {};
  const applyUrl = col?.applyUrl || fromMap.applyUrl || '';
  const siteUrl = col?.siteUrl || fromMap.siteUrl || '';
  const officialEducationLink = (url) => {
    if (!url) return false;
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.endsWith('.edu') || host.endsWith('.gov') || host.endsWith('.mil');
    } catch {
      return false;
    }
  };
  const enrollmentPath = (url) => /admission|apply|enroll|getting-started|steps-to-enroll|how-to-apply/i.test(url || '');
  return {
    applyUrl: officialEducationLink(applyUrl) && enrollmentPath(applyUrl) ? applyUrl : '',
    siteUrl: officialEducationLink(siteUrl) ? siteUrl : '',
  };
}

function MentalReadinessTab({ theme, profile }) {
  const [tab, setTab] = useState('counseling');
  const branch = profile?.branch || 'Army';
  const tabs = [
    { id: 'counseling', label: 'Counseling' },
    { id: 'crisis-support', label: 'Crisis Support' },
    { id: 'family-support', label: 'Family Support' },
    { id: 'self-care-tools', label: 'Self-Care Tools' },
  ];
  const resources = {
    'counseling': [
      { name: 'Military OneSource Counseling', desc: 'Free, confidential, short-term non-medical counseling for service members and eligible family members.', url: 'https://www.militaryonesource.mil/benefits/confidential-counseling/' },
      { name: 'Military & Family Life Counseling', desc: 'Free confidential counseling, education, and support on or off installation for service members and immediate family members.', url: 'https://www.militaryonesource.mil/programs/military-family-life-counseling/' },
      { name: 'TRICARE Mental Health Care', desc: 'Official TRICARE information for covered mental health services and provider access.', url: 'https://www.tricare.mil/mentalhealth' },
    ],
    'crisis-support': [
      { name: 'Military Crisis Line', desc: 'Call 988 and press 1, chat online, or text 838255 for 24/7 confidential crisis support.', url: 'https://www.veteranscrisisline.net/' },
      { name: '988 Suicide & Crisis Lifeline', desc: 'Free 24/7 support for people in emotional distress or suicidal crisis.', url: 'https://988lifeline.org/' },
      { name: 'The Brandon Act', desc: 'Official information explaining how service members can request mental health support through their chain of command.', url: '' },
    ],
    'family-support': [
      { name: 'Military OneSource Mental Health', desc: 'Public mental health resource hub for military personnel and families.', url: 'https://www.militaryonesource.mil/health-wellness/mental-health/' },
      { name: 'inTransition', desc: 'Free confidential coaching for service members, veterans, and retirees who need mental health care during transitions.', url: '' },
      { name: `${branch} Family Support`, desc: 'Use installation family support offices for relocation stress, parenting, deployment, and local referral help.', url: 'https://installations.militaryonesource.mil/' },
    ],
    'self-care-tools': [
      { name: 'VA PTSD Coach', desc: 'Free VA mobile tool for stress, symptoms, coping skills, and support resources.', url: 'https://mobile.va.gov/app/ptsd-coach' },
      { name: 'VA Mindfulness Coach', desc: 'Free VA mobile app that teaches mindfulness practices for daily stress management.', url: 'https://mobile.va.gov/app/mindfulness-coach' },
      { name: 'Moving Forward', desc: 'Free VA problem-solving training tool for stress, transitions, and life challenges.', url: 'https://www.veterantraining.va.gov/movingforward/' },
    ],
  };
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      <div style={{ padding: 16 }}>
        <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>FREE READINESS RESOURCES</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
            Mental Readiness connects service members and dependents to free official resources for counseling, crisis support, transition stress, and self-care. In an emergency, call 911 or the Military Crisis Line at 988 then press 1.
          </div>
        </div>
        {resources[tab].map(item => (
          <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10, textDecoration: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55 }}>{item.desc}</div>
          </a>
        ))}
      </div>
    </CategoryTabShell>
  );
}

function EducationBenefitsTab({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('colleges');

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

  const TUITION_ASSISTANCE = {
    Army: {
      portal: 'ArmyIgnitED',
      url: '',
      source: 'https://www.eis.army.mil/programs/armyignited',
      summary: 'Army Tuition Assistance is requested through ArmyIgnitED after the Soldier establishes an education goal and works with an education counselor when required.',
      steps: [
        'Contact your Army Education Center or ArmyIgnitED support if this is your first TA request.',
        'Sign in to ArmyIgnitED with your CAC and create or update your student profile.',
        'Create an education goal for the school, degree level, and program you plan to pursue.',
        'Complete required ArmyIgnitED training or counseling items shown in the portal.',
        'Register with the school, then submit the TA request in ArmyIgnitED before the course start deadline.',
        'Wait for approval before relying on TA funds; send the approved authorization to the school if requested.',
      ],
    },
    Navy: {
      portal: 'Navy College / MyNavy Education',
      url: 'https://www.navycollege.navy.mil/',
      secondaryUrl: '',
      source: 'https://www.navycollege.navy.mil/',
      summary: 'Navy Tuition Assistance is managed through the Navy College Program and MyNavy Education for eligible Sailors.',
      steps: [
        'Tell your chain of command you intend to use Tuition Assistance.',
        'Complete the required Virtual Learning 101 training in MyNavy Education if you have not done it before.',
        'Work with a Navy College education counselor and define your education goal.',
        'Upload the required education plan or degree plan in MyNavy Education.',
        'Submit the TA application in MyNavy Education within the Navy application window and before the deadline.',
        'After approval, provide the authorization voucher to your school before the course begins.',
      ],
    },
    'Marine Corps': {
      portal: 'Marine Corps Voluntary Education / WebTA',
      url: '',
      source: 'https://www.dantes.mil/mil-ta/',
      summary: 'Marine Corps Tuition Assistance supports eligible Marines taking off-duty courses through approved schools.',
      steps: [
        'Contact your installation Education Center or Voluntary Education office before enrolling.',
        'Confirm eligibility, course limits, degree plan requirements, and command approval rules.',
        'Choose an accredited school and program that meets TA policy requirements.',
        'Register for the course only after you understand the TA request timing and school billing process.',
        'Submit the TA request through the Marine Corps-approved TA system before the course deadline.',
        'Keep the approved TA authorization and coordinate with the school billing or military student office.',
      ],
    },
    'Air Force': {
      portal: 'Air Force Virtual Education Center (AFVEC)',
      url: '',
      source: 'https://afvec.us.af.mil/afvec/public/welcome',
      summary: 'Air Force Tuition Assistance is requested through AFVEC for eligible Airmen pursuing voluntary off-duty education.',
      steps: [
        'Discuss your education plan with your supervisor and base education office when required.',
        'Sign in to AFVEC and confirm your profile, education goal, and school information.',
        'Upload or confirm your degree plan if AFVEC or your education office requires it.',
        'Register for courses with the school, then submit the TA request in AFVEC before the deadline.',
        'Wait for supervisor and education office approval before assuming TA will pay.',
        'Provide approved TA documentation to the school and monitor grades to avoid repayment issues.',
      ],
    },
    'Space Force': {
      portal: 'AFVEC for Guardians',
      url: '',
      source: 'https://www.spaceforce.mil/News/Article-Display/Article/2421854/department-of-the-air-force-restores-previous-military-tuition-assistance-cap-a/',
      summary: 'Space Force Guardians use Department of the Air Force education systems, including AFVEC, for Tuition Assistance.',
      steps: [
        'Coordinate with your supervisor and servicing education office before enrolling.',
        'Use AFVEC to confirm your education goal, school, and degree plan requirements.',
        'Register for courses only after confirming the course fits current TA policy.',
        'Submit the TA request in AFVEC before the course start deadline.',
        'Wait for all required approvals before relying on TA funding.',
        'Track grades and completion requirements so TA is not recouped.',
      ],
    },
    'Coast Guard': {
      portal: 'MyCG Ed / ETQC Tuition Assistance',
      url: 'https://www.forcecom.uscg.mil/Our-Organization/FORCECOM-UNITS/ETQC/VOLUNTARY-EDUCATION/Tuition-Assistance/Coast-Guard-Credentialing-Online-COOL/',
      source: 'https://www.mycg.uscg.mil/Resources/Article/2454246/education-assistance/',
      summary: 'Coast Guard Tuition Assistance is requested through MyCG Ed and ETQC guidance for eligible members.',
      steps: [
        'Select an approved school and confirm the school has the required DoD MOU status.',
        'Apply to the school and build a degree or certificate plan before requesting TA.',
        'Sign in to MyCG Ed with CAC access and review current ETQC Tuition Assistance policy.',
        'Submit the TA application before the Coast Guard deadline and before the class starts.',
        'Do not begin relying on TA until the voucher or authorization is approved.',
        'Send the approved authorization to the school and submit grades on time after completion.',
      ],
    },
  };

  const selectedTA = TUITION_ASSISTANCE[profile?.branch] || TUITION_ASSISTANCE.Army;

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
        {[{ id: 'colleges', label: 'Colleges' }, { id: 'gibill', label: 'GI Bill Chapters' }, { id: 'mycaa', label: 'MyCAA (Spouses)' }, { id: 'tuition', label: 'Tuition Assistance' }].map(t => (
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

      {activeTab === 'tuition' && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #DDD5C2', borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14, boxShadow: '0 8px 20px rgba(38,53,31,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.14em', marginBottom: 4 }}>{(profile?.branch || 'Army').toUpperCase()} TUITION ASSISTANCE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#111827', marginBottom: 6 }}>{selectedTA.portal}</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{selectedTA.summary}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
              Always verify current eligibility, deadlines, service obligations, grade requirements, and repayment rules with your education office before enrolling.
            </div>
          </div>

          {selectedTA.steps.map((step, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.primary, color: '#FFFFFF', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</div>
              <div style={{ fontSize: 12, color: '#1F2937', lineHeight: 1.55, fontWeight: 600 }}>{step}</div>
            </div>
          ))}

          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            <a href={selectedTA.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: theme.primary, color: '#FFFFFF', textDecoration: 'none', textAlign: 'center', fontWeight: 800, fontSize: 13 }}>
              Open {selectedTA.portal}
            </a>
            {selectedTA.secondaryUrl && (
              <a href={selectedTA.secondaryUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px', borderRadius: 12, background: '#F3F4F6', color: '#111827', textDecoration: 'none', textAlign: 'center', fontWeight: 800, fontSize: 12, border: '1px solid #E5E7EB' }}>
                Open application portal
              </a>
            )}
            <a href={selectedTA.source} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '11px', borderRadius: 12, background: '#F8F6EE', color: '#374151', textDecoration: 'none', textAlign: 'center', fontWeight: 800, fontSize: 12, border: '1px solid #DDD5C2' }}>
              Review official/public branch education guidance
            </a>
          </div>
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
              {nearbyColleges.map((col, idx) => {
                const links = getCollegeEnrollmentLinks(col);
                return (
                  <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{col.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: col.type === 'Public' ? '#E3F2FD' : '#FCE4EC', color: col.type === 'Public' ? '#1565C0' : '#880E4F' }}>{col.type}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#56697C' }}>{col.degree}</span>
                          {links.applyUrl && <span style={{ fontSize: 9, fontWeight: 900, background: '#E8F5E9', color: '#1B5E20', padding: '2px 7px', borderRadius: 10 }}>Verified enrollment link</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: theme.primary }}>{col.rating.toFixed(1)}</div>
                        <div style={{ fontSize: 9, color: '#888' }}>/ 5.0</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{col.desc}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {links.applyUrl && (
                        <a href={links.applyUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 2, minWidth: 150, display: 'block', padding: '9px', borderRadius: 8, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 800, fontSize: 11 }}>Enrollment / Admissions</a>
                      )}
                      {links.siteUrl && (
                        <a href={links.siteUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 110, display: 'block', padding: '9px', borderRadius: 8, background: '#F0F4F8', color: theme.primary, textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>College Website</a>
                      )}
                      {!links.applyUrl && !links.siteUrl && (
                        <div style={{ width: '100%', padding: '9px', borderRadius: 8, background: '#FFF8E1', color: '#7A4A00', border: '1px solid #FFE082', fontWeight: 800, fontSize: 11, textAlign: 'center' }}>Enrollment link under official review</div>
                      )}
                    </div>
                  </div>
                );
              })}
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
            { name: "ArmyIgnitED", desc: "Official Army portal for Tuition Assistance requests, education counseling, and CLEP/DANTES exam registration.", url: "" },
            { name: "DANTES (DSST Exams)", desc: "Free college-level subject exams for service members — earn college credit.", url: "https://www.dantes.mil" },
            { name: "Troops to Teachers", desc: "Transition into teaching with VA support programs.", url: "" },
            { name: "eBenefits Portal", desc: "Manage all VA education benefits and check remaining entitlement.", url: "" },
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
          <a data-link-removed="https://aiportal.acc.af.mil/mycaa" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: theme.primary, color: '#FFF', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Apply for MyCAA →</a>
          <a href="https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: '#E8F5E9', color: '#2E7D32', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>Learn More at MilitaryOneSource →</a>
        </div>
      )}
    </div>
  );
}

function ResourcesTab({ theme, profile }) {
  const [activeSection, setActiveSection] = useState('careers');
  const branch = profile?.branch || 'Army';

  const SECTIONS = [
    { id: 'careers',      label: 'Careers', icon: '💼' },
    { id: 'education',    label: 'Education', icon: '🎓' },
    { id: 'family',       label: 'Family Support', icon: '👨‍👩‍👧' },
    { id: 'financial',    label: 'Financial', icon: '💰' },
    { id: 'healthcare',   label: 'Healthcare', icon: '🏥' },
    { id: 'portals',      label: 'Military Portals', icon: '🖥️' },
    { id: 'pcs',          label: 'PCS & Housing', icon: '🏠' },
  ];

  const RESOURCES = {
    healthcare: [
      { name: 'TRICARE', desc: 'Military health insurance — find plans, providers, and enrollment info', url: 'https://www.tricare.mil', tag: 'All Branches' },
      { name: 'MHS GENESIS Patient Portal', desc: 'Book appointments, view records, and message care teams through the official MHS portal', url: 'https://patient.mhsgenesis.health.mil/', tag: 'All Branches' },
      { name: 'TRICARE Claims', desc: 'Official TRICARE claims, EOB, and claims filing information', url: 'https://www.tricare.mil/PatientResources/Claims', tag: 'All Branches' },
      { name: 'TRICARE For Life', desc: 'Official Medicare-wraparound coverage information for eligible retirees', url: 'https://www.tricare.mil/Plans/HealthPlans/TFL', tag: 'Retirees' },
      { name: 'TRICARE Dental Program (TDP)', desc: 'Dental benefits enrollment, find a provider, and submit claims', url: 'https://www.tricare.mil/CoveredServices/Dental/TDP', tag: 'All Branches' },
      { name: 'TRICARE Overseas', desc: 'TRICARE coverage for beneficiaries stationed or living outside the U.S.', url: 'https://www.tricare.mil/Plans/HealthPlans/Overseas', tag: 'OCONUS' },
      { name: 'TRICARE Overseas Program (TOP)', desc: 'Managed care option for overseas military beneficiaries', url: 'https://www.tricare-overseas.com/', tag: 'OCONUS' },
      { name: 'TRICARE Pharmacy — ESI', desc: 'Prescription drug benefits managed by Express Scripts for TRICARE', url: 'https://tricare.mil/CoveredServices/Pharmacy', tag: 'All Branches' },
      { name: 'TRICARE East', desc: 'TRICARE East Region managed care, provider search, and benefit management', url: 'https://www.tricare.mil/Plans/HealthPlans/Prime', tag: 'All Branches' },
      { name: 'My MHS GENESIS', desc: 'Military Health System patient portal — records, appointments, secure messaging', url: 'https://patient.mhsgenesis.health.mil/', tag: 'All Branches' },
      { name: 'Military OneSource Health', desc: 'Free health consultations and wellness referrals for service members', url: 'https://www.militaryonesource.mil/health-wellness', tag: 'All Branches' },
      { name: 'VA Health Care', desc: 'Veteran health benefits, eligibility, and enrollment', url: 'https://www.va.gov/health-care', tag: 'Veterans' },
    ],
    family: [
      { name: 'Military OneSource', desc: '24/7 support for military families — counseling, legal, financial, relocation', url: 'https://www.militaryonesource.mil', tag: 'All Branches' },
      { name: 'Military Child Education Coalition', desc: 'School transition resources for military children', url: 'https://www.militarychild.org/', tag: 'Families' },
      { name: 'Operation Homefront', desc: 'Emergency financial and housing assistance for military families', url: 'https://operationhomefront.org/critical-financial-assistance/', tag: 'All Branches' },
      { name: 'Blue Star Families', desc: 'Connection and community for military families nationwide', url: 'https://bluestarfam.org/', tag: 'All Branches' },
      { name: branch === 'Army' ? 'Army Community Service (ACS)' : branch === 'Navy' ? 'Fleet & Family Support (FFSC)' : branch.includes('Marine') ? 'Marine Corps Family Services' : 'Airman & Family Readiness Center', desc: 'Installation-based family support, financial counseling, employment help', url: branch === 'Army' ? 'https://installations.militaryonesource.mil/' : branch === 'Navy' ? 'https://www.cnic.navy.mil/ffsp' : 'https://www.militaryonesource.mil', tag: branch },
    ],
    financial: [
      { name: 'myPay (DFAS)', desc: 'Access and manage your military pay, allotments, and W-2s', url: 'https://mypay.dfas.mil', tag: 'All Branches' },
      { name: 'BAH Calculator', desc: 'Calculate your Basic Allowance for Housing by rank and zip code', url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/', tag: 'All Branches' },
      { name: 'VA Benefits Explorer', desc: 'Explore all VA benefits you may be eligible for', url: 'https://www.benefits.va.gov', tag: 'Veterans' },
      { name: 'Military Saves', desc: 'Financial readiness resources, savings plans, and debt reduction tools', url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/military-saves/', tag: 'All Branches' },
      { name: 'Blended Retirement System', desc: 'BRS calculator and TSP retirement planning tools', url: 'https://militarypay.defense.gov/BRS/', tag: 'All Branches' },
      { name: 'SCRA (Service Members Civil Relief)', desc: 'Interest rate caps, lease termination rights, foreclosure protection', url: 'https://www.benefits.va.gov/homeloans/scra.asp', tag: 'All Branches' },
    ],
    pcs: [
      { name: 'Move.mil (DPS)', desc: 'Schedule your household goods move, track shipment, file claims', url: 'https://dps.move.mil/cust/standard/user/home.xhtml', tag: 'All Branches' },
      { name: 'Military Installations', desc: 'Find on-post housing, facilities, and services at any installation', url: 'https://installations.militaryonesource.mil/', tag: 'All Branches' },
      { name: 'Housing Network', desc: 'Search on-post and nearby off-post housing options', url: 'https://www.housing.af.mil', tag: 'All Branches' },
      { name: 'SCRA Lease Termination', desc: 'Break your lease when PCS orders arrive — federal protection', url: 'https://www.justice.gov/servicemembers/servicemembers-civil-relief-act-scra', tag: 'PCS' },
      { name: 'VA Home Loan', desc: 'Zero-down home loans for veterans and active duty service members', url: 'https://www.va.gov/housing-assistance/home-loans', tag: 'Housing' },
    ],
    education: [
      { name: 'VA GI Bill', desc: 'Apply for GI Bill benefits and check remaining entitlement', url: 'https://www.va.gov/education', tag: 'Veterans' },
      { name: 'MyCAA Scholarships', desc: 'Up to $4,000/year for eligible military spouses pursuing portable careers', url: 'https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/', tag: 'Spouses' },
      { name: 'Tuition Assistance (TA)', desc: `${branch === 'Army' ? 'GoArmyEd' : branch === 'Navy' ? 'Navy TA via NETPDTC' : 'Branch Tuition Assistance'} — up to $4,500/year for active duty`, url: branch === 'Army' ? 'https://www.armyignited.army.mil/student/' : 'https://www.dantes.mil/mil-ta/', tag: branch },
      { name: 'DANTES / DSST Exams', desc: 'Free college-level exams for service members — earn credits fast', url: 'https://www.dantes.mil', tag: 'All Branches' },
      { name: 'DoDEA Schools', desc: 'Find DoD-operated schools for military families worldwide', url: 'https://www.dodea.edu/', tag: 'Families' },
    ],
    careers: [
      { name: 'USAJobs.gov', desc: 'Federal civilian jobs with veteran preference hiring', url: 'https://www.usajobs.gov', tag: 'Federal' },
      { name: 'Hire Heroes USA', desc: 'Free job placement and resume coaching for veterans and spouses', url: 'https://www.dol.gov/agencies/vets', tag: 'Veteran-Focused' },
      { name: 'My Next Move for Veterans', desc: 'Translate your MOS to civilian career paths', url: 'https://www.dol.gov/agencies/vets', tag: 'MOS Translator' },
      { name: 'MySECO — Spouse Education & Career Opportunities', desc: 'Military OneSource career coaching, scholarships, and employment tools for spouses', url: 'https://myseco.militaryonesource.mil', tag: 'Spouses' },
      { name: 'Military Spouse Employment Partnership', desc: 'Employer network committed to hiring military spouses', url: 'https://myseco.militaryonesource.mil/portal/', tag: 'Spouses' },
      { name: 'MyCAA — Spouse Career Advancement Accounts', desc: 'Up to $4,000/year in scholarships for military spouses pursuing portable careers', url: 'https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/', tag: 'Spouses' },
      { name: 'Transition GPS (TAP)', desc: 'DoD Transition Assistance Program — mandatory pre-separation classes', url: 'https://www.dodtap.mil', tag: 'Transition' },
    ],
    portals: [
      { name: 'ARBA Case Tracking System (ACTS)', desc: 'Army Review Boards Agency — track your Army Board for Correction of Records case', url: '', tag: 'Army' },
      { name: 'Army TAP Portal', desc: 'Army Transition Assistance Program — schedule TAP workshops and manage transition', url: 'https://tapevents.mil', tag: 'Army' },
      { name: 'HRC — iPERMS', desc: 'U.S. Army Human Resources Command — view and manage your official military personnel records', url: 'https://iperms.hrc.army.mil', tag: 'Army' },
      { name: 'U.S. Army HRC Portal', desc: 'Army Human Resources Command — assignments, promotions, evaluations, and career tools', url: 'https://www.hrc.army.mil', tag: 'Army' },
      { name: 'IPPS-A', desc: 'Integrated Personnel and Pay System — Army: manage pay, personnel actions, and leave', url: 'https://ipps-a.army.mil', tag: 'Army' },
      { name: 'Military Information Platform (MIP)', desc: 'Army knowledge management and information sharing platform', url: '', tag: 'Army' },
      { name: 'milConnect (DMDC)', desc: 'Defense Manpower Data Center — view benefits, DEERS updates, and personnel data', url: 'https://milconnect.dmdc.osd.mil/', tag: 'All Branches' },
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

// ─── Onboarding constants ──────────────────────────────────────────────────
const COMPONENT_TYPES = ['Active Duty', 'Reserve', 'National Guard', 'AGR', 'Dependent'];

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


const APP_TRANSLATIONS = {
  en: {
    tagline: 'Your move, simplified.',
    branchProfile: 'Branch & Profile',
    yourBases: 'Your Bases',
    familyPreferences: 'Family & Preferences',
    firstName: 'FIRST NAME',
    lastName: 'LAST NAME',
    component: 'COMPONENT',
    payGradeRank: 'PAY GRADE & RANK',
    optional: 'optional',
    preferredLanguage: 'PREFERRED LANGUAGE',
    languageHelp: 'Used for navigation, translation support, and language-specific resources.',
    seeDemoFirst: 'See Demo First',
    continue: 'Continue',
    launchDemo: 'Launch Demo',
    myProfile: 'My Profile',
    demoTitle: 'See PCS Express in Action',
    demoBody: 'Preview a sample PCS move and see how the app organizes key planning categories.',
    demoProfile: 'DEMO PROFILE',
    rank: 'Rank',
    branch: 'Branch',
    family: 'Family',
    move: 'Move',
    from: 'From',
    to: 'To',
    home: 'Home',
    more: 'More',
    reset: 'Reset / Re-onboard',
    demoTour: 'DEMO TOUR',
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    thankYouButton: 'Thank You for Your Service!',
    categoryEyebrow: 'PCS EXPRESS CATEGORY',
    defaultCategoryDescription: 'Review official public information and locally saved PCS planning tools for this category.',
    unitedStates: 'UNITED STATES',
    reportingTo: 'Reporting to',
    setGaining: 'Set gaining installation in onboarding',
    yourProfile: 'YOUR PROFILE',
    gaining: 'Gaining',
    depart: 'Depart',
    faith: 'Faith',
    pendingActions: 'Pending Actions',
    overdueAction: 'Overdue Action',
    dueNow: 'Due Now',
    tasksRemaining: 'tasks remaining',
    nav: {
      home: 'Home',
      checklist: 'Checklist',
      documents: 'Documents',
      education: 'Education',
      family: 'Family Readiness',
      'home-relocation': 'Home Relocation',
      'mental-readiness': 'Mental Readiness',
      nav: 'Navigation',
      resources: 'Resources',
      religion: 'Spiritual Readiness',
      translation: 'Translation',
      veterans: 'Veterans',
    },
    desc: {
      checklist: 'Track PCS requirements by phase, keep milestone progress visible, and tap square controls to save progress without uploading documents.',
      documents: 'Use checklist-only record tracking for PCS documents users need to gather, verify, or carry. File upload and attachment capability has been removed.',
      education: 'Review colleges, GI Bill chapters, MyCAA, and branch-specific Tuition Assistance guidance.',
      family: 'Plan family-impact PCS needs across Deployment, EFMP, Employment, Permanent Resident, Pets, and Schools in one organized category.',
      'home-relocation': 'Find official housing resources, move aid, VA loan guidance, inventory tracking, claims deadlines, and replacement value planning.',
      'mental-readiness': 'Connect service members and dependents to free counseling, crisis support, family support, and self-care resources.',
      nav: 'Plan routes, save directions, and view public installation map information without restricted or non-public base details.',
      resources: 'Use one organized hub for official public military, government, family, financial, healthcare, PCS, education, and career resources.',
      religion: 'Locate chaplain, counseling, worship, and community support resources tied to the user’s optional spiritual preference.',
      translation: 'Translate common PCS, housing, medical, school, transportation, and daily-life phrases for CONUS or OCONUS moves.',
      veterans: 'Find veteran-owned business resources, public directories, and local search paths near the gaining location.',
    },
    demo: {
      securityTitle: 'Security, Public Data, and Legal Notice',
      securityBody: 'PCS Express uses public U.S. government, military, and verified public-source information where available. The app removes document-upload capability and asks users not to enter classified, CUI, roster, deployment, or mission-sensitive information.',
      profileTitle: 'Onboarding - Branch & Profile',
      profileBody: 'Branch, component, rank, name, and language help the app tailor branch-specific resources, rank labels, translation support, and PCS planning guidance.',
      basesTitle: 'Onboarding - Bases',
      basesBody: 'Losing installation, gaining installation, and departure date help build the PCS timeline, housing guidance, route planning, school planning, and local resource recommendations.',
      familyTitle: 'Onboarding - Family & Preferences',
      familyBody: 'Dependent travel, children ages, and optional spiritual preference help tailor family readiness, school, EFMP, childcare, chaplain, and community support resources.',
      selectorTitle: 'Home - Category Selector',
      selectorBody: 'The home screen lists categories alphabetically so users can quickly find each PCS planning area.',
      completeTitle: 'Tour Complete - Thank You',
      completeBody: 'You have reached the end of the PCS Express tour. Thank you for your service.',
    },
  },
};

APP_TRANSLATIONS.es = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Su mudanza, simplificada.',
  branchProfile: 'Rama y perfil',
  yourBases: 'Sus bases',
  familyPreferences: 'Familia y preferencias',
  firstName: 'NOMBRE',
  lastName: 'APELLIDO',
  component: 'COMPONENTE',
  payGradeRank: 'GRADO Y RANGO',
  optional: 'opcional',
  preferredLanguage: 'IDIOMA PREFERIDO',
  languageHelp: 'Se usa para navegación, traducción y recursos específicos del idioma.',
  seeDemoFirst: 'Ver demostración primero',
  continue: 'Continuar',
  launchDemo: 'Iniciar demostración',
  myProfile: 'Mi perfil',
  demoTitle: 'Vea PCS Express en acción',
  demoBody: 'Previsualice una mudanza PCS de ejemplo y vea cómo la app organiza las categorías clave.',
  demoProfile: 'PERFIL DE DEMO',
  rank: 'Rango',
  branch: 'Rama',
  family: 'Familia',
  move: 'Mudanza',
  from: 'Desde',
  to: 'A',
  home: 'Inicio',
  more: 'Más',
  reset: 'Restablecer / volver a iniciar',
  demoTour: 'TOUR DEMO',
  skip: 'Omitir',
  back: 'Atrás',
  next: 'Siguiente',
  thankYouButton: 'Gracias por su servicio',
  categoryEyebrow: 'CATEGORÍA PCS EXPRESS',
  defaultCategoryDescription: 'Revise información pública oficial y herramientas de planificación guardadas localmente.',
  unitedStates: 'ESTADOS UNIDOS',
  reportingTo: 'Asignado a',
  setGaining: 'Configure la instalación de destino en el inicio',
  yourProfile: 'SU PERFIL',
  gaining: 'Destino',
  depart: 'Salida',
  faith: 'Fe',
  nav: {
    home: 'Inicio',
    checklist: 'Lista PCS',
    documents: 'Documentos',
    education: 'Educación',
    family: 'Preparación familiar',
    'home-relocation': 'Reubicación del hogar',
    'mental-readiness': 'Preparación mental',
    nav: 'Navegación',
    resources: 'Recursos',
    religion: 'Preparación espiritual',
    translation: 'Traducción',
    veterans: 'Veteranos',
  },
};

APP_TRANSLATIONS.de = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Ihr Umzug, vereinfacht.',
  branchProfile: 'Teilstreitkraft und Profil',
  yourBases: 'Ihre Standorte',
  familyPreferences: 'Familie und Präferenzen',
  firstName: 'VORNAME',
  lastName: 'NACHNAME',
  component: 'KOMPONENTE',
  payGradeRank: 'BESOLDUNG UND DIENSTGRAD',
  preferredLanguage: 'BEVORZUGTE SPRACHE',
  languageHelp: 'Wird für Navigation, Übersetzung und sprachspezifische Ressourcen verwendet.',
  seeDemoFirst: 'Demo zuerst ansehen',
  continue: 'Weiter',
  launchDemo: 'Demo starten',
  myProfile: 'Mein Profil',
  home: 'Start',
  more: 'Mehr',
  reset: 'Zurücksetzen / neu starten',
  demoTour: 'DEMO-TOUR',
  skip: 'Überspringen',
  back: 'Zurück',
  next: 'Weiter',
  thankYouButton: 'Vielen Dank für Ihren Dienst',
  unitedStates: 'VEREINIGTE STAATEN',
  reportingTo: 'Meldet sich bei',
  setGaining: 'Zielstandort im Onboarding festlegen',
  yourProfile: 'IHR PROFIL',
  gaining: 'Ziel',
  depart: 'Abreise',
  faith: 'Glaube',
  nav: { home: 'Start', checklist: 'Checkliste', documents: 'Dokumente', education: 'Bildung', family: 'Familienbereitschaft', 'home-relocation': 'Wohnungssuche', 'mental-readiness': 'Mentale Bereitschaft', nav: 'Navigation', resources: 'Ressourcen', religion: 'Spirituelle Bereitschaft', translation: 'Übersetzung', veterans: 'Veteranen' },
};

APP_TRANSLATIONS.fr = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Votre déménagement, simplifié.',
  branchProfile: 'Branche et profil',
  yourBases: 'Vos bases',
  familyPreferences: 'Famille et préférences',
  firstName: 'PRÉNOM',
  lastName: 'NOM',
  component: 'COMPOSANTE',
  payGradeRank: 'GRADE ET RANG',
  preferredLanguage: 'LANGUE PRÉFÉRÉE',
  languageHelp: 'Utilisé pour la navigation, la traduction et les ressources linguistiques.',
  seeDemoFirst: 'Voir la démo d’abord',
  continue: 'Continuer',
  launchDemo: 'Lancer la démo',
  myProfile: 'Mon profil',
  home: 'Accueil',
  more: 'Plus',
  reset: 'Réinitialiser / recommencer',
  demoTour: 'VISITE DÉMO',
  skip: 'Ignorer',
  back: 'Retour',
  next: 'Suivant',
  thankYouButton: 'Merci pour votre service',
  unitedStates: 'ÉTATS-UNIS',
  reportingTo: 'Affecté à',
  setGaining: 'Définissez la base d’arrivée dans l’onboarding',
  yourProfile: 'VOTRE PROFIL',
  gaining: 'Arrivée',
  depart: 'Départ',
  faith: 'Foi',
  nav: { home: 'Accueil', checklist: 'Checklist', documents: 'Documents', education: 'Éducation', family: 'Préparation familiale', 'home-relocation': 'Relogement', 'mental-readiness': 'Préparation mentale', nav: 'Navigation', resources: 'Ressources', religion: 'Préparation spirituelle', translation: 'Traduction', veterans: 'Vétérans' },
};

APP_TRANSLATIONS.ko = {
  ...APP_TRANSLATIONS.en,
  tagline: '이동 준비를 간단하게.',
  branchProfile: '군별 및 프로필',
  yourBases: '기지 정보',
  familyPreferences: '가족 및 선호사항',
  firstName: '이름',
  lastName: '성',
  component: '신분',
  payGradeRank: '계급 및 급여등급',
  preferredLanguage: '선호 언어',
  languageHelp: '내비게이션, 번역 지원 및 언어별 자료에 사용됩니다.',
  seeDemoFirst: '데모 먼저 보기',
  continue: '계속',
  launchDemo: '데모 시작',
  myProfile: '내 프로필',
  home: '홈',
  more: '더보기',
  reset: '재설정 / 다시 시작',
  demoTour: '데모 안내',
  skip: '건너뛰기',
  back: '뒤로',
  next: '다음',
  thankYouButton: '복무에 감사드립니다',
  unitedStates: '미국',
  reportingTo: '배치 예정',
  setGaining: '온보딩에서 도착 기지를 설정하세요',
  yourProfile: '내 프로필',
  gaining: '도착',
  depart: '출발',
  faith: '종교',
  nav: { home: '홈', checklist: '체크리스트', documents: '문서', education: '교육', family: '가족 준비', 'home-relocation': '주거 이전', 'mental-readiness': '정신 준비', nav: '내비게이션', resources: '자료', religion: '영적 준비', translation: '번역', veterans: '재향군인' },
};

APP_TRANSLATIONS.ja = {
  ...APP_TRANSLATIONS.en,
  tagline: 'PCSをわかりやすく。',
  branchProfile: '軍種とプロフィール',
  yourBases: '基地情報',
  familyPreferences: '家族と設定',
  firstName: '名',
  lastName: '姓',
  component: '区分',
  payGradeRank: '給与等級と階級',
  preferredLanguage: '希望言語',
  languageHelp: 'ナビゲーション、翻訳支援、言語別リソースに使用されます。',
  seeDemoFirst: '先にデモを見る',
  continue: '続行',
  launchDemo: 'デモを開始',
  myProfile: '自分のプロフィール',
  home: 'ホーム',
  more: 'その他',
  reset: 'リセット / 再開始',
  demoTour: 'デモツアー',
  skip: 'スキップ',
  back: '戻る',
  next: '次へ',
  thankYouButton: 'ご奉仕に感謝します',
  unitedStates: 'アメリカ合衆国',
  reportingTo: '赴任先',
  setGaining: 'オンボーディングで赴任先を設定してください',
  yourProfile: 'プロフィール',
  gaining: '赴任先',
  depart: '出発',
  faith: '信仰',
  nav: { home: 'ホーム', checklist: 'チェックリスト', documents: '書類', education: '教育', family: '家族準備', 'home-relocation': '住居移転', 'mental-readiness': 'メンタル準備', nav: 'ナビゲーション', resources: 'リソース', religion: 'スピリチュアル準備', translation: '翻訳', veterans: '退役軍人' },
};

APP_TRANSLATIONS.tl = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Mas pinadaling PCS move.',
  branchProfile: 'Sangay at Profile',
  yourBases: 'Mga Base',
  familyPreferences: 'Pamilya at Kagustuhan',
  firstName: 'PANGALAN',
  lastName: 'APELYIDO',
  component: 'KOMPONENTE',
  payGradeRank: 'PAY GRADE AT RANGGO',
  preferredLanguage: 'GUSTONG WIKA',
  languageHelp: 'Ginagamit para sa navigation, translation support, at resources ayon sa wika.',
  seeDemoFirst: 'Tingnan muna ang demo',
  continue: 'Magpatuloy',
  launchDemo: 'Simulan ang demo',
  myProfile: 'Aking profile',
  home: 'Home',
  more: 'Higit pa',
  reset: 'I-reset / onboarding muli',
  demoTour: 'DEMO TOUR',
  skip: 'Laktawan',
  back: 'Bumalik',
  next: 'Susunod',
  thankYouButton: 'Salamat sa iyong serbisyo',
  unitedStates: 'ESTADOS UNIDOS',
  reportingTo: 'Naka-assign sa',
  setGaining: 'Ilagay ang gaining installation sa onboarding',
  yourProfile: 'IYONG PROFILE',
  gaining: 'Gaining',
  depart: 'Alis',
  faith: 'Pananampalataya',
  nav: { home: 'Home', checklist: 'Checklist', documents: 'Dokumento', education: 'Edukasyon', family: 'Family Readiness', 'home-relocation': 'Home Relocation', 'mental-readiness': 'Mental Readiness', nav: 'Navigation', resources: 'Resources', religion: 'Spiritual Readiness', translation: 'Translation', veterans: 'Veterans' },
};

APP_TRANSLATIONS.ar = {
  ...APP_TRANSLATIONS.en,
  tagline: 'انتقالك أصبح أسهل.',
  branchProfile: 'الفرع والملف الشخصي',
  yourBases: 'القواعد',
  familyPreferences: 'العائلة والتفضيلات',
  firstName: 'الاسم الأول',
  lastName: 'اسم العائلة',
  component: 'المكوّن',
  payGradeRank: 'الرتبة ودرجة الراتب',
  preferredLanguage: 'اللغة المفضلة',
  languageHelp: 'تُستخدم للتنقل ودعم الترجمة والموارد حسب اللغة.',
  seeDemoFirst: 'شاهد العرض أولاً',
  continue: 'متابعة',
  launchDemo: 'بدء العرض',
  myProfile: 'ملفي الشخصي',
  home: 'الرئيسية',
  more: 'المزيد',
  reset: 'إعادة الضبط / بدء جديد',
  demoTour: 'جولة العرض',
  skip: 'تخطي',
  back: 'رجوع',
  next: 'التالي',
  thankYouButton: 'شكراً لخدمتك',
  unitedStates: 'الولايات المتحدة',
  reportingTo: 'التقرير إلى',
  setGaining: 'حدد القاعدة الجديدة أثناء الإعداد',
  yourProfile: 'ملفك الشخصي',
  gaining: 'الوجهة',
  depart: 'المغادرة',
  faith: 'الدين',
  nav: { home: 'الرئيسية', checklist: 'قائمة PCS', documents: 'المستندات', education: 'التعليم', family: 'جاهزية العائلة', 'home-relocation': 'السكن والانتقال', 'mental-readiness': 'الجاهزية النفسية', nav: 'الملاحة', resources: 'الموارد', religion: 'الجاهزية الروحية', translation: 'الترجمة', veterans: 'المحاربون القدامى' },
};

APP_TRANSLATIONS.zh = {
  ...APP_TRANSLATIONS.en,
  tagline: '让搬迁更简单。',
  branchProfile: '军种与档案',
  yourBases: '基地信息',
  familyPreferences: '家庭与偏好',
  firstName: '名',
  lastName: '姓',
  component: '身份类别',
  payGradeRank: '薪级与军衔',
  preferredLanguage: '首选语言',
  languageHelp: '用于导航、翻译支持和语言相关资源。',
  seeDemoFirst: '先看演示',
  continue: '继续',
  launchDemo: '启动演示',
  myProfile: '我的档案',
  home: '首页',
  more: '更多',
  reset: '重置 / 重新开始',
  demoTour: '演示导览',
  skip: '跳过',
  back: '返回',
  next: '下一步',
  thankYouButton: '感谢您的服役',
  unitedStates: '美国',
  reportingTo: '报到地点',
  setGaining: '请在入门设置中选择新基地',
  yourProfile: '您的档案',
  gaining: '新基地',
  depart: '出发',
  faith: '信仰',
  nav: { home: '首页', checklist: '清单', documents: '文件', education: '教育', family: '家庭准备', 'home-relocation': '住房搬迁', 'mental-readiness': '心理准备', nav: '导航', resources: '资源', religion: '精神准备', translation: '翻译', veterans: '退伍军人' },
};

APP_TRANSLATIONS.it = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Il tuo trasferimento, semplificato.',
  branchProfile: 'Forza armata e profilo',
  yourBases: 'Le tue basi',
  familyPreferences: 'Famiglia e preferenze',
  firstName: 'NOME',
  lastName: 'COGNOME',
  component: 'COMPONENTE',
  payGradeRank: 'GRADO E RANGO',
  preferredLanguage: 'LINGUA PREFERITA',
  languageHelp: 'Usata per navigazione, traduzione e risorse linguistiche.',
  seeDemoFirst: 'Vedi prima la demo',
  continue: 'Continua',
  launchDemo: 'Avvia demo',
  myProfile: 'Il mio profilo',
  home: 'Home',
  more: 'Altro',
  reset: 'Reimposta / ricomincia',
  demoTour: 'TOUR DEMO',
  skip: 'Salta',
  back: 'Indietro',
  next: 'Avanti',
  thankYouButton: 'Grazie per il tuo servizio',
  unitedStates: 'STATI UNITI',
  reportingTo: 'Assegnato a',
  setGaining: 'Imposta la base di destinazione nell’onboarding',
  yourProfile: 'IL TUO PROFILO',
  gaining: 'Destinazione',
  depart: 'Partenza',
  faith: 'Fede',
  nav: { home: 'Home', checklist: 'Checklist', documents: 'Documenti', education: 'Istruzione', family: 'Prontezza familiare', 'home-relocation': 'Trasferimento casa', 'mental-readiness': 'Prontezza mentale', nav: 'Navigazione', resources: 'Risorse', religion: 'Prontezza spirituale', translation: 'Traduzione', veterans: 'Veterani' },
};

APP_TRANSLATIONS.pt = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Sua mudança, simplificada.',
  branchProfile: 'Ramo e perfil',
  yourBases: 'Suas bases',
  familyPreferences: 'Família e preferências',
  firstName: 'NOME',
  lastName: 'SOBRENOME',
  component: 'COMPONENTE',
  payGradeRank: 'GRAU E PATENTE',
  preferredLanguage: 'IDIOMA PREFERIDO',
  languageHelp: 'Usado para navegação, tradução e recursos do idioma.',
  seeDemoFirst: 'Ver demonstração primeiro',
  continue: 'Continuar',
  launchDemo: 'Iniciar demonstração',
  myProfile: 'Meu perfil',
  home: 'Início',
  more: 'Mais',
  reset: 'Redefinir / reiniciar',
  demoTour: 'TOUR DE DEMO',
  skip: 'Pular',
  back: 'Voltar',
  next: 'Próximo',
  thankYouButton: 'Obrigado pelo seu serviço',
  unitedStates: 'ESTADOS UNIDOS',
  reportingTo: 'Apresentar-se em',
  setGaining: 'Defina a instalação de destino no onboarding',
  yourProfile: 'SEU PERFIL',
  gaining: 'Destino',
  depart: 'Partida',
  faith: 'Fé',
  nav: { home: 'Início', checklist: 'Checklist', documents: 'Documentos', education: 'Educação', family: 'Prontidão familiar', 'home-relocation': 'Mudança residencial', 'mental-readiness': 'Prontidão mental', nav: 'Navegação', resources: 'Recursos', religion: 'Prontidão espiritual', translation: 'Tradução', veterans: 'Veteranos' },
};

APP_TRANSLATIONS.vi = {
  ...APP_TRANSLATIONS.en,
  tagline: 'Đơn giản hóa PCS của bạn.',
  branchProfile: 'Quân chủng và hồ sơ',
  yourBases: 'Căn cứ của bạn',
  familyPreferences: 'Gia đình và tùy chọn',
  firstName: 'TÊN',
  lastName: 'HỌ',
  component: 'THÀNH PHẦN',
  payGradeRank: 'BẬC LƯƠNG VÀ CẤP BẬC',
  preferredLanguage: 'NGÔN NGỮ ƯU TIÊN',
  languageHelp: 'Dùng cho điều hướng, hỗ trợ dịch và tài nguyên theo ngôn ngữ.',
  seeDemoFirst: 'Xem demo trước',
  continue: 'Tiếp tục',
  launchDemo: 'Mở demo',
  myProfile: 'Hồ sơ của tôi',
  home: 'Trang chủ',
  more: 'Thêm',
  reset: 'Đặt lại / bắt đầu lại',
  demoTour: 'HƯỚNG DẪN DEMO',
  skip: 'Bỏ qua',
  back: 'Quay lại',
  next: 'Tiếp',
  thankYouButton: 'Cảm ơn sự phục vụ của bạn',
  unitedStates: 'HOA KỲ',
  reportingTo: 'Báo cáo đến',
  setGaining: 'Chọn căn cứ đến trong phần onboarding',
  yourProfile: 'HỒ SƠ CỦA BẠN',
  gaining: 'Căn cứ đến',
  depart: 'Khởi hành',
  faith: 'Tín ngưỡng',
  nav: { home: 'Trang chủ', checklist: 'Checklist', documents: 'Tài liệu', education: 'Giáo dục', family: 'Sẵn sàng gia đình', 'home-relocation': 'Nhà ở & chuyển nhà', 'mental-readiness': 'Sẵn sàng tinh thần', nav: 'Điều hướng', resources: 'Tài nguyên', religion: 'Sẵn sàng tâm linh', translation: 'Dịch thuật', veterans: 'Cựu chiến binh' },
};

function getAppLanguage(language) {
  const code = String(language || 'en').toLowerCase();
  return APP_TRANSLATIONS[code] ? code : 'en';
}

function trFrom(language, key) {
  const lang = getAppLanguage(language);
  const dict = APP_TRANSLATIONS[lang] || APP_TRANSLATIONS.en;
  const fallback = APP_TRANSLATIONS.en;
  const read = (source) => key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), source);
  return read(dict) ?? read(fallback) ?? key;
}

function localizeNavItems(items, language) {
  return items.map(item => ({ ...item, label: trFrom(language, `nav.${item.id}`) }));
}

const RELIGIOUS_PREFERENCES = [
  'No Preference', 'Protestant / Christian', 'Catholic', 'Orthodox Christian',
  'Jewish', 'Muslim / Islam', 'Buddhist', 'Hindu',
  'Sikh', 'LDS / Mormon', 'Unitarian Universalist',
  'Prefer not to say', 'Other',
];

const DEMO_PROFILE = {
  demoMode: true,
  firstName: 'Marcus', lastName: 'Thompson',
  branch: 'Army', component: 'Active Duty', paygrade: 'E-7',
  losingInstallation: 'Fort Liberty', gainingInstallation: 'Camp Humphreys',
  departingDate: '2026-06-15',
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
    setP(prev => ({ ...prev, branch, paygrade: gradeValid ? prev.paygrade : 'E-5' }));
  };
  const updGaining = (name) => {
    const sel = MILITARY_DUTY_STATIONS.find(s => s.name === name);
    setP(prev => ({ ...prev, gainingInstallation: name, isOverseas: sel?.country ? true : false }));
  };

  const theme = BRANCH_THEMES[p.branch];
  const onboardingLanguage = getAppLanguage(p.language);
  const ot = (key) => trFrom(onboardingLanguage, key);

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

  const inputSt = {
    width: '100%', fontSize: 14, padding: '11px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)',
    color: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
  };
  const canGo1 = Boolean((p.firstName || '').trim() && p.branch && p.component && p.language);
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
    <div lang={onboardingLanguage} dir={onboardingLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100dvh', background: theme.secondary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ padding: 'env(safe-area-inset-top) 0 0', background: theme.secondary }}>
        <div style={{ padding: '20px 16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: '.05em' }}>PCS EXPRESS</div>
          <div style={{ fontSize: 12, color: theme.accent, marginTop: 4 }}>{ot('tagline')}</div>
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
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>{ot('demoTitle')}</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  {ot('demoBody')}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 10, letterSpacing: '.1em' }}>{ot('demoProfile')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[[ot('rank'), 'E-7 (SFC)'], [ot('branch'), 'Army'], [ot('family'), '3 Children'], [ot('move'), 'OCONUS'], [ot('from'), 'Fort Liberty, NC'], [ot('to'), 'Camp Humphreys, SK']].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => { prepareInteractiveDemoLaunch(); onComplete(DEMO_PROFILE); }} style={{ padding: '13px', borderRadius: 12, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>{ot('launchDemo')}</button>
                <button onClick={() => setStep(0)} style={{ padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{ot('myProfile')}</button>
              </div>
            </>
          )}

          {/* Step 0 — Branch & Profile */}
          {step === 0 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>{ot('branchProfile')}</div>

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
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('firstName')}</label>
                  <input value={p.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Jordan" style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('lastName')}</label>
                  <input value={p.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Rivera" style={inputSt} />
                </div>
              </div>

              {/* Component */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('component')}</label>
                <select value={p.component} onChange={e => {
                  const comp = e.target.value;
                  if (comp === 'Dependent') {
                    setP(prev => ({ ...prev, component: comp, paygrade: 'N/A' }));
                  } else {
                    setP(prev => ({ ...prev, component: comp, paygrade: prev.paygrade === 'N/A' ? 'E-5' : prev.paygrade }));
                  }
                }} style={inputSt}>
                  {COMPONENT_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Pay grade */}
              {p.component === 'Dependent' ? (
                <div style={{ marginBottom: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                  Pay Grade &amp; Rank — N/A ({p.component})
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    {ot('payGradeRank')} <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>(optional)</span>
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
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('preferredLanguage')}</label>
                <select value={p.language} onChange={e => upd('language', e.target.value)} style={inputSt}>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ot('languageHelp')}</div>
              </div>

              <button onClick={() => setStep(-1)} style={{ width: '100%', padding: '10px', marginBottom: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: UI_PALETTE.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {ot('seeDemoFirst')} →
              </button>
              <button onClick={() => setStep(1)} disabled={!canGo1} style={{ width: '100%', padding: '13px', borderRadius: 12, background: canGo1 ? theme.accent : 'rgba(255,255,255,0.1)', color: canGo1 ? theme.secondary : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 900, cursor: canGo1 ? 'pointer' : 'not-allowed', fontSize: 14 }}>
                {ot('continue')} →
              </button>
            </>
          )}

          {/* Step 1 — Bases */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>{ot('yourBases')}</div>

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

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← {ot('back')}</button>
                <button onClick={() => setStep(2)} disabled={!canGo2} style={{ flex: 1, padding: '13px', borderRadius: 12, background: canGo2 ? theme.accent : 'rgba(255,255,255,0.1)', color: canGo2 ? theme.secondary : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 900, cursor: canGo2 ? 'pointer' : 'not-allowed', fontSize: 14 }}>{ot('continue')} →</button>
              </div>
            </>
          )}

          {/* Step 2 — Family, Religion & Housing */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>Family & Preferences</div>

              {/* Dependent travel */}
              <div onClick={() => upd('hasDependents', !p.hasDependents)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p.hasDependents ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p.hasDependents ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p.hasDependents ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p.hasDependents ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.hasDependents && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Spouse / Dependents traveling with me</div>
              </div>

              {/* Children ages */}
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
                <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← {ot('back')}</button>
                <button
                  onClick={() => onComplete({
                    ...p,
                    hasChildren: p.childAges.some(a => a !== '' && !isNaN(Number(a))),
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

function CategoryTabShell({ theme, tabs, activeTab, onChange, children }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '8px 11px',
              borderRadius: 8,
              border: `1.5px solid ${activeTab === tab.id ? theme.primary : '#E0E6EE'}`,
              background: activeTab === tab.id ? theme.primary : '#FFFFFF',
              color: activeTab === tab.id ? '#FFFFFF' : '#56697C',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

function FamilyCategoryTab({ theme, profile }) {
  const tabs = [
    { id: 'deployment', label: 'Deployment' },
    { id: 'efmp', label: 'EFMP' },
    { id: 'employment', label: 'Employment' },
    { id: 'permanent-resident', label: 'Permanent Resident' },
    { id: 'pets', label: 'Pets' },
    { id: 'schools', label: 'Schools' },
  ];
  const [tab, setTab] = useState('deployment');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'deployment' && <SpouseDeploymentGuide theme={theme} profile={profile} />}
      {tab === 'efmp' && <EFMPTab theme={theme} profile={profile} />}
      {tab === 'employment' && <EmploymentModule theme={theme} profile={profile} />}
      {tab === 'permanent-resident' && <ImmigrationModule theme={theme} profile={profile} />}
      {tab === 'pets' && <PetRelocationChecklistTab theme={theme} profile={profile} />}
      {tab === 'schools' && <SchoolsTab theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

function VAHomeLoanPanel({ theme, profile }) {
  const steps = [
    'Confirm VA loan eligibility through VA.gov or a VA-approved lender.',
    'Request a Certificate of Eligibility before making an offer when possible.',
    'Compare VA funding fee, interest rate, closing cost, and lender credit estimates.',
    'Ask each lender how they support PCS timelines, remote closings, and military income.',
    'Keep inspection, appraisal, and final closing dates aligned with report date and household goods delivery.',
  ];
  const lenders = [
    { name: 'VA Home Loan Overview', url: 'https://www.va.gov/housing-assistance/home-loans/', note: 'Official VA overview for VA-backed and VA direct home loan benefits.' },
    { name: 'VA Home Buying Process', url: 'https://www.va.gov/housing-assistance/home-loans/home-buying-process', note: 'Step-by-step VA guidance for using a VA-backed loan to buy a home.' },
    { name: 'VA Lender Resources', url: 'https://www.benefits.va.gov/homeloans/lenders.asp', note: 'Official VA lender resources and program information. This is guidance, not a private lender endorsement.' },
    { name: 'CFPB Home Loan Toolkit', url: 'https://www.consumerfinance.gov/owning-a-home/', note: 'Official Consumer Financial Protection Bureau tools for comparing mortgage offers.' },
  ];
  return (
    <div>
      <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.14em', marginBottom: 4 }}>VA HOME LOAN</div>
        <div style={{ fontSize: 12, color: UI_PALETTE.muted, lineHeight: 1.6 }}>
          Use this checklist to prepare for VA-backed homebuying near {profile?.gainingInstallation || 'your gaining installation'}. Verify all loan terms directly with the VA and the lender before committing.
        </div>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        {steps.map((step, index) => (
          <label key={step} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: index === steps.length - 1 ? 'none' : '1px solid #EEF2F6', color: '#0D1821', fontSize: 12, lineHeight: 1.5 }}>
            <input type="checkbox" style={{ width: 18, height: 18, accentColor: theme.primary, flexShrink: 0 }} />
            <span>{step}</span>
          </label>
        ))}
      </div>
      {lenders.map(lender => (
        <a key={lender.name} href={lender.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10, textDecoration: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{lender.name}</div>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{lender.note}</div>
        </a>
      ))}
    </div>
  );
}

function HomeRelocationUnifiedTab({ theme, profile }) {
  const tabs = [
    { id: 'home-locator', label: 'Home Locator' },
    { id: 'inventory-claims', label: 'Inventory & Claims' },
    { id: 'move-aid', label: 'Move Aid' },
    { id: 'va-loan', label: 'VA Loan' },
  ];
  const [tab, setTab] = useState('home-locator');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'home-locator' && <HomeLocatorTab theme={theme} profile={profile} />}
      {tab === 'inventory-claims' && <HomeRelocationTab theme={theme} profile={profile} />}
      {tab === 'move-aid' && <MovingFinancialAssistanceTab theme={theme} profile={profile} />}
      {tab === 'va-loan' && <VAHomeLoanPanel theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

function HomeLegalBanners({ theme }) {
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
      <div style={{ background: UI_PALETTE.surface, borderRadius: 12, padding: 14, border: `1px solid ${UI_PALETTE.line}`, borderLeft: `4px solid ${theme.primary}`, color: UI_PALETTE.text }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 6 }}>SECURITY CONTROLS</div>
        <div style={{ fontSize: 11, lineHeight: 1.6, color: '#1F2937', fontWeight: 600 }}>
          PCS Express uses a no-document-upload design, hardened browser headers, privacy shielding, and disabled device permissions to reduce sensitive-data exposure. User-entered planning data is intended to stay local to the device unless the user opens an external public source or platform feature. Do not enter classified information, CUI, restricted government data, rosters, deployment details, or non-public mission information.
        </div>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, color: '#34495E', fontSize: 11, lineHeight: 1.6 }}>
        <strong>Official public data disclaimer:</strong> Base, resource, housing, and benefit information is limited to official public U.S. government, military, and public-source references where available; users must verify details with the official source before acting.
      </div>
      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 14, color: '#6D4C00', fontSize: 11, lineHeight: 1.6 }}>
        <strong>Independent application notice:</strong> PCS Express is privately developed and is not owned, operated, endorsed, certified, or approved by the Department of Defense, DISA, any military branch, or any U.S. government agency.
      </div>
    </div>
  );
}

function App() {

  // APP_WIDE_LINK_SECURITY_AUDIT: prevents blank, relative, same-app, stale, or non-approved link bubbles from navigating users into another PCS Express state.
  useEffect(() => {
    const approvedNonGovHosts = new Set(['988lifeline.org', 'www.988lifeline.org', 'veteranscrisisline.net', 'www.veteranscrisisline.net', 'operationhomefront.org', 'www.operationhomefront.org', 'armyemergencyrelief.org', 'www.armyemergencyrelief.org', 'nmcrs.org', 'www.nmcrs.org', 'afas.org', 'www.afas.org', 'cgmahq.org', 'www.cgmahq.org', 'militarychild.org', 'www.militarychild.org', 'bluestarfam.org', 'www.bluestarfam.org', 'usmc-mccs.org', 'www.usmc-mccs.org']);
    const isApprovedExternalLink = (href) => {
      if (!href || href === '#') return false;
      try {
        const parsed = new URL(href, window.location.origin);
        const host = parsed.hostname.toLowerCase();
        if (parsed.origin === window.location.origin) return false;
        return host.endsWith('.gov') || host.endsWith('.mil') || host.endsWith('.edu') || approvedNonGovHosts.has(host);
      } catch {
        return false;
      }
    };
    const disableUnsafeAnchor = (anchor) => {
      const rawHref = anchor.getAttribute('href') || '';
      const absoluteHref = anchor.href || rawHref;
      if (!isApprovedExternalLink(absoluteHref)) {
        anchor.setAttribute('data-link-audit-blocked', rawHref || 'blank-or-relative');
        anchor.setAttribute('aria-hidden', 'true');
        anchor.setAttribute('tabindex', '-1');
        anchor.removeAttribute('href');
        anchor.style.display = 'none';
        return true;
      }
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      return false;
    };
    const scrubLinks = () => {
      document.querySelectorAll('a').forEach(disableUnsafeAnchor);
    };
    const clickGuard = (event) => {
      const anchor = event.target?.closest?.('a');
      if (!anchor) return;
      const rawHref = anchor.getAttribute('href') || '';
      const absoluteHref = anchor.href || rawHref;
      if (!isApprovedExternalLink(absoluteHref)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        disableUnsafeAnchor(anchor);
      }
    };
    scrubLinks();
    document.addEventListener('click', clickGuard, true);
    const observer = new MutationObserver(scrubLinks);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    return () => {
      document.removeEventListener('click', clickGuard, true);
      observer.disconnect();
    };
  }, []);




  const [profile, setProfile] = useState(() => normalizeProfile(getSessionDemoProfile() || store.get('pcs_profile')));
  const [activeTab, setActiveTab] = useState('home');
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [checklistItems, setChecklistItems] = useState(() => {
    return readLegacyJson('pcs_checklist_checks', {});
  });
  const [demoTip, setDemoTip] = useState(() => {
    const p = normalizeProfile(getSessionDemoProfile() || store.get('pcs_profile'));
    return (p?.demoMode || (p?.firstName === 'Marcus' && p?.lastName === 'Thompson')) ? 0 : -1;
  });
  const [screenW, setScreenW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 480);
  useEffect(() => {
    const handler = () => setScreenW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => {
    secureLocalStore.get('pcs_profile', null).then(saved => {
      const normalized = normalizeProfile(saved);
      if (normalized?.branch) {
        setProfile(current => current?.demoMode ? current : normalized);
      }
    });
    secureLocalStore.get('pcs_checklist_checks', null).then(saved => {
      if (saved) setChecklistItems(saved);
    });
  }, []);
  const isDesktop = screenW >= 900;
  // isNative is true only inside the Capacitor iOS/Android shell — never in a web browser
  const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

  const safeProfile = profile && profile.branch ? profile : null;
  const theme = BRANCH_THEMES[safeProfile?.branch] || BRANCH_THEMES.Army;
  const homeInsignia = getHomeBranchInsignia(profile?.branch);
  const appLanguage = getAppLanguage(profile?.language);
  const appDir = appLanguage === 'ar' ? 'rtl' : 'ltr';
  const t = (key) => trFrom(appLanguage, key);
  useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appDir;
  }, [appLanguage, appDir]);

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
    const legacyRoutes = {
      spouse: 'family',
      efmp: 'family',
      employment: 'family',
      immigration: 'family',
      'pet-relocation': 'family',
      schools: 'family',
      'home-locator': 'home-relocation',
      'moving-assistance': 'home-relocation',
      orders: 'home',
      security: 'home',
      'unit-info': 'home',
    };
    setActiveTab(legacyRoutes[tab] || tab);
    setNavOpen(false);
    setShowNotifs(false);
  };

  if (!profile?.branch) {
    return <Onboarding onComplete={(p) => {
      const normalized = normalizeProfile(p);
      setProfile(normalized);
      if (normalized?.demoMode) {
        saveSessionDemoProfile(normalized);
        setActiveTab('home');
        setNavOpen(false);
        setMoreOpen(false);
        setShowNotifs(false);
        setDemoTip(0);
      } else {
        clearSessionDemoProfile();
        store.set('pcs_profile', normalized);
      }
    }} />;
  }

  const DEMO_TIPS = [
    { tab: 'home', title: t('demo.securityTitle'), body: t('demo.securityBody') },
    { tab: 'home', title: t('demo.profileTitle'), body: t('demo.profileBody') },
    { tab: 'home', title: t('demo.basesTitle'), body: t('demo.basesBody') },
    { tab: 'home', title: t('demo.familyTitle'), body: t('demo.familyBody') },
    { tab: 'home', title: t('demo.selectorTitle'), body: t('demo.selectorBody') },
    { tab: 'checklist', title: t('nav.checklist'), body: t('desc.checklist') },
    { tab: 'documents', title: t('nav.documents'), body: t('desc.documents') },
    { tab: 'education', title: t('nav.education'), body: t('desc.education') },
    { tab: 'family', title: t('nav.family'), body: t('desc.family') },
    { tab: 'home-relocation', title: t('nav.home-relocation'), body: t('desc.home-relocation') },
    { tab: 'mental-readiness', title: t('nav.mental-readiness'), body: t('desc.mental-readiness') },
    { tab: 'nav', title: t('nav.nav'), body: t('desc.nav') },
    { tab: 'resources', title: t('nav.resources'), body: t('desc.resources') },
    { tab: 'religion', title: t('nav.religion'), body: t('desc.religion') },
    { tab: 'translation', title: t('nav.translation'), body: t('desc.translation') },
    { tab: 'veterans', title: t('nav.veterans'), body: t('desc.veterans') },
    { tab: 'home', title: t('demo.completeTitle'), body: t('demo.completeBody') },
  ];

  const BOTTOM_NAV = [
    { id: 'home',        label: 'Home',                 icon: 'HQ',  iosIcon: '🏠', color: '#0D1821' },
    { id: 'checklist',   label: 'Checklist',            icon: 'PCK', iosIcon: '✅', color: '#1565C0' },
    { id: 'documents',   label: 'Documents',            icon: 'DOC', iosIcon: '📋', color: '#5D4037' },
    { id: 'education',   label: 'Education',            icon: 'EDU', iosIcon: '📚', color: '#1565C0' },
    { id: 'family',      label: 'Family Readiness',     icon: 'FAM', iosIcon: '👪', color: '#5B2A86' },
    { id: 'home-relocation', label: 'Home Relocation',  icon: 'HME', iosIcon: '🏠', color: '#455A64' },
    { id: 'mental-readiness', label: 'Mental Readiness', icon: 'MNT', iosIcon: '🧠', color: '#00695C' },
    { id: 'nav',         label: 'Navigation',           icon: 'NAV', iosIcon: '🗺️', color: '#00695C' },
    { id: 'resources',   label: 'Resources',            icon: 'RES', iosIcon: '🔗', color: '#C62828' },
    { id: 'religion',    label: 'Spiritual Readiness',  icon: 'SPR', iosIcon: '✦', color: '#37474F' },
    { id: 'translation', label: 'Translation',           icon: 'TRL', iosIcon: '🌐', color: '#1976D2' },
    { id: 'veterans',    label: 'Veterans',             icon: 'VET', iosIcon: '⭐', color: '#E65100' },
  ];
  const LOCALIZED_BOTTOM_NAV = localizeNavItems(BOTTOM_NAV, appLanguage);
  const HOME_CATEGORIES = LOCALIZED_BOTTOM_NAV.filter(item => item.id !== 'home');

  // iOS bottom tab bar: 4 primary + More button
  const IOS_TAB_BAR = [
    { id: 'home',       label: t('nav.home'),      iosIcon: '🏠' },
    { id: 'checklist',  label: t('nav.checklist'), iosIcon: '✅' },
    { id: 'family',     label: t('nav.family'),    iosIcon: '👪' },
    { id: 'home-relocation', label: t('nav.home-relocation'), iosIcon: '🏠' },
  ];

  const currentLabel = LOCALIZED_BOTTOM_NAV.find(n => n.id === activeTab)?.label || t('nav.home');
  const activeNavItem = LOCALIZED_BOTTOM_NAV.find(n => n.id === activeTab);
  const CATEGORY_DESCRIPTIONS = {
    checklist: t('desc.checklist'),
    documents: t('desc.documents'),
    education: t('desc.education'),
    family: t('desc.family'),
    'home-relocation': t('desc.home-relocation'),
    'mental-readiness': t('desc.mental-readiness'),
    nav: t('desc.nav'),
    resources: t('desc.resources'),
    religion: t('desc.religion'),
    translation: t('desc.translation'),
    veterans: t('desc.veterans'),
  };

  const renderCategoryFrame = (tabId, children) => {
    const item = LOCALIZED_BOTTOM_NAV.find(n => n.id === tabId) || activeNavItem;
    return (
      <section className="category-screen" style={{ '--category-color': item?.color || theme.primary }}>
        <div className="category-screen__header" style={{ borderColor: `${theme.accent}55` }}>
          <div className="category-screen__mark" style={{ background: `${item?.color || theme.primary}14`, borderColor: `${item?.color || theme.primary}35`, color: item?.color || theme.primary }}>
            {item?.icon || theme.abbr}
          </div>
          <div>
            <div className="category-screen__eyebrow">{t('categoryEyebrow')}</div>
            <h1>{item?.label || currentLabel}</h1>
            <p>{CATEGORY_DESCRIPTIONS[tabId] || t('defaultCategoryDescription')}</p>
          </div>
        </div>
        <div className="category-screen__body">
          {children}
        </div>
      </section>
    );
  };

  if (activeTab === 'translation') {
    return (
      <div lang={appLanguage} dir={appDir} style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: UI_PALETTE.page, fontFamily: 'system-ui', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
        <PrivacyShield />
        {isDesktop && (
          <div style={{ width: 230, background: theme.secondary, display: 'flex', flexDirection: 'column', minHeight: '100dvh', borderRight: `2px solid ${theme.accent}30`, flexShrink: 0 }}>
            <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
              <div style={{ fontSize: 9, letterSpacing: '.18em', color: theme.accent, fontWeight: 900, marginBottom: 2 }}>PCS EXPRESS</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: theme.accent, letterSpacing: '-1px', lineHeight: 1 }}>{theme.insignia || theme.abbr}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {LOCALIZED_BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)} style={{ width: '100%', padding: '10px 16px', background: activeTab === item.id ? `${theme.accent}20` : 'transparent', border: 'none', borderLeft: `3px solid ${activeTab === item.id ? theme.accent : 'transparent'}`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: activeTab === item.id ? 800 : 600, textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ width: 32, height: 24, borderRadius: 5, background: activeTab === item.id ? `${theme.accent}30` : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, letterSpacing: '.06em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{item.icon}</div>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => { clearSessionDemoProfile(); setProfile(null); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.1)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,100,100,0.85)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>{t('reset')}</button>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: theme.secondary, paddingTop: isNative ? 'env(safe-area-inset-top)' : 0, paddingLeft: 16, paddingRight: 16, paddingBottom: 12, borderBottom: `1px solid ${theme.accent}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isDesktop && <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '2px 4px' }}>←</button>}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{t('nav.translation')}</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom))' : 0 }}>
            {renderCategoryFrame('translation', <TranslationModule theme={theme} profile={profile} />)}
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
              <span style={{ fontSize: 10, fontWeight: moreOpen ? 800 : 600, color: moreOpen ? theme.accent : 'rgba(255,255,255,0.5)', letterSpacing: '.02em', lineHeight: 1 }}>{t('more')}</span>
            </button>
          </div>
        )}
        {isNative && !isDesktop && moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 311, background: 'rgba(0,0,0,0.45)' }} />
            <div style={{ position: 'fixed', bottom: `calc(49px + env(safe-area-inset-bottom))`, left: 0, right: 0, zIndex: 312, background: theme.secondary, borderRadius: '20px 20px 0 0', borderTop: `2px solid ${theme.accent}60`, paddingTop: 8, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: '0 12px' }}>
                {LOCALIZED_BOTTOM_NAV.map(item => (
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
                  {t('demoTour')} {demoTip + 1} / {DEMO_TIPS.length}
                </div>
                <button onClick={() => setDemoTip(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>{t('skip')} ✕</button>
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
                  <button onClick={() => { const prev = demoTip - 1; setDemoTip(prev); goTo(DEMO_TIPS[prev].tab); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← {t('back')}</button>
                )}
                {demoTip < DEMO_TIPS.length - 1 ? (
                  <button onClick={() => { const next = demoTip + 1; setDemoTip(next); goTo(DEMO_TIPS[next].tab); }} style={{ flex: 2, padding: '10px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                    {t('next')}: {DEMO_TIPS[demoTip + 1].title.split('!')[0]} →
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
    <div lang={appLanguage} dir={appDir} style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: UI_PALETTE.page, fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <PrivacyShield />
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
            {LOCALIZED_BOTTOM_NAV.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} style={{ padding: '12px 4px', background: activeTab === item.id ? `${theme.accent}25` : 'transparent', border: 'none', borderBottom: `1px solid rgba(255,255,255,0.07)`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                <div style={{ width: 38, height: 28, borderRadius: 6, background: activeTab === item.id ? `${theme.accent}30` : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.6)', border: activeTab === item.id ? `1px solid ${theme.accent}60` : '1px solid rgba(255,255,255,0.1)' }}>{item.icon}</div>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => { clearSessionDemoProfile(); setProfile(null); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.15)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,100,100,0.9)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
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
              {LOCALIZED_BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)} style={{ width: '100%', padding: '9px 14px', background: activeTab === item.id ? `${theme.accent}18` : 'transparent', border: 'none', borderLeft: `3px solid ${activeTab === item.id ? theme.accent : 'transparent'}`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.72)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: activeTab === item.id ? 800 : 500, textAlign: 'left' }}>
                  <div style={{ width: 30, height: 22, borderRadius: 5, background: activeTab === item.id ? `${theme.accent}28` : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, letterSpacing: '.05em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.55)', flexShrink: 0 }}>{item.icon}</div>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => { clearSessionDemoProfile(); setProfile(null); }} style={{ width: '100%', padding: '9px', background: 'rgba(255,0,0,0.08)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,100,100,0.8)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>{t('reset')}</button>
          </div>
        )}

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}>
        {activeTab === 'home' && (
          <div style={{ padding: isDesktop ? '24px 28px 32px' : '16px', position: 'relative', overflow: 'hidden', minHeight: '100%', background: `linear-gradient(135deg, ${UI_PALETTE.page} 0%, ${UI_PALETTE.surfaceSoft} 46%, ${UI_PALETTE.pageAlt} 100%)`, borderRadius: isDesktop ? 24 : 0, color: UI_PALETTE.text }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: isDesktop ? -28 : -52, top: isDesktop ? 112 : 156, fontSize: isDesktop ? 450 : 292, fontWeight: 950, opacity: 0.14, userSelect: 'none', pointerEvents: 'none', color: theme.primary, letterSpacing: isDesktop ? '-18px' : '-12px', lineHeight: 0.82, zIndex: 0 }}>
              {homeInsignia}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Branch Hero Banner */}
            <div style={{ background: `linear-gradient(135deg, ${UI_PALETTE.surface} 0%, #F6F1E4 100%)`, borderRadius: 18, padding: isDesktop ? '24px 22px' : '20px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden', border: `1px solid ${UI_PALETTE.line}`, boxShadow: '0 18px 42px rgba(38,53,31,0.13)' }}>
              {/* Background branch acronym watermark */}
              <div style={{ position: 'absolute', right: -8, bottom: -12, fontSize: 90, fontWeight: 900, opacity: 0.07, userSelect: 'none', pointerEvents: 'none', color: theme.accent, letterSpacing: '-4px', lineHeight: 1 }}>
                {homeInsignia}
              </div>
              {/* Branch label */}
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.22em', color: theme.primary, marginBottom: 4, textTransform: 'uppercase' }}>
                {t('unitedStates')} {profile.branch.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: UI_PALETTE.muted, fontStyle: 'italic', marginBottom: 12 }}>{theme.tagline}</div>
              {/* Soldier info */}
              <div style={{ fontSize: 13, fontWeight: 800, color: UI_PALETTE.text }}>
                {getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName} {profile.lastName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {profile.gainingInstallation ? `${t('reportingTo')}: ${profile.gainingInstallation}` : t('setGaining')}
              </div>
              {/* Accent bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: theme.accent, borderRadius: '16px 0 0 16px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {HOME_CATEGORIES.map((item) => (
                <div key={item.id} onClick={() => goTo(item.id)} style={{ background: UI_PALETTE.surface, border: `1px solid ${UI_PALETTE.line}`, borderTop: `4px solid ${item.color}`, borderRadius: 14, padding: isDesktop ? '18px 12px' : '15px 10px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 12px 28px rgba(38,53,31,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: isDesktop ? 118 : 104, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 50, height: 36, borderRadius: 10, background: `${item.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${item.color}35`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45)` }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: item.color, letterSpacing: '.08em' }}>{item.icon}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821', lineHeight: 1.2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Quick profile summary */}
            <div style={{ background: UI_PALETTE.surface, border: `1px solid ${UI_PALETTE.line}`, borderRadius: 14, padding: 14, marginTop: 16, color: UI_PALETTE.text, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: theme.primary, marginBottom: 8, letterSpacing: '.12em' }}>{t('yourProfile')}</div>
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div>{t('branch')}: {profile.branch} · {getRankDisplay(profile.branch, profile.paygrade)} ({profile.paygrade})</div>
                {profile.gainingInstallation && <div>{t('gaining')}: {profile.gainingInstallation}</div>}
                {profile.departingDate && <div>{t('depart')}: {profile.departingDate}</div>}
                {profile.religiousPreference && profile.religiousPreference !== 'Prefer not to say' && <div>{t('faith')}: {profile.religiousPreference}</div>}
              </div>
            </div>
            <HomeLegalBanners theme={theme} />
            </div>
          </div>
        )}

        {activeTab === 'checklist' && renderCategoryFrame('checklist', <ChecklistTab theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />)}
        {activeTab === 'documents' && renderCategoryFrame('documents', <PCSDocumentsModule theme={theme} profile={profile} />)}
        {activeTab === 'education' && renderCategoryFrame('education', <EducationBenefitsTab theme={theme} profile={profile} />)}
        {activeTab === 'family' && renderCategoryFrame('family', <FamilyCategoryTab theme={theme} profile={profile} />)}
        {activeTab === 'home-relocation' && renderCategoryFrame('home-relocation', <HomeRelocationUnifiedTab theme={theme} profile={profile} />)}
        {activeTab === 'mental-readiness' && renderCategoryFrame('mental-readiness', <MentalReadinessTab theme={theme} profile={profile} />)}
        {activeTab === 'nav' && renderCategoryFrame('nav', <NavigationModule theme={theme} profile={profile} />)}
        {activeTab === 'religion' && renderCategoryFrame('religion', <ReligiousServicesModuleWrapped theme={theme} profile={profile} />)}
        {activeTab === 'resources' && renderCategoryFrame('resources', <ResourcesTab theme={theme} profile={profile} />)}
        {activeTab === 'veterans' && renderCategoryFrame('veterans', <VeteranBusinessesTab theme={theme} profile={profile} />)}
      </div>
      </div>{/* end body container */}

      {/* INTERACTIVE DEMO TOUR OVERLAY */}
      {demoTip >= 0 && demoTip < DEMO_TIPS.length && (
        <div style={{ position: 'fixed', bottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom) + 12px)' : 'calc(24px + env(safe-area-inset-bottom))', left: isDesktop ? 230 : 0, right: 0, maxWidth: isDesktop ? '100%' : 480, margin: isDesktop ? 0 : '0 auto', padding: '0 12px', zIndex: 350 }}>
          <div style={{ background: theme.secondary, borderRadius: 16, padding: '16px', border: `2px solid ${theme.accent}`, boxShadow: '0 -4px 30px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: theme.accent, borderRadius: 10, padding: '2px 10px', fontSize: 10, fontWeight: 900, color: theme.secondary }}>
                  {t('demoTour')} {demoTip + 1} / {DEMO_TIPS.length}
                </div>
              </div>
              <button onClick={() => setDemoTip(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>{t('skip')} ✕</button>
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
                <button onClick={() => { const prev = demoTip - 1; setDemoTip(prev); goTo(DEMO_TIPS[prev].tab); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← {t('back')}</button>
              )}
              {demoTip < DEMO_TIPS.length - 1 ? (
                <button onClick={() => { const next = demoTip + 1; setDemoTip(next); goTo(DEMO_TIPS[next].tab); }} style={{ flex: 2, padding: '10px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                  {t('next')}: {DEMO_TIPS[demoTip + 1].title.split('!')[0]} →
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
            <span style={{ fontSize: 10, fontWeight: moreOpen ? 800 : 600, color: moreOpen ? theme.accent : 'rgba(255,255,255,0.5)', letterSpacing: '.02em', lineHeight: 1 }}>{t('more')}</span>
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
              {LOCALIZED_BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} style={{ padding: '10px 4px 8px', background: activeTab === item.id ? `${theme.accent}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTab === item.id ? theme.accent + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(30%) opacity(0.7)' }}>{item.iosIcon}</span>
                  <span style={{ fontSize: 9, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.65)', letterSpacing: '.02em', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '10px 12px 4px' }}>
              <button onClick={() => { clearSessionDemoProfile(); setProfile(null); setMoreOpen(false); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 12, color: 'rgba(255,100,100,0.9)', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
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

export default function AppWithRecovery() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
