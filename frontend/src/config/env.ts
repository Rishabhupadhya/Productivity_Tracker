export const env = {
  // Force production API URL - prevents any typos in Vercel env vars
  API_URL: import.meta.env.PROD 
    ? 'https://productivity-tracker-jfib.vercel.app/api'
    : (import.meta.env.VITE_API_URL || 'http://localhost:5002/api')
};
