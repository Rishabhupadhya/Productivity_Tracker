const getBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    // Dynamically use current origin for zero-config production support
    return window.location.origin;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
  return apiUrl.replace('/api', '');
};

// Helper to safely construct API URL
const getApiUrl = (): string => {
  if (import.meta.env.PROD) {
    // If the environment variable is set in Vercel, use it.
    // Otherwise fallback to the current origin (useful if using proxies/rewrites)
    return import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
};

export const env = {
  API_URL: getApiUrl(),
  BASE_URL: getBaseUrl()
};
