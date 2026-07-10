import { colors as brandColors } from "@ager/shared";

/** Semantic light palette — the brand's single source of truth (mirrors brand.css). */
export const light = brandColors.light;

export type ThemeColors = typeof light;

/**
 * Dark palette — the clean seam.
 *
 * The brand deliberately ships no dark colors yet (see @ager/shared tokens: "LIGHT-FIRST:
 * the brand defines no dark palette"). Until the owner signs off, this is `null` and the
 * theme resolver falls back to light for every scheme. When dark lands, replace `null`
 * with a `ThemeColors` map here and `useTheme()` starts honouring the dark scheme
 * automatically — no other file needs to change.
 */
export const dark: ThemeColors | null = null;

export const colors = { light, dark } as const;

/** Whether a usable dark palette has been signed off. */
export const hasDarkPalette = dark !== null;
