import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * Step 1 of account restore: ask the backend to email a restore OTP. POST { email }.
 * The backend is anti-enumeration (always 200 even if the account doesn't exist or isn't
 * deleted), so we just relay the outcome for rate-limit messaging.
 */
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

  const res = await authedBackendFetch("/api/auth/restore/request-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, locale }),
  });

  if (res.ok) return new NextResponse(null, { status: 204 });
  return relayResponse(res);
}
