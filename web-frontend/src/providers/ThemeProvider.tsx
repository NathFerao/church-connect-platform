'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const church = useAuthStore((s) => s.church);
  const { primary, secondary, isDark } = useThemeStore();

  // Apply dark mode synchronously before paint via a blocking script
  // This prevents the flash of wrong theme on page load/navigation
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]); // ← watch isDark so it re-applies on every change

  useEffect(() => {
    useThemeStore.getState().refresh();
  }, [church]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cc-primary', primary);
    root.style.setProperty('--cc-secondary', secondary);
  }, [primary, secondary]);

  return <>{children}</>;
}