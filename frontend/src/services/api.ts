import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true // Keep for CSRF cookies
});

// Fetch CSRF token and add to requests
let csrfToken: string | null = null;

// Fetch CSRF token on app initialization
export const initializeCSRF = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
};

// Add Authorization header from localStorage
api.interceptors.request.use((config) => {
  // Add JWT token from localStorage
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token to POST, PUT, PATCH, DELETE requests
  if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Refresh CSRF token on 403 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'EBADCSRFTOKEN') {
      // CSRF token invalid, refresh it
      await initializeCSRF();
      // Retry the original request
      const originalRequest = error.config;
      if (csrfToken) {
        originalRequest.headers['X-CSRF-Token'] = csrfToken;
      }
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;
