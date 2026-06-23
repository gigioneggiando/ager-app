import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { buildContentSecurityPolicy } from "./src/lib/security/csp";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

const csp = buildContentSecurityPolicy(isDev);

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
  // Workspace packages are shipped as raw TS and transpiled by Next.
  transpilePackages: ["@ager/shared", "@ager/api-client"],
  // Article images are hotlinked from publishers (link-first). Allow any https host
  // via next/image remote patterns; tightened to a source allowlist in a later prompt.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
