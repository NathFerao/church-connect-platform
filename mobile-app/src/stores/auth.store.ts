import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  churchId: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface Church {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

interface AuthState {
  user: User | null;
  church: Church | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, church: Church | null, token: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

const KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  CHURCH: 'auth_church',
} as const;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  church: null,
  token: null,
  isLoading: true,

  setAuth: async (user, church, token) => {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    await SecureStore.setItemAsync(KEYS.CHURCH, JSON.stringify(church));
    set({ user, church, token, isLoading: false });
  },

  updateUser: async (user) => {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      await SecureStore.deleteItemAsync(KEYS.TOKEN);
      await SecureStore.deleteItemAsync(KEYS.USER);
      await SecureStore.deleteItemAsync(KEYS.CHURCH);
      set({ user: null, church: null, token: null, isLoading: false });
    }
  },

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(KEYS.TOKEN);

      if (!token) {
        set({ token: null, user: null, church: null, isLoading: false });
        return;
      }

      // Restore cached data immediately so the UI renders without waiting
      const userJson = await SecureStore.getItemAsync(KEYS.USER);
      const churchJson = await SecureStore.getItemAsync(KEYS.CHURCH);
      const cachedUser: User | null = userJson ? JSON.parse(userJson) : null;
      const cachedChurch: Church | null = churchJson ? JSON.parse(churchJson) : null;

      set({ token, user: cachedUser, church: cachedChurch, isLoading: false });

      // Refresh from API in the background to pick up any server-side changes
      try {
        const { data } = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const freshUser: User = data.data.user ?? data.data;
        const freshChurch: Church | null = freshUser.churchId
          ? {
              id: data.data.church?.id ?? freshUser.churchId,
              name: data.data.church?.name ?? 'Church',
              logoUrl: data.data.church?.logoUrl ?? null,
              primaryColor: data.data.church?.primaryColor ?? '#4F46E5',
              secondaryColor: data.data.church?.secondaryColor ?? '#7C3AED',
            }
          : null;

        await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(freshUser));
        await SecureStore.setItemAsync(KEYS.CHURCH, JSON.stringify(freshChurch));
        set({ user: freshUser, church: freshChurch });
      } catch {
        // Background refresh failed (e.g. offline) — cached data is still usable
      }
    } catch {
      set({ token: null, user: null, church: null, isLoading: false });
    }
  },
}));