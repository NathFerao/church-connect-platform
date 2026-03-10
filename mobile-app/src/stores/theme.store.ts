import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = '@church_connect_dark_mode';

interface ThemeState {
  isDark: boolean;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  toggleDark: () => Promise<void>;
  setDark: (value: boolean) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  isLoaded: false,

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(DARK_MODE_KEY);
      const isDark = stored === 'true';
      set({ isDark, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleDark: async () => {
    const next = !get().isDark;
    set({ isDark: next });
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, String(next));
    } catch {
      // non-fatal — preference just won't persist
    }
  },

  setDark: async (value: boolean) => {
    set({ isDark: value });
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, String(value));
    } catch {}
  },
}));