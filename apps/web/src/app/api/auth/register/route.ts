import { NextResponse } from "next/server";
import type { AuthResult } from "@ager/api-client";

import { authedBackendFetch } from "@/lib/server/backend";
import { setSessionCookies } from "@/lib/server/auth-cookies";
import { relayResponse } from "@/lib/server/relay";

/**
 * Step 2 of registration: verify the OTP and create the account. POST
 * { username, email, code, password? }. On success the backend returns the token pair (same
 * as login) — we store it as HttpOnly cookies server-side, so the user is authenticated
 * immediately. Tokens never reach browser JS. A brand-new account has no interests, so the
 * client routes straight to onboarding.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
    email?: unknown;
    code?: unknown;
    password?: unknown;
  } | null;

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const password =
    typeof body?.password === "string" && body.password ? body.password : undefined;
  if (!username || !email || !code) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const res = await authedBackendFetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, email, otpCode: code, password }),
  });

  if (!res.ok) {
    // 400 invalid/expired code · 409 already registered · 429 rate-limited — relay for UI.
    return relayResponse(res);
  }

  const auth = (await res.json()) as AuthResult;
  await setSessionCookies(auth);

  return NextResponse.json({
    userId: auth.userId,
    role: auth.role,
    needsOnboarding: true,
  });
}
