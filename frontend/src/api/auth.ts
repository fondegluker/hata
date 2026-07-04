import apiClient from './client';
import type { User, Token, UserLogin, UserRegister } from '@/types/api';

export const authApi = {
  login: async (data: UserLogin): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/login', data);
    return response.data;
  },

  register: async (data: UserRegister): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/refresh', null, {
      params: { refresh_token: refreshToken },
    });
    return response.data;
  },
};
