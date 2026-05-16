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

export default API_CONFIG
