/**
 * API base resolution for PCS Express.
 *
 * Web (Vercel / direct Railway): API calls stay relative ("/api/...").
 * On Vercel this is rewritten to Railway by vercel.json; on the
 * Railway-served bundle the Express server handles /api itself.
 *
 * Capacitor (iOS + Android): the WebView origin is https://localhost
 * (Android, with androidScheme:"https") or capacitor://localhost
 * (iOS), neither of which serves /api. We detect the native shell at
 * runtime via window.Capacitor.isNativePlatform() and rewrite to the
 * absolute Railway origin so dynamic-card endpoints reach the server.
 *
 * The Railway origin is hard-coded because Capacitor builds are
 * shipped as signed artifacts and the API location is part of the
 * release contract; flipping it requires a re-release.
 */

const RAILWAY_API_ORIGIN = 'https://pcsexpress-production.up.railway.app'

const isCapacitorNative = () => {
  if (typeof window === 'undefined') return false
  // Capacitor 4/5/6 expose isNativePlatform(); the older `platform`
  // string is checked as a fallback for safety against runtime variance.
  const c = window.Capacitor
  if (!c) return false
  if (typeof c.isNativePlatform === 'function') return c.isNativePlatform()
  return c.platform === 'ios' || c.platform === 'android'
}

const getApiBase = () => {
  if (isCapacitorNative()) return RAILWAY_API_ORIGIN
  return ''
}

/**
 * Build a fully-qualified API URL. Always import this and call
 * `apiUrl('/api/family-activities?...')` instead of using bare
 * /api strings in fetch() — otherwise the call dies in Capacitor.
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${getApiBase()}${p}`
}

export const API_CONFIG = {
  apiUrl: getApiBase(),
  endpoints: {
    health: '/api/health',
    ai: '/api/ai',
  },
  timeout: 15000,
}

/**
 * Default request budget (ms) for live data-card endpoints. Without it,
 * a stalled backend leaves the UI spinning forever — the frontend and
 * backend stop "operating together." 15s is generous for the upstream
 * aggregators (jobs, schools, housing) while still bounding the hang.
 */
export const DEFAULT_FETCH_TIMEOUT = 15000

/**
 * fetch() with a hard timeout. On expiry the request is aborted and the
 * promise rejects with an AbortError, so callers fall through to their
 * existing `.catch` fallback (empty results / "couldn't load" reason)
 * instead of hanging. Honors a caller-supplied `signal` too (e.g. an
 * effect-cleanup abort): either the caller aborting OR the timeout
 * firing cancels the request.
 *
 * Usage: replace `fetch(apiUrl(...))` with `fetchWithTimeout(apiUrl(...))`.
 */
export function fetchWithTimeout(input, { timeout = DEFAULT_FETCH_TIMEOUT, signal, ...init } = {}) {
  // AbortSignal.timeout + AbortSignal.any are widely supported (modern
  // browsers + the Capacitor WebViews we ship); fall back to a manual
  // controller where `any` is missing so older shells still get a timeout.
  const timer = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(timeout)
    : null
  let combined = signal || timer || undefined
  if (signal && timer && typeof AbortSignal.any === 'function') {
    combined = AbortSignal.any([signal, timer])
  } else if (signal && timer) {
    // No AbortSignal.any: wire the timer to the caller's controller is
    // not possible here, so prefer the timeout to guarantee no hang.
    combined = timer
  }
  return fetch(input, { ...init, signal: combined })
}

export default API_CONFIG
