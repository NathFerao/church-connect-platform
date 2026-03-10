import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChurchMeta {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface UserMeta {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  churchId: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: UserMeta | null;
  token: string | null;
  church: ChurchMeta | null;
  isLoading: boolean;

  setAuth: (user: UserMeta, token: string, church: ChurchMeta) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      church: null,
      isLoading: false,

      setAuth: (user, token, church) =>
        set({ user, token, church, isLoading: false }),

      logout: () =>
        set({ user: null, token: null, church: null, isLoading: false }),

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'cc-auth',
      storage: typeof window !== 'undefined'
        ? {
            getItem: (k) => {
              const item = sessionStorage.getItem(k);
              return item ? JSON.parse(item) : null;
            },
            setItem: (k, v) => {
              sessionStorage.setItem(k, JSON.stringify(v));
            },
            removeItem: (k) => sessionStorage.removeItem(k),
          }
        : undefined,
    }
  )
);

export const getState = useAuthStore.getState;