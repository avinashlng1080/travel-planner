import { useAtom } from 'jotai';

import { energyThemeAtom, type EnergyTheme } from '@/atoms/userContextAtoms';

/**
 * Hook for accessing the current energy theme based on user context.
 *
 * The theme changes based on:
 * - Energy level (high/medium/low)
 * - Toddler mood (happy/tired/fussy/sleeping)
 * - Health status (good/mild_sickness/needs_rest)
 *
 * When energy is LOW or conditions suggest rest:
 * - UI shifts to calm, muted colors (slate/blue)
 * - Shows "Plan B Mode" indicator
 * - Suggests indoor/easier activities
 *
 * When energy is HIGH:
 * - UI is vibrant with sunset/ocean colors
 * - Full adventure mode enabled
 *
 * @returns EnergyTheme object with colors, CSS classes, and state info
 */
export function useEnergyTheme(): EnergyTheme {
  const [theme] = useAtom(energyThemeAtom);
  return theme;
}

/**
 * Generates CSS class names for a component based on energy theme.
 * Use this for components that need theme-aware styling.
 */
export function useEnergyThemeClasses() {
  const theme = useEnergyTheme();

  return {
    // Panel styling
    panel: `${theme.css.panelBg} backdrop-blur-xl border ${theme.css.panelBorder}`,

    // Header with gradient
    header: `bg-gradient-to-r ${theme.css.headerGradient}`,

    // Badge styling
    badge: `${theme.colors.badge} ${theme.colors.badgeBg}`,

    // Tab styling (active state)
    tabActive: `${theme.css.tabActive} border-b-2 border-current ${theme.css.tabActiveBg}`,

    // Button accent
    buttonAccent: `bg-gradient-to-r ${theme.css.accentGradient} text-white`,

    // Text colors
    textPrimary: theme.colors.text,
    textMuted: theme.colors.mutedText,

    // Border
    border: theme.colors.border,

    // Is suggesting Plan B?
    suggestPlanB: theme.suggestPlanB,
    planBMessage: theme.message,
    energyLevel: theme.level,
    energyLabel: theme.label,
    energyIcon: theme.icon,
  };
}

export type { EnergyTheme };
