/**
 * API Configuration for PCS Express Frontend
 * Properly configured for Docker production and development
 */

// Get the current hostname/origin
const getApiUrl = () => {
  // In Docker production: nginx serves both frontend and proxies /api to Express on port 3001
  // The frontend should always use relative paths to /api for same-origin requests
  
  if (typeof window === 'undefined') {
    // SSR/Node.js environment
    return 'http://localhost:3001';
  }

  // Browser environment - use relative path (works across all deployments)
  return '';
};

export const API_CONFIG = {
  // Always use relative paths when available (current origin)
  apiUrl: getApiUrl(),
  
  // API endpoints
  endpoints: {
    health: '/api/health',
    ai: '/api/ai'
  }
};

export default API_CONFIG;
