import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * Step 2 of account restore: verify the OTP and un-delete the account. POST { email, code }.
 * The backend revokes all refresh tokens on restore and returns no session, so the user
 * must sign in afterwards — this proxy therefore sets NO session cookies.
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

  const res = await authedBackendFetch("/api/auth/restore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, otpCode: code }),
  });

  if (res.ok) return new NextResponse(null, { status: 204 });
  // 401 wrong/expired code · 429 rate-limited · 400 validation — relay for UI messaging.
  return relayResponse(res);
}
