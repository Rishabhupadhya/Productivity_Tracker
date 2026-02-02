export const env = {
  API_URL: import.meta.env.VITE_API_URL || 
           (import.meta.env.PROD ? 'https://your-backend.vercel.app/api' : 'http://localhost:5002/api')
};
