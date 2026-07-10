import { radius, spacing, typography } from "@ager/shared";

import { colors, hasDarkPalette, type ThemeColors } from "./colors";
import { fontFamilies, type FontFamilies } from "./font-families";
import { mapToDp } from "./scale";

export type ColorScheme = "light" | "dark";

/** Brand spacing / radius / type scale, converted from CSS strings to dp once, up front. */
export const spacingDp = mapToDp(spacing);
export const radiusDp = mapToDp(radius);
export const fontSizeDp = mapToDp(typography.scale);

/** Line heights are unitless multipliers and weights are numeric — both pass through as-is. */
export const lineHeight = typography.leading;
export const fontWeight = typography.weight;

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacingDp;
  radius: typeof radiusDp;
  fontSize: typeof fontSizeDp;
  lineHeight: typeof lineHeight;
  fontWeight: typeof fontWeight;
  fonts: FontFamilies;
}

/**
 * Resolve a requested scheme to one we can actually render. Dark isn't signed off yet, so
 * a 'dark' request degrades to light until ./colors exposes a dark palette (see the seam).
 */
export function resolveScheme(scheme: ColorScheme): ColorScheme {
  return scheme === "dark" && hasDarkPalette ? "dark" : "light";
}

export function buildTheme(scheme: ColorScheme): Theme {
  const resolved = resolveScheme(scheme);
  const palette =
    resolved === "dark" && colors.dark ? colors.dark : colors.light;
  return {
    scheme: resolved,
    colors: palette,
    spacing: spacingDp,
    radius: radiusDp,
    fontSize: fontSizeDp,
    lineHeight,
    fontWeight,
    fonts: fontFamilies,
  };
}

/** Prebuilt light theme — the default until a dark palette is approved. */
export const lightTheme = buildTheme("light");
