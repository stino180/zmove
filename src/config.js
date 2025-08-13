// Configuration for different environments
const config = {
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    httpsApiBaseUrl: 'https://localhost:5001/api',
    useHttps: false, // Set to true to use HTTPS in development
  },
  production: {
    apiBaseUrl: 'https://zmove.xyz/api',
    httpsApiBaseUrl: 'https://zmove.xyz/api',
    useHttps: true,
  }
};

// Get current environment
const env = import.meta.env.MODE || 'development';
const currentConfig = config[env];

// Export the appropriate API base URL
export const API_BASE_URL = currentConfig.useHttps 
  ? currentConfig.httpsApiBaseUrl 
  : currentConfig.apiBaseUrl;

// Export the full config for debugging
export const getConfig = () => currentConfig;

// Helper to check if we're using HTTPS
export const isHttps = () => currentConfig.useHttps;

// Helper to get the appropriate API URL based on current protocol
export const getApiUrl = () => {
  // If we're on HTTPS page, use HTTPS API
  if (window.location.protocol === 'https:') {
    return currentConfig.httpsApiBaseUrl;
  }
  // Otherwise use the configured default
  return currentConfig.useHttps 
    ? currentConfig.httpsApiBaseUrl 
    : currentConfig.apiBaseUrl;
};

export default config;

