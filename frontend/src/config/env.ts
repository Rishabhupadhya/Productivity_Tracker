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
  // Use VITE_API_URL if provided (Standard Vercel Env Var)
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  if (import.meta.env.PROD) {
    // Hardcoded production endpoint based on user's current deployment configuration
    return 'https://productivity-tracker-jfib.vercel.app/api';
  }

  return 'http://localhost:5002/api';
};

export const env = {
  API_URL: getApiUrl(),
  BASE_URL: getBaseUrl(),
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
};
