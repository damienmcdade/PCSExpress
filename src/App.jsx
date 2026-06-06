/*
 * Purpose: Main PCS Express React shell, onboarding flow, tab navigation, and core PCS modules.
 * Third-party dependencies: React, Leaflet through child map modules, Capacitor bridge when running native.
 */

import { Suspense, lazy, useState, useEffect, useRef, useReducer, useMemo, memo } from 'react'
import './App.css'
import { apiUrl, fetchWithTimeout } from './config/apiConfig'
import { enablePushNotifications, disablePushNotifications } from './pushNotifications'
import { INDEPENDENCE_DISCLAIMER } from './config/disclaimer'
import AppErrorBoundary from './components/AppErrorBoundary'
import BranchBackdrop from './components/BranchBackdrop'
import AppShellFooter from './components/AppShellFooter'
import IndependenceAck from './components/IndependenceAck'
import CommandPalette from './components/CommandPalette'
import PlatformBanners from './components/PlatformBanners'
// AIAssistantTrigger stays eager (small button users see at boot).
// AIAssistantModal is lazy — its 900-line file + curated KB only loads
// once the user actually opens the assistant.
import AIAssistantTrigger from './components/AIAssistantTrigger'
import AIAssistantFAB from './components/AIAssistantFAB'
import TabBar from './components/TabBar'
import NotificationModeSelector from './components/NotificationModeSelector'
import { TransitionLocationProvider, TransitionLocationBar } from './components/transitionLocation'
import { useFocusTrap } from './hooks/useFocusTrap'
import DynamicTimeline from './components/DynamicTimeline'
import PrivacyShield from './components/PrivacyShield'

// Tabs lazy-loaded so the initial bundle ships only the shell + the
// pieces a typical first-visit user actually touches (Home, Mission
// Lanes, AI Assistant). Heavy leaf tabs (DutyStationDirectory at 147KB,
// employment, religious services, PCS docs, etc.) are split into their
// own chunks and downloaded the first time the user navigates to them.
// Each lazy import resolves inside the top-level <Suspense> fallback at
// the App root.
//
// lazyRetry: a failed dynamic import() is almost always a stale-deploy
// chunk 404 — the session loaded an older index.html, a new build shipped
// (purging the old hashed chunks), and the user then navigates to a tab
// whose chunk was never preloaded. React would surface this as "importing
// a module script failed" / "Failed to fetch dynamically imported module".
// Recover by forcing ONE reload (sessionStorage-guarded against loops) to
// pull the fresh index + chunk manifest.
function importWithRetry(factory) {
  return factory().catch((err) => {
    const KEY = 'pcs_chunk_reload_at';
    let last = 0;
    try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch { /* private mode */ }
    const now = Date.now();
    if (now - last > 10_000) {
      try { sessionStorage.setItem(KEY, String(now)); } catch { /* ignore */ }
      window.location.reload();
      // Park the render until the reload takes over so React doesn't paint
      // an error boundary in the brief interim.
      return new Promise(() => {});
    }
    throw err;
  });
}
const lazyRetry = (factory) => lazy(() => importWithRetry(factory));
const EmploymentModule = lazyRetry(() => import('./components/EmploymentModule'))
const TranslationModule = lazyRetry(() => import('./components/TranslationModule'))
const ReligiousServicesModule = lazyRetry(() => import('./components/ReligiousServicesModule'))
const SpouseDeploymentGuide = lazyRetry(() => import('./components/SpouseDeploymentGuide'))
const PCSDocumentsModule = lazyRetry(() => import('./components/PCSDocumentsModule'))
const ShipmentTrackerModule = lazyRetry(() => import('./components/ShipmentTrackerModule'))
const ComplianceAttestationModule = lazyRetry(() => import('./components/ComplianceAttestationModule'))
const InventoryVaultModule = lazyRetry(() => import('./components/InventoryVaultModule'))
const JTRAssistantModule = lazyRetry(() => import('./components/JTRAssistantModule'))
const ImmigrationModule = lazyRetry(() => import('./components/ImmigrationModule'))
const MovingFinancialAssistanceTab = lazyRetry(() => import('./components/MovingFinancialAssistanceTab'))
const PetRelocationChecklistTab = lazyRetry(() => import('./components/PetRelocationChecklistTab'))
const EFMPTab = lazyRetry(() => import('./components/EFMPTab'))
const HomeLocatorTab = lazyRetry(() => import('./components/HomeLocatorTab'))
const BaseIntelligenceReviews = lazyRetry(() => import('./components/BaseIntelligenceReviews'))
const PPMFinancialEstimator = lazyRetry(() => import('./components/PPMFinancialEstimator'))
const MoveStrategyModule = lazyRetry(() => import('./components/MoveStrategyModule'))
const PCS2026ChangesCard = lazyRetry(() => import('./components/PCS2026ChangesCard'))
const BAHCalculatorTab = lazyRetry(() => import('./components/BAHCalculatorTab'))
const OHACalculatorTab = lazyRetry(() => import('./components/OHACalculatorTab'))
const LQACalculatorTab = lazyRetry(() => import('./components/LQACalculatorTab'))
const MedicalReadinessTab = lazyRetry(() => import('./components/MedicalReadinessTab'))
const MoveBudgetTracker = lazyRetry(() => import('./components/MoveBudgetTracker'))
const DutyStationDirectory = lazyRetry(() => import('./components/DutyStationDirectory'))
const AIAssistantModal = lazyRetry(() => import('./components/AIAssistantChip').then(m => ({ default: m.AIAssistantModal })))
// Public-facing capability statement / landing page. Lazy because it
// is only shown on first visit (or via ?landing=1) and the
// already-onboarded flow doesn't need it in the eager bundle.
const LandingPage = lazyRetry(() => import('./components/LandingPage'))
const NavigationModule = lazyRetry(() => import('./components/NavigationModule'))
// Education tab + its ~1,500-line college/OCONUS dataset live in their own
// lazy chunk (perf Tier 1b PR-B) so they don't ship in the eager bundle.
const EducationBenefitsTab = lazyRetry(() => import('./components/EducationBenefitsTab'))
// VeteranBusinesses + Resources tabs also lazy-loaded (perf Tier 1b PR-C).
const VeteranBusinessesTab = lazyRetry(() => import('./components/VeteranBusinessesTab'))
const TransitionChecklistModule = lazyRetry(() => import('./components/TransitionChecklistModule'))
const TransitionDocumentsModule = lazyRetry(() => import('./components/TransitionDocumentsModule'))
const TransitionOutreachModule = lazyRetry(() => import('./components/TransitionOutreachModule'))
const TransitionCommunityModule = lazyRetry(() => import('./components/TransitionCommunityModule'))
const PriorityAlertsCard = lazyRetry(() => import('./components/PriorityAlertsCard'))
const ResourcesTab = lazyRetry(() => import('./components/ResourcesTab'))
import { AuditLogger, secureLocalStore, readLegacyJson, closeCryptoStoreDB } from './security/SecurityExtensions'
import { resolveMarket } from './data/installationMarkets'
// Three largest data tables (~172 KB raw / ~30 KB gzip) live in a
// dynamically-imported chunk so the React shell can mount before they
// finish downloading. useHeavyData() at the App level triggers a
// re-render once they land. Every consumer below treats missing
// entries as empty (|| [] / optional chaining) so the brief
// loading window doesn't throw.
import { HEAVY, useHeavyData } from './data/lazyHeavy'
import { DOD_CIVILIAN_CHECKLIST } from './data/dodCivilianChecklist'
// Shared installation search-location + official-source card builders.
// Leaf module (depends only on static data) so the tabs that use these can
// be code-split without a circular import back into App.jsx. — Tier 1b PR-A
import {
  getInstallationSearchLocation,
  officialSchoolSearchUrl,
  officialSchoolCards,
} from './lib/installationSources'
// AppLanguageRuntimeMount wraps both i18n runtimes (dictionary
// MutationObserver + Google Translate bootstrap). React.lazy keeps the
// ~90 KB i18n payload off the cold-start path for English users; the
// mount is gated below on `appLanguage !== 'en'` so the chunk only
// downloads when a non-English locale is actually selected.
const AppLanguageRuntimeMount = lazyRetry(() => import('./i18n/AppLanguageRuntimeMount'))

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
  //    closeCryptoStoreDB is re-exported by SecurityExtensions so we
  //    don't trigger the mixed static + dynamic import path against
  //    cryptoStore.js (the previous dynamic import here was causing
  //    Vite to chunk cryptoStore twice and produced a minifier TDZ
  //    path on its module-level `let` bindings).
  try { closeCryptoStoreDB(); } catch {}
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
function ResetWarningModal({ theme: _theme, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);
  return (
    <div ref={dialogRef} data-no-language-runtime role="dialog" aria-modal="true" aria-labelledby="reset-warning-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
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
  // Surface a SAVE FAILURE so a member never loses progress silently. The
  // secureLocalStore dispatches `pcs-local-storage-error` on encrypt-failed,
  // write-failed (incl. QuotaExceeded), or crypto-unavailable.
  const [saveError, setSaveError] = useState(null); // { reason } | null
  const [, tickRelativeTime] = useReducer(x => x + 1, 0);
  useEffect(() => {
    const seed = () => {
      try {
        const raw = localStorage.getItem('pcs_last_local_save_at');
        if (raw) setLastSave(JSON.parse(raw));
      } catch {}
    };
    seed();
    const onSync = () => { setSaveError(null); seed(); };
    const onError = (e) => { setSaveError({ reason: e?.detail?.reason || 'unknown' }); setOpen(true); };
    window.addEventListener('pcs-local-sync', onSync);
    window.addEventListener('pcs-local-storage-error', onError);
    return () => {
      window.removeEventListener('pcs-local-sync', onSync);
      window.removeEventListener('pcs-local-storage-error', onError);
    };
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
  // Force re-render every 30s so the relative time stays accurate. Use a
  // dedicated tick counter — mutating lastSave with `v + ''` returns an
  // identical string, so React bails out of the update and nothing
  // re-renders (the relative label would go stale).
  useEffect(() => {
    const id = setInterval(tickRelativeTime, 30_000);
    return () => clearInterval(id);
  }, []);
  const errorMsg = saveError && ({
    'write-failed': 'Your device blocked the save (storage may be full or private-browsing is on). Free up space or disable private mode, then make the change again.',
    'encrypt-failed': 'Encryption failed on this device, so the change was NOT saved (we refuse to store your data unencrypted). Reload the app and try again.',
    'crypto-unavailable': 'This browser can’t open the secure store, so a saved item couldn’t be read. Reload the app; if it persists, update your browser.',
    'decrypt-failed': 'A saved item couldn’t be read back. Your other data is fine; reload the app.',
  }[saveError.reason] || 'A change may not have been saved. Reload the app and make the change again.');

  return (
    <div data-no-language-runtime style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 150, pointerEvents: 'auto' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={saveError ? 'Save problem — details' : 'Save status'}
        title={saveError ? 'A recent change may not have saved — tap for details' : 'Save status — your data is auto-saved with AES-256 encryption'}
        style={{
          background: saveError ? '#B71C1C' : theme.primary,
          color: '#FFFFFF',
          border: `1.5px solid ${saveError ? '#7F1010' : theme.accent + '80'}`,
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
        <span style={{ fontSize: 12 }} aria-hidden="true">{saveError ? '⚠️' : '🔒'}</span>
        <span>{saveError ? 'Save problem' : rel}</span>
      </button>
      {open && (
        <div role={saveError ? 'alertdialog' : 'dialog'} aria-live={saveError ? 'assertive' : undefined} style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, width: 280, background: '#FFFFFF', border: `1px solid ${saveError ? '#EF9A9A' : theme.accent + '55'}`, borderLeft: saveError ? '4px solid #B71C1C' : undefined, borderRadius: 12, padding: 12, color: '#111827', fontSize: 11, lineHeight: 1.55, boxShadow: '0 12px 30px rgba(0,0,0,0.22)' }}>
          {saveError ? (
            <>
              <div style={{ fontWeight: 950, color: '#B71C1C', fontSize: 11, letterSpacing: '.08em', marginBottom: 6 }}>⚠️ CHANGE MAY NOT HAVE SAVED</div>
              {errorMsg}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 950, color: theme.primary, fontSize: 11, letterSpacing: '.08em', marginBottom: 6 }}>SAVED ON THIS DEVICE</div>
              Your profile, checklist, and documents are saved every time you change something. The data is scrambled with strong encryption (AES-256) and stays only on this device — we never see it. This badge updates each time a save happens.
            </>
          )}
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

// Checklist tailoring helpers. Live in App.jsx (not src/data/) because
// CHECKLIST_FILTERS calls ordersTypeMeta() defined above and is most
// naturally co-located with the App-component scope that consumes
// getTailoredChecklist. The underlying BRANCH_PCS_CHECKLISTS +
// DOD_CIVILIAN_CHECKLIST data tables themselves live in src/data/.
function getBranchChecklist(branch, component) {
  if (component === 'DoD Civilian') return DOD_CIVILIAN_CHECKLIST;
  return HEAVY.BRANCH_PCS_CHECKLISTS[branch] || HEAVY.BRANCH_PCS_CHECKLISTS['Army'] || [];
}

// Predicate-based task filtering. A task is shown only when EVERY
// applicable predicate returns true. `\bschool\b` is intentionally
// singular: we don't want to filter universal tasks such as "Make
// certified copies of orders for finance, housing, schools" which
// simply mention schools as a copy-recipient.
const CHECKLIST_FILTERS = [
  { pattern: /\bpet\b|aphis|usda|veterinar|rabies|microchip|kennel/i,
    keep: (p) => p.hasPets },
  { pattern: /\bschool\b|education\s+records|district|iep|504 plan|enroll children|\bcyss\b|pediatrician|children'?s\b|childcare\b|child care\b|\bcdc\b|child development/i,
    keep: (p) => p.hasChildren },
  { pattern: /\bspouse|seco|mycaa|dependent\b|dependents\b|deers-linked mtf and book pediatric|family member travel screening|family member overseas screening|family care plan|family readiness/i,
    keep: (p) => p.hasDependents || p.hasChildren },
  { pattern: /\befmp\b/i,
    keep: (p) => p.hasDependents || p.hasChildren },
  { pattern: /\bweight ticket|weight-ticket|\bppm\b|\bdity\b/i,
    keep: (p) => p.moveType === 'PPM' },
  { pattern: /\boconus\b|no-fee passport|overseas screening|\bsofa\b|country clearance|host nation|host-nation|\bvisa\b/i,
    keep: (p) => p.isOverseas },
  { pattern: /house hunting trip/i,
    keep: (p) => !p.isOverseas },
  { pattern: /license reciprocity at gaining state/i,
    keep: (p) => !p.isOverseas },
  { pattern: /host-nation professional credential recognition/i,
    keep: (p) =>  p.isOverseas },
  { pattern: /\bbah\b|basic allowance for housing|on-post housing|on-installation housing|housing waitlist/i,
    keep: (p) => p.component !== 'Reserve' && p.component !== 'National Guard'
      ? true
      : !p.ordersType
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
  { pattern: /register with mtf|enroll family in tricare at gaining installation/i,
    keep: (p) => !p.isOverseas },
  { pattern: /tricare overseas program|tricare-overseas\.com|\btop prime\b|\btop select\b/i,
    keep: (p) =>  p.isOverseas },
  { pattern: /file change of address with usps|usps, bank, irs, and social security change of address/i,
    keep: (p) => !p.isOverseas },
  { pattern: /apo\/fpo\/dpo/i,
    keep: (p) =>  p.isOverseas },
  { pattern: /on-base credit union|host-nation account/i,
    keep: (p) =>  p.isOverseas },
  { pattern: /family member preference \(fmp\)|priority placement program \(ppp-s\)|host-nation work permit/i,
    keep: (p) =>  p.isOverseas },
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
    // Migrate retired Google-Translate-only locales (sw/ha/yo/am/zu/ig/so/af)
    // back to English so a returning user who once picked one isn't stranded
    // on a language that's no longer offered (and never actually translated
    // on Vercel/native). Any code not in the supported picker falls back too.
    language: (SUPPORTED_LANGUAGES.some(l => l.code === raw.language) ? raw.language : null) || PROFILE_DEFAULTS.language,
    religiousPreference: raw.religiousPreference || raw.religion || PROFILE_DEFAULTS.religiousPreference,
    demoMode: raw.demoMode === true || raw.isDemo === true,
  };
}

// AppErrorBoundary and its recovery helpers were extracted to
// src/components/AppErrorBoundary.jsx in Phase 15.2 to shrink this
// 9,500-line shell and make boundary changes easier to review.

const BRANCH_HOME_INSIGNIA = {
  Army: 'USA',
  Navy: 'USN',
  'Marine Corps': 'USMC',
  'Air Force': 'USAF',
  'Space Force': 'USSF',
  'Coast Guard': 'USCG',
  'DoD Civilian': 'DoD',
};

function getHomeBranchInsignia(branch) {
  const theme = BRANCH_THEMES[branch] || BRANCH_THEMES.Army;
  return BRANCH_HOME_INSIGNIA[branch] || theme.insignia || theme.abbr || 'PCS';
}

// === MODERN TYPE STACK ===
// Inter (body / UI) + Space Grotesk (display headers, brand mark,
// numeric stats). Both are loaded via Google Fonts in index.html.
// Centralizing the strings here so the entire dashboard chrome and
// the landing share one canonical stack — replaces the prior
// `fontFamily: APP_FONT` that left the app reading in whatever
// the OS shipped by default (visibly different per device).
const APP_FONT     = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Roboto, system-ui, sans-serif';
const DISPLAY_FONT = '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI Variable", system-ui, sans-serif';

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
  const targetDate = parseLocalDate(target);
  if (!targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((targetDate - today) / 86400000);

  // tMinus = days from TODAY until this milestone. A milestone sits at
  // (report date + m.days), so its distance from now is daysUntil + m.days.
  // (Previously this was negated, which inverted passed/upcoming and the
  // sort — future tasks rendered struck-through as "passed".)
  const upcoming = TMINUS_MILESTONES
    .map(m => ({ ...m, dueDate: new Date(targetDate.getTime() + m.days * 86400000), tMinus: daysUntil + m.days }))
    .filter(m => m.tMinus <= 14 && m.tMinus >= -14)
    .sort((a, b) => a.tMinus - b.tMinus);

  const tLabel = daysUntil >= 0 ? `T-${daysUntil}` : `T+${Math.abs(daysUntil)}`;
  const tColor = daysUntil < 0 ? '#16A34A' : daysUntil <= 7 ? '#DC2626' : daysUntil <= 30 ? '#F59E0B' : theme.accent;

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${UI_PALETTE.line}`, borderLeft: `4px solid ${tColor}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 10, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>T-MINUS · REPORT-NLT</h2>
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
    <TabBar ariaLabel="Quick actions" className="pcs-tabbar--flush">
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
    </TabBar>
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

// ───────────────────────────────────────────────────────────────────
// WeeklyDigestCard — aggregated stats from the last 7 days.
//
// Reads the audit log + the current checklistItems / snooze state
// and renders a 4-stat tile: tasks completed, tasks reopened,
// inventory updates, AI sessions. Companion to ChangeLogCard
// (which lists individual events).
// ───────────────────────────────────────────────────────────────────
function WeeklyDigestCard({ theme, checklistItems }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => secureLocalStore.get('pcs_audit_log', []))
      .then(list => {
        if (!mounted) return;
        try {
          const sevenDaysAgo = Date.now() - 7 * 86400000;
          const recent = (Array.isArray(list) ? list : []).filter(e => e?.timestamp && new Date(e.timestamp).getTime() >= sevenDaysAgo);
          const completed = recent.filter(e => e.action === 'pcs_milestone_status_change' && e.details?.complete).length;
          const reopened  = recent.filter(e => e.action === 'pcs_milestone_status_change' && !e.details?.complete).length;
          const inv       = recent.filter(e => e.action === 'inventory_vault_change').length;
          const aiOpens   = recent.filter(e => e.action === 'ai_assistant_opened').length;
          const pet       = recent.filter(e => e.action === 'pet_relocation_checklist_change').length;
          const ship      = recent.filter(e => e.action === 'shipment_tracker_change').length;
          const totalOpen = Object.values(checklistItems || {}).filter(Boolean).length;
          setStats({ completed, reopened, inv, aiOpens, pet, ship, totalChecked: totalOpen });
        } catch (err) {
          console.error('[WeeklyDigestCard] aggregation failed', err);
          setStats(null);
        }
      })
      .catch((err) => { console.error('[WeeklyDigestCard] load failed', err); setStats(null); });
    return () => { mounted = false; };
  }, [checklistItems]);
  if (!stats) return null;
  const anyActivity = stats.completed + stats.reopened + stats.inv + stats.aiOpens + stats.pet + stats.ship > 0;
  if (!anyActivity) return null;
  const tiles = [
    { label: 'Tasks completed',    value: stats.completed,   accent: '#2E7D32' },
    { label: 'Tasks reopened',     value: stats.reopened,    accent: '#E65100' },
    { label: 'Inventory updates',  value: stats.inv,         accent: theme.primary },
    { label: 'AI sessions',        value: stats.aiOpens,     accent: '#0D3B66' },
  ];
  return (
    <div role="region" aria-label="Weekly digest" style={{ background: UI_PALETTE.surface, border: `1px solid ${UI_PALETTE.line}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: '0 12px 28px rgba(38,53,31,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>WEEKLY DIGEST</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: UI_PALETTE.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>Last 7 days</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {tiles.map(t => (
          <div key={t.label} style={{ background: UI_PALETTE.surfaceSoft || '#F6F1E4', border: `1px solid ${UI_PALETTE.line}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 24, fontWeight: 950, color: t.accent, lineHeight: 1 }}>{t.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: UI_PALETTE.muted, marginTop: 4, letterSpacing: '.04em', textTransform: 'uppercase' }}>{t.label}</div>
          </div>
        ))}
      </div>
      {(stats.pet > 0 || stats.ship > 0) && (
        <div style={{ fontSize: 11, color: UI_PALETTE.muted, marginTop: 10, lineHeight: 1.5 }}>
          Plus {stats.pet > 0 ? `${stats.pet} pet-relocation update${stats.pet === 1 ? '' : 's'}` : ''}{stats.pet > 0 && stats.ship > 0 ? ' and ' : ''}{stats.ship > 0 ? `${stats.ship} shipment milestone${stats.ship === 1 ? '' : 's'}` : ''}.
        </div>
      )}
    </div>
  );
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
  const [snoozes, setSnoozes] = useState({});  // { 'phase-idx': 'YYYY-MM-DD' }
  useEffect(() => {
    let mounted = true;
    secureLocalStore.get('pcs_mission_lane_snoozes', {}).then(saved => {
      if (mounted) setSnoozes(saved && typeof saved === 'object' ? saved : {});
    });
  }, []);
  const snoozeUntil = (taskKey, dateStr) => {
    setSnoozes(prev => {
      const next = { ...prev, [taskKey]: dateStr };
      secureLocalStore.set('pcs_mission_lane_snoozes', next);
      AuditLogger.record('mission_lane_snooze', { task: taskKey, until: dateStr });
      return next;
    });
  };
  const unsnooze = (taskKey) => {
    setSnoozes(prev => {
      const next = { ...prev };
      delete next[taskKey];
      secureLocalStore.set('pcs_mission_lane_snoozes', next);
      return next;
    });
  };
  const isSnoozedNow = (taskKey) => {
    const u = snoozes[taskKey];
    if (!u) return false;
    const until = new Date(`${u}T23:59:59`);
    if (isNaN(until.getTime())) return false;
    return Date.now() < until.getTime();
  };

  const target = profile?.reportNLTDate || profile?.departingDate;
  if (!target) return null;
  const targetDate = parseLocalDate(target);
  if (!targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((targetDate - today) / 86400000);

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
      if ((checklistItems || {})[key]) continue;
      if (isSnoozedNow(key)) continue;
      open.push({ phase, idx: i, label: list[i], key });
      if (open.length >= limit) break;
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
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>MISSION LANES</h2>
        <button onClick={onJumpToOps} style={{ fontSize: 10, fontWeight: 800, color: theme.primary, background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Full checklist →
        </button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: UI_PALETTE.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>{reportContext}</div>
      {Object.keys(snoozes).filter(k => isSnoozedNow(k)).length > 0 && (
        <div style={{ fontSize: 10, color: UI_PALETTE.muted, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💤 {Object.keys(snoozes).filter(k => isSnoozedNow(k)).length} task{Object.keys(snoozes).filter(k => isSnoozedNow(k)).length === 1 ? '' : 's'} snoozed</span>
          <button
            onClick={() => {
              const active = Object.keys(snoozes).filter(k => isSnoozedNow(k));
              active.forEach(unsnooze);
            }}
            style={{ background: 'transparent', border: 'none', color: theme.primary, fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em' }}
          >
            Wake all
          </button>
        </div>
      )}
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
                <li key={`${item.phase}-${item.idx}`} style={{ background: UI_PALETTE.surfaceSoft || '#F6F1E4', border: `1px solid ${UI_PALETTE.line}`, borderLeft: `3px solid ${lane.accent}`, borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <button
                    onClick={onJumpToOps}
                    style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}
                    aria-label={`Open PCS Operations for: ${item.label}`}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: UI_PALETTE.text, lineHeight: 1.45, flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: lane.accent, whiteSpace: 'nowrap', marginTop: 2, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                      {item.phase}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Default snooze: 3 days from today. Quick-pick;
                      // the user can choose another date via a prompt.
                      const def = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
                       
                      const picked = window.prompt('Snooze this task until (YYYY-MM-DD):', def);
                      if (picked && /^\d{4}-\d{2}-\d{2}$/.test(picked)) {
                        snoozeUntil(item.key, picked);
                      }
                    }}
                    aria-label={`Snooze task: ${item.label}`}
                    title="Snooze until a chosen date"
                    style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${UI_PALETTE.line}`, borderRadius: 6, color: UI_PALETTE.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '3px 7px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1 }}
                  >
                    💤
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
  "DoD Civilian": { primary: "#0D3B66", secondary: "#082A4D", accent: "#C99A3D", motto: "MISSION FIRST",  tagline: "Service to the Nation",        insignia: "DoD",  abbr: "DoD"  },
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



// Installation search-location resolver + official-source card builders
// (getInstallationSearchLocation, official{School,College}Cards,
// veteranBusiness{BubbleLinks,DiscoveryCards}, googleSearchUrl,
// officialSchoolSearchUrl) were moved to src/lib/installationSources.js —
// a leaf module imported at the top of this file — so the tabs that share
// them (SchoolsTab, VeteranBusinessesTab, EducationBenefitsTab) can be
// code-split into lazy chunks without a circular import. — perf Tier 1b PR-A





// DoD Civilian PCS checklist. Civilian PCS is governed by the Federal
// Travel Regulation (FTR), Chapter 302, and the DCPAS civilian
// relocation guide — NOT the Joint Travel Regulations military rules.
// All tasks below reference public regulatory citations and official
// DoD civilian HR offices (CPAC / DCPAS / HR Service Center) rather
// than military S1 / Personnel offices.

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
  // Subscribe to the lazy HEAVY tables directly so that — now wrapped in
  // React.memo — this tab still re-renders when BRANCH_PCS_CHECKLISTS
  // lands (useHeavyData's forceUpdate bypasses memo's prop comparison).
  useHeavyData();
  // Memoized so toggling a checkbox (which changes checklistItems and
  // re-renders this tab) doesn't re-tailor the whole branch checklist.
  // heavyChecklists is bound from HEAVY (empty {} until the lazy table
  // loads, then reassigned) so the memo recomputes once data arrives;
  // the firstPhase effect below back-fills activePhase on that transition.
  // heavyChecklists changes only via HEAVY's one-time load mutation; the
  // recompute is flushed by App's useHeavyData() re-render (exhaustive-deps
  // can't model external-mutation + external-rerender, hence the disable).
  const heavyChecklists = HEAVY.BRANCH_PCS_CHECKLISTS;
  const branchChecklist = useMemo(() => getTailoredChecklist(profile?.branch || 'Army', {
    component:     profile?.component || 'Active Duty',
    ordersType:    profile?.ordersType || '',
    hasDependents: !!profile?.hasDependents,
    hasChildren:   !!profile?.hasChildren,
    hasPets:       !!profile?.hasPets,
    moveType:      profile?.moveType || 'HHG',
    isOverseas:    !!profile?.isOverseas,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profile?.branch, profile?.component, profile?.ordersType, profile?.hasDependents, profile?.hasChildren, profile?.hasPets, profile?.moveType, profile?.isOverseas, heavyChecklists]);
  const [activePhase, setActivePhase] = useState(Object.keys(branchChecklist)[0]);
  // branchChecklist is {} during the lazy data-load window, so the
  // useState initializer above can be undefined. Back-fill the first
  // phase once the checklist tables resolve (or if the user's branch
  // initially had none), so the tab recovers instead of staying blank.
  const firstPhase = Object.keys(branchChecklist)[0];
  useEffect(() => {
    if (!activePhase && firstPhase) setActivePhase(firstPhase);
  }, [firstPhase, activePhase]);
  // Reminders: { 'phase-idx': 'YYYY-MM-DDTHH:MM' }
  const [reminders, setReminders] = useState({});
  useEffect(() => {
    let mounted = true;
    secureLocalStore.get('pcs_checklist_reminders', {}).then(saved => {
      if (mounted) setReminders(saved && typeof saved === 'object' ? saved : {});
    });
  }, []);
  // Fired-already tracker so a 60-second poll doesn't re-fire.
  const firedRef = useRef({});
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const tick = () => {
      if (Notification.permission !== 'granted') return;
      const now = Date.now();
      for (const [key, iso] of Object.entries(reminders)) {
        if (!iso || firedRef.current[key]) continue;
        const t = new Date(iso).getTime();
        if (!Number.isFinite(t)) continue;
        if (t <= now && now - t < 24 * 3600 * 1000) {
          // Don't fire if already checked off.
          if (checklistItems[key]) continue;
          // Split on the LAST hyphen: phase names contain hyphens
          // ("In-Processing"), so a naive split('-') mis-parses the key and
          // drops the real task label to the generic fallback.
          const sep = key.lastIndexOf('-');
          const phase = key.slice(0, sep);
          const idx = key.slice(sep + 1);
          const label = (branchChecklist[phase] || [])[parseInt(idx, 10)] || 'PCS task';
          try {
            const n = new Notification('PCS Express reminder', {
              body: label,
              tag: `pcs-rem-${key}`,
            });
            n.onclick = () => { try { window.focus(); } catch {} };
            firedRef.current[key] = true;
            AuditLogger.record('pcs_reminder_fired', { task: key });
          } catch {}
        }
      }
    };
    tick();                          // check on mount
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [reminders, checklistItems, branchChecklist]);

  const setReminder = (key, iso) => {
    setReminders(prev => {
      const next = { ...prev, [key]: iso };
      secureLocalStore.set('pcs_checklist_reminders', next);
      AuditLogger.record('pcs_reminder_set', { task: key, at: iso });
      // Reset the "already fired" guard so a future reschedule fires.
      firedRef.current[key] = false;
      return next;
    });
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };
  const clearReminder = (key) => {
    setReminders(prev => {
      const next = { ...prev };
      delete next[key];
      secureLocalStore.set('pcs_checklist_reminders', next);
      return next;
    });
    firedRef.current[key] = false;
  };

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

  // Outstanding (unchecked) tasks feed the device-notification + Command
  // Center priority feed. Priority is tailored by phase position — the
  // earliest phases (nearest action) are High, the latest are Low.
  const checklistPhaseKeys = Object.keys(branchChecklist);
  const outstandingAlerts = checklistPhaseKeys.flatMap((phase, pi) => {
    const pr = pi < Math.ceil(checklistPhaseKeys.length / 3) ? 'High'
      : pi < Math.ceil((2 * checklistPhaseKeys.length) / 3) ? 'Medium' : 'Low';
    return (branchChecklist[phase] || [])
      .map((task, i) => ({ key: `${phase}-${i}`, task }))
      .filter(t => !checklistItems[t.key] && typeof t.task === 'string')
      .map(t => ({ id: t.key, title: t.task, priority: pr }));
  });

  const phaseIsOverdue = daysUntil !== null && PHASE_WINDOWS[activePhase] && daysUntil < PHASE_WINDOWS[activePhase].overdueAt;

  // Guard the lazy-load window: until a phase is known, several render
  // paths below dereference activePhase (e.g. activePhase.replace(...)),
  // which would throw on undefined. Show a lightweight placeholder.
  if (!activePhase) {
    return <div style={{ padding: 24, color: '#56697C', fontSize: 13 }}>Loading your PCS checklist…</div>;
  }

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

      <NotificationModeSelector theme={theme} checklistId="pcs-checklist" checklistLabel="PCS Checklist" alerts={outstandingAlerts} />

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
            <span style={{ fontSize: 12, color: '#56697C' }}>{done}/{allTasks.length} tasks</span>
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
      <TabBar ariaLabel="PCS phase" className="pcs-tabbar--flush">
        {Object.keys(branchChecklist).map(phase => {
          const phaseTasks = branchChecklist[phase].map((_, i) => `${phase}-${i}`);
          const phaseDone = phaseTasks.filter(k => checklistItems[k]).length;
          const phaseOverdue = daysUntil !== null && PHASE_WINDOWS[phase] && daysUntil < PHASE_WINDOWS[phase].overdueAt && phaseDone < phaseTasks.length;
          const isActive = activePhase === phase;
          return (
            <button key={phase} id={`phase-tab-${phase.replace(/\s+/g, '-')}`} role="tab" aria-selected={isActive} aria-controls={`phase-panel-${phase.replace(/\s+/g, '-')}`} data-active={isActive || undefined} onClick={() => setActivePhase(phase)} className={`pcs-tab ${isActive ? 'is-active' : ''}`} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${phaseOverdue ? '#EF9A9A' : isActive ? theme.primary : '#E0E6EE'}`, background: isActive ? theme.primary : phaseOverdue ? '#FFF5F5' : '#FFF', color: isActive ? '#FFF' : phaseOverdue ? '#C62828' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: phaseOverdue || isActive ? 800 : 700, whiteSpace: 'nowrap' }}>
              {phaseOverdue ? '⚠ ' : ''}{phase} ({phaseDone}/{phaseTasks.length})
            </button>
          );
        })}
      </TabBar>

      {/* "Explain this phase" — opens the AI Assistant with a
          phase-specific question pre-filled so the user doesn't have
          to type. Routes through the open-ai-assistant CustomEvent
          so this stays decoupled from App-level modal state. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => {
            const q = `Explain what I need to do in the "${activePhase}" phase of my PCS as a ${profile?.branch || 'service member'} ${profile?.component || ''} ${profile?.isOverseas ? 'with an OCONUS PCS' : ''}. Reference JTR / FTR sections where they apply.`;
            window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { question: q } }));
            // App.jsx listens for the same event and toggles the
            // modal open; the modal listens for the event and
            // pre-fills the input with `detail.question`. Single
            // dispatch handles both sides.
          }}
          aria-label={`Ask AI to explain the ${activePhase} phase`}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.primary}40`,
            color: theme.primary,
            fontSize: 11,
            fontWeight: 700,
            padding: '6px 10px',
            borderRadius: 999,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span aria-hidden="true">🤖</span> Ask AI about "{activePhase}"
        </button>
      </div>

      {/* Tasks */}
      <div role="tabpanel" id={`phase-panel-${activePhase.replace(/\s+/g, '-')}`} aria-labelledby={`phase-tab-${activePhase.replace(/\s+/g, '-')}`}>
        {(branchChecklist[activePhase] || []).map((task, i) => {
          const checked = !!checklistItems[`${activePhase}-${i}`];
          const taskOverdue = phaseIsOverdue && !checked;
          return (
            <div key={i} className={`pcs-check-item ${checked ? 'is-checked' : ''} ${taskOverdue ? 'is-overdue' : ''}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, background: checked ? '#E8F5E9' : taskOverdue ? '#FFF5F5' : '#FFFFFF', border: `1px solid ${checked ? '#A5D6A7' : taskOverdue ? '#FFCDD2' : 'rgba(0,0,0,0.08)'}`, marginBottom: 8, '--check-accent': theme.accent }}>
              <button type="button" role="checkbox" aria-checked={checked} onClick={() => toggleCheckItem(activePhase, i)} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 12, background: 'transparent', border: 'none', padding: 0, margin: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
                <span className="pcs-check-item__box" aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#2E7D32' : taskOverdue ? '#E57373' : theme.accent}`, background: checked ? '#2E7D32' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {checked && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: checked ? '#888' : taskOverdue ? '#C62828' : theme.primary, textDecoration: checked ? 'line-through' : 'none', fontWeight: checked ? 400 : 600, lineHeight: 1.4 }}>{task}</span>
                  {taskOverdue && <span style={{ display: 'block', fontSize: 10, color: '#E57373', fontWeight: 800, marginTop: 3 }}>PAST DUE — Complete immediately</span>}
                  {reminders[`${activePhase}-${i}`] && (
                    <span style={{ display: 'block', fontSize: 10, color: '#0D3B66', fontWeight: 700, marginTop: 3 }}>
                      ⏰ Reminder: {new Date(reminders[`${activePhase}-${i}`]).toLocaleString()}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const key = `${activePhase}-${i}`;
                  if (reminders[key]) {
                    if (window.confirm('Clear this reminder?')) clearReminder(key);
                    return;
                  }
                  // Default to tomorrow at 09:00 local time.
                  const def = new Date(Date.now() + 86400000);
                  def.setHours(9, 0, 0, 0);
                  const pad = (n) => String(n).padStart(2, '0');
                  const defStr = `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(def.getDate())}T${pad(def.getHours())}:${pad(def.getMinutes())}`;

                  const picked = window.prompt('Remind me on (YYYY-MM-DDTHH:MM, 24-hour):', defStr);
                  if (picked && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(picked)) {
                    setReminder(key, picked);
                  }
                }}
                aria-label={reminders[`${activePhase}-${i}`] ? 'Clear reminder' : 'Set reminder for this task'}
                title={reminders[`${activePhase}-${i}`] ? 'Clear reminder' : 'Set reminder'}
                style={{ background: 'transparent', border: 'none', color: reminders[`${activePhase}-${i}`] ? '#0D3B66' : 'rgba(0,0,0,0.35)', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0, marginTop: 1 }}
              >
                ⏰
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Several curated school datasets are keyed by an older/short installation
// name (e.g. "NS San Diego") that doesn't match the canonical
// MILITARY_DUTY_STATIONS name the profile stores ("Naval Base San Diego"),
// so the direct lookup silently returned []. Map the canonical station name
// → the school-data key(s). "Joint Base San Antonio" merges the Lackland +
// Randolph datasets; the two USAG Italy garrisons share one dataset.
const SCHOOL_KEY_ALIASES = {
  'Naval Air Station Jacksonville': ['NAS Jacksonville'],
  'USAG Bavaria (Grafenwöhr)': ['USAG Bavaria'],
  'USAG Italy (Vicenza)': ['USAG Italy'],
  'USAG Italy (Livorno)': ['USAG Italy'],
  'Naval Base Kitsap': ['NS Bremerton'],
  'Naval Base Coronado': ['NAS North Island'],
  'Naval Base San Diego': ['NS San Diego'],
  'Naval Air Station Lemoore': ['NAS Lemoore'],
  'Naval Station Everett': ['NS Everett'],
  'Joint Base Langley-Eustis': ['Langley AFB'],
  'Joint Base San Antonio': ['Lackland AFB', 'Randolph AFB'],
  'MCB Hawaii Kaneohe Bay': ['MCAS Kaneohe Bay'],
  'USAG Japan (Camp Zama)': ['Camp Zama'],
  'Naval Station Rota': ['NS Rota'],
  // Renamed Army posts: both the legacy and current name are selectable, and
  // each name carries a complementary partial school list (e.g. Fort Liberty's
  // off-post Title I schools vs Fort Bragg's on-post DoDEA schools). Cross-link
  // them so a user sees the SAME merged list under either name.
  'Fort Liberty': ['Fort Bragg'],
  'Fort Bragg': ['Fort Liberty'],
  'Fort Cavazos': ['Fort Hood'],
  'Fort Hood': ['Fort Cavazos'],
  'Fort Moore': ['Fort Benning'],
  'Fort Benning': ['Fort Moore'],
};

function resolveInstallationSchools(instName) {
  const direct = HEAVY.INSTALLATION_SCHOOLS[instName] || [];
  const aliasLists = (SCHOOL_KEY_ALIASES[instName] || [])
    .flatMap(k => HEAVY.INSTALLATION_SCHOOLS[k] || []);
  if (!aliasLists.length) return direct;
  // Merge the direct list with every aliased list, deduped by school name, so
  // renamed bases (Fort Bragg/Fort Liberty, Hood/Cavazos, Benning/Moore) show
  // one combined list under either name instead of two divergent partial ones.
  const seen = new Set();
  const merged = [];
  for (const s of [...direct, ...aliasLists]) {
    const key = String(s?.name || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(s);
  }
  return merged;
}

// Pure helpers hoisted to module scope so they have stable identity and
// can be referenced inside SchoolsTab's useMemo blocks without becoming
// per-render dependencies. fuzzyCuratedRating takes `schools` as a param
// (was a closure) so it stays pure.
const gradeForAge = age => {
  if (age < 5) return 'Pre-K';
  if (age <= 10) return 'K-5';
  if (age <= 13) return '6-8';
  return '9-12';
};
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
function fuzzyCuratedRating(name, schools) {
  if (!schools.length) return null;
  const t = String(name || '').toLowerCase();
  const hit = schools.find(s => t.includes(String(s.name).toLowerCase().slice(0, 12)) || String(s.name).toLowerCase().includes(t.slice(0, 12)));
  return hit?.rating ?? null;
}

function SchoolsTab({ theme, profile }) {
  // Subscribe to the lazy HEAVY tables directly so that — now that this
  // component is wrapped in React.memo — it still re-renders when the
  // data lands (memo blocks parent-prop re-renders, but useHeavyData's
  // internal forceUpdate bypasses memo). Without this, a memo'd SchoolsTab
  // mounted before the lazy chunk resolves would show empty schools.
  useHeavyData();
  const [section, setSection] = useState('schools');
  const [sortBy, setSortBy] = useState('rating');
  const [showAll, setShowAll] = useState(false);
  const [searchAge, setSearchAge] = useState('');
  const [searchZip, setSearchZip] = useState('');

  const instName = (profile?.gainingInstallation || '').split(',')[0].trim();
  // Bind the lazy table to a local const so it's a valid memo dependency:
  // it's an empty {} until the lazy data chunk loads, then reassigned to
  // the real table (new reference). HEAVY is subscribed only at the App
  // level, so SchoolsTab re-renders via App on load; this dep makes the
  // memo recompute then instead of caching the empty pre-load result.
  const heavySchools = HEAVY.INSTALLATION_SCHOOLS;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- heavySchools changes only via HEAVY's one-time load mutation; the recompute is flushed by App's useHeavyData() re-render. exhaustive-deps can't model external-mutation + external-rerender.
  const schools = useMemo(() => resolveInstallationSchools(instName), [instName, heavySchools]);
  const daycares = DAYCARE_DATA[instName] || [];
  const _searchLocation = getInstallationSearchLocation(instName);
  const schoolFinderCards = officialSchoolCards(instName);

  // Child ages resolved from the onboarding profile. Declared here
  // (before the live-fetch effect and enrichment) so the grade-match
  // sort below can read it without hitting a temporal dead zone when
  // the live fetch returns schools synchronously from cache.
  const agesFromProfile = useMemo(() => (
    profile?.childAges?.length > 0
      ? profile.childAges.filter(a => !isNaN(Number(a))).map(Number)
      : (profile?.childrenAges || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
  ), [profile?.childAges, profile?.childrenAges]);

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
    fetchWithTimeout(apiUrl(`/api/schools-nearby?${params.toString()}`), { headers: { Accept: 'application/json' } })
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
    // profile.language is read inside the fetch URL builder but the
    // effect intentionally does not re-run on language changes —
    // changing UI language must not refetch the OSM payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market.city, market.state, market.zip, market.matched, instName]);
  // Sort + tag live OSM schools so the priority order is:
  //   1. Military / DoDEA / on-installation
  //   2. Schools whose grade range matches the child ages from
  //      onboarding (prioritized, not filtered - parents need to see
  //      siblings' options too)
  //   3. Then by ascending distance
  // Backend already promotes military-first; this layer adds the
  // grade-match prioritization on top. Memoized so it doesn't re-run
  // the O(n²) curated-rating fuzzy match on every unrelated re-render
  // (typing in the search box, toggling sections, parent App renders).
  const enrichedLive = useMemo(() => {
    const list = liveSchools.schools.map(s => ({
      ...s,
      gradeMatch: gradeMatchesAge(s.grades, agesFromProfile),
      curatedRating: fuzzyCuratedRating(s.name, schools),
    }));
    list.sort((a, b) => {
      if (a.isMilitary !== b.isMilitary) return a.isMilitary ? -1 : 1;
      if (a.gradeMatch !== b.gradeMatch) return a.gradeMatch ? -1 : 1;
      return a.distanceMiles - b.distanceMiles;
    });
    return list;
  }, [liveSchools.schools, agesFromProfile, schools]);
  const liveK12 = useMemo(() => enrichedLive.filter(s => s.categoryId === 'k12'), [enrichedLive]);
  const liveDaycare = useMemo(() => enrichedLive.filter(s => s.categoryId === 'childcare' || s.categoryId === 'preschool'), [enrichedLive]);

  const filteredSchools = useMemo(() => {
    const relevantGrades = new Set(agesFromProfile.map(gradeForAge));
    let result = (showAll || agesFromProfile.length === 0)
      ? schools
      : schools.filter(s => [...relevantGrades].some(g => {
          if (g === 'Pre-K') return false;
          const [gStart] = g.split('-');
          return s.grades.includes(gStart) || s.grades === g;
        }));
    result = sortBy === 'rating'
      ? [...result].sort((a, b) => b.rating - a.rating)
      : [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [schools, agesFromProfile, showAll, sortBy]);

  const handleSearch = () => {
    const _grade = gradeForAge(parseInt(searchAge) || 10);
    const url = 'https://nces.ed.gov/ccd/schoolsearch/';
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
              <span style={{ fontSize: 11, color: '#56697C' }}>Sort curated:</span>
              {[['rating', 'Highest Rated'], ['name', 'A–Z']].map(([id, label]) => (
                <button key={id} onClick={() => setSortBy(id)} className={`pcs-chip ${sortBy === id ? 'is-active' : ''}`} style={{ padding: '5px 10px', borderRadius: 14, border: `1.5px solid ${sortBy === id ? theme.primary : '#E0E6EE'}`, background: sortBy === id ? theme.primary : '#FFF', color: sortBy === id ? '#FFF' : '#56697C', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {!instName && <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>Complete onboarding to see schools near your installation.</div>}
          {filteredSchools.length > 0 && (
            <div style={{ fontSize: 10, color: '#6D4C00', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '8px 10px', lineHeight: 1.5, marginBottom: 10 }}>
              ⚠️ Star ratings are <strong>editorial planning estimates</strong>, not sourced from GreatSchools, Niche, or U.S. News. Verify each school on <a href="https://nces.ed.gov/ccd/schoolsearch/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66' }}>NCES SchoolSearch</a> or the school's website before making decisions.
            </div>
          )}
          {filteredSchools.map((school, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', flex: 1, marginRight: 8 }}>{school.name}</div>
                <span style={{ background: `${theme.primary}20`, color: theme.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>Grades {school.grades}</span>
              </div>
              <div style={{ marginBottom: 6 }}><StarRating rating={school.rating} /></div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{school.desc}</div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 10 }}>📍 {school.city}</div>
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
          {daycares.length > 0 && (
            <div style={{ fontSize: 10, color: '#6D4C00', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '8px 10px', lineHeight: 1.5, marginBottom: 10 }}>
              ⚠️ Provider ratings and waitlist times are <strong>editorial planning estimates</strong>, not a live feed. Confirm current availability, ratings, and waitlists on <a href="https://militarychildcare.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D3B66' }}>MilitaryChildCare.com</a> or by contacting each provider before making decisions.
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
                <input aria-label="Student age" type="number" min="4" max="18" value={searchAge} onChange={e => setSearchAge(e.target.value)} placeholder="e.g. 9" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.primary, display: 'block', marginBottom: 5 }}>ZIP CODE</label>
                <input aria-label="ZIP code" type="text" value={searchZip} onChange={e => setSearchZip(e.target.value)} placeholder="e.g. 28310" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }} />
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

// VeteranBusinessesTab moved to src/components/VeteranBusinessesTab.jsx (lazy). — Tier 1b PR-C


// EducationBenefitsTab + its college/OCONUS data tables were moved to
// src/components/EducationBenefitsTab.jsx and are now lazy()-loaded (see the
// lazy import near the top of this file). — perf Tier 1b PR-B

// ResourcesTab moved to src/components/ResourcesTab.jsx (lazy). — Tier 1b PR-C

// ─── Phase timeline windows (days relative to departure) ──────────────────
const PHASE_WINDOWS = {
  'Orders Received': { activeAt: 999, overdueAt: 90 },
  '90 Days Out':     { activeAt: 90,  overdueAt: 60 },
  '60 Days Out':     { activeAt: 60,  overdueAt: 30 },
  '30 Days Out':     { activeAt: 30,  overdueAt: 7  },
  'Move Week':       { activeAt: 7,   overdueAt: 0  },
  'In-Processing':   { activeAt: 0,   overdueAt: -30 },
};

// Parse a YYYY-MM-DD date string as LOCAL midnight, not UTC. `new Date(
// "2026-08-15")` is parsed as UTC midnight — which is the prior evening in
// every US timezone — so differencing it against a local-midnight "today"
// drifts day counts by one near the boundary. Appending a local time
// component fixes that. Returns null on invalid/empty input.
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr);
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function getDaysUntilDeparture(dateStr) {
  const target = parseLocalDate(dateStr);
  if (!target) return null;
  // Anchor both ends to local midnight so the count is stable across the
  // whole calendar day (previously it flipped from 0 to -1 at noon on the
  // report date because it differenced a noon anchor against the live clock).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// ─── Onboarding constants ──────────────────────────────────────────────────

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
  // NOTE: Eight Google-Translate-only African locales (sw, ha, yo, am, zu,
  // ig, so, af) were removed from the picker. They had no in-app curated
  // dictionary and relied entirely on the Google Translate widget, which is
  // CSP-blocked on the Vercel web build and in the Capacitor native shells —
  // so they rendered the app fully in English ("selectable but dead"). They
  // were dropped rather than offer a language that cannot actually translate
  // on the surfaces most users run. Re-add only alongside curated dictionary
  // coverage or a CSP path that lets the widget load on those surfaces.
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
      transition: 'Transition',
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
      transition: 'For service members and DoD civilians leaving service: a tailored T-minus separation/retirement timeline (TAP, VA disability/BDD, DD-214, TRICARE/FEHB, SGLI→VGLI, final-pay) with priority badges and official .gov/.mil links — forked by your branch, component, separation type, and benefits track.',
      'family-readiness': 'Family-side mission readiness: deployment, EFMP, spouse employment, family activities, permanent residency, pets, K-12 schools — plus Education benefits, Translation, and Faith & Chaplains.',
      'base-intelligence': 'Reviews from real military families on housing, schools, and childcare at your gaining installation. Reviews from .mil emails get a "Military Family Verified" badge.',
      checklist: 'A full PCS task list, organized by phase (Orders Received through In-Processing). Toggle reminders on key milestones. Nothing here asks for documents — just check items off as you finish them.',
      compliance: 'In plain language, how PCS Express keeps your information safe. Your PCS profile and notes never leave your phone — they\'re scrambled with strong encryption and saved only on this device. There\'s no PCS Express server holding your data, no account to hack, nothing to leak.',
      documents: 'A checklist for every PCS form you need to gather. Check items off as you collect the actual paperwork yourself. Export the checklist as a printable PDF for the gaining S1 / HR / VA. PCS Express never accepts, stores, or transmits uploads.',
      education: 'Tuition Assistance portals, GI Bill chapters, MyCAA spouse scholarships, and a curated list of colleges near the gaining installation.',
      family: 'Family-specific PCS planning: deployment support, EFMP, spouse employment, permanent residency for immigrant spouses, pets, and K-12 schools — all in one tab.',
      'home-relocation': 'Tools in one tab — Home Locator, BAH / OHA / LQA calculators, PPM estimator, Move Strategy (weight + overweight-cost + HHG-vs-PPM compare), inflation-adjusted Budget, Shipment Tracker, Inventory worksheet, JTR Assistant, Move Aid, and VA Loan.',
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
  pendingActions: 'Acciones pendientes',
  overdueAction: 'Acción vencida',
  dueNow: 'Vencida ahora',
  tasksRemaining: 'tareas restantes',
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
  pendingActions: 'Ausstehende Aktionen',
  overdueAction: 'Überfällige Aktion',
  dueNow: 'Jetzt fällig',
  tasksRemaining: 'Aufgaben verbleibend',
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
  pendingActions: 'Actions en attente',
  overdueAction: 'Action en retard',
  dueNow: 'À échéance maintenant',
  tasksRemaining: 'tâches restantes',
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
  pendingActions: '대기 중인 작업',
  overdueAction: '기한 초과',
  dueNow: '지금 처리',
  tasksRemaining: '남은 작업',
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
  pendingActions: '保留中のアクション',
  overdueAction: '期限切れのアクション',
  dueNow: '今すぐ実行',
  tasksRemaining: '残りのタスク',
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
  pendingActions: 'Mga nakabinbing aksyon',
  overdueAction: 'Lampas-takdang aksyon',
  dueNow: 'Dapat na ngayon',
  tasksRemaining: 'natitirang gawain',
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
  pendingActions: 'الإجراءات المعلقة',
  overdueAction: 'إجراء متأخر',
  dueNow: 'مستحق الآن',
  tasksRemaining: 'مهام متبقية',
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
  pendingActions: '待处理操作',
  overdueAction: '逾期操作',
  dueNow: '现在到期',
  tasksRemaining: '剩余任务',
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
  pendingActions: 'Azioni in sospeso',
  overdueAction: 'Azione in ritardo',
  dueNow: 'Da fare ora',
  tasksRemaining: 'attività rimanenti',
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
  pendingActions: 'Ações pendentes',
  overdueAction: 'Ação atrasada',
  dueNow: 'Vence agora',
  tasksRemaining: 'tarefas restantes',
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
  pendingActions: 'Hành động đang chờ',
  overdueAction: 'Hành động quá hạn',
  dueNow: 'Đến hạn ngay',
  tasksRemaining: 'nhiệm vụ còn lại',
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

// Accept any code from SUPPORTED_LANGUAGES (not just APP_TRANSLATIONS
// keys). The 8 Google-Translate-only locales (sw/ha/yo/am/zu/ig/so/af)
// have no entry in APP_TRANSLATIONS — they're served by the runtime
// translation layer + Google Translate widget — so they must still
// pass through this normalizer to reach the language/dir setters and
// the runtime mount gate. Also fold regional variants (pt-BR, zh-Hans,
// en-US, es-419) back to their base language so a browser-derived
// preferred-language doesn't silently degrade to English.
const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map(l => l.code));

function getAppLanguage(language) {
  const raw = String(language || 'en').toLowerCase().trim();
  if (!raw) return 'en';
  if (SUPPORTED_LANGUAGE_CODES.has(raw)) return raw;
  // Try base language: 'pt-br' -> 'pt', 'zh-hans' -> 'zh'.
  const base = raw.split(/[-_]/)[0];
  if (SUPPORTED_LANGUAGE_CODES.has(base)) return base;
  return 'en';
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
  zh: '整个应用程序以您选择的语言显示。详细说明可能显示为通用表述，采取行动前请查阅英文原文或官方来源。',
  it: 'L\'intera app è in italiano. Le istruzioni dettagliate possono essere generalizzate — consulta l\'originale inglese o la fonte ufficiale prima di agire.',
  pt: 'O aplicativo inteiro está em português. As instruções detalhadas podem aparecer generalizadas — consulte o inglês original ou a fonte oficial antes de agir.',
  vi: 'Toàn bộ ứng dụng hiển thị bằng ngôn ngữ bạn chọn. Hướng dẫn chi tiết có thể được hiển thị tổng quát — xem bản gốc tiếng Anh hoặc nguồn chính thức trước khi thực hiện.',
};


const KEYED_LANGUAGE_TOPICS = {
  // Bottom-nav tab labels for the current tab ids. Added after the per-locale
  // `nav` objects were first written — without these, `home` rendered as
  // "Home" (not "Command Center") and pcs-operations / mission-resources /
  // transition rendered in English for every non-English user. trFrom checks
  // KEYED_LANGUAGE_TOPICS first for nav.* keys, so these take precedence.
  home: { es: 'Centro de Mando', de: 'Kommandozentrale', fr: 'Centre de Commandement', ko: '지휘 센터', ja: 'コマンドセンター', tl: 'Command Center', ar: 'مركز القيادة', zh: '指挥中心', it: 'Centro di Comando', pt: 'Centro de Comando', vi: 'Trung tâm Chỉ huy' },
  'pcs-operations': { es: 'Operaciones PCS', de: 'PCS-Operationen', fr: 'Opérations PCS', ko: 'PCS 작전', ja: 'PCS業務', tl: 'Mga Operasyon ng PCS', ar: 'عمليات PCS', zh: 'PCS 行动', it: 'Operazioni PCS', pt: 'Operações PCS', vi: 'Hoạt động PCS' },
  'mission-resources': { es: 'Recursos de Misión', de: 'Einsatzressourcen', fr: 'Ressources de Mission', ko: '임무 자원', ja: '任務リソース', tl: 'Mga Mapagkukunan ng Misyon', ar: 'موارد المهمة', zh: '任务资源', it: 'Risorse di Missione', pt: 'Recursos da Missão', vi: 'Tài nguyên Nhiệm vụ' },
  transition: { es: 'Transición', de: 'Übergang', fr: 'Transition', ko: '전환', ja: '移行', tl: 'Transisyon', ar: 'الانتقال', zh: '过渡', it: 'Transizione', pt: 'Transição', vi: 'Chuyển tiếp' },
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
    const sel = HEAVY.MILITARY_DUTY_STATIONS.find(s => s.name === name);
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
        HEAVY.MILITARY_DUTY_STATIONS.filter(b => b.name.toLowerCase().includes(losingSearch.toLowerCase())),
        p.branch
      ).slice(0, 10)
    : [];
  const gainingSuggestions = gainingSearch.length > 1
    ? sortByBranch(
        HEAVY.MILITARY_DUTY_STATIONS.filter(b => b.name.toLowerCase().includes(gainingSearch.toLowerCase())),
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
        <button type="button" key={b.name} onClick={() => onSelect(b.name)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: 'none', borderRight: 'none', borderTop: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          {b.name} — {b.state} <span style={{ fontSize: 11, color: theme.accent }}>({b.branch})</span>
        </button>
      ))}
    </div>
  );

  return (
    <div lang={onboardingLanguage} dir={onboardingLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100dvh', background: theme.secondary, display: 'flex', flexDirection: 'column', fontFamily: APP_FONT }}>
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

              {/* Branch buttons. DoD Civilian is keyed in BRANCH_THEMES
                  for theming legacy profiles, but it's a component, not
                  a service — exclude from branch chips so users pick a
                  real service here and DoD Civilian via the Component
                  dropdown below. */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {Object.keys(BRANCH_THEMES).filter(b => b !== 'DoD Civilian').map(b => {
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
                  <label htmlFor="profile-firstName" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('firstName')}</label>
                  <input id="profile-firstName" name="firstName" autoComplete="given-name" value={p.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Jordan" style={inputSt} />
                </div>
                <div>
                  <label htmlFor="profile-lastName" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('lastName')}</label>
                  <input id="profile-lastName" name="lastName" autoComplete="family-name" value={p.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Rivera" style={inputSt} />
                </div>
              </div>

              {/* Component — filtered by branch. National Guard only
                  appears for Army/Air Force; Reserve only for branches
                  with a reserve component; DoD Civilian for all. AGR
                  is not a top-level option — pick Reserve or National
                  Guard, then select AGR as your orders type below. */}
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="profile-component" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('component')}</label>
                <select id="profile-component" name="component" aria-required="true" value={p.component} onChange={e => {
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
                <div style={{ marginBottom: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.72)', fontStyle: 'italic' }}>
                  Pay Grade &amp; Rank — N/A ({p.component})
                </div>
              ) : p.component === 'DoD Civilian' ? (
                <div style={{ marginBottom: 12 }}>
                  <label htmlFor="profile-paygrade" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    CIVILIAN GRADE <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>(optional)</span>
                  </label>
                  <select id="profile-paygrade" name="paygrade" value={p.paygrade} onChange={e => upd('paygrade', e.target.value)} style={inputSt}>
                    <option value="N/A">N/A — Not Applicable</option>
                    {CIVILIAN_GRADES.map(g => (
                      <option key={g.grade} value={g.grade}>{g.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <label htmlFor="profile-paygrade" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    {ot('payGradeRank')} <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>(optional)</span>
                  </label>
                  <select id="profile-paygrade" name="paygrade" value={p.paygrade} onChange={e => upd('paygrade', e.target.value)} style={inputSt}>
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
                  <label htmlFor="profile-ordersType" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    ORDERS TYPE
                  </label>
                  <select id="profile-ordersType" name="ordersType" aria-required="true" value={p.ordersType || ''} onChange={e => upd('ordersType', e.target.value)} style={inputSt}>
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
                <label htmlFor="profile-language" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('preferredLanguage')}</label>
                <select id="profile-language" name="language" autoComplete="language" aria-required="true" aria-describedby="profile-language-help" value={p.language} onChange={e => upd('language', e.target.value)} style={inputSt}>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
                </select>
                <div id="profile-language-help" style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{ot('languageHelp')}</div>
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
                  aria-label={ot('departingFrom')}
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
                  aria-label={ot('reportingToLabel')}
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
                <label htmlFor="profile-reportNLTDate" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('reportNLTDate')}</label>
                <input id="profile-reportNLTDate" name="reportNLTDate" type="date" aria-describedby="profile-reportNLTDate-help" aria-required="true" value={p.reportNLTDate || p.departingDate} onChange={e => { upd('reportNLTDate', e.target.value); upd('departingDate', e.target.value); }} style={{ ...inputSt, colorScheme: 'dark' }} />
                <div id="profile-reportNLTDate-help" style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{ot('reportNLTHelp')}</div>
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
              <button type="button" onClick={() => upd('hasDependents', !p.hasDependents)} aria-pressed={p.hasDependents} className={`pcs-chip ${p.hasDependents ? 'is-active' : ''}`} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p.hasDependents ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p.hasDependents ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p.hasDependents ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p.hasDependents ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.hasDependents && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ot('spouseDepsTravel')}</span>
              </button>

              {/* Children ages */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{ot('childrensAges')}</label>
                  <button onClick={() => upd('childAges', [...p.childAges, ''])} style={{ padding: '5px 12px', borderRadius: 8, background: theme.accent, color: theme.secondary, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{ot('addChild')}</button>
                </div>
                {p.childAges.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '6px 0' }}>{ot('noChildrenYet')}</div>}
                {p.childAges.map((age, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 60 }}>{ot('childN')} {idx + 1}</div>
                    <input type="number" min="0" max="25" value={age} onChange={e => { const a = [...p.childAges]; a[idx] = e.target.value; upd('childAges', a); }} placeholder={ot('agePlaceholder')} aria-label={`${ot('childN')} ${idx + 1} ${ot('yrs')}`} style={{ ...inputSt, width: 80, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{ot('yrs')}</span>
                    <button onClick={() => upd('childAges', p.childAges.filter((_, i) => i !== idx))} aria-label={`Remove child ${idx + 1}`} style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 7, background: 'rgba(255,80,80,0.2)', border: '1px solid rgba(255,80,80,0.35)', color: '#FF8080', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}><span aria-hidden="true">✕</span></button>
                  </div>
                ))}
              </div>

              {/* Pets toggle (per redesign brief) */}
              <button type="button" onClick={() => upd('hasPets', !p.hasPets)} aria-pressed={p.hasPets} className={`pcs-chip ${p.hasPets ? 'is-active' : ''}`} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: p.hasPets ? `${theme.accent}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${p.hasPets ? `${theme.accent}66` : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${p.hasPets ? theme.accent : 'rgba(255,255,255,0.25)'}`, background: p.hasPets ? theme.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.hasPets && <span style={{ color: theme.secondary, fontSize: 13, fontWeight: 900 }}>✓</span>}
                </span>
                <span style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ot('hasPetsLabel')}</span>
                  <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{ot('hasPetsHelp')}</span>
                </span>
              </button>

              {/* Move type segmented control (HHG vs PPM/DITY) */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>{ot('moveType')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['HHG', 'PPM'].map(opt => (
                    <button key={opt} onClick={() => upd('moveType', opt)} className={`pcs-chip ${p.moveType === opt ? 'is-active' : ''}`} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: `1.5px solid ${p.moveType === opt ? theme.accent : 'rgba(255,255,255,0.18)'}`, background: p.moveType === opt ? `${theme.accent}25` : 'rgba(255,255,255,0.04)', color: p.moveType === opt ? '#FFF' : 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: p.moveType === opt ? 800 : 600, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{ot(opt === 'HHG' ? 'moveTypeHHG' : 'moveTypePPM')}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 1.4 }}>{ot(opt === 'HHG' ? 'moveTypeHHGHelp' : 'moveTypePPMHelp')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Religious preference */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="profile-religiousPreference" style={{ fontSize: 11, fontWeight: 700, color: theme.accent, display: 'block', marginBottom: 6 }}>
                  {ot('religiousPreference')} <span style={{ fontWeight: 400, opacity: 0.55, fontSize: 10 }}>{ot('religiousPreferenceNote')}</span>
                </label>
                <select id="profile-religiousPreference" name="religiousPreference" aria-describedby="profile-religiousPreference-help" value={p.religiousPreference} onChange={e => upd('religiousPreference', e.target.value)} style={inputSt}>
                  {RELIGIOUS_PREFERENCES.map(r => <option key={r} value={r}>{RELIGIOUS_PREF_LABELS[r]?.[onboardingLanguage] || r}</option>)}
                </select>
                <div id="profile-religiousPreference-help" style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{ot('religiousPreferenceHelp')}</div>
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

function CategoryTabShell({ theme, tabs, activeTab, onChange, children, variant = 'box' }) {
  // 'bubble' = rounded pill tabs matching the style used elsewhere in the
  // app (questionnaire / phase / outreach strips); 'box' = the compact
  // uppercase default used by the other mission groups.
  const bubble = variant === 'bubble';
  const tabStyle = (isActive) => bubble
    ? {
        padding: '8px 15px',
        borderRadius: 999,
        border: `1.5px solid ${isActive ? theme.primary : '#D4DCE8'}`,
        background: isActive ? theme.primary : '#FFFFFF',
        color: isActive ? '#FFFFFF' : '#43526B',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '.01em',
      }
    : {
        padding: '8px 11px',
        borderRadius: 8,
        border: `1.5px solid ${isActive ? theme.primary : '#E0E6EE'}`,
        background: isActive ? theme.primary : '#FFFFFF',
        color: isActive ? '#FFFFFF' : '#56697C',
        fontSize: 10,
        fontWeight: 800,
        cursor: 'pointer',
        letterSpacing: '.04em',
        textTransform: 'uppercase',
      };
  return (
    <div style={{ padding: 16 }}>
      <TabBar ariaLabel="Category sections" className="pcs-tabbar--flush">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`cat-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`cat-panel-${tab.id}`}
              data-active={isActive || undefined}
              onClick={() => onChange(tab.id)}
              className={`pcs-tab ${isActive ? 'is-active' : ''}`}
              style={tabStyle(isActive)}
            >
              {tab.label}
            </button>
          );
        })}
      </TabBar>
      <div role="tabpanel" id={`cat-panel-${activeTab}`} aria-labelledby={`cat-tab-${activeTab}`}>
        {children}
      </div>
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
      {tab === 'schools' && <SchoolsTabMemo theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

// ───────────────────────────────────────────────────────────────────
// Top-level GROUP wrappers per the redesigned mission architecture.
// Each wrapper hosts the sub-modules that used to live as separate
// bottom-nav tabs, so the bottom bar collapses from 14 → 6 entries
// (Home + 5 mission groups) without losing any feature.
// ───────────────────────────────────────────────────────────────────

// Module-level one-shot for deep-link sub-tabs. The deep-link parser
// reads `?go=pcs-operations/timeline` and stores 'timeline' here so
// the next mount of the corresponding wrapper picks it up as the
// initial sub-tab. Consumed exactly once and cleared. Implemented as
// a plain object property so the minifier can't accidentally place
// a `let` binding inside a TDZ-sensitive scope.
const _SUBTAB_STORE = { pending: null };
function consumePendingSubTab(defaultId, allowed) {
  const v = _SUBTAB_STORE.pending;
  if (v && allowed.includes(v)) {
    _SUBTAB_STORE.pending = null;
    return v;
  }
  return defaultId;
}

function PCSOperationsTab({ theme, profile, checklistItems, setChecklistItems }) {
  const tabs = [
    { id: 'checklist', label: 'Checklist' },
    { id: 'documents', label: 'Paperwork' },
    { id: 'timeline',  label: 'Timeline'  },
  ];
  const [tab, setTab] = useState(() => consumePendingSubTab('checklist', tabs.map(t => t.id)));
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'checklist' && <ChecklistTabMemo theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />}
      {tab === 'documents' && <PCSDocumentsModule theme={theme} profile={profile} />}
      {tab === 'timeline'  && <DynamicTimeline theme={theme} profile={profile} />}
    </CategoryTabShell>
  );
}

// Transition & Separation group — mirrors PCS Operations' sub-tab shell
// (Checklist + a separate Documentation roster + the Career Center reused
// verbatim from Family Readiness + an Outreach resource directory).
function TransitionTab({ theme, profile }) {
  const tabs = [
    { id: 'checklist',     label: 'Checklist' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'career',        label: 'Career Center' },
    { id: 'community',     label: 'Community' },
    { id: 'outreach',      label: 'Outreach' },
  ];
  const [tab, setTab] = useState(() => consumePendingSubTab('checklist', tabs.map(t => t.id)));
  return (
    <TransitionLocationProvider seed={String(profile?.gainingInstallation || '')}>
      <div style={{ padding: '16px 16px 0' }}>
        <TransitionLocationBar theme={theme} />
      </div>
      <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab} variant="bubble">
        {tab === 'checklist'     && <TransitionChecklistModule theme={theme} profile={profile} />}
        {tab === 'documentation' && <TransitionDocumentsModule theme={theme} profile={profile} />}
        {tab === 'career'        && <EmploymentModule theme={theme} profile={profile} audience="veteran" />}
        {tab === 'community'     && <TransitionCommunityModule theme={theme} profile={profile} />}
        {tab === 'outreach'      && <TransitionOutreachModule theme={theme} profile={profile} />}
      </CategoryTabShell>
    </TransitionLocationProvider>
  );
}

function FamilyReadinessGroupTab({ theme, profile }) {
  const tabs = [
    { id: 'family',      label: 'Family' },
    { id: 'education',   label: 'Education' },
    { id: 'translation', label: 'Translation' },
    { id: 'faith',       label: 'Faith & Chaplains' },
  ];
  const [tab, setTab] = useState(() => consumePendingSubTab('family', tabs.map(t => t.id)));
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
  const [tab, setTab] = useState(() => consumePendingSubTab('base-insights', tabs.map(t => t.id)));
  return (
    <CategoryTabShell theme={theme} tabs={tabs} activeTab={tab} onChange={setTab}>
      {tab === 'base-insights' && <BaseIntelligenceUnifiedTab theme={theme} profile={profile} />}
      {tab === 'maps'          && <NavigationModule theme={theme} profile={profile} />}
      {tab === 'help-hub'      && <ResourcesTab theme={theme} profile={profile} />}
      {tab === 'veteran'       && <VeteranBusinessesTabMemo theme={theme} profile={profile} />}
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
    fetchWithTimeout(apiUrl(`/api/family-activities?${params.toString()}`), { headers: { Accept: 'application/json' } })
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
    // profile.language is read inside the URL builder but the effect
    // intentionally does not re-run on language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            aria-label="Override search center — street, city, state, or ZIP"
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
          <TabBar ariaLabel="Family activity filters" className="pcs-tabbar--flush">
            <button
              id="famact-tab-all"
              role="tab"
              aria-selected={filter === 'all'}
              aria-controls="famact-panel"
              data-active={filter === 'all' || undefined}
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
              const isActive = filter === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`famact-tab-${cat.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="famact-panel"
                  data-active={isActive || undefined}
                  onClick={() => setFilter(cat.id)}
                  className={`pcs-chip ${isActive ? 'is-active' : ''}`}
                  style={{
                    padding: '6px 12px', borderRadius: 18,
                    border: `1.5px solid ${isActive ? colors.primary : '#D6E0EA'}`,
                    background: isActive ? colors.primary : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#243447',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {cat.emoji} {cat.label} ({count})
                </button>
              );
            })}
          </TabBar>

          <div id="famact-panel" role="tabpanel" aria-labelledby={`famact-tab-${filter}`} data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
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
    { name: 'DoD Overseas Housing Allowance (OHA) Rates',      url: 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/',                          note: 'Official DTMO OHA rate lookup for the gaining overseas locality. Includes utility and MIHA components.' },
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

// US-territory state codes — all OCONUS (OHA, not BAH): Guam, Puerto Rico,
// US Virgin Islands, American Samoa, Northern Mariana Islands.
const OCONUS_TERRITORY_STATES = new Set(['GU', 'PR', 'VI', 'AS', 'MP']);

function isOCONUSInstallation(name) {
  if (!name) return false;
  const base = String(name).split(',')[0].trim();
  const lower = base.toLowerCase();
  // Authoritative path: match the installation in the duty-station data and
  // treat it as OCONUS when it carries a `country` (overseas) or a US-
  // territory `state`. This is the SAME source of truth that drives
  // profile.isOverseas, so the housing calculator / VA-loan panel no longer
  // disagree with the checklist for overseas bases the keyword list misses
  // (e.g. RAF Lakenheath, Chievres, Panama). Falls through to the keyword
  // match for free-text / partial names and while the lazy table loads.
  const stations = HEAVY.MILITARY_DUTY_STATIONS || [];
  const entry = stations.find(s => s.name === base || s.name === name);
  if (entry && (entry.country || OCONUS_TERRITORY_STATES.has(entry.state))) return true;
  return ['korea','germany','japan','italy','guam','okinawa','cuba','bahrain','kuwait','qatar','djibouti',
    'humphreys','daegu','yongsan','ramstein','kaiserslautern','spangdahlem','wiesbaden','grafenwoehr',
    'vilseck','baumholder','ansbach','stuttgart','torii','kadena','misawa','camp zama','yokosuka',
    'sasebo','naples','vicenza','aviano','sigonella','rota','moron','incirlik','lemonnier','osan',
    'yokota','atsugi','iwakuni','futenma','foster','butler','courtney','hansen','schwab','andersen',
    // US territories are OCONUS (OHA, not BAH): Puerto Rico installations.
    'puerto rico','buchanan','borinquen','san juan',
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
    { id: 'move-strategy', label: 'Move Strategy' },
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
  const [tab, setTab] = useState(() => consumePendingSubTab('home-locator', tabs.map(t => t.id)));
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
      {tab === 'move-strategy' && <MoveStrategyModule theme={theme} profile={profile} />}
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
function DodCivilianHousingPanel({ theme, profile: _profile, oconus }) {
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
              url="https://allowances.state.gov/Default.asp"
              desc="Authoritative Department of State allowance rates and eligibility tables for U.S. government civilians stationed overseas." />
            <ResourceCard theme={theme}
              label="LQA Worksheet & Eligibility Guide (DoD Civilian)"
              url="https://www.google.com/search?q=DCPAS+relocation+site%3Adcpas.osd.mil/lqa"
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
              url="https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation"
              desc="GSA Chapter 302 details civilian PCS allowances: HHG, TQSE, real-estate, miscellaneous, and house-hunting trip." />
            <ResourceCard theme={theme}
              label="DoD Civilian Relocation Assistance"
              url="https://www.google.com/search?q=DCPAS+relocation+site%3Adcpas.osd.mil"
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
        <strong>Source disclaimer:</strong> Base, resource, housing, and benefit information shown in PCS Express points to official public U.S. government, military, and other public-source references where available. PCS Express is not itself an official source — always verify details with the originating source before acting.
      </div>
      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 14, color: '#6D4C00', fontSize: 11, lineHeight: 1.6 }}>
        <strong>Independent application notice:</strong> {INDEPENDENCE_DISCLAIMER}
      </div>
    </div>
  );
}

// Memoized aliases for the three heaviest directly-dispatched tabs. They
// receive only referentially-stable props (theme is a constant BRANCH_THEMES
// lookup; profile/checklistItems are state; setChecklistItems is a stable
// setter), so memo lets them skip re-renders when App re-renders for
// unrelated reasons (notifications, the AI assistant, nav toggles, fetch
// results). SchoolsTab + ChecklistTab read lazy HEAVY data and call
// useHeavyData() internally, so memo can't strand them on the empty
// pre-load snapshot. VeteranBusinessesTab reads no HEAVY data.
const SchoolsTabMemo = memo(SchoolsTab);
const ChecklistTabMemo = memo(ChecklistTab);
const VeteranBusinessesTabMemo = memo(VeteranBusinessesTab);

function App() {

  // APP_WIDE_LINK_SECURITY_AUDIT: prevents blank, relative, same-app, stale, or
  // unsafe-protocol link bubbles from navigating users into another PCS Express
  // state or opening a reverse-tabnabbing / javascript: vector.
  useEffect(() => {
    // Approve any well-formed CROSS-ORIGIN http(s) link. Every anchor in PCS
    // Express is either hard-coded by us to a vetted resource or built from a
    // trusted public API (USAJOBS, SAM.gov, OpenStreetMap, job boards, DoD
    // SkillBridge partners) with encoded query params — there is NO untrusted
    // anchor source in the app (no dangerouslySetInnerHTML anywhere; AI / JTR
    // answers render plain text + hard-coded links only, never links parsed
    // from model output). So a host all-list added no real protection while it
    // silently hid legitimate curated resource cards (LinkedIn, RecruitMilitary,
    // Hire Heroes, ACP, IVMF, SkillBridge partner programs, …) across many tabs.
    // The genuine threats remain fully blocked below: same-origin/relative/blank
    // hrefs (self-navigation loop-back) and non-http(s) protocols (javascript:,
    // data:), and every allowed link is hardened with target=_blank +
    // rel="noopener noreferrer".
    const isApprovedExternalLink = (href) => {
      if (!href || href === '#') return false;
      try {
        const parsed = new URL(href, window.location.origin);
        if (parsed.origin === window.location.origin) return false;
        return /^https?:$/.test(parsed.protocol);
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

  // Landing-page gate. Default: show landing once for a brand-new
  // visitor; subsequent visits skip straight to the onboarding /
  // dashboard route. Stakeholder demos override with ?landing=1.
  const [landingDismissed, setLandingDismissed] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('landing') === '1') return false;
    } catch {}
    try {
      return localStorage.getItem('pcs_landing_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState(() => {
    // Deep-link entry. Supports two forms:
    //   /?go=movement-logistics            → top-level mission group
    //   /?go=home-relocation/shipment-tracker  → mission group + sub-tab
    //
    // The sub-tab half (if present) is stashed in _PENDING_SUBTAB so
    // the corresponding wrapper component picks it up via
    // consumePendingSubTab() on its very next mount. The param is
    // stripped from the URL after activation.
    try {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('go');
      if (target) {
        const [top, sub] = String(target).split('/');
        const allowed = new Set([
          'home', 'pcs-operations', 'home-relocation', 'family-readiness',
          'medical-readiness', 'mission-resources', 'transition',
          // Legacy deep-link IDs kept for support-link compatibility.
          'checklist', 'documents', 'family', 'education', 'translation',
          'religion', 'base-intelligence', 'nav', 'resources', 'veterans',
          'jtr-assistant',
        ]);
        if (allowed.has(top)) {
          if (sub) _SUBTAB_STORE.pending = sub;
          window.history.replaceState({}, '', window.location.pathname);
          return top;
        }
      }
    } catch {}
    return 'home';
  });
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  // Web-push opt-in state for the toggle in the notifications panel.
  // null = not yet detected; 'unsupported' = no SW/PushManager or VAPID
  // not configured server-side; true/false = subscribed or not.
  const [pushState, setPushState] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  // Focus-trap refs for the inline modal dialogs rendered in this
  // component. Each ref is attached to the modal's outermost <div>
  // and paired with useFocusTrap so keyboard focus stays inside while
  // the dialog is open (and restores to the trigger on close). The
  // ResetWarningModal manages its own trap inside its component body.
  // The slide-down nav drawer is only mounted on web mobile (not
  // desktop, not iOS native shell); the ref simply stays null on
  // platforms where the drawer isn't rendered, and useFocusTrap is
  // a no-op when containerRef.current is null.
  const navDrawerRef = useRef(null);
  const notifsRef = useRef(null);
  const complianceRef = useRef(null);
  useFocusTrap(navDrawerRef, navOpen);
  useFocusTrap(notifsRef, showNotifs);
  useFocusTrap(complianceRef, showCompliance);

  // Detect current web-push opt-in state when the notifications panel
  // opens. Marks 'unsupported' when the browser lacks SW/PushManager OR
  // the server hasn't configured a VAPID key (push-config → null), so
  // the toggle only offers to enable push when it can actually work.
  useEffect(() => {
    if (!showNotifs) return;
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
          if (!cancelled) setPushState('unsupported');
          return;
        }
        let cfg = null;
        try { const r = await fetch(apiUrl('/api/push-config')); cfg = r.ok ? await r.json() : null; } catch {}
        if (!cfg?.vapidPublicKey) { if (!cancelled) setPushState('unsupported'); return; }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg?.pushManager?.getSubscription?.();
        if (!cancelled) setPushState(!!sub);
      } catch { if (!cancelled) setPushState('unsupported'); }
    })();
    return () => { cancelled = true; };
  }, [showNotifs]);

  const handleTogglePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushState === true) {
        await disablePushNotifications();
        setPushState(false);
      } else {
        const res = await enablePushNotifications();
        setPushState(res?.ok === true);
      }
    } catch { /* leave state as-is; user can retry */ }
    finally { setPushBusy(false); }
  };

  const [checklistItems, setChecklistItems] = useState(() => {
    return readLegacyJson('pcs_checklist_checks', {});
  });

  // Allow any component to open the AI Assistant by dispatching
  // `open-ai-assistant` (optionally with detail.question). The modal
  // itself listens for the same event to pre-fill the input; this
  // listener handles the "show the modal" half so callers can fire
  // a single event and rely on it.
  useEffect(() => {
    const handler = () => setShowAIAssistant(true);
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  // `pcs-navigate` — runtime route change with optional sub-tab. Used
  // by the AI Assistant "Open {Group → Sub}" chip so the assistant
  // can deep-link the user without round-tripping through the URL.
  useEffect(() => {
    const handler = (e) => {
      const tab = e?.detail?.tab;
      const sub = e?.detail?.sub;
      if (typeof tab !== 'string' || !tab) return;
      if (sub && typeof sub === 'string') _SUBTAB_STORE.pending = sub;
      setActiveTab(tab);
    };
    window.addEventListener('pcs-navigate', handler);
    return () => window.removeEventListener('pcs-navigate', handler);
  }, []);

  // Global Escape key handler. Closes the topmost open overlay so
  // keyboard users have a predictable exit from every modal / drawer /
  // notification panel. Order matters: most-recently-opened first.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (showAIAssistant) { setShowAIAssistant(false); return; }
      if (showCompliance) { setShowCompliance(false); return; }
      if (showResetWarning) { setShowResetWarning(false); return; }
      if (showNotifs) { setShowNotifs(false); return; }
      if (navOpen) { setNavOpen(false); return; }
      if (moreOpen) { setMoreOpen(false); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAIAssistant, showCompliance, showResetWarning, showNotifs, navOpen, moreOpen]);

  // Overdue Mission Lanes notification. Fires once per session when
  // the app loads with one or more checklist tasks in the user's
  // current phase that have passed the PHASE_WINDOWS overdueAt
  // threshold. Respects Notification permission; silently skips if
  // the user hasn't granted access.
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    // De-dupe per browser session.
    try { if (sessionStorage.getItem('pcs_overdue_notified') === '1') return; } catch {}
    const target = profile?.reportNLTDate || profile?.departingDate;
    if (!target) return;
    const targetDate = parseLocalDate(target);
    if (!targetDate) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((targetDate - today) / 86400000);
    const currentPhase = resolveCurrentPhase(daysUntil);
    const tailored = getTailoredChecklist(profile?.branch || 'Army', {
      component: profile?.component || 'Active Duty',
      ordersType: profile?.ordersType || '',
      hasDependents: !!profile?.hasDependents,
      hasChildren: !!profile?.hasChildren,
      hasPets: !!profile?.hasPets,
      moveType: profile?.moveType || 'HHG',
      isOverseas: !!profile?.isOverseas,
    });
    const items = tailored[currentPhase] || [];
    const open = items.filter((_, i) => !(checklistItems || {})[`${currentPhase}-${i}`]);
    const win = PHASE_WINDOWS[currentPhase];
    const isOverdue = win && daysUntil < win.overdueAt;
    if (open.length === 0 || !isOverdue) return;
    try {
      const n = new Notification('PCS Express — overdue tasks', {
        body: `${open.length} task${open.length === 1 ? '' : 's'} in the "${currentPhase}" phase are past due. Open the Checklist to clear them.`,
        tag: 'pcs-overdue',
        silent: false,
      });
      n.onclick = () => { try { window.focus(); } catch {} setActiveTab('pcs-operations'); };
      try { sessionStorage.setItem('pcs_overdue_notified', '1'); } catch {}
    } catch {}
  }, [profile, checklistItems]);

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
  const [demoTip, setDemoTip] = useState(() => {
    const p = normalizeProfile(getSessionDemoProfile() || store.get('pcs_profile'));
    return (p?.demoMode || (p?.firstName === 'Marcus' && p?.lastName === 'Thompson')) ? 0 : -1;
  });
  const [screenW, setScreenW] = useState(() => typeof window !== 'undefined' ? Math.max(window.innerWidth, document.documentElement?.clientWidth || 0) : 1024);
  useEffect(() => {
    const handler = () => setScreenW(Math.max(window.innerWidth, document.documentElement?.clientWidth || 0));
    handler();
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
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
  // isNative is true only inside the Capacitor iOS/Android shell — never in a web browser
  const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
  // Desktop = pointer-fine (mouse/trackpad) device at >=768px, OR any web viewport >=900px.
  // The pointer-fine clause catches laptops at typical zoom levels; the 900px clause is the
  // legacy threshold kept for backward compatibility. We force mobile layout inside the
  // Capacitor shell since those builds ship to phones/tablets, never desktops.
  const hasFinePointer = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: fine)').matches;
  const isDesktop = !isNative && ((hasFinePointer && screenW >= 768) || screenW >= 900);

  // Kick off the dynamic load of the heavy data tables on first
  // mount and trigger a re-render once they're ready. Consumers
  // throughout this component read HEAVY.* with empty-array /
  // empty-object fallbacks so the initial render is non-throwing.
  useHeavyData();

  const safeProfile = profile && profile.branch ? profile : null;
  const theme = BRANCH_THEMES[safeProfile?.branch] || BRANCH_THEMES.Army;
  const homeInsignia = getHomeBranchInsignia(profile?.branch);
  const appLanguage = getAppLanguage(
    profile?.language ||
    ((() => { try { return localStorage.getItem('pcs_user_language'); } catch { return null; } })())
  );
  const appDir = appLanguage === 'ar' ? 'rtl' : 'ltr';
  const t = (key) => trFrom(appLanguage, key);
  useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appDir;
  }, [appLanguage, appDir]);

  // Compute pending alerts based on the report-NLT date (the canonical
  // countdown target, matching TMinusDashboard / MissionLanes / the AI
  // context) falling back to departingDate, and checklist completion.
  const countdownTarget = profile?.reportNLTDate || profile?.departingDate;
  const daysUntilDeparture = countdownTarget ? getDaysUntilDeparture(countdownTarget) : null;
  // Memoized: this builds the tailored checklist (getBranchChecklist +
  // filters over every phase), which previously ran up to ~12x on EVERY
  // render of this 48-state component (once per phase in .filter AND again
  // in .map). Now the checklist is built once and only when the inputs
  // change.
  const pendingAlerts = useMemo(() => {
    if (!profile?.departingDate || daysUntilDeparture === null) return [];
    const tailored = getTailoredChecklist(profile?.branch || 'Army', {
      component:     profile?.component || 'Active Duty',
      ordersType:    profile?.ordersType || '',
      hasDependents: !!profile?.hasDependents,
      hasChildren:   !!profile?.hasChildren,
      hasPets:       !!profile?.hasPets,
      moveType:      profile?.moveType || 'HHG',
      isOverseas:    !!profile?.isOverseas,
    });
    return Object.entries(PHASE_WINDOWS)
      .filter(([phase, win]) => {
        if (daysUntilDeparture > win.activeAt) return false;
        const tasks = tailored[phase] || [];
        return tasks.some((_, i) => !checklistItems[`${phase}-${i}`]);
      })
      .map(([phase, win]) => ({
        phase,
        overdue: daysUntilDeparture < win.overdueAt,
        daysUntil: daysUntilDeparture,
        count: (tailored[phase] || []).filter((_, i) => !checklistItems[`${phase}-${i}`]).length,
      }));
  }, [profile, daysUntilDeparture, checklistItems]);
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

  // Landing-page gate. Shown once to first-time visitors and on demand
  // via ?landing=1 (used when showing the platform to government /
  // partner contacts). Bypassed for any user with an existing profile.
  if (!profile?.branch && !landingDismissed) {
    return (
      <>
        {appLanguage !== 'en' && (
          <Suspense fallback={null}>
            <AppLanguageRuntimeMount lang={appLanguage} />
          </Suspense>
        )}
        <Suspense fallback={<LazyTabFallback />}>
          <LandingPage
            onStartPlan={() => {
              setLandingDismissed(true);
              try { localStorage.setItem('pcs_landing_dismissed', '1'); } catch {}
              // Strip the force-show param so a refresh returns to the
              // expected onboarding/dashboard route.
              try {
                const url = new URL(window.location.href);
                if (url.searchParams.has('landing')) {
                  url.searchParams.delete('landing');
                  window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
                }
              } catch {}
            }}
          />
        </Suspense>
      </>
    );
  }

  if (!profile?.branch) {
    return (
      <>
        {appLanguage !== 'en' && (
          <Suspense fallback={null}>
            <AppLanguageRuntimeMount lang={appLanguage} />
          </Suspense>
        )}
        <Onboarding onComplete={(p) => {
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
    }} />
      </>
    );
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
    { tab: 'transition',          title: 'Transition',                   body: 'Separating or retiring? Built for service members AND DoD civilians leaving service. Answer two questions (how you\'re leaving + career vs VA-disability track) and a T-minus timeline tailors itself to your branch and component: TAP, VA disability / BDD, DD-214, TRICARE / FEHB bridge, SGLI→VGLI, final pay — each step priority-tagged with official .gov / .mil links, checked off and saved on your device.' },
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
    { id: 'transition',          label: 'Transition',           icon: 'TRN', iosIcon: '🎖️', color: '#0F766E' },
  ];
  const LOCALIZED_BOTTOM_NAV = localizeNavItems(BOTTOM_NAV, appLanguage);
  const _HOME_CATEGORIES = LOCALIZED_BOTTOM_NAV.filter(item => item.id !== 'home');

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
    transition: t('desc.transition'),
    veterans: t('desc.veterans'),
  };

  const renderCategoryFrame = (tabId, children) => {
    const item = LOCALIZED_BOTTOM_NAV.find(n => n.id === tabId) || activeNavItem;
    // Branch insignia next to the tab mark — pulls from BRANCH_THEMES
    // so the chrome reads as the user's service (USA / USN / USMC /
    // USAF / USSF / USCG / DoD) on every tab, not just Command Center.
    const insignia = theme.insignia || theme.abbr || 'PCS';
    return (
      <section className="category-screen" style={{ '--category-color': item?.color || theme.primary, position: 'relative' }}>
        {/* Branch-themed animated backdrop for every category tab.
            Pattern + colors keyed to the user's onboarding selection
            (Army hex grid, Navy waves, Marines globe, etc.). Low
            opacity so it never competes with the content cards. */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.55 }}>
          <BranchBackdrop branch={profile?.branch} opacity={0.18} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="category-screen__header" style={{ borderColor: `${theme.accent}55` }}>
            {/* Tab mark + branch insignia stacked. Tab mark stays the
                category color (so users can tell tabs apart at a
                glance); the smaller insignia underneath reinforces
                "this is your service." */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div className="category-screen__mark" style={{ background: `${item?.color || theme.primary}14`, borderColor: `${item?.color || theme.primary}35`, color: item?.color || theme.primary, fontFamily: DISPLAY_FONT, letterSpacing: '.08em' }}>
                {item?.icon || theme.abbr}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: theme.primary, letterSpacing: '.10em',
                fontFamily: DISPLAY_FONT, opacity: 0.78,
              }}>
                {insignia}
              </div>
            </div>
            <div>
              <div className="category-screen__eyebrow" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '.20em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden="true" style={{
                  display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                  background: item?.color || theme.primary,
                  boxShadow: `0 0 6px ${item?.color || theme.primary}`,
                  animation: 'pcs-frame-pulse 2.6s ease-in-out infinite',
                }} />
                {t('categoryEyebrow')}
              </div>
              <h1 style={{ fontFamily: DISPLAY_FONT, letterSpacing: '-0.025em', fontWeight: 700, fontSize: 20 }}>{item?.label || currentLabel}</h1>
              <p>{CATEGORY_DESCRIPTIONS[tabId] || t('defaultCategoryDescription')}</p>
              {theme.motto && (
                <div style={{
                  marginTop: 8, paddingTop: 7,
                  borderTop: `1px dashed ${theme.accent}55`,
                  fontSize: 9, fontWeight: 700, color: theme.primary,
                  letterSpacing: '.22em', textTransform: 'uppercase',
                  fontFamily: DISPLAY_FONT, opacity: 0.85,
                }}>
                  {theme.motto}
                  {theme.tagline && <span style={{ opacity: 0.55, marginLeft: 8, fontWeight: 500, fontStyle: 'italic', letterSpacing: '.02em', textTransform: 'none' }}>{theme.tagline}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="category-screen__body">
            {children}
          </div>
        </div>
      </section>
    );
  };

  if (activeTab === 'translation') {
    return (
      <div lang={appLanguage} dir={appDir} style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: `${UI_PALETTE.pagePattern}, radial-gradient(circle at top left, ${theme.accent}22, transparent 50%), radial-gradient(circle at bottom right, ${theme.primary}22, transparent 50%), ${UI_PALETTE.page}`, fontFamily: APP_FONT, display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
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
            {!isDesktop && <button aria-label="Back to home" onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '2px 4px' }}><span aria-hidden="true">←</span></button>}
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
                <span className="pcs-bottom-tab__glyph" style={{ fontSize: 22, lineHeight: 1 }}>{item.iosIcon}</span>
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
            <button type="button" aria-label="Close more menu" onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 311, background: 'rgba(0,0,0,0.45)', border: 'none', padding: 0, cursor: 'pointer' }} />
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
                  <button type="button" key={i} onClick={() => { setDemoTip(i); goTo(DEMO_TIPS[i].tab); }} aria-label={`Go to step ${i + 1}`} aria-current={i === demoTip ? 'step' : undefined} style={{ width: i === demoTip ? 20 : 6, height: 6, borderRadius: 3, background: i <= demoTip ? theme.accent : 'rgba(255,255,255,0.2)', border: 'none', padding: 0, cursor: 'pointer', transition: 'all .2s' }} />
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
    <div lang={appLanguage} dir={appDir} style={{ maxWidth: isDesktop ? '100%' : 480, width: '100%', margin: '0 auto', minHeight: '100dvh', background: `${UI_PALETTE.pagePattern}, radial-gradient(circle at top left, ${theme.accent}22, transparent 50%), radial-gradient(circle at bottom right, ${theme.primary}22, transparent 50%), ${UI_PALETTE.page}`, fontFamily: APP_FONT, display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
      <a href="#pcs-main-content" className="pcs-skip-link">Skip to main content</a>
      <PlatformBanners />
      <CommandPalette />
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
          {/* Branch-tailored backdrop. Renders the abstract pattern
              for the user's branch (hex grid / orbital rings / wave
              forms / etc.) behind the sidebar header so the chrome
              feels distinctly theirs rather than a flat color block. */}
          <div style={{ position: 'relative' }}>
            <BranchBackdrop branch={profile?.branch} opacity={0.20} />
            <div style={{ position: 'relative', padding: '22px 16px 14px', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
              <div style={{
                fontSize: 9, letterSpacing: '.22em', color: theme.accent, fontWeight: 700,
                marginBottom: 4, fontFamily: DISPLAY_FONT,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span aria-hidden="true" style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: theme.accent,
                  boxShadow: `0 0 8px ${theme.accent}`,
                  animation: 'pcs-frame-pulse 2.6s ease-in-out infinite',
                }} />
                PCS EXPRESS
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: DISPLAY_FONT }}>{theme.insignia || theme.abbr}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: DISPLAY_FONT, letterSpacing: '-0.01em' }}>{getRankDisplay(profile.branch, profile.paygrade)} {profile.firstName}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, letterSpacing: '.06em' }}>{profile.branch}</div>
            </div>
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
      <main id="pcs-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* HEADER — paddingTop uses env(safe-area-inset-top) for notch/Dynamic Island.
          Requires viewport-fit=cover in the HTML meta and contentInsetAdjustmentBehavior=never
          in capacitor.config.json to receive non-zero values from the OS. */}
      <div style={{ background: theme.secondary, paddingTop: isNative ? 'env(safe-area-inset-top)' : 0, position: 'sticky', top: 0, zIndex: 100, borderBottom: `2px solid ${theme.accent}40`, overflow: 'hidden' }}>
        {/* Branch backdrop now sits behind the header on every screen
            size (was previously sidebar-only on desktop). Low opacity
            so it never competes with header controls. */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <BranchBackdrop branch={profile?.branch} opacity={0.14} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDesktop && <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent, letterSpacing: '-0.04em', fontFamily: DISPLAY_FONT }}>{theme.insignia || theme.abbr}</div>}
            <div>
              <div style={{
                fontSize: 10, letterSpacing: '.18em', color: theme.accent, fontWeight: 700,
                fontFamily: DISPLAY_FONT, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span aria-hidden="true" style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: theme.accent,
                  boxShadow: `0 0 8px ${theme.accent}`,
                  animation: 'pcs-frame-pulse 2.6s ease-in-out infinite',
                }} />
                PCS EXPRESS
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', fontFamily: DISPLAY_FONT, letterSpacing: '-0.015em' }}>{profile.firstName} · {isDesktop ? profile.branch : currentLabel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {alertCount > 0 && (
              <button
                onClick={() => { setShowNotifs(o => !o); setNavOpen(false); }}
                aria-label={overdueCount > 0 ? `Notifications, ${overdueCount} overdue` : `Notifications, ${alertCount} alert${alertCount === 1 ? '' : 's'}`}
                aria-expanded={showNotifs}
                aria-haspopup="dialog"
                style={{ position: 'relative', background: showNotifs ? `${theme.accent}30` : overdueCount > 0 ? 'rgba(229,57,53,0.2)' : 'none', border: `1px solid ${overdueCount > 0 ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.25)'}`, color: '#fff', fontSize: 15, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, lineHeight: 1 }}>
                <span aria-hidden="true">🔔</span>
                <span style={{ position: 'absolute', top: -5, right: -5, background: overdueCount > 0 ? '#E53935' : theme.accent, color: overdueCount > 0 ? '#FFF' : theme.secondary, fontSize: 9, fontWeight: 900, borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {overdueCount > 0 ? overdueCount : alertCount}
                </span>
              </button>
            )}
            {!isDesktop && !isNative && (
              <button
                onClick={() => { setNavOpen(o => !o); setShowNotifs(false); }}
                aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={navOpen}
                aria-controls="pcs-nav-drawer"
                style={{ background: navOpen ? `${theme.accent}30` : 'none', border: `1px solid rgba(255,255,255,0.25)`, color: '#fff', fontSize: 16, cursor: 'pointer', padding: '6px 11px', borderRadius: 8, lineHeight: 1, fontWeight: 700 }}>
                <span aria-hidden="true">{navOpen ? '✕' : '☰'}</span>
              </button>
            )}
          </div>
        </div>
        {/* Branch motto banner — slim metallic-gold rule sitting
            between the header and the page body. The motto is the
            branch's published motto from BRANCH_THEMES; the gold
            stripe shimmers slowly to signal "active mission." */}
        {theme.motto && (
          <div style={{
            position: 'relative', zIndex: 1,
            background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            borderTop: `1px solid ${theme.accent}40`,
            padding: '5px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            overflow: 'hidden',
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: theme.accent,
              letterSpacing: '.22em', textTransform: 'uppercase',
              fontFamily: DISPLAY_FONT,
            }}>
              {theme.motto}
            </span>
            <span aria-hidden="true" style={{
              flex: 1, height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${theme.accent} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'pcs-motto-shimmer 6s linear infinite',
              opacity: 0.55,
            }} />
            {theme.tagline && (
              <span style={{
                fontSize: 9, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)',
                fontFamily: DISPLAY_FONT, letterSpacing: '.02em',
              }}>
                {theme.tagline}
              </span>
            )}
          </div>
        )}
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
        <div id="pcs-nav-drawer" ref={navDrawerRef} role="dialog" aria-modal="true" aria-label="Navigation" style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: 0, right: 0, maxWidth: 480, margin: '0 auto', zIndex: 200, background: theme.secondary, borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {LOCALIZED_BOTTOM_NAV.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)} className={`pcs-side-link ${activeTab === item.id ? 'is-active' : ''}`} style={{ padding: '12px 4px', background: activeTab === item.id ? `${theme.accent}25` : 'transparent', border: 'none', borderBottom: `1px solid rgba(255,255,255,0.07)`, color: activeTab === item.id ? theme.accent : 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', '--side-accent': theme.accent }}>
                <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>{item.iosIcon}</span>
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

      {/* Notification dropdown — opens on the bell regardless of whether
          there are pending alerts, so the push-reminders toggle is always
          reachable. */}
      {showNotifs && (
        <div ref={notifsRef} role="dialog" aria-modal="true" aria-labelledby="pcs-notif-title" style={{ position: 'fixed', top: 'calc(52px + env(safe-area-inset-top))', left: isDesktop ? 230 : 0, right: 0, maxWidth: isDesktop ? '100%' : 480, margin: isDesktop ? 0 : '0 auto', zIndex: 200, background: '#FFFFFF', borderBottom: `2px solid ${theme.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div id="pcs-notif-title" style={{ fontSize: 13, fontWeight: 800, color: '#0D1821' }}>
              {overdueCount > 0 ? <>{overdueCount}{' '}{overdueCount !== 1 ? 'Overdue Actions' : 'Overdue Action'}</> : pendingAlerts.length > 0 ? 'Pending Actions' : 'Notifications'}
            </div>
            <button onClick={() => setShowNotifs(false)} aria-label="Close notifications" style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#56697C' }}><span aria-hidden="true">✕</span></button>
          </div>
          {pendingAlerts.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#56697C', borderBottom: '1px solid #F8F8F8' }}>
              No pending actions right now — you’re on track. ✓
            </div>
          )}
          {pendingAlerts.map((alert, i) => (
            <button type="button" key={i} onClick={() => { goTo('checklist'); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: alert.overdue ? '#FFF5F5' : '#FFFDE7' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{alert.overdue ? '⚠️' : '📋'}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: alert.overdue ? '#C62828' : '#E65100' }}>
                  {alert.overdue ? 'Overdue Action' : 'Due Now'}{': '}{alert.phase}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: '#56697C', marginTop: 1 }}>
                  {alert.count}{' '}{alert.count !== 1 ? 'tasks remaining' : 'task remaining'}{' · '}{alert.daysUntil < 0 ? `${Math.abs(alert.daysUntil)}d past departure` : `${alert.daysUntil}d until departure`}
                </span>
              </span>
              <span style={{ fontSize: 11, color: '#AAA' }}>→</span>
            </button>
          ))}
          {/* Push-reminders toggle. Hidden only when the browser can't do
              push or the server has no VAPID key configured. */}
          {pushState !== 'unsupported' && (
            <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', background: '#FFFFFF' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">🔔</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0D1821' }}>Push reminders</span>
                <span style={{ display: 'block', fontSize: 11, color: '#56697C', marginTop: 1 }}>
                  {pushState === true ? 'On — reminders arrive even when the app is closed.' : 'Get PCS reminders even when the app is closed.'}
                </span>
              </span>
              {pushState === null ? (
                <span style={{ fontSize: 11, color: '#AAA' }}>Checking…</span>
              ) : (
                <button type="button" onClick={handleTogglePush} disabled={pushBusy} aria-pressed={pushState === true}
                  style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 8, cursor: pushBusy ? 'default' : 'pointer', border: `1px solid ${theme.accent}`, background: pushState === true ? '#FFFFFF' : theme.accent, color: pushState === true ? theme.accent : '#fff', opacity: pushBusy ? 0.6 : 1 }}>
                  {pushBusy ? '…' : pushState === true ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close nav/notifs/more sheet */}
      {(navOpen || showNotifs) && <button type="button" aria-label="Close menu" onClick={() => { setNavOpen(false); setShowNotifs(false); }} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }} />}

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
            <h1 className="sr-only">Command Center</h1>
            {/* Branch-themed animated insignia backdrop. Layered
                BEHIND the giant text insignia so we keep the bold
                wordmark feel while adding the service-specific
                pattern (hex grid / orbital rings / wave forms /
                etc.) as a second readable layer. */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
              <BranchBackdrop branch={profile?.branch} opacity={0.22} />
            </div>
            <div aria-hidden="true" style={{ position: 'absolute', right: isDesktop ? -28 : -52, top: isDesktop ? 112 : 156, fontSize: isDesktop ? 450 : 292, fontWeight: 700, opacity: 0.12, userSelect: 'none', pointerEvents: 'none', color: theme.primary, letterSpacing: isDesktop ? '-18px' : '-12px', lineHeight: 0.82, zIndex: 0, fontFamily: DISPLAY_FONT }}>
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

            {/* Priority Alerts — red, priority-tiered feed of outstanding items
                from every checklist with notification mode enabled. Renders
                nothing until the user turns notifications on somewhere. */}
            <Suspense fallback={null}><PriorityAlertsCard onJumpTo={(tab, sub) => { if (sub) _SUBTAB_STORE.pending = sub; goTo(tab); }} /></Suspense>

            {/* Quick Actions — one-tap entry points for the most-common
                "I just opened the app, what now?" tasks. */}
            <QuickActionsRow theme={theme} onJumpTo={goTo} onOpenAI={() => setShowAIAssistant(true)} onOpenCompliance={() => setShowCompliance(true)} />

            {/* Mission Lanes — Today / This Week / Before You Report.
                Pulls live unchecked items from the user's tailored
                checklist so the home dashboard reflects real progress,
                not a static milestone array. */}
            <MissionLanes theme={theme} profile={profile} checklistItems={checklistItems} onJumpToOps={() => goTo('pcs-operations')} />

            {/* 2026 PCS policy-change awareness — GHC termination, new
                Personal Property Activity, 210-day orders, FY2026 rate
                bumps. Collapsible; data in src/data/pcs2026Changes.js. */}
            <Suspense fallback={null}><PCS2026ChangesCard theme={theme} /></Suspense>

            {/* Weekly Digest — aggregated stats from the last 7 days.
                Companion to ChangeLogCard (event list). */}
            <WeeklyDigestCard theme={theme} checklistItems={checklistItems} />

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
                anchored at the bottom of the page. The build stamp
                moved to <AppShellFooter /> so it (and the
                independence disclaimer) appear on every tab, not
                only Home. */}
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
        {activeTab === 'transition'        && renderCategoryFrame('transition',        <TransitionTab theme={theme} profile={profile} />)}
        {activeTab === 'home-relocation'   && renderCategoryFrame('home-relocation',   <HomeRelocationUnifiedTab theme={theme} profile={profile} />)}
        {activeTab === 'medical-readiness' && renderCategoryFrame('medical-readiness', <MedicalReadinessTab theme={theme} profile={profile} />)}

        {/* Legacy single-purpose routes. Not in the bottom nav anymore,
            but kept here so older deep links still resolve. */}
        {activeTab === 'base-intelligence' && renderCategoryFrame('base-intelligence', <BaseIntelligenceUnifiedTab theme={theme} profile={profile} />)}
        {activeTab === 'checklist'  && renderCategoryFrame('checklist',  <ChecklistTabMemo theme={theme} profile={profile} checklistItems={checklistItems} setChecklistItems={setChecklistItems} />)}
        {activeTab === 'documents'  && renderCategoryFrame('documents',  <PCSDocumentsModule theme={theme} profile={profile} />)}
        {activeTab === 'education'  && renderCategoryFrame('education',  <EducationBenefitsTab theme={theme} profile={profile} />)}
        {activeTab === 'family'     && renderCategoryFrame('family',     <FamilyCategoryTab theme={theme} profile={profile} />)}
        {activeTab === 'nav'        && renderCategoryFrame('nav',        <NavigationModule theme={theme} profile={profile} />)}
        {activeTab === 'religion'   && renderCategoryFrame('religion',   <ReligiousServicesModuleWrapped theme={theme} profile={profile} />)}
        {activeTab === 'resources'  && renderCategoryFrame('resources',  <ResourcesTab theme={theme} profile={profile} />)}
        {activeTab === 'veterans'   && renderCategoryFrame('veterans',   <VeteranBusinessesTabMemo theme={theme} profile={profile} />)}
      </div>
      </div>{/* end body container */}
      {/* Persistent app-shell footer — independence disclaimer + build
          stamp. Lives INSIDE <main> (the column-flex child) so it does
          not become a row-flex sibling of <aside>/<main> at the root
          and steal width from the desktop content column. */}
      <AppShellFooter />
      </main>{/* end main column (header + body) — wraps sibling of desktop aside */}

      {/* AI Assistant modal. Triggered from the sidebar (desktop) +
          the home-page footer (above Security & data handling) so
          it never overlaps the safety button visually.
          Lazy-loaded — Suspense fallback is null because the modal
          itself returns null when closed, so an invisible fallback is
          the right visual state during the chunk fetch. */}
      {/* Native-only floating AI trigger; web renders nothing. */}
      <AIAssistantFAB theme={theme} onClick={() => setShowAIAssistant(true)} />

      {/* i18n runtime mount — only loaded + executed for non-English
          locales. Lazy import keeps ~90 KB of dictionary code off the
          cold-start path for the default English user. */}
      {appLanguage !== 'en' && (
        <Suspense fallback={null}>
          <AppLanguageRuntimeMount lang={appLanguage} />
        </Suspense>
      )}

      <Suspense fallback={null}>
      <AIAssistantModal
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        isDesktop={isDesktop}
        language={profile?.language || 'en'}
        userContext={(() => {
          if (!profile) return null;
          const targetDate = profile.reportNLTDate || profile.departingDate || null;
          const daysUntil = targetDate ? getDaysUntilDeparture(targetDate) : null;
          const currentPhase = daysUntil !== null ? resolveCurrentPhase(daysUntil) : null;
          const tailored = currentPhase ? getTailoredChecklist(profile.branch || 'Army', {
            component: profile.component || 'Active Duty',
            ordersType: profile.ordersType || '',
            hasDependents: !!profile.hasDependents,
            hasChildren: !!profile.hasChildren,
            hasPets: !!profile.hasPets,
            moveType: profile.moveType || 'HHG',
            isOverseas: !!profile.isOverseas,
          }) : {};
          const items = (tailored[currentPhase] || []);
          const open = items.filter((_, i) => !(checklistItems || {})[`${currentPhase}-${i}`]);
          return {
            branch: profile.branch,
            rank: profile.rank,
            component: profile.component,
            ordersType: profile.ordersType,
            hasDependents: !!profile.hasDependents,
            hasChildren: !!profile.hasChildren,
            hasPets: !!profile.hasPets,
            moveType: profile.moveType,
            isOverseas: !!profile.isOverseas,
            daysUntilTarget: daysUntil,
            currentPhase,
            openTaskCount: open.length,
            openTaskLabels: open.slice(0, 8),
          };
        })()}
      />
      </Suspense>

      {/* COMPLIANCE MODAL — opened from the Security & data-handling
          button at the bottom of the Home tab. The Compliance content
          used to live in the bottom nav; moved to a modal so it stays
          one tap away without crowding the PCS-task category bar. */}
      {showCompliance && (
        <div ref={complianceRef} role="dialog" aria-modal="true" aria-label="Security and data handling" onClick={() => setShowCompliance(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(13, 24, 33, 0.65)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: isDesktop ? 32 : 0 }}>
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
                <button type="button" key={i} onClick={() => { setDemoTip(i); goTo(DEMO_TIPS[i].tab); }} aria-label={`Go to step ${i + 1}`} aria-current={i === demoTip ? 'step' : undefined} style={{ width: i === demoTip ? 20 : 6, height: 6, borderRadius: 3, background: i <= demoTip ? theme.accent : 'rgba(255,255,255,0.2)', border: 'none', padding: 0, cursor: 'pointer', transition: 'all .2s' }} />
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

      {/* First-launch independence acknowledgement. Self-gated: only
          renders when the user has not already tapped "I understand".
          Catches users who skipped the landing page (deep links,
          mobile launch into last tab, returning users with a saved
          profile). */}
      <IndependenceAck />

      {/* ── iOS BOTTOM TAB BAR ── native only, invisible on web/Railway ── */}
      {isNative && !isDesktop && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 310, background: theme.secondary, borderTop: `1px solid ${theme.accent}35`, display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {IOS_TAB_BAR.map(item => (
            <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} style={{ flex: 1, minHeight: 49, padding: '6px 2px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.iosIcon}</span>
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
          <button type="button" aria-label="Close more menu" onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 311, background: 'rgba(0,0,0,0.45)', border: 'none', padding: 0, cursor: 'pointer' }} />
          <div style={{ position: 'fixed', bottom: `calc(49px + env(safe-area-inset-bottom))`, left: 0, right: 0, zIndex: 312, background: theme.secondary, borderRadius: '20px 20px 0 0', borderTop: `2px solid ${theme.accent}60`, paddingTop: 8, paddingBottom: 4 }}>
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 12px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: '0 12px' }}>
              {LOCALIZED_BOTTOM_NAV.map(item => (
                <button key={item.id} onClick={() => { goTo(item.id); setMoreOpen(false); }} className={`pcs-bottom-tab ${activeTab === item.id ? 'is-active' : ''}`} style={{ padding: '10px 4px 8px', background: activeTab === item.id ? `${theme.accent}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTab === item.id ? theme.accent + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span className="pcs-bottom-tab__glyph" style={{ fontSize: 20, lineHeight: 1 }}>{item.iosIcon}</span>
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
  const _isBuddhist = pref.includes('Buddhist');
  const _isHindu = pref.includes('Hindu');
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

function LazyTabFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 240,
        padding: 24,
        color: '#56697C',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Loading…
    </div>
  );
}

export default function AppWithRecovery() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<LazyTabFallback />}>
        <App />
      </Suspense>
    </AppErrorBoundary>
  );
}
