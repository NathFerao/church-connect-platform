import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';

/**
 * Builds a React Native Paper MD3 theme using:
 * - The church's primaryColor from the auth store (falls back to indigo)
 * - The user's dark mode preference from the theme store
 */
export function useChurchTheme(): MD3Theme {
  const church = useAuthStore((s) => s.church);
  const isDark = useThemeStore((s) => s.isDark);

  const primaryColor = church?.primaryColor ?? '#4F46E5';
  const secondaryColor = church?.secondaryColor ?? '#7C3AED';

  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: primaryColor,
      secondary: secondaryColor,
      // Tint surfaces with a very subtle wash of the primary colour
      primaryContainer: isDark
        ? `${primaryColor}33`
        : `${primaryColor}18`,
      secondaryContainer: isDark
        ? `${secondaryColor}33`
        : `${secondaryColor}18`,
    },
  };
}