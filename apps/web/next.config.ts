import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages are shipped as raw TS and transpiled by Next.
  transpilePackages: ["@ager/shared", "@ager/api-client"],
  // Article images are hotlinked from publishers (link-first). Allow any https host
  // via next/image remote patterns; tightened to a source allowlist in a later prompt.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default withNextIntl(nextConfig);
