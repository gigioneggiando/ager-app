import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

/**
 * Static public routes (locale prefix added below). A full dynamic article/source sitemap
 * is out of scope; this is the canonical public set plus the sources index. Auth, admin,
 * and dynamic-id pages are intentionally excluded (they are `noindex` / not crawlable).
 */
const PUBLIC_PATHS = [
  "",
  "/sources",
  "/chi-siamo",
  "/dsa-contact",
  "/bot",
  "/privacy",
  "/termini",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
      // hreflang alternates so each locale variant points at the others.
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );
}
