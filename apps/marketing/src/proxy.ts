import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Next.js proxy (the renamed "middleware" convention in Next 16). Runs next-intl locale
 * negotiation: the apex root (`/`) redirects to `/it` or `/en` by Accept-Language, and the
 * explicit /it, /en prefixes are enforced. The marketing site is a standalone app, so this
 * does not touch the main app's routing.
 */
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, Vercel internals, and any path with a file extension (assets).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
