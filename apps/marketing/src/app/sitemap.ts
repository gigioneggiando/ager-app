import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * The apex landing is a single page; its in-page sections (`#valori`, `#come-funziona`)
 * are the only sub-routes. Emitted for every locale (routing is `localePrefix: "always"`).
 */
const SECTIONS = ["", "#valori", "#come-funziona"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    SECTIONS.map((hash) => ({
      url: `${SITE_URL}/${locale}${hash}`,
      changeFrequency: "monthly" as const,
      priority: hash === "" ? 1 : 0.5,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}/${l}${hash}`]),
        ),
      },
    })),
  );
}
