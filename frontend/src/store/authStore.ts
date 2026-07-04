import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Token } from '@/types/api';

interface AuthState {
  user: User | null;
  token: Token | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: Token | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'hata-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
