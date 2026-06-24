/**
 * Canonical origin for the app (app.agerculture.com in prod). Single source of truth for
 * canonicals, robots.txt, and the sitemap. Mirrors the `metadataBase` fallback chain:
 * explicit env → Vercel deploy URL → localhost for local dev.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
