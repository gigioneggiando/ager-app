import type { ThemePreference } from "@ager/shared";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { buildTheme, type ColorScheme, type Theme } from "./theme";

interface ThemeContextValue {
  /** The resolved theme (already degraded to light while dark is unsigned). */
  theme: Theme;
  /** The scheme actually being rendered. */
  scheme: ColorScheme;
  /** User preference: 'system' follows the OS, otherwise forced. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Resolves the palette from the device color scheme + the user's preference.
 *
 * NOTE: `preference` currently lives in component state and defaults to 'system'. When the
 * persistent storage layer arrives (alongside the M2 secure-store session), swap the
 * useState seed for a stored value and persist in `setPreference` — the resolver below
 * stays unchanged.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");

  const value = useMemo<ThemeContextValue>(() => {
    // useColorScheme() can yield 'light' | 'dark' | 'unspecified' | null — anything that
    // isn't an explicit 'dark' maps to light.
    const deviceScheme: ColorScheme =
      systemScheme === "dark" ? "dark" : "light";
    const requested: ColorScheme =
      preference === "system" ? deviceScheme : preference;
    const theme = buildTheme(requested);
    return { theme, scheme: theme.scheme, preference, setPreference };
  }, [preference, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>.");
  }
  return ctx;
}

/** The resolved theme (colors, spacing, radius, type — all in dp). */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Read + change the light/dark/system preference. */
export function useThemePreference() {
  const { preference, setPreference, scheme } = useThemeContext();
  return { preference, setPreference, scheme };
}
