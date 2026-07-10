/**
 * Design tokens — TS mirror of the AGER brand for non-CSS consumers (mobile later,
 * docs, tests). The canonical CSS source of truth is packages/shared/styles/brand.css,
 * imported by apps/web globals. Keep the two in sync; swap the palette in ONE place.
 *
 * LIGHT-FIRST: the brand defines no dark palette. There is intentionally no dark color
 * set here — do not add one without owner sign-off.
 */

/** Raw brand palette (hex). */
export const brand = {
  agerBlue: "#0F2A44",
  editorialWhite: "#F9FAF7",
  neutralBeige: "#EFE9DF",
  inkGray: "#1C1C1C",
  mutedGray: "#6B7280",
  ethicalGreen: "#1E6F5C",
} as const;

/** Functional / state colors. */
export const state = {
  link: "#1A5FB4",
  success: "#2E8B57",
  warning: "#D97706",
  error: "#B42318",
} as const;

/**
 * Recommended usage budget from the brand book (coherence cross-app):
 * ~60% neutrals (white + beige), ~25% blue, ~10% green accent, ~5% functional.
 */
export const usageBudget = {
  neutrals: 0.6,
  agerBlue: 0.25,
  ethicalGreen: 0.1,
  functional: 0.05,
} as const;

/**
 * Semantic color tokens — mirrors brand.css. `light` is the brand's canonical palette;
 * `dark` is the signed-off dark override (same keys, hex values only). The web app drives
 * theming from the CSS `:root.dark` block; this TS mirror is for non-CSS consumers (the
 * mobile RN adapter consumes `colors.dark` later — not wired here).
 *
 * NOTE: `dark.success` / `dark.warning` and the resolved `*Foreground` picks are DERIVED
 * (brightened to meet contrast on #0D1720) and pending Simone's sign-off.
 */
export const colors = {
  light: {
    background: brand.editorialWhite,
    foreground: brand.inkGray,
    card: brand.editorialWhite,
    cardForeground: brand.inkGray,
    popover: brand.editorialWhite,
    popoverForeground: brand.inkGray,
    primary: brand.agerBlue,
    primaryForeground: brand.editorialWhite,
    secondary: brand.neutralBeige,
    secondaryForeground: brand.agerBlue,
    muted: brand.neutralBeige,
    mutedForeground: brand.mutedGray,
    accent: brand.ethicalGreen,
    accentForeground: brand.editorialWhite,
    destructive: state.error,
    destructiveForeground: brand.editorialWhite,
    link: state.link,
    success: state.success,
    warning: state.warning,
    border: "#E4DDD0",
    input: "#E4DDD0",
    ring: brand.agerBlue,
  },
  dark: {
    background: "#0D1720",
    foreground: "#E8ECEF",
    card: "#152232",
    cardForeground: "#E8ECEF",
    popover: "#1B2A3A",
    popoverForeground: "#E8ECEF",
    primary: "#6EA8D8",
    primaryForeground: "#0D1720",
    secondary: "#111C27",
    secondaryForeground: "#E8ECEF",
    muted: "#111C27",
    mutedForeground: "#9AA7B4",
    accent: "#43B092",
    accentForeground: "#0D1720",
    destructive: "#E5706B",
    destructiveForeground: "#0D1720",
    link: "#6EA8D8",
    success: "#4CC38A",
    warning: "#E0A44D",
    border: "#546B82",
    input: "#546B82",
    ring: "#6EA8D8",
  },
} as const;

export const radius = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  /** Feed/thumbnail image radius (owner-approved; brand 80px is near-circular here). */
  image: "16px",
  /** Reserved for large/hero imagery only — the brand's literal photo radius. */
  imageLg: "80px",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const typography = {
  /** Serif — headings + wordmark. */
  fontSerif:
    'var(--font-merriweather), Merriweather, ui-serif, Georgia, Cambria, "Times New Roman", serif',
  /** Sans — UI + body. */
  fontSans:
    'var(--font-inter), Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  leading: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.6,
    relaxed: 1.75,
  },
  /**
   * Layered editorial hierarchy: sintesi (the gist) → contesto (context) →
   * approfondimento (depth). Maps to the visual type scale.
   */
  scale: {
    display: "3rem", // 48 — hero / wordmark display
    h1: "2.25rem", // 36 — sintesi
    h2: "1.75rem", // 28
    h3: "1.375rem", // 22 — contesto
    h4: "1.125rem", // 18
    body: "1rem", // 16 — approfondimento / body
    small: "0.875rem", // 14 — metadata
    caption: "0.75rem", // 12 — caption / timestamp
  },
} as const;

/** Logo constraints from the brand book. */
export const logo = {
  /** Clear space = 14% of the symbol's size on every side. */
  clearSpaceRatio: 0.14,
  /** Minimum digital sizes (px). */
  minSize: {
    primary: 120,
    icon: 32,
  },
} as const;

export const tokens = {
  brand,
  state,
  colors,
  radius,
  spacing,
  typography,
  logo,
  usageBudget,
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;
