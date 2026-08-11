import axios from 'axios';
import { CONFIG_ENV, CONFIG_STORAGE } from '@/lib/constants';
import { getStoredAuthToken } from '@/lib/helper';

export const axiosClient = axios.create({
  baseURL: CONFIG_ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request Interceptor: Attach bearer token if valid
axiosClient.interceptors.request.use(
  (config) => {
    const authData = getStoredAuthToken();
    if (authData && authData.accessToken) {
      config.headers.Authorization = `Bearer ${authData.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(CONFIG_STORAGE.AUTH_TOKEN);
      window.dispatchEvent(new Event('centrix_unauthorized'));
    }
    return Promise.reject(error);
  }
);
