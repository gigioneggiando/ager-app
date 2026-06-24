import { defineRouting } from "next-intl/routing";

/**
 * Locale routing for the marketing site. Mirrors the app: default `it`, secondary `en`,
 * explicit prefixes (/it, /en).
 */
export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
