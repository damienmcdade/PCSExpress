/*
 * Client half of the Apple 5.1.2(i) AI-consent gate.
 *
 * The header name, cookie name, version and provider list come from
 * shared/aiConsent.js — the SAME module the four server handlers import — so
 * the client and the servers cannot drift apart.
 *
 * Storage: plain localStorage, not the AES secureLocalStore. Consent is not a
 * secret (forging it only means consenting on your own behalf, which the user
 * can do by tapping Agree), and the read has to be synchronous so a call site
 * can check it before firing a request.
 */

import {
  AI_CONSENT_COOKIE,
  AI_CONSENT_HEADER,
  AI_CONSENT_VERSION,
  AI_PROVIDERS,
} from '../../shared/aiConsent.js'

export { AI_CONSENT_VERSION, AI_PROVIDERS }

const STORAGE_KEY = 'pcs_ai_consent'

// Session fallback for devices where localStorage is missing or throws
// (private browsing, storage blocked by policy, a locked-down WebView).
// Without it those users would agree, get no persisted record, send no consent
// header, and be bounced by the server's 451 on every single request — an
// unbreakable loop. Holding the decision in memory keeps the assistant usable
// for the session; it is simply asked again next launch.
let sessionConsent = null

/** Fired whenever consent is granted or withdrawn, so open surfaces re-render. */
export const AI_CONSENT_CHANGED_EVENT = 'pcs-ai-consent-changed'

/** Fired when a call site needs the consent sheet raised. */
export const AI_CONSENT_REQUEST_EVENT = 'pcs-ai-consent-request'

function readStored() {
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch { /* storage blocked — fall through to the session value */ }
  return sessionConsent
}

/**
 * True when this device has recorded consent for the CURRENT disclosure text.
 * A stored version older than AI_CONSENT_VERSION means the disclosure changed
 * materially since the user agreed, so we re-prompt. (The server is lenient
 * about the version for exactly the opposite reason — see shared/aiConsent.js.)
 */
export function hasAiConsent() {
  const stored = readStored()
  if (!stored) return false
  return Number(stored) >= Number(AI_CONSENT_VERSION)
}

export function recordAiConsent() {
  sessionConsent = AI_CONSENT_VERSION
  try {
    window.localStorage?.setItem(STORAGE_KEY, AI_CONSENT_VERSION)
  } catch { /* storage unavailable — sessionConsent carries this session */ }
  writeCookie(AI_CONSENT_VERSION)
  notifyChanged()
}

export function revokeAiConsent() {
  sessionConsent = null
  try {
    window.localStorage?.removeItem(STORAGE_KEY)
  } catch { /* nothing stored to clear */ }
  writeCookie('')
  notifyChanged()
}

// Same-origin fallback carrier for the web app (Vercel serves /api/ai and
// /api/jtr-assistant from the app's own origin). Useless on native — the
// Capacitor WebView origin is not the Railway API origin and the server's
// CORS policy sets credentials:false — which is why the header exists.
function writeCookie(value) {
  try {
    if (typeof document === 'undefined') return
    const secure = window.location?.protocol === 'https:' ? '; Secure' : ''
    document.cookie = value
      ? `${AI_CONSENT_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
      : `${AI_CONSENT_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`
  } catch { /* cookies blocked — header still carries consent */ }
}

function notifyChanged() {
  try {
    window.dispatchEvent(new CustomEvent(AI_CONSENT_CHANGED_EVENT, {
      detail: { granted: hasAiConsent() },
    }))
  } catch { /* no window (SSR/test) */ }
}

/**
 * Headers to merge into every AI fetch. Empty when no consent is recorded, so
 * the server 451s rather than the client silently transmitting.
 */
export function aiConsentHeaders() {
  return hasAiConsent() ? { [AI_CONSENT_HEADER]: AI_CONSENT_VERSION } : {}
}

// Callers awaiting a decision from the consent sheet. Kept module-level so
// several surfaces can await the same sheet instead of stacking dialogs.
let pendingResolvers = []

/**
 * Raise the consent sheet (if consent isn't already on record) and resolve
 * with the user's decision. Resolves true immediately when consent exists.
 */
export function requestAiConsent() {
  if (hasAiConsent()) return Promise.resolve(true)
  return new Promise((resolve) => {
    pendingResolvers.push(resolve)
    try {
      window.dispatchEvent(new CustomEvent(AI_CONSENT_REQUEST_EVENT))
    } catch {
      // No window to raise a sheet in — fail closed.
      settleAiConsent(false)
    }
  })
}

/** Called by the consent sheet once the user chooses. */
export function settleAiConsent(granted) {
  const waiting = pendingResolvers
  pendingResolvers = []
  for (const resolve of waiting) {
    try { resolve(!!granted) } catch { /* caller went away */ }
  }
}
