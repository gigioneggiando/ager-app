/**
 * Cross-site URLs. The marketing site lives on the apex (agerculture.com); the app lives
 * on app.agerculture.com. The "Apri Ager" CTA and the legal/about footer links are
 * top-level navigations to the app, so they are absolute URLs (not next-intl <Link>s).
 */
/**
 * Treat empty/whitespace-only env values as unset. Vercel projects can carry an env var
 * set to "" — `??` would not fall back on that, leaving APP_URL/SITE_URL empty and turning
 * appUrl() into a relative path that loops back to the landing.
 */
const envUrl = (v?: string) => (v && v.trim() ? v.trim() : undefined);

export const APP_URL =
  envUrl(process.env.NEXT_PUBLIC_APP_URL) ?? "https://app.agerculture.com";

export const SITE_URL =
  envUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  (envUrl(process.env.VERCEL_URL)
    ? `https://${envUrl(process.env.VERCEL_URL)}`
    : "https://agerculture.com");

/** A path on the app (app.agerculture.com), locale-prefixed to match its routing. */
export function appUrl(locale: string, path = ""): string {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${APP_URL}/${locale}${clean}`;
}
