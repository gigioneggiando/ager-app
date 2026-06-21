import { defineRouting } from "next-intl/routing";

/**
 * Locale routing. Default locale is `it` (Italian); `en` is the secondary locale.
 * `localePrefix: "always"` keeps URLs explicit (/it, /en) and avoids ambiguous roots.
 */
export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
