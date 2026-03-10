import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth.store';

interface ThemeState {
  primary: string;
  secondary: string;
  logoUrl: string | null;
  churchName: string;
  isDark: boolean;
  refresh: () => void;
  toggleDark: () => void;
}

const DEFAULT_PRIMARY = '#4F46E5';
const DEFAULT_SECONDARY = '#10B981';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => {
      const church = useAuthStore.getState().church;
      return {
        primary: church?.primaryColor || DEFAULT_PRIMARY,
        secondary: church?.secondaryColor || DEFAULT_SECONDARY,
        logoUrl: church?.logoUrl || null,
        churchName: church?.name || 'Church Connect',
        isDark: false,

        refresh() {
          const c = useAuthStore.getState().church;
          set({
            primary: c?.primaryColor || DEFAULT_PRIMARY,
            secondary: c?.secondaryColor || DEFAULT_SECONDARY,
            logoUrl: c?.logoUrl || null,
            churchName: c?.name || 'Church Connect',
          });
        },

        toggleDark() {
          set((s) => {
            const next = !s.isDark;
            // Apply to <html> element immediately
            document.documentElement.classList.toggle('dark', next);
            return { isDark: next };
          });
        },
      };
    },
    {
      name: 'cc-theme',
      // Only persist isDark — other values come from church data
      partialize: (s) => ({ isDark: s.isDark }),
    }
  )
);