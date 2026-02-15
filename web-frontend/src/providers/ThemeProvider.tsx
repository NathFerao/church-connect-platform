'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const church = useAuthStore((s) => s.church);
  const { primary, secondary } = useThemeStore();

  useEffect(() => {
    // Rebuild theme store whenever church identity changes
    useThemeStore.getState().refresh();
  }, [church]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cc-primary', primary);
    root.style.setProperty('--cc-secondary', secondary);
  }, [primary, secondary]);

  return <>{children}</>;
}
