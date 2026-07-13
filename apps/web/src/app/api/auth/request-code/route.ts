import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Step 1 of login: ask the backend to email an OTP code. POST { email }. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    locale?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const locale = typeof body?.locale === "string" ? body.locale : undefined;
  if (!email) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const res = await authedBackendFetch("/api/auth/login/request-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, locale }),
  });

  // 200 (sent) / 429 (rate-limited) / other — relay status so the UI can react.
  if (res.ok) return new NextResponse(null, { status: 204 });
  return relayResponse(res);
}
