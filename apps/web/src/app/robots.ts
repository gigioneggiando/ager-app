import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

/**
 * Private app sections. These are already per-page `noindex`; the robots Disallow is the
 * crawl-time complement so well-behaved bots never fetch them. Listed once here without a
 * locale prefix and expanded for every locale below (routing is `localePrefix: "always"`,
 * so the real paths are /it/me, /en/me, …).
 */
const PRIVATE_PATHS = [
  "/me",
  "/admin",
  "/login",
  "/register",
  "/oauth",
  "/onboarding",
  "/restore",
];

/**
 * /robots.txt — allow the public crawl, keep the API and the private/auth/admin areas out
 * of the index, and point crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api",
    ...routing.locales.flatMap((locale) =>
      PRIVATE_PATHS.map((path) => `/${locale}${path}`),
    ),
  ];

  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
