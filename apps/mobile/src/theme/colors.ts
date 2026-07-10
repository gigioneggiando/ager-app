import { colors as brandColors } from "@ager/shared";

/** Semantic light palette — the brand's single source of truth (mirrors brand.css). */
export const light = brandColors.light;

/** Semantic color slots (widened to string so light + dark share the shape). */
export type ThemeColors = { readonly [K in keyof typeof light]: string };

/**
 * Dark palette — now signed off in @ager/shared, so it's wired here (M5). `useTheme()`
 * honours the dark scheme automatically via the resolver + `hasDarkPalette`.
 */
export const dark: ThemeColors | null = brandColors.dark;

export const colors = { light, dark } as const;

/** Whether a usable dark palette has been signed off. */
export const hasDarkPalette = dark !== null;
