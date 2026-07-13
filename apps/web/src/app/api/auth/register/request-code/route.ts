import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * Step 1 of registration: ask the backend to email a sign-up OTP. POST
 * { username, email, honeypot?, captchaToken? }. The backend enforces the honeypot always and
 * hCaptcha only when configured (currently disabled → any token passes). Relays conflicts
 * (409 email/username already registered), 400 (honeypot/captcha rejected) and 429 for the UI.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
    email?: unknown;
    honeypot?: unknown;
    captchaToken?: unknown;
    locale?: unknown;
  } | null;

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!username || !email) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const res = await authedBackendFetch("/api/auth/register/request-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      honeypot: typeof body?.honeypot === "string" ? body.honeypot : undefined,
      captchaToken:
        typeof body?.captchaToken === "string" && body.captchaToken
          ? body.captchaToken
          : undefined,
      locale: typeof body?.locale === "string" ? body.locale : undefined,
    }),
  });

  if (res.ok) return new NextResponse(null, { status: 204 });
  return relayResponse(res);
}
