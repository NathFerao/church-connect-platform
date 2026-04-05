import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import { getColors, colors as staticColors } from '../theme/colors';

/**
 * Single hook for all theme needs.
 * - c        → background, surface, text, textSecondary (dark/light aware)
 * - primary  → church's primaryColor (falls back to default indigo)
 * - secondary → church's secondaryColor
 * - isDark   → boolean
 *
 * Use this instead of importing `colors.primary` directly so church
 * branding is always applied.
 */
export function useAppTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  const church = useAuthStore((s) => s.church);
  const c = getColors(isDark);
  const primary = church?.primaryColor ?? staticColors.primary;
  const secondary = church?.secondaryColor ?? staticColors.secondary;
  return { isDark, c, primary, secondary };
}