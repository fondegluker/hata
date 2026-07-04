import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we have a refresh token, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().token?.refresh_token;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const newToken = response.data;
          useAuthStore.getState().setToken(newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken.access_token}`;
          return apiClient(originalRequest);
        } catch {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
