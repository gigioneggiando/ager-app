import { cookies } from "next/headers";

import { authedBackendFetch } from "@/lib/server/backend";
import { getSession } from "@/lib/server/session";
import { relayResponse } from "@/lib/server/relay";

const ONBOARDED_COOKIE = "ager_onboarded";

/**
 * Save the caller's interests (authed + CSRF via the proxy). On success, mark the user as
 * onboarded (per-user cookie) so we don't re-trigger onboarding on the next login.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const res = await authedBackendFetch("/api/me/interests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  if (res.ok) {
    const session = await getSession();
    if (session?.userId) {
      (await cookies()).set(ONBOARDED_COOKIE, session.userId, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }
  return relayResponse(res);
}
