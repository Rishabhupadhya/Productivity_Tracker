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

export default api;
