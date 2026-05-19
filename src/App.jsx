/*
 * Purpose: Main PCS Express React shell, onboarding flow, tab navigation, and core PCS modules.
 * Third-party dependencies: React, Leaflet through child map modules, Capacitor bridge when running native.
 */

import { Component, useState, useEffect } from 'react'
import './App.css'
import { apiUrl } from './config/apiConfig'
import EmploymentModule from './components/EmploymentModule'
import NavigationModule from './components/NavigationModule'
import EducationModule from './components/EducationModule'
import TranslationModule from './components/TranslationModule'
import ReligiousServicesModule from './components/ReligiousServicesModule'
import SpouseDeploymentGuide from './components/SpouseDeploymentGuide'
import PCSDocumentsModule from './components/PCSDocumentsModule'
import ShipmentTrackerModule from './components/ShipmentTrackerModule'
import ComplianceAttestationModule from './components/ComplianceAttestationModule'
import InventoryVaultModule from './components/InventoryVaultModule'
import JTRAssistantModule from './components/JTRAssistantModule'
import { AIAssistantModal, AIAssistantTrigger } from './components/AIAssistantChip'
import ImmigrationModule from './components/ImmigrationModule'
import MovingFinancialAssistanceTab from './components/MovingFinancialAssistanceTab'
import PetRelocationChecklistTab from './components/PetRelocationChecklistTab'
import EFMPTab from './components/EFMPTab'
import HomeRelocationTab from './components/HomeRelocationTab'
import HomeLocatorTab from './components/HomeLocatorTab'
import BaseIntelligenceReviews from './components/BaseIntelligenceReviews'
import DynamicTimeline from './components/DynamicTimeline'
import PPMFinancialEstimator from './components/PPMFinancialEstimator'
import BAHCalculatorTab from './components/BAHCalculatorTab'
import OHACalculatorTab from './components/OHACalculatorTab'
import LQACalculatorTab from './components/LQACalculatorTab'
import MedicalReadinessTab from './components/MedicalReadinessTab'
import MoveBudgetTracker from './components/MoveBudgetTracker'
import DutyStationDirectory from './components/DutyStationDirectory'
import PrivacyShield from './components/PrivacyShield'
import SyncStatusIndicator from './components/SyncStatusIndicator'
import { AuditLogger, secureLocalStore, readLegacyJson } from './security/SecurityExtensions'
import { ALL_BASES } from './components/BaseMapModule'
import { resolveMarket } from './data/installationMarkets'
import { useAppLanguageRuntime } from './i18n/useAppLanguageRuntime'
import { applyGoogleTranslateLanguage } from './i18n/googleTranslateRuntime'

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

// Wipe every trace of the user from this device. Used by the Reset /
// Re-onboard button so a "fresh restart" is actually fresh — profile,
// checklist progress, document states, saved translations, audit log,
// last-save timestamp, language fast-path, encryption key, and any
// demo session preview state.
async function eraseAllUserData() {
  // 1. localStorage — every key the app writes
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('pcs_') || k === 'translations_saved')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {}

  // 2. sessionStorage — demo profile preview, banner-dismissal flags
  try { sessionStorage.clear(); } catch {}

  // 3. Cache API — wipe any cached responses the browser may have stored
  //    (PWA / service-worker style caches). Best-effort.
  try {
    if (typeof caches !== 'undefined' && caches.keys) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
  } catch {}

  // 4. IndexedDB — wipe the cryptoStore so the next session generates a
  //    fresh AES-256 key. Critically: close the cached connection FIRST,
  //    otherwise deleteDatabase fires onblocked and never completes.
  try {
    const { closeCryptoStoreDB } = await import('./security/cryptoStore.js');
    closeCryptoStoreDB();
  } catch {}
  try {
    if (window.indexedDB) {
      // Discover every database this origin holds (Chrome/Firefox/Safari
      // 14+) and delete each one to be thorough — drops not just our
      // crypto DB but any future ones too.
      let dbNames = ['pcs-express-crypto'];
      try {
        if (indexedDB.databases) {
          const all = await indexedDB.databases();
          dbNames = [...new Set([...dbNames, ...all.map(d => d.name).filter(Boolean)])];
        }
      } catch {}
      await Promise.all(dbNames.map(name => new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
      })));
    }
  } catch {}

  window.dispatchEvent(new CustomEvent('pcs-user-data-erased'));
}

// Save-status floating indicator. Shows a one-line confirmation that
// the user's progress has been written to encrypted local storage.
// Listens for the pcs-local-sync event (dispatched by secureLocalStore
// on every successful set) and updates the relative time string.
// Click reveals a longer explanation (also lives in the demo tour).
// Prominent in-app warning modal shown when the user taps Reset / Re-onboard.
// Replaces the previous tiny window.confirm so the user sees clearly what
// will be deleted before they confirm. The "Yes, Delete Everything" button
// is intentionally far from the X / Cancel and uses a destructive red.
function ResetWarningModal({ theme, onConfirm, onCancel }) {
  return (
    <div data-no-language-runtime role="dialog" aria-modal="true" aria-labelledby="reset-warning-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', borderTop: `6px solid #DC2626` }}>
        {/* Header */}
        <div style={{ background: '#7F1D1D', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 950, color: '#FCA5A5', letterSpacing: '.14em' }}>WARNING — DESTRUCTIVE ACTION</div>
            <h2 id="reset-warning-title" style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#FFFFFF' }}>Reset will delete everything on this device</h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: '#1F2937', margin: '0 0 12px', fontWeight: 600 }}>
            If you continue, all your saved progress is permanently removed from this device. <strong>You will have to start over from onboarding.</strong> This cannot be undone.
          </p>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#7F1D1D', marginBottom: 6, letterSpacing: '.06em' }}>WHAT GETS DELETED:</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.65, color: '#7F1D1D' }}>
              <li>Your profile (branch, rank, name, installations, dates)</li>
              <li>Family info (dependents, children, pets, religion)</li>
              <li>All checklist progress across every phase</li>
              <li>All document gather-status marks</li>
              <li>Saved translations from the Translate tab</li>
              <li>The encryption key your data was sealed with</li>
              <li>Audit log entries</li>
            </ul>
          </div>
          <div style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 11, lineHeight: 1.6, color: '#374151' }}>
            <strong>Why am I seeing my old profile on refresh?</strong> That's normal — PCS Express autosaves your data encrypted on this device so a refresh doesn't lose your progress. Reset is the only way to wipe it.
          </div>

          {/* Action buttons — Cancel on the left, destructive Confirm on the right */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 10, background: '#F3F4F6', color: '#1F2937', border: '1.5px solid #D1D5DB', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              Cancel — keep my data
            </button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: 10, background: '#DC2626', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.4)' }}>
              Yes, delete everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveStatusIndicator({ theme }) {
  const [lastSave, setLastSave] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const seed = () => {
      try {
        const raw = localStorage.getItem('pcs_last_local_save_at');
        if (raw) setLastSave(JSON.parse(raw));
      } catch {}
    };
    seed();
    const onSync = () => seed();
    window.addEventListener('pcs-local-sync', onSync);
    return () => window.removeEventListener('pcs-local-sync', onSync);
  }, []);
  const rel = (() => {
    if (!lastSave) return 'No saves yet';
    const ms = Date.now() - new Date(lastSave).getTime();
    if (ms < 5_000) return 'Just saved';
    if (ms < 60_000) return `Saved ${Math.floor(ms / 1_000)}s ago`;
    if (ms < 3_600_000) return `Saved ${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `Saved ${Math.floor(ms / 3_600_000)}h ago`;
    return `Saved ${Math.floor(ms / 86_400_000)}d ago`;
  })();
  // Force re-render every 30s so the relative time stays accurate
  useEffect(() => {
    const id = setInterval(() => setLastSave(v => v ? v + '' : v), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div data-no-language-runtime style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 150, pointerEvents: 'auto' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Save status"
        title="Save status — your data is auto-saved with AES-256 encryption"
        style={{
          background: theme.primary,
          color: '#FFFFFF',
          border: `1.5px solid ${theme.accent}80`,
          borderRadius: 999,
          padding: '8px 14px',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '.04em',
          boxShadow: '0 6px 22px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 12 }}>🔒</span>
        <span>{rel}</span>
      </button>
      {open && (
        <div role="dialog" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, width: 260, background: '#FFFFFF', border: `1px solid ${theme.accent}55`, borderRadius: 12, padding: 12, color: '#111827', fontSize: 11, lineHeight: 1.55, boxShadow: '0 12px 30px rgba(0,0,0,0.22)' }}>
          <div style={{ fontWeight: 950, color: theme.primary, fontSize: 11, letterSpacing: '.08em', marginBottom: 6 }}>SAVED ON THIS DEVICE</div>
          Your profile, checklist, and documents are saved every time you change something. The data is scrambled with strong encryption (AES-256) and stays only on this device — we never see it. This badge updates each time a save happens.
        </div>
      )}
    </div>
  );
}

const PROFILE_DEFAULTS = {
  firstName: '',
  lastName: '',
  branch: 'Army',
  component: 'Active Duty',
  paygrade: 'E-5',
  // ordersType applies only when component is Reserve or National Guard.
  // Controls eligibility filtering for BAH, TRICARE Prime, PCS
  // entitlements, etc. Empty string for non-Reserve/NG profiles.
  ordersType: '',
  losingInstallation: '',
  gainingInstallation: '',
  departingDate: '',
  // Report-NLT (Not Later Than) is the hard-deadline arrival date the
  // T-Minus dashboard counts down to. Separate from departingDate so
  // legacy code that reads `departingDate` keeps working.
  reportNLTDate: '',
  isOverseas: false,
  hasDependents: false,
  hasChildren: false,
  childAges: [],
  childrenAges: '',
  // New step-3 toggles per redesign brief
  hasPets: false,
  moveType: 'HHG', // 'HHG' = government-arranged Household Goods move; 'PPM' = Personally Procured Move (DITY)
  language: 'en',
  religiousPreference: 'No Preference',
};

// Reserve / National Guard orders-type catalog. Source: 10 USC §12301-12305,
// 32 USC §502 / §709, JTR Chapter 7 (Reserve/Guard PCS), and the DoD
// Reserve Components publications. The eligibility flags drive UI
// gating — only tasks/forms/info that apply to the selected orders
// type are shown.
//
// Eligibility flags:
//   pcsEntitled:    full PCS package (HHG, DLA, per diem, TQSE/TLE)
//   bahEligible:    drawing BAH at the duty-station ZIP
//   tricarePrime:   eligible to enroll in TRICARE Prime
//   federalActive:  on federal active duty status (vs. state SAD)
//   ordersDuration: 'short' | 'long' — short ≤30 days (drills, AT),
//                    long >30 days triggers PCS-tier benefits
const RESERVE_ORDERS_TYPES = [
  { value: 'title10_pcs',          label: 'Title 10 PCS Orders (Federal Active Duty, 180+ days)',  desc: '10 USC §12301(d) voluntary, or §12302 partial mobilization. Full active-duty PCS entitlements: BAH at gaining ZIP, TRICARE Prime, HHG, DLA, TLE/TQSE.',                                                                pcsEntitled: true,  bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  { value: 'title10_mobilization', label: 'Title 10 Mobilization (Involuntary, 30+ days)',         desc: '10 USC §12302 / §12304 / §12304b. Active duty for contingency, presidential reserve call-up, or pre-planned mission. Same benefits as Title 10 PCS for the duration.',                                          pcsEntitled: true,  bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  { value: 'agr',                  label: 'AGR (Active Guard Reserve) / TAR / AR Program',         desc: 'Full-time Title 10 active duty supporting the Reserve component (Army AGR, Navy TAR, Marine AR, Air Force AGR, Coast Guard RPA). Benefits match Active Duty: BAH, TRICARE Prime, HHG, full JTR PCS package.',  pcsEntitled: true,  bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  { value: 'title10_ados',         label: 'Title 10 ADOS / ADSW',                                  desc: 'Active Duty Operational Support — voluntary federal active duty for specific projects. Benefits scale with duration: 30+ days unlocks BAH; 180+ days unlocks full PCS package.',                                  pcsEntitled: false, bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  { value: 'title10_at',           label: 'Annual Training (AT / ADT / IADT, ≤30 days)',           desc: '10 USC §12301(b). Short-term federal active duty for training. No PCS, no BAH at gaining ZIP, but TRICARE coverage for duration plus 6 months post.',                                                            pcsEntitled: false, bahEligible: false, tricarePrime: true,  federalActive: true,  ordersDuration: 'short', oconusEligible: false },
  { value: 'idt',                  label: 'Drill / IDT (Inactive Duty Training)',                  desc: '10 USC §10147. Weekend drill assemblies. No active-duty status, no PCS, no BAH. TRICARE Reserve Select (TRS) available as a premium option for continuous coverage.',                                              pcsEntitled: false, bahEligible: false, tricarePrime: false, federalActive: false, ordersDuration: 'short', oconusEligible: false },
  { value: 'reserve_pcs',          label: 'Reserve Center Change (Inter-Unit Transfer)',           desc: 'Administrative move between Reserve Centers without active-duty status change. May qualify for limited relocation assistance through the gaining unit but no JTR PCS package.',                                  pcsEntitled: false, bahEligible: false, tricarePrime: false, federalActive: false, ordersDuration: 'short', oconusEligible: false },
]

const GUARD_ORDERS_TYPES = [
  { value: 'title10_pcs',          label: 'Title 10 PCS Orders (Federal Active Duty, 180+ days)',  desc: '10 USC §12301(d) voluntary or §12302 mobilization. Same benefits as Active Duty: BAH at gaining ZIP, TRICARE Prime, HHG, DLA, TLE/TQSE.',                                                                       pcsEntitled: true,  bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  { value: 'title10_mobilization', label: 'Title 10 Mobilization (Involuntary)',                   desc: '10 USC §12302 / §12304. Full federal active duty for contingency or presidential call-up. Same benefits as Title 10 PCS for the duration.',                                                                     pcsEntitled: true,  bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  // Title 32 is state-controlled federal pay. By statute it cannot
  // execute an OCONUS PCS — the gaining unit must be within the
  // ordering state's jurisdiction.
  { value: 'title32_502f',         label: 'Title 32 §502(f) Orders (Federal Pay, State Control)',  desc: '32 USC §502(f). Federal funding, state-controlled — common for state-mobilized federal missions (e.g., border, COVID response). BAH and TRICARE Prime apply for orders 30+ days. NOT eligible for OCONUS PCS — the Title 32 status is state-jurisdictional.', pcsEntitled: false, bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: false },
  { value: 'title32_709',          label: 'Title 32 §709 (Dual-Status Technician)',                desc: '32 USC §709. Full-time federal civilian + Guard membership. Benefits flow primarily from the FEDERAL CIVILIAN side (FEHB, FERS, locality pay). Guard-side benefits limited to drill / AT.',                       pcsEntitled: false, bahEligible: false, tricarePrime: false, federalActive: false, ordersDuration: 'short', oconusEligible: false },
  { value: 'agr',                  label: 'AGR (Active Guard Reserve)',                            desc: 'Full-time Title 10 or Title 32 active duty supporting the Guard. Benefits match Active Duty: BAH, TRICARE Prime, HHG, full JTR PCS package.',                                                                  pcsEntitled: true,  bahEligible: true,  tricarePrime: true,  federalActive: true,  ordersDuration: 'long',  oconusEligible: true  },
  { value: 'idt',                  label: 'Drill / IDT (Inactive Duty Training)',                  desc: '32 USC §502(a). Weekend drills. No active-duty status, no PCS, no BAH. TRICARE Reserve Select (TRS) available as a premium option for continuous coverage.',                                                    pcsEntitled: false, bahEligible: false, tricarePrime: false, federalActive: false, ordersDuration: 'short', oconusEligible: false },
  { value: 'sad',                  label: 'State Active Duty (SAD) — Governor-directed',           desc: 'State funding, state control — common for state emergencies (hurricane, fire, civil disturbance). NO federal benefits (no BAH, no TRICARE, no PCS), only state pay and benefits per state law. NOT eligible for OCONUS PCS — the SAD status is fully state-jurisdictional.', pcsEntitled: false, bahEligible: false, tricarePrime: false, federalActive: false, ordersDuration: 'short', oconusEligible: false },
]

function ordersTypeCatalog(component) {
  if (component === 'National Guard') return GUARD_ORDERS_TYPES
  if (component === 'Reserve') return RESERVE_ORDERS_TYPES
  return []
}

function ordersTypeMeta(component, ordersType) {
  return ordersTypeCatalog(component).find(o => o.value === ordersType) || null
}

function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const branch = BRANCH_THEMES[raw.branch] ? raw.branch : PROFILE_DEFAULTS.branch;
  const childAges = Array.isArray(raw.childAges)
    ? raw.childAges.filter(a => a !== '' && !isNaN(Number(a))).map(Number)
    : String(raw.childrenAges || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  // Migrate retired component values. AGR is no longer a top-level
  // component — it became an orders-type inside Reserve. Dependent is
  // no longer a top-level onboarding option. Both fall back to Active
  // Duty so the rest of the profile (branch, paygrade) stays usable.
  let migratedComponent = raw.component || PROFILE_DEFAULTS.component;
  let migratedOrdersType = raw.ordersType || '';
  if (raw.component === 'AGR') {
    migratedComponent = 'Reserve';
    migratedOrdersType = 'agr';
  } else if (raw.component === 'Dependent') {
    migratedComponent = 'Active Duty';
  }
  // ordersType only applies to Reserve and National Guard. Strip any
  // leftover value for Active Duty or DoD Civilian profiles so the
  // checklist/document filters don't accidentally narrow benefits.
  if (migratedComponent !== 'Reserve' && migratedComponent !== 'National Guard') {
    migratedOrdersType = '';
  }

  return {
    ...PROFILE_DEFAULTS,
    ...raw,
    branch,
    firstName: String(raw.firstName || ''),
    lastName: String(raw.lastName || ''),
    component: ['FTNG', 'Spouse'].includes(raw.component) ? PROFILE_DEFAULTS.component : migratedComponent,
    ordersType: migratedOrdersType,
    paygrade: raw.paygrade || PROFILE_DEFAULTS.paygrade,
    losingInstallation: String(raw.losingInstallation || ''),
    gainingInstallation: String(raw.gainingInstallation || ''),
    departingDate: String(raw.departingDate || ''),
    reportNLTDate: String(raw.reportNLTDate || raw.departingDate || ''),
    hasPets: !!raw.hasPets,
    moveType: ['HHG', 'PPM'].includes(raw.moveType) ? raw.moveType : PROFILE_DEFAULTS.moveType,
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

// === TACTICAL OPERATIONS CENTER (TOC) UI PALETTE ===
// Dark slate field with subtle grid background, branch-color glow
// accents at the rail level, light cards as elevated surfaces over
// the dark base. High contrast white-on-charcoal for the chrome
// (headers, sidebar, footers); cards retain light surfaces for
// content readability without rewriting every inline style.
const UI_PALETTE = {
  // Dark slate base for the app frame (headers, sidebar, body bg).
  page: '#0F1B26',
  pageAlt: '#172332',
  // Card-content surfaces remain light so dense text stays readable.
  surface: '#FFFFFF',
  surfaceSoft: '#F8FAFC',
  // Body text on light card surfaces.
  text: '#111827',
  muted: '#56616F',
  line: '#DDD5C2',
  // Dark-frame text colors (used by header / sidebar / footer).
  frameText: '#E8EFF5',
  frameMuted: '#8B96A3',
  frameLine: '#2E3D52',
  // Heritage colors retained for legacy callers.
  tactical: '#4F5D35',
  tacticalDark: '#26351F',
  gold: '#B8943A',
  danger: '#7F1D1D',
  // Subtle SVG grid pattern data-URI - 32x32 squares with 1px
  // line at 8% opacity. Renders as a tactical operations grid
  // beneath the dark slate base. CSS background-image consumer
  // composites this over UI_PALETTE.page.
  pagePattern: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M32 0H0V32' fill='none' stroke='%231F2E40' stroke-width='1' opacity='0.6'/></svg>")`,
};


// Per-branch terminology mapping per redesign brief. Use BRANCH_TERMS[branch].key
// so the app speaks each branch's native language (a Sailor sees "Sailor" /
// "Ship or NAS"; a Marine sees "Marine" / "MCB or MCAS"; etc.). Falls back to
// Army terms if a branch is missing a key. Keep the keys small and focused
// on phrases that genuinely change across branches — over-specializing makes
// the table brittle.
// T-Minus milestone schedule. Each milestone is an offset (negative = days
// before Report-NLT, positive = days after report date) plus a key. The
// dashboard sorts these against today and surfaces the upcoming three and
// the most recently passed one. Keys map into the existing localization
// system via ot()/runtime walker.
const TMINUS_MILESTONES = [
  { days: -120, label: 'Start looking into your move. Talk to TMO about options.',          phase: '90 Days Out' },
  { days: -90,  label: 'Book your household goods pickup in DPS.',                          phase: '90 Days Out' },
  { days: -75,  label: 'Ask for house-hunting leave (PTDY) if you qualify.',                phase: '90 Days Out' },
  { days: -60,  label: 'Get sealed copies of medical and dental records.',                  phase: '60 Days Out' },
  { days: -45,  label: 'Get school records. If you have EFMP, finish the screening.',       phase: '60 Days Out' },
  { days: -30,  label: 'Start clearing your current base. Book lodging at the new one.',    phase: '30 Days Out' },
  { days: -14,  label: 'Pack-out week — be home when the movers come.',                     phase: 'Move Week' },
  { days: -7,   label: 'Walk through your old place. Pick up your final pay paperwork.',    phase: 'Move Week' },
  { days: -5,   label: 'Final out: turn in housing and clear the base.',                    phase: 'Move Week' },
  { days: 0,    label: 'Report to your new unit. Sign in.',                                 phase: 'In-Processing' },
  { days: 5,    label: 'Turn in your travel voucher (DD 1351-2) within 5 work days.',       phase: 'In-Processing' },
  { days: 14,   label: 'Schedule your household goods delivery and check for damage.',      phase: 'In-Processing' },
  { days: 30,   label: 'Finish in-processing. Update DEERS with your new address.',         phase: 'In-Processing' },
];

function TMinusDashboard({ theme, profile }) {
  const target = profile?.reportNLTDate || profile?.departingDate;
  if (!target) return null;
  const targetDate = new Date(target);
  if (isNaN(targetDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.floor((targetDate - today) / 86400000);

  const upcoming = TMINUS_MILESTONES
    .map(m => ({ ...m, dueDate: new Date(targetDate.getTime() + m.days * 86400000), tMinus: -m.days - daysUntil }))
    .filter(m => m.tMinus <= 14 && m.tMinus >= -14)
    .sort((a, b) => a.tMinus - b.tMinus);

  const tLabel = daysUntil >= 0 ? `T-${daysUntil}` : `T+${Math.abs(daysUntil)}`;
  const tColor = daysUntil < 0 ? '#16A34A' : daysUntil <= 7 ? '#DC2626' : daysUntil <= 30 ? '#F59E0B' : theme.accent;

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${UI_PALETTE.line}`, borderLeft: `4px solid ${tColor}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>T-MINUS · REPORT-NLT</div>
          <div style={{ fontSize: 11, color: UI_PALETTE.muted, marginTop: 2 }}>{target}</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 950, color: tColor, letterSpacing: '-1px' }}>{tLabel}</div>
      </div>
      {upcoming.length === 0 ? (
        <div style={{ fontSize: 12, color: UI_PALETTE.muted, lineHeight: 1.5 }}>
          {daysUntil > 14 ? 'More than two weeks out — your detailed checklist phases are active in the PCS Checklist tab.' : 'In-processing window is complete. Track residual administrative items in your checklist.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {upcoming.slice(0, 4).map((m, idx) => {
            const passed = m.tMinus < 0;
            const tag = m.days >= 0 ? `T+${m.days}` : `T${m.days}`;
            return (
              <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: idx === Math.min(upcoming.length, 4) - 1 ? 'none' : `1px dashed ${UI_PALETTE.line}` }}>
                <div style={{ flexShrink: 0, minWidth: 44, fontSize: 11, fontWeight: 900, color: passed ? '#9CA3AF' : tColor, textAlign: 'center', padding: '2px 0' }}>{tag}</div>
                <div style={{ flex: 1, fontSize: 12, color: passed ? '#9CA3AF' : UI_PALETTE.text, lineHeight: 1.45, textDecoration: passed ? 'line-through' : 'none' }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Mission Lanes — Command Center task triage.
//
// Pulls the user's tailored PCS checklist (per-branch + filtered by
// component / orders type / pets / children / OCONUS / move type),
// then surfaces the most-imminent UNCHECKED items in three lanes:
//
//   • Today          → current phase per PHASE_WINDOWS
//   • This Week      → next phase chronologically
//   • Before You Report → remaining phases before In-Processing
//
// Checking an item in PCS Operations → Checklist removes it from the
// lanes automatically (state is shared via checklistItems). Tapping
// any lane row routes to PCS Operations where the full checklist
// lives.
// ───────────────────────────────────────────────────────────────────
const PHASE_ORDER = ['Orders Received', '90 Days Out', '60 Days Out', '30 Days Out', 'Move Week', 'In-Processing'];

// ───────────────────────────────────────────────────────────────────
// QuickActionsRow — chip-button row pinned right under Mission Brief.
//
// Five chips: open Checklist, open Movement & Logistics, open AI
// Assistant, jump to Holistic Health, open Compliance modal. Designed
// to handle the "I just opened the app, what now?" use case in a single
// tap. Horizontally scrollable on narrow viewports.
// ───────────────────────────────────────────────────────────────────
function QuickActionsRow({ theme, onJumpTo, onOpenAI, onOpenCompliance }) {
  const actions = [
    { id: 'checklist',  icon: '📋', label: 'Open Checklist',     onClick: () => onJumpTo('pcs-operations') },
    { id: 'shipment',   icon: '🚚', label: 'Track shipment',     onClick: () => onJumpTo('home-relocation') },
    { id: 'ai',         icon: '🤖', label: 'Ask AI Assistant',   onClick: onOpenAI },
    { id: 'health',     icon: '🌿', label: 'Holistic Health',    onClick: () => onJumpTo('medical-readiness') },
    { id: 'security',   icon: '🔒', label: 'Security & data',    onClick: onOpenCompliance },
  ];
  return (
    <div role="region" aria-label="Quick actions" style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 14, paddingBottom: 4, scrollbarWidth: 'thin' }}>
      {actions.map(a => (
        <button
          key={a.id}
          type="button"
          onClick={a.onClick}
          aria-label={a.label}
          className="pcs-quick-action"
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${theme.primary}25`,
            background: UI_PALETTE.surface,
            color: theme.primary,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(38,53,31,0.06)',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 14 }}>{a.icon}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// ChangeLogCard — "What changed this week" card on Command Center.
//
// Reads the AuditLogger metadata stream (already encrypted at rest)
// and surfaces the most-recent user-facing actions from the last
// 7 days. Useful for stressed users who can't remember what they
// already did. Only metadata events are stored (no PII), so this is
// a safe surface to render.
// ───────────────────────────────────────────────────────────────────
const ACTION_LABELS = {
  pcs_milestone_status_change:      (d) => `${d?.complete ? 'Completed' : 'Reopened'} checklist task (${d?.phase || '?'} #${(d?.index ?? '?') + (typeof d?.index === 'number' ? 1 : 0)})`,
  inventory_vault_change:           (d) => `Updated inventory worksheet (${d?.itemCount || 0} items, ${d?.phase || '—'})`,
  shipment_tracker_change:          (d) => `Updated shipment tracker (${d?.completedCount || 0} milestones cleared)`,
  pet_relocation_checklist_change:  (d) => `${d?.complete ? 'Completed' : 'Reopened'} pet-relocation task (${d?.phase || '?'} #${(d?.index ?? 0) + 1})`,
  ai_assistant_opened:              () => 'Opened the AI Assistant',
  // Anything not explicitly mapped renders as a humanized action name.
};

function humanizeAction(action) {
  return String(action || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function fmtRelativeFromIso(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ChangeLogCard({ theme }) {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get('pcs_audit_log', []).then(list => {
      if (!mounted) return;
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      const filtered = (Array.isArray(list) ? list : [])
        .filter(e => e && e.action && e.timestamp && new Date(e.timestamp).getTime() >= sevenDaysAgo)
        .slice(0, 5);
      setEntries(filtered);
    }).catch(() => setEntries([]));

    // Listen for live audit updates so the card refreshes without
    // a full page reload when the user takes an action.
    const handler = () => {
      secureLocalStore.get('pcs_audit_log', []).then(list => {
        if (!mounted) return;
        const sevenDaysAgo = Date.now() - 7 * 86400000;
        const filtered = (Array.isArray(list) ? list : [])
          .filter(e => e && e.action && e.timestamp && new Date(e.timestamp).getTime() >= sevenDaysAgo)
          .slice(0, 5);
        setEntries(filtered);
      });
    };
    window.addEventListener('pcs-audit-log', handler);
    return () => {
      mounted = false;
      window.removeEventListener('pcs-audit-log', handler);
    };
  }, []);

  if (entries == null) return null;          // initial load — render nothing
  if (entries.length === 0) return null;    // brand-new user — render nothing

  return (
    <div style={{ background: UI_PALETTE.surface, border: `1px solid ${UI_PALETTE.line}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>WHAT CHANGED THIS WEEK</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: UI_PALETTE.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>{entries.length} {entries.length === 1 ? 'event' : 'events'}</div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
        {entries.map(e => {
          const labeler = ACTION_LABELS[e.action];
          const text = labeler ? labeler(e.details || {}) : humanizeAction(e.action);
          return (
            <li key={e.id || `${e.action}-${e.timestamp}`} style={{ background: UI_PALETTE.surfaceSoft || '#F6F1E4', border: `1px solid ${UI_PALETTE.line}`, borderLeft: `3px solid ${theme.accent}`, borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: UI_PALETTE.text, lineHeight: 1.45 }}>{text}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: UI_PALETTE.muted, whiteSpace: 'nowrap', marginTop: 1 }}>{fmtRelativeFromIso(e.timestamp)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function resolveCurrentPhase(daysUntil) {
  if (daysUntil == null) return null;
  // Walk PHASE_WINDOWS in chronological order — the current phase is
  // the FIRST one whose activeAt is greater than or equal to daysUntil
  // but where overdueAt is less than daysUntil. Falls through to
  // In-Processing once we are past the report date.
  if (daysUntil >  90) return 'Orders Received';
  if (daysUntil >  60) return '90 Days Out';
  if (daysUntil >  30) return '60 Days Out';
  if (daysUntil >   7) return '30 Days Out';
  if (daysUntil >=  0) return 'Move Week';
  return 'In-Processing';
}

function MissionLanes({ theme, profile, checklistItems, onJumpToOps }) {
  const target = profile?.reportNLTDate || profile?.departingDate;
  if (!target) return null;
  const targetDate = new Date(target);
  if (isNaN(targetDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.floor((targetDate - today) / 86400000);

  // Build the same tailored per-phase checklist the user sees in PCS
  // Operations → Checklist, then index each task by its `phase-idx`
  // key so we can match against the persisted checklistItems map.
  const tailored = getTailoredChecklist(profile?.branch || 'Army', {
    component:     profile?.component || 'Active Duty',
    ordersType:    profile?.ordersType || '',
    hasDependents: !!profile?.hasDependents,
    hasChildren:   !!profile?.hasChildren,
    hasPets:       !!profile?.hasPets,
    moveType:      profile?.moveType || 'HHG',
    isOverseas:    !!profile?.isOverseas,
  });

  const pickItems = (phase, limit) => {
    const list = tailored[phase] || [];
    const open = [];
    for (let i = 0; i < list.length; i += 1) {
      const key = `${phase}-${i}`;
      if (!(checklistItems || {})[key]) {
        open.push({ phase, idx: i, label: list[i] });
        if (open.length >= limit) break;
      }
    }
    return open;
  };

  const currentPhase = resolveCurrentPhase(daysUntil);
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const nextPhase = currentIdx >= 0 && currentIdx < PHASE_ORDER.length - 1 ? PHASE_ORDER[currentIdx + 1] : null;
  const futurePhases = currentIdx >= 0 ? PHASE_ORDER.slice(currentIdx + 2) : [];
  const futureItems = futurePhases.flatMap(p => pickItems(p, 3)).slice(0, 6);

  const lanes = [
    { id: 'today',  title: 'Today',             accent: '#C62828', phaseLabel: currentPhase, items: pickItems(currentPhase, 4) },
    { id: 'week',   title: 'This Week',         accent: '#E65100', phaseLabel: nextPhase || '—', items: nextPhase ? pickItems(nextPhase, 4) : [] },
    { id: 'before', title: 'Before You Report', accent: theme.primary, phaseLabel: null, items: futureItems },
  ];
  const total = lanes.reduce((s, l) => s + l.items.length, 0);
  if (total === 0) return null;

  // RNLTD context line. Helps the user calibrate "today" against the
  // actual report date without scrolling back up to TMinusDashboard.
  const reportContext = daysUntil >= 0
    ? `T-${daysUntil} · ${currentPhase || 'Pre-orders'} phase`
    : `T+${Math.abs(daysUntil)} · ${currentPhase || 'In-Processing'} phase`;

  return (
    <div role="region" aria-label="Mission lanes" aria-live="polite" style={{ background: UI_PALETTE.surface, border: `1px solid ${UI_PALETTE.line}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>MISSION LANES</div>
        <button onClick={onJumpToOps} style={{ fontSize: 10, fontWeight: 800, color: theme.primary, background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Full checklist →
        </button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: UI_PALETTE.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>{reportContext}</div>
      {lanes.map(lane => (
        <section key={lane.id} aria-label={lane.title} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: lane.accent }} />
            <div style={{ fontSize: 10, fontWeight: 950, color: lane.accent, letterSpacing: '.10em', textTransform: 'uppercase' }}>{lane.title}</div>
            {lane.phaseLabel && (
              <div style={{ fontSize: 9, fontWeight: 700, color: UI_PALETTE.muted, letterSpacing: '.06em' }}>· {lane.phaseLabel}</div>
            )}
            <div style={{ fontSize: 10, fontWeight: 700, color: UI_PALETTE.muted, marginLeft: 'auto' }}>{lane.items.length}</div>
          </div>
          {lane.items.length === 0 ? (
            <div style={{ fontSize: 11, color: UI_PALETTE.muted, padding: '4px 0 6px', fontStyle: 'italic' }}>
              {lane.id === 'today' ? 'Nothing open for the current phase. Crush.' : lane.id === 'week' ? 'No open items in the next phase yet.' : 'Nothing flagged further out.'}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
              {lane.items.map(item => (
                <li key={`${item.phase}-${item.idx}`}>
                  <button
                    onClick={onJumpToOps}
                    style={{ width: '100%', textAlign: 'left', background: UI_PALETTE.surfaceSoft || '#F6F1E4', border: `1px solid ${UI_PALETTE.line}`, borderLeft: `3px solid ${lane.accent}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}
                    aria-label={`Open PCS Operations for: ${item.label}`}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: UI_PALETTE.text, lineHeight: 1.45, flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: lane.accent, whiteSpace: 'nowrap', marginTop: 2, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                      {item.phase}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

const BRANCH_TERMS = {
  Army:           { servicemember: 'Soldier',       installation: 'Post',          installationLong: 'Installation', commander: 'Commander',          personnel: 'S1',  finance: 'Finance Office',     hr: 'IPPS-A',         orders: 'PCS Orders',     leave: 'DA Form 31 (Leave)',  evaluation: 'NCOER / OER',       record: 'Soldier Record Brief (SRB)' },
  Navy:           { servicemember: 'Sailor',        installation: 'Station',       installationLong: 'Naval Station / NAS', commander: 'Commanding Officer', personnel: 'PSD', finance: 'Disbursing',         hr: 'NSIPS / MyNavy', orders: 'NAVPERS Orders', leave: 'Special / PCS Leave', evaluation: 'EVAL / FITREP',      record: 'Electronic Service Record (ESR)' },
  'Marine Corps': { servicemember: 'Marine',        installation: 'Base / Station',installationLong: 'MCB / MCAS',          commander: 'Commanding Officer', personnel: 'IPAC',finance: 'Disbursing',         hr: 'MOL',            orders: 'CMC Orders',     leave: 'NAVMC Leave',         evaluation: 'Fitness Report',     record: 'Service Record Book (SRB)' },
  'Air Force':    { servicemember: 'Airman',        installation: 'Base',          installationLong: 'Air Force Base',      commander: 'Commander',          personnel: 'MPF', finance: 'Finance / FSO',      hr: 'myPers',         orders: 'AF Orders',      leave: 'AF Form 988 (Leave)', evaluation: 'EPR / OPR',          record: 'AFPC vMPF' },
  'Space Force':  { servicemember: 'Guardian',      installation: 'Base',          installationLong: 'Space Force Base',    commander: 'Commander',          personnel: 'MPF', finance: 'Finance / FSO',      hr: 'myPers',         orders: 'SF Orders',      leave: 'AF Form 988 (Leave)', evaluation: 'Guardian Eval',      record: 'Guardian Personnel Record' },
  'Coast Guard':  { servicemember: 'Coast Guardsman', installation: 'Base / Station', installationLong: 'CG Base / Sector / Station', commander: 'Commanding Officer', personnel: 'SPO', finance: 'Servicing Personnel Office', hr: 'Direct Access', orders: 'CG-3103 Orders', leave: 'CG-3307 Leave',       evaluation: 'Employee Review',    record: 'Personnel Data Record (PDR)' },
};
function getBranchTerm(branch, key) {
  return BRANCH_TERMS[branch]?.[key] || BRANCH_TERMS.Army[key] || key;
}

// Component-specific context per redesign brief. Active Duty is the
// default; Guard members deal with Title 10 vs Title 32 activations and
// State benefits; Reserve members PCS less but have drill and AT
// considerations. The checklist UI shows additional bullets pulled from
// this map when component != 'Active Duty'.
const COMPONENT_NOTES = {
  'Active Duty': null,
  'Reserve':     { headline: 'For Reservists',
                   bullets: [
                     'Check what your orders say — Title 10 (mobilization) is different from drill or annual training. Confirm with your losing unit which one this is.',
                     'Watch your pay carefully during the switch from drill to active. Gaps are common.',
                     'Talk to your Reserve unit admin about your IRR transfer code — it needs to be right.',
                     'If you use TRICARE Reserve Select, start the enrollment switch early — your dependents need uninterrupted coverage.',
                   ] },
  'National Guard': { headline: 'For Guard members',
                      bullets: [
                        'Look at your orders. They say either "Title 10" (federal) or "Title 32" (state, paid by feds). Your gaining unit has to be able to take you under that type — confirm before you go.',
                        'Tell your State HQ (J1 office) before you leave if you need to update state benefits like in-state tuition or military plates.',
                        'Check if you stay on the State roster or fully transfer to federal service during your orders.',
                        'Sign up for TRICARE Reserve Select or Prime within 60 days of activation. Don\'t let your dependents lose coverage.',
                        'If your orders move you to a different state for 6+ months, update your driver\'s license, tax residency, and voter registration.',
                      ] },
  'AGR':            { headline: 'For AGR members',
                      bullets: [
                        'AGR tours follow regular Title 10 PCS rules. Confirm your AGR status and pay band stay active through the move.',
                        'Both your losing and gaining units need to update any BSO or PEC codes that change.',
                      ] },
  'Dependent':      null,
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
  if (!paygrade || paygrade === 'N/A') return '';
  // DoD Civilian grades and SES/WG variants are displayed as-is.
  if (/^GS-/.test(paygrade) || paygrade === 'SES' || paygrade === 'WG' || paygrade === 'WS' || paygrade === 'WL') {
    return paygrade;
  }
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
  { name: 'Camp Henry',                              state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Camp Carroll',                            state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Pier 8 Busan',                            state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Camp Casey',                              state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Camp Hovey',                              state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'Sagami Depot',                            state: 'JPN', branch: 'Army', country: 'Japan' },
  { name: 'Yokohama North Dock',                     state: 'JPN', branch: 'Army', country: 'Japan' },
  { name: 'Camp Red Cloud',                          state: 'KOR', branch: 'Army', country: 'South Korea' },
  { name: 'USAG Japan (Camp Zama)',                  state: 'JPN', branch: 'Army', country: 'Japan' },
  { name: 'Torii Station (USAG Okinawa)',            state: 'JPN', branch: 'Army', country: 'Japan' },
  { name: 'USAG Stuttgart',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Wiesbaden',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Bavaria (Grafenwöhr)',               state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Grafenwöhr Training Area',                state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Rose Barracks Vilseck',                   state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Hohenfels Training Area',                 state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Garmisch Resort',                         state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Ansbach',                            state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Rheinland-Pfalz (Kaiserslautern)',   state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Kaiserslautern Military Community',       state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Landstuhl Regional Medical Center',       state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Sembach Kaserne',                         state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Pulaski Barracks',                        state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Panzer Kaserne',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'Vogelweh Military Complex',               state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Baumholder',                         state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Hohenfels',                          state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Garmisch',                           state: 'GER', branch: 'Army', country: 'Germany' },
  { name: 'USAG Belgium (SHAPE)',                    state: 'BEL', branch: 'Army', country: 'Belgium' },
  { name: 'Chievres Air Base',                       state: 'BEL', branch: 'Army', country: 'Belgium' },
  { name: 'Daumerie Caserne',                        state: 'BEL', branch: 'Army', country: 'Belgium' },
  { name: 'USAG BENELUX-Brussels',                   state: 'BEL', branch: 'Army', country: 'Belgium' },
  { name: 'USAG BENELUX Brunssum',                   state: 'NLD', branch: 'Army', country: 'Netherlands' },
  { name: 'USAG Italy (Vicenza)',                    state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'Caserma Ederle',                          state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'Caserma Del Din',                         state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'USAG Italy (Livorno)',                    state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'Camp Darby',                              state: 'ITA', branch: 'Army', country: 'Italy' },
  { name: 'USAG Poland',                             state: 'POL', branch: 'Army', country: 'Poland' },
  { name: 'Camp Kosciuszko Poznan',                  state: 'POL', branch: 'Army', country: 'Poland' },
  { name: 'Powidz Air Base',                         state: 'POL', branch: 'Army', country: 'Poland' },
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

  // ── ARMY RESERVE · MAJOR INSTALLATIONS ──────────────────────────────────
  // Largest USAR training and mobilization sites. Smaller Army
  // Reserve Centers (USARCs) are spread across every state and are
  // not enumerated here; users at smaller USARCs should enter the
  // nearest larger installation. Verified against army.mil/usar.
  { name: 'Fort McCoy',                              state: 'WI', branch: 'Army Reserve' },
  { name: 'Camp Atterbury',                          state: 'IN', branch: 'Army Reserve' },
  { name: 'Fort Buchanan',                           state: 'PR', branch: 'Army Reserve' },
  { name: 'Camp Parks (Parks RFTA)',                 state: 'CA', branch: 'Army Reserve' },
  { name: 'Devens Reserve Forces Training Area',     state: 'MA', branch: 'Army Reserve' },
  { name: '88th Readiness Division HQ Fort McCoy',   state: 'WI', branch: 'Army Reserve' },
  { name: '99th Readiness Division HQ Fort Dix',     state: 'NJ', branch: 'Army Reserve' },
  { name: '63rd Readiness Division HQ Mountain View', state: 'CA', branch: 'Army Reserve' },
  { name: '81st Readiness Division HQ Fort Jackson', state: 'SC', branch: 'Army Reserve' },

  // ── ARMY NATIONAL GUARD · MAJOR TRAINING CENTERS ────────────────────────
  // ARNG operates ~2,700 armories nationally. Only the larger
  // training centers and state-headquarters armories are listed
  // here. Verified against nationalguard.mil and state guard sites.
  { name: 'Camp Shelby Joint Forces Training Center', state: 'MS', branch: 'Army National Guard' },
  { name: 'Camp Williams (Utah NG)',                  state: 'UT', branch: 'Army National Guard' },
  { name: 'Camp Robinson',                            state: 'AR', branch: 'Army National Guard' },
  { name: 'Camp Mabry (Texas Military Forces HQ)',    state: 'TX', branch: 'Army National Guard' },
  { name: 'Camp Murray (Washington NG)',              state: 'WA', branch: 'Army National Guard' },
  { name: 'Camp Roberts',                             state: 'CA', branch: 'Army National Guard' },
  { name: 'Camp Ripley',                              state: 'MN', branch: 'Army National Guard' },
  { name: 'Camp Grayling Joint Maneuver Training Center', state: 'MI', branch: 'Army National Guard' },
  { name: 'Camp Dawson',                              state: 'WV', branch: 'Army National Guard' },
  { name: 'Camp Dodge',                               state: 'IA', branch: 'Army National Guard' },
  { name: 'Camp Beauregard',                          state: 'LA', branch: 'Army National Guard' },
  { name: 'Camp Edwards (Joint Base Cape Cod)',       state: 'MA', branch: 'Army National Guard' },
  { name: 'Camp Smith Training Site',                 state: 'NY', branch: 'Army National Guard' },
  { name: 'Camp Blanding Joint Training Center',      state: 'FL', branch: 'Army National Guard' },
  { name: 'Fort Indiantown Gap',                      state: 'PA', branch: 'Army National Guard' },
  { name: 'Gowen Field',                              state: 'ID', branch: 'Army National Guard' },
  { name: 'McEntire Joint National Guard Base',       state: 'SC', branch: 'Army National Guard' },
  { name: 'Volk Field Combat Readiness Training Center', state: 'WI', branch: 'Army National Guard' },

  // ── AIR FORCE RESERVE · HOST BASES ──────────────────────────────────────
  // Verified against afrc.af.mil installations directory.
  { name: 'Westover Air Reserve Base',                state: 'MA', branch: 'Air Force Reserve' },
  { name: 'March Air Reserve Base',                   state: 'CA', branch: 'Air Force Reserve' },
  { name: 'Dobbins Air Reserve Base',                 state: 'GA', branch: 'Air Force Reserve' },
  { name: 'Youngstown Air Reserve Station',           state: 'OH', branch: 'Air Force Reserve' },
  { name: 'Pittsburgh Air Reserve Station',           state: 'PA', branch: 'Air Force Reserve' },
  { name: 'Niagara Falls Air Reserve Station',        state: 'NY', branch: 'Air Force Reserve' },
  { name: 'Grissom Air Reserve Base',                 state: 'IN', branch: 'Air Force Reserve' },
  { name: 'Homestead Air Reserve Base',               state: 'FL', branch: 'Air Force Reserve' },
  { name: 'Patrick Space Force Base (AFRC tenant)',   state: 'FL', branch: 'Air Force Reserve' },

  // ── AIR NATIONAL GUARD · WING HOSTS ─────────────────────────────────────
  // Wing-host installations - ~88 ANG wings total, the larger ones
  // commonly cited as duty stations in PCS orders. Verified against
  // ang.af.mil wing list.
  { name: 'Barnes Air National Guard Base',           state: 'MA', branch: 'Air National Guard' },
  { name: 'Bradley Air National Guard Base',          state: 'CT', branch: 'Air National Guard' },
  { name: 'Burlington Air National Guard Base',       state: 'VT', branch: 'Air National Guard' },
  { name: 'Fresno Air National Guard Base',           state: 'CA', branch: 'Air National Guard' },
  { name: 'Joe Foss Field',                           state: 'SD', branch: 'Air National Guard' },
  { name: 'Otis Air National Guard Base',             state: 'MA', branch: 'Air National Guard' },
  { name: 'Selfridge Air National Guard Base',        state: 'MI', branch: 'Air National Guard' },
  { name: 'Springfield Air National Guard Base',      state: 'IL', branch: 'Air National Guard' },
  { name: 'Tulsa Air National Guard Base',            state: 'OK', branch: 'Air National Guard' },
  { name: 'Sioux City Air National Guard Base',       state: 'IA', branch: 'Air National Guard' },
  { name: 'Forbes Field Air National Guard Base',     state: 'KS', branch: 'Air National Guard' },
  { name: 'Truax Field Air National Guard Base',      state: 'WI', branch: 'Air National Guard' },
  { name: 'Hancock Field Air National Guard Base',    state: 'NY', branch: 'Air National Guard' },
  { name: 'Pease Air National Guard Base',            state: 'NH', branch: 'Air National Guard' },
  { name: 'Atlantic City Air National Guard Base',    state: 'NJ', branch: 'Air National Guard' },
  { name: 'Reno-Tahoe Air National Guard Base',       state: 'NV', branch: 'Air National Guard' },
  { name: 'Kirtland Air National Guard Base',         state: 'NM', branch: 'Air National Guard' },
  { name: 'Buckley Air National Guard Base',          state: 'CO', branch: 'Air National Guard' },
  { name: 'Klamath Falls Air National Guard Base',    state: 'OR', branch: 'Air National Guard' },
  { name: 'Portland Air National Guard Base',         state: 'OR', branch: 'Air National Guard' },
  { name: 'Camp Murray (ANG HQ)',                     state: 'WA', branch: 'Air National Guard' },
  { name: 'Sumpter Smith Air National Guard Base',    state: 'AL', branch: 'Air National Guard' },
  { name: 'Montgomery Regional Air National Guard',   state: 'AL', branch: 'Air National Guard' },
  { name: 'New Castle Air National Guard Base',       state: 'DE', branch: 'Air National Guard' },

  // ── NAVY RESERVE · MAJOR CENTERS ────────────────────────────────────────
  // Joint Reserve Bases host all branches; pure Navy Reserve sites
  // are smaller and city-located. Verified against navyreserve.navy.mil.
  { name: 'NAS Joint Reserve Base Fort Worth',        state: 'TX', branch: 'Navy Reserve' },
  { name: 'NAS Joint Reserve Base New Orleans',       state: 'LA', branch: 'Navy Reserve' },
  { name: 'NOSC Phoenix',                             state: 'AZ', branch: 'Navy Reserve' },
  { name: 'NOSC Denver',                              state: 'CO', branch: 'Navy Reserve' },
  { name: 'NOSC Jacksonville',                        state: 'FL', branch: 'Navy Reserve' },
  { name: 'NOSC Minneapolis',                         state: 'MN', branch: 'Navy Reserve' },

  // ── MARINE CORPS RESERVE · MAJOR CENTERS ────────────────────────────────
  // Verified against marines.mil/forcesreserve.
  { name: 'Marine Forces Reserve HQ New Orleans',     state: 'LA', branch: 'Marine Corps Reserve' },
  { name: 'MCRC Anacostia Annex',                     state: 'DC', branch: 'Marine Corps Reserve' },
  { name: 'MCRC Pasadena',                            state: 'CA', branch: 'Marine Corps Reserve' },
  { name: 'MCRC Twin Cities',                         state: 'MN', branch: 'Marine Corps Reserve' },

  // ── COAST GUARD RESERVE ────────────────────────────────────────────────
  // CG Reserve operates from active CG installations rather than
  // separate Reserve bases.  Reservists report to the active CG
  // facility shown in their orders; see existing USCG entries above.
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
  'Fort Novosel':'Daleville AL','Redstone Arsenal':'Huntsville AL','Maxwell AFB':'Montgomery AL',
  'Fort Huachuca':'Sierra Vista AZ','MCAS Yuma':'Yuma AZ','Yuma Proving Ground':'Yuma AZ',
  'Beale AFB':'Marysville CA','Fort Irwin':'Barstow CA','MCRD San Diego':'San Diego CA',
  'NAS Lemoore':'Lemoore CA','Naval Base Ventura County':'Port Hueneme CA',
  'Presidio of Monterey':'Monterey CA','Coast Guard Base Alameda':'Alameda CA',
  'NAS Key West':'Key West FL','Patrick SFB':'Cocoa Beach FL','Tyndall AFB':'Panama City FL',
  'USAG Miami':'Doral FL','Coast Guard Air Station Clearwater':'Clearwater FL',
  'Coast Guard Air Station Miami':'Opa-locka FL',
  'Fort Eisenhower':'Augusta GA','Robins AFB':'Warner Robins GA',
  'MCB Hawaii':'Kaneohe HI',
  'Coast Guard Air Station Barbers Point':'Kapolei HI',
  'Mountain Home AFB':'Mountain Home ID','Fort Johnson':'Leesville LA',
  'Aberdeen Proving Ground':'Aberdeen MD','Fort Detrick':'Frederick MD',
  'NAS Patuxent River':'Lexington Park MD',
  'Detroit Arsenal':'Warren MI','Columbus AFB':'Columbus MS','NAS Fallon':'Fallon NV',
  'Cannon AFB':'Clovis NM','Holloman AFB':'Alamogordo NM','Kirtland AFB':'Albuquerque NM',
  'White Sands Missile Range':'Las Cruces NM','Fort Hamilton':'Brooklyn NY',
  'West Point':'West Point NY','Grand Forks AFB':'Grand Forks ND',
  'Cavalier Space Station':'Cavalier ND',
  'Pope Army Airfield':'Fayetteville NC','Coast Guard Base Elizabeth City':'Elizabeth City NC',
  'Altus AFB':'Altus OK','Tinker AFB':'Midwest City OK',
  'Vance AFB':'Enid OK','Fort Buchanan':'San Juan PR','Naval Station Newport':'Newport RI',
  'Goodfellow AFB':'San Angelo TX','Laughlin AFB':'Del Rio TX',
  'NAS Corpus Christi':'Corpus Christi TX','NAS Kingsville':'Kingsville TX',
  'Sheppard AFB':'Wichita Falls TX','Fort Belvoir':'Fort Belvoir VA','Fort Myer':'Arlington VA',
  'Joint Base Myer-Henderson Hall':'Arlington VA','NAS Oceana':'Virginia Beach VA',
  'Coast Guard Base Portsmouth':'Portsmouth VA','NSA Washington':'Washington DC',
  'NAS Whidbey Island':'Oak Harbor WA','Coast Guard Base Seattle':'Seattle WA',
  'Fort Greely':'Delta Junction AK',
  'Coast Guard Base Kodiak':'Kodiak AK','Coast Guard Training Center Cape May':'Cape May NJ',
  'Coast Guard Sector New York':'Staten Island NY',
  'USAG Stuttgart':'Stuttgart Germany','USAG Wiesbaden':'Wiesbaden Germany',
  'USAG Bavaria':'Grafenwoehr Germany','USAG Ansbach':'Ansbach Germany',
  'USAG Italy Vicenza':'Vicenza Italy','Camp Bondsteel':'Kosovo',
  'Naval Station Rota':'Rota Spain','Spangdahlem AB':'Spangdahlem Germany',
  'Incirlik AB':'Adana Turkey','Aviano AB':'Aviano Italy','Lajes Field':'Terceira Azores Portugal',
  'RAF Lakenheath':'Brandon UK','RAF Mildenhall':'Mildenhall UK','RAF Alconbury':'Huntingdon UK',
  'Misawa AB':'Misawa Japan','MCAS Iwakuni':'Iwakuni Japan','Camp Foster':'Okinawa Japan',
  'Osan AB':'Pyeongtaek South Korea','Kunsan AB':'Gunsan South Korea',
  'Naval Station Guam':'Hagatna Guam','Andersen AFB':'Yigo Guam',
  'Al Udeid AB':'Qatar','Al Dhafra AB':'Abu Dhabi UAE',
};


function getInstallationSearchLocation(installation) {
  const base = (installation || '').split(',')[0].trim();
  if (!base) return 'military installation';
  const alias = {
    'Fort Bragg': 'Fort Liberty',
    'Fort Hood': 'Fort Cavazos',
    'Fort Gordon': 'Fort Eisenhower',
    'Fort Lee': 'Fort Gregg-Adams',
    'Fort Rucker': 'Fort Novosel',
    'Camp Lejeune': 'Marine Corps Base Camp Lejeune',
    'Marine Corps Base Quantico': 'MCB Quantico',
  }[base] || base;
  if (VET_BIZ_CITY[base]) return VET_BIZ_CITY[base];
  if (VET_BIZ_CITY[alias]) return VET_BIZ_CITY[alias];
  const mapBase = ALL_BASES.find(b => b.name === base || b.name === alias || base.includes(b.name) || b.name.includes(base));
  return mapBase ? `${mapBase.name} ${mapBase.state}` : alias;
}

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function officialSchoolSearchUrl(name, city) {
  return googleSearchUrl(`${name} ${city || ''} official school site:nces.ed.gov OR site:dodea.edu OR site:.edu`);
}

function officialCollegeCards(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { name: 'VA GI Bill Comparison Tool', desc: 'Official VA tool for comparing GI Bill-approved colleges, caution flags, benefits, and veteran indicators.', url: 'https://www.va.gov/gi-bill-comparison-tool/' },
    { name: `NCES College Navigator near ${loc}`, desc: 'Official Department of Education college search and institutional data.', url: googleSearchUrl(`${loc} colleges site:nces.ed.gov/collegenavigator`) },
    { name: 'DoD MOU Participating Institutions', desc: 'Official DoD voluntary education institution participation source.', url: 'https://www.dodmou.com/' },
    { name: `Official admissions search near ${loc}`, desc: 'Google search restricted toward official college and admissions pages for the selected gaining area.', url: googleSearchUrl(`${loc} college admissions official site:.edu`) },
  ];
}

function officialSchoolCards(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { name: `NCES K-12 school search near ${loc}`, desc: 'Official National Center for Education Statistics public/private school search.', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
    { name: 'DoDEA Find Your School', desc: 'Official DoDEA school finder for installations with DoDEA schools.', url: 'https://www.dodea.edu/find-your-school' },
    { name: 'School Liaison Program', desc: 'Official Military OneSource school liaison support for military-connected children.', url: 'https://www.militaryonesource.mil/benefits/school-liaison-program/' },
    { name: `Official school web search for ${loc}`, desc: 'Google search focused on official public school, DoDEA, district, and education agency sources.', url: googleSearchUrl(`${loc} schools military family official site:.gov OR site:dodea.edu`) },
  ];
}

function veteranBusinessBubbleLinks(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { category: 'All', label: 'SBA veteran resources', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses', desc: 'Official SBA overview for veteran-owned businesses, training, funding, and contracting.' },
    { category: 'Search', label: 'SBA business search', url: 'https://search.certifications.sba.gov/', desc: `Official SBA Small Business Search. Use ${loc}, VOSB, SDVOSB, and service keywords to find public certified-firm records.` },
    { category: 'Food', label: 'Food service firms', url: 'https://search.certifications.sba.gov/', desc: `Official SBA search path for food-service, restaurant, catering, cafe, and dining-related veteran-owned firms near ${loc}.` },
    { category: 'Home Services', label: 'Home service firms', url: 'https://search.certifications.sba.gov/', desc: `Official SBA search path for construction, repair, moving, real estate, maintenance, and home-service firms near ${loc}.` },
    { category: 'Certification', label: 'SBA VetCert', url: 'https://veterans.certify.sba.gov/', desc: 'Official SBA certification portal and small business search for certified VOSB and SDVOSB firms.' },
    { category: 'Contracting', label: 'Federal contracting', url: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/veteran-contracting-assistance-programs', desc: 'Official SBA contracting assistance guidance for veteran-owned small businesses.' },
    { category: 'Counseling', label: 'VBOC counseling', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program', desc: 'Official SBA Veterans Business Outreach Center locator for free counseling, training, and mentorship.' },
    { category: 'VA OSDBU', label: 'VA OSDBU', url: 'https://www.va.gov/osdbu/index.asp', desc: 'Official VA small and veteran business program information.' },
    { category: 'SAM.gov', label: 'SAM.gov entities', url: 'https://sam.gov/entity-information', desc: 'Official federal entity information search for businesses registered to work with the government.' },
  ];
}

function veteranBusinessDiscoveryCards(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { name: 'SBA Veteran-Owned Business Resources', category: 'All', desc: 'Official SBA support for veteran entrepreneurship, including training, funding, and federal contracting resources.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses', icon: 'SBA' },
    { name: `SBA Small Business Search for ${loc}`, category: 'Search', desc: 'Official SBA search portal for certified public small-business records. Search by location, VOSB or SDVOSB status, keywords, and NAICS terms.', url: 'https://search.certifications.sba.gov/', icon: 'SBA' },
    { name: `SAM.gov Entity Information for ${loc}`, category: 'Search', desc: 'Official SAM.gov entity search for public registration and active entity records. Use the gaining location and business keywords, then verify active status.', url: 'https://sam.gov/entity-information', icon: 'SAM' },
    { name: `Food and restaurant firms near ${loc}`, category: 'Food', desc: 'Use the official SBA Small Business Search with terms such as food service, restaurant, catering, cafe, dining, and the gaining installation area.', url: 'https://search.certifications.sba.gov/', icon: 'FOOD' },
    { name: `Food-service entity verification for ${loc}`, category: 'Food', desc: 'Use SAM.gov Entity Information to verify public entity records for food-service, catering, and dining businesses before relying on a listing.', url: 'https://sam.gov/entity-information', icon: 'SAM' },
    { name: `Home service firms near ${loc}`, category: 'Home Services', desc: 'Use the official SBA Small Business Search with terms such as construction, repair, moving, real estate, maintenance, cleaning, and the gaining installation area.', url: 'https://search.certifications.sba.gov/', icon: 'HOME' },
    { name: `Home-service entity verification for ${loc}`, category: 'Home Services', desc: 'Use SAM.gov Entity Information to verify public entity records for repair, moving, construction, and home-service businesses.', url: 'https://sam.gov/entity-information', icon: 'SAM' },
    { name: 'SBA VetCert and Small Business Search', category: 'Certification', desc: 'Official SBA portal for VetCert certification and discovery of certified veteran-owned firms.', url: 'https://veterans.certify.sba.gov/', icon: 'VOSB' },
    { name: 'SBA Veteran Contracting Assistance', category: 'Contracting', desc: 'Official SBA guidance for veteran-owned small businesses pursuing federal contract awards and set-aside opportunities.', url: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/veteran-contracting-assistance-programs', icon: 'CONTRACT' },
    { name: 'Veterans Business Outreach Centers', category: 'Counseling', desc: 'Official SBA locator for free VBOC business counseling, training, workshops, and mentorship.', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program', icon: 'VBOC' },
    { name: 'VA OSDBU Veteran Business Resources', category: 'VA OSDBU', desc: 'Official VA Office of Small and Disadvantaged Business Utilization information for procurement-ready small and veteran businesses.', url: 'https://www.va.gov/osdbu/index.asp', icon: 'VA' },
  ].filter(card => card.url);
}


const VETERAN_OWNED_BUSINESSES = {}; // Legacy static cards removed from rendering because several entries had no active source links.


const BRANCH_PCS_CHECKLISTS = {
  Army: {
    "Orders Received": [
      "Review PCS orders for accuracy — report date, gaining unit, special instructions",
      "Make certified copies of orders (keep 10+ — finance, housing, schools require them)",
      "Notify chain of command and request PCS leave (DA 31) immediately",
      "Contact gaining unit S1 to be assigned a sponsor",
      "Contact Army Community Service (ACS) sponsorship program at gaining post",
      "Notify current landlord or installation housing office of departure",
      "Begin home sale or lease termination process",
      "Request Dislocation Allowance (DLA) paperwork from finance",
      "Open Move Budget Tracker to set PCS spending plan",
      "Confirm orders are coded correctly in IPPS-A — RNLTD, gaining UIC, dependents endorsed",
      "Request Permissive TDY (PTDY) for house-hunting if eligible (DA 4187)",
      "Verify travel reimbursement entitlements (MALT, per diem) with finance",
      "Save orders PDF and supporting documents to a secure cloud folder",
    ],
    "90 Days Out": [
      "Schedule TMO (Transportation Management Office) appointment — do this first, slots fill quickly",
      "Create detailed household goods inventory with photos and video",
      "Research gaining installation housing options on-post and off-post",
      "Apply for on-post housing at gaining installation (waitlists can be 6+ months)",
      "Request home search leave if entitled under JTR",
      "Research schools for dependent children near gaining installation",
      "Update vehicle registrations and insurance for new state",
      "Arrange POV (privately owned vehicle) shipment if going OCONUS",
      "Begin passport and visa process for family if going OCONUS",
      "Research TRICARE network at new duty station via tricare.mil",
      "Update SRB (Soldier Record Brief) at current unit",
      "Enroll any qualifying dependents in EFMP and request gaining-MTF screening if EFMP-enrolled",
      "Submit DPS (Defense Personal Property System) self-counseling session — keep printable receipts",
      "Decide PPM (Personally Procured Move) vs HHG; if PPM, request weight tickets brief from TMO",
      "Run BAH Calculator for gaining ZIP to forecast monthly housing budget",
      "Identify on-post / off-post childcare options (CYSS / MCCYN) and join waitlists",
      "Request a copy of your latest LES and screen for stop-loss / SRP holds",
    ],
    "60 Days Out": [
      "Schedule all medical, dental, and vision appointments for family",
      "Obtain sealed medical and dental records for all family members",
      "Update SGLI beneficiary designations and check coverage amounts",
      "Obtain school records for dependent children (sealed for transfer)",
      "Notify all financial institutions of upcoming address change",
      "Begin decluttering — sell, donate, or dispose of excess household goods",
      "Research employment opportunities at gaining installation (Army Career Program)",
      "Connect with gaining unit Family Readiness Group (FRG) online",
      "Update drivers licenses and military ID cards before move",
      "Arrange pet transport — obtain health certificates from vet (required 10 days before travel)",
      "Complete IPPS-A records update at current S1",
      "Spouse: enroll in SECO and MyCAA if eligible; verify state license reciprocity at gaining state",
      "Spouse (OCONUS): enroll in SECO and MyCAA if eligible; research host-nation professional credential recognition (some U.S. licenses are honored on-base via DoD agreements but not in the local economy — verify with SECO before pursuing local employment)",
      "Schedule final dental Class 1/2 exam to clear deployable status",
      "Request copy of OMPF / iPERMS for personal records",
      "Update Wills, POAs, and Advance Medical Directives at base Legal Assistance Office",
      "Notify children's pediatrician of move — request prescriptions in 90-day supply",
      "If OCONUS: request no-fee tourist passport(s) and family member visa screening (Form DD 1056)",
      "If OCONUS: complete Family Member Travel Screening and EFMP overseas screening",
      "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes — combat zone deployments and overseas PCS do not automatically change residency. Active-duty pay earned in a Combat Zone Tax Exclusion (CZTE) area is excluded from federal income tax under IRC §112; OCONUS civilians earning foreign-source wages may qualify for the IRS Form 2555 Foreign Earned Income Exclusion (FEIE) — verify with the gaining installation Tax Center / VITA volunteer before filing.",
    ],
    "30 Days Out": [
      "Confirm pack-out dates and weight estimates with moving company via DPS",
      "Arrange TLE (Temporary Lodging Expense) lodging at new duty station",
      "Update DEERS with upcoming address change",
      "Set up USPS mail forwarding at usps.com",
      "Cancel or transfer local subscriptions, utilities, gym memberships",
      "Settle all outstanding local debts and accounts",
      "Service vehicles for long-distance travel (oil, tires, fluids)",
      "Pack a personal travel bag for first 2 weeks — do not ship these items",
      "Confirm per diem entitlements and TLE lodging reservations",
      "Complete out-processing checklist at ACS, Transportation, Finance, Medical, Housing",
      "Return all installation recreational equipment and library items",
      "Prepare professional gear (uniforms, boots) for hand-carry — items above ProGear weight",
      "Print 2 paper copies of orders for each adult traveler",
      "Withdraw enough cash for travel days — fuel stations and tolls may not all accept card",
      "If shipping POV: complete pre-shipment cleaning, fluid checks, and remove all personal items",
      "Verify all family member IDs are not expiring within 90 days of report date",
      "Confirm school enrollment paperwork is ready at gaining district",
    ],
    "Move Week": [
      "Be present for the entire household goods pack-out — do not leave",
      "Verify all items and condition on DPS inventory sheet — note exceptions immediately in writing",
      "Photograph all rooms before and after pack-out for damage documentation",
      "Do final walkthrough of residence and note pre-existing damage",
      "Return all installation property: keys, decals, TA-50, sensitive items",
      "Pick up all cleared documents from unit (medical, finance, HR, S1)",
      "Verify all pets have current vaccination records and health certificates",
      "Activate TRICARE transfer at tricare.mil before departure",
      "File USPS, bank, IRS, and Social Security change of address",
      "OCONUS: forward U.S. mail through APO/FPO/DPO — USPS standard change-of-address does not accept overseas addresses. Use MPS instructions at usps.com/ship/apo-fpo-dpo and notify banks, IRS, and SSA with the APO/FPO/DPO line as your mailing address (state remains AE/AP/AA).",
      "Check weather and plan alternate routes for travel day",
      "Verify high-value inventory sheet is signed for items >$100/lb",
      "Hand-carry: orders, medical/dental records, school records, birth certificates, passports, wills",
      "Confirm pet airline carrier reservations and temperature embargo dates",
      "Final pay screening at finance — confirm DLA, MALT, per diem are in the queue",
      "Take dated meter-read photos of utilities at departure",
    ],
    "In-Processing": [
      "Report to gaining unit by official report date on orders",
      "Complete installation in-processing at gaining unit S1",
      "Obtain new base access credentials (CAC) and vehicle decal",
      "Update banking and direct deposit information at finance",
      "OCONUS: confirm direct-deposit bank accepts APO/FPO/DPO mailing address (some U.S. banks freeze accounts when the address moves overseas). For SOFA countries, ask finance about on-base credit unions (Navy Federal, Service Credit Union, Andrews Federal, Community Bank) and whether you need a host-nation account for utility / landlord payments.",
      "Enroll children in local schools with transferred records",
      "Transfer vehicle registrations to new state (30-day window typical)",
      "Set up utilities at new residence",
      "Schedule and be present for household goods delivery",
      "Inspect all HHG for damage — file DPS claims within 9 months",
      "Update DEERS with new address",
      "Register with MTF (Military Treatment Facility) at gaining installation",
      "Enroll family in TRICARE at gaining installation's MTF",
      "OCONUS: enroll in TRICARE Overseas Program (TOP) Prime or TOP Select at tricare-overseas.com — TRICARE Prime CONUS does not transfer overseas. International SOS coordinates host-nation care.",
      "Update emergency data records (DD 93) at gaining S1",
      "Update SRB with gaining unit and new duty station information",
      "Brief gaining chain of command within 24 hours of report date",
      "Submit travel voucher (DD 1351-2) within 5 working days of arrival",
      "OCONUS travel voucher: include all foreign-currency receipts with the converted USD amount and the conversion rate used (DTS auto-applies the published rate). Request an LQA / OHA advance through the gaining housing or HR office before pack-out and confirm finance's exchange-rate adjustment policy so you are not out-of-pocket if the rate moves between expense and reimbursement.",
      "Take orders to gaining housing office to start BAH at gaining location",
      "Schedule SHARP, SERE, and OPSEC refreshers within in-processing window",
      "Schedule mandatory installation Welcome Briefing / Newcomers' Brief",
      "Enroll dependents in DEERS-linked MTF and book pediatric / OB-GYN intake",
      "Coordinate spouse's employment paperwork — DOD Spouse Hiring, MyCAA grants",
      "OCONUS spouse employment: on-base jobs are governed by DoD Family Member Preference (FMP) and Priority Placement Program (PPP-S). Off-base employment in the host nation usually requires a host-nation work permit and (in many SOFA countries) explicit visa sponsorship — verify with the gaining SECO office before accepting an offer.",
      "Re-enroll children in CYSS / SKIES Unlimited if applicable",
    ],
  },
  Navy: {
    "Orders Received": [
      "Log into MyNavy HR portal and verify NAVPERS orders for accuracy",
      "Contact gaining command sponsor program — request sponsor assignment",
      "Notify current command immediately upon receipt of orders",
      "Notify current landlord or installation housing office",
      "Begin home sale or lease termination process",
      "Request Dislocation Allowance (DLA) via pay office",
      "Open Move Budget Tracker to set PCS spending plan",
      "Download PCS orders from BOL (Bureau of Naval Personnel) if needed",
      "Verify orders are coded correctly in NSIPS — RNLTD, gaining UIC, dependents authorized",
      "Request Permissive TDY (PTDY) for house-hunting via OPNAVINST entitlement if eligible",
      "Save orders PDF and dependent travel authorization to a secure cloud folder",
      "Confirm travel reimbursement entitlements (MALT, per diem, DITY incentive) with PSD",
      "Make 10+ certified copies of orders — required by housing, schools, finance",
    ],
    "90 Days Out": [
      "Submit DPS self-service booking via MyNavy Portal for HHG",
      "Contact NAVPTO (Navy Personal Transportation Office) for transportation assistance",
      "Create detailed household goods inventory with photos and video",
      "Research gaining installation housing options on base and off",
      "Apply for on-base housing at gaining installation (waitlists vary widely)",
      "Request home search leave if entitled under JTR",
      "Research schools for dependent children",
      "Arrange POV shipment if going OCONUS",
      "Begin passport and visa process for family if going OCONUS",
      "Research TRICARE network at new duty station",
      "Enroll qualifying dependents in EFMP and request gaining-MTF screening",
      "Decide PPM (Personally Procured Move) vs HHG; if PPM, request weight tickets brief from NAVPTO",
      "Run BAH Calculator for gaining ZIP to forecast monthly housing budget",
      "Identify on-base / off-base childcare options (CYP / Navy CDC) and join waitlists",
      "Verify medical/dental status is suitable for sea duty if reporting to a ship",
      "Confirm physical fitness assessment (PFA) record is current at gaining command",
      "Update NSIPS Electronic Service Record (ESR) data with current dependents and contact info",
    ],
    "60 Days Out": [
      "Schedule all medical, dental, and vision appointments for family",
      "Obtain sealed medical and dental records for all family members",
      "Update SGLI beneficiary designations",
      "Obtain school records for dependent children",
      "Notify all financial institutions of upcoming address change",
      "Begin decluttering household goods",
      "Update NAVPERS 1070/605 (Admin Page 2) at current command",
      "Review BAH/OHA authorization in advance with pay office",
      "Connect with gaining command Ombudsman or Family Support Group",
      "Arrange pet transport if needed",
      "Spouse: enroll in SECO / MyCAA; verify license reciprocity at gaining state",
      "Spouse (OCONUS): enroll in SECO / MyCAA; research host-nation professional credential recognition — some U.S. licenses are honored on-base via DoD agreements but not in the local economy. Verify with SECO before pursuing local employment.",
      "Schedule final dental Class 1/2 exam to clear deployable status",
      "Request a complete OMPF / Electronic Service Record print for personal records",
      "Update Wills, POAs, and Advance Medical Directives at Legal Assistance",
      "Notify children's pediatrician of move — request prescriptions in 90-day supply",
      "If OCONUS: request no-fee tourist passport(s) and submit DD 1056 for family",
      "If OCONUS: complete Overseas Screening (OPNAV 1300/16) for sponsor and family",
      "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes — combat zone deployments and overseas PCS do not automatically change residency. CZTE-area active pay is excluded from federal income tax under IRC §112; OCONUS civilians earning foreign-source wages may qualify for IRS Form 2555 Foreign Earned Income Exclusion. Verify with the gaining installation Tax Center / VITA volunteer before filing.",
      "Coordinate underway / detachment release if currently in workups or deployed",
    ],
    "30 Days Out": [
      "Confirm HHG pack-out dates with moving company",
      "Arrange TLE lodging at new duty station",
      "Update DEERS with upcoming address change",
      "Set up USPS mail forwarding",
      "Cancel or transfer local subscriptions and utilities",
      "Settle outstanding local debts",
      "Service vehicles for long-distance travel",
      "Pack personal travel bag for first 2 weeks — do not ship",
      "Contact PSC (Personnel Support Center) for final pay entitlements verification",
      "Complete Navy out-processing checklist at current command",
      "Prepare professional gear (uniforms, sea bag) for hand-carry — exceeds ProGear weight",
      "Print 2 paper copies of orders for each adult traveler",
      "If shipping POV: complete pre-shipment cleaning, fluid checks, remove personal items",
      "Verify all family member IDs are not expiring within 90 days of report date",
      "Confirm school enrollment paperwork is ready at gaining district",
      "Withdraw enough cash for travel days — fuel stations and tolls may not all accept card",
    ],
    "Move Week": [
      "Be present for entire household goods pack-out",
      "Verify all items on DPS inventory — note exceptions in writing immediately",
      "Photograph all rooms before and after pack-out",
      "Return all command and installation property",
      "Submit final departure report — sign out via NSIPS",
      "Pick up all cleared documents from command",
      "Verify all pets have current vaccination records",
      "Activate TRICARE transfer at tricare.mil",
      "File change of address with USPS, banks, IRS",
      "OCONUS: forward U.S. mail through APO/FPO/DPO — USPS standard change-of-address does not accept overseas addresses. Use MPS instructions at usps.com/ship/apo-fpo-dpo and provide the APO/FPO/DPO box assigned by your gaining base post office. Notify banks, IRS, and creditors with the APO/FPO/DPO line as your mailing address (state stays AE/AP/AA).",
      "Check weather and alternate routes for travel day",
      "Verify high-value inventory sheet is signed for items >$100/lb",
      "Hand-carry: orders, medical/dental records, school records, birth certificates, passports, wills",
      "Confirm pet airline carrier reservations and temperature embargo dates",
      "Final pay screening at PSD — confirm DLA, MALT, per diem are in queue",
      "Take dated meter-read photos of utilities at departure",
    ],
    "In-Processing": [
      "Report to gaining command by official report date",
      "Sign in via PRIMS at gaining command (Personnel Records Information Management System)",
      "Obtain new base access credentials and vehicle decal",
      "Update banking and direct deposit at finance",
      "OCONUS: confirm direct-deposit bank accepts APO/FPO/DPO mailing address (some U.S. banks freeze accounts when the address moves overseas). For SOFA countries (Korea, Japan, Germany, Italy), ask finance about authorized on-base credit unions (Navy Federal, Service Credit Union, Andrews Federal, Community Bank) and whether you need a host-nation account for utility / landlord payments.",
      "Enroll children in local schools",
      "Transfer vehicle registrations to new state",
      "Set up utilities at new residence",
      "Schedule household goods delivery",
      "Inspect HHG for damage — file DPS claims within 9 months",
      "Update DEERS with new address",
      "Register with MTF at gaining installation — enroll in TRICARE",
      "OCONUS: enroll in TRICARE Overseas Program (TOP) Prime or TOP Select at tricare-overseas.com — TRICARE Prime CONUS does not transfer overseas. International SOS coordinates host-nation care.",
      "Complete Medical and Legal in-processing requirements at gaining command",
      "Update Page 2 (NAVPERS 1070/602) at gaining Personnel Office",
      "Brief gaining chain of command within 24 hours of report date",
      "Submit travel voucher (DD 1351-2) within 5 working days of arrival",
      "OCONUS travel voucher: include all foreign-currency receipts with the converted USD amount and the conversion rate used (DTS auto-applies the published rate). Request an LQA / OHA advance through the gaining housing or HR office before pack-out and confirm finance's exchange-rate adjustment policy so you are not out-of-pocket if the rate moves between expense and reimbursement.",
      "Take orders to gaining housing office to start BAH at gaining location",
      "Schedule SAPR, SERE, OPSEC, and Cyber Awareness refreshers within in-processing window",
      "Attend mandatory Newcomers' Brief and INDOC at gaining installation",
      "Enroll dependents in DEERS-linked MTF and book pediatric / OB-GYN intake",
      "Coordinate spouse's employment paperwork — DOD Spouse Hiring, MyCAA",
      "OCONUS spouse employment: on-base jobs are governed by DoD Family Member Preference (FMP) and Priority Placement Program (PPP-S). Off-base employment in the host nation usually requires a host-nation work permit and (in many SOFA countries) explicit visa sponsorship — verify with the gaining SECO office before accepting an offer; some host-nation employment can complicate SOFA status.",
      "Update sea/shore rotation data in NSIPS at gaining PSD",
      "If reporting to a ship: complete shipboard indoctrination and security clearance reconfirmation",
      "Re-enroll children in CYP / SKIES Unlimited equivalent if applicable",
    ],
  },
  "Marine Corps": {
    "Orders Received": [
      "Log into MOL (Marine Online) and verify MMIA (Manpower Management Information Activity) assignment",
      "Contact gaining unit IPAC (Installation Personnel Administration Center)",
      "Request command sponsor from gaining unit",
      "Notify current command immediately upon receipt of orders",
      "Notify current landlord or installation housing office",
      "Begin home sale or lease termination process",
      "Request DLA (Dislocation Allowance) paperwork from finance",
      "Open Move Budget Tracker to set PCS spending plan",
      "Make 10+ certified copies of orders for IPAC, housing, schools, finance",
      "Verify RNLTD, gaining UIC, and dependents authorized in MOL — request correction Page 11 if needed",
      "Request Permissive TDY (PTDY) for house-hunting via NAVMC 11060 if eligible",
      "Save orders PDF and dependent travel orders to secure cloud folder",
      "Confirm travel reimbursement entitlements (MALT, per diem, PPM incentive) with Disbursing",
    ],
    "90 Days Out": [
      "Schedule TMO via base transportation office — book early",
      "Create detailed household goods inventory with photos and video",
      "Request SNCOIC or administrative briefing at IPAC",
      "Research gaining installation housing (Corporals Course waitlist advice varies by station)",
      "Apply for on-base housing at gaining installation",
      "Request home search leave if entitled",
      "Research schools for dependent children",
      "Arrange POV shipment if going OCONUS",
      "Begin passport and visa process for family if going OCONUS",
      "Research TRICARE at new duty station",
      "Enroll qualifying dependents in EFMP and request gaining-MTF screening",
      "Decide PPM vs HHG; if PPM, attend the mandatory weight-tickets brief at TMO",
      "Run BAH Calculator for gaining ZIP to forecast monthly housing budget",
      "Identify on-base CDC and waitlists at gaining station (Marine CYTP)",
      "Update OMPF / SRB data at IPAC — dependents, contact info, awards",
      "Coordinate workup / deployment release if attached to a FMF unit",
      "Verify physical fitness data (PFT/CFT) is current",
    ],
    "60 Days Out": [
      "Schedule all medical, dental, and vision appointments",
      "Obtain sealed medical and dental records for all family members",
      "Update SGLI beneficiary designations",
      "Obtain school records for dependent children",
      "Update Service Record Book (SRB) and verify OMPF is current",
      "Notify financial institutions of upcoming address change",
      "Begin decluttering household goods",
      "Connect with gaining unit Key Volunteer Network (KVN)",
      "Arrange pet transport if needed",
      "Research MCCS employment resources at gaining station",
      "Spouse: enroll in SECO / MyCAA; verify license reciprocity at gaining state",
      "Spouse (OCONUS): enroll in SECO / MyCAA; research host-nation professional credential recognition — some U.S. licenses are honored on-base via DoD agreements but not in the local economy. Verify with SECO before pursuing local employment.",
      "Schedule final dental Class 1/2 exam to clear deployable status",
      "Update Wills, POAs, Advance Medical Directives at Legal Assistance",
      "Notify children's pediatrician of move — request 90-day prescription supply",
      "Request Pre-departure Family Brief at MCCS Marine & Family Programs",
      "If OCONUS: submit no-fee passport applications and DD 1056 endorsements",
      "If OCONUS: complete Family Travel Screening (OCONUS Suitability)",
      "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes. CZTE-area active pay is excluded from federal income tax under IRC §112; OCONUS civilians earning foreign-source wages may qualify for IRS Form 2555 Foreign Earned Income Exclusion. Verify with the gaining installation Tax Center / VITA volunteer before filing.",
      "Run final pay screening at Disbursing to confirm pay continuity",
    ],
    "30 Days Out": [
      "Confirm HHG pack-out dates and weight with moving company",
      "Arrange TLE lodging at new duty station",
      "Update DEERS with upcoming address change",
      "Set up USPS mail forwarding",
      "Cancel or transfer local subscriptions and utilities",
      "Complete out-processing via MOL Out-Processing checklist",
      "Service vehicles for long-distance travel",
      "Pack personal travel bag for first 2 weeks — do not ship",
      "Verify DLA and travel entitlements with finance",
      "Prepare professional gear (uniforms, deuce gear) for hand-carry — over ProGear weight",
      "Print 2 paper copies of orders for each adult traveler",
      "If shipping POV: pre-shipment cleaning, fluid checks, remove personal items",
      "Verify all family member IDs are not expiring within 90 days of report date",
      "Withdraw enough cash for travel days — fuel and tolls may not accept card",
      "Confirm school enrollment paperwork ready at gaining district",
      "Settle outstanding base loans, Marine Corps Exchange / NEX charge accounts",
    ],
    "Move Week": [
      "Be present for entire household goods pack-out",
      "Verify all items on DPS inventory — note exceptions in writing immediately",
      "Photograph all rooms before and after pack-out",
      "Return all Marine Corps equipment via Supply warehouse",
      "Return base property: keys, decals, range cards, sensitive items",
      "Pick up all cleared documents from unit",
      "Verify all pets have current vaccination records",
      "Activate TRICARE transfer at tricare.mil",
      "File change of address with USPS, banks, IRS",
      "OCONUS: forward U.S. mail through APO/FPO/DPO — USPS standard change-of-address does not accept overseas addresses. Use MPS instructions at usps.com/ship/apo-fpo-dpo and provide the APO/FPO/DPO box assigned by your gaining base post office. Notify banks, IRS, and creditors with the APO/FPO/DPO line as your mailing address (state stays AE/AP/AA).",
      "Check weather and alternate routes for travel day",
      "Verify high-value inventory sheet is signed for items >$100/lb",
      "Hand-carry: orders, medical/dental records, school records, birth certificates, passports, wills",
      "Confirm pet airline carrier reservations and temperature embargo dates",
      "Final Disbursing screening — confirm DLA, MALT, per diem are in queue",
      "Take dated meter-read photos of utilities at departure",
    ],
    "In-Processing": [
      "Report to IPAC at gaining installation for PCS in-processing",
      "Report to gaining unit within 24 hours of arrival",
      "Obtain new base access credentials (CAC) and vehicle decal",
      "Update banking and direct deposit at finance",
      "OCONUS: confirm direct-deposit bank accepts APO/FPO/DPO mailing address (some U.S. banks freeze accounts when the address moves overseas). For SOFA countries (Korea, Japan, Germany, Italy), ask finance about authorized on-base credit unions (Navy Federal, Service Credit Union, Andrews Federal, Community Bank) and whether you need a host-nation account for utility / landlord payments.",
      "Enroll children in DoDEA or local schools",
      "Transfer vehicle registrations to new state",
      "Set up utilities at new residence",
      "Schedule household goods delivery",
      "Inspect HHG for damage — file DPS claims within 9 months",
      "Update DEERS with new address",
      "Register with MTF at gaining installation — enroll in TRICARE",
      "OCONUS: enroll in TRICARE Overseas Program (TOP) Prime or TOP Select at tricare-overseas.com — TRICARE Prime CONUS does not transfer overseas. International SOS coordinates host-nation care.",
      "Update Page 2 (NAVMC 118(3)) at IPAC",
      "Check in with MCCS for family support services",
      "Brief gaining chain of command",
      "Submit travel voucher (DD 1351-2) within 5 working days of arrival",
      "OCONUS travel voucher: include all foreign-currency receipts with the converted USD amount and the conversion rate used (DTS auto-applies the published rate). Request an LQA / OHA advance through the gaining housing or HR office before pack-out and confirm finance's exchange-rate adjustment policy so you are not out-of-pocket if the rate moves between expense and reimbursement.",
      "Take orders to gaining housing office to start BAH at gaining location",
      "Schedule SAPR, SERE, OPSEC, and Cyber Awareness refreshers within in-processing window",
      "Attend mandatory Newcomers' Brief at gaining installation",
      "Enroll dependents in DEERS-linked MTF and book pediatric / OB-GYN intake",
      "Coordinate spouse's employment paperwork — DOD Spouse Hiring, MyCAA",
      "OCONUS spouse employment: on-base jobs are governed by DoD Family Member Preference (FMP) and Priority Placement Program (PPP-S). Off-base employment in the host nation usually requires a host-nation work permit and (in many SOFA countries) explicit visa sponsorship — verify with the gaining SECO office before accepting an offer; some host-nation employment can complicate SOFA status.",
      "Re-enroll children in CDC / school-age care at gaining station",
      "Confirm new MOS / billet assignment is correctly reflected in MOL",
      "Complete weapons issue and gear draw at Issue Facility (if FMF-bound)",
    ],
  },
  "Air Force": {
    "Orders Received": [
      "Log into myPers portal (mypers.us.af.mil) and verify orders",
      "Contact gaining unit sponsor program for sponsor assignment",
      "Notify current unit and commander upon receipt of orders",
      "Notify current landlord or installation housing office",
      "Begin home sale or lease termination process",
      "Request DLA (Dislocation Allowance) via finance office",
      "Open Move Budget Tracker to set PCS spending plan",
      "Review AF Form 4380 PCS Travel Planning requirements",
      "Make 10+ certified copies of orders for MPF, housing, schools, finance",
      "Verify RNLTD, gaining UIC, and dependents authorized in myPers — request correction if needed",
      "Request Permissive TDY (PTDY) for house-hunting if eligible (AF Form 988)",
      "Save orders PDF and supporting documents to a secure cloud folder",
      "Confirm travel reimbursement entitlements (MALT, per diem, PPM incentive) with finance",
    ],
    "90 Days Out": [
      "Schedule TMO appointment via Air Force TMO portal — do this first",
      "Create detailed household goods inventory with photos and video",
      "Research gaining installation housing via Housing Referral Office",
      "Apply for on-base housing at gaining installation",
      "Request home search leave if entitled under JTR",
      "Research schools for dependent children",
      "Update vehicle registrations and insurance",
      "Arrange POV shipment if going OCONUS",
      "Begin passport and visa process for family if going OCONUS",
      "Research TRICARE network at new duty station",
      "Enroll qualifying dependents in EFMP (AF Form 1466) and request gaining-MTF screening",
      "Decide PPM vs HHG; if PPM, attend mandatory weight-tickets brief at TMO",
      "Run BAH Calculator for gaining ZIP to forecast monthly housing budget",
      "Identify on-base CDC and waitlists (AF Child Development Center)",
      "Update myFSS records — dependents, contact info, emergency data",
      "Coordinate deployment / TDY release if currently in workups or on a vulnerability list",
      "Verify physical fitness assessment (PFA) record is current",
    ],
    "60 Days Out": [
      "Schedule all medical, dental, and vision appointments",
      "Obtain sealed medical and dental records for all family members",
      "Update SGLI beneficiary designations",
      "Obtain school records for dependent children",
      "Notify financial institutions of upcoming address change",
      "Begin decluttering household goods",
      "Update records in myPers and verify assignment data is correct",
      "Connect with gaining unit Key Spouse or Airman/Guardian Family Program",
      "Arrange pet transport if needed",
      "Research AFAS (Air Force Aid Society) at gaining installation",
      "Spouse: enroll in SECO / MyCAA; verify license reciprocity at gaining state",
      "Spouse (OCONUS): enroll in SECO / MyCAA; research host-nation professional credential recognition — some U.S. licenses are honored on-base via DoD agreements but not in the local economy. Verify with SECO before pursuing local employment.",
      "Schedule final dental Class 1/2 exam to clear deployable status",
      "Update Wills, POAs, Advance Medical Directives at Legal Assistance",
      "Notify children's pediatrician of move — request 90-day prescription supply",
      "Request a complete OMPF / Personnel Records Display Application (PRDA) print",
      "If OCONUS: submit no-fee passport applications and DD 1056 family endorsements",
      "If OCONUS: complete Overseas Family Member Travel Screening (OFMTS) and EFMP overseas screening",
      "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes. CZTE-area active pay is excluded from federal income tax under IRC §112; OCONUS civilians earning foreign-source wages may qualify for IRS Form 2555 Foreign Earned Income Exclusion. Verify with the gaining installation Tax Center / VITA volunteer before filing.",
      "Run final pay screening at finance to confirm pay continuity",
    ],
    "30 Days Out": [
      "Confirm HHG pack-out dates and weight",
      "Arrange TLE lodging at new duty station via billeting",
      "Update DEERS with upcoming address change",
      "Set up USPS mail forwarding",
      "Cancel or transfer local subscriptions and utilities",
      "Schedule out-processing through Airman/Guardian & Family Readiness Center",
      "Service vehicles for long-distance travel",
      "Pack personal travel bag for first 2 weeks — do not ship",
      "Verify per diem and DLA entitlements with finance",
      "Prepare professional gear (uniforms, mobility bag) for hand-carry — exceeds ProGear weight",
      "Print 2 paper copies of orders for each adult traveler",
      "If shipping POV: pre-shipment cleaning, fluid checks, remove personal items",
      "Verify all family member IDs are not expiring within 90 days of report date",
      "Withdraw enough cash for travel days — fuel and tolls may not accept card",
      "Confirm school enrollment paperwork ready at gaining district",
      "Settle outstanding base loans, BX/AAFES charge accounts",
    ],
    "Move Week": [
      "Be present for entire household goods pack-out",
      "Verify all items on DPS inventory — note exceptions in writing immediately",
      "Photograph all rooms before and after pack-out",
      "Return all Air Force/Space Force property: keys, decals, equipment",
      "Pick up all cleared documents from unit",
      "Verify all pets have current vaccination records",
      "Activate TRICARE transfer at tricare.mil",
      "File change of address with USPS, banks, IRS",
      "OCONUS: forward U.S. mail through APO/FPO/DPO — USPS standard change-of-address does not accept overseas addresses. Use MPS instructions at usps.com/ship/apo-fpo-dpo and provide the APO/FPO/DPO box assigned by your gaining base post office. Notify banks, IRS, and creditors with the APO/FPO/DPO line as your mailing address (state stays AE/AP/AA).",
      "Check weather and alternate routes for travel day",
      "Verify high-value inventory sheet is signed for items >$100/lb",
      "Hand-carry: orders, medical/dental records, school records, birth certificates, passports, wills",
      "Confirm pet airline carrier reservations and temperature embargo dates",
      "Final finance screening — confirm DLA, MALT, per diem are in queue",
      "Take dated meter-read photos of utilities at departure",
      "Submit final out-processing checklist at MPF before signing out",
    ],
    "In-Processing": [
      "Report to gaining unit by official report date on orders",
      "Complete in-processing with MPF (Military Personnel Flight) at gaining base",
      "Obtain new base access credentials and vehicle decal",
      "Update banking and direct deposit at finance",
      "OCONUS: confirm direct-deposit bank accepts APO/FPO/DPO mailing address (some U.S. banks freeze accounts when the address moves overseas). For SOFA countries (Korea, Japan, Germany, Italy), ask finance about authorized on-base credit unions (Navy Federal, Service Credit Union, Andrews Federal, Community Bank) and whether you need a host-nation account for utility / landlord payments.",
      "Enroll children in DoDEA or local schools",
      "Transfer vehicle registrations to new state",
      "Set up utilities at new residence",
      "Schedule household goods delivery",
      "Inspect HHG for damage — file DPS claims within 9 months",
      "Update DEERS with new address",
      "Register with MTF at gaining installation — enroll in TRICARE",
      "OCONUS: enroll in TRICARE Overseas Program (TOP) Prime or TOP Select at tricare-overseas.com — TRICARE Prime CONUS does not transfer overseas. International SOS coordinates host-nation care.",
      "Update PRSD (Personnel Records) at gaining MPF",
      "Brief gaining chain of command within 24 hours of report date",
      "Check in with Airman & Family Readiness Center at gaining base",
      "Submit travel voucher (DD 1351-2) within 5 working days of arrival",
      "OCONUS travel voucher: include all foreign-currency receipts with the converted USD amount and the conversion rate used (DTS auto-applies the published rate). Request an LQA / OHA advance through the gaining housing or HR office before pack-out and confirm finance's exchange-rate adjustment policy so you are not out-of-pocket if the rate moves between expense and reimbursement.",
      "Take orders to gaining housing office to start BAH at gaining location",
      "Schedule SAPR, SERE, OPSEC, and Cyber Awareness refreshers within in-processing window",
      "Attend mandatory Newcomers' Brief / FTAC orientation at gaining installation",
      "Enroll dependents in DEERS-linked MTF and book pediatric / OB-GYN intake",
      "Coordinate spouse's employment paperwork — DOD Spouse Hiring, MyCAA",
      "OCONUS spouse employment: on-base jobs are governed by DoD Family Member Preference (FMP) and Priority Placement Program (PPP-S). Off-base employment in the host nation usually requires a host-nation work permit and (in many SOFA countries) explicit visa sponsorship — verify with the gaining SECO office before accepting an offer; some host-nation employment can complicate SOFA status.",
      "Re-enroll children in CDC / school-age program at gaining installation",
      "Confirm AFSC / duty assignment correctly reflected in myPers",
      "Complete shop indoctrination, security clearance reconfirmation, and OJT plan",
    ],
  },
  "Space Force": {
    "Orders Received": [
      "Log into myPers portal and verify Space Force assignment orders",
      "Contact gaining unit sponsor program for Guardian sponsor assignment",
      "Notify current unit and commander upon receipt of orders",
      "Notify current landlord or installation housing office",
      "Begin home sale or lease termination process",
      "Request DLA (Dislocation Allowance) via finance office",
      "Open Move Budget Tracker to set PCS spending plan",
      "Make 10+ certified copies of orders for MPF, housing, schools, finance",
      "Verify RNLTD, gaining UIC, and dependents authorized in myPers",
      "Request Permissive TDY (PTDY) for house-hunting if eligible (AF Form 988)",
      "Save orders PDF and supporting documents to a secure cloud folder",
      "Confirm travel reimbursement entitlements (MALT, per diem, PPM incentive) with finance",
      "Review Guardian Spirit / SDFC contact at the gaining wing/delta",
    ],
    "90 Days Out": [
      "Schedule TMO appointment via base transportation — do this first",
      "Create detailed household goods inventory with photos and video",
      "Research gaining installation housing options",
      "Apply for on-base housing at gaining installation",
      "Request home search leave if entitled",
      "Research schools for dependent children",
      "Update vehicle registrations and insurance",
      "Arrange POV shipment if going OCONUS",
      "Begin passport and visa process for family if going OCONUS",
      "Research TRICARE network at new duty station",
      "Enroll qualifying dependents in EFMP (AF Form 1466) and request gaining-MTF screening",
      "Decide PPM vs HHG; if PPM, attend mandatory weight-tickets brief at TMO",
      "Run BAH Calculator for gaining ZIP to forecast monthly housing budget",
      "Identify on-base CDC and waitlists at gaining base (Guardian Child Care)",
      "Update myFSS records — dependents, contact info, emergency data",
      "Verify physical fitness assessment record is current under USSF standards",
      "Coordinate launch / mission release if currently in operational rotation",
    ],
    "60 Days Out": [
      "Schedule all medical, dental, and vision appointments",
      "Obtain sealed medical and dental records for all family members",
      "Update SGLI beneficiary designations",
      "Obtain school records for dependent children",
      "Notify financial institutions of upcoming address change",
      "Update records in myPers — verify Guardian assignment data",
      "Begin decluttering household goods",
      "Connect with gaining unit Guardian family support resources",
      "Arrange pet transport if needed",
      "Spouse: enroll in SECO / MyCAA; verify license reciprocity at gaining state",
      "Spouse (OCONUS): enroll in SECO / MyCAA; research host-nation professional credential recognition — some U.S. licenses are honored on-base via DoD agreements but not in the local economy. Verify with SECO before pursuing local employment.",
      "Schedule final dental Class 1/2 exam to clear deployable status",
      "Update Wills, POAs, Advance Medical Directives at Legal Assistance",
      "Notify children's pediatrician of move — request 90-day prescription supply",
      "Request a complete OMPF / Personnel Records Display print",
      "If OCONUS: submit no-fee passport applications and DD 1056 family endorsements",
      "If OCONUS: complete Overseas Family Member Travel Screening (OFMTS)",
      "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes. CZTE-area active pay is excluded from federal income tax under IRC §112; OCONUS civilians earning foreign-source wages may qualify for IRS Form 2555 Foreign Earned Income Exclusion. Verify with the gaining installation Tax Center / VITA volunteer before filing.",
      "Run final pay screening at finance to confirm pay continuity",
      "Attend pre-departure family brief at Guardian & Family Readiness Center",
    ],
    "30 Days Out": [
      "Confirm HHG pack-out dates and weight",
      "Arrange TLE lodging at new duty station",
      "Update DEERS with upcoming address change",
      "Set up USPS mail forwarding",
      "Cancel or transfer local subscriptions and utilities",
      "Complete out-processing at current installation",
      "Service vehicles for long-distance travel",
      "Pack personal travel bag for first 2 weeks — do not ship",
      "Verify per diem and DLA entitlements with finance",
      "Prepare professional gear (uniforms, mobility bag) for hand-carry — exceeds ProGear weight",
      "Print 2 paper copies of orders for each adult traveler",
      "If shipping POV: pre-shipment cleaning, fluid checks, remove personal items",
      "Verify all family member IDs are not expiring within 90 days of report date",
      "Withdraw enough cash for travel days — fuel and tolls may not accept card",
      "Confirm school enrollment paperwork ready at gaining district",
      "Settle outstanding base loans, BX/AAFES charge accounts",
    ],
    "Move Week": [
      "Be present for entire household goods pack-out",
      "Verify all items on DPS inventory sheet — note exceptions in writing",
      "Photograph all rooms before and after pack-out",
      "Return all Space Force/Air Force property at current installation",
      "Pick up all cleared documents from unit",
      "Verify pets have current vaccination records",
      "Activate TRICARE transfer at tricare.mil",
      "File change of address with USPS, banks, IRS",
      "OCONUS: forward U.S. mail through APO/FPO/DPO — USPS standard change-of-address does not accept overseas addresses. Use MPS instructions at usps.com/ship/apo-fpo-dpo and provide the APO/FPO/DPO box assigned by your gaining base post office. Notify banks, IRS, and creditors with the APO/FPO/DPO line as your mailing address (state stays AE/AP/AA).",
      "Check weather and alternate routes for travel day",
      "Verify high-value inventory sheet is signed for items >$100/lb",
      "Hand-carry: orders, medical/dental records, school records, birth certificates, passports, wills",
      "Confirm pet airline carrier reservations and temperature embargo dates",
      "Final finance screening — confirm DLA, MALT, per diem are in queue",
      "Take dated meter-read photos of utilities at departure",
      "Submit final out-processing checklist at MPF before signing out",
    ],
    "In-Processing": [
      "Report to gaining unit by official report date on orders",
      "Complete in-processing with MPF at gaining installation",
      "Obtain new base access credentials and vehicle decal",
      "Update banking and direct deposit at finance",
      "OCONUS: confirm direct-deposit bank accepts APO/FPO/DPO mailing address (some U.S. banks freeze accounts when the address moves overseas). For SOFA countries (Korea, Japan, Germany, Italy), ask finance about authorized on-base credit unions (Navy Federal, Service Credit Union, Andrews Federal, Community Bank) and whether you need a host-nation account for utility / landlord payments.",
      "Enroll children in schools with transferred records",
      "Transfer vehicle registrations to new state",
      "Set up utilities at new residence",
      "Schedule household goods delivery",
      "Inspect HHG for damage — file DPS claims within 9 months",
      "Update DEERS with new address",
      "Register with MTF and enroll in TRICARE",
      "OCONUS: enroll in TRICARE Overseas Program (TOP) Prime or TOP Select at tricare-overseas.com — TRICARE Prime CONUS does not transfer overseas. International SOS coordinates host-nation care.",
      "Update Guardian personnel records at gaining MPF",
      "Brief gaining chain of command within 24 hours",
      "Submit travel voucher (DD 1351-2) within 5 working days of arrival",
      "OCONUS travel voucher: include all foreign-currency receipts with the converted USD amount and the conversion rate used (DTS auto-applies the published rate). Request an LQA / OHA advance through the gaining housing or HR office before pack-out and confirm finance's exchange-rate adjustment policy so you are not out-of-pocket if the rate moves between expense and reimbursement.",
      "Take orders to gaining housing office to start BAH at gaining location",
      "Schedule SAPR, SERE, OPSEC, and Cyber Awareness refreshers within in-processing window",
      "Attend mandatory Newcomers' Brief at gaining wing/delta",
      "Enroll dependents in DEERS-linked MTF and book pediatric / OB-GYN intake",
      "Coordinate spouse's employment paperwork — DOD Spouse Hiring, MyCAA",
      "OCONUS spouse employment: on-base jobs are governed by DoD Family Member Preference (FMP) and Priority Placement Program (PPP-S). Off-base employment in the host nation usually requires a host-nation work permit and (in many SOFA countries) explicit visa sponsorship — verify with the gaining SECO office before accepting an offer; some host-nation employment can complicate SOFA status.",
      "Re-enroll children in CDC / school-age program at gaining base",
      "Confirm Space Force Specialty Code (SFSC) / billet correctly reflected in myPers",
      "Complete shop indoctrination, security clearance reconfirmation, and OJT plan",
      "Reconfirm Special Access Program (SAP) eligibility at gaining unit security office",
    ],
  },
  "Coast Guard": {
    "Orders Received": [
      "Log into Direct Access (CGOne) and verify assignment orders",
      "Contact PSC-RPM (Personnel Service Center — Recruiting and Permanent Change of Station) for entitlements",
      "Contact gaining unit and request sponsor assignment",
      "Notify current CO (Commanding Officer) upon receipt of orders",
      "Notify current landlord or installation housing office",
      "Begin home sale or lease termination process",
      "Request DLA (Dislocation Allowance) via finance",
      "Open Move Budget Tracker to set PCS spending plan",
      "Make 10+ certified copies of orders for housing, schools, finance, PSD",
      "Verify RNLTD and dependents authorized in Direct Access",
      "Request Permissive TDY (PTDY) for house-hunting if eligible (CG-3307)",
      "Save orders PDF and supporting documents to a secure cloud folder",
      "Confirm travel reimbursement entitlements (MALT, per diem, PPM incentive) with SPO",
    ],
    "90 Days Out": [
      "Contact Assignment Officer (AO) at PSC to confirm PCS entitlements",
      "Schedule TMO appointment for household goods pickup",
      "Create detailed household goods inventory with photos and video",
      "Research gaining unit housing options on base and off",
      "Apply for on-base housing if available at gaining installation",
      "Request home search leave if entitled",
      "Research schools for dependent children",
      "Arrange POV shipment if going OCONUS",
      "Begin passport and visa process for family if going OCONUS",
      "Research TRICARE network at new duty station",
      "Enroll qualifying dependents in EFMP (CG SNAP) and request gaining clinic screening",
      "Decide PPM vs HHG; if PPM, attend mandatory weight-tickets brief at TMO",
      "Run BAH Calculator for gaining ZIP to forecast monthly housing budget",
      "Identify CG / DoD CDC options near gaining unit; join CDC waitlists",
      "Review CGSUPRT and Work-Life Program resources at gaining region",
      "Coordinate cutter / station rotation release if currently underway or on duty days",
      "Verify physical fitness assessment record is current under USCG standards",
    ],
    "60 Days Out": [
      "Schedule all medical, dental, and vision appointments",
      "Obtain sealed medical and dental records for all family members",
      "Update SGLI beneficiary designations",
      "Obtain school records for dependent children",
      "Update Direct Access payroll data — verify BAH/OHA authorization",
      "Notify financial institutions of upcoming address change",
      "Begin decluttering household goods",
      "Connect with gaining unit Work-Life staff or Family Support",
      "Arrange pet transport if needed",
      "Contact CGMAHQ (Coast Guard Mutual Assistance) for transition support",
      "Spouse: enroll in SECO / MyCAA; verify license reciprocity at gaining state",
      "Spouse (OCONUS): enroll in SECO / MyCAA; research host-nation professional credential recognition — some U.S. licenses are honored on-base via DoD agreements but not in the local economy. Verify with SECO before pursuing local employment.",
      "Schedule final dental Class 1/2 exam to clear deployable status",
      "Update Wills, POAs, Advance Medical Directives at Legal Assistance",
      "Notify children's pediatrician of move — request 90-day prescription supply",
      "Request a complete PDR (Personnel Data Record) print from SPO",
      "If OCONUS: submit no-fee passport applications and DD 1056 family endorsements",
      "If OCONUS: complete Family Member Overseas Screening",
      "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes. CZTE-area active pay is excluded from federal income tax under IRC §112; OCONUS civilians earning foreign-source wages may qualify for IRS Form 2555 Foreign Earned Income Exclusion. Verify with the gaining installation Tax Center / VITA volunteer before filing.",
      "Run final pay screening at SPO to confirm pay continuity",
    ],
    "30 Days Out": [
      "Confirm HHG pack-out dates and weight",
      "Arrange TLE lodging at new duty station",
      "Update DEERS with upcoming address change",
      "Set up USPS mail forwarding",
      "Cancel or transfer local subscriptions and utilities",
      "Complete Coast Guard outprocessing checklist at current unit",
      "Service vehicles for long-distance travel",
      "Pack personal travel bag for first 2 weeks — do not ship",
      "Verify per diem and DLA entitlements with finance",
      "Prepare professional gear (uniforms, deuce gear) for hand-carry — exceeds ProGear weight",
      "Print 2 paper copies of orders for each adult traveler",
      "If shipping POV: pre-shipment cleaning, fluid checks, remove personal items",
      "Verify all family member IDs are not expiring within 90 days of report date",
      "Withdraw enough cash for travel days — fuel and tolls may not accept card",
      "Confirm school enrollment paperwork ready at gaining district",
      "Settle outstanding loans, MWR, and CG Exchange charge accounts",
    ],
    "Move Week": [
      "Be present for entire household goods pack-out",
      "Verify all items on inventory sheet — note exceptions in writing immediately",
      "Photograph all rooms before and after pack-out",
      "Return all Coast Guard equipment to unit supply",
      "Return base property: keys, decals, library materials",
      "Pick up all cleared documents from unit",
      "Verify pets have current vaccination records and health certificates",
      "Activate TRICARE transfer at tricare.mil",
      "File change of address with USPS, banks, IRS",
      "OCONUS: forward U.S. mail through APO/FPO/DPO — USPS standard change-of-address does not accept overseas addresses. Use MPS instructions at usps.com/ship/apo-fpo-dpo and provide the APO/FPO/DPO box assigned by your gaining base post office. Notify banks, IRS, and creditors with the APO/FPO/DPO line as your mailing address (state stays AE/AP/AA).",
      "Check weather and alternate routes for travel day",
      "Verify high-value inventory sheet is signed for items >$100/lb",
      "Hand-carry: orders, medical/dental records, school records, birth certificates, passports, wills",
      "Confirm pet airline carrier reservations and temperature embargo dates",
      "Final SPO screening — confirm DLA, MALT, per diem are in queue",
      "Take dated meter-read photos of utilities at departure",
    ],
    "In-Processing": [
      "Report to gaining unit by official report date on orders",
      "Sign into Direct Access at gaining unit to complete administrative check-in",
      "Complete Administrative In-processing Checklist at gaining command",
      "Obtain new base access credentials and vehicle decal",
      "Update banking and direct deposit at finance",
      "OCONUS: confirm direct-deposit bank accepts APO/FPO/DPO mailing address (some U.S. banks freeze accounts when the address moves overseas). For SOFA countries (Korea, Japan, Germany, Italy), ask finance about authorized on-base credit unions (Navy Federal, Service Credit Union, Andrews Federal, Community Bank) and whether you need a host-nation account for utility / landlord payments.",
      "Enroll children in local schools with transferred records",
      "Transfer vehicle registrations to new state",
      "Set up utilities at new residence",
      "Schedule household goods delivery",
      "Inspect HHG for damage — file DPS claims within 9 months",
      "Update DEERS with new address",
      "Register with MTF or civilian provider and enroll in TRICARE",
      "OCONUS: enroll in TRICARE Overseas Program (TOP) Prime or TOP Select at tricare-overseas.com — TRICARE Prime CONUS does not transfer overseas. International SOS coordinates host-nation care.",
      "Brief gaining chain of command within 24 hours of arrival",
      "Submit travel voucher (CG-3307 / DD 1351-2) within 5 working days of arrival",
      "OCONUS travel voucher: include all foreign-currency receipts with the converted USD amount and the conversion rate used. Request an OHA advance and confirm finance's exchange-rate adjustment policy so you are not out-of-pocket if rates shift between expense and reimbursement.",
      "Take orders to gaining housing office to start BAH at gaining location",
      "Schedule SAPR-O, OPSEC, and Cyber Awareness refreshers within in-processing window",
      "Attend mandatory Newcomers' Brief / unit indoctrination",
      "Enroll dependents in DEERS-linked MTF and book pediatric intake",
      "Coordinate spouse's employment paperwork — DOD Spouse Hiring, MyCAA",
      "OCONUS spouse employment: on-base jobs are governed by DoD Family Member Preference (FMP) and Priority Placement Program (PPP-S). Off-base employment in the host nation usually requires a host-nation work permit and (in many SOFA countries) explicit visa sponsorship — verify with the gaining SECO office before accepting an offer; some host-nation employment can complicate SOFA status.",
      "Re-enroll children in CDC / school-age program at gaining unit",
      "Confirm rating / billet correctly reflected in Direct Access",
      "Complete cutter / station qualifications brief if reporting to operational unit",
      "Reconfirm security clearance at gaining unit security office",
    ],
  },
};

// DoD Civilian PCS checklist. Civilian PCS is governed by the Federal
// Travel Regulation (FTR), Chapter 302, and the DCPAS civilian
// relocation guide — NOT the Joint Travel Regulations military rules.
// All tasks below reference public regulatory citations and official
// DoD civilian HR offices (CPAC / DCPAS / HR Service Center) rather
// than military S1 / Personnel offices.
const DOD_CIVILIAN_CHECKLIST = {
  "Orders Received": [
    "Review your TCS (Travel Compensation Service) or PCS Travel Authorization (signed AD-202 or equivalent) for accuracy — effective date, gaining DoD activity, allowances authorized",
    "Make certified copies of your Travel Authorization (keep 10+ — HR, payroll, and gaining HR Service Center require them)",
    "Sign your Continuing Service Agreement (CSA) — required before relocation benefits release; understand the service obligation period (typically 12 months CONUS, 24 months OCONUS)",
    "Notify your gaining DoD HR Service Center / Civilian Personnel Advisory Center (CPAC) and request a relocation point-of-contact",
    "Notify current landlord or housing office of departure date",
    "Open Move Budget Tracker — civilian PCS has a different reimbursement structure than military",
    "Request advance pay (up to 30 days base salary) from your servicing payroll office if needed",
    "Confirm your locality pay rate will adjust for the gaining locality — see OPM locality pay tables",
    "If OCONUS: begin Living Quarters Allowance (LQA) eligibility verification with gaining DoD HR",
    "Save Travel Authorization PDF and supporting documents to a secure cloud folder",
  ],
  "90 Days Out": [
    "Schedule TMO (Transportation Management Office) appointment via gaining installation — civilian PCS uses the same DPS system as military",
    "Create detailed household goods inventory with photos and video",
    "Research gaining locality housing options (no on-post housing entitlement for most civilian grades — verify with gaining HR if you qualify)",
    "Update vehicle registrations and insurance for new state — civilians do not retain home-of-record protection like military",
    "Begin passport process for family if going OCONUS — civilians use no-fee official passports (separate from tourist passports)",
    "Enroll family in FEHB (Federal Employees Health Benefits) — PCS is a Qualifying Life Event allowing plan changes within 60 days",
    "Notify Thrift Savings Plan (TSP) of address change and confirm no contribution interruption during the move",
    "Update Federal Employee Group Life Insurance (FEGLI) beneficiary designations if needed",
    "Research schools for dependent children near the gaining locality and contact district enrollment offices",
    "Identify childcare options — civilians may use installation CDCs if space available (CDC priority is dual-military first)",
    "Submit DPS (Defense Personal Property System) self-counseling session and keep printable receipts",
    "Decide HHG vs PPM — civilian PPM is reimbursed at 95% of constructed government cost (different from military rates)",
    "Calculate Temporary Quarters Subsistence Expense (TQSE) entitlement under FTR §302-6 — up to 60 days CONUS, 90 days OCONUS",
    "Request a House Hunting Trip authorization (CONUS only, FTR §302-5) — round-trip travel for self and spouse",
    "OCONUS housing reconnaissance: contact the gaining installation Housing Office (HOMES.mil) before HHG pack-out and pre-screen off-base rentals via AHRN.com or MilitaryByOwner — civilians overseas typically do not receive a House Hunting Trip authorization.",
  ],
  "60 Days Out": [
    "Schedule all medical and dental appointments under FEHB — get records before departure",
    "Obtain sealed medical, dental, and vision records for all family members",
    "Obtain school records for dependent children (sealed for transfer)",
    "Notify financial institutions of upcoming address change",
    "Begin decluttering — sell, donate, or dispose of excess household goods (civilian weight allowance is 18,000 lbs, separate from military formula)",
    "Research employment opportunities at gaining locality if spouse is also federally employed — see Spouse Employment Program",
    "Update USAJOBS profile if planning lateral moves or career progression after PCS",
    "Update driver's licenses for the gaining state per state-specific timing rules",
    "Arrange pet transport — obtain health certificates from vet (required 10 days before travel)",
    "Review Real Estate Expense Allowance under FTR §302-11 — selling primary residence and buying at new locality may be reimbursable",
    "Schedule final pre-departure HR briefing with current CPAC office — typically covers final TSP, leave balance, SF-50 paperwork",
    "Update Wills, POAs, and Advance Medical Directives — civilians do not have free military legal assistance",
    "If OCONUS: complete DoD Civilian OCONUS Screening (DCPAS form) and family member travel screening",
    "If OCONUS: begin DSSR Section 130 eligibility verification (LQA, Post Allowance, Education Allowance)",
    "If OCONUS: confirm state of legal residence (SLR/HOR) is unchanged for state tax purposes. OCONUS DoD civilians earning foreign-source wages may qualify for IRS Form 2555 Foreign Earned Income Exclusion (FEIE) when also satisfying the bona fide residence or physical presence test. Consult the gaining installation Tax Center / VITA volunteer before filing — FEIE has interaction effects with LQA, FTC, and the Bona Fide Residence test.",
  ],
  "30 Days Out": [
    "Confirm pack-out dates and weight estimates with moving company via DPS",
    "Arrange temporary lodging at new locality — TQSE reimbursable per FTR §302-6 once you are at the new duty station",
    "Update USPS mail forwarding at usps.com",
    "Cancel or transfer local subscriptions, utilities, gym memberships",
    "Settle outstanding local debts and accounts",
    "Service vehicles for long-distance travel (oil, tires, fluids)",
    "Pack a personal travel bag for first 2 weeks — do not ship these items",
    "Confirm Miscellaneous Expense Allowance (FTR §302-16) — flat rate up to $1,300 or itemized actuals",
    "Update DEERS if dependents are TRICARE-eligible (former military / retiree dependents who are now in civilian status)",
    "Verify final-paycheck address routing and direct deposit for the gaining payroll office",
    "Begin transfer-of-station leave (annual leave) accounting — civilians do not use military DA-31 / NAVMC leave forms",
    "Schedule virtual or in-person check-in with the gaining HR Service Center",
  ],
  "Move Week": [
    "Conduct walkthrough with movers at pack-out — note all pre-existing damage on the inventory (DD Form 1840 / 1840R)",
    "Sign inventory carefully — pay attention to box counts and condition notes",
    "Keep critical documents (Travel Authorization, FEHB cards, passports, birth certs, vehicle titles) in carry-on luggage",
    "Take final meter readings and last-day photos of empty home",
    "Return any government property issued at your current activity (laptops, ID cards, parking permits)",
    "Schedule SF-1190 (Foreign Allowances) initial application appointment if going OCONUS — paperwork starts during in-processing",
    "Save all moving company receipts, weight tickets, and lodging receipts — required for travel voucher",
  ],
  "In-Processing": [
    "Report to the gaining DoD activity HR Service Center on the date specified by your Travel Authorization",
    "Complete SF-50 personnel action paperwork for transfer-in",
    "Submit DD Form 1351-2 (Travel Voucher) within 5 working days of arrival per FTR §302-2.18",
    "Provide all lodging receipts, mileage logs, weight tickets, and pre/post move records to the voucher office",
    "If OCONUS: complete SF-1190 (LQA, Post Allowance, Education Allowance application) at the servicing HR office",
    "Enroll family in FEHB at gaining duty station if Qualifying Life Event window applies",
    "Confirm locality pay rate has updated on your first new-locality paystub",
    "Register dependents in dependent locator system / family directory at gaining HR",
    "Schedule mandatory installation Welcome Briefing / Newcomers' Brief — many bases require it within 30 days of in-processing",
    "Enroll dependents in DEERS if eligible (former military / retiree connections)",
    "Schedule TSP account briefing with gaining HR if you wish to adjust contributions post-move",
    "Update emergency contacts in your DoD Civilian HR system of record",
    "Connect with the gaining installation's Civilian Employee Resource Group (ERG) if available for newcomer support",
    "Spouse: enroll in DoD Spouse Employment Program at gaining installation if eligible",
    "Re-enroll children in childcare and school district",
    "Complete OCONUS-specific orientation (SOFA briefing, country brief) within 30 days of arrival if applicable",
    "Confirm Real Estate Expense Allowance claim is filed if selling and buying primary residence",
  ],
}

function getBranchChecklist(branch, component) {
  if (component === 'DoD Civilian') return DOD_CIVILIAN_CHECKLIST;
  return BRANCH_PCS_CHECKLISTS[branch] || BRANCH_PCS_CHECKLISTS['Army'];
}

// Trim branch checklist items to what actually applies given the
// profile's onboarding selections. Predicate is keyword-based since the
// checklist data is plain strings: anything mentioning "pet" only shows
// when hasPets is true, anything mentioning child/dependent/spouse/EFMP
// only shows when the relevant flag is true, OCONUS-specific tasks
// only show on OCONUS PCS, and HHG/PPM-specific weight-ticket or
// pack-out language is hidden when the chosen moveType is the other
// option. Universal tasks (orders, finance, etc.) always show.
// Predicate-based task filtering. A task is shown only when EVERY
// applicable predicate returns true. Note that the `\bschool\b` token
// is intentionally singular: we don't want to filter universal tasks
// such as "Make certified copies of orders for finance, housing,
// schools" which simply mention schools as a copy-recipient.
const CHECKLIST_FILTERS = [
  { pattern: /\bpet\b|aphis|usda|veterinar|rabies|microchip|kennel/i,
    keep: (p) => p.hasPets },
  { pattern: /\bschool\b|education\s+records|district|iep|504 plan|enroll children|\bcyss\b|pediatrician|children'?s\b|childcare\b|child care\b|\bcdc\b|child development/i,
    keep: (p) => p.hasChildren },
  { pattern: /\bspouse|seco|mycaa|dependent\b|dependents\b|deers-linked mtf and book pediatric|family member travel screening|family member overseas screening|family care plan|family readiness/i,
    keep: (p) => p.hasDependents || p.hasChildren },
  { pattern: /\befmp\b/i,
    keep: (p) => p.hasDependents || p.hasChildren },
  // PPM-only tasks. Weight tickets, empty/full weight, DITY are PPM-
  // specific reimbursement requirements. HHG-only tasks (DPS counseling,
  // pickup window) stay visible for both move types since the gov-
  // organized portion of even a PPM still flows through DPS.
  { pattern: /\bweight ticket|weight-ticket|\bppm\b|\bdity\b/i,
    keep: (p) => p.moveType === 'PPM' },
  { pattern: /\boconus\b|no-fee passport|overseas screening|\bsofa\b|country clearance|host nation|host-nation|\bvisa\b/i,
    keep: (p) => p.isOverseas },
  // House Hunting Trip (HHT) under FTR §302-5 is a CONUS-only DoD
  // civilian benefit. Hide it on OCONUS so the OCONUS replacement task
  // (housing-office + AHRN reconnaissance) reads as the canonical
  // guidance instead of sitting next to a CONUS-only step the civilian
  // cannot use.
  { pattern: /house hunting trip/i,
    keep: (p) => !p.isOverseas },
  // State license reciprocity is a CONUS concept. OCONUS spouses need
  // host-nation credential recognition guidance instead. Hide the
  // CONUS line on OCONUS PCS; hide the OCONUS line on CONUS PCS.
  { pattern: /license reciprocity at gaining state/i,
    keep: (p) => !p.isOverseas },
  { pattern: /host-nation professional credential recognition/i,
    keep: (p) =>  p.isOverseas },
  // Reserve / National Guard orders-type gating. Tasks that depend on
  // PCS-tier entitlements (BAH, HHG, DLA, TLE/TQSE, on-post housing
  // application) are hidden when the user's orders type does not
  // qualify (IDT, drill, SAD, technician). Active Duty / AGR / Title 10
  // PCS / Title 10 Mobilization users continue to see everything.
  { pattern: /\bbah\b|basic allowance for housing|on-post housing|on-installation housing|housing waitlist/i,
    keep: (p) => p.component !== 'Reserve' && p.component !== 'National Guard'
      ? true
      : !p.ordersType /* no orders selected yet */
        || (ordersTypeMeta(p.component, p.ordersType)?.bahEligible !== false) },
  { pattern: /\bhhg\b|household goods|dps\b|tmo\b|tle\b|tqse\b|dla\b|dislocation allowance|per diem|household-goods/i,
    keep: (p) => p.component !== 'Reserve' && p.component !== 'National Guard'
      ? true
      : !p.ordersType
        || (ordersTypeMeta(p.component, p.ordersType)?.pcsEntitled !== false) },
  { pattern: /\btricare prime\b|enroll in tricare/i,
    keep: (p) => p.component !== 'Reserve' && p.component !== 'National Guard'
      ? true
      : !p.ordersType
        || (ordersTypeMeta(p.component, p.ordersType)?.tricarePrime !== false) },
  // CONUS TRICARE Prime / MTF registration is the wrong guidance for
  // OCONUS PCS. OCONUS enrollment runs through the TRICARE Overseas
  // Program (TOP), administered by International SOS, not MTF Prime.
  // Hide the CONUS lines on OCONUS PCS, and gate the new OCONUS line
  // to OCONUS only.
  { pattern: /register with mtf|enroll family in tricare at gaining installation/i,
    keep: (p) => !p.isOverseas },
  { pattern: /tricare overseas program|tricare-overseas\.com|\btop prime\b|\btop select\b/i,
    keep: (p) =>  p.isOverseas },
  // USPS standard change-of-address does not work for APO/FPO/DPO
  // overseas addresses. Hide the CONUS line on OCONUS, gate the
  // OCONUS APO variant to OCONUS only.
  { pattern: /file change of address with usps|usps, bank, irs, and social security change of address/i,
    keep: (p) => !p.isOverseas },
  { pattern: /apo\/fpo\/dpo/i,
    keep: (p) =>  p.isOverseas },
  // OCONUS banking guidance (on-base credit union + host-nation
  // account). Gated to OCONUS so CONUS users don't see overseas-only
  // banking constraints.
  { pattern: /on-base credit union|host-nation account/i,
    keep: (p) =>  p.isOverseas },
  // OCONUS-only spouse-employment supplement (FMP, PPP-S, host-nation
  // work permit + SOFA visa caveats). Hide on CONUS where it would be
  // misleading.
  { pattern: /family member preference \(fmp\)|priority placement program \(ppp-s\)|host-nation work permit/i,
    keep: (p) =>  p.isOverseas },
  // OCONUS-only DTS / foreign-currency voucher supplement. Hide on
  // CONUS where exchange-rate adjustment policy is irrelevant.
  { pattern: /foreign-currency receipts|exchange-rate adjustment policy/i,
    keep: (p) =>  p.isOverseas },
];

function applyChecklistFilters(items, profileAttrs) {
  if (!Array.isArray(items)) return items;
  return items.filter(text => {
    if (typeof text !== 'string') return true;
    for (const f of CHECKLIST_FILTERS) {
      if (f.pattern.test(text) && !f.keep(profileAttrs)) return false;
    }
    return true;
  });
}

function getTailoredChecklist(branch, profileAttrs = {}) {
  const raw = getBranchChecklist(branch, profileAttrs.component);
  const out = {};
  for (const phase of Object.keys(raw)) {
    out[phase] = applyChecklistFilters(raw[phase], profileAttrs);
  }
  return out;
}

const PCS_CHECKLIST = getBranchChecklist('Army');

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
  'Fort Carson': [
    { name: 'Fort Carson CDC (Mountain Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'DoD Child Development Center — priority for active duty. Multiple CDC locations on post. Subsidized rates by rank.', phone: '(719) 526-5822', waitlist: '2–4 weeks' },
    { name: 'YMCA of the Pikes Peak Region', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.1, desc: 'YMCA branches in Colorado Springs with military discount. Good backup when CDC waitlist is long.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Bliss': [
    { name: 'Fort Bliss CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'DoD Child Development Center at Fort Bliss. Priority for active duty. Subsidized rates by rank.', phone: '(915) 568-2141', waitlist: '2–4 weeks' },
    { name: 'Fort Bliss School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school care on post. Summer programs available.', phone: '(915) 568-2141', waitlist: '1–2 weeks' },
  ],
  'Fort Cavazos': [
    { name: 'Fort Cavazos CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'DoD Child Development Center — priority for active duty. Multiple CDC facilities across post.', phone: '(254) 287-8059', waitlist: '2–5 weeks' },
    { name: 'Killeen Area YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA in Killeen area with military family discount. Good overflow option when CDC is full.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Stewart': [
    { name: 'Fort Stewart CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Stewart. Priority for active duty soldiers. Subsidized rates.', phone: '(912) 767-2313', waitlist: '2–4 weeks' },
    { name: 'Hinesville Area YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA near Fort Stewart with military family discount. Good option during CDC waitlist periods.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Moore': [
    { name: 'Fort Moore CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'DoD Child Development Center at Fort Moore. Priority for active duty. Multiple CDC locations on post.', phone: '(706) 545-2958', waitlist: '2–4 weeks' },
    { name: 'Columbus YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA in Columbus, GA near Fort Moore. Military discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Eisenhower': [
    { name: 'Fort Eisenhower CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Eisenhower. Priority for active duty. Cyber Center installation.', phone: '(706) 791-3369', waitlist: '2–4 weeks' },
    { name: 'Augusta YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA in Augusta area near Fort Eisenhower. Military family discount.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Drum': [
    { name: 'Fort Drum CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Drum. Priority for active duty. Cold-weather certified facilities.', phone: '(315) 772-5493', waitlist: '2–4 weeks' },
    { name: 'Fort Drum School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school and summer programs on post. Background-checked staff.', phone: '(315) 772-5493', waitlist: '1–2 weeks' },
  ],
  'Fort Sill': [
    { name: 'Fort Sill CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Sill. Priority for active duty soldiers. Subsidized rates by rank.', phone: '(580) 442-4240', waitlist: '2–4 weeks' },
    { name: 'Lawton Area YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 3.9, desc: 'YMCA in Lawton serving Fort Sill families. Military discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Riley': [
    { name: 'Fort Riley CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Riley. Priority for active duty. Multiple CDC facilities on post.', phone: '(785) 239-3312', waitlist: '2–4 weeks' },
    { name: 'Junction City Area Child Care', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 3.9, desc: 'Community child care options in Junction City near Fort Riley. Commonly used during high-demand periods.', phone: '', waitlist: 'Varies' },
  ],
  'Fort Leavenworth': [
    { name: 'Fort Leavenworth CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'DoD Child Development Center at Fort Leavenworth. Serves CGSC and garrison families. Priority for active duty.', phone: '(913) 684-5100', waitlist: '1–3 weeks' },
    { name: 'Fort Leavenworth School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school care on post. Ideal for CGSC student families.', phone: '(913) 684-5100', waitlist: 'None typically' },
  ],
  'Fort Knox': [
    { name: 'Fort Knox CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Knox. Priority for active duty. Multiple locations on post.', phone: '(502) 624-3624', waitlist: '2–4 weeks' },
    { name: 'Elizabethtown YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA in Elizabethtown near Fort Knox. Military family discount program available.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Jackson': [
    { name: 'Fort Jackson CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'DoD Child Development Center at Fort Jackson. Serves training base families. Priority for active duty.', phone: '(803) 751-5430', waitlist: '2–4 weeks' },
    { name: 'Columbia YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA locations in Columbia, SC near Fort Jackson. Military family discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Fort Belvoir': [
    { name: 'Fort Belvoir CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'DoD Child Development Center at Fort Belvoir. Strong demand — sign up immediately upon receiving PCS orders. Priority for active duty.', phone: '(703) 805-3161', waitlist: '4–8 weeks' },
    { name: 'Fort Belvoir School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school and summer programs on post. Background-checked staff.', phone: '(703) 805-3161', waitlist: '2–4 weeks' },
  ],
  'Fort Meade': [
    { name: 'Fort Meade CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'DoD Child Development Center at Fort Meade. NSA and cyber workforce families. Priority for active duty. High demand.', phone: '(301) 677-4516', waitlist: '4–6 weeks' },
    { name: 'Fort Meade School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school care on post. Background-checked staff.', phone: '(301) 677-4516', waitlist: '1–2 weeks' },
  ],
  'Schofield Barracks': [
    { name: 'Schofield Barracks CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'DoD Child Development Center at Schofield Barracks. Priority for active duty. High demand in Hawaii — sign up immediately upon PCS orders.', phone: '(808) 655-9167', waitlist: '3–6 weeks' },
    { name: 'Schofield Barracks School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school and summer programs on post. Strong programming.', phone: '(808) 655-9167', waitlist: '1–3 weeks' },
  ],
  'Fort Wainwright': [
    { name: 'Fort Wainwright CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.2, desc: 'DoD Child Development Center at Fort Wainwright. Heated/indoor facilities. Priority for active duty in Fairbanks.', phone: '(907) 353-7533', waitlist: '1–3 weeks' },
    { name: 'Fairbanks Area YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 3.9, desc: 'YMCA in Fairbanks near Fort Wainwright. Military family discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Naval Base San Diego': [
    { name: 'NB San Diego CDC (32nd Street)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Navy CDC at Naval Base San Diego. Priority for active duty. Subsidized rates by rank.', phone: '(619) 556-7215', waitlist: '2–4 weeks' },
    { name: 'NB San Diego School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school care on post. Summer program available.', phone: '(619) 556-7215', waitlist: '1–2 weeks' },
  ],
  'NAS Jacksonville': [
    { name: 'NAS Jacksonville CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Navy CDC at NAS Jacksonville. Priority for active duty. Subsidized rates. Waitlist expected.', phone: '(904) 542-3161', waitlist: '2–4 weeks' },
    { name: 'Jacksonville YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA locations in Jacksonville near NAS. Military family discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Naval Station Mayport': [
    { name: 'NS Mayport CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Navy CDC at Naval Station Mayport. Priority for active duty families. Subsidized rates by rank.', phone: '(904) 270-5617', waitlist: '2–4 weeks' },
    { name: 'NS Mayport School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school care on post at Mayport. Background-checked staff.', phone: '(904) 270-5617', waitlist: '1–2 weeks' },
  ],
  'Camp Pendleton': [
    { name: 'Camp Pendleton CDC (San Onofre)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'Marine Corps CDC at Camp Pendleton. Multiple CDC locations across the large installation. Priority for active duty.', phone: '(760) 725-6961', waitlist: '3–6 weeks' },
    { name: 'Camp Pendleton School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school care on post. Summer programs available.', phone: '(760) 725-6961', waitlist: '1–3 weeks' },
  ],
  'MCB Quantico': [
    { name: 'MCB Quantico CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Marine Corps CDC at MCB Quantico. Serves Marine and FBI Training Academy families. Priority for active duty.', phone: '(703) 784-5408', waitlist: '2–4 weeks' },
    { name: 'MCB Quantico School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school and summer programs on post.', phone: '(703) 784-5408', waitlist: 'None typically' },
  ],
  'Joint Base Andrews': [
    { name: 'JB Andrews CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Air Force CDC at Joint Base Andrews. Priority for active duty. Serves Air Mobility Command and presidential support families.', phone: '(301) 981-2226', waitlist: '3–5 weeks' },
    { name: 'JB Andrews School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school and summer care on post. Background-checked staff.', phone: '(301) 981-2226', waitlist: '1–2 weeks' },
  ],
  'Joint Base Charleston': [
    { name: 'JB Charleston CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Joint Base Charleston. Priority for active duty. C-17 mobility wing families.', phone: '(843) 963-5440', waitlist: '2–4 weeks' },
    { name: 'Lowcountry YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA locations near JB Charleston. Military family discount available. Good overflow option.', phone: '', waitlist: 'None typically' },
  ],
  'Joint Base McGuire-Dix-Lakehurst': [
    { name: 'JB MDL CDC (McGuire)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force/Army CDC at JB McGuire-Dix-Lakehurst. Priority for active duty. Mobility wing families.', phone: '(609) 754-2606', waitlist: '2–4 weeks' },
    { name: 'JB MDL School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school care on post. Background-checked staff.', phone: '(609) 754-2606', waitlist: '1–2 weeks' },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { name: 'JBPHH CDC (Hickam)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'Air Force CDC at JBPHH Hickam side. High demand in Hawaii — sign up immediately upon PCS orders. Priority for active duty.', phone: '(808) 449-0130', waitlist: '4–8 weeks' },
    { name: 'JBPHH School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school and summer care on post. Strong programming.', phone: '(808) 449-0130', waitlist: '2–4 weeks' },
  ],
  'Joint Base Elmendorf-Richardson': [
    { name: 'JBER CDC (Elmendorf)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at JBER. All-weather facilities. Priority for active duty in Anchorage area.', phone: '(907) 552-4222', waitlist: '2–4 weeks' },
    { name: 'JBER School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school and summer programs on post. Excellent indoor facilities for Alaska climate.', phone: '(907) 552-4222', waitlist: '1–2 weeks' },
  ],
  'Eglin AFB': [
    { name: 'Eglin AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'Air Force CDC at Eglin AFB. Priority for active duty. High demand — sign up early. Test Wing and SOF families.', phone: '(850) 882-5249', waitlist: '3–5 weeks' },
    { name: 'Eglin AFB School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school care on post. Summer programs available.', phone: '(850) 882-5249', waitlist: '1–2 weeks' },
  ],
  'MacDill AFB': [
    { name: 'MacDill AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Air Force CDC at MacDill AFB. CENTCOM and SOCOM families. Priority for active duty. High demand.', phone: '(813) 828-3374', waitlist: '3–5 weeks' },
    { name: 'MacDill AFB School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school care on post. Background-checked staff.', phone: '(813) 828-3374', waitlist: '1–2 weeks' },
  ],
  'Travis AFB': [
    { name: 'Travis AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Air Force CDC at Travis AFB. AMC families. Priority for active duty. Subsidized rates by rank.', phone: '(707) 424-3415', waitlist: '2–4 weeks' },
    { name: 'Travis AFB School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school and summer programs on post. Strong community programming.', phone: '(707) 424-3415', waitlist: '1–2 weeks' },
  ],
  'Wright-Patterson AFB': [
    { name: 'Wright-Patterson AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Air Force CDC at Wright-Patterson AFB. AFRL and AMC families. Priority for active duty.', phone: '(937) 257-3375', waitlist: '2–4 weeks' },
    { name: 'Wright-Patterson School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school care on post. Background-checked staff.', phone: '(937) 257-3375', waitlist: '1–2 weeks' },
  ],
  'Naval Station Great Lakes': [
    { name: 'NS Great Lakes CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.2, desc: 'Navy CDC at Naval Station Great Lakes. Serves Navy Recruit Training Command families. Priority for active duty.', phone: '(847) 688-3407', waitlist: '2–4 weeks' },
    { name: 'Lake County YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 3.9, desc: 'YMCA branches in Lake County near NS Great Lakes. Military discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Hill AFB': [
    { name: 'Hill AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Hill AFB. F-35 wing and Ogden ALC families. Priority for active duty. Subsidized rates.', phone: '(801) 777-5461', waitlist: '2–4 weeks' },
    { name: 'Hill AFB School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school care on post. Background-checked staff.', phone: '(801) 777-5461', waitlist: '1–2 weeks' },
  ],
  'Scott AFB': [
    { name: 'Scott AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Scott AFB. AMC and USTRANSCOM families. Priority for active duty. Subsidized rates.', phone: '(618) 256-4281', waitlist: '2–4 weeks' },
    { name: 'Scott AFB School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school care on post. Summer programs available.', phone: '(618) 256-4281', waitlist: '1–2 weeks' },
  ],
  'Nellis AFB': [
    { name: 'Nellis AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Nellis AFB. Fighter wing and Warfare Center families. Priority for active duty.', phone: '(702) 652-4038', waitlist: '2–4 weeks' },
    { name: 'North Las Vegas YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA locations in North Las Vegas near Nellis AFB. Military discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Luke AFB': [
    { name: 'Luke AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Luke AFB. F-35 training wing families. Priority for active duty. Subsidized rates by rank.', phone: '(623) 856-6550', waitlist: '2–4 weeks' },
    { name: 'West Valley YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 4.0, desc: 'YMCA locations in West Valley near Luke AFB. Military family discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Keesler AFB': [
    { name: 'Keesler AFB CDC (Main Post)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Keesler AFB. Training command and tech school families. Priority for active duty. Subsidized rates.', phone: '(228) 377-3474', waitlist: '2–4 weeks' },
    { name: 'Biloxi Area YMCA', type: 'Community CDC', ages: 'Infant – 12 yrs', rating: 3.9, desc: 'YMCA in Biloxi near Keesler AFB. Military family discount available.', phone: '', waitlist: 'None typically' },
  ],
  'Ramstein AB': [
    { name: 'Ramstein AB CDC (KMC)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'Air Force CDC in the Kaiserslautern Military Community. Priority for active duty. Subsidized rates. DSN contact for scheduling.', phone: 'DSN 480-5907', waitlist: '2–4 weeks' },
    { name: 'Ramstein School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school and summer care on post in KMC. Background-checked staff.', phone: 'DSN 480-5907', waitlist: '1–2 weeks' },
  ],
  'Yokota AB': [
    { name: 'Yokota AB CDC (CYSS)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Air Force CDC at Yokota AB, Japan. Priority for active duty. Subsidized rates based on rank.', phone: 'DSN 225-7633', waitlist: '2–4 weeks' },
    { name: 'Yokota School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.2, desc: 'Before/after school and summer programs on post at Yokota AB.', phone: 'DSN 225-7633', waitlist: 'None typically' },
  ],
  'Kadena AB': [
    { name: 'Kadena AB CDC (CYSS)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'Air Force CDC at Kadena AB, Okinawa. Priority for active duty. Subsidized rates by rank.', phone: 'DSN 634-1611', waitlist: '2–4 weeks' },
    { name: 'Kadena School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.3, desc: 'Before/after school and summer programs on post. Strong outdoor and cultural programming in Okinawa.', phone: 'DSN 634-1611', waitlist: '1–2 weeks' },
  ],
  'Osan AB': [
    { name: 'Osan AB CDC (CYSS)', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Air Force CDC at Osan AB, South Korea. Priority for active duty. Subsidized rates based on rank.', phone: 'DSN 784-1611', waitlist: '1–3 weeks' },
    { name: 'Osan School Age Services', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.1, desc: 'Before/after school care on post at Osan AB. Background-checked staff.', phone: 'DSN 784-1611', waitlist: 'None typically' },
  ],
  'USAG Stuttgart': [
    { name: 'Patch Barracks CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.5, desc: 'CYSS-operated CDC at Patch Barracks. Strong priority for dual-military and EFMP families. Hourly drop-in available.', phone: 'DSN 596-2940', waitlist: '2–4 weeks' },
    { name: 'Robinson Barracks SAS', type: 'School-Age / After-School', ages: '5–12 yrs', rating: 4.4, desc: 'School Age Services at Robinson Barracks. Before/after school care plus summer programs.', phone: 'DSN 421-3000', waitlist: 'None typically' },
  ],
  'USAG Wiesbaden': [
    { name: 'Hainerberg CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'CYSS-operated CDC in Hainerberg Housing Area. Priority for dual-military families.', phone: 'DSN 548-9800', waitlist: '2–4 weeks' },
  ],
  'USAG Bavaria': [
    { name: 'Vilseck CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'CYSS CDC at Vilseck (Rose Barracks). Rural Bavarian setting, strong PCS family support.', phone: 'DSN 476-2762', waitlist: '1–3 weeks' },
    { name: 'Grafenwoehr CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'CYSS CDC at Tower Barracks Grafenwoehr.', phone: 'DSN 475-7011', waitlist: '1–3 weeks' },
  ],
  'USAG Italy': [
    { name: 'Vicenza CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'CYSS CDC at Caserma Ederle / Del Din. Strong PCS transition support.', phone: 'CIV +39 0444-71-7000', waitlist: '2–4 weeks' },
  ],
  'NAS Whidbey Island': [
    { name: 'NAS Whidbey CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Navy CDC at NAS Whidbey. Priority for active duty. Small-island community feel.', phone: '(360) 257-2415', waitlist: '4–6 weeks' },
  ],
  'NS Bremerton': [
    { name: 'Bangor / Bremerton CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Navy CDC serving NS Bremerton / NBK Bangor. Priority for active duty and dual-military.', phone: '(360) 396-4203', waitlist: '4–8 weeks' },
  ],
  'NAS North Island': [
    { name: 'NAS North Island CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.2, desc: 'Navy CDC on Coronado. Priority for active duty. High demand — apply early.', phone: '(619) 545-9301', waitlist: '6–10 weeks' },
  ],
  'NS San Diego': [
    { name: 'NS San Diego CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.1, desc: 'Navy CDC at 32nd Street Naval Station. Priority for active duty.', phone: '(619) 556-7404', waitlist: '6–10 weeks' },
  ],
  'NAS Lemoore': [
    { name: 'NAS Lemoore CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.0, desc: 'Navy CDC at NAS Lemoore. Smaller-base feel; shorter waitlist than coastal NAS sites.', phone: '(559) 998-4481', waitlist: '2–4 weeks' },
  ],
  'NS Everett': [
    { name: 'NS Everett CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.1, desc: 'Navy CDC at NS Everett. Priority for active duty.', phone: '(425) 304-3144', waitlist: '4–6 weeks' },
  ],
  'MCB Hawaii': [
    { name: 'MCB Hawaii CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Marine Corps CDC at Kaneohe Bay. Priority for active duty. Hourly drop-in care available.', phone: '(808) 257-7781', waitlist: '4–8 weeks' },
  ],
  'MCAS Beaufort': [
    { name: 'MCAS Beaufort CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.2, desc: 'Marine Corps CDC at MCAS Beaufort. Smaller base community, shorter waitlists than larger MCAS sites.', phone: '(843) 228-7220', waitlist: '2–4 weeks' },
  ],
  'Buckley SFB': [
    { name: 'Buckley SFB CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.4, desc: 'Space Force CDC at Buckley SFB. Strong PCS transition support.', phone: '(720) 847-9355', waitlist: '4–6 weeks' },
  ],
  'Peterson SFB': [
    { name: 'Peterson SFB CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Space Force CDC at Peterson. Shared waitlist with Schriever SFB families.', phone: '(719) 556-7569', waitlist: '4–8 weeks' },
  ],
  'Patrick SFB': [
    { name: 'Patrick SFB CDC', type: 'On-Post CDC', ages: '6 wks – 5 yrs', rating: 4.3, desc: 'Space Force CDC at Patrick SFB. Space Coast community feel.', phone: '(321) 494-4747', waitlist: '4–6 weeks' },
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
  const branchChecklist = getTailoredChecklist(profile?.branch || 'Army', {
    component:     profile?.component || 'Active Duty',
    ordersType:    profile?.ordersType || '',
    hasDependents: !!profile?.hasDependents,
    hasChildren:   !!profile?.hasChildren,
    hasPets:       !!profile?.hasPets,
    moveType:      profile?.moveType || 'HHG',
    isOverseas:    !!profile?.isOverseas,
  });
  const [activePhase, setActivePhase] = useState(Object.keys(branchChecklist)[0]);

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

  const allTasks = Object.entries(branchChecklist).flatMap(([phase, tasks]) => tasks.map((_, i) => `${phase}-${i}`));
  const done = allTasks.filter(k => checklistItems[k]).length;
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  const phaseIsOverdue = daysUntil !== null && PHASE_WINDOWS[activePhase] && daysUntil < PHASE_WINDOWS[activePhase].overdueAt;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821' }}>PCS Checklist</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 900, background: theme.primary, color: '#FFF', borderRadius: 6, padding: '3px 8px', letterSpacing: '.06em' }}>
            {profile?.component === 'DoD Civilian' ? `DoD Civilian · ${profile?.branch || 'Army'}` : (profile?.branch || 'Army')}
          </div>
          <div style={{ fontSize: 10, color: '#56697C', fontWeight: 600 }}>{allTasks.length} tasks</div>
        </div>
      </div>
      <DynamicTimeline theme={theme} profile={profile} />

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
          <span>{'Orders Received'}</span><span>{'In Progress'}</span><span>{'Move Complete'}</span>
        </div>
        {daysUntil !== null && (
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: daysUntil < 0 ? '#C62828' : daysUntil < 30 ? '#E65100' : '#56697C', textAlign: 'center' }}>
            {daysUntil < 0 ? `${Math.abs(daysUntil)}d since departure` : `${daysUntil} days until departure`}
          </div>
        )}
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.keys(branchChecklist).map(phase => {
          const phaseTasks = branchChecklist[phase].map((_, i) => `${phase}-${i}`);
          const phaseDone = phaseTasks.filter(k => checklistItems[k]).length;
          const phaseOverdue = daysUntil !== null && PHASE_WINDOWS[phase] && daysUntil < PHASE_WINDOWS[phase].overdueAt && phaseDone < phaseTasks.length;
          return (
            <button key={phase} onClick={() => setActivePhase(phase)} className={`pcs-tab ${activePhase === phase ? 'is-active' : ''}`} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${phaseOverdue ? '#EF9A9A' : activePhase === phase ? theme.primary : '#E0E6EE'}`, background: activePhase === phase ? theme.primary : phaseOverdue ? '#FFF5F5' : '#FFF', color: activePhase === phase ? '#FFF' : phaseOverdue ? '#C62828' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: phaseOverdue || activePhase === phase ? 800 : 700, whiteSpace: 'nowrap' }}>
              {phaseOverdue ? '⚠ ' : ''}{phase} ({phaseDone}/{phaseTasks.length})
            </button>
          );
        })}
      </div>

      {/* Tasks */}
      <div>
        {(branchChecklist[activePhase] || []).map((task, i) => {
          const checked = !!checklistItems[`${activePhase}-${i}`];
          const taskOverdue = phaseIsOverdue && !checked;
          return (
            <div key={i} onClick={() => toggleCheckItem(activePhase, i)} className={`pcs-check-item ${checked ? 'is-checked' : ''} ${taskOverdue ? 'is-overdue' : ''}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, background: checked ? '#E8F5E9' : taskOverdue ? '#FFF5F5' : '#FFFFFF', border: `1px solid ${checked ? '#A5D6A7' : taskOverdue ? '#FFCDD2' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', marginBottom: 8, '--check-accent': theme.accent }}>
              <div className="pcs-check-item__box" style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#2E7D32' : taskOverdue ? '#E57373' : theme.accent}`, background: checked ? '#2E7D32' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
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
  const searchLocation = getInstallationSearchLocation(instName);
  const schoolFinderCards = officialSchoolCards(instName);

  // Child ages resolved from the onboarding profile. Declared here
  // (before the live-fetch effect and enrichment) so the grade-match
  // sort below can read it without hitting a temporal dead zone when
  // the live fetch returns schools synchronously from cache.
  const agesFromProfile = profile?.childAges?.length > 0
    ? profile.childAges.filter(a => !isNaN(Number(a))).map(Number)
    : (profile?.childrenAges || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  const gradeForAge = age => {
    if (age < 5) return 'Pre-K';
    if (age <= 10) return 'K-5';
    if (age <= 13) return '6-8';
    return '9-12';
  };

  // Live OSM-backed schools and childcare for the gaining installation.
  // Empty + fallback => keep the existing curated cards visible.
  const market = resolveMarket(profile);
  const [liveSchools, setLiveSchools] = useState({ status: 'idle', schools: [], fallback: false, reason: '' });
  useEffect(() => {
    const haveMarket = market.matched && (market.city || market.zip);
    if (!haveMarket && !instName) {
      setLiveSchools({ status: 'no-input', schools: [], fallback: true, reason: 'no-location' });
      return;
    }
    let cancelled = false;
    setLiveSchools(s => ({ ...s, status: 'loading' }));
    const params = new URLSearchParams();
    if (haveMarket) {
      if (market.city) params.set('city', market.city);
      if (market.state) params.set('state', market.state);
      if (market.zip) params.set('zip', market.zip);
    } else {
      params.set('address', instName);
    }
    params.set('radiusMiles', '25');
    if (profile?.language) params.set('lang', profile.language);
    fetch(apiUrl(`/api/schools-nearby?${params.toString()}`), { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : { schools: [], fallback: true })
      .then(data => {
        if (cancelled) return;
        setLiveSchools({
          status: 'ready',
          schools: Array.isArray(data?.schools) ? data.schools : [],
          fallback: !!data?.fallback,
          reason: data?.reason || '',
        });
      })
      .catch(err => {
        if (cancelled) return;
        setLiveSchools({ status: 'ready', schools: [], fallback: true, reason: `network-${err?.message || 'error'}` });
      });
    return () => { cancelled = true; };
  }, [market.city, market.state, market.zip, market.matched, instName]);
  // Sort + tag live OSM schools so the priority order is:
  //   1. Military / DoDEA / on-installation
  //   2. Schools whose grade range matches the child ages from
  //      onboarding (prioritized, not filtered - parents need to see
  //      siblings' options too)
  //   3. Then by ascending distance
  // Backend already promotes military-first; this layer adds the
  // grade-match prioritization on top.
  function gradeMatchesAge(grades, ages) {
    if (!grades || !ages.length) return false;
    const wantedBands = new Set();
    for (const a of ages) {
      if (a < 5) wantedBands.add('Pre-K');
      else if (a <= 10) wantedBands.add('K-5');
      else if (a <= 13) wantedBands.add('6-8');
      else wantedBands.add('9-12');
    }
    return [...wantedBands].some(b => grades.includes(b));
  }
  function fuzzyCuratedRating(name) {
    if (!schools.length) return null;
    const t = String(name || '').toLowerCase();
    const hit = schools.find(s => t.includes(String(s.name).toLowerCase().slice(0, 12)) || String(s.name).toLowerCase().includes(t.slice(0, 12)));
    return hit?.rating ?? null;
  }
  const enrichedLive = liveSchools.schools.map(s => ({
    ...s,
    gradeMatch: gradeMatchesAge(s.grades, agesFromProfile),
    curatedRating: fuzzyCuratedRating(s.name),
  }));
  enrichedLive.sort((a, b) => {
    if (a.isMilitary !== b.isMilitary) return a.isMilitary ? -1 : 1;
    if (a.gradeMatch !== b.gradeMatch) return a.gradeMatch ? -1 : 1;
    return a.distanceMiles - b.distanceMiles;
  });
  const liveK12 = enrichedLive.filter(s => s.categoryId === 'k12');
  const liveDaycare = enrichedLive.filter(s => s.categoryId === 'childcare' || s.categoryId === 'preschool');

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
          <button key={id} onClick={() => setSection(id)} className={`pcs-tab ${section === id ? 'is-active' : ''}`} style={{ flex: 1, padding: '8px 4px', borderRadius: 20, border: `1.5px solid ${section === id ? theme.primary : '#E0E6EE'}`, background: section === id ? theme.primary : '#FFF', color: section === id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            {label}
          </button>
        ))}
      </div>

      {/* K-12 Schools */}
      {section === 'schools' && (
        <>
          {/* Official school sources first - NCES, DoDEA, and
              MilitaryINSTALLATIONS are authoritative; we show them
              above the dynamic OSM cards so the verified path is
              always visible. */}
          {instName && schoolFinderCards.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>Official school sources</div>
              {schoolFinderCards.map(card => (
                <a key={card.name} href={card.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 10, borderRadius: 10, border: '1px solid #E0E6EE', marginTop: 8, textDecoration: 'none', background: '#F8FAFC' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821' }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.45, marginTop: 3 }}>{card.desc}</div>
                </a>
              ))}
            </div>
          )}
          {liveSchools.status === 'loading' && (
            <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 11, color: '#56697C' }}>
              Loading Google Maps school category cards near your installation...
            </div>
          )}
          {liveK12.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Schools near {instName} · {liveK12.length}
              </div>
              {agesFromProfile.length > 0 && (
                <div style={{ fontSize: 10, color: '#56697C', marginBottom: 8 }}>
                  Sorted: military / on-installation schools first, then grade-band matches for your child{agesFromProfile.length > 1 ? 'ren' : ''} (age{agesFromProfile.length > 1 ? 's' : ''} {agesFromProfile.join(', ')}), then by distance.
                </div>
              )}
              <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {liveK12.slice(0, 24).map(s => (
                  <a
                    key={s.id}
                    href={s.website || s.ncesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${s.name} information (${s.distanceMiles} miles away)`}
                    style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${s.isMilitary ? '#1565C0' : theme.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, flex: 1 }}>{s.name}</div>
                      <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{s.distanceMiles} mi</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {s.isMilitary && <span style={{ background: '#1565C0', color: '#FFFFFF', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>MILITARY / DoDEA</span>}
                      {s.gradeMatch && <span style={{ background: '#065F46', color: '#FFFFFF', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>MATCHES YOUR CHILD</span>}
                      <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>{s.type}</span>
                      {s.grades && <span style={{ background: '#ECFDF5', color: '#065F46', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{s.grades}</span>}
                      {s.operatorType && <span style={{ background: '#F3F4F6', color: '#243447', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{s.operatorType}</span>}
                    </div>
                    {/* Community rating: curated when we have it,
                        otherwise a search link the user can tap to read
                        GreatSchools / Niche / parent reviews. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#56697C' }}>
                      {s.curatedRating ? (
                        <>
                          <StarRating rating={s.curatedRating} />
                          <span style={{ fontSize: 10 }}>{s.curatedRating.toFixed(1)} (community)</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 10, fontStyle: 'italic' }}>Community rating: see reviews below</span>
                      )}
                    </div>
                    {s.address && <div style={{ fontSize: 11, color: '#56697C', marginBottom: 4 }}>{s.address}</div>}
                    <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>{s.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                      <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open {s.website ? 'school website' : 'NCES record'}</span>
                      <a href={s.ratingsSearchUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="card-cta card-cta--ghost" style={{ fontSize: 10 }}>Reviews</a>
                      <a href={s.ncesUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="card-cta card-cta--ghost" style={{ fontSize: 10 }}>NCES</a>
                    </div>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5, marginTop: 6 }}>
                Google Maps category cards within 25 miles of your installation. Military / DoDEA / on-installation schools appear first. Confirm enrollment, district zoning, and parent reviews on NCES SchoolSearch or the local school website before deciding.
              </div>
            </section>
          )}
          {filteredSchools.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#888' }}>Sort curated:</span>
              {[['rating', 'Highest Rated'], ['name', 'A–Z']].map(([id, label]) => (
                <button key={id} onClick={() => setSortBy(id)} className={`pcs-chip ${sortBy === id ? 'is-active' : ''}`} style={{ padding: '5px 10px', borderRadius: 14, border: `1.5px solid ${sortBy === id ? theme.primary : '#E0E6EE'}`, background: sortBy === id ? theme.primary : '#FFF', color: sortBy === id ? '#FFF' : '#56697C', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {!instName && <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>Complete onboarding to see schools near your installation.</div>}
          {filteredSchools.map((school, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{school.name}</div>
                <span style={{ background: `${theme.primary}20`, color: theme.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>Grades {school.grades}</span>
              </div>
              <div style={{ marginBottom: 6 }}><StarRating rating={school.rating} /></div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{school.desc}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>📍 {school.city}</div>
              <a href={school.url || officialSchoolSearchUrl(school.name, school.city)} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>{school.url ? 'Visit School Website' : 'Find Official School Info'}</a>
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
          {liveSchools.status === 'loading' && (
            <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 11, color: '#56697C' }}>
              Loading Google Maps childcare cards near your installation...
            </div>
          )}
          {liveDaycare.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Childcare near {instName} · {liveDaycare.length}
              </div>
              <div style={{ fontSize: 10, color: '#56697C', marginBottom: 8 }}>
                On-installation CDCs / Child Development Centers come up first when nearby. For DoD priority waitlist enrollment use MilitaryChildCare.com below.
              </div>
              <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {liveDaycare.slice(0, 24).map(s => (
                  <a
                    key={s.id}
                    href={s.website || s.ratingsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${s.name} information (${s.distanceMiles} miles away)`}
                    style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${s.isMilitary ? '#1565C0' : theme.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, flex: 1 }}>{s.name}</div>
                      <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{s.distanceMiles} mi</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {s.isMilitary && <span style={{ background: '#1565C0', color: '#FFFFFF', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>ON INSTALLATION</span>}
                      <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>{s.type}</span>
                      {s.grades && <span style={{ background: '#ECFDF5', color: '#065F46', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{s.grades}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#56697C', marginBottom: 6, fontStyle: 'italic' }}>
                      Community rating: see parent reviews below
                    </div>
                    {s.address && <div style={{ fontSize: 11, color: '#56697C', marginBottom: 4 }}>{s.address}</div>}
                    <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>{s.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: theme.primary, color: '#FFF', fontSize: 11, fontWeight: 800, padding: '6px 10px', borderRadius: 6 }}>Open {s.website ? 'website' : 'reviews'}</span>
                      <a href={s.ratingsSearchUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', background: '#FFFFFF', color: theme.primary, border: `1px solid ${theme.primary}`, fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 5 }}>Reviews</a>
                      {s.phone && <span style={{ background: '#FFFFFF', color: theme.primary, border: `1px solid ${theme.primary}`, fontSize: 10, fontWeight: 800, padding: '5px 9px', borderRadius: 5 }}>{s.phone}</span>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
          {daycares.length === 0 && liveDaycare.length === 0 && instName && (
            <>
              <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 14, textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 12 }}>
                No curated CDC card is stored for this installation yet. The Google Maps category cards below open with the locality pre-filtered so you see real childcare options around {instName}.
              </div>
              <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Child Development Centers (CDCs)', query: `child development center CDC near ${instName}` },
                  { label: 'Preschools & daycare',            query: `preschools and daycare near ${instName}` },
                  { label: 'Family child care providers',     query: `family child care provider near ${instName}` },
                  { label: 'After-school programs',           query: `after-school programs near ${instName}` },
                ].map((cat, idx) => (
                  <a key={idx}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cat.query)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{cat.label} near {instName}</div>
                    <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
                      Curated Google Maps search restricted to the area around your gaining installation. Opens with real providers, photos, hours, and reviews so you can call ahead and confirm availability.
                    </div>
                    <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open map view</span>
                  </a>
                ))}
              </div>
            </>
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
            <a href="https://militarychildcare.com/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>MilitaryChildCare.com</a>
            <a href="https://www.militaryonesource.mil/parenting/child-care/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.secondary }}>Military OneSource Child Care</a>
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
            <button onClick={handleSearch} style={{ width: '100%', padding: '12px', borderRadius: 10, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Search Official School Sources →</button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#56697C', marginBottom: 10 }}>SCHOOL FINDER RESOURCES</div>
          {[
            { name: 'NCES School Search', desc: 'Official school search by name, location, district, and school characteristics.', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
            { name: 'DoDEA School Finder', desc: 'Find DoDEA schools on military installations worldwide', url: 'https://www.dodea.edu/find-your-school' },
            { name: 'NCES School Finder', desc: 'National Center for Education Statistics school search', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
            { name: 'Military OneSource School Liaison Program', desc: 'Official education transition support for military-connected children', url: 'https://www.militaryonesource.mil/benefits/school-liaison-program/' },
            { name: 'School Liaison Officers (SLO)', desc: 'Find your installation SLO - free school transition support', url: 'https://www.militaryonesource.mil/benefits/school-liaison-program/' },
          ].filter(r => r.url).map((r, idx) => (
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
  const searchLocation = getInstallationSearchLocation(instName);
  const bubbleLinks = veteranBusinessBubbleLinks(instName).filter(link => link.url);
  const discoveryCards = veteranBusinessDiscoveryCards(instName);
  const displayBiz = discoveryCards.filter(card => card.url);
  const filtered = filter === 'All' ? displayBiz : displayBiz.filter(b => b.category === filter);
  const visibleCards = filtered.length ? filtered : displayBiz;

  // Live veteran-owned business lookup (SAM.gov via backend proxy).
  // The endpoint returns { businesses, fallback, reason } and never
  // throws an error status the user sees - empty businesses + fallback
  // means "show the existing static source-link cards below."
  const liveMarket = resolveMarket(profile);
  const [liveBiz, setLiveBiz] = useState({ status: 'idle', businesses: [], fallback: false, reason: '' });
  // 'all' | 'business' | 'service' - splits SAM.gov entities by primary
  // NAICS classification returned from the backend.
  const [industryFilter, setIndustryFilter] = useState('all');
  // Sub-tab inside the Veterans category: live SAM.gov listings vs
  // the SBA/VA static resource cards. User explicitly asked to keep
  // these split.
  const [vetTab, setVetTab] = useState('listings');
  useEffect(() => {
    if (!liveMarket.matched || (!liveMarket.city && !liveMarket.zip)) {
      setLiveBiz({ status: 'no-market', businesses: [], fallback: true, reason: 'unknown-installation' });
      return;
    }
    let cancelled = false;
    setLiveBiz(s => ({ ...s, status: 'loading' }));
    const params = new URLSearchParams();
    if (liveMarket.city) params.set('city', liveMarket.city);
    if (liveMarket.state) params.set('state', liveMarket.state);
    if (liveMarket.zip) params.set('zip', liveMarket.zip);
    fetch(apiUrl(`/api/vet-businesses?${params.toString()}`), { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : { businesses: [], fallback: true, reason: `http-${r.status}` })
      .then(data => {
        if (cancelled) return;
        setLiveBiz({
          status: 'ready',
          businesses: Array.isArray(data?.businesses) ? data.businesses : [],
          fallback: !!data?.fallback,
          reason: data?.reason || '',
        });
      })
      .catch(err => {
        if (cancelled) return;
        setLiveBiz({ status: 'ready', businesses: [], fallback: true, reason: `network-${err?.message || 'error'}` });
      });
    return () => { cancelled = true; };
  }, [liveMarket.city, liveMarket.state, liveMarket.zip, liveMarket.matched]);

  const NATIONAL_DIRS = [
    { name: 'SBA Veteran-Owned Businesses', icon: 'SBA', desc: 'Official SBA veteran entrepreneurship, training, funding, and contracting guidance.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses' },
    { name: 'VetCert Small Business Search', icon: 'VOSB', desc: 'Official SBA certification portal and search for verified VOSB and SDVOSB firms.', url: 'https://veterans.certify.sba.gov/' },
    { name: 'Veterans Business Outreach Centers', icon: 'VBOC', desc: 'Official SBA VBOC locator for free entrepreneurship counseling and training.', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program' },
    { name: 'VA OSDBU', icon: 'VA', desc: 'Official VA small and veteran business program information.', url: 'https://www.va.gov/osdbu/index.asp' },
    { name: 'SAM.gov Entity Information', icon: 'SAM', desc: 'Official federal entity search and public registration information.', url: 'https://sam.gov/entity-information' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Veteran Owned & Veteran Operated Businesses</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 12 }}>
        {instName ? <>Veteran-owned business discovery near <strong>{searchLocation}</strong></> : 'Complete onboarding to tailor veteran-owned business discovery to your installation.'}
      </div>

      {/* Active Listings / SBA Resources sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'listings', label: 'Active Listings' },
          { id: 'resources', label: 'SBA Resources' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setVetTab(t.id)}
            className={`pcs-tab ${vetTab === t.id ? 'is-active' : ''}`}
            style={{
              padding: '8px 16px', borderRadius: 20,
              border: `1.5px solid ${vetTab === t.id ? theme.primary : '#D6E0EA'}`,
              background: vetTab === t.id ? theme.primary : '#FFFFFF',
              color: vetTab === t.id ? '#FFFFFF' : '#243447',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {vetTab === 'resources' && (<>
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

      </>)}

      {vetTab === 'listings' && (<>
      {/* Live veteran-owned business listings (SAM.gov proxy) */}
      {liveBiz.status === 'loading' && (
        <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: '#56697C' }}>
          Looking up verified veteran-owned businesses near {searchLocation || 'your gaining installation'}...
        </div>
      )}
      {liveBiz.status === 'ready' && liveBiz.businesses.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em' }}>
            VETERAN-OWNED BUSINESSES NEAR {searchLocation?.toUpperCase() || 'YOUR INSTALLATION'} ({liveBiz.businesses.length})
          </div>
          {/* Industry filter: All / Business (goods) / Service. The
              backend tags each entity from its primary NAICS code. */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${liveBiz.businesses.length})` },
              { id: 'business', label: `Business · Goods (${liveBiz.businesses.filter(b => b.industry === 'business').length})` },
              { id: 'service', label: `Service (${liveBiz.businesses.filter(b => b.industry === 'service').length})` },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setIndustryFilter(opt.id)}
                className={`pcs-chip ${industryFilter === opt.id ? 'is-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: 18,
                  border: `1.5px solid ${industryFilter === opt.id ? theme.primary : '#D6E0EA'}`,
                  background: industryFilter === opt.id ? theme.primary : '#FFFFFF',
                  color: industryFilter === opt.id ? '#FFFFFF' : '#243447',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div data-dynamic-card="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {liveBiz.businesses.filter(b => industryFilter === 'all' || b.industry === industryFilter).map(biz => (
              <a
                key={biz.id}
                href={biz.samUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block' }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{biz.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  <span style={{ background: biz.industry === 'service' ? '#E0F2FE' : '#ECFDF5', color: biz.industry === 'service' ? '#075985' : '#065F46', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {biz.industry === 'service' ? 'Service' : 'Business'}
                  </span>
                  {biz.businessTypes?.slice(0, 2).map((bt, i) => (
                    <span key={i} style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{bt}</span>
                  ))}
                </div>
                {biz.naicsDesc && (
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.4, marginBottom: 4 }}>{biz.naicsDesc}</div>
                )}
                {(biz.address || biz.city) && (
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45, marginBottom: 4 }}>
                    {[biz.address, [biz.city, biz.state, biz.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                  </div>
                )}
                {biz.phone && <div style={{ fontSize: 11, color: '#56697C', marginBottom: 6 }}>{biz.phone}</div>}
                <span className="card-cta" style={{ '--cta-color': theme.primary, marginTop: 8, fontSize: 10 }}>View on SAM.gov</span>
              </a>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5, marginTop: 8 }}>
            Listings are pulled from the federal SAM.gov directory and filtered for veteran-owned and service-disabled veteran-owned businesses. Confirm a business is still active on SAM.gov before any contract or purchase.
          </div>
        </section>
      )}
      {liveBiz.status === 'ready' && liveBiz.businesses.length === 0 && liveBiz.fallback && (() => {
        // No live SAM.gov results. Instead of an empty banner, show a
        // grid of search-CTA cards that DO populate without an API
        // key - each card deep-links to a real veteran-owned business
        // directory pre-filtered by the gaining installation's city.
        const loc = encodeURIComponent(searchLocation || 'United States');
        const ctaCards = [
          { name: `Verified veteran-owned businesses near ${searchLocation || 'your installation'}`, url: `https://veterans.certify.sba.gov/?Keywords=&Location=${loc}`, type: 'SBA VetCert', desc: 'Search the official SBA VetCert registry for verified VOSB and SDVOSB firms in your area.' },
          { name: `SAM.gov entities near ${searchLocation || 'your installation'}`, url: `https://sam.gov/search/?index=ei&page=1&pageSize=25&sort=-modifiedDate&q=${loc}&sfm[entity-information][isCalculated]=true`, type: 'SAM.gov', desc: 'Search active federal SAM.gov entity records by location. Filter for veteran-owned business types after opening.' },
          { name: `Veteran-owned businesses on Google`, url: `https://www.google.com/search?q=${encodeURIComponent(`veteran owned businesses near ${searchLocation || 'me'} site:sba.gov OR site:sam.gov OR site:va.gov`)}`, type: 'Google', desc: 'Google search restricted to SBA, SAM, and VA sources for veteran-owned businesses in the area.' },
          { name: 'Veterans Business Outreach Centers near you', url: `https://www.google.com/search?q=${encodeURIComponent(`VBOC ${searchLocation || ''} site:sba.gov`)}`, type: 'VBOC', desc: 'Find your local VBOC for free veteran entrepreneurship counseling, training, and referrals.' },
          { name: 'VA OSDBU resources', url: 'https://www.va.gov/osdbu/', type: 'VA', desc: 'Official VA Office of Small and Disadvantaged Business Utilization - veteran-owned business assistance.' },
        ];
        return (
          <section style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Search verified veteran-owned businesses
            </div>
            <div data-dynamic-card="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {ctaCards.map(c => (
                <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block' }}>
                  <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>{c.type}</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginTop: 6, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.4 }}>{c.desc}</div>
                  <span className="card-cta" style={{ '--cta-color': theme.primary, marginTop: 8 }}>Open search</span>
                </a>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5, marginTop: 8 }}>
              These deep-link directly into the official SBA VetCert, SAM.gov, and VA OSDBU search interfaces with your gaining installation pre-filled. Verify each business's certification status before contracting.
            </div>
          </section>
        );
      })()}

      </>)}

      {vetTab === 'resources' && (<>
      {/* Active category link bubbles */}
      {bubbleLinks.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', marginBottom: 8, letterSpacing: '.06em' }}>ACTIVE CATEGORY LINKS</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {bubbleLinks.map(bubble => (
              <a
                key={bubble.category}
                href={bubble.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setFilter(bubble.category)}
                aria-label={`Open ${bubble.label}`}
                style={{
                  flexShrink: 0,
                  minWidth: 136,
                  maxWidth: 210,
                  padding: '9px 12px',
                  borderRadius: 16,
                  border: `1.5px solid ${filter === bubble.category ? theme.primary : '#D6E0EA'}`,
                  background: filter === bubble.category ? theme.primary : '#FFFFFF',
                  color: filter === bubble.category ? '#FFFFFF' : '#243447',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 800,
                  whiteSpace: 'normal',
                  lineHeight: 1.25,
                  textDecoration: 'none',
                  boxShadow: filter === bubble.category ? '0 6px 14px rgba(0,0,0,0.14)' : 'none',
                }}
              >
                <span style={{ display: 'block', marginBottom: 4 }}>{bubble.label}</span>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, opacity: 0.82 }}>Open active source</span>
              </a>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45 }}>
            Each bubble opens an official SBA, VA, or SAM.gov resource. The Search, Food, and Home Services cards now use the same verified-source pattern as the SBA and VA cards.
          </div>
        </div>
      )}

      {visibleCards.map((biz, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{biz.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{biz.name}</div>
              <span style={{ background: '#F3F4F6', color: '#56697C', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{biz.category}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{biz.desc}</div>
          <a href={biz.url} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>
            Open Source
          </a>
        </div>
      ))}
      </>)}
    </div>
  );
}


const INSTALLATION_COLLEGES = {
  'Fort Liberty': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: 'https://www.methodist.edu/admissions/apply/', siteUrl: 'https://www.methodist.edu' },
    { name: 'Fayetteville State University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'HBCU with affordable in-state tuition. Robust veteran services. Strong nursing, social work, and criminal justice programs.', applyUrl: 'https://www.uncfsu.edu/', siteUrl: 'https://www.uncfsu.edu' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. Tuition Assistance accepted.", applyUrl: 'https://www.faytechcc.edu/', siteUrl: 'https://www.faytechcc.edu' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Top-ranked liberal arts and professional school near Fort Liberty. Pharmacy, law, and business schools. Military tuition rates.', applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
    { name: 'UNC Pembroke', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'Affordable UNC system university 30 miles from post. Business, education, and public administration programs.', applyUrl: 'https://www.uncp.edu/admissions/apply', siteUrl: 'https://www.uncp.edu' },
  ],
  'Fort Bragg': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: 'https://www.methodist.edu/admissions/apply/', siteUrl: 'https://www.methodist.edu' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. TA accepted.", applyUrl: 'https://www.faytechcc.edu/', siteUrl: 'https://www.faytechcc.edu' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Pharmacy, law, and business schools. Military tuition rates available.', applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
  ],
  'Fort Campbell': [
    { name: 'Austin Peay State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Ranked most military-friendly in Tennessee. Located in Clarksville, minutes from the main gate. Online and in-person options. TA accepted.', applyUrl: 'https://www.apsu.edu/admissions/apply/', siteUrl: 'https://www.apsu.edu' },
    { name: 'Volunteer State Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees in healthcare, business, and technology. Transfer pathway to Tennessee universities.', applyUrl: 'https://www.volstate.edu/admissions/', siteUrl: 'https://www.volstate.edu' },
    { name: 'Middle Tennessee State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Over 300 degree programs including aerospace, business, and recording industry. 45 minutes from post.', applyUrl: 'https://www.mtsu.edu/admissions/apply.php', siteUrl: 'https://www.mtsu.edu' },
    { name: 'Nashville State Community College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Technical certificates and associate degrees. Strong IT, business, and healthcare programs. TA-eligible.', applyUrl: 'https://www.nscc.edu/admissions/apply-to-nscc/', siteUrl: 'https://www.nscc.edu' },
  ],
  'Fort Cavazos': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college. On-post classes, flexible schedules, and TA accepted. Serves thousands of Fort Cavazos soldiers annually.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online classes. Strong business and computer science.', applyUrl: 'https://www.tamuct.edu/admissions/', siteUrl: 'https://www.tamuct.edu' },
    { name: 'University of Mary Hardin-Baylor', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Belton, TX. Nursing, business, and education programs. Military scholarships and veteran services.', applyUrl: 'https://www.umhb.edu/admissions/apply/', siteUrl: 'https://www.umhb.edu' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Workforce-focused associate degrees and certificates. Healthcare, law enforcement, and technology programs. Low tuition.', applyUrl: 'https://www.templejc.edu/apply/', siteUrl: 'https://www.templejc.edu' },
  ],
  'Fort Hood': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college on-post. TA accepted. Associates degrees and certificates.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online options.', applyUrl: 'https://www.tamuct.edu/admissions/', siteUrl: 'https://www.tamuct.edu' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees near Fort Hood. Healthcare, IT, and business.', applyUrl: 'https://www.templejc.edu/apply/', siteUrl: 'https://www.templejc.edu' },
  ],
  'Joint Base Lewis-McChord': [
    { name: 'University of Washington Tacoma', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'UW system campus in Tacoma. Business, engineering, and nursing programs. Active veteran community. 15 minutes from JBLM.', applyUrl: 'https://apply.washington.edu/', siteUrl: 'https://www.tacoma.uw.edu' },
    { name: 'Tacoma Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'High transfer-rate community college near JBLM. Strong IT, business, and healthcare pathways. TA-eligible.', applyUrl: 'https://www.tacomacc.edu/admissions/', siteUrl: 'https://www.tacomacc.edu' },
    { name: 'Pierce College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Two campuses near JBLM. Aviation, business, and computer science. Military welcome center on campus.', applyUrl: 'https://www.pierce.ctc.edu/admissions/', siteUrl: 'https://www.pierce.ctc.edu' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Liberal arts university in Tacoma. Strong nursing, business, and education programs. Yellow Ribbon certified.', applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
    { name: 'University of Puget Sound', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly ranked private liberal arts college. Business, engineering, and occupational therapy. Yellow Ribbon program.', applyUrl: 'https://www.pugetsound.edu/admission/', siteUrl: 'https://www.pugetsound.edu' },
  ],
  'Fort Carson': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus adjacent to Fort Carson. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: 'https://admissions.uccs.edu/apply/', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: 'https://www.pikespeak.edu/admissions/apply-to-ppsc/', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
    { name: 'Colorado Technical University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Career-focused IT, business, and criminal justice degrees. Flexible online and on-campus in Colorado Springs. Military-friendly.', applyUrl: 'https://www.coloradotech.edu/admissions/', siteUrl: 'https://www.coloradotech.edu' },
  ],
  'Fort Bliss': [
    { name: 'University of Texas at El Paso', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university minutes from Fort Bliss. Engineering, nursing, and business programs. Strong veteran support office and military TA.', applyUrl: 'https://www.utep.edu/admissions/', siteUrl: 'https://www.utep.edu' },
    { name: 'El Paso Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Five campuses near Fort Bliss. Affordable workforce training, associate degrees, and transfer prep. TA-eligible.', applyUrl: 'https://www.epcc.edu/Admissions/', siteUrl: 'https://www.epcc.edu' },
    { name: 'New Mexico State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Land-grant research university in Las Cruces, NM (45 min). Engineering, agriculture, and business programs. Military-friendly.', applyUrl: 'https://admissions.nmsu.edu/apply/', siteUrl: 'https://www.nmsu.edu' },
  ],
  'Fort Stewart': [
    { name: 'Georgia Southern University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Large public university in Statesboro, GA. Business, education, engineering, and health sciences. Military discount and veteran services.', applyUrl: 'https://admissions.georgiasouthern.edu/apply/', siteUrl: 'https://www.georgiasouthern.edu' },
    { name: 'Savannah State University', type: 'Public', degree: '4-Year University', rating: 3.4, desc: "Georgia's oldest HBCU in Savannah, 40 miles from post. Business, social work, and marine sciences.", applyUrl: 'https://www.savannahstate.edu/admissions/', siteUrl: 'https://www.savannahstate.edu' },
    { name: 'Coastal Pines Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical certificates and associate degrees in healthcare, IT, and welding near Fort Stewart. TA-eligible.', applyUrl: 'https://www.coastalpines.edu/admissions/', siteUrl: 'https://www.coastalpines.edu' },
    { name: 'College of Coastal Georgia', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Small public university in Brunswick, GA. Nursing, business, and liberal studies. Veteran-friendly with flexible scheduling.', applyUrl: 'https://www.ccga.edu/admissions/apply/', siteUrl: 'https://www.ccga.edu' },
  ],
  'Fort Drum': [
    { name: 'Jefferson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'SUNY community college in Watertown — the top choice for Fort Drum soldiers. Business, IT, and health programs. TA accepted.', applyUrl: 'https://www.sunyjefferson.edu/admissions/apply/', siteUrl: 'https://www.sunyjefferson.edu' },
    { name: 'SUNY Polytechnic Institute', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'SUNY technology campus. Business, computer science, and nursing programs. Yellow Ribbon participant.', applyUrl: 'https://www.sunypoly.edu/admissions/', siteUrl: 'https://www.sunypoly.edu' },
    { name: 'Clarkson University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Top-ranked private engineering and business university in Potsdam, NY. STEM-focused. Financial aid and Yellow Ribbon.', applyUrl: 'https://www.clarkson.edu/admissions/apply/', siteUrl: 'https://www.clarkson.edu' },
  ],
  'Naval Station Norfolk': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Dedicated Monarch Military Center. Engineering, business, and education degrees. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Strong nursing, business, and IT. Transfer partnerships with ODU and Virginia universities.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology programs. Veteran-friendly campus.', applyUrl: 'https://www.nsu.edu/admissions/', siteUrl: 'https://www.nsu.edu' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus options. Military tuition discount.', applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
    { name: 'Virginia Wesleyan University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Liberal arts university in Norfolk/Virginia Beach. Small classes and strong veteran services. Yellow Ribbon certified.', applyUrl: 'https://www.vwu.edu/admission/apply/', siteUrl: 'https://www.vwu.edu' },
  ],
  'Marine Corps Base Camp Lejeune': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'The primary college for Camp Lejeune Marines. Located in Jacksonville, NC. On-post classes available. TA accepted.', applyUrl: 'https://www.coastalcarolina.cc.nc.us/apply/', siteUrl: 'https://www.coastalcarolina.cc.nc.us' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with a Jacksonville campus near Camp Lejeune. Business, criminal justice, and education.', applyUrl: 'https://www.umo.edu/admissions/apply/', siteUrl: 'https://www.umo.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Top-ranked business, nursing, and engineering programs. 1 hour from Camp Lejeune.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
  ],
  'Camp Pendleton': [
    { name: 'MiraCosta College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Top-rated community college adjacent to Camp Pendleton. On-post classes, strong veteran services. TA and Post-9/11 GI Bill accepted.', applyUrl: 'https://www.miracosta.edu/admissions/', siteUrl: 'https://www.miracosta.edu' },
    { name: 'California State University San Marcos', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CSU campus near Camp Pendleton. Business, nursing, and STEM programs. Strong veteran resource center and military scholarships.', applyUrl: 'https://www.csusm.edu/admissions/', siteUrl: 'https://www.csusm.edu' },
    { name: 'Palomar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in San Marcos. 200+ degree and certificate programs. Transfer pathway to UC and CSU systems.', applyUrl: 'https://www2.palomar.edu/admissions/', siteUrl: 'https://www.palomar.edu' },
    { name: 'University of San Diego', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Highly ranked private Catholic university. Business, law, and engineering. Yellow Ribbon participant. 35 miles from post.', applyUrl: 'https://admissions.sandiego.edu/apply/', siteUrl: 'https://www.sandiego.edu' },
  ],
  'Fort Sam Houston': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science programs. Active veteran services and military tuition discounts.', applyUrl: 'https://apply.utsa.edu/', siteUrl: 'https://www.utsa.edu' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts programs. TA accepted. Low tuition.', applyUrl: 'https://www.alamo.edu/spc/admissions/apply/', siteUrl: 'https://www.alamo.edu/spc/' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: 'https://www.trinity.edu/admissions/apply/', siteUrl: 'https://www.trinity.edu' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: 'https://www.alamo.edu/sac/admissions/apply/', siteUrl: 'https://www.alamo.edu/sac/' },
  ],
  'Camp Humphreys': [
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading university for OCONUS military members. On-post classes at Camp Humphreys plus fully online options. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted. Same curriculum as Fort Cavazos.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation, aerospace engineering, and business programs. On-post classes available at major installations.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs: intelligence, security management, and emergency management.', applyUrl: 'https://www.amu.apus.edu/admission/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'Ramstein Air Base': [
    { name: 'University of Maryland Global Campus Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: "Europe's leading military-focused university. On-base classes at Ramstein and surrounding installations. TA and GI Bill accepted.", applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Only accredited American residential university campus in Europe. Aviation management and aerospace engineering programs.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Alabama-based public university with classes at Ramstein AB. Business, criminal justice, and social science programs.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Kadena Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Kadena AB. Business, cybersecurity, and public safety management. TA and GI Bill.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation science and aerospace engineering with on-base courses. Popular with Air Force members at Kadena.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Yokota Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC at Yokota AB. Business administration, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'On-base associate degrees and certificates. Flexible and TA-eligible. Same high-quality programs as CONUS campuses.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace management degrees available at Yokota. Online with on-base support sessions.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Fort Meade': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Fort Meade. Engineering, business, and cybersecurity. Strong research and intelligence programs.', applyUrl: 'https://apply.umd.edu/', siteUrl: 'https://www.umd.edu' },
    { name: 'Anne Arundel Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'AACC in Arnold, MD. Strong IT, cybersecurity, and business programs near Fort Meade and NSA. TA accepted.', applyUrl: 'https://www.aacc.edu/admissions/', siteUrl: 'https://www.aacc.edu' },
    { name: 'Capitol Technology University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'STEM-focused university in Laurel, MD. Cybersecurity, aerospace, and engineering management. Popular with intelligence community.', applyUrl: 'https://www.captechu.edu/admissions/', siteUrl: 'https://www.captechu.edu' },
  ],
  'Schofield Barracks': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and tropical agriculture. 30 minutes from Schofield Barracks.", applyUrl: 'https://admissions.hawaii.edu/apply/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Pearl City, close to Schofield. Liberal arts, healthcare, and pre-professional pathways. TA accepted.', applyUrl: 'https://www.leeward.hawaii.edu/future-students/', siteUrl: 'https://www.leeward.hawaii.edu' },
  ],
  // ── CONUS Army (additional) ──────────────────────────────────────────────────
  'Fort Moore': [
    { name: 'Columbus State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Columbus, GA. Business, education, and health sciences. Strong veteran services and TA-eligible.', applyUrl: 'https://admissions.columbusstate.edu/apply/', siteUrl: 'https://www.columbusstate.edu' },
    { name: 'Columbus Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Workforce-focused technical college. Healthcare, IT, and skilled trades. TA accepted. Minutes from Fort Moore.', applyUrl: 'https://www.columbustech.edu/admissions/', siteUrl: 'https://www.columbustech.edu' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university in Montgomery, AL. Business, education, and liberal arts. Military-friendly campus.', applyUrl: 'https://www.aum.edu/admissions/apply/', siteUrl: 'https://www.aum.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly public university with campus near Fort Moore. Business, criminal justice, and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Fort Eisenhower': [
    { name: 'Augusta University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Georgia public research university in Augusta. Medical, nursing, and cybersecurity programs. Strong ties to Fort Eisenhower.', applyUrl: 'https://www.augusta.edu/admissions/apply.php', siteUrl: 'https://www.augusta.edu' },
    { name: 'Augusta Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college with IT, healthcare, and welding programs. TA accepted. Located minutes from Fort Eisenhower.', applyUrl: 'https://www.augustatech.edu/admissions/', siteUrl: 'https://www.augustatech.edu' },
    { name: 'Paine College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Augusta, GA. Business, education, and humanities. Supportive veteran community and GI Bill accepted.', applyUrl: 'https://www.paine.edu/admissions/', siteUrl: 'https://www.paine.edu' },
    { name: 'University of South Carolina Aiken', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC system campus in Aiken, SC. Business, nursing, and education. Veteran-friendly with flexible scheduling.', applyUrl: 'https://www.usca.edu/admissions/apply/', siteUrl: 'https://www.usca.edu' },
  ],
  'Fort Gregg-Adams': [
    { name: 'Virginia State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Petersburg, VA. Business, engineering technology, and education. Active veteran services and TA-eligible.', applyUrl: 'https://www.vsu.edu/admissions/apply/', siteUrl: 'https://www.vsu.edu' },
    { name: 'Richard Bland College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'William & Mary-affiliated college in Petersburg. Transfer pathways to Virginia universities. Affordable and TA-eligible.', applyUrl: 'https://www.rbc.edu/admissions/apply/', siteUrl: 'https://www.rbc.edu' },
    { name: 'Virginia Commonwealth University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Research university in Richmond. Arts, health sciences, and business. 25 minutes from Fort Gregg-Adams. Yellow Ribbon certified.', applyUrl: 'https://admissions.vcu.edu/apply/', siteUrl: 'https://www.vcu.edu' },
    { name: 'John Tyler Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Gregg-Adams. Nursing, IT, and business programs. Transfer partner with VCU and other VA universities.', applyUrl: 'https://www.reynolds.edu/admissions/apply/', siteUrl: 'https://www.reynolds.edu' },
  ],
  'Fort Knox': [
    { name: 'Elizabethtown Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'KCTCS college in Elizabethtown, KY. Healthcare, business, and skilled trades. TA accepted. Closest college to Fort Knox.', applyUrl: 'https://elizabethtown.kctcs.edu/apply/', siteUrl: 'https://elizabethtown.kctcs.edu' },
    { name: 'University of Louisville', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Louisville, KY. Business, engineering, and health sciences. 45 minutes from Fort Knox. TA and GI Bill.', applyUrl: 'https://admissions.louisville.edu/apply/', siteUrl: 'https://www.louisville.edu' },
    { name: 'Western Kentucky University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Bowling Green. Business, nursing, and criminal justice. Military-friendly campus with veteran services.', applyUrl: 'https://www.wku.edu/admissions/', siteUrl: 'https://www.wku.edu' },
    { name: 'Campbellsville University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Christian university in Campbellsville, KY. Business, education, and music. Yellow Ribbon participant. Veteran-friendly.', applyUrl: 'https://www.campbellsville.edu/admissions/apply/', siteUrl: 'https://www.campbellsville.edu' },
  ],
  'Fort Jackson': [
    { name: 'University of South Carolina', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship research university in Columbia, SC. Business, engineering, and nursing. 10 minutes from Fort Jackson. TA and GI Bill accepted.', applyUrl: 'https://sc.edu/admissions/undergraduate/apply/', siteUrl: 'https://www.sc.edu' },
    { name: 'Columbia International University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Faith-based university in Columbia. Biblical studies, counseling, and education. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.ciu.edu/admissions/apply/', siteUrl: 'https://www.ciu.edu' },
    { name: 'Midlands Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college near Fort Jackson. Nursing, IT, and business programs. TA-eligible with strong transfer pathways.', applyUrl: 'https://www.midlandstech.edu/admissions/', siteUrl: 'https://www.midlandstech.edu' },
    { name: 'Benedict College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Columbia, SC. Business, computer science, and social work. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://www.benedict.edu/admissions/apply/', siteUrl: 'https://www.benedict.edu' },
  ],
  'Fort Leonard Wood': [
    { name: 'Missouri University of Science & Technology', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Top-ranked engineering and science university in Rolla, MO. STEM-focused with strong research programs. TA and GI Bill accepted.', applyUrl: 'https://apply.mst.edu/', siteUrl: 'https://www.mst.edu' },
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university with military-friendly programs. Business, education, and technology. Flexible online and in-person options.', applyUrl: 'https://www.ucmo.edu/admissions/apply/', siteUrl: 'https://www.ucmo.edu' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture programs. TA accepted. Affordable tuition.', applyUrl: 'https://www.sfccmo.edu/admissions/apply/', siteUrl: 'https://www.sfccmo.edu' },
    { name: 'Drury University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private liberal arts university in Springfield, MO. Architecture, business, and communication. Yellow Ribbon participant.', applyUrl: 'https://www.drury.edu/admissions/apply/', siteUrl: 'https://www.drury.edu' },
  ],
  'Fort Wainwright': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's flagship research university in Fairbanks. Engineering, natural sciences, and business. Adjacent to Fort Wainwright. TA accepted.", applyUrl: 'https://admissions.uaf.edu/apply/', siteUrl: 'https://www.uaf.edu' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'UAF branch campus with vocational and technical programs. Healthcare, trades, and business. TA-eligible and flexible scheduling.', applyUrl: 'https://ctc.uaf.edu/admissions/', siteUrl: 'https://ctc.uaf.edu' },
    { name: 'Alaska Bible College', type: 'Private', degree: '4-Year University', rating: 3.4, desc: 'Faith-based college in Palmer, AK. Biblical studies and Christian ministry. GI Bill accepted. Small, supportive campus community.', applyUrl: 'https://www.akbible.edu/admissions/', siteUrl: 'https://www.akbible.edu' },
  ],
  'Fort Novosel': [
    { name: 'Enterprise State Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Enterprise, AL. Business, healthcare, and aviation technology. TA accepted. Closest college to Fort Novosel.', applyUrl: 'https://www.escc.edu/admissions/', siteUrl: 'https://www.escc.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Fort Novosel. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university with strong business and education programs. Active veteran services. 75 miles from Fort Novosel.', applyUrl: 'https://www.aum.edu/admissions/apply/', siteUrl: 'https://www.aum.edu' },
    { name: 'Wallace Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alabama community college in Dothan. Nursing, business, and skilled trades. TA-eligible with transfer pathways.', applyUrl: 'https://www.wallace.edu/admissions/', siteUrl: 'https://www.wallace.edu' },
  ],
  'Fort Leavenworth': [
    { name: 'University of Kansas', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship Kansas public university in Lawrence. Business, law, and engineering. 30 miles from Fort Leavenworth. TA and GI Bill accepted.', applyUrl: 'https://admissions.ku.edu/apply/', siteUrl: 'https://www.ku.edu' },
    { name: 'Kansas City Kansas Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Leavenworth. Business, healthcare, and technology. TA-eligible with transfer pathways.', applyUrl: 'https://www.kckcc.edu/admissions/', siteUrl: 'https://www.kckcc.edu' },
    { name: 'Park University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly private university in Parkville, MO. Business administration and criminal justice. Flexible scheduling and TA accepted.', applyUrl: 'https://www.park.edu/admissions/apply/', siteUrl: 'https://www.park.edu' },
    { name: 'Johnson County Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large community college in Overland Park, KS. Strong IT, business, and healthcare pathways. TA accepted. Transfer-friendly.', applyUrl: 'https://www.jccc.edu/admissions/apply/', siteUrl: 'https://www.jccc.edu' },
  ],
  'Fort Hamilton': [
    { name: 'Brooklyn College CUNY', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CUNY campus in Brooklyn, NY. Liberal arts, business, and computer science. Affordable tuition and TA-eligible.', applyUrl: 'https://www.brooklyn.cuny.edu/web/admissions.php', siteUrl: 'https://www.brooklyn.cuny.edu' },
    { name: 'Kingsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'CUNY community college in Brooklyn. Healthcare, business, and culinary arts. TA accepted. Transfer pathway to CUNY four-year schools.', applyUrl: 'https://www.kbcc.cuny.edu/admissions/', siteUrl: 'https://www.kbcc.cuny.edu' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-renowned private research university in Manhattan. Business, law, and arts. Yellow Ribbon participant. Exceptional career network.', applyUrl: 'https://apply.nyu.edu/', siteUrl: 'https://www.nyu.edu' },
    { name: 'Touro University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Jewish-sponsored independent university in New York. Health sciences, education, and business. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.touro.edu/admissions/', siteUrl: 'https://www.touro.edu' },
  ],
  'West Point': [
    { name: 'SUNY New Paltz', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SUNY campus in New Paltz, NY. Fine arts, business, and education. Veteran-friendly with transfer pathways. TA and GI Bill accepted.', applyUrl: 'https://www.newpaltz.edu/admissions/apply/', siteUrl: 'https://www.newpaltz.edu' },
    { name: 'Marist College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private college on the Hudson River in Poughkeepsie. Business, communication, and fashion design. Yellow Ribbon participant.', applyUrl: 'https://www.marist.edu/admission/apply/', siteUrl: 'https://www.marist.edu' },
    { name: 'Orange County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'SUNY community college in Middletown, NY. Business, healthcare, and technology programs. TA-eligible and affordable.', applyUrl: 'https://www.sunyorange.edu/admissions/', siteUrl: 'https://www.sunyorange.edu' },
    { name: 'Vassar College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college in Poughkeepsie. Exceptional academics. Yellow Ribbon participant.', applyUrl: 'https://admissions.vassar.edu/apply/', siteUrl: 'https://www.vassar.edu' },
  ],
  'Fort Myer': [
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university in Fairfax. Cybersecurity, engineering, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: 'https://admissions.gmu.edu/apply/', siteUrl: 'https://www2.gmu.edu' },
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia. IT, healthcare, and business. TA accepted. Strong transfer pathway to GMU.', applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
    { name: 'Georgetown University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Elite Jesuit research university in DC. Law, international affairs, and medicine. Yellow Ribbon certified. Exceptional career network.', applyUrl: 'https://uadmissions.georgetown.edu/apply/', siteUrl: 'https://www.georgetown.edu' },
  ],
  'Fort Richardson': [
    { name: 'University of Alaska Anchorage', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's largest university adjacent to Joint Base Elmendorf-Richardson. Nursing, engineering, and business. TA and GI Bill accepted.", applyUrl: 'https://www.uaa.alaska.edu/admissions/', siteUrl: 'https://www.uaa.alaska.edu' },
    { name: 'Alaska Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Small private university in Anchorage. Business, outdoor studies, and liberal arts. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.alaskapacific.edu/admissions/', siteUrl: 'https://www.alaskapacific.edu' },
    { name: 'Charter College', type: 'Private', degree: '2-Year College', rating: 3.4, desc: 'Career-focused college with healthcare, business, and legal programs. Flexible online options for military families. GI Bill accepted.', applyUrl: 'https://www.chartercollege.edu/admissions/', siteUrl: 'https://www.chartercollege.edu' },
  ],
  'Fort Shafter': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university in Honolulu. Business, engineering, and tropical agriculture. TA and GI Bill accepted.", applyUrl: 'https://admissions.hawaii.edu/apply/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in downtown Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Honolulu. Technical and vocational programs including automotive, diesel, and culinary arts. TA accepted.', applyUrl: 'https://honolulu.hawaii.edu/apply/', siteUrl: 'https://honolulu.hawaii.edu' },
  ],
  // ── CONUS Navy ───────────────────────────────────────────────────────────────
  'Naval Base San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus in San Diego. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: 'https://admissions.sdsu.edu/apply/', siteUrl: 'https://www.sdsu.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified. World-class faculty.', applyUrl: 'https://admissions.ucsd.edu/apply/', siteUrl: 'https://www.ucsd.edu' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in downtown San Diego. Business, IT, and public safety programs. TA-eligible. Strong transfer pathway to SDSU and UC.', applyUrl: 'https://www.sdcity.edu/Admissions/', siteUrl: 'https://www.sdcity.edu' },
    { name: 'Point Loma Nazarene University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university overlooking San Diego Bay. Nursing, business, and kinesiology. Yellow Ribbon participant.', applyUrl: 'https://www.pointloma.edu/undergraduate-admission/apply/', siteUrl: 'https://www.pointloma.edu' },
  ],
  'Naval Station Mayport': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.ju.edu/admissions/apply/', siteUrl: 'https://www.ju.edu' },
    { name: 'Edward Waters University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Historic HBCU in Jacksonville. Business, criminal justice, and mass communications. Veteran-friendly community. GI Bill accepted.', applyUrl: 'https://www.ewu.edu/admissions/', siteUrl: 'https://www.ewu.edu' },
  ],
  'NAS Pensacola': [
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://uwf.edu/admissions/', siteUrl: 'https://uwf.edu' },
    { name: 'Pensacola State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college near NAS Pensacola. Nursing, aviation maintenance, and business. TA-eligible. Strong transfer pathway to UWF.', applyUrl: 'https://www.pensacolastate.edu/admissions/', siteUrl: 'https://www.pensacolastate.edu' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'World-renowned aviation university in Daytona Beach. Aviation science, aerospace engineering, and flight. Yellow Ribbon participant.', applyUrl: 'https://admissions.erau.edu/apply/', siteUrl: 'https://www.erau.edu' },
    { name: 'University of South Alabama', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Research university in Mobile, AL. Medical, nursing, and engineering programs. 60 miles from NAS Pensacola. TA and GI Bill accepted.', applyUrl: 'https://www.southalabama.edu/departments/admissions/apply/', siteUrl: 'https://www.southalabama.edu' },
  ],
  'Naval Base Kitsap': [
    { name: 'Olympic College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Bremerton adjacent to Naval Base Kitsap. Business, healthcare, and IT. TA accepted. Strong veteran services.', applyUrl: 'https://www.olympic.edu/admissions/', siteUrl: 'https://www.olympic.edu' },
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public research university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified. Exceptional faculty.', applyUrl: 'https://apply.washington.edu/', siteUrl: 'https://www.washington.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham. Business, education, and environmental sciences. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Lutheran university in Tacoma. Nursing, business, and education programs. Yellow Ribbon participant. Active military community.', applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
  ],
  'NAS Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.ju.edu/admissions/apply/', siteUrl: 'https://www.ju.edu' },
    { name: 'Florida Coastal School of Law', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Law school in Jacksonville offering JD and hybrid programs. Veteran-friendly campus. GI Bill and Yellow Ribbon accepted.', applyUrl: 'https://www.fcsl.edu/admissions/', siteUrl: 'https://www.fcsl.edu' },
  ],
  'Naval Base Ventura County': [
    { name: 'CSU Channel Islands', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'California State campus in Camarillo near NBVC. Business, education, and nursing. TA and GI Bill accepted. Veteran-friendly.', applyUrl: 'https://apply.csuci.edu/', siteUrl: 'https://www.csuci.edu' },
    { name: 'Ventura College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Ventura, CA. Business, healthcare, and computer information systems. TA-eligible. Transfer pathways to CSU and UC.', applyUrl: 'https://www.venturacollege.edu/admissions/', siteUrl: 'https://www.venturacollege.edu' },
    { name: 'UC Santa Barbara', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus near NBVC. Engineering, business economics, and sciences. Yellow Ribbon certified. World-class research.', applyUrl: 'https://admissions.sa.ucsb.edu/apply/', siteUrl: 'https://www.ucsb.edu' },
    { name: 'Cal Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private Lutheran university in Thousand Oaks. Business, education, and psychology. Yellow Ribbon participant. Military scholarships available.', applyUrl: 'https://www.callutheran.edu/admissions/', siteUrl: 'https://www.callutheran.edu' },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 15 minutes from JBPHH.", applyUrl: 'https://admissions.hawaii.edu/apply/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with Pearl Harbor campus and downtown Honolulu campus. Business, nursing, and military studies. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH system college in Pearl City, adjacent to JBPHH. Business, healthcare, and liberal arts. TA accepted. Strong transfer pathways.', applyUrl: 'https://www.leeward.hawaii.edu/future-students/', siteUrl: 'https://www.leeward.hawaii.edu' },
    { name: 'Chaminade University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic Marianist university in Honolulu. Criminal justice, business, and nursing. Military-friendly. Yellow Ribbon certified.', applyUrl: 'https://www.chaminade.edu/admission/apply/', siteUrl: 'https://www.chaminade.edu' },
  ],
  'NAS Whidbey Island': [
    { name: 'Skagit Valley College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving Whidbey Island and Skagit Valley. Business, healthcare, and trades. TA-eligible. Closest college to NAS Whidbey.', applyUrl: 'https://www.skagit.edu/admissions/', siteUrl: 'https://www.skagit.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 40 miles from NAS Whidbey. Business, education, and environmental studies. TA and GI Bill accepted.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus in Bothell. Business, nursing, and computer science. Veteran-friendly with TA and GI Bill accepted.', applyUrl: 'https://www.uwb.edu/admissions/apply/', siteUrl: 'https://www.uwb.edu' },
  ],
  'Naval Station Everett': [
    { name: 'Everett Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Everett, WA. Business, healthcare, and engineering technology. TA accepted. Adjacent to Naval Station Everett.', applyUrl: 'https://www.everettcc.edu/admissions/', siteUrl: 'https://www.everettcc.edu' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus 20 miles south. Business, nursing, and computer science. TA and GI Bill accepted.', applyUrl: 'https://www.uwb.edu/admissions/apply/', siteUrl: 'https://www.uwb.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 30 miles north. Business, education, and environmental studies. Military-friendly campus.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
  ],
  'NAS Corpus Christi': [
    { name: 'Texas A&M University Corpus Christi', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'A&M system university on the island. Business, nursing, and marine sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.tamucc.edu/admissions/', siteUrl: 'https://www.tamucc.edu' },
    { name: 'Del Mar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Corpus Christi. Healthcare, business, and culinary arts. TA-eligible. Transfer pathways to A&M Corpus Christi.', applyUrl: 'https://www.delmar.edu/admissions/', siteUrl: 'https://www.delmar.edu' },
  ],
  'NAS Oceana': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Norfolk, VA. Dedicated military center, engineering, and business. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads including Virginia Beach. Nursing, IT, and business. TA-eligible. Transfer partner with ODU.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus. Military tuition discount.', applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://www.nsu.edu/admissions/', siteUrl: 'https://www.nsu.edu' },
  ],
  // ── CONUS Marine Corps ───────────────────────────────────────────────────────
  'MCAS Cherry Point': [
    { name: 'Craven Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in New Bern, NC. Healthcare, business, and technology. TA accepted. Closest college to MCAS Cherry Point.', applyUrl: 'https://www.cravencc.edu/admissions/', siteUrl: 'https://www.cravencc.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
    { name: 'UNC Wilmington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'UNC system campus on the coast. Marine biology, business, and nursing. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://www.uncw.edu/admissions/apply.html', siteUrl: 'https://www.uncw.edu' },
    { name: 'Carteret Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Small community college in Morehead City, NC. Marine technology and business programs. TA-eligible. Coastal focus.', applyUrl: 'https://www.carteret.edu/admissions/', siteUrl: 'https://www.carteret.edu' },
  ],
  'MCAS Miramar': [
    { name: 'San Diego Miramar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to MCAS Miramar. Aviation, business, and IT programs. TA-eligible. Strong transfer pathway.', applyUrl: 'https://www.sdmiramar.edu/admissions/', siteUrl: 'https://www.sdmiramar.edu' },
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus near MCAS Miramar. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: 'https://admissions.sdsu.edu/apply/', siteUrl: 'https://www.sdsu.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: 'https://admissions.ucsd.edu/apply/', siteUrl: 'https://www.ucsd.edu' },
    { name: 'National University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Nonprofit private university serving adult learners. Business, education, and IT. Month-by-month enrollment. GI Bill accepted.', applyUrl: 'https://www.nu.edu/admissions/apply/', siteUrl: 'https://www.nu.edu' },
  ],
  'MCB Quantico': [
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia with Manassas campus near Quantico. IT, healthcare, and business. TA accepted.', applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university. Cybersecurity, law, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: 'https://admissions.gmu.edu/apply/', siteUrl: 'https://www2.gmu.edu' },
    { name: 'Virginia Tech', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Top-ranked public research university. Engineering, architecture, and business. Yellow Ribbon participant. 75 miles from Quantico.', applyUrl: 'https://admissions.vt.edu/apply.html', siteUrl: 'https://www.vt.edu' },
    { name: 'University of Mary Washington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university in Fredericksburg. Business, computer science, and education. 15 miles from MCB Quantico.', applyUrl: 'https://apply.umw.edu/', siteUrl: 'https://www.umw.edu' },
  ],
  'MCAS New River': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Primary college for Jacksonville, NC military community. On-post classes available. TA accepted. Healthcare and IT programs.', applyUrl: 'https://www.coastalcarolina.cc.nc.us/apply/', siteUrl: 'https://www.coastalcarolina.cc.nc.us' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville. Nursing, business, and engineering. 1 hour from MCAS New River. TA and GI Bill accepted.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with Jacksonville campus near MCAS New River. Business, criminal justice, and education.', applyUrl: 'https://www.umo.edu/admissions/apply/', siteUrl: 'https://www.umo.edu' },
  ],
  'MCB Hawaii Kaneohe Bay': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 20 minutes from MCB Hawaii.", applyUrl: 'https://admissions.hawaii.edu/apply/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Windward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Kaneohe, adjacent to MCB Hawaii. Liberal arts, science, and healthcare pathways. TA accepted.', applyUrl: 'https://www.windward.hawaii.edu/apply/', siteUrl: 'https://www.windward.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant. GI Bill accepted.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
  ],
  'MCAS Yuma': [
    { name: 'Arizona Western College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Yuma adjacent to MCAS Yuma. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.azwestern.edu/admissions/', siteUrl: 'https://www.azwestern.edu' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with online programs accessible from Yuma. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: 'https://nau.edu/admissions/apply/', siteUrl: 'https://nau.edu' },
    { name: 'Arizona State University Online', type: 'Public', degree: '4-Year University', rating: 4.0, desc: '#1 US News innovation university with fully online programs. Business, engineering, and computer science. Excellent military support and TA eligible.', applyUrl: 'https://asuonline.asu.edu/online-degree-programs/', siteUrl: 'https://asuonline.asu.edu' },
  ],
  'MCAS Beaufort': [
    { name: 'Technical College of the Lowcountry', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Beaufort, SC. Healthcare, business, and technology. TA-eligible. Closest college to MCAS Beaufort.', applyUrl: 'https://www.tcl.edu/admissions/', siteUrl: 'https://www.tcl.edu' },
    { name: 'University of South Carolina Beaufort', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC campus in Beaufort. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uscb.edu/admissions/apply/', siteUrl: 'https://www.uscb.edu' },
    { name: 'Coastal Carolina University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Conway, SC. Business, education, and marine science. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://www.coastal.edu/admissions/', siteUrl: 'https://www.coastal.edu' },
  ],
  // ── CONUS Air Force / Space Force ────────────────────────────────────────────
  'Joint Base Langley-Eustis': [
    { name: 'Hampton University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Historic HBCU in Hampton, VA. Business, nursing, and engineering. Adjacent to JBLE. Yellow Ribbon certified. Strong veteran services.', applyUrl: 'https://www.hamptonu.edu/admission/apply.cfm', siteUrl: 'https://www.hamptonu.edu' },
    { name: 'Thomas Nelson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Hampton. Business, healthcare, and technology programs. TA-eligible. Transfer pathways to ODU and other VA schools.', applyUrl: 'https://www.tncc.edu/admissions/', siteUrl: 'https://www.tncc.edu' },
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Research university in Norfolk. Engineering, business, and education. Dedicated military center. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Christopher Newport University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public liberal arts university in Newport News. Business, leadership, and science. Veteran-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://www.cnu.edu/admissions/apply/', siteUrl: 'https://www.cnu.edu' },
  ],
  'Eglin AFB': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville adjacent to Eglin AFB. Business, healthcare, and professional programs. TA-eligible.', applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://uwf.edu/admissions/', siteUrl: 'https://uwf.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Eglin AFB. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base classes at Eglin. Popular with Air Force members. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'MacDill AFB': [
    { name: 'University of Tampa', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Private university in downtown Tampa. Business, nursing, and international business. Yellow Ribbon participant. Minutes from MacDill AFB.', applyUrl: 'https://www.ut.edu/admissions/apply/', siteUrl: 'https://www.ut.edu' },
    { name: 'Hillsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in Tampa. Healthcare, IT, and business. TA-eligible. Strong transfer pathway to USF and UT.', applyUrl: 'https://www.hccfl.edu/admissions/', siteUrl: 'https://www.hccfl.edu' },
    { name: 'University of South Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Tampa. Engineering, medicine, and business. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.usf.edu/apply/', siteUrl: 'https://www.usf.edu' },
    { name: 'Eckerd College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private liberal arts college in St. Petersburg. Marine science, business, and psychology. Yellow Ribbon certified. Waterfront campus.', applyUrl: 'https://www.eckerd.edu/admissions/apply/', siteUrl: 'https://www.eckerd.edu' },
  ],
  'Tyndall AFB': [
    { name: 'Gulf Coast State College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'State college in Panama City, FL. Business, healthcare, and technology programs. TA-eligible. Closest college to Tyndall AFB.', applyUrl: 'https://www.gulfcoast.edu/admissions/', siteUrl: 'https://www.gulfcoast.edu' },
    { name: 'FSU Panama City', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Florida State University branch campus in Panama City. Business, computer science, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://admissions.fsu.edu/apply/', siteUrl: 'https://www.pc.fsu.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus serving the Tyndall area. Business, criminal justice, and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Barksdale AFB': [
    { name: 'Bossier Parish Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to Barksdale AFB. Healthcare, business, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.bpcc.edu/admissions/', siteUrl: 'https://www.bpcc.edu' },
    { name: 'Louisiana Tech University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Ruston, LA. Engineering, business, and computer science. 30 miles from Barksdale. TA and GI Bill accepted.', applyUrl: 'https://www.latech.edu/admissions/apply/', siteUrl: 'https://www.latech.edu' },
    { name: 'Centenary College', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private liberal arts college in Shreveport. Business, education, and natural sciences. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.centenary.edu/admission/apply/', siteUrl: 'https://www.centenary.edu' },
    { name: 'LSU Shreveport', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'LSU system campus in Shreveport. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.lsus.edu/admissions/', siteUrl: 'https://www.lsus.edu' },
  ],
  'Tinker AFB': [
    { name: 'Rose State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Midwest City adjacent to Tinker AFB. IT, aviation maintenance, and healthcare. TA-eligible.', applyUrl: 'https://www.rose.edu/admissions/', siteUrl: 'https://www.rose.edu' },
    { name: 'University of Central Oklahoma', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Edmond, OK. Business, education, and forensic science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uco.edu/admissions/apply/', siteUrl: 'https://www.uco.edu' },
    { name: 'Oklahoma State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Oklahoma land-grant university. Engineering, business, and agriculture. Strong research programs. TA and GI Bill accepted.', applyUrl: 'https://go.okstate.edu/admissions/apply/', siteUrl: 'https://go.okstate.edu' },
    { name: 'Southern Nazarene University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Bethany, OK. Business, education, and nursing. Yellow Ribbon participant. Military-friendly community.', applyUrl: 'https://www.snu.edu/admissions/apply/', siteUrl: 'https://www.snu.edu' },
  ],
  'Offutt AFB': [
    { name: 'Bellevue University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Military-friendly private university adjacent to Offutt AFB. Business, IT, and cybersecurity. TA and GI Bill accepted. Flexible scheduling.', applyUrl: 'https://www.bellevue.edu/admissions/apply/', siteUrl: 'https://www.bellevue.edu' },
    { name: 'Metropolitan Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Omaha. IT, healthcare, and business. TA-eligible. Strong transfer pathways to UNO and Creighton.', applyUrl: 'https://www.mcckc.edu/enrollment/', siteUrl: 'https://www.mcckc.edu' },
    { name: 'University of Nebraska Omaha', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Omaha. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unomaha.edu/admissions/', siteUrl: 'https://www.unomaha.edu' },
    { name: 'Creighton University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Omaha. Medicine, law, and business. Yellow Ribbon participant. Excellent healthcare programs.', applyUrl: 'https://admissions.creighton.edu/apply/', siteUrl: 'https://www.creighton.edu' },
  ],
  'Whiteman AFB': [
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Warrensburg, MO. Business, education, and aviation. Active veteran services. 15 minutes from Whiteman AFB.', applyUrl: 'https://www.ucmo.edu/admissions/apply/', siteUrl: 'https://www.ucmo.edu' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture. TA-eligible. Affordable and convenient.', applyUrl: 'https://www.sfccmo.edu/admissions/apply/', siteUrl: 'https://www.sfccmo.edu' },
    { name: 'Missouri S&T', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Missouri University of Science & Technology. Top-ranked STEM programs. Engineering and computer science. TA and GI Bill accepted.', applyUrl: 'https://apply.mst.edu/', siteUrl: 'https://www.mst.edu' },
  ],
  'Scott AFB': [
    { name: 'McKendree University', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private university in Lebanon, IL. Business, nursing, and education. Yellow Ribbon participant. Minutes from Scott AFB.', applyUrl: 'https://www.mckendree.edu/admissions/apply/', siteUrl: 'https://www.mckendree.edu' },
    { name: 'Southwestern Illinois College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving metro-east Illinois. Business, healthcare, and technology. TA-eligible. Strong transfer pathways.', applyUrl: 'https://www.swic.edu/admissions/', siteUrl: 'https://www.swic.edu' },
    { name: 'Southern Illinois University Edwardsville', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SIU campus near Scott AFB. Business, engineering, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.siue.edu/admissions/', siteUrl: 'https://www.siue.edu' },
    { name: 'Lindenwood University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in St. Charles, MO. Business, communications, and education. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.lindenwood.edu/admissions/apply/', siteUrl: 'https://www.lindenwood.edu' },
  ],
  'Wright-Patterson AFB': [
    { name: 'Wright State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university adjacent to Wright-Patterson AFB. Engineering, business, and medicine. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.wright.edu/admissions/apply', siteUrl: 'https://www.wright.edu' },
    { name: 'Sinclair Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Dayton. Aviation technology, IT, and healthcare. TA-eligible. Transfer pathways to WSU. Strong military support.', applyUrl: 'https://www.sinclair.edu/admissions/', siteUrl: 'https://www.sinclair.edu' },
    { name: 'University of Dayton', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Catholic research university in Dayton. Engineering, law, and business. Yellow Ribbon participant. Close to Wright-Patterson.', applyUrl: 'https://udayton.edu/admission/apply/', siteUrl: 'https://www.udayton.edu' },
    { name: 'Air Force Institute of Technology', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Graduate school of engineering and management on Wright-Patterson AFB. STEM graduate degrees exclusively for military. Free for eligible service members.', applyUrl: 'https://www.afit.edu/admissions/', siteUrl: 'https://www.afit.edu' },
  ],
  'Joint Base Andrews': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Andrews. Engineering, business, and cybersecurity. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://apply.umd.edu/', siteUrl: 'https://www.umd.edu' },
    { name: "Prince George's Community College", type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college near Joint Base Andrews. Healthcare, IT, and business. TA-eligible. Transfer pathways to UMD and other MD schools.', applyUrl: 'https://www.pgcc.edu/admissions/apply/', siteUrl: 'https://www.pgcc.edu' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
    { name: 'Bowie State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Bowie, MD. Business, computer science, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.bowiestate.edu/admissions/apply/', siteUrl: 'https://www.bowiestate.edu' },
  ],
  'Nellis AFB': [
    { name: 'College of Southern Nevada', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Las Vegas. Business, healthcare, and culinary arts. TA-eligible. Closest college to Nellis AFB.', applyUrl: 'https://www.csn.edu/admissions/', siteUrl: 'https://www.csn.edu' },
    { name: 'University of Nevada Las Vegas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Las Vegas. Business, hospitality, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unlv.edu/admissions/apply', siteUrl: 'https://www.unlv.edu' },
    { name: 'Nevada State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Henderson, NV. Business, education, and nursing. Military-friendly with flexible scheduling. TA and GI Bill accepted.', applyUrl: 'https://www.nevadastate.edu/admissions/', siteUrl: 'https://www.nevadastate.edu' },
    { name: 'Touro University Nevada', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private health sciences university in Henderson. Healthcare and business programs. GI Bill accepted. Military-friendly.', applyUrl: 'https://tun.touro.edu/admissions/', siteUrl: 'https://tun.touro.edu' },
  ],
  'Travis AFB': [
    { name: 'Solano Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Fairfield adjacent to Travis AFB. Business, healthcare, and aviation. TA-eligible. Closest college to base.', applyUrl: 'https://www.solano.edu/admissions/', siteUrl: 'https://www.solano.edu' },
    { name: 'UC Davis', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Davis. Veterinary medicine, engineering, and business. Yellow Ribbon certified. 25 miles from Travis AFB.', applyUrl: 'https://www.ucdavis.edu/admissions/', siteUrl: 'https://www.ucdavis.edu' },
    { name: 'California State University Sacramento', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Sacramento. Business, criminal justice, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.csus.edu/apply/', siteUrl: 'https://www.csus.edu' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo, near Travis AFB. Osteopathic medicine, pharmacy, and public health. GI Bill accepted.', applyUrl: 'https://www.tu.edu/admissions/', siteUrl: 'https://www.tu.edu' },
  ],
  'Edwards AFB': [
    { name: 'Antelope Valley College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Lancaster, CA near Edwards AFB. Aerospace, business, and healthcare. TA-eligible. Strong aviation programs.', applyUrl: 'https://www.avc.edu/admissions/', siteUrl: 'https://www.avc.edu' },
    { name: 'Cal State San Bernardino', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus with business, education, and nursing programs. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.csusb.edu/admissions/', siteUrl: 'https://www.csusb.edu' },
    { name: 'California State University Mojave', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'CSU satellite programs serving the high desert community near Edwards AFB. Business and education. TA and GI Bill accepted.', applyUrl: 'https://www.csub.edu/admissions/', siteUrl: 'https://www.csub.edu' },
  ],
  'Keesler AFB': [
    { name: 'Mississippi Gulf Coast Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Biloxi adjacent to Keesler AFB. IT, healthcare, and business. TA-eligible. Excellent transfer pathways.', applyUrl: 'https://www.mgccc.edu/admissions/', siteUrl: 'https://www.mgccc.edu' },
    { name: 'University of Southern Mississippi', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public research university in Hattiesburg. Business, nursing, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.usm.edu/admissions/apply/', siteUrl: 'https://www.usm.edu' },
    { name: 'William Carey University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Hattiesburg. Nursing, education, and business. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.wmcarey.edu/admissions/', siteUrl: 'https://www.wmcarey.edu' },
  ],
  'Little Rock AFB': [
    { name: 'University of Arkansas at Little Rock', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'UA system campus in Little Rock. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://ualr.edu/admissions/apply/', siteUrl: 'https://ualr.edu' },
    { name: 'Pulaski Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in North Little Rock near the air base. Healthcare, IT, and business. TA-eligible. Affordable tuition.', applyUrl: 'https://www.uaptc.edu/admissions/', siteUrl: 'https://pulaskitech.edu' },
    { name: 'Hendrix College', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly regarded private liberal arts college in Conway, AR. Sciences, business, and humanities. Yellow Ribbon participant.', applyUrl: 'https://www.hendrix.edu/admission/apply/', siteUrl: 'https://www.hendrix.edu' },
  ],
  'Dyess AFB': [
    { name: 'Hardin-Simmons University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Abilene. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.hsutx.edu/admissions/apply/', siteUrl: 'https://www.hsutx.edu' },
    { name: 'McMurry University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Methodist university in Abilene. Business, education, and nursing. GI Bill accepted. Small campus with strong faculty.', applyUrl: 'https://www.mcm.edu/admissions/apply/', siteUrl: 'https://www.mcm.edu' },
    { name: 'Cisco College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Cisco, TX. Agriculture, business, and vocational programs. TA-eligible. Affordable community college option.', applyUrl: 'https://www.cisco.edu/admissions/', siteUrl: 'https://www.cisco.edu' },
    { name: 'Abilene Christian University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university in Abilene. Theology, business, and sciences. Yellow Ribbon participant. Active military community.', applyUrl: 'https://www.acu.edu/admissions/apply/', siteUrl: 'https://www.acu.edu' },
  ],
  'Luke AFB': [
    { name: 'Glendale Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Maricopa community college adjacent to Luke AFB. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.gccaz.edu/admissions/', siteUrl: 'https://www.gccaz.edu' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Nation\'s #1 innovation university. Business, engineering, and health sciences. Enormous online program. TA and GI Bill accepted.', applyUrl: 'https://admission.asu.edu/undergrad/apply', siteUrl: 'https://www.asu.edu' },
    { name: 'Grand Canyon University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Phoenix. Business, education, and nursing. Military-friendly with Yellow Ribbon. Extensive online programs.', applyUrl: 'https://www.gcu.edu/admissions/apply/', siteUrl: 'https://www.gcu.edu' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with extensive online programs. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: 'https://nau.edu/admissions/apply/', siteUrl: 'https://nau.edu' },
  ],
  'Davis-Monthan AFB': [
    { name: 'Pima Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Tucson. Business, healthcare, and aviation maintenance. TA-eligible. Closest community college to Davis-Monthan.', applyUrl: 'https://www.pima.edu/admissions/', siteUrl: 'https://www.pima.edu' },
    { name: 'University of Arizona', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Flagship Arizona public research university. Engineering, medicine, and business. Yellow Ribbon certified. 10 minutes from base.', applyUrl: 'https://admissions.arizona.edu/apply/', siteUrl: 'https://www.arizona.edu' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "#1 US innovation university. Massive online program for military. Business, engineering, and health sciences. TA and GI Bill accepted.", applyUrl: 'https://admission.asu.edu/undergrad/apply', siteUrl: 'https://www.asu.edu' },
    { name: 'Cochise College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sierra Vista, AZ near Fort Huachuca. Business, healthcare, and public safety. TA-eligible.', applyUrl: 'https://www.cochise.edu/admissions/', siteUrl: 'https://www.cochise.edu' },
  ],
  'Fairchild AFB': [
    { name: 'Eastern Washington University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Cheney, WA adjacent to Fairchild AFB. Business, education, and dental hygiene. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://access.ewu.edu/apply/', siteUrl: 'https://www.ewu.edu' },
    { name: 'Gonzaga University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Spokane. Business, law, and nursing. Yellow Ribbon participant. Excellent academic reputation.', applyUrl: 'https://www.gonzaga.edu/admission/apply/', siteUrl: 'https://www.gonzaga.edu' },
    { name: 'Washington State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Flagship Washington land-grant university in Pullman. Engineering, veterinary medicine, and business. TA and GI Bill accepted.', applyUrl: 'https://admission.wsu.edu/apply/', siteUrl: 'https://wsu.edu' },
    { name: 'Spokane Falls Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Spokane. Business, IT, and healthcare. TA-eligible. Strong transfer pathways to EWU and WSU.', applyUrl: 'https://www.spokanefalls.edu/admissions/', siteUrl: 'https://www.spokanefalls.edu' },
  ],
  'Hill AFB': [
    { name: 'Weber State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Ogden adjacent to Hill AFB. Business, engineering technology, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.weber.edu/admissions/apply/', siteUrl: 'https://www.weber.edu' },
    { name: 'Utah State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Utah land-grant research university in Logan. Engineering, business, and agriculture. Strong online programs. TA and GI Bill accepted.', applyUrl: 'https://www.usu.edu/admissions/', siteUrl: 'https://www.usu.edu' },
    { name: 'Ogden-Weber Applied Technology College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Applied technology college in Ogden. Skilled trades, healthcare, and IT certifications. TA-eligible. Excellent for vocational training.', applyUrl: 'https://www.owatc.edu/admissions/', siteUrl: 'https://www.owatc.edu' },
    { name: 'Brigham Young University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private LDS university in Provo. Business, engineering, and law. Low tuition and Yellow Ribbon participant.', applyUrl: 'https://admissions.byu.edu/apply/', siteUrl: 'https://www.byu.edu' },
  ],
  'Minot AFB': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Minot, ND near the air base. Business, education, and criminal justice. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.minotstateu.edu/enroll/', siteUrl: 'https://www.minotstateu.edu' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Community college in Bottineau, ND. Agriculture, business, and health programs. TA-eligible. Affordable rural community college.', applyUrl: 'https://www.dakotacollege.edu/admissions/', siteUrl: 'https://www.dakotacollege.edu' },
    { name: 'University of Mary', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic university in Bismarck, ND. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.umary.edu/admissions/apply/', siteUrl: 'https://www.umary.edu' },
  ],
  'Malmstrom AFB': [
    { name: 'University of Providence', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic university in Great Falls, MT. Business, nursing, and education. Yellow Ribbon participant. Minutes from Malmstrom AFB.', applyUrl: 'https://www.uprovidence.edu/admissions/', siteUrl: 'https://www.uprovidence.edu' },
    { name: 'Montana State University Great Falls', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'MSU college of technology in Great Falls. Business, healthcare, and trades. TA-eligible. Closest public college to Malmstrom.', applyUrl: 'https://www.msugf.edu/admissions/', siteUrl: 'https://www.msugf.edu' },
    { name: 'Montana State University Bozeman', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Montana research university. Engineering, agriculture, and business. Strong online programs. TA and GI Bill accepted.', applyUrl: 'https://www.montana.edu/admissions/apply/', siteUrl: 'https://www.montana.edu' },
  ],
  'Ellsworth AFB': [
    { name: 'Western Dakota Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Rapid City near Ellsworth AFB. Skilled trades, healthcare, and IT. TA-eligible. Excellent vocational programs.', applyUrl: 'https://www.wdt.edu/admissions/', siteUrl: 'https://www.wdt.edu' },
    { name: 'South Dakota School of Mines', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Engineering-focused public university in Rapid City. Highly ranked STEM programs. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.sdsmt.edu/Academics/Admissions/Apply/', siteUrl: 'https://www.sdsmt.edu' },
    { name: 'Mount Marty University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic Benedictine university in Yankton, SD. Healthcare, business, and education. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.mtmc.edu/admissions/apply/', siteUrl: 'https://www.mtmc.edu' },
  ],
  'Hurlburt Field': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville, FL near Hurlburt Field. Business, healthcare, and professional programs. TA-eligible.', applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://uwf.edu/admissions/', siteUrl: 'https://uwf.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Hurlburt Field. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Moody AFB': [
    { name: 'Valdosta State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Valdosta, GA near Moody AFB. Business, nursing, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.valdosta.edu/admissions/apply/', siteUrl: 'https://www.valdosta.edu' },
    { name: 'South Georgia Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Americus, GA. Healthcare, business, and technology. TA-eligible. Strong workforce training programs.', applyUrl: 'https://www.southgatech.edu/admissions/', siteUrl: 'https://www.southgatech.edu' },
    { name: 'Abraham Baldwin Agricultural College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Georgia public college in Tifton. Agriculture, business, and science programs. TA-eligible. Transfer pathway to UGA and GA Tech.', applyUrl: 'https://www.abac.edu/admissions/apply/', siteUrl: 'https://www.abac.edu' },
  ],
  'Shaw AFB': [
    { name: 'Central Carolina Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in Sumter, SC adjacent to Shaw AFB. Healthcare, IT, and business. TA-eligible. Closest college to base.', applyUrl: 'https://www.cctech.edu/admissions/', siteUrl: 'https://www.cctech.edu' },
    { name: 'University of South Carolina Sumter', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'USC campus in Sumter. Business, liberal arts, and natural sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uscsumter.edu/admissions/apply/', siteUrl: 'https://www.uscsumter.edu' },
    { name: 'Columbia College', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private liberal arts college in Columbia, SC. Business, education, and music. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.ccis.edu/admissions/apply/', siteUrl: 'https://www.ccis.edu' },
  ],
  'Seymour Johnson AFB': [
    { name: 'Wayne Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Goldsboro, NC adjacent to Seymour Johnson AFB. Business, healthcare, and IT. TA-eligible.', applyUrl: 'https://www.waynecc.edu/admissions/', siteUrl: 'https://www.waynecc.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. 30 miles from base.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
    { name: 'Mount Olive University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university near Seymour Johnson. Business, criminal justice, and education. GI Bill accepted.', applyUrl: 'https://www.umo.edu/admissions/apply/', siteUrl: 'https://www.umo.edu' },
  ],
  'Joint Base San Antonio': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science. Active veteran services and military tuition discounts.', applyUrl: 'https://apply.utsa.edu/', siteUrl: 'https://www.utsa.edu' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts. TA accepted. Low tuition.', applyUrl: 'https://www.alamo.edu/spc/admissions/apply/', siteUrl: 'https://www.alamo.edu/spc/' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university in San Antonio. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: 'https://www.trinity.edu/admissions/apply/', siteUrl: 'https://www.trinity.edu' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: 'https://www.alamo.edu/sac/admissions/apply/', siteUrl: 'https://www.alamo.edu/sac/' },
  ],
  'Buckley SFB': [
    { name: 'University of Colorado Denver', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Denver. Business, engineering, and health sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.ucdenver.edu/apply/', siteUrl: 'https://www.ucdenver.edu' },
    { name: 'Community College of Denver', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Denver. Healthcare, business, and technology. TA-eligible. Transfer pathways to CU Denver and MSU Denver.', applyUrl: 'https://www.ccd.edu/admissions/', siteUrl: 'https://www.ccd.edu' },
    { name: 'Metropolitan State University of Denver', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in downtown Denver. Business, education, and aviation. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.msudenver.edu/admissions/', siteUrl: 'https://www.msudenver.edu' },
  ],
  'Schriever SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Colorado Springs. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: 'https://admissions.uccs.edu/apply/', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: 'https://www.pikespeak.edu/admissions/apply-to-ppsc/', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  'Peterson SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus near Peterson SFB. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: 'https://admissions.uccs.edu/apply/', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, IT, and business. TA accepted.', applyUrl: 'https://www.pikespeak.edu/admissions/apply-to-ppsc/', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  // ── OCONUS ───────────────────────────────────────────────────────────────────
  'Osan Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'University of Maryland Global Campus Asia. On-base classes at Osan AB. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs available at Osan AB. Online with on-base support. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Camp Walker': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Camp Walker. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Camp Carroll': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Carroll. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'USAG Yongsan': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at USAG Yongsan/Seoul. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at USAG Yongsan. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Camp Zama': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Zama, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at Camp Zama. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Misawa Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Misawa Air Base, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degrees and certificates. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs at Misawa AB. Online with on-base support sessions. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Naval Air Facility Atsugi': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at NAF Atsugi, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'MCAS Iwakuni': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at MCAS Iwakuni, Japan. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at MCAS Iwakuni. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Spangdahlem Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Spangdahlem AB, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU residential campus in Europe. Aviation management and aerospace engineering. Available near Spangdahlem.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'USAG Wiesbaden': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Wiesbaden, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU courses available at Wiesbaden. Aviation management and aerospace programs. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes at Wiesbaden. Business and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'USAG Grafenwöhr': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Grafenwöhr. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available at Grafenwöhr. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Grafenwöhr. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'USAG Ansbach': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Ansbach, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available near Ansbach. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European classes near Ansbach. Business and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Aviano Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Aviano AB, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation management and aerospace engineering. Available at Aviano. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes at Aviano. Business and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Naval Air Station Sigonella': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at NAS Sigonella, Sicily. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at NAS Sigonella. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Camp Darby': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Camp Darby, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes near Camp Darby. Business and criminal justice. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Naval Station Rota': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Naval Station Rota, Spain. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NS Rota. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Andersen Air Force Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses at Andersen AFB, Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Andersen. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Joint Region Marianas': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses in Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Guam Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Local community college on Guam. Business, healthcare, and technology programs. TA-eligible. Strong transfer pathways.', applyUrl: 'https://www.guamcc.edu/admissions/', siteUrl: 'https://www.guamcc.edu' },
    { name: 'University of Guam', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'The only four-year public university on Guam. Business, nursing, and education. TA and GI Bill accepted.', applyUrl: 'https://www.uog.edu/admissions/', siteUrl: 'https://www.uog.edu' },
  ],
  'Al Udeid Air Base': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for deployed/OCONUS members at Al Udeid AB. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Al Udeid. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs including intelligence, security, and emergency management.', applyUrl: 'https://www.amu.apus.edu/admission/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'Camp Lemonnier': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at Camp Lemonnier, Djibouti. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Camp Lemonnier. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Incirlik Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Incirlik AB, Turkey. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at Incirlik. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Bahrain Naval Support Activity': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at NSA Bahrain. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NSA Bahrain. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. Intelligence, security, and emergency management programs. GI Bill accepted.', applyUrl: 'https://www.amu.apus.edu/admission/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  // ── Space Force ──────────────────────────────────────────────────────────────
  'Cape Canaveral Space Force Station': [
    { name: 'Florida Institute of Technology', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'STEM-focused private university in Melbourne, FL. Aerospace, engineering, and computer science. Strong ties to space industry and CCSFS. Yellow Ribbon.', applyUrl: 'https://www.fit.edu/admissions/apply/', siteUrl: 'https://www.fit.edu' },
    { name: 'Eastern Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Affordable community college near CCSFS. Engineering technology, business, and healthcare. TA and GI Bill accepted.', applyUrl: 'https://www.easternflorida.edu/admissions/', siteUrl: 'https://www.easternflorida.edu' },
    { name: 'University of Central Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university in Orlando. Aerospace engineering, computer science, and business. Strong veteran services.', applyUrl: 'https://admissions.ucf.edu/apply/', siteUrl: 'https://www.ucf.edu' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Top aviation and aerospace university in Daytona Beach, 50 miles from CCSFS. Aviation science, aerospace engineering. Yellow Ribbon participant.', applyUrl: 'https://admissions.erau.edu/apply/', siteUrl: 'https://www.erau.edu' },
  ],
  'Los Angeles AFB': [
    { name: 'University of Southern California', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top private research university. Engineering, business, and aerospace. Yellow Ribbon participant. Strong industry connections to space industry.', applyUrl: 'https://www.usc.edu/admission/undergraduate/', siteUrl: 'https://www.usc.edu' },
    { name: 'UCLA', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Westwood. Engineering, business, and sciences. Yellow Ribbon certified.', applyUrl: 'https://admission.ucla.edu/apply/', siteUrl: 'https://www.ucla.edu' },
    { name: 'El Camino College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Torrance. Engineering technology, computer science, and business. TA-eligible. Transfer pathway to CSU/UC.', applyUrl: 'https://www.elcamino.edu/admissions/', siteUrl: 'https://www.elcamino.edu' },
    { name: 'California State University Dominguez Hills', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Carson near LA AFB. Business, nursing, and technology. Military-friendly with veteran resource center.', applyUrl: 'https://www.csudh.edu/admissions/', siteUrl: 'https://www.csudh.edu' },
  ],
  'Cheyenne Mountain SFS': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU campus adjacent to the Colorado Springs military community. Engineering, nursing, and business. Active veteran services.', applyUrl: 'https://admissions.uccs.edu/apply/', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Technology, business, and automotive. TA accepted.', applyUrl: 'https://www.pikespeak.edu/admissions/apply-to-ppsc/', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  'Cavalier Space Force Station': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Regional university in Minot, ND. Business, education, and nursing programs. TA and GI Bill accepted.', applyUrl: 'https://www.minotstateu.edu/enroll/', siteUrl: 'https://www.minotstateu.edu' },
    { name: 'University of North Dakota', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship state university with strong aviation and aerospace programs. 2 hours from Cavalier. Yellow Ribbon participant.', applyUrl: 'https://und.edu/admissions/apply/', siteUrl: 'https://und.edu' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Affordable two-year college near the Canadian border region. Natural resources and business programs. TA-eligible.', applyUrl: 'https://www.dakotacollege.edu/admissions/', siteUrl: 'https://www.dakotacollege.edu' },
  ],
  'Clear Space Force Station': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Major Alaskan research university. Engineering, natural science, and liberal arts. Strong veteran services. 100 miles from Clear SFS.', applyUrl: 'https://admissions.uaf.edu/apply/', siteUrl: 'https://www.uaf.edu' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Vocational and associate degree programs in Fairbanks. TA-eligible. IT, business, and health programs.', applyUrl: 'https://ctc.uaf.edu/admissions/', siteUrl: 'https://ctc.uaf.edu' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading online university for military members. Available remotely at Clear SFS. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
  ],
  // ── Coast Guard ───────────────────────────────────────────────────────────────
  'USCG Training Center Cape May': [
    { name: 'Stockton University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university 30 miles from Cape May. Business, nursing, and social work. Veteran services office and TA accepted.', applyUrl: 'https://www.stockton.edu/admissions/apply/', siteUrl: 'https://www.stockton.edu' },
    { name: 'Cape May County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Local community college with flexible scheduling for military. Business, healthcare, and criminal justice. TA-eligible.', applyUrl: 'https://www.capemaycc.edu/admissions/', siteUrl: 'https://www.capemaycc.edu' },
    { name: 'Rowan University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Growing public research university in Glassboro, NJ. Engineering, business, and health sciences. Yellow Ribbon participant.', applyUrl: 'https://www.rowan.edu/home/offices-services/admissions/apply/', siteUrl: 'https://www.rowan.edu' },
  ],
  'USCG Base Kodiak': [
    { name: 'Kodiak College (UAF)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'University of Alaska Fairbanks community campus in Kodiak. Associate degrees and certificates. TA accepted. Career and technical programs.', applyUrl: 'https://www.kodiak.alaska.edu/', siteUrl: 'https://www.kodiak.alaska.edu' },
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Flagship Alaskan university available via distance learning. Engineering, science, and liberal arts. GI Bill and TA accepted.', applyUrl: 'https://admissions.uaf.edu/apply/', siteUrl: 'https://www.uaf.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university for military. Intelligence, emergency management, and security studies. TA and GI Bill accepted.', applyUrl: 'https://www.amu.apus.edu/admission/', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'USCG Base Honolulu': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Hawaii flagship research university. Business, engineering, and marine sciences. Strong veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.hawaii.edu/apply/', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with campuses in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Vocational and transfer programs in Honolulu. Automotive, electronics, and healthcare. TA-eligible.', applyUrl: 'https://honolulu.hawaii.edu/apply/', siteUrl: 'https://honolulu.hawaii.edu' },
  ],
  'USCG Base Elizabeth City': [
    { name: 'College of the Albemarle', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Elizabeth City. Nursing, IT, and business programs. TA accepted. Flexible scheduling for shift workers.', applyUrl: 'https://www.albemarle.edu/admissions/', siteUrl: 'https://www.albemarle.edu' },
    { name: 'Elizabeth City State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU with strong STEM programs, including aviation. Affordable tuition with veteran services. GI Bill and TA accepted.', applyUrl: 'https://www.ecsu.edu/admissions/apply/', siteUrl: 'https://www.ecsu.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. 1 hour from Elizabeth City. Yellow Ribbon.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
  ],
  'USCG ISC Portsmouth': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Monarch Military Center. Engineering, business, and education. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Nursing, IT, and business. Strong military family enrollment. TA-eligible.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU near Portsmouth. Mass communications, technology, and social work. Veteran-friendly campus.', applyUrl: 'https://www.nsu.edu/admissions/', siteUrl: 'https://www.nsu.edu' },
  ],
  'Coast Guard Island Alameda': [
    { name: 'California State University East Bay', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Hayward across the bay. Business, nursing, and computer science. Military-friendly with veteran resource center.', applyUrl: 'https://www.csueastbay.edu/admissions/', siteUrl: 'https://www.csueastbay.edu' },
    { name: 'College of Alameda', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Peralta community college on Alameda Island. Aviation maintenance, business, and IT. TA-eligible. Very close to Coast Guard Island.', applyUrl: 'https://www.alameda.peralta.edu/admissions/', siteUrl: 'https://www.alameda.peralta.edu' },
    { name: 'UC Berkeley', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'World-renowned public university across the bay. Engineering, business, and law. Yellow Ribbon certified.', applyUrl: 'https://admissions.berkeley.edu/apply/', siteUrl: 'https://www.berkeley.edu' },
    { name: 'Saint Mary\'s College of California', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private Catholic liberal arts college. Business, nursing, and education. Yellow Ribbon participant. 20 minutes from CG Island.', applyUrl: 'https://www.stmarys-ca.edu/admissions/', siteUrl: 'https://www.stmarys-ca.edu' },
  ],
  'USCG Training Center Petaluma': [
    { name: 'Santa Rosa Junior College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'One of California\'s top community colleges. Business, nursing, and culinary arts. TA accepted. Transfer pathway to CSU/UC.', applyUrl: 'https://www.santarosa.edu/admissions/', siteUrl: 'https://www.santarosa.edu' },
    { name: 'Sonoma State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Rohnert Park, 8 miles from TRACEN. Business, nursing, and liberal arts. Veteran-friendly campus.', applyUrl: 'https://www.sonoma.edu/admissions/', siteUrl: 'https://www.sonoma.edu' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo. Physician assistant, pharmacy, and nursing programs. Military-friendly.', applyUrl: 'https://www.tu.edu/admissions/', siteUrl: 'https://www.tu.edu' },
  ],
  'USCG Sector New York': [
    { name: 'College of Staten Island (CUNY)', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CUNY campus on Staten Island near USCG Sector NY. Nursing, business, and social work. Affordable tuition and TA-eligible.', applyUrl: 'https://www.csi.cuny.edu/admissions/apply/', siteUrl: 'https://www.csi.cuny.edu' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-class private university in NYC. Law, business, and engineering. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://apply.nyu.edu/', siteUrl: 'https://www.nyu.edu' },
    { name: 'St. John\'s University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Catholic university in Queens. Law, pharmacy, and business. Yellow Ribbon and military tuition rates.', applyUrl: 'https://admissions.stjohns.edu/', siteUrl: 'https://www.stjohns.edu' },
  ],
  'USCG Sector Miami': [
    { name: 'Florida International University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large research university in Miami. Business, engineering, and law. Strong veteran support office. GI Bill and TA accepted.', applyUrl: 'https://admissions.fiu.edu/apply/', siteUrl: 'https://www.fiu.edu' },
    { name: 'Miami Dade College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Nation\'s largest community college system. Associate degrees and certificates. Very affordable. TA-eligible.', applyUrl: 'https://www.mdc.edu/admissions/', siteUrl: 'https://www.mdc.edu' },
    { name: 'University of Miami', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Private research university in Coral Gables. Marine science, business, and law. Yellow Ribbon participant.', applyUrl: 'https://www.miami.edu/admissions/', siteUrl: 'https://www.miami.edu' },
  ],
  'USCG Sector New Orleans': [
    { name: 'Tulane University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Top private research university. Public health, business, and law. Yellow Ribbon participant. Strong veteran support.', applyUrl: 'https://admission.tulane.edu/apply/', siteUrl: 'https://www.tulane.edu' },
    { name: 'University of New Orleans', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public urban university. Business, engineering, and film studies. Veteran-friendly with active veterans office.', applyUrl: 'https://www.uno.edu/admissions/', siteUrl: 'https://www.uno.edu' },
    { name: 'Delgado Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Louisiana\'s largest community college. Healthcare, culinary arts, and IT. TA-eligible. Multiple campuses in metro area.', applyUrl: 'https://www.dcc.edu/admissions/', siteUrl: 'https://www.dcc.edu' },
  ],
  'USCG Sector Houston-Galveston': [
    { name: 'University of Houston', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university. Business, engineering, and law. Active veteran services. GI Bill and TA accepted.', applyUrl: 'https://www.uh.edu/admissions/apply/', siteUrl: 'https://www.uh.edu' },
    { name: 'College of the Mainland', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Texas City near Galveston. Nursing, welding, and business. TA-eligible.', applyUrl: 'https://www.com.edu/admissions/', siteUrl: 'https://www.com.edu' },
    { name: 'University of Texas Medical Branch (UTMB)', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Medical school and health sciences in Galveston. Nursing and allied health. Strong military connections.', applyUrl: 'https://www.utmb.edu/admissions/', siteUrl: 'https://www.utmb.edu' },
  ],
  'USCG Sector San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large CSU campus. Business, engineering, and public health. Strong veteran support and military community.', applyUrl: 'https://admissions.sdsu.edu/apply/', siteUrl: 'https://www.sdsu.edu' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Downtown San Diego community college. Nursing, business, and IT. TA-eligible. Strong military enrollment.', applyUrl: 'https://www.sdcity.edu/Admissions/', siteUrl: 'https://www.sdcity.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: 'https://admissions.ucsd.edu/apply/', siteUrl: 'https://www.ucsd.edu' },
  ],
  'USCG AIRSTA Traverse City': [
    { name: 'Northwestern Michigan College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Traverse City. Aviation, maritime, and business programs. TA-eligible. Strong career focus.', applyUrl: 'https://www.nmc.edu/admissions/', siteUrl: 'https://www.nmc.edu' },
    { name: 'Central Michigan University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Regional university with distance learning options. Business, health sciences, and education. Yellow Ribbon participant.', applyUrl: 'https://www.cmich.edu/admissions/', siteUrl: 'https://www.cmich.edu' },
  ],
  'USCG Sector Puget Sound': [
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified.', applyUrl: 'https://apply.washington.edu/', siteUrl: 'https://www.washington.edu' },
    { name: 'Seattle Central College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Downtown Seattle community college. Culinary, nursing, and IT programs. TA-eligible. Transfer pathway to UW.', applyUrl: 'https://www.seattlecentral.edu/admissions/', siteUrl: 'https://www.seattlecentral.edu' },
    { name: 'Seattle University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Jesuit university in Seattle. Law, nursing, and business. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.seattleu.edu/undergraduate-admissions/apply/', siteUrl: 'https://www.seattleu.edu' },
  ],
  'USCG Sector Boston': [
    { name: 'Massachusetts Maritime Academy', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Only public maritime academy in New England. Marine transportation, marine engineering, and emergency management. Strong CG connections.', applyUrl: 'https://www.maritime.edu/admissions/apply/', siteUrl: 'https://www.maritime.edu' },
    { name: 'Bunker Hill Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Boston. Business, healthcare, and liberal arts. TA-eligible. Transfer pathway to state universities.', applyUrl: 'https://www.bhcc.edu/admissions/', siteUrl: 'https://www.bhcc.edu' },
    { name: 'Northeastern University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top co-op university. Engineering, business, and cybersecurity. Yellow Ribbon participant. Excellent veteran support.', applyUrl: 'https://admissions.northeastern.edu/apply/', siteUrl: 'https://www.northeastern.edu' },
  ],
  'USCG Sector Baltimore': [
    { name: 'University of Maryland Baltimore County', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public research university near Baltimore. Cybersecurity, engineering, and health sciences. Strong veteran services.', applyUrl: 'https://admissions.umbc.edu/apply/', siteUrl: 'https://www.umbc.edu' },
    { name: 'Community College of Baltimore County', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Multiple campuses in Baltimore area. Nursing, IT, and business. TA-eligible. Flexible scheduling.', applyUrl: 'https://www.ccbcmd.edu/Get-Started/Apply/', siteUrl: 'https://www.ccbcmd.edu' },
    { name: 'Towson University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university near Baltimore. Business, nursing, and education programs. Veteran-friendly with active veterans services.', applyUrl: 'https://www.towson.edu/admissions/apply/', siteUrl: 'https://www.towson.edu' },
  ],
  'USCG AIRSTA Sitka': [
    { name: 'University of Alaska Southeast (Sitka)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UAS campus in Sitka. Associate degrees and certificates in business, health, and liberal arts. TA accepted.', applyUrl: 'https://www.uas.alaska.edu/admissions/', siteUrl: 'https://www.uas.alaska.edu' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading fully online military university. Available from remote Alaska assignments. TA and GI Bill accepted.', applyUrl: 'https://www.umgc.edu/admission/apply/', siteUrl: 'https://www.umgc.edu' },
  ],
  'USCG Sector Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville. Business, nursing, and computer science. Active veteran services and military tuition rates.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college system in Jacksonville. Nursing, IT, and business. TA-eligible. Multiple campuses.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university with aviation, nursing, and business programs. Military-friendly. Yellow Ribbon participant.', applyUrl: 'https://www.ju.edu/admissions/apply/', siteUrl: 'https://www.ju.edu' },
  ],
  'USCG Sector Charleston': [
    { name: 'College of Charleston', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Historic public liberal arts university. Business, marine biology, and education. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://admissions.cofc.edu/apply/', siteUrl: 'https://www.cofc.edu' },
    { name: 'Trident Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college in Charleston. Nursing, IT, and culinary arts. TA-eligible. High military enrollment.', applyUrl: 'https://www.tridenttech.edu/admissions/', siteUrl: 'https://www.tridenttech.edu' },
    { name: 'The Citadel', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Military college of South Carolina. Business, science, and engineering. Strong connection to armed services. Yellow Ribbon.', applyUrl: 'https://www.citadel.edu/root/admissions', siteUrl: 'https://www.citadel.edu' },
  ],
};

// DoD Voluntary Education partner schools that operate on-installation at
// OCONUS bases. Drawn from the public DoDEA / DANTES / installation MWR
// education-center program lists. Same shape as INSTALLATION_COLLEGES so
// the OCONUS college tab renders the curated CONUS-style card layout.
const OCONUS_PARTNER_SCHOOLS = {
  UMGC:     { name: 'University of Maryland Global Campus', type: 'Public',  degree: '4-Year University', rating: 4.0, desc: 'DoD-partnered worldwide university. On-base classrooms and online courses. Accepts TA and GI Bill. Designed for service members and dependents.', applyUrl: 'https://www.umgc.edu/admissions',                  siteUrl: 'https://www.umgc.edu' },
  CTC:      { name: 'Central Texas College',                 type: 'Public',  degree: '2-Year College',     rating: 4.1, desc: 'DoD voluntary-education partner. Worldwide on-installation associate degrees and certificates. TA accepted. Strong military student services.',           applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ERAU:     { name: 'Embry-Riddle Aeronautical University',  type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Aeronautical and aerospace-focused worldwide campus. Aviation, engineering, security, and management programs. On-base resident centers and online.',     applyUrl: 'https://worldwide.erau.edu/admissions',          siteUrl: 'https://worldwide.erau.edu' },
  Park:     { name: 'Park University',                       type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Long-standing DoD partner. Associate, bachelor, and master degrees through resident centers on more than 40 military installations worldwide.',        applyUrl: 'https://www.park.edu/admissions/',                siteUrl: 'https://www.park.edu' },
  Coastline:{ name: 'Coastline Community College',           type: 'Public',  degree: '2-Year College',     rating: 3.8, desc: 'California community college serving military worldwide. Online associate degrees and certificates designed around deployments and PCS moves.',        applyUrl: 'https://www.coastline.edu/admissions/',          siteUrl: 'https://www.coastline.edu' },
  CCAF:     { name: 'Community College of the Air Force',    type: 'Public',  degree: '2-Year College',     rating: 4.3, desc: 'Federally chartered, regionally accredited associate-degree program for enlisted Airmen and Guardians. Credit awarded for technical training.',        applyUrl: 'https://www.airuniversity.af.edu/Barnes/CCAF/',    siteUrl: 'https://www.airuniversity.af.edu/Barnes/CCAF/' },
  TUI:      { name: 'Trident University International',      type: 'Private', degree: '4-Year University', rating: 3.7, desc: '100% online university with strong military enrollment. Bachelor, master, and doctoral degrees in business, IT, health sciences, and education.',      applyUrl: 'https://www.trident.edu/admissions/',             siteUrl: 'https://www.trident.edu' },
  CityChicago: { name: 'City Colleges of Chicago',           type: 'Public',  degree: '2-Year College',     rating: 3.8, desc: 'DoD partner serving Navy worldwide through online associate-degree programs. TA accepted. Strong general-education and IT pathways.',                applyUrl: 'https://www.ccc.edu/admissions/Pages/default.aspx', siteUrl: 'https://www.ccc.edu' },
};

// Bundles below are reused across installation aliases to keep the data table
// compact while ensuring every OCONUS canonical name in INSTALLATION_MARKETS
// (and the most-common spellings users actually type) hits the same curated
// set of DoD voluntary-education partner schools.
const OCONUS_BUNDLE_KOREA_ARMY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_KOREA_AF    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_JAPAN_AF    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_OKINAWA     = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CTC];
const OCONUS_BUNDLE_USMC_OKI    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Coastline];
const OCONUS_BUNDLE_NAVY_JAPAN  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_GERMANY     = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_GERMANY_AF  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CTC];
const OCONUS_BUNDLE_ITALY_ARMY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_ITALY_NAVY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_ITALY_AF    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_UK_AF       = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_SPAIN_NAVY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_GREECE      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago];
const OCONUS_BUNDLE_TURKEY      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_MIDDLE_EAST = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_GUAM        = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.ERAU];
const OCONUS_BUNDLE_HAWAII      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.ERAU];
const OCONUS_BUNDLE_ALASKA      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.ERAU];
const OCONUS_BUNDLE_GREENLAND   = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_BELGIUM     = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_POLAND      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Park];

const OCONUS_COLLEGES = {
  // ── ARMY · KOREA ─────────────────────────────────────────────────────────
  'USAG Humphreys':                     OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Humphreys':                     OCONUS_BUNDLE_KOREA_ARMY,
  'USAG Daegu':                         OCONUS_BUNDLE_KOREA_ARMY,
  'USAG Yongsan-Casey':                 OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Walker':                        OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Henry':                         OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Carroll':                       OCONUS_BUNDLE_KOREA_ARMY,
  'Pier 8 Busan':                       OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Casey':                         OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Hovey':                         OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Red Cloud':                     OCONUS_BUNDLE_KOREA_ARMY,
  // ── ARMY · JAPAN ─────────────────────────────────────────────────────────
  'USAG Japan (Camp Zama)':             [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Sagami Depot':                       [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Yokohama North Dock':                [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago],
  'Torii Station (USAG Okinawa)':       OCONUS_BUNDLE_OKINAWA,
  // ── ARMY · GERMANY ───────────────────────────────────────────────────────
  'USAG Stuttgart':                     OCONUS_BUNDLE_GERMANY,
  'USAG Wiesbaden':                     OCONUS_BUNDLE_GERMANY,
  'USAG Bavaria (Grafenwöhr)':          OCONUS_BUNDLE_GERMANY,
  'Grafenwöhr Training Area':           OCONUS_BUNDLE_GERMANY,
  'Rose Barracks Vilseck':              OCONUS_BUNDLE_GERMANY,
  'Hohenfels Training Area':            OCONUS_BUNDLE_GERMANY,
  'Garmisch Resort':                    OCONUS_BUNDLE_GERMANY,
  'USAG Ansbach':                       OCONUS_BUNDLE_GERMANY,
  'USAG Rheinland-Pfalz (Kaiserslautern)': OCONUS_BUNDLE_GERMANY,
  'Kaiserslautern Military Community':  OCONUS_BUNDLE_GERMANY,
  'Landstuhl Regional Medical Center':  OCONUS_BUNDLE_GERMANY,
  'Sembach Kaserne':                    OCONUS_BUNDLE_GERMANY,
  'Pulaski Barracks':                   OCONUS_BUNDLE_GERMANY,
  'Panzer Kaserne':                     OCONUS_BUNDLE_GERMANY,
  'Vogelweh Military Complex':          OCONUS_BUNDLE_GERMANY,
  'USAG Baumholder':                    OCONUS_BUNDLE_GERMANY,
  'USAG Hohenfels':                     OCONUS_BUNDLE_GERMANY,
  'USAG Garmisch':                      OCONUS_BUNDLE_GERMANY,
  // ── ARMY · BELGIUM / NL / POLAND / KOSOVO ────────────────────────────────
  'USAG Belgium (SHAPE)':               OCONUS_BUNDLE_BELGIUM,
  'Chievres Air Base':                  OCONUS_BUNDLE_BELGIUM,
  'Daumerie Caserne':                   OCONUS_BUNDLE_BELGIUM,
  'USAG BENELUX-Brussels':              OCONUS_BUNDLE_BELGIUM,
  'USAG BENELUX Brunssum':              OCONUS_BUNDLE_BELGIUM,
  'USAG Poland':                        OCONUS_BUNDLE_POLAND,
  'Camp Kosciuszko Poznan':             OCONUS_BUNDLE_POLAND,
  'Powidz Air Base':                    OCONUS_BUNDLE_POLAND,
  'Camp Bondsteel':                     [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC],
  // ── ARMY · ITALY ─────────────────────────────────────────────────────────
  'USAG Italy (Vicenza)':               OCONUS_BUNDLE_ITALY_ARMY,
  'Caserma Ederle':                     OCONUS_BUNDLE_ITALY_ARMY,
  'Caserma Del Din':                    OCONUS_BUNDLE_ITALY_ARMY,
  'USAG Italy (Livorno)':               OCONUS_BUNDLE_ITALY_ARMY,
  'Camp Darby':                         OCONUS_BUNDLE_ITALY_ARMY,
  // ── NAVY · OCONUS ────────────────────────────────────────────────────────
  'Naval Support Activity Bahrain':     OCONUS_BUNDLE_MIDDLE_EAST,
  'NSA Bahrain':                        OCONUS_BUNDLE_MIDDLE_EAST,
  'Navy Support Facility Diego Garcia': [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago],
  'Naval Station Guantanamo Bay':       [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Naval Support Activity Souda Bay':   OCONUS_BUNDLE_GREECE,
  'Naval Base Guam':                    OCONUS_BUNDLE_GUAM,
  'Commander Fleet Activities Yokosuka': OCONUS_BUNDLE_NAVY_JAPAN,
  'Commander Fleet Activities Sasebo':  OCONUS_BUNDLE_NAVY_JAPAN,
  'Naval Air Facility Atsugi':          OCONUS_BUNDLE_NAVY_JAPAN,
  'Naval Air Station Sigonella':        OCONUS_BUNDLE_ITALY_NAVY,
  'Naval Support Activity Naples':      OCONUS_BUNDLE_ITALY_NAVY,
  'Naval Support Activity Singapore':   [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Naval Station Rota':                 OCONUS_BUNDLE_SPAIN_NAVY,
  'Naval Support Activity Stavanger':   [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago],
  'Commander Fleet Activities Chinhae': [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Joint Base Pearl Harbor-Hickam':     OCONUS_BUNDLE_HAWAII,
  // ── MARINE CORPS · OCONUS ────────────────────────────────────────────────
  'Camp Butler (Okinawa)':              OCONUS_BUNDLE_USMC_OKI,
  'Camp Foster':                        OCONUS_BUNDLE_USMC_OKI,
  'Camp Kinser':                        OCONUS_BUNDLE_USMC_OKI,
  'Camp Courtney':                      OCONUS_BUNDLE_USMC_OKI,
  'Camp Hansen':                        OCONUS_BUNDLE_USMC_OKI,
  'Camp Schwab':                        OCONUS_BUNDLE_USMC_OKI,
  'MCAS Futenma':                       OCONUS_BUNDLE_USMC_OKI,
  'MCAS Iwakuni':                       [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.Coastline, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CityChicago],
  // ── AIR FORCE · OCONUS ───────────────────────────────────────────────────
  'Ramstein AB':                        OCONUS_BUNDLE_GERMANY_AF,
  'Spangdahlem AB':                     OCONUS_BUNDLE_GERMANY_AF,
  'Aviano AB':                          OCONUS_BUNDLE_ITALY_AF,
  'Incirlik AB':                        OCONUS_BUNDLE_TURKEY,
  'Kadena AB':                          OCONUS_BUNDLE_OKINAWA,
  'Misawa AB':                          OCONUS_BUNDLE_JAPAN_AF,
  'Yokota AB':                          OCONUS_BUNDLE_JAPAN_AF,
  'Osan AB':                            OCONUS_BUNDLE_KOREA_AF,
  'Kunsan AB':                          OCONUS_BUNDLE_KOREA_AF,
  'RAF Lakenheath':                     OCONUS_BUNDLE_UK_AF,
  'RAF Mildenhall':                     OCONUS_BUNDLE_UK_AF,
  'RAF Alconbury':                      OCONUS_BUNDLE_UK_AF,
  'RAF Croughton':                      OCONUS_BUNDLE_UK_AF,
  'Andersen AFB (Guam)':                OCONUS_BUNDLE_GUAM,
  'Morón AB':                           [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU],
  'Geilenkirchen NATO Air Base':        OCONUS_BUNDLE_GERMANY_AF,
  'Lajes Field':                        [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU],
  // ── SPACE FORCE · OCONUS ─────────────────────────────────────────────────
  'Thule Air Base / Pituffik Space Base': OCONUS_BUNDLE_GREENLAND,
  // ── ALASKA (treated as OCONUS for college fallback) ──────────────────────
  'Fort Wainwright':                    OCONUS_BUNDLE_ALASKA,
  'Fort Greely':                        OCONUS_BUNDLE_ALASKA,
  'Eielson AFB':                        OCONUS_BUNDLE_ALASKA,
  'Clear Space Force Station':          OCONUS_BUNDLE_ALASKA,
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
  'Fayetteville State University': { applyUrl: 'https://www.uncfsu.edu/', siteUrl: 'https://www.uncfsu.edu' },
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
      { name: 'The Brandon Act', desc: 'Official information explaining how service members can request mental health support through their chain of command.', url: 'https://www.health.mil/Military-Health-Topics/Mental-Health/Brandon-Act' },
    ],
    'family-support': [
      { name: 'Military OneSource Mental Health', desc: 'Public mental health resource hub for military personnel and families.', url: 'https://www.militaryonesource.mil/health-wellness/mental-health/' },
      { name: 'inTransition', desc: 'Free confidential coaching for service members, veterans, and retirees who need mental health care during transitions.', url: 'https://www.health.mil/Military-Health-Topics/Mental-Health/inTransition' },
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
        {resources[tab].filter(item => item.url).map(item => (
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
  // Curated CONUS list first, then OCONUS DoD-partner schools so OCONUS
  // bases (Camp Humphreys, Ramstein, Yokota, Vicenza, etc.) render the
  // same card layout as CONUS bases instead of the generic empty state.
  const nearbyColleges = INSTALLATION_COLLEGES[resolvedInstall]
    || INSTALLATION_COLLEGES[installName]
    || OCONUS_COLLEGES[resolvedInstall]
    || OCONUS_COLLEGES[installName]
    || [];

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
      url: 'https://www.armyignited.army.mil/student/',
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
      url: 'https://www.dantes.mil/mil-ta/',
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
      url: 'https://afvec.us.af.mil/afvec/public/welcome',
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
      url: 'https://afvec.us.af.mil/afvec/public/welcome',
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
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`pcs-tab ${activeTab === t.id ? 'is-active' : ''}`} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`, background: activeTab === t.id ? theme.primary : '#FFF', color: activeTab === t.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
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
              <a href={ch.apply} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, marginTop: 10 }}>Apply Online</a>
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
          <a href="https://www.va.gov/education/how-to-apply/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, marginTop: 8, fontSize: 13 }}>
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
            <a href={selectedTA.url} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, fontSize: 13 }}>
              Open {selectedTA.portal}
            </a>
            {selectedTA.secondaryUrl && (
              <a href={selectedTA.secondaryUrl} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
                Open application portal
              </a>
            )}
            <a href={selectedTA.source} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
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
                        <a href={links.applyUrl} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, flex: 2, minWidth: 150 }}>Enrollment / Admissions</a>
                      )}
                      {links.siteUrl && (
                        <a href={links.siteUrl} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost" style={{ flex: 1, minWidth: 110 }}>College Website</a>
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
            <>
              {/* Google Maps deep-link discovery cards. The curated
                  INSTALLATION_COLLEGES list keys off CONUS US installation
                  names; OCONUS bases (USAG Humphreys, Ramstein, Yokota,
                  etc.) get no curated rows and the prior empty state
                  showed only generic SBA-style sources. These category
                  cards open Google Maps with the gaining-installation
                  locality pre-filled so users see real local colleges
                  and DoD-partner programs that accept TA. */}
              <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'Colleges & universities',               q: `colleges and universities near ${resolvedInstall}` },
                  { label: 'Community colleges',                     q: `community colleges near ${resolvedInstall}` },
                  { label: 'DoD voluntary education partners',       q: `DoD voluntary education partner near ${resolvedInstall}` },
                  { label: 'Online programs accepting Military TA',  q: `online university accepting military tuition assistance` },
                ].map((cat, idx) => (
                  <a key={idx}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cat.q)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{cat.label} near {resolvedInstall}</div>
                    <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
                      Curated Google Maps search restricted to the area around your gaining installation. Opens with real local schools, ratings, contact info, and TA acceptance details so you can compare and apply.
                    </div>
                    <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open map view</span>
                  </a>
                ))}
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 6 }}>Official college sources for {getInstallationSearchLocation(resolvedInstall)}</div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 12 }}>PCS Express has not stored local college cards for this installation yet. The Google Maps cards above surface real local schools, and the official public search paths below cover NCES, DoDEA, DANTES voluntary education, and branch-specific TA portals.</div>
                {officialCollegeCards(resolvedInstall).map(card => (
                  <a key={card.name} href={card.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E0E6EE', color: '#0D1821', textDecoration: 'none', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                    <span style={{ display: 'block' }}>{card.name}</span>
                    <span style={{ display: 'block', fontSize: 10, color: '#56697C', fontWeight: 500, lineHeight: 1.45, marginTop: 3 }}>{card.desc}</span>
                  </a>
                ))}
              </div>
            </>
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
            { name: "ArmyIgnitED", desc: "Official Army portal for Tuition Assistance requests, education counseling, and CLEP/DANTES exam registration.", url: "https://www.armyignited.army.mil/student/" },
            { name: "DANTES (DSST Exams)", desc: "Free college-level subject exams for service members — earn college credit.", url: "https://www.dantes.mil" },
            { name: "DANTES Education Programs", desc: "Official voluntary education, testing, and career planning resources for service members.", url: "https://www.dantes.mil/Education-Programs/" },
            { name: "VA Education Benefits", desc: "Apply for and manage VA education benefits on VA.gov.", url: "https://www.va.gov/education/" },
          ].filter(r => r.url).map((r, idx) => (
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
            { title: 'How to Apply', items: ['1. Visit MyCAA portal at mycaa.militaryonesource.mil', '2. Create an account with your military ID info', '3. Complete career exploration and education plan', '4. Get Financial Assistance approved before enrolling', '5. School submits invoices directly to MyCAA'] },
          ].map((section, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>{section.title}</div>
              {section.items.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>✓ {item}</div>
              ))}
            </div>
          ))}
          <a href="https://mycaa.militaryonesource.mil/mycaa/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, marginBottom: 10, fontSize: 13 }}>Apply for MyCAA</a>
          <a href="https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': '#2E7D32' }}>Learn More at MilitaryOneSource</a>
        </div>
      )}
    </div>
  );
}

function ResourcesTab({ theme, profile }) {
  const [activeSection, setActiveSection] = useState('careers');
  const branch = profile?.branch || 'Army';
  const BRANCH_FAMILY_SUPPORT = {
    Army: { name: 'Army Community Service (ACS)', desc: 'Army installation-based family support, financial counseling, employment help, and relocation support.', url: 'https://installations.militaryonesource.mil/' },
    Navy: { name: 'Fleet & Family Support Center (FFSC)', desc: 'Navy family support, relocation assistance, deployment support, counseling, and employment help.', url: 'https://ffr.cnic.navy.mil/Fleet-And-Family-Readiness/Family-Readiness/Fleet-Family-Support-Program/' },
    'Marine Corps': { name: 'Marine Corps Community Services (MCCS)', desc: 'Marine Corps family readiness, relocation, counseling, employment, and financial support.', url: 'https://www.usmc-mccs.org/' },
    'Air Force': { name: 'Military & Family Readiness Center', desc: 'Air Force relocation, employment, financial readiness, family support, and deployment resources.', url: 'https://www.af.mil/Contact-Us/' },
    'Space Force': { name: 'Department of the Air Force Military & Family Readiness', desc: 'Space Force family readiness support through the servicing Department of the Air Force installation.', url: 'https://www.spaceforce.mil/Family/' },
    'Coast Guard': { name: 'Coast Guard Work-Life Program', desc: 'Coast Guard family, relocation, financial, employment, and work-life support services.', url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources-CG-1/Health-Safety-and-Work-Life-CG-11/' },
  };
  const selectedFamilySupport = BRANCH_FAMILY_SUPPORT[branch] || BRANCH_FAMILY_SUPPORT.Army;
  const BRANCH_ONLY_TAGS = ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard'];
  const getVisibleResources = (items = []) => items.filter(resource => !BRANCH_ONLY_TAGS.includes(resource.tag) || resource.tag === branch);

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
      { ...selectedFamilySupport, tag: branch },
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
      
      { name: 'Army TAP Portal', desc: 'Army Transition Assistance Program — schedule TAP workshops and manage transition', url: 'https://tapevents.mil', tag: 'Army' },
      { name: 'HRC — iPERMS', desc: 'U.S. Army Human Resources Command — view and manage your official military personnel records', url: 'https://iperms.hrc.army.mil', tag: 'Army' },
      { name: 'U.S. Army HRC Portal', desc: 'Army Human Resources Command — assignments, promotions, evaluations, and career tools', url: 'https://www.hrc.army.mil', tag: 'Army' },
      { name: 'IPPS-A', desc: 'Integrated Personnel and Pay System — Army: manage pay, personnel actions, and leave', url: 'https://ipps-a.army.mil', tag: 'Army' },
      
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
      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`pcs-tab ${activeSection === s.id ? 'is-active' : ''}`} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${activeSection === s.id ? theme.primary : '#E0E6EE'}`, background: activeSection === s.id ? theme.primary : '#FFF', color: activeSection === s.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Resource cards */}
      {getVisibleResources(RESOURCES[activeSection] || []).map((r, idx) => {
        const tc = tagColor(r.tag);
        return (
          <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{r.name}</div>
              <span style={{ background: tc.bg, color: tc.color, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap' }}>{r.tag}</span>
            </div>
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="card-cta" style={{ '--cta-color': theme.primary }}>Open Resource</a>
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
const COMPONENT_TYPES = ['Active Duty', 'Reserve', 'National Guard', 'AGR', 'DoD Civilian', 'Dependent'];

// Branch -> components offered. Filters the onboarding component
// dropdown so users only see options that actually exist for their
// branch. AGR is NOT a top-level component — it is an orders-type
// selection inside Reserve/National Guard. Dependent is not a
// selectable onboarding component either; family members configure
// their profile under the sponsoring service member.
//   * Army & Air Force have full National Guard components (ARNG, ANG)
//   * Marine Corps, Navy, Coast Guard, Space Force have no National
//     Guard (Marines/Navy reserves only; Coast Guard has Reserve;
//     Space Force has no Guard component as of 2026)
//   * Every branch has a civilian workforce, so DoD Civilian is
//     available for all branches.
function componentsForBranch(branch) {
  const b = String(branch || '').trim();
  const hasGuard = b === 'Army' || b === 'Air Force';
  const hasReserve = b === 'Army' || b === 'Navy' || b === 'Marine Corps' || b === 'Air Force' || b === 'Coast Guard';
  const components = ['Active Duty'];
  if (hasReserve) components.push('Reserve');
  if (hasGuard) components.push('National Guard');
  components.push('DoD Civilian');
  return components;
}

// Federal civilian grade structure (public, from OPM):
//   * General Schedule (GS-1 through GS-15) — white-collar civilian
//   * Senior Executive Service (SES) — top civilian leadership
//   * Wage Grade (WG-1 through WG-15) — blue-collar / craft / trades
//   * Foreign Service / Other excepted schedules tracked separately
const CIVILIAN_GRADES = [
  { grade: 'GS-1',  title: 'GS-1 (Grade 1)' },
  { grade: 'GS-2',  title: 'GS-2 (Grade 2)' },
  { grade: 'GS-3',  title: 'GS-3 (Grade 3)' },
  { grade: 'GS-4',  title: 'GS-4 (Grade 4)' },
  { grade: 'GS-5',  title: 'GS-5 (Grade 5)' },
  { grade: 'GS-6',  title: 'GS-6 (Grade 6)' },
  { grade: 'GS-7',  title: 'GS-7 (Grade 7)' },
  { grade: 'GS-8',  title: 'GS-8 (Grade 8)' },
  { grade: 'GS-9',  title: 'GS-9 (Grade 9)' },
  { grade: 'GS-10', title: 'GS-10 (Grade 10)' },
  { grade: 'GS-11', title: 'GS-11 (Grade 11)' },
  { grade: 'GS-12', title: 'GS-12 (Grade 12)' },
  { grade: 'GS-13', title: 'GS-13 (Grade 13)' },
  { grade: 'GS-14', title: 'GS-14 (Grade 14)' },
  { grade: 'GS-15', title: 'GS-15 (Grade 15)' },
  { grade: 'SES',   title: 'SES — Senior Executive Service' },
  { grade: 'WG',    title: 'WG — Wage Grade (Trades / Craft)' },
  { grade: 'WS',    title: 'WS — Wage Supervisor' },
  { grade: 'WL',    title: 'WL — Wage Leader' },
];

// True when the profile represents a DoD civilian employee (not a
// uniformed service member or military dependent). Used to gate
// military-specific UI (BAH calculator, military rank inputs, etc.)
// and surface civilian-equivalent guidance (locality pay, FEHB,
// PCS-civ entitlements).
function isDodCivilian(profile) {
  return String(profile?.component || '').trim() === 'DoD Civilian';
}

// Expanded language picker. The first 12 entries (English + 11 locales)
// carry curated in-app dictionaries in APP_TRANSLATIONS. The African +
// additional locales below ride on the Google Website Translator
// runtime — `googleTranslateRuntime.js` activates when the user picks
// any non-English locale, and Google translates the entire DOM. The
// curated dictionaries cover navigation labels and demo-tour copy for
// the 11 main locales; everything else (including all card content for
// the African locales) is translated by Google.
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',              native: 'English'    },
  // Curated catalogs (dictionary + Google Translate)
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
  // African languages — Google-Translate-only coverage. Ordered by
  // approximate native-speaker count to surface the most-spoken
  // first in the dropdown.
  { code: 'sw', name: 'Swahili',              native: 'Kiswahili'  },
  { code: 'ha', name: 'Hausa',                native: 'Hausa'      },
  { code: 'yo', name: 'Yoruba',               native: 'Yorùbá'     },
  { code: 'am', name: 'Amharic',              native: 'አማርኛ'        },
  { code: 'zu', name: 'Zulu',                 native: 'isiZulu'    },
  { code: 'ig', name: 'Igbo',                 native: 'Igbo'       },
  { code: 'so', name: 'Somali',               native: 'Soomaali'   },
  { code: 'af', name: 'Afrikaans',            native: 'Afrikaans'  },
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
    languageHelp: 'Pick your language. The app switches right away.',
    departingFrom: 'DEPARTING FROM (LOSING INSTALLATION)',
    reportingToLabel: 'REPORTING TO (GAINING INSTALLATION)',
    departingDate: 'DEPARTING DATE',
    spouseDepsTravel: 'Spouse / Dependents traveling with me',
    childrensAges: "CHILDREN'S AGES",
    addChild: '+ Add Child',
    noChildrenYet: 'No children added yet',
    childN: 'Child',
    yrs: 'yrs',
    agePlaceholder: 'Age',
    religiousPreference: 'RELIGIOUS PREFERENCE',
    religiousPreferenceNote: '(for chaplain & community resources)',
    religiousPreferenceHelp: 'Optional — helps surface relevant chapel and community resources',
    typeBaseName: 'Type base name...',
    hasPetsLabel: 'I have pets coming with me',
    hasPetsHelp: 'We\'ll add USDA and pet paperwork to your list.',
    moveType: 'HOW ARE YOU MOVING?',
    moveTypeHHG: 'HHG (Government movers)',
    moveTypeHHGHelp: 'Movers arrange packing and shipping. No weight tickets needed.',
    moveTypePPM: 'PPM (Move yourself, get paid back)',
    moveTypePPMHelp: 'You move your own stuff. Save weight tickets — the government pays you for moving it.',
    zeroUploadTitle: 'WHY WE DON\'T ASK FOR DOCUMENTS',
    zeroUploadBody: "We never want copies of your orders, IDs, or other documents. Everything you type stays on this phone, scrambled with strong encryption (AES-256). We never see it. There's nothing to leak because there's no server holding your data.",
    reportNLTDate: 'REPORT-NLT DATE',
    reportNLTHelp: 'The "must arrive by" date on your orders. Your countdown clock counts down from this date.',
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
    defaultCategoryDescription: 'Review official public information and PCS planning tools for this category.',
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
      home: 'Command Center',
      'pcs-operations': 'PCS Operations',
      'home-relocation': 'Movement & Logistics',
      'family-readiness': 'Family Readiness',
      'medical-readiness': 'Holistic Health',
      'mission-resources': 'Mission Resources',
      // Legacy keys kept for deep-link compatibility — these tabs are
      // no longer in the bottom nav but old routes still resolve.
      'base-intelligence': 'Base Insights',
      checklist: 'Checklist',
      compliance: 'Compliance',
      documents: 'Paperwork',
      education: 'Education',
      family: 'Family',
      nav: 'Maps',
      resources: 'Help Hub',
      religion: 'Faith & Chaplains',
      translation: 'Translation',
      veterans: 'Veteran Support',
    },
    desc: {
      'pcs-operations': 'Everything PCS planning needs in one operations cell: phased task checklist, paperwork roster with binder export, and the 180-day OCONUS / 90-day CONUS timeline backward-planned from your report-no-later-than date.',
      'mission-resources': 'Field references for the gaining installation: Base Insights (verified family reviews), Maps, Help Hub (consolidated DoD/VA/family/financial resource directory), and Veteran Support.',
      'family-readiness': 'Family-side mission readiness: deployment, EFMP, spouse employment, family activities, permanent residency, pets, K-12 schools — plus Education benefits, Translation, and Faith & Chaplains.',
      'base-intelligence': 'Reviews from real military families on housing, schools, and childcare at your gaining installation. Reviews from .mil emails get a "Military Family Verified" badge.',
      checklist: 'A full PCS task list, organized by phase (Orders Received through In-Processing). Toggle reminders on key milestones. Nothing here asks for documents — just check items off as you finish them.',
      compliance: 'In plain language, how PCS Express keeps your information safe. Your PCS profile and notes never leave your phone — they\'re scrambled with strong encryption and saved only on this device. There\'s no PCS Express server holding your data, no account to hack, nothing to leak.',
      documents: 'A checklist for every PCS form you need to gather. Check items off as you collect the actual paperwork yourself. Export the checklist as a printable PDF for the gaining S1 / HR / VA. PCS Express never accepts, stores, or transmits uploads.',
      education: 'Tuition Assistance portals, GI Bill chapters, MyCAA spouse scholarships, and a curated list of colleges near the gaining installation.',
      family: 'Family-specific PCS planning: deployment support, EFMP, spouse employment, permanent residency for immigrant spouses, pets, and K-12 schools — all in one tab.',
      'home-relocation': 'Eight tools in one tab — Home Locator, BAH / OHA / LQA calculators, PPM estimator, inflation-adjusted Budget, Shipment Tracker, Inventory worksheet, JTR Assistant, Move Aid, and VA Loan.',
      'medical-readiness': 'Total well-being in four sections: Medical Care (ER, hospitals, urgent care, specialty, dental, vision, pharmacy, preventive / PHA), Behavioral Health & Counseling, Spiritual Care, and Fitness (gyms, workouts during PCS, diet and meal tips for traveling). Tailored to your component, branch, and TRICARE region (or FEHB for DoD Civilians).',
      nav: 'Plan routes and save directions on a public installation map. No restricted or non-public base details.',
      resources: 'One hub of official, public military, government, family, financial, healthcare, and PCS resources.',
      religion: 'Worship services and the Chaplains tab — both filtered to your gaining installation. Free, confidential pastoral support for service members of all faiths (and no faith).',
      translation: 'Common phrases in 20+ languages, an AI translate box (with an OPSEC warning so you never paste sensitive info), and a Free Resources tab tailored to your component.',
      veterans: 'Veteran-owned businesses, public directories, and local veteran resources around your gaining location.',
    },
    demo: {
      securityTitle: 'Your data stays on your phone',
      securityBody: 'Everything you type goes into a locked-down storage area on this device. We scramble it with strong encryption (AES-256) so even if someone steals your phone, they can\'t read it. We don\'t send your data anywhere. There\'s no PCS Express account, no upload, no cloud. The small "Saved" button in the bottom corner shows when your last change was saved. If you want to start fresh, the red Reset button in the More menu wipes everything from this device.',
      tminusTitle: 'Your countdown clock',
      tminusBody: 'The Home screen shows how many days until you need to report to your new base. Each milestone tells you what to do next — schedule your move, get medical records, out-process — and the color changes as you get closer (green when you\'ve arrived, amber when it\'s under a month, red when it\'s the final week).',
      componentTitle: 'Tips for your component',
      componentBody: 'If you\'re Guard, Reserve, or AGR — not Active Duty — the Home screen shows a tips card just for you. It covers things Active Duty users don\'t worry about, like checking whether your orders are Title 10 or Title 32, calling your State HQ, switching TRICARE coverage, and updating your state license if you\'re moving across state lines.',
      householdTitle: 'Step 3 — Pets and how you\'re moving',
      householdBody: 'In step 3, tell us if you have pets (we\'ll add USDA and pet paperwork to your list) and pick how you\'re moving: government movers (HHG) or moving yourself for cash back (PPM / DITY). Your choice shows different paperwork — weight tickets and pro-gear forms only show if you picked PPM.',
      profileTitle: 'Step 1 — About you',
      profileBody: 'Step 1 asks your branch, component (Active / Guard / Reserve), rank, name, and preferred language. We use this to show you the right forms (DA 31 for Army, NAVPERS for Navy, etc.), the right job titles, and to translate the app if you pick a different language.',
      basesTitle: 'Step 2 — Where you\'re moving',
      basesBody: 'Step 2 asks where you\'re leaving from, where you\'re reporting to, and your Report-NLT date (the "must arrive by" date on your orders). The Report-NLT date drives your countdown clock on the Home screen.',
      familyTitle: 'Step 3 — Your household',
      familyBody: 'Step 3 asks if your spouse and kids are coming with you, their ages, if you have pets, how you\'re moving, and your faith preference. This tailors the rest of the app so you only see what applies to you — school stuff if you have kids, pet stuff if you have pets, chaplain options that match your faith.',
      selectorTitle: 'Home — Pick a category',
      selectorBody: 'The home screen has all the planning areas in alphabetical order so you can jump straight to what you need.',
      completeTitle: 'Tour complete — your PCS, end-to-end',
      completeBody: 'You just toured every category PCS Express ships with: a phased Checklist tied to your Report-NLT date, a Documents tracker, Home Relocation with BAH / OHA / LQA calculators and a PPM estimator, Family Readiness covering EFMP / immigration / employment / pets / schools, Medical Readiness with ER / hospital / urgent care / behavioral health / pharmacy locators, Base Intelligence for the gaining installation, Education for GI Bill / MyCAA / Tuition Assistance / nearby colleges, Spiritual Readiness with chapel and counseling, Veteran Resources, and an offline Translation pack for OCONUS communities. Every link is .mil / .gov / Google Maps — no fabricated providers, no PII upload, all encrypted on-device. Reset anytime from the More menu to start your real PCS plan.',
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
  departingFrom: 'SALIENDO DE (INSTALACIÓN ANTERIOR)',
  reportingToLabel: 'DESTINO (NUEVA INSTALACIÓN)',
  departingDate: 'FECHA DE SALIDA',
  spouseDepsTravel: 'Cónyuge / Dependientes que viajan conmigo',
  childrensAges: 'EDADES DE LOS HIJOS',
  addChild: '+ Agregar hijo/a',
  noChildrenYet: 'Aún no se agregaron hijos',
  childN: 'Hijo/a',
  yrs: 'años',
  agePlaceholder: 'Edad',
  religiousPreference: 'PREFERENCIA RELIGIOSA',
  religiousPreferenceNote: '(para capellán y recursos comunitarios)',
  religiousPreferenceHelp: 'Opcional — ayuda a mostrar capilla y recursos comunitarios relevantes',
  typeBaseName: 'Escriba el nombre de la base...',
  hasPetsLabel: 'Viajo con mascotas',
  hasPetsHelp: 'Muestra documentos APHIS, USDA y de importación de mascotas en su lista',
  moveType: 'TIPO DE MUDANZA',
  moveTypeHHG: 'HHG (Gobierno)',
  moveTypeHHGHelp: 'TMO coordina empacadores y transporte. No requiere tickets de peso.',
  moveTypePPM: 'PPM / DITY',
  moveTypePPMHelp: 'Usted se muda. Guarde los tickets de peso para el pago de incentivo.',
  zeroUploadTitle: 'POR QUÉ NO PEDIMOS DOCUMENTOS',
  zeroUploadBody: 'PCS Express nunca guarda sus órdenes, identificaciones u otros documentos. Todo lo que ingresa permanece en su dispositivo, cifrado con AES-256. Nunca lo vemos, y no hay archivos que puedan filtrarse. Sus datos son solo suyos.',
  reportNLTDate: 'FECHA DE REPORTE NLT',
  reportNLTHelp: 'La fecha "no más tarde de" que figura en sus órdenes. Los hitos T-Menos se calculan desde esta fecha.',
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
  defaultCategoryDescription: 'Revise información pública oficial y herramientas de planificación PCS.',
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
    'medical-readiness': 'Preparación médica',
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
  departingFrom: 'ABREISE VON (FRÜHERER STANDORT)',
  reportingToLabel: 'ZIEL (NEUER STANDORT)',
  departingDate: 'ABREISEDATUM',
  spouseDepsTravel: 'Ehepartner / Angehörige reisen mit',
  childrensAges: 'ALTER DER KINDER',
  addChild: '+ Kind hinzufügen',
  noChildrenYet: 'Noch keine Kinder hinzugefügt',
  childN: 'Kind',
  yrs: 'Jahre',
  agePlaceholder: 'Alter',
  religiousPreference: 'RELIGIONSZUGEHÖRIGKEIT',
  religiousPreferenceNote: '(für Seelsorge- und Gemeinschaftsangebote)',
  religiousPreferenceHelp: 'Optional — hilft, relevante Kapellen- und Gemeinschaftsangebote anzuzeigen',
  typeBaseName: 'Name des Standorts eingeben...',
  hasPetsLabel: 'Ich reise mit Haustieren',
  hasPetsHelp: 'Zeigt APHIS-, USDA- und Tier-Importdokumente in Ihrer Checkliste an',
  moveType: 'UMZUGSART',
  moveTypeHHG: 'HHG (Behördlich)',
  moveTypeHHGHelp: 'TMO organisiert Packer und Spedition. Keine Gewichtsbelege erforderlich.',
  moveTypePPM: 'PPM / DITY',
  moveTypePPMHelp: 'Sie ziehen selbst um. Bewahren Sie Gewichtsbelege für die Erstattung auf.',
  zeroUploadTitle: 'WARUM WIR KEINE UPLOADS VERLANGEN',
  zeroUploadBody: 'PCS Express speichert niemals Ihre Befehle, Ausweise oder andere Dokumente. Alles, was Sie eingeben, bleibt auf Ihrem Gerät und wird mit AES-256 verschlüsselt. Wir sehen es nie — und es gibt keine Datei, die geleakt werden könnte. Ihre Daten gehören nur Ihnen.',
  reportNLTDate: 'MELDETERMIN (NLT)',
  reportNLTHelp: 'Das "spätestens am" Datum auf Ihren Befehlen. T-Minus-Meilensteine zählen ab diesem Datum herunter.',
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
  nav: { home: 'Start', checklist: 'Checkliste', documents: 'Dokumente', education: 'Bildung', family: 'Familienbereitschaft', 'home-relocation': 'Wohnungssuche', 'medical-readiness': 'Medizinische Bereitschaft', nav: 'Navigation', resources: 'Ressourcen', religion: 'Spirituelle Bereitschaft', translation: 'Übersetzung', veterans: 'Veteranen' },
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
  departingFrom: 'DÉPART DE (ANCIENNE INSTALLATION)',
  reportingToLabel: 'AFFECTATION (NOUVELLE INSTALLATION)',
  departingDate: 'DATE DE DÉPART',
  spouseDepsTravel: 'Conjoint / personnes à charge voyageant avec moi',
  childrensAges: 'ÂGES DES ENFANTS',
  addChild: '+ Ajouter un enfant',
  noChildrenYet: 'Aucun enfant ajouté pour le moment',
  childN: 'Enfant',
  yrs: 'ans',
  agePlaceholder: 'Âge',
  religiousPreference: 'PRÉFÉRENCE RELIGIEUSE',
  religiousPreferenceNote: '(pour aumônerie et ressources communautaires)',
  religiousPreferenceHelp: 'Facultatif — aide à afficher chapelle et ressources communautaires pertinentes',
  typeBaseName: 'Saisir le nom de la base...',
  hasPetsLabel: 'Je voyage avec des animaux',
  hasPetsHelp: 'Affiche les documents APHIS, USDA et d\'import animal dans votre liste',
  moveType: 'TYPE DE DÉMÉNAGEMENT',
  moveTypeHHG: 'HHG (Gouvernement)',
  moveTypeHHGHelp: 'Le TMO organise emballage et transport. Aucun ticket de pesée requis.',
  moveTypePPM: 'PPM / DITY',
  moveTypePPMHelp: 'Vous déménagez vous-même. Conservez les tickets de pesée pour l\'indemnité.',
  zeroUploadTitle: 'POURQUOI NOUS NE DEMANDONS PAS DE DOCUMENTS',
  zeroUploadBody: 'PCS Express ne stocke jamais vos ordres, pièces d\'identité ou autres documents. Tout ce que vous saisissez reste sur votre appareil, chiffré avec AES-256. Nous ne le voyons jamais — et aucun fichier ne peut fuiter. Vos données vous appartiennent.',
  reportNLTDate: 'DATE DE PRÉSENTATION NLT',
  reportNLTHelp: 'La date "au plus tard" indiquée sur vos ordres. Les jalons T-Moins se calculent à partir de cette date.',
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
  nav: { home: 'Accueil', checklist: 'Liste PCS', documents: 'Documents', education: 'Éducation', family: 'Préparation familiale', 'home-relocation': 'Relogement', 'medical-readiness': 'Préparation médicale', nav: 'Navigation', resources: 'Ressources', religion: 'Préparation spirituelle', translation: 'Traduction', veterans: 'Vétérans' },
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
  departingFrom: '출발지 (이전 기지)',
  reportingToLabel: '도착지 (새 기지)',
  departingDate: '출발일',
  spouseDepsTravel: '배우자 / 부양가족 동반',
  childrensAges: '자녀 연령',
  addChild: '+ 자녀 추가',
  noChildrenYet: '아직 자녀가 추가되지 않았습니다',
  childN: '자녀',
  yrs: '세',
  agePlaceholder: '나이',
  religiousPreference: '종교 선호',
  religiousPreferenceNote: '(군종 및 커뮤니티 자료용)',
  religiousPreferenceHelp: '선택 사항 — 관련 채플 및 커뮤니티 자료 표시에 도움',
  typeBaseName: '기지 이름 입력...',
  hasPetsLabel: '반려동물 동반 이동',
  hasPetsHelp: 'APHIS, USDA, 반려동물 수입 서류가 체크리스트에 표시됩니다',
  moveType: '이사 유형',
  moveTypeHHG: 'HHG (정부 주관)',
  moveTypeHHGHelp: 'TMO가 포장과 운송을 주관합니다. 중량표 불필요.',
  moveTypePPM: 'PPM / DITY (개인 이사)',
  moveTypePPMHelp: '직접 이사합니다. 인센티브 지급을 위해 중량표를 보관하세요.',
  zeroUploadTitle: '문서 업로드를 요청하지 않는 이유',
  zeroUploadBody: 'PCS Express는 사용자의 명령서, 신분증 등 어떤 문서도 저장하지 않습니다. 입력한 모든 데이터는 AES-256으로 암호화되어 사용자 기기에만 저장됩니다. 저희는 데이터를 볼 수 없으며, 유출될 파일이 존재하지 않습니다. 데이터는 오직 사용자에게 속합니다.',
  reportNLTDate: '보고 기한 (NLT)',
  reportNLTHelp: '명령서에 명시된 "늦어도" 도착 일자입니다. T-Minus 마일스톤이 이 날짜를 기준으로 계산됩니다.',
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
  nav: { home: '홈', checklist: '체크리스트', documents: '문서', education: '교육', family: '가족 준비', 'home-relocation': '주거 이전', 'medical-readiness': '의료 준비', nav: '내비게이션', resources: '자료', religion: '영적 준비', translation: '번역', veterans: '재향군인' },
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
  departingFrom: '出発元 (前任地)',
  reportingToLabel: '着任先 (新任地)',
  departingDate: '出発日',
  spouseDepsTravel: '配偶者 / 扶養家族同行',
  childrensAges: '子どもの年齢',
  addChild: '+ 子どもを追加',
  noChildrenYet: 'まだ子どもが追加されていません',
  childN: '子ども',
  yrs: '歳',
  agePlaceholder: '年齢',
  religiousPreference: '宗教の希望',
  religiousPreferenceNote: '(チャプレンとコミュニティ情報用)',
  religiousPreferenceHelp: '任意 — 関連するチャペルとコミュニティ情報の表示に役立ちます',
  typeBaseName: '基地名を入力...',
  hasPetsLabel: 'ペット同行',
  hasPetsHelp: 'APHIS、USDA、ペット輸入関連の書類がチェックリストに表示されます',
  moveType: '引越し形態',
  moveTypeHHG: 'HHG (政府手配)',
  moveTypeHHGHelp: 'TMOが梱包と輸送を手配。重量伝票は不要です。',
  moveTypePPM: 'PPM / DITY (自己手配)',
  moveTypePPMHelp: 'ご自身で引越し。報奨金請求のため重量伝票を保管してください。',
  zeroUploadTitle: 'なぜアップロードを求めないのか',
  zeroUploadBody: 'PCS Express は命令書、身分証、その他の書類を一切保存しません。入力した情報はすべて端末上に残り、AES-256 で暗号化されます。当社が中身を見ることはなく、流出するファイルも存在しません。データは利用者だけのものです。',
  reportNLTDate: '報告期限 (NLT)',
  reportNLTHelp: '命令書に記載された「遅くともこの日まで」の到着日。T-Minus マイルストーンはこの日を基準にカウントダウンされます。',
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
  nav: { home: 'ホーム', checklist: 'チェックリスト', documents: '書類', education: '教育', family: '家族準備', 'home-relocation': '住居移転', 'medical-readiness': '医療準備', nav: 'ナビゲーション', resources: 'リソース', religion: 'スピリチュアル準備', translation: '翻訳', veterans: '退役軍人' },
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
  departingFrom: 'PAALIS GALING (DATING INSTALLATION)',
  reportingToLabel: 'PUPUNTA SA (BAGONG INSTALLATION)',
  departingDate: 'PETSA NG PAALIS',
  spouseDepsTravel: 'Asawa / Dependents na kasama sa paglipat',
  childrensAges: 'EDAD NG MGA ANAK',
  addChild: '+ Magdagdag ng anak',
  noChildrenYet: 'Wala pang naidaragdag na anak',
  childN: 'Anak',
  yrs: 'taon',
  agePlaceholder: 'Edad',
  religiousPreference: 'KAGUSTUHANG RELIHIYON',
  religiousPreferenceNote: '(para sa chaplain at community resources)',
  religiousPreferenceHelp: 'Opsyonal — tumutulong magpakita ng chapel at community resources',
  typeBaseName: 'I-type ang pangalan ng base...',
  hasPetsLabel: 'May alagang hayop akong kasama',
  hasPetsHelp: 'Magpapakita ng APHIS, USDA at pet import documents sa checklist',
  moveType: 'URI NG PAGLILIPAT',
  moveTypeHHG: 'HHG (Pamahalaan)',
  moveTypeHHGHelp: 'TMO ang mag-aayos ng packers at transport. Walang kailangang weight tickets.',
  moveTypePPM: 'PPM / DITY (Sariling Paglipat)',
  moveTypePPMHelp: 'Kayo mismo ang maglilipat. Itago ang weight tickets para sa incentive.',
  zeroUploadTitle: 'BAKIT WALA KAMING HINIHINGING UPLOAD',
  zeroUploadBody: 'Hindi kailanman iniimbak ng PCS Express ang inyong orders, ID, o ibang dokumento. Lahat ng inilagay ninyo ay nananatili sa inyong device, naka-encrypt sa AES-256. Hindi namin nakikita ito — at walang file na pwedeng ma-leak. Inyo lamang ang inyong data.',
  reportNLTDate: 'PETSA NG REPORT-NLT',
  reportNLTHelp: 'Ang "hindi lalampas sa" petsa na nasa orders. Ang T-Minus milestones ay binibilang mula rito.',
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
  nav: { home: 'Simula', checklist: 'Listahan', documents: 'Dokumento', education: 'Edukasyon', family: 'Kahandaan ng Pamilya', 'home-relocation': 'Paglipat ng Tahanan', 'medical-readiness': 'Kahandaang Medikal', nav: 'Pag-navigate', resources: 'Mga Resource', religion: 'Kahandaang Espirituwal', translation: 'Pagsasalin', veterans: 'Mga Beterano' },
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
  departingFrom: 'مغادرة من (المنشأة السابقة)',
  reportingToLabel: 'الوصول إلى (المنشأة الجديدة)',
  departingDate: 'تاريخ المغادرة',
  spouseDepsTravel: 'الزوج/الزوجة / التابعون المسافرون معي',
  childrensAges: 'أعمار الأطفال',
  addChild: '+ إضافة طفل',
  noChildrenYet: 'لم يُضف أطفال بعد',
  childN: 'طفل',
  yrs: 'سنوات',
  agePlaceholder: 'العمر',
  religiousPreference: 'التفضيل الديني',
  religiousPreferenceNote: '(لخدمات الكاهن وموارد المجتمع)',
  religiousPreferenceHelp: 'اختياري — يساعد في عرض الكنيسة وموارد المجتمع ذات الصلة',
  typeBaseName: 'اكتب اسم القاعدة...',
  hasPetsLabel: 'لديّ حيوانات أليفة مسافرة معي',
  hasPetsHelp: 'يعرض وثائق APHIS وUSDA واستيراد الحيوانات الأليفة في قائمتك',
  moveType: 'نوع الانتقال',
  moveTypeHHG: 'HHG (حكومي)',
  moveTypeHHGHelp: 'TMO ينظّم التعبئة والنقل. لا حاجة لتذاكر الوزن.',
  moveTypePPM: 'PPM / DITY (ذاتي)',
  moveTypePPMHelp: 'أنت تنقل بنفسك. احتفظ بتذاكر الوزن للحصول على مبلغ الحافز.',
  zeroUploadTitle: 'لماذا لا نطلب رفع المستندات',
  zeroUploadBody: 'PCS Express لا يخزّن أبدًا أوامرك أو هوياتك أو أي مستندات أخرى. كل ما تُدخله يبقى على جهازك مشفّرًا بمعيار AES-256. نحن لا نراه — ولا يوجد ملف يمكن أن يُسرّب. بياناتك ملك لك وحدك.',
  reportNLTDate: 'تاريخ التقرير (NLT)',
  reportNLTHelp: 'تاريخ "في موعد أقصاه" المكتوب في أوامرك. تحسب معالم T-Minus من هذا التاريخ.',
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
  nav: { home: 'الرئيسية', checklist: 'قائمة PCS', documents: 'المستندات', education: 'التعليم', family: 'جاهزية العائلة', 'home-relocation': 'السكن والانتقال', 'medical-readiness': 'الجاهزية الطبية', nav: 'الملاحة', resources: 'الموارد', religion: 'الجاهزية الروحية', translation: 'الترجمة', veterans: 'المحاربون القدامى' },
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
  departingFrom: '离开 (原驻地)',
  reportingToLabel: '前往 (新驻地)',
  departingDate: '出发日期',
  spouseDepsTravel: '配偶 / 家属随行',
  childrensAges: '子女年龄',
  addChild: '+ 添加子女',
  noChildrenYet: '尚未添加子女',
  childN: '子女',
  yrs: '岁',
  agePlaceholder: '年龄',
  religiousPreference: '宗教偏好',
  religiousPreferenceNote: '(用于随军牧师和社区资源)',
  religiousPreferenceHelp: '可选 — 帮助显示相关教堂和社区资源',
  typeBaseName: '输入基地名称...',
  hasPetsLabel: '宠物随我搬迁',
  hasPetsHelp: '清单中将显示 APHIS、USDA 和宠物进口相关文件',
  moveType: '搬迁类型',
  moveTypeHHG: 'HHG (政府安排)',
  moveTypeHHGHelp: 'TMO 安排打包和运输,无需称重单。',
  moveTypePPM: 'PPM / DITY (自行搬迁)',
  moveTypePPMHelp: '您自行搬迁。请保留称重单以申领奖励金。',
  zeroUploadTitle: '我们为何不要求上传文件',
  zeroUploadBody: 'PCS Express 永不存储您的命令、身份证或其他文件。您输入的所有内容都保存在您的设备上,并使用 AES-256 加密。我们看不到任何内容,也没有可被泄露的文件。您的数据完全属于您。',
  reportNLTDate: '报到截止日期 (NLT)',
  reportNLTHelp: '命令上注明的"不迟于"到达日期。T-Minus 里程碑从这个日期倒数。',
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
  nav: { home: '首页', checklist: '清单', documents: '文件', education: '教育', family: '家庭准备', 'home-relocation': '住房搬迁', 'medical-readiness': '医疗准备', nav: '导航', resources: '资源', religion: '精神准备', translation: '翻译', veterans: '退伍军人' },
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
  departingFrom: 'PARTENZA DA (BASE PRECEDENTE)',
  reportingToLabel: 'DESTINAZIONE (NUOVA BASE)',
  departingDate: 'DATA DI PARTENZA',
  spouseDepsTravel: 'Coniuge / Familiari a carico in viaggio con me',
  childrensAges: "ETÀ DEI FIGLI",
  addChild: '+ Aggiungi figlio',
  noChildrenYet: 'Nessun figlio aggiunto',
  childN: 'Figlio',
  yrs: 'anni',
  agePlaceholder: 'Età',
  religiousPreference: 'PREFERENZA RELIGIOSA',
  religiousPreferenceNote: '(per cappellano e risorse comunitarie)',
  religiousPreferenceHelp: 'Facoltativo — aiuta a mostrare cappella e risorse comunitarie',
  typeBaseName: 'Digita il nome della base...',
  hasPetsLabel: 'Viaggio con animali domestici',
  hasPetsHelp: 'Mostra documenti APHIS, USDA e di importazione animali nella tua lista',
  moveType: 'TIPO DI TRASFERIMENTO',
  moveTypeHHG: 'HHG (Governativo)',
  moveTypeHHGHelp: 'TMO organizza imballaggio e trasporto. Nessun ticket di pesatura richiesto.',
  moveTypePPM: 'PPM / DITY (Autonomo)',
  moveTypePPMHelp: 'Ti trasferisci da solo. Conserva i ticket di peso per l\'incentivo.',
  zeroUploadTitle: 'PERCHÉ NON CHIEDIAMO UPLOAD',
  zeroUploadBody: 'PCS Express non memorizza mai i tuoi ordini, documenti d\'identità o altri file. Tutto ciò che inserisci resta sul tuo dispositivo, criptato con AES-256. Non lo vediamo mai — e non c\'è alcun file che possa essere divulgato. I tuoi dati appartengono solo a te.',
  reportNLTDate: 'DATA DI PRESENTAZIONE NLT',
  reportNLTHelp: 'La data "non oltre" indicata sui tuoi ordini. I traguardi T-Meno vengono calcolati da questa data.',
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
  nav: { home: 'Pagina iniziale', checklist: 'Lista PCS', documents: 'Documenti', education: 'Istruzione', family: 'Prontezza familiare', 'home-relocation': 'Trasferimento casa', 'medical-readiness': 'Prontezza medica', nav: 'Navigazione', resources: 'Risorse', religion: 'Prontezza spirituale', translation: 'Traduzione', veterans: 'Veterani' },
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
  departingFrom: 'SAINDO DE (INSTALAÇÃO ANTERIOR)',
  reportingToLabel: 'INDO PARA (NOVA INSTALAÇÃO)',
  departingDate: 'DATA DE PARTIDA',
  spouseDepsTravel: 'Cônjuge / Dependentes viajando comigo',
  childrensAges: 'IDADES DOS FILHOS',
  addChild: '+ Adicionar filho',
  noChildrenYet: 'Nenhum filho adicionado ainda',
  childN: 'Filho',
  yrs: 'anos',
  agePlaceholder: 'Idade',
  religiousPreference: 'PREFERÊNCIA RELIGIOSA',
  religiousPreferenceNote: '(para capelão e recursos comunitários)',
  religiousPreferenceHelp: 'Opcional — ajuda a exibir capela e recursos comunitários relevantes',
  typeBaseName: 'Digite o nome da base...',
  hasPetsLabel: 'Tenho animais viajando comigo',
  hasPetsHelp: 'Exibe documentos APHIS, USDA e de importação de animais na sua lista',
  moveType: 'TIPO DE MUDANÇA',
  moveTypeHHG: 'HHG (Governo)',
  moveTypeHHGHelp: 'TMO organiza embaladores e transporte. Sem necessidade de tickets de peso.',
  moveTypePPM: 'PPM / DITY (Mudança Própria)',
  moveTypePPMHelp: 'Você se muda. Guarde os tickets de peso para o pagamento de incentivo.',
  zeroUploadTitle: 'POR QUE NÃO PEDIMOS UPLOADS',
  zeroUploadBody: 'O PCS Express nunca armazena suas ordens, identidades ou outros documentos. Tudo o que você insere permanece no seu dispositivo, criptografado com AES-256. Nós nunca vemos — e não há arquivo que possa vazar. Seus dados pertencem apenas a você.',
  reportNLTDate: 'DATA DE APRESENTAÇÃO NLT',
  reportNLTHelp: 'A data "no máximo até" indicada nas suas ordens. Os marcos T-Menos são calculados a partir desta data.',
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
  nav: { home: 'Início', checklist: 'Lista PCS', documents: 'Documentos', education: 'Educação', family: 'Prontidão familiar', 'home-relocation': 'Mudança residencial', 'medical-readiness': 'Prontidão médica', nav: 'Navegação', resources: 'Recursos', religion: 'Prontidão espiritual', translation: 'Tradução', veterans: 'Veteranos' },
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
  departingFrom: 'KHỞI HÀNH TỪ (CĂN CỨ CŨ)',
  reportingToLabel: 'BÁO CÁO ĐẾN (CĂN CỨ MỚI)',
  departingDate: 'NGÀY KHỞI HÀNH',
  spouseDepsTravel: 'Vợ/chồng / Người phụ thuộc đi cùng',
  childrensAges: 'TUỔI CỦA CON',
  addChild: '+ Thêm con',
  noChildrenYet: 'Chưa thêm con',
  childN: 'Con',
  yrs: 'tuổi',
  agePlaceholder: 'Tuổi',
  religiousPreference: 'TÔN GIÁO ƯU TIÊN',
  religiousPreferenceNote: '(dùng cho mục sư và tài nguyên cộng đồng)',
  religiousPreferenceHelp: 'Tùy chọn — giúp hiển thị nhà nguyện và tài nguyên cộng đồng phù hợp',
  typeBaseName: 'Nhập tên căn cứ...',
  hasPetsLabel: 'Tôi mang thú cưng theo',
  hasPetsHelp: 'Hiển thị tài liệu APHIS, USDA và nhập khẩu thú cưng trong danh sách',
  moveType: 'LOẠI CHUYỂN NHÀ',
  moveTypeHHG: 'HHG (Chính phủ)',
  moveTypeHHGHelp: 'TMO sắp xếp đóng gói và vận chuyển. Không cần phiếu cân.',
  moveTypePPM: 'PPM / DITY (Tự chuyển)',
  moveTypePPMHelp: 'Bạn tự chuyển. Giữ phiếu cân để nhận khoản hỗ trợ.',
  zeroUploadTitle: 'VÌ SAO CHÚNG TÔI KHÔNG YÊU CẦU TẢI LÊN',
  zeroUploadBody: 'PCS Express không bao giờ lưu lệnh, giấy tờ hoặc tài liệu nào của bạn. Mọi thứ bạn nhập đều ở lại trên thiết bị, được mã hoá AES-256. Chúng tôi không nhìn thấy — và không có tệp nào có thể bị rò rỉ. Dữ liệu của bạn chỉ thuộc về bạn.',
  reportNLTDate: 'NGÀY BÁO CÁO NLT',
  reportNLTHelp: 'Ngày "không trễ hơn" trên lệnh của bạn. Cột mốc T-Minus được tính từ ngày này.',
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
  nav: { home: 'Trang chủ', checklist: 'Danh sách PCS', documents: 'Tài liệu', education: 'Giáo dục', family: 'Sẵn sàng gia đình', 'home-relocation': 'Nhà ở & chuyển nhà', 'medical-readiness': 'Sẵn sàng y tế', nav: 'Điều hướng', resources: 'Tài nguyên', religion: 'Sẵn sàng tâm linh', translation: 'Dịch thuật', veterans: 'Cựu chiến binh' },
};

function getAppLanguage(language) {
  const code = String(language || 'en').toLowerCase();
  return APP_TRANSLATIONS[code] ? code : 'en';
}

// Honest disclosure for non-English users: navigation, headers, and short
// labels are fully localized; longer descriptive paragraphs remain in English
// to avoid generic auto-substitutions that diverge from the actual content.
const TRANSLATION_BANNER_TEXT = {
  es: 'Toda la aplicación se muestra en español. Las instrucciones detalladas pueden aparecer generalizadas; consulte el inglés original o la fuente oficial antes de actuar.',
  de: 'Die gesamte App wird auf Deutsch angezeigt. Detaillierte Anweisungen können verallgemeinert sein — prüfen Sie das englische Original oder die offizielle Quelle vor dem Handeln.',
  fr: 'L\'application complète s\'affiche en français. Les instructions détaillées peuvent apparaître généralisées — consultez l\'original anglais ou la source officielle avant d\'agir.',
  ko: '앱 전체가 한국어로 표시됩니다. 상세 지침은 일반화되어 표시될 수 있으니, 실행 전 영어 원문이나 공식 출처를 확인하세요.',
  ja: 'アプリ全体が日本語で表示されます。詳細な手順は一般化された表現になる場合があります。実行前に英語原文または公式ソースをご確認ください。',
  tl: 'Buong app ay nasa wikang pinili mo. Ang mga detalyadong tagubilin ay maaaring maging pangkalahatan — tingnan ang orihinal na Ingles o opisyal na source bago kumilos.',
  ar: 'يُعرض التطبيق بالكامل بلغتك المختارة. قد تظهر التعليمات التفصيلية بشكل عام — راجع النص الأصلي بالإنجليزية أو المصدر الرسمي قبل اتخاذ أي إجراء.',
  zh: '整个应用程序以您选择的语言显示。详细说明可能显示为通用表述,采取行动前请查阅英文原文或官方来源。',
  it: 'L\'intera app è in italiano. Le istruzioni dettagliate possono essere generalizzate — consulta l\'originale inglese o la fonte ufficiale prima di agire.',
  pt: 'O aplicativo inteiro está em português. As instruções detalhadas podem aparecer generalizadas — consulte o inglês original ou a fonte oficial antes de agir.',
  vi: 'Toàn bộ ứng dụng hiển thị bằng ngôn ngữ bạn chọn. Hướng dẫn chi tiết có thể được hiển thị tổng quát — xem bản gốc tiếng Anh hoặc nguồn chính thức trước khi thực hiện.',
};


const GENERIC_LANGUAGE_FALLBACKS = {
  es: { desc: 'Revise recursos oficiales y herramientas de planificacion para esta categoria.', demoTitle: 'Paso del recorrido', demoBody: 'Esta parte del recorrido explica como usar esta area de PCS Express con la informacion publica oficial disponible.' },
  de: { desc: 'Pruefen Sie offizielle Ressourcen und Planungswerkzeuge fuer diese Kategorie.', demoTitle: 'Tour-Schritt', demoBody: 'Dieser Teil der Tour erklaert, wie Sie diesen Bereich von PCS Express mit verfuegbaren offiziellen oeffentlichen Informationen nutzen.' },
  fr: { desc: 'Consultez les ressources officielles et les outils de planification pour cette categorie.', demoTitle: 'Etape de visite', demoBody: 'Cette partie de la visite explique comment utiliser cette zone de PCS Express avec les informations publiques officielles disponibles.' },
  ko: { desc: '이 범주의 공식 자료와 계획 도구를 확인하십시오.', demoTitle: '둘러보기 단계', demoBody: '이 둘러보기는 사용 가능한 공식 공개 정보를 사용하여 PCS Express의 이 영역을 이용하는 방법을 설명합니다.' },
  ja: { desc: 'このカテゴリの公式リソースと計画ツールを確認してください。', demoTitle: 'ツアー手順', demoBody: 'このツアーでは、利用可能な公式公開情報を使ってPCS Expressのこの領域を使用する方法を説明します。' },
  tl: { desc: 'Suriin ang opisyal na resources at planning tools para sa kategoryang ito.', demoTitle: 'Hakbang sa tour', demoBody: 'Ipinapaliwanag ng bahaging ito kung paano gamitin ang area na ito ng PCS Express gamit ang opisyal na pampublikong impormasyon.' },
  ar: { desc: 'راجع الموارد الرسمية وأدوات التخطيط لهذه الفئة.', demoTitle: 'خطوة في الجولة', demoBody: 'يشرح هذا الجزء من الجولة كيفية استخدام هذا القسم من PCS Express بالاعتماد على المعلومات العامة الرسمية المتاحة.' },
  zh: { desc: '查看此类别的官方资源和规划工具。', demoTitle: '导览步骤', demoBody: '本导览说明如何使用可用的官方公开信息操作 PCS Express 的此区域。' },
  it: { desc: 'Consulta le risorse ufficiali e gli strumenti di pianificazione per questa categoria.', demoTitle: 'Passaggio del tour', demoBody: 'Questa parte del tour spiega come usare questa area di PCS Express con le informazioni pubbliche ufficiali disponibili.' },
  pt: { desc: 'Revise recursos oficiais e ferramentas de planejamento para esta categoria.', demoTitle: 'Etapa do tour', demoBody: 'Esta parte do tour explica como usar esta area do PCS Express com informacoes publicas oficiais disponiveis.' },
  vi: { desc: 'Xem tài nguyên chính thức và công cụ lập kế hoạch cho danh mục này.', demoTitle: 'Bước hướng dẫn', demoBody: 'Phần này giải thích cách sử dụng khu vực này của PCS Express bằng thông tin công khai chính thức có sẵn.' },
};


const KEYED_LANGUAGE_TOPICS = {
  'base-intelligence': { es: 'Inteligencia de base', de: 'Standortinformationen', fr: 'Informations base', ko: '기지 정보', ja: '基地情報', tl: 'Base intelligence', ar: 'معلومات القاعدة', zh: '基地情报', it: 'Informazioni base', pt: 'Inteligência da base', vi: 'Thông tin căn cứ' },
  checklist: { es: 'Lista PCS', de: 'PCS-Checkliste', fr: 'Liste PCS', ko: 'PCS 체크리스트', ja: 'PCSチェックリスト', tl: 'PCS checklist', ar: 'قائمة PCS', zh: 'PCS 清单', it: 'Checklist PCS', pt: 'Checklist PCS', vi: 'Danh sách PCS' },
  documents: { es: 'Documentos', de: 'Dokumente', fr: 'Documents', ko: '문서', ja: '書類', tl: 'Dokumento', ar: 'المستندات', zh: '文件', it: 'Documenti', pt: 'Documentos', vi: 'Tài liệu' },
  education: { es: 'Educación', de: 'Bildung', fr: 'Éducation', ko: '교육', ja: '教育', tl: 'Edukasyon', ar: 'التعليم', zh: '教育', it: 'Istruzione', pt: 'Educação', vi: 'Giáo dục' },
  family: { es: 'Preparación familiar', de: 'Familienbereitschaft', fr: 'Préparation familiale', ko: '가족 준비', ja: '家族準備', tl: 'Kahandaan ng Pamilya', ar: 'جاهزية العائلة', zh: '家庭准备', it: 'Prontezza familiare', pt: 'Prontidão familiar', vi: 'Sẵn sàng gia đình' },
  'home-relocation': { es: 'Reubicación del hogar', de: 'Wohnungssuche', fr: 'Relogement', ko: '주거 이전', ja: '住居移転', tl: 'Paglipat ng Tahanan', ar: 'السكن والانتقال', zh: '住房搬迁', it: 'Trasferimento casa', pt: 'Mudança residencial', vi: 'Nhà ở & chuyển nhà' },
  'medical-readiness': { es: 'Preparación médica', de: 'Medizinische Bereitschaft', fr: 'Préparation médicale', ko: '의료 준비', ja: '医療準備', tl: 'Kahandaang Medikal', ar: 'الجاهزية الطبية', zh: '医疗准备', it: 'Prontezza medica', pt: 'Prontidão médica', vi: 'Sẵn sàng y tế' },
  nav: { es: 'Navegación', de: 'Navigation', fr: 'Navigation', ko: '내비게이션', ja: 'ナビゲーション', tl: 'Pag-navigate', ar: 'الملاحة', zh: '导航', it: 'Navigazione', pt: 'Navegação', vi: 'Điều hướng' },
  resources: { es: 'Recursos', de: 'Ressourcen', fr: 'Ressources', ko: '자료', ja: 'リソース', tl: 'Mga Resource', ar: 'الموارد', zh: '资源', it: 'Risorse', pt: 'Recursos', vi: 'Tài nguyên' },
  religion: { es: 'Preparación espiritual', de: 'Spirituelle Bereitschaft', fr: 'Préparation spirituelle', ko: '영적 준비', ja: 'スピリチュアル準備', tl: 'Kahandaang Espirituwal', ar: 'الجاهزية الروحية', zh: '精神准备', it: 'Prontezza spirituale', pt: 'Prontidão espiritual', vi: 'Sẵn sàng tâm linh' },
  translation: { es: 'Traducción', de: 'Übersetzung', fr: 'Traduction', ko: '번역', ja: '翻訳', tl: 'Pagsasalin', ar: 'الترجمة', zh: '翻译', it: 'Traduzione', pt: 'Tradução', vi: 'Dịch thuật' },
  veterans: { es: 'Veteranos', de: 'Veteranen', fr: 'Vétérans', ko: '재향군인', ja: '退役軍人', tl: 'Mga Beterano', ar: 'المحاربون القدامى', zh: '退伍军人', it: 'Veterani', pt: 'Veteranos', vi: 'Cựu chiến binh' },
  security: { es: 'Seguridad y datos públicos', de: 'Sicherheit und öffentliche Daten', fr: 'Sécurité et données publiques', ko: '보안 및 공개 데이터', ja: 'セキュリティと公開データ', tl: 'Security at public data', ar: 'الأمان والبيانات العامة', zh: '安全和公共数据', it: 'Sicurezza e dati pubblici', pt: 'Segurança e dados públicos', vi: 'Bảo mật và dữ liệu công khai' },
  profile: { es: 'Perfil y configuración', de: 'Profil und Einrichtung', fr: 'Profil et configuration', ko: '프로필 및 설정', ja: 'プロフィールと設定', tl: 'Profile at setup', ar: 'الملف والإعداد', zh: '档案和设置', it: 'Profilo e configurazione', pt: 'Perfil e configuração', vi: 'Hồ sơ và thiết lập' },
  bases: { es: 'Bases e instalaciones', de: 'Standorte und Basen', fr: 'Bases et installations', ko: '기지 및 시설', ja: '基地と施設', tl: 'Bases at installations', ar: 'القواعد والمنشآت', zh: '基地和设施', it: 'Basi e installazioni', pt: 'Bases e instalações', vi: 'Căn cứ và cơ sở' },
  selector: { es: 'Selector de categorías', de: 'Kategorieauswahl', fr: 'Sélecteur de catégories', ko: '카테고리 선택', ja: 'カテゴリ選択', tl: 'Category selector', ar: 'محدد الفئات', zh: '类别选择器', it: 'Selettore categorie', pt: 'Seletor de categorias', vi: 'Bộ chọn danh mục' },
  complete: { es: 'Gracias por su servicio', de: 'Vielen Dank für Ihren Dienst', fr: 'Merci pour votre service', ko: '복무에 감사드립니다', ja: 'ご奉仕に感謝します', tl: 'Salamat sa iyong serbisyo', ar: 'شكراً لخدمتك', zh: '感谢您的服役', it: 'Grazie per il tuo servizio', pt: 'Obrigado pelo seu serviço', vi: 'Cảm ơn sự phục vụ của bạn' },
};

const KEYED_LANGUAGE_TEMPLATES = {
  es: { desc: (label) => `${label}: revise recursos oficiales y herramientas de planificación para esta área.`, demoTitle: (label) => label, demoBody: (label) => `Esta parte del recorrido explica cómo usar ${label} dentro de PCS Express.` },
  de: { desc: (label) => `${label}: Prüfen Sie offizielle Ressourcen und Planungswerkzeuge für diesen Bereich.`, demoTitle: (label) => label, demoBody: (label) => `Dieser Teil der Tour erklärt, wie Sie ${label} in PCS Express nutzen.` },
  fr: { desc: (label) => `${label} : consultez les ressources officielles et les outils de planification pour cette zone.`, demoTitle: (label) => label, demoBody: (label) => `Cette partie de la visite explique comment utiliser ${label} dans PCS Express.` },
  ko: { desc: (label) => `${label}: 이 영역의 공식 자료와 계획 도구를 확인하십시오.`, demoTitle: (label) => label, demoBody: (label) => `이 둘러보기는 PCS Express에서 ${label}을 사용하는 방법을 설명합니다.` },
  ja: { desc: (label) => `${label}: この領域の公式リソースと計画ツールを確認してください。`, demoTitle: (label) => label, demoBody: (label) => `このツアーではPCS Expressで${label}を使用する方法を説明します。` },
  tl: { desc: (label) => `${label}: suriin ang opisyal na resources at planning tools para sa area na ito.`, demoTitle: (label) => label, demoBody: (label) => `Ipinapaliwanag ng bahaging ito kung paano gamitin ang ${label} sa PCS Express.` },
  ar: { desc: (label) => `${label}: راجع الموارد الرسمية وأدوات التخطيط لهذا القسم.`, demoTitle: (label) => label, demoBody: (label) => `يشرح هذا الجزء من الجولة كيفية استخدام ${label} داخل PCS Express.` },
  zh: { desc: (label) => `${label}：查看此区域的官方资源和规划工具。`, demoTitle: (label) => label, demoBody: (label) => `本导览说明如何在 PCS Express 中使用${label}。` },
  it: { desc: (label) => `${label}: consulta le risorse ufficiali e gli strumenti di pianificazione per quest’area.`, demoTitle: (label) => label, demoBody: (label) => `Questa parte del tour spiega come usare ${label} in PCS Express.` },
  pt: { desc: (label) => `${label}: revise recursos oficiais e ferramentas de planejamento para esta área.`, demoTitle: (label) => label, demoBody: (label) => `Esta parte do tour explica como usar ${label} no PCS Express.` },
  vi: { desc: (label) => `${label}: xem tài nguyên chính thức và công cụ lập kế hoạch cho khu vực này.`, demoTitle: (label) => label, demoBody: (label) => `Phần này giải thích cách sử dụng ${label} trong PCS Express.` },
};


const CATEGORY_DESC_TRANSLATIONS = {
  es: {
    checklist: 'Organice las tareas PCS por fase, marque el progreso con controles cuadrados y mantenga visibles los plazos importantes.',
    documents: 'Use listas de seguimiento para saber qué documentos reunir, revisar y llevar, sin subir archivos a la aplicación.',
    education: 'Revise universidades cercanas, beneficios GI Bill, MyCAA y pasos de Tuition Assistance según la rama seleccionada.',
    family: 'Coordine necesidades familiares de PCS como despliegue, EFMP, empleo, residencia, mascotas y escuelas.',
    'home-relocation': 'Encuentre apoyo oficial de vivienda, ayuda de mudanza, inventario, reclamos y planificación de valor de reemplazo.',
    'medical-readiness': 'Encuentra salas de emergencias, hospitales, atención de urgencia, salud conductual y mental, dental, visión, farmacia y recursos de PHA / preparación — adaptados a tu rama, componente y región TRICARE (o FEHB para civiles del DoD).',
    nav: 'Planifique rutas, indicaciones y mapas públicos de instalación sin mostrar información restringida o no pública.',
    resources: 'Abra recursos oficiales de gobierno, militares, familiares, financieros, médicos, educativos y de carrera en un solo lugar.',
    religion: 'Localice apoyo de capellán, consejería, servicios religiosos y comunidad según la preferencia espiritual opcional.',
    translation: 'Use frases útiles para vivienda, salud, escuelas, transporte y vida diaria durante mudanzas CONUS u OCONUS.',
    veterans: 'Encuentre directorios y búsquedas públicas para recursos y negocios de veteranos cerca del destino.',
  },
  de: {
    checklist: 'Ordnen Sie PCS-Aufgaben nach Phasen, markieren Sie Fortschritt mit Kontrollfeldern und behalten Sie wichtige Fristen im Blick.',
    documents: 'Nutzen Sie reine Checklisten, um Dokumente zu sammeln, zu prüfen und mitzunehmen, ohne Dateien in die App hochzuladen.',
    education: 'Prüfen Sie Hochschulen in der Nähe, GI-Bill-Leistungen, MyCAA und Tuition-Assistance-Schritte nach ausgewählter Teilstreitkraft.',
    family: 'Koordinieren Sie PCS-Familienthemen wie Einsatz, EFMP, Beschäftigung, Aufenthalt, Haustiere und Schulen.',
    'home-relocation': 'Finden Sie offizielle Wohnungsquellen, Umzugshilfe, Inventar, Schadensansprüche und Ersatzwertplanung.',
    'medical-readiness': 'Finden Sie Notaufnahmen, Krankenhäuser, dringende Versorgung, Verhaltens- und psychische Gesundheit, Zahn-, Augen-, Apotheken- sowie PHA-/Einsatzbereitschaftsressourcen — abgestimmt auf Teilstreitkraft, Komponente und TRICARE-Region (oder FEHB für DoD-Zivilbeschäftigte).',
    nav: 'Planen Sie Routen, Wegbeschreibungen und öffentliche Standortkarten ohne eingeschränkte oder nicht öffentliche Informationen.',
    resources: 'Öffnen Sie offizielle Regierungs-, Militär-, Familien-, Finanz-, Gesundheits-, Bildungs- und Karrierequellen an einem Ort.',
    religion: 'Finden Sie Seelsorge, Beratung, Gottesdienste und Gemeinschaftshilfe anhand der optionalen spirituellen Präferenz.',
    translation: 'Nutzen Sie hilfreiche Sätze für Wohnen, Gesundheit, Schule, Verkehr und Alltag bei CONUS- oder OCONUS-Umzügen.',
    veterans: 'Finden Sie öffentliche Verzeichnisse und Suchpfade für Veteranenressourcen und veteranengeführte Unternehmen in Zielnähe.',
  },
  fr: {
    checklist: 'Organisez les tâches PCS par phase, cochez la progression avec des cases et gardez les échéances importantes visibles.',
    documents: 'Utilisez des listes de suivi pour savoir quels documents réunir, vérifier et transporter, sans téléverser de fichiers.',
    education: 'Consultez les établissements proches, le GI Bill, MyCAA et les étapes Tuition Assistance selon la branche sélectionnée.',
    family: 'Coordonnez les besoins familiaux PCS comme déploiement, EFMP, emploi, résidence permanente, animaux et écoles.',
    'home-relocation': 'Trouvez des ressources officielles de logement, aide au déménagement, inventaire, réclamations et valeur de remplacement.',
    'medical-readiness': 'Trouvez des urgences, hôpitaux, soins urgents, santé comportementale et mentale, soins dentaires, optique, pharmacie et ressources PHA / préparation — adaptés à votre branche, votre composante et votre région TRICARE (ou FEHB pour les civils du DoD).',
    nav: 'Planifiez trajets, itinéraires et cartes publiques d’installation sans données restreintes ou non publiques.',
    resources: 'Ouvrez les ressources officielles gouvernementales, militaires, familiales, financières, santé, éducation et carrière.',
    religion: 'Trouvez aumônerie, conseil, services religieux et soutien communautaire selon la préférence spirituelle facultative.',
    translation: 'Utilisez des phrases utiles pour logement, santé, école, transport et vie quotidienne lors de PCS CONUS ou OCONUS.',
    veterans: 'Trouvez des annuaires publics et recherches pour ressources vétérans et entreprises détenues par des vétérans près de l’arrivée.',
  },
  ko: {
    checklist: 'PCS 작업을 단계별로 정리하고 체크박스로 진행 상황과 주요 기한을 확인합니다.',
    documents: '파일 업로드 없이 수집, 확인, 휴대해야 할 PCS 문서를 체크리스트로 추적합니다.',
    education: '선택한 군별에 맞춰 인근 대학, GI Bill, MyCAA, 학비 지원 절차를 확인합니다.',
    family: '배치, EFMP, 취업, 영주권, 반려동물, 학교 등 가족 관련 PCS 필요 사항을 정리합니다.',
    'home-relocation': '공식 주거 자료, 이사 지원, 재고, 청구 기한, 대체 가치 계획을 확인합니다.',
    'medical-readiness': '응급실, 병원, 긴급 진료, 행동 및 정신 건강, 치과, 안과, 약국, PHA / 준비 자료를 찾으세요 — 군별, 구성원, TRICARE 지역(또는 DoD 민간인의 경우 FEHB)에 맞춰 제공됩니다.',
    nav: '제한 정보 없이 공개 설치 지도, 경로, 길 안내를 계획합니다.',
    resources: '정부, 군, 가족, 재정, 의료, 교육, 경력 관련 공식 자료를 한곳에서 엽니다.',
    religion: '선택한 영적 선호에 맞춰 군종, 상담, 예배, 지역사회 지원을 찾습니다.',
    translation: 'CONUS 또는 OCONUS 이동 중 주거, 의료, 학교, 교통, 일상 표현을 사용합니다.',
    veterans: '도착지 주변 재향군인 자료와 재향군인 운영 사업체 공개 검색 경로를 찾습니다.',
  },
  ja: {
    checklist: 'PCSタスクを段階別に整理し、チェック欄で進捗と重要期限を確認します。',
    documents: 'ファイルをアップロードせず、集める、確認する、携行するPCS書類をチェックリストで管理します。',
    education: '選択した軍種に合わせ、近隣校、GI Bill、MyCAA、授業料支援手順を確認します。',
    family: '展開、EFMP、雇用、永住、ペット、学校など家族に関わるPCS事項を整理します。',
    'home-relocation': '公式住宅情報、引越し支援、家財記録、請求期限、交換価値計画を確認します。',
    'medical-readiness': '救急、病院、緊急ケア、行動・メンタルヘルス、歯科、眼科、薬局、PHA / 即応リソースを検索 — 軍種、コンポーネント、TRICARE地域（DoD職員はFEHB）に合わせて表示します。',
    nav: '制限情報を含めず、公開基地地図、経路、道順を計画します。',
    resources: '政府、軍、家族、財務、医療、教育、キャリアの公式リソースを一か所で開きます。',
    religion: '任意の精神的希望に合わせて、従軍牧師、相談、礼拝、地域支援を探します。',
    translation: 'CONUSまたはOCONUS移動で使う住宅、医療、学校、交通、日常表現を確認します。',
    veterans: '到着地周辺の退役軍人リソースと退役軍人経営事業の公開検索先を確認します。',
  },
  tl: {
    checklist: 'Ayusin ang PCS tasks ayon sa yugto, markahan ang progreso gamit ang square controls, at bantayan ang deadlines.',
    documents: 'Gamitin ang checklist tracking para malaman kung anong dokumento ang kokolektahin, susuriin, at dadalhin nang walang file upload.',
    education: 'Suriin ang malapit na schools, GI Bill, MyCAA, at Tuition Assistance steps ayon sa napiling branch.',
    family: 'Iayos ang family PCS needs tulad ng deployment, EFMP, trabaho, residency, pets, at schools.',
    'home-relocation': 'Hanapin ang opisyal na housing resources, move aid, inventory, claims deadlines, at replacement value planning.',
    'medical-readiness': 'Hanapin ang emergency rooms, ospital, urgent care, behavioral at mental health, dental, vision, pharmacy, at PHA / readiness na resources — naaayon sa iyong branch, component, at TRICARE region (o FEHB para sa mga DoD Civilian).',
    nav: 'Magplano ng routes, directions, at pampublikong installation maps nang walang restricted o non-public details.',
    resources: 'Buksan sa isang lugar ang official government, military, family, financial, healthcare, education, at career resources.',
    religion: 'Hanapin ang chaplain, counseling, worship, at community support batay sa optional spiritual preference.',
    translation: 'Gamitin ang phrases para sa housing, medical, school, transportation, at daily life sa CONUS o OCONUS moves.',
    veterans: 'Hanapin ang public directories at search paths para sa veteran resources at veteran-owned businesses malapit sa destinasyon.',
  },
  ar: {
    checklist: 'نظّم مهام PCS حسب المرحلة، وحدد التقدم بالمربعات، وابق المواعيد المهمة واضحة.',
    documents: 'استخدم قوائم متابعة لمعرفة المستندات التي يجب جمعها ومراجعتها وحملها دون رفع ملفات إلى التطبيق.',
    education: 'راجع المدارس القريبة ومزايا GI Bill وMyCAA وخطوات المساعدة الدراسية حسب الفرع المختار.',
    family: 'نسّق احتياجات الأسرة خلال PCS مثل الانتشار وEFMP والعمل والإقامة والحيوانات الأليفة والمدارس.',
    'home-relocation': 'ابحث عن موارد السكن الرسمية ومساعدة الانتقال والجرد والمطالبات وتخطيط قيمة الاستبدال.',
    'medical-readiness': 'ابحث عن غرف الطوارئ والمستشفيات والرعاية العاجلة والصحة السلوكية والنفسية وطب الأسنان والبصريات والصيدلة وموارد التقييم الصحي الدوري / الجاهزية — مصممة وفق فرعك ومكوّنك ومنطقة TRICARE (أو FEHB لموظفي وزارة الدفاع المدنيين).',
    nav: 'خطط للمسارات والاتجاهات وخرائط المنشآت العامة دون عرض معلومات مقيدة أو غير عامة.',
    resources: 'افتح موارد رسمية حكومية وعسكرية وأسرية ومالية وصحية وتعليمية ومهنية في مكان واحد.',
    religion: 'اعثر على دعم القسيس والاستشارة والعبادة والمجتمع حسب التفضيل الروحي الاختياري.',
    translation: 'استخدم عبارات مفيدة للسكن والصحة والمدارس والنقل والحياة اليومية أثناء انتقال CONUS أو OCONUS.',
    veterans: 'اعثر على أدلة عامة ومسارات بحث لموارد المحاربين القدامى والشركات المملوكة لهم قرب الوجهة.',
  },
  zh: {
    checklist: '按阶段整理 PCS 任务，用方框控件标记进度，并持续查看重要期限。',
    documents: '使用清单追踪需要收集、核对和携带的 PCS 文件，不在应用中上传文件。',
    education: '按所选军种查看附近学校、GI Bill、MyCAA 和学费援助步骤。',
    family: '协调部署、EFMP、就业、永久居民、宠物和学校等家庭 PCS 事项。',
    'home-relocation': '查找官方住房资源、搬家援助、物品清单、索赔期限和重置价值规划。',
    'medical-readiness': '查找急诊室、医院、紧急护理、行为与心理健康、牙科、视力、药房及 PHA / 战备资源 — 按军种、组件和 TRICARE 区域（或国防部文职人员的 FEHB）量身定制。',
    nav: '规划路线、方向和公开基地地图，不显示受限或非公开信息。',
    resources: '在一个位置打开政府、军方、家庭、财务、医疗、教育和职业官方资源。',
    religion: '根据可选精神偏好查找随军牧师、咨询、礼拜和社区支持。',
    translation: '在 CONUS 或 OCONUS 搬迁中使用住房、医疗、学校、交通和日常生活短语。',
    veterans: '查找目的地附近退伍军人资源和退伍军人经营企业的公开目录与搜索路径。',
  },
  it: {
    checklist: 'Organizza le attività PCS per fase, segna l’avanzamento con le caselle e tieni visibili le scadenze importanti.',
    documents: 'Usa liste di controllo per sapere quali documenti raccogliere, verificare e portare, senza caricare file nell’app.',
    education: 'Consulta scuole vicine, capitoli GI Bill, MyCAA e passaggi di Tuition Assistance in base alla forza armata scelta.',
    family: 'Coordina bisogni familiari PCS come schieramento, EFMP, lavoro, residenza permanente, animali domestici e scuole.',
    'home-relocation': 'Trova risorse ufficiali per alloggio, aiuti al trasloco, inventario, reclami e pianificazione del valore di sostituzione.',
    'medical-readiness': 'Trova pronto soccorso, ospedali, cure urgenti, salute comportamentale e mentale, odontoiatria, oculistica, farmacia e risorse PHA / prontezza — adattati alla tua forza armata, componente e regione TRICARE (o FEHB per i civili del DoD).',
    nav: 'Pianifica percorsi, indicazioni e mappe pubbliche delle installazioni senza dati riservati o non pubblici.',
    resources: 'Apri risorse ufficiali governative, militari, familiari, finanziarie, sanitarie, educative e di carriera in un unico punto.',
    religion: 'Trova cappellani, counseling, funzioni religiose e supporto comunitario collegati alla preferenza spirituale facoltativa.',
    translation: 'Usa frasi utili per casa, salute, scuola, trasporti e vita quotidiana durante trasferimenti CONUS o OCONUS.',
    veterans: 'Trova directory pubbliche e ricerche per risorse veterani e imprese gestite da veterani vicino alla destinazione.',
  },
  pt: {
    checklist: 'Organize tarefas PCS por fase, marque o progresso com caixas e mantenha prazos importantes visíveis.',
    documents: 'Use listas de acompanhamento para saber quais documentos reunir, verificar e levar, sem enviar arquivos ao app.',
    education: 'Revise escolas próximas, GI Bill, MyCAA e etapas de Tuition Assistance conforme o ramo escolhido.',
    family: 'Coordene necessidades familiares de PCS como desdobramento, EFMP, emprego, residência, pets e escolas.',
    'home-relocation': 'Encontre recursos oficiais de moradia, ajuda de mudança, inventário, reclamações e valor de reposição.',
    'medical-readiness': 'Encontre pronto-socorros, hospitais, atendimento de urgência, saúde comportamental e mental, odontologia, oftalmologia, farmácia e recursos de PHA / prontidão — personalizados para sua força, componente e região TRICARE (ou FEHB para civis do DoD).',
    nav: 'Planeje rotas, direções e mapas públicos de instalações sem informações restritas ou não públicas.',
    resources: 'Abra recursos oficiais de governo, militares, família, finanças, saúde, educação e carreira em um só lugar.',
    religion: 'Encontre capelão, aconselhamento, culto e apoio comunitário conforme a preferência espiritual opcional.',
    translation: 'Use frases úteis para moradia, saúde, escola, transporte e vida diária em mudanças CONUS ou OCONUS.',
    veterans: 'Encontre diretórios públicos e buscas para recursos de veteranos e empresas de veteranos perto do destino.',
  },
  vi: {
    checklist: 'Sắp xếp nhiệm vụ PCS theo giai đoạn, đánh dấu tiến độ bằng ô vuông và theo dõi hạn quan trọng.',
    documents: 'Dùng danh sách kiểm tra để biết tài liệu cần thu thập, xác minh và mang theo, không tải tệp lên ứng dụng.',
    education: 'Xem trường gần căn cứ, GI Bill, MyCAA và các bước Tuition Assistance theo quân chủng đã chọn.',
    family: 'Điều phối nhu cầu gia đình khi PCS như triển khai, EFMP, việc làm, thường trú, thú cưng và trường học.',
    'home-relocation': 'Tìm nguồn nhà ở chính thức, hỗ trợ chuyển nhà, kiểm kê, hạn khiếu nại và kế hoạch giá trị thay thế.',
    'medical-readiness': 'Tìm phòng cấp cứu, bệnh viện, chăm sóc khẩn cấp, sức khỏe hành vi và tinh thần, nha khoa, nhãn khoa, nhà thuốc và tài nguyên PHA / sẵn sàng — phù hợp với quân chủng, thành phần và khu vực TRICARE (hoặc FEHB cho công chức DoD) của bạn.',
    nav: 'Lập tuyến đường, chỉ dẫn và bản đồ căn cứ công khai không có thông tin hạn chế hoặc không công khai.',
    resources: 'Mở tài nguyên chính thức về chính phủ, quân đội, gia đình, tài chính, y tế, giáo dục và nghề nghiệp tại một nơi.',
    religion: 'Tìm tuyên úy, tư vấn, sinh hoạt tôn giáo và hỗ trợ cộng đồng theo tùy chọn tâm linh.',
    translation: 'Dùng cụm từ hữu ích về nhà ở, y tế, trường học, giao thông và đời sống khi chuyển CONUS hoặc OCONUS.',
    veterans: 'Tìm thư mục công khai và đường tìm kiếm cho tài nguyên cựu chiến binh và doanh nghiệp do cựu chiến binh điều hành gần nơi đến.',
  },
};


function keyedLanguageLabel(lang, topic) {
  return KEYED_LANGUAGE_TOPICS[topic]?.[lang] || KEYED_LANGUAGE_TOPICS[topic]?.es || topic;
}

function topicFromTranslationKey(key) {
  if (key.startsWith('desc.')) return key.slice(5);
  const demo = key.replace(/^demo\./, '').replace(/Title$|Body$/, '');
  if (/security/i.test(demo)) return 'security';
  if (/profile/i.test(demo)) return 'profile';
  if (/bases/i.test(demo)) return 'bases';
  if (/family/i.test(demo)) return 'family';
  if (/selector/i.test(demo)) return 'selector';
  if (/complete/i.test(demo)) return 'complete';
  return 'resources';
}

function trFrom(language, key) {
  const lang = getAppLanguage(language);
  const dict = APP_TRANSLATIONS[lang] || APP_TRANSLATIONS.en;
  const fallback = APP_TRANSLATIONS.en;
  const read = (source) => key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), source);
  const direct = read(dict);
  const english = read(fallback);
  if (lang !== 'en' && key.startsWith('nav.')) {
    const topic = key.slice(4);
    const localizedNav = keyedLanguageLabel(lang, topic);
    if (localizedNav && localizedNav !== topic) return localizedNav;
  }
  if (lang !== 'en' && key.startsWith('desc.')) {
    const topic = key.slice(5);
    const localizedDesc = CATEGORY_DESC_TRANSLATIONS[lang]?.[topic];
    if (localizedDesc) return localizedDesc;
  }
  const staleEnglishFallback = lang !== 'en' && direct !== undefined && direct === english && (key.startsWith('desc.') || key.startsWith('demo.'));
  if (direct !== undefined && !staleEnglishFallback) return direct;
  if (lang !== 'en' && (key.startsWith('desc.') || key.startsWith('demo.'))) {
    const template = KEYED_LANGUAGE_TEMPLATES[lang];
    if (template) {
      const topic = topicFromTranslationKey(key);
      const label = keyedLanguageLabel(lang, topic);
      if (key.startsWith('desc.')) return template.desc(label);
      if (key.endsWith('Title')) return template.demoTitle(label);
      return template.demoBody(label);
    }
  }
  return english ?? key;
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

// Per-language religious preference labels. <option> elements are
// excluded from the runtime DOM walker (intentional — browsers render
// native option lists in OS locale), so we localize them explicitly.
const RELIGIOUS_PREF_LABELS = {
  'No Preference':            { en: 'No Preference', es: 'Sin preferencia', de: 'Keine Präferenz', fr: 'Aucune préférence', ko: '선호 없음', ja: '希望なし', tl: 'Walang preperensya', ar: 'لا تفضيل', zh: '无偏好', it: 'Nessuna preferenza', pt: 'Sem preferência', vi: 'Không có ưu tiên' },
  'Protestant / Christian':   { en: 'Protestant / Christian', es: 'Protestante / Cristiano', de: 'Protestantisch / Christlich', fr: 'Protestant / Chrétien', ko: '개신교 / 기독교', ja: 'プロテスタント / キリスト教', tl: 'Protestante / Kristiyano', ar: 'بروتستانتي / مسيحي', zh: '新教 / 基督教', it: 'Protestante / Cristiano', pt: 'Protestante / Cristão', vi: 'Tin Lành / Cơ Đốc' },
  'Catholic':                 { en: 'Catholic', es: 'Católico', de: 'Katholisch', fr: 'Catholique', ko: '천주교', ja: 'カトリック', tl: 'Katoliko', ar: 'كاثوليكي', zh: '天主教', it: 'Cattolico', pt: 'Católico', vi: 'Công giáo' },
  'Orthodox Christian':       { en: 'Orthodox Christian', es: 'Cristiano Ortodoxo', de: 'Orthodoxes Christentum', fr: 'Chrétien Orthodoxe', ko: '정교회', ja: '正教会', tl: 'Ortodokso Kristiyano', ar: 'مسيحي أرثوذكسي', zh: '东正教', it: 'Cristiano Ortodosso', pt: 'Cristão Ortodoxo', vi: 'Chính Thống giáo' },
  'Jewish':                   { en: 'Jewish', es: 'Judío', de: 'Jüdisch', fr: 'Juif', ko: '유대교', ja: 'ユダヤ教', tl: 'Hudyo', ar: 'يهودي', zh: '犹太教', it: 'Ebraico', pt: 'Judeu', vi: 'Do Thái giáo' },
  'Muslim / Islam':           { en: 'Muslim / Islam', es: 'Musulmán / Islam', de: 'Muslimisch / Islam', fr: 'Musulman / Islam', ko: '이슬람교', ja: 'イスラム教', tl: 'Muslim / Islam', ar: 'مسلم / إسلام', zh: '伊斯兰教', it: 'Musulmano / Islam', pt: 'Muçulmano / Islã', vi: 'Hồi giáo / Islam' },
  'Buddhist':                 { en: 'Buddhist', es: 'Budista', de: 'Buddhistisch', fr: 'Bouddhiste', ko: '불교', ja: '仏教', tl: 'Budista', ar: 'بوذي', zh: '佛教', it: 'Buddista', pt: 'Budista', vi: 'Phật giáo' },
  'Hindu':                    { en: 'Hindu', es: 'Hindú', de: 'Hinduistisch', fr: 'Hindou', ko: '힌두교', ja: 'ヒンドゥー教', tl: 'Hindu', ar: 'هندوسي', zh: '印度教', it: 'Indù', pt: 'Hindu', vi: 'Hindu giáo' },
  'Sikh':                     { en: 'Sikh', es: 'Sij', de: 'Sikh', fr: 'Sikh', ko: '시크교', ja: 'シーク教', tl: 'Sikh', ar: 'سيخي', zh: '锡克教', it: 'Sikh', pt: 'Sikh', vi: 'Sikh giáo' },
  'LDS / Mormon':             { en: 'LDS / Mormon', es: 'SUD / Mormón', de: 'LDS / Mormonen', fr: 'SDJ / Mormon', ko: '말일성도 / 모르몬', ja: '末日聖徒 / モルモン', tl: 'LDS / Mormon', ar: 'قديسي اليوم الأخير / مورمون', zh: '后期圣徒 / 摩门教', it: 'SUG / Mormone', pt: 'SUD / Mórmon', vi: 'LDS / Mormon' },
  'Unitarian Universalist':   { en: 'Unitarian Universalist', es: 'Unitario Universalista', de: 'Unitarisch-Universalistisch', fr: 'Unitarien Universaliste', ko: '유니테리언 유니버설리스트', ja: 'ユニテリアン・ユニバーサリスト', tl: 'Unitarian Universalist', ar: 'وحدوي عالمي', zh: '一神普救派', it: 'Unitariano Universalista', pt: 'Unitarista Universalista', vi: 'Unitarian Universalist' },
  'Prefer not to say':        { en: 'Prefer not to say', es: 'Prefiero no decir', de: 'Möchte nicht angeben', fr: 'Préfère ne pas dire', ko: '답변 안 함', ja: '回答しない', tl: 'Ayaw sabihin', ar: 'أفضل عدم القول', zh: '不愿透露', it: 'Preferisco non dire', pt: 'Prefiro não dizer', vi: 'Không muốn nêu' },
  'Other':                    { en: 'Other', es: 'Otro', de: 'Andere', fr: 'Autre', ko: '기타', ja: 'その他', tl: 'Iba pa', ar: 'أخرى', zh: '其他', it: 'Altro', pt: 'Outro', vi: 'Khác' },
};

// Demo profile drives the interactive tour. Tuned to surface the most
// branches of the redesigned UI in one walkthrough: National Guard
// component (triggers Title 10/32 callout), OCONUS gaining installation
// (triggers OHA + DD 1056 + SOFA Documents tab content), Pets + PPM
// move-type (triggers APHIS + weight-ticket guidance), Report-NLT date
// ~75 days out (lands the T-Minus dashboard squarely in the "schedule
// HHG" / "request PTDY" window).
function _futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}
// Demo profile — populated with realistic, full-coverage fields so the
// interactive tour exercises every feature in the app:
//   - Army National Guard E-7 on Title 10 PCS orders unlocks every
//     active-duty entitlement filter (BAH, HHG, TRICARE Prime, full
//     JTR PCS package) so the Checklist and Documents views are
//     populated end-to-end.
//   - OCONUS gaining installation (USAG Humphreys, South Korea)
//     exercises OHA Calculator, OCONUS housing aggregators, DoDEA
//     schools, International SOS TRICARE Overseas routing, and the
//     Spiritual Readiness OCONUS chapel-finder path.
//   - 3 dependent children ages 8 / 11 / 14 exercise child-age
//     grade-band sorting in Schools, daycare/CDC routing, EFMP family
//     content, and family-allowance forms.
//   - Pets + PPM move exercise pet-relocation paperwork (USDA/APHIS),
//     weight-ticket prompts, and the PPM Financial Estimator.
//   - Protestant Christian preference exercises the Religious
//     Services chaplain/denomination routing.
//   - Religious preference, gainingZip, and gainingState are set so
//     Medical Readiness routes TRICARE region (Overseas → International
//     SOS) and pharmacy / behavioral health locator deep-links work.
const DEMO_PROFILE = {
  demoMode: true,
  firstName: 'Marcus', lastName: 'Thompson',
  branch: 'Army', component: 'National Guard', paygrade: 'E-7',
  // Title 10 PCS orders → full active-duty entitlement package
  ordersType: 'title10_pcs',
  losingInstallation: 'Fort Liberty', gainingInstallation: 'USAG Humphreys',
  // Geocoded fields backing Medical Readiness / Family Fun routing
  gainingCity: 'Pyeongtaek', gainingState: 'South Korea', gainingZip: '17977',
  departingDate: _futureDate(75),
  reportNLTDate: _futureDate(75),
  isOverseas: true,
  hasDependents: true, hasChildren: true, childAges: [14, 11, 8],
  hasPets: true, moveType: 'PPM',
  bedrooms: '4',
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

  // Sort autofill suggestions so the user's branch + component
  // variants come first. A Reserve user whose branch is Army should
  // see "Army Reserve" sites + Joint Reserve Bases above active-duty
  // Army installations they don't actually report to. National
  // Guard users similarly see their state's ARNG/ANG sites first.
  const sortByBranch = (items, branch) => {
    const component = String(p.component || '').trim();
    const reserveTag = `${branch} Reserve`;
    const ngTag = branch === 'Air Force' ? 'Air National Guard'
              : branch === 'Army' ? 'Army National Guard'
              : '';
    const componentPriority = component === 'Reserve' ? [reserveTag, 'Navy Reserve', 'Air Force Reserve', 'Marine Corps Reserve', 'Joint']
      : component === 'National Guard' ? [ngTag, 'Army National Guard', 'Air National Guard', 'Joint']
      : [branch, 'Joint'];
    const isPrimary = (b) => componentPriority.includes(b.branch);
    const primary = items.filter(isPrimary);
    const others  = items.filter(b => !isPrimary(b));
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
  const canGo1 = Boolean(p.branch && p.component && p.language);
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
                    <button key={b} onClick={() => updBranch(b)} className={`pcs-chip ${active ? 'is-active' : ''}`} style={{ padding: '11px 4px', borderRadius: 10, border: `2px solid ${active ? t.accent : 'rgba(255,255,255,0.15)'}`, background: active ? `${t.accent}30` : 'rgba(255,255,255,0.04)', color: active ? t.accent : 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: active ? 800 : 500, cursor: 'pointer', lineHeight: 1.3, textAlign: 'center' }}>
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

              {/* Component — filtered by branch. National Guard only
                  appears for Army/Air Force; Reserve only for branches
                  with a reserve component; DoD Civilian for all. AGR
                  is not a top-level option — pick Reserve or National
                  Guard, then select AGR as your orders type below. */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('component')}</label>
                <select value={p.component} onChange={e => {
                  const comp = e.target.value;
                  if (comp === 'DoD Civilian') {
                    // Reset paygrade to the GS-equivalent default when
                    // switching into civilian mode. Civilians never
                    // have an ordersType.
                    const isMilitaryRank = prev => /^(E-|O-|W-)/.test(prev?.paygrade || '');
                    setP(prev => ({ ...prev, component: comp, ordersType: '', paygrade: isMilitaryRank(prev) ? 'GS-11' : (prev.paygrade || 'GS-11') }));
                  } else {
                    // Switching to Active Duty clears any ordersType
                    // (only Reserve/NG use it). Switching to Reserve or
                    // National Guard from another component leaves the
                    // ordersType blank so the user picks one.
                    const clearedOrders = (comp === 'Active Duty') ? '' : (p.ordersType || '');
                    setP(prev => ({ ...prev, component: comp, ordersType: clearedOrders, paygrade: prev.paygrade === 'N/A' || prev.paygrade?.startsWith('GS-') || prev.paygrade?.startsWith('WG') || prev.paygrade === 'SES' || prev.paygrade === 'WS' || prev.paygrade === 'WL' ? 'E-5' : prev.paygrade }));
                  }
                }} style={inputSt}>
                  {componentsForBranch(p.branch).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Pay grade / civilian grade — military rank list for
                  uniformed components, GS/SES/WG ladder for DoD
                  Civilians, N/A for dependents. */}
              {p.component === 'Dependent' ? (
                <div style={{ marginBottom: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                  Pay Grade &amp; Rank — N/A ({p.component})
                </div>
              ) : p.component === 'DoD Civilian' ? (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    CIVILIAN GRADE <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>(optional)</span>
                  </label>
                  <select value={p.paygrade} onChange={e => upd('paygrade', e.target.value)} style={inputSt}>
                    <option value="N/A">N/A — Not Applicable</option>
                    {CIVILIAN_GRADES.map(g => (
                      <option key={g.grade} value={g.grade}>{g.title}</option>
                    ))}
                  </select>
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

              {/* Reserve / National Guard orders type — only shown
                  when the component is Reserve or National Guard.
                  Drives downstream eligibility gating for BAH, TRICARE
                  Prime, HHG, and the rest of the PCS package. */}
              {(p.component === 'Reserve' || p.component === 'National Guard') && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    ORDERS TYPE
                  </label>
                  <select value={p.ordersType || ''} onChange={e => upd('ordersType', e.target.value)} style={inputSt}>
                    <option value="">— Select your orders type —</option>
                    {ordersTypeCatalog(p.component).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {p.ordersType && ordersTypeMeta(p.component, p.ordersType) && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                      {ordersTypeMeta(p.component, p.ordersType).desc}
                    </div>
                  )}
                  {p.ordersType && ordersTypeMeta(p.component, p.ordersType)?.oconusEligible === false && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(255, 193, 7, 0.12)', border: '1px solid rgba(255, 193, 7, 0.45)', fontSize: 11, color: '#FFE082', lineHeight: 1.5, fontWeight: 700 }}>
                      ⚠ OCONUS PCS not authorized under this orders type. If your gaining unit is overseas, you must be transitioned to Title 10 federal active duty (PCS, Mobilization, AGR, or ADOS) before reporting. Coordinate with your full-time support staff or readiness NCO before assuming any OCONUS-PCS entitlements.
                    </div>
                  )}
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
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('departingFrom')}</label>
                <input
                  value={losingSearch || p.losingInstallation}
                  onChange={e => { setLosingSearch(e.target.value); upd('losingInstallation', e.target.value); }}
                  placeholder={ot('typeBaseName')}
                  style={inputSt}
                />
                <SuggestionList items={losingSuggestions} onSelect={name => { upd('losingInstallation', name); setLosingSearch(''); }} />
              </div>

              {/* Gaining installation */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('reportingToLabel')}</label>
                <input
                  value={gainingSearch || p.gainingInstallation}
                  onChange={e => { setGainingSearch(e.target.value); updGaining(e.target.value); }}
                  placeholder={ot('typeBaseName')}
                  style={inputSt}
                />
                <SuggestionList items={gainingSuggestions} onSelect={name => { updGaining(name); setGainingSearch(''); }} />
                {p.isOverseas && <div style={{ marginTop: 5, fontSize: 11, color: theme.accent, fontWeight: 700 }}>🌏 OCONUS — Overseas move detected</div>}
              </div>

              {/* Departing date */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('reportNLTDate')}</label>
                <input type="date" value={p.reportNLTDate || p.departingDate} onChange={e => { upd('reportNLTDate', e.target.value); upd('departingDate', e.target.value); }} style={{ ...inputSt, colorScheme: 'dark' }} />
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ot('reportNLTHelp')}</div>
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
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>{ot('familyPreferences')}</div>

              {/* Dependent travel */}
              <div onClick={() => upd('hasDependents', !p.hasDependents)} className={`pcs-chip ${p.hasDependents ? 'is-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p.hasDependents ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p.hasDependents ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p.hasDependents ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p.hasDependents ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.hasDependents && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ot('spouseDepsTravel')}</div>
              </div>

              {/* Children ages */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{ot('childrensAges')}</label>
                  <button onClick={() => upd('childAges', [...p.childAges, ''])} style={{ padding: '5px 12px', borderRadius: 8, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{ot('addChild')}</button>
                </div>
                {p.childAges.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '6px 0' }}>{ot('noChildrenYet')}</div>}
                {p.childAges.map((age, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 60 }}>{ot('childN')} {idx + 1}</div>
                    <input type="number" min="0" max="25" value={age} onChange={e => { const a = [...p.childAges]; a[idx] = e.target.value; upd('childAges', a); }} placeholder={ot('agePlaceholder')} style={{ ...inputSt, width: 80, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{ot('yrs')}</span>
                    <button onClick={() => upd('childAges', p.childAges.filter((_, i) => i !== idx))} style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 7, background: 'rgba(255,80,80,0.2)', border: '1px solid rgba(255,80,80,0.35)', color: '#FF8080', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>

              {/* Pets toggle (per redesign brief) */}
              <div onClick={() => upd('hasPets', !p.hasPets)} className={`pcs-chip ${p.hasPets ? 'is-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p.hasPets ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p.hasPets ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p.hasPets ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p.hasPets ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.hasPets && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ot('hasPetsLabel')}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{ot('hasPetsHelp')}</div>
                </div>
              </div>

              {/* Move type segmented control (HHG vs PPM/DITY) */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('moveType')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['HHG', 'PPM'].map(opt => (
                    <button key={opt} onClick={() => upd('moveType', opt)} className={`pcs-chip ${p.moveType === opt ? 'is-active' : ''}`} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: `1.5px solid ${p.moveType === opt ? theme.accent : 'rgba(255,255,255,0.18)'}`, background: p.moveType === opt ? `${theme.accent}25` : 'rgba(255,255,255,0.04)', color: p.moveType === opt ? '#FFF' : 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: p.moveType === opt ? 800 : 600, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{ot(opt === 'HHG' ? 'moveTypeHHG' : 'moveTypePPM')}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.4 }}>{ot(opt === 'HHG' ? 'moveTypeHHGHelp' : 'moveTypePPMHelp')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Religious preference */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                  {ot('religiousPreference')} <span style={{ fontWeight: 400, opacity: 0.55, fontSize: 10 }}>{ot('religiousPreferenceNote')}</span>
                </label>
                <select value={p.religiousPreference} onChange={e => upd('religiousPreference', e.target.value)} style={inputSt}>
                  {RELIGIOUS_PREFERENCES.map(r => <option key={r} value={r}>{RELIGIOUS_PREF_LABELS[r]?.[onboardingLanguage] || r}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ot('religiousPreferenceHelp')}</div>
              </div>

              {/* Zero-Upload value prop (per redesign brief) */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${theme.accent}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.12em', marginBottom: 6 }}>🔒 {ot('zeroUploadTitle')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>{ot('zeroUploadBody')}</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← {ot('back')}</button>
                <button
                  onClick={() => onComplete({
                    ...p,
                    firstName: (p.firstName || '').trim() || (p.component === 'DoD Civilian' ? 'Federal Civilian' : p.component === 'Dependent' ? 'Family Member' : 'Service Member'),
                    lastName: (p.lastName || '').trim(),
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
            className={`pcs-tab ${activeTab === tab.id ? 'is-active' : ''}`}
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
    { id: 'family-fun', label: 'Family Fun' },
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
      {tab === 'family-fun' && <FamilyFunTab theme={theme} profile={profile} />}
      {tab === 'permanent-resident' && <ImmigrationModule theme={theme} profile={profile} />}
      {tab === 'pets' && <PetRelocationChecklistTab theme={theme} profile={profile} />}
      {tab === 'schools' && <SchoolsTab theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

// ───────────────────────────────────────────────────────────────────
// Top-level GROUP wrappers per the redesigned mission architecture.
// Each wrapper hosts the sub-modules that used to live as separate
// bottom-nav tabs, so the bottom bar collapses from 14 → 6 entries
// (Home + 5 mission groups) without losing any feature.
// ───────────────────────────────────────────────────────────────────

function PCSOperationsTab({ theme, profile, checklistItems, setChecklistItems }) {
  const tabs = [
    { id: 'checklist', label: 'Checklist' },
    { id: 'documents', label: 'Paperwork' },
    { id: 'timeline',  label: 'Timeline'  },
  ];
  const [tab, setTab] = useState('checklist');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'checklist' && <ChecklistTab theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />}
      {tab === 'documents' && <PCSDocumentsModule theme={theme} profile={profile} />}
      {tab === 'timeline'  && <DynamicTimeline theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

function FamilyReadinessGroupTab({ theme, profile }) {
  const tabs = [
    { id: 'family',      label: 'Family' },
    { id: 'education',   label: 'Education' },
    { id: 'translation', label: 'Translation' },
    { id: 'faith',       label: 'Faith & Chaplains' },
  ];
  const [tab, setTab] = useState('family');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'family'      && <FamilyCategoryTab theme={theme} profile={profile} />}
      {tab === 'education'   && <EducationBenefitsTab theme={theme} profile={profile} />}
      {tab === 'translation' && <TranslationModule theme={theme} profile={profile} />}
      {tab === 'faith'       && <ReligiousServicesModuleWrapped theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

function MissionResourcesTab({ theme, profile }) {
  const tabs = [
    { id: 'base-insights', label: 'Base Insights' },
    { id: 'maps',          label: 'Maps' },
    { id: 'help-hub',      label: 'Help Hub' },
    { id: 'veteran',       label: 'Veteran Support' },
  ];
  const [tab, setTab] = useState('base-insights');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'base-insights' && <BaseIntelligenceUnifiedTab theme={theme} profile={profile} />}
      {tab === 'maps'          && <NavigationModule theme={theme} profile={profile} />}
      {tab === 'help-hub'      && <ResourcesTab theme={theme} profile={profile} />}
      {tab === 'veteran'       && <VeteranBusinessesTab theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

function FamilyFunTab({ theme, profile }) {
  const market = resolveMarket(profile);
  const [customAddress, setCustomAddress] = useState('');
  const [appliedAddress, setAppliedAddress] = useState('');
  const [filter, setFilter] = useState('all');
  const [state, setState] = useState({ status: 'idle', categories: [], activities: [], origin: null, fallback: false, reason: '' });

  useEffect(() => {
    // Center-of-search resolution priority:
    //   1. User-applied manual address (always wins).
    //   2. Curated market entry (city/state/zip) for the gaining
    //      installation - tight, precise geocode.
    //   3. Raw installation name from the profile - Nominatim handles
    //      most U.S. installations even when we have no curated entry.
    //   4. Nothing -> show no-location message + fallback static cards.
    const rawInstallation = String(profile?.gainingInstallation || '').split(',')[0].trim();
    const haveMarket = market.matched && (market.city || market.zip);
    if (!haveMarket && !appliedAddress && !rawInstallation) {
      setState({ status: 'no-input', categories: [], activities: [], origin: null, fallback: true, reason: 'no-location' });
      return;
    }
    let cancelled = false;
    setState(s => ({ ...s, status: 'loading' }));
    const params = new URLSearchParams();
    if (appliedAddress) {
      params.set('address', appliedAddress);
    } else if (haveMarket) {
      if (market.city) params.set('city', market.city);
      if (market.state) params.set('state', market.state);
      if (market.zip) params.set('zip', market.zip);
    } else {
      // Fall through: ask Nominatim to geocode the installation name
      // directly. Works for most U.S. installations even if we have no
      // curated city/state/zip mapping.
      params.set('address', rawInstallation);
    }
    params.set('radiusMiles', '50');
    if (profile?.language) params.set('lang', profile.language);
    fetch(apiUrl(`/api/family-activities?${params.toString()}`), { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : { categories: [], activities: [], fallback: true, reason: `http-${r.status}` })
      .then(data => {
        if (cancelled) return;
        setState({
          status: 'ready',
          categories: Array.isArray(data?.categories) ? data.categories : [],
          activities: Array.isArray(data?.activities) ? data.activities : [],
          origin: data?.origin || null,
          fallback: !!data?.fallback,
          reason: data?.reason || '',
        });
      })
      .catch(err => {
        if (cancelled) return;
        setState({ status: 'ready', categories: [], activities: [], origin: null, fallback: true, reason: `network-${err?.message || 'error'}` });
      });
    return () => { cancelled = true; };
  }, [market.city, market.state, market.zip, market.matched, appliedAddress, profile?.gainingInstallation]);

  const filtered = filter === 'all' ? state.activities : state.activities.filter(a => a.categoryId === filter);
  const colors = {
    primary: theme.primary || '#244247',
    accent: theme.accent || '#C99A3D',
    muted: '#56697C',
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary || '#152F36', borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${colors.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>FAMILY FUN</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>
          {appliedAddress ? `Activities within 50 mi of ${appliedAddress}` : market.matched ? `Activities within 50 mi of ${market.installation}` : 'Set a gaining installation or address to see family activities'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          Parks, theme parks, movies, museums, sports, arts, shopping, zoos, and more — each category card opens a Google Maps search pre-filtered to your gaining locality so you see real venues with ratings, hours, and directions in one tap. Confirm prices and accessibility on the destination page.
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 900, color: colors.muted, letterSpacing: '.08em', textTransform: 'uppercase' }}>Override search center (optional)</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input
            value={customAddress}
            onChange={e => setCustomAddress(e.target.value)}
            placeholder="Street, city, state, or ZIP"
            style={{ flex: 1, minWidth: 180, padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
          />
          <button
            onClick={() => setAppliedAddress(customAddress.trim())}
            style={{ background: colors.primary, color: '#FFF', border: 'none', padding: '0 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Apply
          </button>
          {appliedAddress && (
            <button
              onClick={() => { setCustomAddress(''); setAppliedAddress(''); }}
              style={{ background: '#FFFFFF', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '0 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Reset
            </button>
          )}
        </div>
        <div style={{ fontSize: 10, color: colors.muted, lineHeight: 1.5, marginTop: 6 }}>
          Leave blank to use the gaining installation from your profile. Distances are recalculated from the entered address.
        </div>
      </div>

      {state.status === 'loading' && (
        <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: colors.muted }}>
          Loading Google Maps category cards for nearby family activities...
        </div>
      )}

      {state.status === 'ready' && state.activities.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              className={`pcs-chip ${filter === 'all' ? 'is-active' : ''}`}
              style={{
                padding: '6px 12px', borderRadius: 18,
                border: `1.5px solid ${filter === 'all' ? colors.primary : '#D6E0EA'}`,
                background: filter === 'all' ? colors.primary : '#FFFFFF',
                color: filter === 'all' ? '#FFFFFF' : '#243447',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
              }}
            >
              All ({state.activities.length})
            </button>
            {state.categories.map(cat => {
              const count = state.activities.filter(a => a.categoryId === cat.id).length;
              if (!count) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`pcs-chip ${filter === cat.id ? 'is-active' : ''}`}
                  style={{
                    padding: '6px 12px', borderRadius: 18,
                    border: `1.5px solid ${filter === cat.id ? colors.primary : '#D6E0EA'}`,
                    background: filter === cat.id ? colors.primary : '#FFFFFF',
                    color: filter === cat.id ? '#FFFFFF' : '#243447',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {cat.emoji} {cat.label} ({count})
                </button>
              );
            })}
          </div>

          <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {filtered.map(act => (
              // Whole card is the click target — opens the Google Maps
              // search portal for the activity. We surface only the
              // Google Maps deep link so the card click and visible
              // "Open map view" pill always point to the same place.
              <a
                key={act.id}
                href={act.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${act.name} on Google Maps (${act.distanceMiles} miles away)`}
                style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${colors.accent}`, borderRadius: 12, padding: 12, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', flex: 1 }}>{act.name}</div>
                  <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                    {act.distanceMiles} mi
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{act.type}</span>
                </div>
                {act.address && <div style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>{act.address}</div>}
                <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginBottom: 8 }}>
                  {act.description}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                  <span className="card-cta" style={{ '--cta-color': colors.primary }}>
                    Open map view
                  </span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {state.status === 'ready' && state.activities.length === 0 && state.fallback && (
        <div style={{ background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 12, fontSize: 11, color: '#0D3B66', lineHeight: 1.5 }}>
          {state.reason === 'no-location'
            ? 'Set your gaining installation in onboarding or enter an address above to find family activities.'
            : state.reason === 'address-not-found'
              ? 'Could not locate that address on the map. Try a different format like "City, ST" or a ZIP code.'
              : state.reason === 'overpass-failed' || state.reason === 'geocode-failed'
                ? 'Map search is temporarily unavailable. Try again in a minute.'
                : 'No nearby family activities found within 50 miles. Try a larger address or a nearby ZIP code.'}
        </div>
      )}
    </div>
  );
}

function VAHomeLoanPanel({ theme, profile }) {
  // VA-backed mortgages secure liens on U.S. real property; they are not
  // available for purchases overseas. OCONUS veterans get a different
  // checklist (off-base / on-base housing options) and resources pointing
  // at AHRN, MilitaryByOwner, and the host-installation housing office.
  const oconus = isOCONUSInstallation(profile?.gainingInstallation || profile?.gaining || '');
  const conusSteps = [
    'Confirm VA loan eligibility through VA.gov or a VA-approved lender.',
    'Request a Certificate of Eligibility before making an offer when possible.',
    'Compare VA funding fee, interest rate, closing cost, and lender credit estimates.',
    'Ask each lender how they support PCS timelines, remote closings, and military income.',
    'Keep inspection, appraisal, and final closing dates aligned with report date and household goods delivery.',
  ];
  const oconusSteps = [
    'VA-backed mortgages are not available for property purchased overseas. Plan for either on-base government housing or a rental/lease in the local economy.',
    'Contact the gaining installation Housing Office before household goods (HHG) shipment to learn current on-base wait times and off-base lease standards.',
    'OCONUS service members typically receive Overseas Housing Allowance (OHA), Utility/Recurring Maintenance Allowance, and a Move-In Housing Allowance (MIHA) instead of BAH — confirm rates with the housing office.',
    'Use AHRN.com and MilitaryByOwner to find pre-screened off-base rentals near the installation. Many landlords accept the standard OCONUS lease addendum.',
    'If you plan to keep or buy a CONUS property (e.g., a retirement home) while OCONUS, you can still use your VA loan benefit — it just cannot fund the overseas housing.',
  ];
  const conusResources = [
    { name: 'VA Home Loan Overview',     url: 'https://www.va.gov/housing-assistance/home-loans/',                 note: 'Official VA overview for VA-backed and VA direct home loan benefits.' },
    { name: 'VA Home Buying Process',    url: 'https://www.va.gov/housing-assistance/home-loans/home-buying-process', note: 'Step-by-step VA guidance for using a VA-backed loan to buy a home.' },
    { name: 'VA Lender Resources',       url: 'https://www.benefits.va.gov/homeloans/lenders.asp',                  note: 'Official VA lender resources and program information. This is guidance, not a private lender endorsement.' },
    { name: 'CFPB Home Loan Toolkit',    url: 'https://www.consumerfinance.gov/owning-a-home/',                     note: 'Official Consumer Financial Protection Bureau tools for comparing mortgage offers.' },
  ];
  const oconusResources = [
    { name: 'HOMES.mil (Gov’t On/Off-Base Housing)',      url: 'https://www.homes.mil',                                                   note: 'Official DoD Housing Office portal for on-base and approved off-base housing referrals at the gaining installation.' },
    { name: 'AHRN.com (Automated Housing Referral Network)',   url: 'https://www.ahrn.com',                                                    note: 'DoD-sponsored off-base rental network used at most OCONUS installations. Pre-screened listings, military-friendly lease language.' },
    { name: 'MilitaryByOwner (OCONUS rentals)',                url: 'https://www.militarybyowner.com/',                                        note: 'Off-base rental and sale listings worldwide, including OCONUS installations.' },
    { name: 'DoD Overseas Housing Allowance (OHA) Rates',      url: 'https://www.defensetravel.dod.mil/site/oha.cfm',                          note: 'Official DTMO OHA rate lookup for the gaining overseas locality. Includes utility and MIHA components.' },
    { name: 'DoD Per Diem, Travel and Transportation Allowance Committee', url: 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/', note: 'Background on OCONUS housing allowances, MIHA-Miscellaneous, MIHA-Rent, and MIHA-Security.' },
    { name: 'VA Home Loan Overview (CONUS / retirement use)',  url: 'https://www.va.gov/housing-assistance/home-loans/',                       note: 'Your VA loan benefit is preserved while OCONUS for a future CONUS purchase. Track entitlement use here.' },
  ];
  const steps = oconus ? oconusSteps : conusSteps;
  const resources = oconus ? oconusResources : conusResources;
  return (
    <div>
      <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>{oconus ? 'OCONUS HOUSING (VA LOAN UNAVAILABLE OVERSEAS)' : 'VA HOME LOAN'}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 1.6, fontWeight: 500 }}>
          {oconus
            ? `${profile?.gainingInstallation || 'Your gaining installation'} is overseas, so VA-backed mortgages cannot be used to purchase a home there. Use the checklist and resources below to plan on-base assignment, an off-base rental, or how to keep your VA loan benefit available for a future CONUS purchase.`
            : `Use this checklist to prepare for VA-backed homebuying near ${profile?.gainingInstallation || 'your gaining installation'}. Verify all loan terms directly with the VA and the lender before committing.`}
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
      {resources.map(r => (
        <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10, textDecoration: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{r.note}</div>
        </a>
      ))}
    </div>
  );
}

function isOCONUSInstallation(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return ['korea','germany','japan','italy','guam','okinawa','cuba','bahrain','kuwait','qatar','djibouti',
    'humphreys','daegu','yongsan','ramstein','kaiserslautern','spangdahlem','wiesbaden','grafenwoehr',
    'vilseck','baumholder','ansbach','stuttgart','torii','kadena','misawa','camp zama','yokosuka',
    'sasebo','naples','vicenza','aviano','sigonella','rota','moron','incirlik','lemonier','osan',
    'yokota','atsugi','iwakuni','futenma','foster','butler','courtney','hansen','schwab','andersen',
  ].some(kw => lower.includes(kw));
}

function HomeRelocationUnifiedTab({ theme, profile }) {
  const gaining = profile?.gainingInstallation || profile?.gaining || '';
  const oconus = isOCONUSInstallation(gaining);
  const civilian = isDodCivilian(profile);
  // DoD Civilians do not draw BAH/OHA. They receive locality pay
  // (CONUS) or Living Quarters Allowance (LQA) / Temporary Quarters
  // Subsistence Allowance (TQSA) (OCONUS) instead.
  const housingLabel = civilian
    ? (oconus ? 'LQA / TQSA Info' : 'Locality Pay Info')
    : (oconus ? 'OHA Calculator' : 'BAH Calculator');

  const tabs = [
    { id: 'home-locator', label: 'Home Locator' },
    { id: 'bah-calculator', label: housingLabel },
    { id: 'ppm-estimator', label: 'PPM Estimator' },
    { id: 'budget-tracker', label: 'Budget Tracker' },
    { id: 'shipment-tracker', label: 'Shipment Tracker' },
    { id: 'inventory-claims', label: 'Inventory & Claims' },
    { id: 'jtr-assistant', label: 'JTR Assistant' },
    { id: 'move-aid', label: 'Move Aid' },
    // VA Loan is veteran-status, not active-civilian. We still show it
    // because many DoD Civilians are also veterans — gated inside the
    // panel itself by an eligibility note rather than being hidden.
    { id: 'va-loan', label: 'VA Loan' },
  ];
  const [tab, setTab] = useState('home-locator');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'home-locator' && <HomeLocatorTab theme={theme} profile={profile} />}
      {tab === 'bah-calculator' && (civilian
        ? (oconus
            ? <LQACalculatorTab theme={theme} profile={profile} />
            : <DodCivilianHousingPanel theme={theme} profile={profile} oconus={false} />)
        : oconus
          ? <OHACalculatorTab theme={theme} profile={profile} />
          : <BAHCalculatorTab theme={theme} profile={profile} />
      )}
      {tab === 'ppm-estimator' && <PPMFinancialEstimator theme={theme} profile={profile} />}
      {tab === 'budget-tracker' && <MoveBudgetTracker theme={theme} profile={profile} />}
      {tab === 'shipment-tracker' && <ShipmentTrackerModule theme={theme} profile={profile} />}
      {tab === 'inventory-claims' && <InventoryVaultModule theme={theme} profile={profile} />}
      {tab === 'jtr-assistant' && <JTRAssistantModule theme={theme} profile={profile} />}
      {tab === 'move-aid' && <MovingFinancialAssistanceTab theme={theme} profile={profile} />}
      {tab === 'va-loan' && <VAHomeLoanPanel theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

// Civilian-equivalent housing allowance panel. Routes users to the
// authoritative OPM / DoS / DoD sources for locality pay (CONUS) and
// LQA/TQSA (OCONUS) instead of running a BAH calculation that does
// not apply to them.
function DodCivilianHousingPanel({ theme, profile, oconus }) {
  const colors = {
    primary: theme.primary || '#244247',
    accent:  theme.accent  || '#C99A3D',
    text:    '#0D1821',
    muted:   '#56697C',
  };
  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: theme.secondary || '#152F36', borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${colors.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.08em', marginBottom: 4 }}>CIVILIAN HOUSING ALLOWANCE</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>
          {oconus ? 'Living Quarters Allowance (LQA) & TQSA' : 'Locality Pay & Civilian PCS Entitlements'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          DoD Civilians do not draw BAH or OHA. {oconus
            ? 'OCONUS assignments receive Living Quarters Allowance (LQA), Temporary Quarters Subsistence Allowance (TQSA), and Post Allowance under the Standardized Regulations (DSSR). Rates and eligibility are set by the Department of State and administered by your gaining DoD agency.'
            : 'CONUS assignments receive locality pay under the General Schedule (GS) and a federal civilian PCS package: HHG move, temporary quarters subsistence (TQSE), real-estate expense allowance, and miscellaneous expense allowance per the Federal Travel Regulation (FTR).'}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {oconus ? (
          <>
            <ResourceCard theme={theme}
              label="DSSR — Standardized Regulations (LQA, TQSA, Post Allowance)"
              url="https://aoprals.state.gov/Web920/dssr.asp"
              desc="Authoritative Department of State allowance rates and eligibility tables for U.S. government civilians stationed overseas." />
            <ResourceCard theme={theme}
              label="LQA Worksheet & Eligibility Guide (DoD Civilian)"
              url="https://www.dcpas.osd.mil/policy/relocation/lqa"
              desc="Defense Civilian Personnel Advisory Service (DCPAS) policy guide explaining who qualifies and how LQA is computed." />
            <ResourceCard theme={theme}
              label="DoD Joint Travel Regulations — Civilian"
              url="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/"
              desc="Chapter 5 (DoD civilian travel) of the JTR governs civilian PCS travel and per diem entitlements." />
          </>
        ) : (
          <>
            <ResourceCard theme={theme}
              label="OPM Locality Pay Tables — current year"
              url="https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/"
              desc="Official OPM General Schedule and locality pay tables. Find your locality area and base/locality salary rate." />
            <ResourceCard theme={theme}
              label="Federal Travel Regulation (FTR) — PCS Move Allowances"
              url="https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation-ftr"
              desc="GSA Chapter 302 details civilian PCS allowances: HHG, TQSE, real-estate, miscellaneous, and house-hunting trip." />
            <ResourceCard theme={theme}
              label="DoD Civilian Relocation Assistance"
              url="https://www.dcpas.osd.mil/policy/relocation"
              desc="DCPAS guide to civilian PCS benefits including service agreements, advance pay, and dependent travel." />
          </>
        )}
        <ResourceCard theme={theme}
          label="FEHB — Federal Employees Health Benefits"
          url="https://www.opm.gov/healthcare-insurance/healthcare/"
          desc="DoD Civilians enroll in FEHB rather than TRICARE. Change plans within 60 days of PCS as a qualifying life event." />
        <ResourceCard theme={theme}
          label="USAJOBS — Federal Civilian Career Portal"
          url="https://www.usajobs.gov/"
          desc="Find federal positions at the gaining installation or in the local commuting area. Useful for spousal employment after a civilian PCS." />
      </div>
    </div>
  );
}

function ResourceCard({ theme, label, url, desc }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent || '#C99A3D'}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821' }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55 }}>{desc}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: theme.primary || '#244247', marginTop: 8 }}>Open official source →</div>
    </a>
  );
}

function BaseIntelligenceUnifiedTab({ theme, profile }) {
  const tabs = [
    { id: 'directory', label: 'Duty Station Directory' },
    { id: 'reviews', label: 'Community Reviews' },
  ];
  const [tab, setTab] = useState('directory');
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'directory' && <DutyStationDirectory theme={theme} profile={profile} />}
      {tab === 'reviews' && <BaseIntelligenceReviews theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

function HomeLegalBanners({ theme }) {
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
      <div style={{ background: UI_PALETTE.surface, borderRadius: 12, padding: 14, border: `1px solid ${UI_PALETTE.line}`, borderLeft: `4px solid ${theme.primary}`, color: UI_PALETTE.text }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em' }}>YOUR DATA STAYS ON YOUR PHONE</div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#1F2937', fontWeight: 600, marginBottom: 8 }}>
          Everything you type is scrambled with strong encryption (AES-256) and saved only on this device. Even if someone steals your phone, they can’t read it. We never see your data — there’s no PCS Express server that stores anything.
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.55, color: '#56697C' }}>
          <strong>Heads up:</strong> Don’t enter classified information, CUI, rosters, deployment details, or anything else that isn’t public. The Translation “Translate” tab is the one exception — free text there is sent to a translation service; do not paste sensitive info there.
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
    // Dynamic-card anchors (Family Fun, Schools, Home Locator, Vet
    // Businesses, Religious Services, Job Search) link to user-
    // discovery destinations whose hosts are NOT on the static
    // allowlist - Google Maps directions, OSM-tagged business
    // websites, Apartments.com, The Muse, RemoteOK, etc. Marking an
    // anchor (or any ancestor) with data-dynamic-card="true" opts it
    // out of the strict allowlist while keeping target+rel hardening
    // and the click-time same-origin block. The audit still blocks
    // missing/relative/same-origin hrefs even on these opted-out
    // anchors.
    const isDynamicCardAnchor = (anchor) => {
      try { return !!anchor.closest?.('[data-dynamic-card]'); } catch { return false; }
    };
    const disableUnsafeAnchor = (anchor) => {
      const rawHref = anchor.getAttribute('href') || '';
      const absoluteHref = anchor.href || rawHref;
      // Always block missing / same-origin / javascript: hrefs - those
      // are the genuine reverse-tabnabbing / loop-back vectors.
      let parsed = null;
      try { parsed = new URL(absoluteHref, window.location.origin); } catch {}
      const sameOrigin = parsed && parsed.origin === window.location.origin;
      const isBadProtocol = parsed && !/^https?:$/.test(parsed.protocol);
      if (!parsed || sameOrigin || isBadProtocol) {
        anchor.setAttribute('data-link-audit-blocked', rawHref || 'blank-or-relative');
        anchor.setAttribute('aria-hidden', 'true');
        anchor.setAttribute('tabindex', '-1');
        anchor.removeAttribute('href');
        anchor.style.display = 'none';
        return true;
      }
      // Dynamic-card anchors skip the static allowlist - they point
      // to data-source destinations (Google Maps, OSM, Apartments.com,
      // etc.). They still get target+rel hardening below.
      if (!isDynamicCardAnchor(anchor) && !isApprovedExternalLink(absoluteHref)) {
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
      let parsed = null;
      try { parsed = new URL(absoluteHref, window.location.origin); } catch {}
      const sameOrigin = parsed && parsed.origin === window.location.origin;
      const isBadProtocol = parsed && !/^https?:$/.test(parsed.protocol);
      if (!parsed || sameOrigin || isBadProtocol) {
        event.preventDefault();
        event.stopImmediatePropagation();
        disableUnsafeAnchor(anchor);
        return;
      }
      if (isDynamicCardAnchor(anchor)) return;
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




  const [profile, setProfile] = useState(() => {
    const p = normalizeProfile(getSessionDemoProfile() || store.get('pcs_profile'));
    // Bootstrap language from the separate fast-path key so it's available
    // before the async secureLocalStore.get resolves and sets the full profile.
    if (p && !p.language) {
      const fastLang = (() => { try { return localStorage.getItem('pcs_user_language'); } catch { return null; } })();
      if (fastLang) p.language = fastLang;
    }
    return p;
  });
  const [activeTab, setActiveTab] = useState(() => {
    // Deep-link entry: support URLs like /?go=movement-logistics so
    // support emails and saved bookmarks can drop the user directly
    // onto a specific mission group. The param is consumed once and
    // stripped from the URL after activation so it doesn't re-fire on
    // navigation back to Home.
    try {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('go');
      if (target) {
        const allowed = new Set([
          'home', 'pcs-operations', 'home-relocation', 'family-readiness',
          'medical-readiness', 'mission-resources',
          // Legacy deep-link IDs kept for support-link compatibility.
          'checklist', 'documents', 'family', 'education', 'translation',
          'religion', 'base-intelligence', 'nav', 'resources', 'veterans',
          'jtr-assistant',
        ]);
        if (allowed.has(target)) {
          window.history.replaceState({}, '', window.location.pathname);
          return target;
        }
      }
    } catch {}
    return 'home';
  });
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Single source-of-truth for executing the destructive Reset action.
  // Wipes everything via eraseAllUserData(), then force a hard reload so
  // any in-memory React state (profile, checklist, demo session, etc.)
  // is also flushed — otherwise the user could refresh moments after
  // Reset and see remnants of their old session bleeding through.
  const confirmReset = async () => {
    await eraseAllUserData();
    setShowResetWarning(false);
    setProfile(null);
    setChecklistItems({});
    setMoreOpen(false);
    setNavOpen(false);
    // Hard reload guarantees no React state lingers. Replace the URL so
    // the back button doesn't return to the post-reset transient view.
    try { window.location.replace(window.location.pathname); } catch { window.location.reload(); }
  };
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
        // Keep the fast-path language key in sync
        if (normalized?.language) {
          try { localStorage.setItem('pcs_user_language', normalized.language); } catch {}
        }
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
  const appLanguage = getAppLanguage(
    profile?.language ||
    ((() => { try { return localStorage.getItem('pcs_user_language'); } catch { return null; } })())
  );
  const appDir = appLanguage === 'ar' ? 'rtl' : 'ltr';
  const t = (key) => trFrom(appLanguage, key);
  useAppLanguageRuntime(appLanguage);
  useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appDir;
    // Google Website Translator covers strings the dictionary-based
    // runtime missed. Activates only for non-English preferred
    // languages; for 'en' the widget remains dormant.
    applyGoogleTranslateLanguage(appLanguage);
  }, [appLanguage, appDir]);

  // Compute pending alerts based on departure date and checklist completion
  const daysUntilDeparture = profile?.departingDate ? getDaysUntilDeparture(profile.departingDate) : null;
  const pendingAlerts = profile?.departingDate
    ? Object.entries(PHASE_WINDOWS)
        .filter(([phase, win]) => {
          if (daysUntilDeparture === null || daysUntilDeparture > win.activeAt) return false;
          const tailoredAlerts = getTailoredChecklist(profile?.branch || 'Army', {
            component:     profile?.component || 'Active Duty',
            ordersType:    profile?.ordersType || '',
            hasDependents: !!profile?.hasDependents,
            hasChildren:   !!profile?.hasChildren,
            hasPets:       !!profile?.hasPets,
            moveType:      profile?.moveType || 'HHG',
            isOverseas:    !!profile?.isOverseas,
          });
          const tasks = tailoredAlerts[phase] || [];
          return tasks.some((_, i) => !checklistItems[`${phase}-${i}`]);
        })
        .map(([phase, win]) => ({
          phase,
          overdue: daysUntilDeparture < win.overdueAt,
          daysUntil: daysUntilDeparture,
          count: ((getTailoredChecklist(profile?.branch || 'Army', {
            component:     profile?.component || 'Active Duty',
            ordersType:    profile?.ordersType || '',
            hasDependents: !!profile?.hasDependents,
            hasChildren:   !!profile?.hasChildren,
            hasPets:       !!profile?.hasPets,
            moveType:      profile?.moveType || 'HHG',
            isOverseas:    !!profile?.isOverseas,
          })[phase]) || []).filter((_, i) => !checklistItems[`${phase}-${i}`]).length,
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
    // Re-apply language translations after new tab content renders
    window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent('pcs-language-refresh'))
    );
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
        // Persist language separately for fast startup reads
        if (normalized?.language) {
          try { localStorage.setItem('pcs_user_language', normalized.language); } catch {}
        }
      }
    }} />;
  }

  // Mission-group walkthrough demo. Each entry routes to the actual
  // category as the user advances, so they SEE the destination while
  // reading the description — matches the original demo behavior.
  const DEMO_TIPS = [
    { tab: 'home',                title: 'PCS Express — Mission Brief',  body: 'Six mission groups, one mission: deliver you and your family to the new duty station ready to in-process. The tour will walk you into each group as you advance.' },
    { tab: 'home',                title: 'Command Center',               body: 'Your home dashboard. Days-until-report countdown, Quick Actions row, today / this-week / before-you-report task lanes, "what changed this week" change-log, and tips tailored to your component.' },
    { tab: 'pcs-operations',      title: 'PCS Operations',               body: 'Plan and execute every PCS task. Branch-tailored Checklist (Orders Received through In-Processing), Paperwork roster with printable Binder export, and the 180-day OCONUS / 90-day CONUS Timeline backward-planned from your report date. No uploads — you keep the documents yourself.' },
    { tab: 'home-relocation',     title: 'Movement & Logistics',         body: 'Move, money, and shipment. Home Locator, BAH / OHA / LQA calculators, PPM estimator, inflation-adjusted Budget, live Shipment Tracker, Inventory worksheet, JTR Assistant, Move Aid, and VA Loan.' },
    { tab: 'family-readiness',    title: 'Family Readiness',             body: 'Family-side mission planning. Family (deployment, EFMP, spouse employment, activities, permanent residency, pets, schools) plus Education benefits, Translation with a component-tailored Free Resources tab, and Faith & Chaplains for the gaining installation.' },
    { tab: 'medical-readiness',   title: 'Holistic Health',              body: 'Total well-being in four pillars: Medical Care (ER, hospital, urgent care, specialty, dental, vision, pharmacy, preventive / PHA), Behavioral Health & Counseling, Spiritual Care, and Fitness (gyms, workouts during PCS, diet and meal tips for traveling).' },
    { tab: 'mission-resources',   title: 'Mission Resources',            body: 'Field references for the gaining installation: Base Insights (verified family reviews), Maps, Help Hub (consolidated DoD / VA / family / financial directory), and Veteran Support.' },
    { tab: 'home',                title: 'AI Assistant',                 body: 'Tap the 🤖 button (sidebar footer on desktop, home-page footer on mobile) for live PCS / JTR / FTR / DSSR Q&A. Falls back to a curated knowledge base when the live AI is unavailable. The crisis line (988 then 1) and Military OneSource stay pinned at the top of every conversation.' },
    { tab: 'home',                title: 'Security & data handling',     body: 'Tap the 🔒 button at the bottom of Command Center to see exactly how PCS Express keeps your information safe — everything stays AES-256 encrypted on your phone. No accounts, no uploads, no PCS Express server holding your data.' },
    { tab: 'home',                title: 'Thank you for your service.',  body: 'That\'s the full architecture. Close this card and start working through the mission groups in order — your data stays on your device.' },
  ];

  // Six top-level mission groups. Old single-purpose tabs (checklist,
  // documents, family, etc.) collapse into one of these wrappers per
  // the redesigned information architecture. Old activeTab IDs still
  // resolve below for deep-link compatibility but are no longer part
  // of the nav surface.
  const BOTTOM_NAV = [
    { id: 'home',                label: 'Command Center',       icon: 'CMD', iosIcon: '🎯', color: '#0D1821' },
    { id: 'pcs-operations',      label: 'PCS Operations',       icon: 'OPS', iosIcon: '📋', color: '#1565C0' },
    { id: 'home-relocation',     label: 'Movement & Logistics', icon: 'LOG', iosIcon: '🚚', color: '#455A64' },
    { id: 'family-readiness',    label: 'Family Readiness',     icon: 'FAM', iosIcon: '🛡️', color: '#5B2A86' },
    { id: 'medical-readiness',   label: 'Holistic Health',      icon: 'HLH', iosIcon: '🌿', color: '#2E7D32' },
    { id: 'mission-resources',   label: 'Mission Resources',    icon: 'MSR', iosIcon: '🗺️', color: '#26351F' },
  ];
  const LOCALIZED_BOTTOM_NAV = localizeNavItems(BOTTOM_NAV, appLanguage);
  const HOME_CATEGORIES = LOCALIZED_BOTTOM_NAV.filter(item => item.id !== 'home');

  // iOS bottom tab bar: 4 primary + More button
  const IOS_TAB_BAR = [
    { id: 'home',             label: t('nav.home'),             iosIcon: '🎯' },
    { id: 'pcs-operations',   label: t('nav.pcs-operations'),   iosIcon: '📋' },
    { id: 'home-relocation',  label: t('nav.home-relocation'),  iosIcon: '🚚' },
    { id: 'family-readiness', label: t('nav.family-readiness'), iosIcon: '🛡️' },
  ];

  const currentLabel = LOCALIZED_BOTTOM_NAV.find(n => n.id === activeTab)?.label || t('nav.home');
  const activeNavItem = LOCALIZED_BOTTOM_NAV.find(n => n.id === activeTab);
  const CATEGORY_DESCRIPTIONS = {
    'base-intelligence': t('desc.base-intelligence'),
    checklist: t('desc.checklist'),
    documents: t('desc.documents'),
    education: t('desc.education'),
    family: t('desc.family'),
    'home-relocation': t('desc.home-relocation'),
    'medical-readiness': t('desc.medical-readiness'),
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
      <div lang={appLanguage} dir={appDir} style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: `${UI_PALETTE.pagePattern}, radial-gradient(circle at top left, ${theme.accent}22, transparent 50%), radial-gradient(circle at bottom right, ${theme.primary}22, transparent 50%), ${UI_PALETTE.page}`, fontFamily: 'system-ui', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
        <PrivacyShield />
      <SaveStatusIndicator theme={theme} />
      {showResetWarning && (
        <ResetWarningModal theme={theme} onConfirm={confirmReset} onCancel={() => setShowResetWarning(false)} />
      )}
        {isDesktop && (
          <div style={{ width: 230, background: theme.secondary, display: 'flex', flexDirection: 'column', minHeight: '100dvh', borderRight: `2px solid ${theme.accent}30`, flexShrink: 0 }}>
            <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
              <div style={{ fontSize: 9, letterSpacing: '.18em', color: theme.accent, fontWeight: 900, marginBottom: 2 }}>PCS EXPRESS</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: theme.accent, letterSpacing: '-1px', lineHeight: 1 }}>{theme.insignia || theme.abbr}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {LOCALIZED_BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)} className={`pcs-side-link ${activeTab === item.id ? 'is-active' : ''}`} style={{ width: '100%', padding: '10px 16px', background: activeTab === item.id ? `${theme.accent}20` : 'transparent', border: 'none', borderLeft: `3px solid ${activeTab === item.id ? theme.accent : 'transparent'}`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: activeTab === item.id ? 800 : 600, textAlign: 'left', '--side-accent': theme.accent }}>
                  <div className="pcs-side-link__icon" style={{ width: 32, height: 24, borderRadius: 5, background: activeTab === item.id ? `${theme.accent}30` : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, letterSpacing: '.06em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.6)', flexShrink: 0, transition: 'background 200ms ease, color 200ms ease' }}>{item.icon}</div>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowResetWarning(true); setNavOpen(false); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.1)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,100,100,0.85)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>{t('reset')}</button>
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
              <button key={item.id} onClick={() => goTo(item.id)} className={`pcs-bottom-tab ${activeTab === item.id ? 'is-active' : ''}`} style={{ flex: 1, minHeight: 49, padding: '6px 2px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
                <span className="pcs-bottom-tab__glyph" style={{ fontSize: 22, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(40%) opacity(0.55)' }}>{item.iosIcon}</span>
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
                  <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} className={`pcs-bottom-tab ${activeTab === item.id ? 'is-active' : ''}`} style={{ padding: '10px 4px 8px', background: activeTab === item.id ? `${theme.accent}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTab === item.id ? theme.accent + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span className="pcs-bottom-tab__glyph" style={{ fontSize: 20, lineHeight: 1 }}>{item.iosIcon}</span>
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
    <div lang={appLanguage} dir={appDir} style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: `${UI_PALETTE.pagePattern}, radial-gradient(circle at top left, ${theme.accent}22, transparent 50%), radial-gradient(circle at bottom right, ${theme.primary}22, transparent 50%), ${UI_PALETTE.page}`, fontFamily: 'system-ui', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
      <a href="#pcs-main-content" className="pcs-skip-link">Skip to main content</a>
      <PrivacyShield />
      <SaveStatusIndicator theme={theme} />
      {showResetWarning && (
        <ResetWarningModal theme={theme} onConfirm={confirmReset} onCancel={() => setShowResetWarning(false)} />
      )}
      {/* Desktop sidebar — mirrors the 6 mission groups, branch-colored,
          with the 🔒 Security button pinned at the bottom. Replaces
          the burger menu on screens ≥ 900px. */}
      {isDesktop && (
        <aside style={{ width: 230, background: theme.secondary, display: 'flex', flexDirection: 'column', minHeight: '100dvh', borderRight: `2px solid ${theme.accent}30`, flexShrink: 0, position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
            <div style={{ fontSize: 9, letterSpacing: '.18em', color: theme.accent, fontWeight: 900, marginBottom: 2 }}>PCS EXPRESS</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: theme.accent, letterSpacing: '-1px', lineHeight: 1 }}>{theme.insignia || theme.abbr}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{profile.branch}</div>
          </div>
          <nav aria-label="Mission groups" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {LOCALIZED_BOTTOM_NAV.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} className={`pcs-side-link ${activeTab === item.id ? 'is-active' : ''}`} style={{ width: '100%', padding: '11px 16px', background: activeTab === item.id ? `${theme.accent}22` : 'transparent', border: 'none', borderLeft: `3px solid ${activeTab === item.id ? theme.accent : 'transparent'}`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.78)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: activeTab === item.id ? 800 : 600, textAlign: 'left', '--side-accent': theme.accent }} aria-current={activeTab === item.id ? 'page' : undefined}>
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">{item.iosIcon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.06em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{item.icon}</span>
              </button>
            ))}
          </nav>
          {/* AI Assistant trigger — stacks ABOVE the Security button
              so it never visually obscures the safety entry point. */}
          <AIAssistantTrigger variant="sidebar" onClick={() => setShowAIAssistant(true)} theme={theme} />
          <button onClick={() => setShowCompliance(true)} aria-label="Open security and data-handling" style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 11, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
            <span aria-hidden="true" style={{ fontSize: 14 }}>🔒</span>
            Security &amp; data handling
          </button>
          <button onClick={() => setShowResetWarning(true)} style={{ width: '100%', padding: '9px', background: 'rgba(255,0,0,0.08)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,100,100,0.85)', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>{t('reset')}</button>
        </aside>
      )}
      <div id="pcs-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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

      {/* TRANSLATION SCOPE BANNER — appears when user picks a non-English language.
          Honest about what's translated: navigation, headers, and short labels are
          localized; longer descriptive text remains in English to preserve accuracy.
          Banner is dismissible per-session via localStorage. */}
      {appLanguage !== 'en' && (() => {
        let dismissed = false;
        try { dismissed = window.localStorage.getItem('pcs_translation_banner_dismissed_v1') === '1'; } catch {}
        if (dismissed) return null;
        const txt = TRANSLATION_BANNER_TEXT[appLanguage] || TRANSLATION_BANNER_TEXT.es;
        return (
          <div data-no-language-runtime style={{ background: '#FFF8E1', borderBottom: '1px solid #FFE082', padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 11, lineHeight: 1.45, color: '#6D4C00' }}>
            <div style={{ flex: 1 }}>{txt}</div>
            <button
              onClick={() => { try { window.localStorage.setItem('pcs_translation_banner_dismissed_v1', '1'); } catch {} ; window.dispatchEvent(new Event('pcs-language-refresh')); }}
              style={{ background: 'transparent', border: 'none', color: '#6D4C00', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1, marginTop: 1 }}
              aria-label="Dismiss"
            >✕</button>
          </div>
        );
      })()}

      {/* SLIDE-DOWN NAV DRAWER — web mobile only (iOS native uses bottom tab bar instead).
          Renders the same icon-rich item shape as the desktop sidebar:
          emoji glyph + label + 3-letter abbr badge. */}
      {!isDesktop && !isNative && navOpen && (
        <div style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: 0, right: 0, maxWidth: 480, margin: '0 auto', zIndex: 200, background: theme.secondary, borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {LOCALIZED_BOTTOM_NAV.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} className={`pcs-side-link ${activeTab === item.id ? 'is-active' : ''}`} style={{ padding: '12px 4px', background: activeTab === item.id ? `${theme.accent}25` : 'transparent', border: 'none', borderBottom: `1px solid rgba(255,255,255,0.07)`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', '--side-accent': theme.accent }}>
                <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(30%) opacity(0.8)' }}>{item.iosIcon}</span>
                <span style={{ minWidth: 38, height: 14, padding: '0 4px', borderRadius: 6, background: activeTab === item.id ? `${theme.accent}30` : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, letterSpacing: '.08em', color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.6)', border: activeTab === item.id ? `1px solid ${theme.accent}60` : '1px solid rgba(255,255,255,0.1)' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowResetWarning(true); setNavOpen(false); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,0,0,0.15)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,100,100,0.9)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
            Reset / Re-onboard
          </button>
        </div>
      )}

      {/* Notification dropdown */}
      {showNotifs && pendingAlerts.length > 0 && (
        <div style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: isDesktop ? 230 : 0, right: 0, maxWidth: isDesktop ? '100%' : 480, margin: isDesktop ? 0 : '0 auto', zIndex: 200, background: '#FFFFFF', borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821' }}>
              {overdueCount > 0 ? <>{overdueCount}{' '}{overdueCount !== 1 ? 'Overdue Actions' : 'Overdue Action'}</> : 'Pending Actions'}
            </div>
            <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#888' }}>✕</button>
          </div>
          {pendingAlerts.map((alert, i) => (
            <div key={i} onClick={() => { goTo('checklist'); }} style={{ padding: '12px 16px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: alert.overdue ? '#FFF5F5' : '#FFFDE7' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{alert.overdue ? '⚠️' : '📋'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: alert.overdue ? '#C62828' : '#E65100' }}>
                  {alert.overdue ? 'Overdue Action' : 'Due Now'}{': '}{alert.phase}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                  {alert.count}{' '}{alert.count !== 1 ? 'tasks remaining' : 'task remaining'}{' · '}{alert.daysUntil < 0 ? `${Math.abs(alert.daysUntil)}d past departure` : `${alert.daysUntil}d until departure`}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#AAA' }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop to close nav/notifs/more sheet */}
      {(navOpen || showNotifs) && <div onClick={() => { setNavOpen(false); setShowNotifs(false); }} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent' }} />}

      {/* BODY: content area only — the desktop persistent sidebar is
          mounted ONCE at the root layout (line ~8507) so it persists
          across every mission group. A previous iteration mounted a
          second sidebar here, which created the duplicate category
          selector users were seeing on desktop. Removed. */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: isNative && !isDesktop ? 'calc(58px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}>
        {activeTab === 'home' && (
          <div style={{ padding: isDesktop ? '24px 28px 32px' : '16px', position: 'relative', overflow: 'hidden', minHeight: '100%', background: `linear-gradient(135deg, ${UI_PALETTE.page} 0%, ${UI_PALETTE.surfaceSoft} 46%, ${UI_PALETTE.pageAlt} 100%)`, borderRadius: isDesktop ? 24 : 0, color: UI_PALETTE.text }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: isDesktop ? -28 : -52, top: isDesktop ? 112 : 156, fontSize: isDesktop ? 450 : 292, fontWeight: 950, opacity: 0.14, userSelect: 'none', pointerEvents: 'none', color: theme.primary, letterSpacing: isDesktop ? '-18px' : '-12px', lineHeight: 0.82, zIndex: 0 }}>
              {homeInsignia}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
            {/* MISSION BRIEF — compact pinned card. Replaces the
                verbose hero banner with a tactical dashboard line:
                branch · rank · sponsor name · gaining installation.
                Sticky on mobile so the user always knows which
                profile is loaded as they scroll the task lanes. */}
            <div style={{
              background: `linear-gradient(135deg, ${UI_PALETTE.surface} 0%, #F6F1E4 100%)`,
              borderRadius: 14,
              padding: isDesktop ? '14px 18px' : '12px 14px',
              marginBottom: 14,
              position: 'sticky',
              top: 0,
              zIndex: 5,
              overflow: 'hidden',
              border: `1px solid ${UI_PALETTE.line}`,
              borderLeft: `4px solid ${theme.accent}`,
              boxShadow: '0 8px 22px rgba(38,53,31,0.10)',
            }}>
              <div aria-hidden="true" style={{ position: 'absolute', right: -6, bottom: -10, fontSize: 64, fontWeight: 900, opacity: 0.07, userSelect: 'none', pointerEvents: 'none', color: theme.accent, letterSpacing: '-3px', lineHeight: 1 }}>
                {homeInsignia}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.22em', color: theme.primary, textTransform: 'uppercase' }}>
                  {t('unitedStates')} {profile.branch.toUpperCase()}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: UI_PALETTE.muted, letterSpacing: '.10em', textTransform: 'uppercase' }}>
                  MISSION BRIEF
                </div>
              </div>
              <div style={{ fontSize: isDesktop ? 15 : 13, fontWeight: 900, color: UI_PALETTE.text, lineHeight: 1.25 }}>
                {getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName} {profile.lastName}
              </div>
              <div style={{ fontSize: 11, color: UI_PALETTE.muted, marginTop: 4, lineHeight: 1.4 }}>
                {profile.gainingInstallation ? `→ ${profile.gainingInstallation}` : t('setGaining')}
              </div>
            </div>

            {/* T-Minus dashboard — derived from Report-NLT date per redesign brief */}
            <TMinusDashboard theme={theme} profile={profile} />

            {/* Quick Actions — one-tap entry points for the most-common
                "I just opened the app, what now?" tasks. */}
            <QuickActionsRow theme={theme} onJumpTo={goTo} onOpenAI={() => setShowAIAssistant(true)} onOpenCompliance={() => setShowCompliance(true)} />

            {/* Mission Lanes — Today / This Week / Before You Report.
                Pulls live unchecked items from the user's tailored
                checklist so the home dashboard reflects real progress,
                not a static milestone array. */}
            <MissionLanes theme={theme} profile={profile} checklistItems={checklistItems} onJumpToOps={() => goTo('pcs-operations')} />

            {/* Change-log: most-recent user-facing actions from the
                last 7 days. Renders nothing when there's no history,
                so first-time users don't see an empty stub. */}
            <ChangeLogCard theme={theme} />

            {/* Component-specific notes (Reserve / National Guard / AGR) */}
            {COMPONENT_NOTES[profile.component] && (
              <div style={{ background: UI_PALETTE.surface, border: `1px solid ${UI_PALETTE.line}`, borderLeft: `4px solid ${theme.accent}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
                <div style={{ fontSize: 11, fontWeight: 950, color: theme.primary, marginBottom: 8, letterSpacing: '.10em' }}>{COMPONENT_NOTES[profile.component].headline}</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: UI_PALETTE.muted }}>
                  {COMPONENT_NOTES[profile.component].bullets.map((b, i) => (<li key={i} style={{ marginBottom: 4 }}>{b}</li>))}
                </ul>
              </div>
            )}

            {/* Category-tile grid intentionally NOT rendered here.
                Every platform has its own canonical icon-rich
                category selector — desktop sidebar (left), iOS
                bottom tab bar + More sheet, mobile-web burger
                drawer — so rendering a tile grid on the home page
                duplicated the selector and confused users. The
                sidebar / tab bar / drawer is now the single source
                of category navigation across every platform. */}

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

            {/* Home-page footer buttons. AI Assistant pill stacks
                directly above the Security & data handling pill so
                the two never overlap and the safety entry stays
                anchored at the bottom of the page. */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <AIAssistantTrigger variant="pill" onClick={() => setShowAIAssistant(true)} theme={theme} />
              <button onClick={() => setShowCompliance(true)} aria-label="Open security and data-handling information" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, border: `1px solid ${UI_PALETTE.line}`, background: UI_PALETTE.surface, color: theme.primary, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(38,53,31,0.08)' }}>
                <span aria-hidden="true" style={{ fontSize: 14 }}>🔒</span>
                Security &amp; data handling
              </button>
            </div>
            </div>
          </div>
        )}

        {/* New top-level mission-group routes. Each renders a wrapper
            that hosts the sub-modules that used to be separate
            bottom-nav tabs. */}
        {activeTab === 'pcs-operations'    && renderCategoryFrame('pcs-operations',    <PCSOperationsTab    theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />)}
        {activeTab === 'family-readiness'  && renderCategoryFrame('family-readiness',  <FamilyReadinessGroupTab theme={theme} profile={profile} />)}
        {activeTab === 'mission-resources' && renderCategoryFrame('mission-resources', <MissionResourcesTab theme={theme} profile={profile} />)}
        {activeTab === 'home-relocation'   && renderCategoryFrame('home-relocation',   <HomeRelocationUnifiedTab theme={theme} profile={profile} />)}
        {activeTab === 'medical-readiness' && renderCategoryFrame('medical-readiness', <MedicalReadinessTab theme={theme} profile={profile} />)}

        {/* Legacy single-purpose routes. Not in the bottom nav anymore,
            but kept here so older deep links still resolve. */}
        {activeTab === 'base-intelligence' && renderCategoryFrame('base-intelligence', <BaseIntelligenceUnifiedTab theme={theme} profile={profile} />)}
        {activeTab === 'checklist'  && renderCategoryFrame('checklist',  <ChecklistTab theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />)}
        {activeTab === 'documents'  && renderCategoryFrame('documents',  <PCSDocumentsModule theme={theme} profile={profile} />)}
        {activeTab === 'education'  && renderCategoryFrame('education',  <EducationBenefitsTab theme={theme} profile={profile} />)}
        {activeTab === 'family'     && renderCategoryFrame('family',     <FamilyCategoryTab theme={theme} profile={profile} />)}
        {activeTab === 'nav'        && renderCategoryFrame('nav',        <NavigationModule theme={theme} profile={profile} />)}
        {activeTab === 'religion'   && renderCategoryFrame('religion',   <ReligiousServicesModuleWrapped theme={theme} profile={profile} />)}
        {activeTab === 'resources'  && renderCategoryFrame('resources',  <ResourcesTab theme={theme} profile={profile} />)}
        {activeTab === 'veterans'   && renderCategoryFrame('veterans',   <VeteranBusinessesTab theme={theme} profile={profile} />)}
      </div>
      </div>{/* end body container */}
      </div>{/* end main column (header + body) — wraps sibling of desktop aside */}

      {/* AI Assistant modal. Triggered from the sidebar (desktop) +
          the home-page footer (above Security & data handling) so
          it never overlaps the safety button visually. */}
      <AIAssistantModal open={showAIAssistant} onClose={() => setShowAIAssistant(false)} isDesktop={isDesktop} />

      {/* COMPLIANCE MODAL — opened from the Security & data-handling
          button at the bottom of the Home tab. The Compliance content
          used to live in the bottom nav; moved to a modal so it stays
          one tap away without crowding the PCS-task category bar. */}
      {showCompliance && (
        <div role="dialog" aria-modal="true" aria-label="Security and data handling" onClick={() => setShowCompliance(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(13, 24, 33, 0.65)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: isDesktop ? 32 : 0 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: UI_PALETTE.page, width: '100%', maxWidth: isDesktop ? 720 : 480, maxHeight: isDesktop ? '85vh' : '92vh', overflowY: 'auto', borderRadius: isDesktop ? 18 : '18px 18px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${UI_PALETTE.line}`, position: 'sticky', top: 0, background: UI_PALETTE.page, zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true" style={{ fontSize: 18 }}>🔒</span>
                <div style={{ fontSize: 14, fontWeight: 900, color: theme.primary }}>Security &amp; data handling</div>
              </div>
              <button onClick={() => setShowCompliance(false)} aria-label="Close" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: UI_PALETTE.muted, fontSize: 13, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>✕</button>
            </div>
            <ComplianceAttestationModule theme={theme} profile={profile} />
          </div>
        </div>
      )}

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
                <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} className={`pcs-bottom-tab ${activeTab === item.id ? 'is-active' : ''}`} style={{ padding: '10px 4px 8px', background: activeTab === item.id ? `${theme.accent}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTab === item.id ? theme.accent + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span className="pcs-bottom-tab__glyph" style={{ fontSize: 20, lineHeight: 1, filter: activeTab === item.id ? 'none' : 'grayscale(30%) opacity(0.7)' }}>{item.iosIcon}</span>
                  <span style={{ fontSize: 9, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.65)', letterSpacing: '.02em', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '10px 12px 4px' }}>
              <button onClick={() => { setShowResetWarning(true); setMoreOpen(false); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 12, color: 'rgba(255,100,100,0.9)', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
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
