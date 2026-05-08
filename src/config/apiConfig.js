/**
 * API Configuration for PCS Express
 * 
 * IMPORTANT: Always use relative paths in browser context.
 * The frontend should never hardcode API URLs or ports.
 * 
 * Production: nginx proxies /api/* to Express backend
 * Development: Vite proxies /api/* to Express backend
 */

const getApiUrl = () => {
  // Browser environment: use relative paths (works everywhere)
  if (typeof window !== 'undefined') {
    return ''
  }

  // Server-side rendering fallback (if applicable)
  return 'local development server'
}

export const API_CONFIG = {
  // Base URL (empty string = current origin)
  apiUrl: getApiUrl(),

  // Endpoint constants
  endpoints: {
    health: '/api/health',
    ai: '/api/ai',
  },

  // Request timeout (ms)
  timeout: 15000,
}

export default API_CONFIG
