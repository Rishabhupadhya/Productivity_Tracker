// Helper to safely construct base URL
const getBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return 'https://productivity-tracker-jfib.vercel.app';
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
  return apiUrl.replace('/api', '');
};

// Helper to safely construct API URL
const getApiUrl = (): string => {
  if (import.meta.env.PROD) {
    return 'https://productivity-tracker-jfib.vercel.app/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
};

export const env = {
  API_URL: getApiUrl(),
  BASE_URL: getBaseUrl()
};
