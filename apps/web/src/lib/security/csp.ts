/**
 * Content-Security-Policy builder. Kept in its own module so it can be unit-tested and
 * imported by next.config.ts.
 *
 * Backend calls go through same-origin proxies, so `connect-src` stays `'self'`.
 * `img-src https:` allows publisher image hotlinking (link-first). `'unsafe-inline'` for
 * scripts/styles is required by Next's inline bootstrap + Tailwind inline styles (no nonce
 * middleware); `'unsafe-eval'` and `ws:` are dev-only (HMR).
 *
 * Google OAuth uses the redirect flow (top-level navigation to the provider, no Google JS
 * is loaded), so `script-src` stays tight — we do NOT add Google to `script-src`. We do
 * allow the Google origin in `frame-src` (One Tap / provider frames), `connect-src`, and
 * `form-action` so the provider hand-off is not blocked.
 */
export const GOOGLE_OAUTH_ORIGIN = "https://accounts.google.com";

export function buildContentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `frame-src ${GOOGLE_OAUTH_ORIGIN}`,
    `form-action 'self' ${GOOGLE_OAUTH_ORIGIN}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `connect-src 'self' ${GOOGLE_OAUTH_ORIGIN}${isDev ? " ws:" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
