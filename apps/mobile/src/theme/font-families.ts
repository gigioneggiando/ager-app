/**
 * Font family names as registered with expo-font (see ./fonts.ts). Kept separate from the
 * loader so the theme can reference family names without pulling the .ttf assets into
 * non-UI code (e.g. unit tests). Serif = Merriweather (headings/wordmark), Sans = Inter
 * (UI/body) — matching @ager/shared typography.
 */
export const fontFamilies = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  serif: "Merriweather_400Regular",
  serifBold: "Merriweather_700Bold",
} as const;

export type FontFamilies = typeof fontFamilies;
