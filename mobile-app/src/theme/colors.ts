/**
 * Static color tokens used inside StyleSheet.create() calls.
 *
 * For interactive component colours (buttons, chips, etc.) React Native Paper
 * reads from the PaperProvider theme, which is now built dynamically from the
 * church's branding in src/providers/ThemeProvider.tsx.
 *
 * These values are only used for background, text, and layout colours that
 * Paper doesn't control.
 */
export const colors = {
  // Brand — used as fallback before church data loads
  primary: '#4F46E5',
  secondary: '#7C3AED',

  // Backgrounds
  background: '#F9FAFB',
  backgroundDark: '#111827',
  surface: '#FFFFFF',
  surfaceDark: '#1F2937',

  // Text
  text: '#111827',
  textDark: '#F9FAFB',
  textSecondary: '#6B7280',
  textSecondaryDark: '#9CA3AF',
} as const;

/**
 * Helper — returns the right token set based on dark mode.
 * Use this in screens that need to respond to theme changes in StyleSheet.
 */
export function getColors(isDark: boolean) {
  return {
    primary: colors.primary,
    secondary: colors.secondary,
    background: isDark ? colors.backgroundDark : colors.background,
    surface: isDark ? colors.surfaceDark : colors.surface,
    text: isDark ? colors.textDark : colors.text,
    textSecondary: isDark ? colors.textSecondaryDark : colors.textSecondary,
  };
}