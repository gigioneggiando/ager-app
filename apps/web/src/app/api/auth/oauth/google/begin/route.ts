import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { backendUrl } from "@/lib/server/backend";

/** Single-use OAuth nonce cookie on the FRONTEND origin (HttpOnly — never read by JS). */
const NONCE_COOKIE = "ager_oauth_nonce";

/**
 * Step 1 of Google sign-in. Mint a one-time nonce from the backend, persist it as an
 * HttpOnly cookie on our own origin, and return it to the client so it can be forwarded
 * to Google as the OIDC `nonce`. The backend validates the id_token's nonce against this
 * cookie on the exchange step, so a stolen/replayed id_token cannot be redeemed here.
 */
export async function POST() {
  let res: Response;
  try {
    res = await fetch(backendUrl("/api/auth/oauth/google/begin"), {
      method: "POST",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "begin_failed" }, { status: 502 });
  }

  const data = (await res.json().catch(() => null)) as { nonce?: string } | null;
  const nonce = data?.nonce;
  if (!nonce) {
    return NextResponse.json({ error: "begin_failed" }, { status: 502 });
  }

  const store = await cookies();
  store.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min — matches the backend nonce TTL
  });

  return NextResponse.json({ nonce }, { headers: { "Cache-Control": "no-store" } });
}
