import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from "@expo-google-fonts/merriweather";
import { useFonts } from "expo-font";

export { fontFamilies } from "./font-families";
export type { FontFamilies } from "./font-families";

/**
 * Load the brand fonts (Inter + Merriweather) via expo-font. The map keys become the
 * `fontFamily` values used in styles — they must stay in sync with ./font-families.ts.
 * Returns [loaded, error]; the root layout keeps the splash screen up until `loaded`.
 */
export function useAppFonts(): [boolean, Error | null] {
  return useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Merriweather_400Regular,
    Merriweather_700Bold,
  });
}
