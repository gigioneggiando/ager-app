import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next 16 "proxy" convention (formerly middleware). next-intl locale negotiation +
// routing. (No custom auth proxy yet — auth lands in a later prompt via route handlers.)
export default createMiddleware(routing);

export const config = {
  // Match all paths except API routes, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
