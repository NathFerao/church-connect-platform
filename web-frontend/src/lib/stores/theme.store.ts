import { create } from 'zustand';
import { useAuthStore } from './auth.store';

interface ThemeState {
  primary: string;
  secondary: string;
  logoUrl: string | null;
  churchName: string;
  refresh: () => void;
}

const DEFAULT_PRIMARY = '#4F46E5';
const DEFAULT_SECONDARY = '#10B981';

export const useThemeStore = create<ThemeState>(() => {
  const church = useAuthStore.getState().church;
  return {
    primary: church?.primaryColor || DEFAULT_PRIMARY,
    secondary: church?.secondaryColor || DEFAULT_SECONDARY,
    logoUrl: church?.logoUrl || null,
    churchName: church?.name || 'Church Connect',
    refresh() {
      const c = useAuthStore.getState().church;
      useThemeStore.setState({
        primary: c?.primaryColor || DEFAULT_PRIMARY,
        secondary: c?.secondaryColor || DEFAULT_SECONDARY,
        logoUrl: c?.logoUrl || null,
        churchName: c?.name || 'Church Connect',
      });
    },
  };
});