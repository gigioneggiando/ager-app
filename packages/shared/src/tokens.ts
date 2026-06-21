/**
 * Design tokens — single source of truth for cross-platform theming (web now, mobile later).
 *
 * NEUTRAL placeholder only. The owner swaps the palette here (and the matching CSS
 * variables in apps/web/src/app/globals.css) in ONE place later. Do NOT hardcode brand
 * colors anywhere else. Values are HSL channels so they map 1:1 onto the shadcn/ui
 * CSS-variable convention (`hsl(var(--token))`).
 */

export const radius = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "0.75rem",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const typography = {
  fontSans:
    'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontMono:
    'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

/**
 * Semantic color tokens as HSL channel triplets ("H S% L%").
 * NEUTRAL (shadcn "neutral" base). Light + dark. Brand-agnostic on purpose.
 */
export const colors = {
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 3.9%",
    card: "0 0% 100%",
    cardForeground: "0 0% 3.9%",
    primary: "0 0% 9%",
    primaryForeground: "0 0% 98%",
    secondary: "0 0% 96.1%",
    secondaryForeground: "0 0% 9%",
    muted: "0 0% 96.1%",
    mutedForeground: "0 0% 45.1%",
    accent: "0 0% 96.1%",
    accentForeground: "0 0% 9%",
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "0 0% 98%",
    border: "0 0% 89.8%",
    input: "0 0% 89.8%",
    ring: "0 0% 3.9%",
  },
  dark: {
    background: "0 0% 3.9%",
    foreground: "0 0% 98%",
    card: "0 0% 3.9%",
    cardForeground: "0 0% 98%",
    primary: "0 0% 98%",
    primaryForeground: "0 0% 9%",
    secondary: "0 0% 14.9%",
    secondaryForeground: "0 0% 98%",
    muted: "0 0% 14.9%",
    mutedForeground: "0 0% 63.9%",
    accent: "0 0% 14.9%",
    accentForeground: "0 0% 98%",
    destructive: "0 62.8% 30.6%",
    destructiveForeground: "0 0% 98%",
    border: "0 0% 14.9%",
    input: "0 0% 14.9%",
    ring: "0 0% 83.1%",
  },
} as const;

export const tokens = { radius, spacing, typography, colors } as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;
