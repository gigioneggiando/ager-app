import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { resolveSentryIngestOrigin } from "./src/lib/observability/sentry-shared";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

/**
 * Strict CSP for the marketing site. It is a static, public, no-auth surface: backend
 * is never called (the only outbound link is a top-level navigation to the app), so
 * `form-action` stays `'self'`. `'unsafe-inline'` is required by Next's inline bootstrap +
 * Tailwind inline styles (no nonce middleware); `'unsafe-eval'`/`ws:` are dev-only (HMR).
 * `frame-ancestors 'none'` mirrors the app's hardening.
 *
 * The only allowed `connect-src` beyond `'self'` is the Sentry/GlitchTip ingest origin (when
 * a DSN is configured), so the browser SDK can POST error events. It is null without a DSN,
 * leaving the policy unchanged.
 */
function buildContentSecurityPolicy(): string {
  const sentryIngestOrigin = resolveSentryIngestOrigin();
  const connectSrc = ["'self'"];
  if (sentryIngestOrigin) connectSrc.push(sentryIngestOrigin);
  if (isDev) connectSrc.push("ws:");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The brand tokens (brand.css) ship from the shared workspace package as raw assets.
  transpilePackages: ["@ager/shared"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
