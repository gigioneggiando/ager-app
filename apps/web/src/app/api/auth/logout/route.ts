import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/server/backend";
import { clearSessionCookies, readRefreshToken } from "@/lib/server/auth-cookies";

/** Revoke the refresh token on the backend (best-effort) and clear local cookies. */
export async function POST() {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    try {
      await authedBackendFetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Even if the backend revoke fails, clear the local session below.
    }
  }
  await clearSessionCookies();
  return new NextResponse(null, { status: 204 });
}
