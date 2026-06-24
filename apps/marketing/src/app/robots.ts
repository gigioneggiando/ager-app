import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * /robots.txt for the apex landing — allow everything (the marketing site is entirely
 * public) and point crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
