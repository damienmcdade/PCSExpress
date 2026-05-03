/**
 * API Configuration for PCS Express Frontend
 * Update the apiUrl to match your backend deployment
 */

export const API_CONFIG = {
  // Local development
  development: {
    apiUrl: 'http://localhost:3000'
  },
  
  // Railway production
  production: {
    apiUrl: 'https://pcs-express-backend.railway.app'
  },
  
  // AWS production
  aws: {
    apiUrl: 'https://api.pcs-express.military.mil'
  }
};

// Get current environment
const ENV = process.env.NODE_ENV || 'development';
const DEPLOYMENT = process.env.DEPLOYMENT || 'development';

// Determine which config to use
let config;
if (DEPLOYMENT === 'railway' && ENV === 'production') {
  config = API_CONFIG.production;
} else if (DEPLOYMENT === 'aws' && ENV === 'production') {
  config = API_CONFIG.aws;
} else {
  config = API_CONFIG.development;
}

export default config;
