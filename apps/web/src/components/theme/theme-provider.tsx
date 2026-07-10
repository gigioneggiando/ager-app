"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * App-wide theme provider. Wraps next-themes:
 * - `attribute="class"` toggles `class="dark"` on <html> — matches the `@custom-variant
 *   dark (&:is(.dark *))` in globals.css and the `:root.dark` token block in brand.css.
 * - `defaultTheme="system"` + `enableSystem` follow the OS preference until the user picks.
 * - `disableTransitionOnChange` avoids a colour-transition sweep when the theme flips.
 *
 * next-themes injects a tiny inline script that sets the class before first paint (no
 * flash of the wrong theme). That inline script is permitted by our CSP
 * (`script-src 'self' 'unsafe-inline'`); no external script is loaded.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
