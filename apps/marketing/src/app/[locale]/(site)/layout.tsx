import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Chrome for the marketing site proper.
 *
 * It lives here rather than in the locale layout so the `/beta` funnel can run
 * without header or footer: inside the funnel every outbound link is a lost
 * sign-up (see the waitlist plan in Ager's Tieto).
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
