import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthResult } from "@ager/api-client";

import { authedBackendFetch } from "@/lib/server/backend";
import { setSessionCookies } from "@/lib/server/auth-cookies";
import { relayResponse } from "@/lib/server/relay";

/**
 * Step 2 of login: verify the OTP code. POST { email, code }. On success the backend
 * returns the token pair, which we store as HttpOnly cookies server-side — the tokens
 * never reach browser JS. We return only non-sensitive session info.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    code?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!email || !code) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const res = await authedBackendFetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, otpCode: code }),
  });

  if (!res.ok) {
    // 401 wrong/expired code · 429 rate-limited · etc. — relay for UI messaging.
    return relayResponse(res);
  }

  const auth = (await res.json()) as AuthResult;
  await setSessionCookies(auth);

  // Onboard once per user: trigger the interests flow unless this user already completed it
  // (tracked by the ager_onboarded cookie set on save/skip).
  const onboarded = (await cookies()).get("ager_onboarded")?.value;
  const needsOnboarding = onboarded !== auth.userId;

  return NextResponse.json({
    userId: auth.userId,
    role: auth.role,
    needsOnboarding,
  });
}
