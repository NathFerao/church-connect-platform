import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { useChurchTheme } from '../hooks/useChurchTheme';
import { useThemeStore } from '../stores/theme.store';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps PaperProvider with dynamic theming.
 * Must be rendered INSIDE QueryClientProvider so hooks can read from stores.
 */
export default function ThemeProvider({ children }: Props) {
  const theme = useChurchTheme();
  const loadTheme = useThemeStore((s) => s.loadTheme);

  // Load persisted dark mode preference once on mount
  useEffect(() => {
    loadTheme();
  }, []);

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}