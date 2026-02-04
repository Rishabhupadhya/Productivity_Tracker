import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true // Keep for potential future cookie-based features
});

// CSRF DISABLED - Was causing 500 errors
// let csrfToken: string | null = null;

// export const initializeCSRF = async () => {
//   try {
//     const response = await api.get('/csrf-token');
//     csrfToken = response.data.csrfToken;
//   } catch (error) {
//     console.error('Failed to fetch CSRF token:', error);
//   }
// };

// Add Authorization header from localStorage
api.interceptors.request.use((config) => {
  // Add JWT token from localStorage
  const token = localStorage.getItem('token');
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CSRF token disabled
  // if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
  //   config.headers['X-CSRF-Token'] = csrfToken;
  // }
  return config;
});

// CSRF token refresh disabled
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 403 && error.response?.data?.code === 'EBADCSRFTOKEN') {
//       await initializeCSRF();
//       const originalRequest = error.config;
//       if (csrfToken) {
//         originalRequest.headers['X-CSRF-Token'] = csrfToken;
//       }
//       return api(originalRequest);
//     }
//     return Promise.reject(error);
//   }
// );
// Response interceptor to detect HTML responses (deployment errors)
api.interceptors.response.use(
  (response) => {
    // Check if we expected JSON but got HTML (e.g. from Vercel catch-all)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html') && typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.error('API Error: Received HTML instead of JSON. This usually means the API URL is wrong or being caught by the frontend router.', {
        url: response.config.url,
        baseUrl: response.config.baseURL
      });
      return Promise.reject(new Error('Invalid API response: Received HTML instead of JSON. Check your backend deployment.'));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api;
