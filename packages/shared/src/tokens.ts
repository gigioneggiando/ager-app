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

/** Semantic color tokens (light theme only — mirrors brand.css). */
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
