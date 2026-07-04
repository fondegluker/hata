import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings } from '@/types/api';

interface SettingsState {
  settings: Settings | null;
  theme: 'light' | 'dark';
  setSettings: (settings: Settings) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const defaultTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('hata-theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      theme: defaultTheme(),
      setSettings: (settings) => set({ settings, theme: settings.theme }),
      setTheme: (theme) => {
        localStorage.setItem('hata-theme', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('hata-theme', newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: 'hata-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
