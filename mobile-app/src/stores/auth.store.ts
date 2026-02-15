import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  churchId: string;
}

interface Church {
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
  
  setAuth: (user: User, church: Church, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  church: null,
  token: null,
  isLoading: true,

  setAuth: async (user, church, token) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ user, church, token, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, church: null, token: null, isLoading: false });
  },

  loadToken: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    set({ token, isLoading: false });
  },
}));
