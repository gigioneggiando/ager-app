import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { AuthResult, MyInterest } from "@ager/api-client";

import { authedBackendFetch } from "@/lib/server/backend";
import { setSessionCookies } from "@/lib/server/auth-cookies";
import { relayResponse } from "@/lib/server/relay";

const NONCE_COOKIE = "ager_oauth_nonce";

/**
 * Step 2 of Google sign-in: exchange the id_token (returned by Google in the callback
 * fragment) for a session. We read the single-use nonce cookie, forward it to the backend
 * so it can validate the id_token binding, and — like login verify — store the returned
 * token pair as HttpOnly cookies (tokens never reach browser JS). A soft-deleted account
 * comes back as 403 `account_deleted`, which we relay so the client can offer restore.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    idToken?: unknown;
  } | null;
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  if (!idToken) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const store = await cookies();
  const nonce = store.get(NONCE_COOKIE)?.value;
  // The nonce is single-use: clear it eagerly regardless of how the exchange ends.
  store.delete(NONCE_COOKIE);
  if (!nonce) {
    return NextResponse.json({ error: "nonce_missing" }, { status: 400 });
  }

  const res = await authedBackendFetch("/api/auth/oauth/google", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Forward the nonce as the backend expects it (ager_oauth_nonce cookie); the CSRF
      // handshake in authedBackendFetch appends XSRF-TOKEN to this same header.
      cookie: `${NONCE_COOKIE}=${nonce}`,
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    // 401 invalid/expired id_token · 403 account_deleted/disabled · 429 — relay for the UI.
    return relayResponse(res);
  }

  const auth = (await res.json()) as AuthResult;
  await setSessionCookies(auth);

  return NextResponse.json({
    userId: auth.userId,
    role: auth.role,
    needsOnboarding: await hasNoInterests(),
  });
}

/** True when the just-signed-in user has no interests yet (→ onboarding). */
async function hasNoInterests(): Promise<boolean> {
  try {
    const res = await authedBackendFetch("/api/me/interests");
    if (!res.ok) return false;
    const interests = (await res.json()) as MyInterest[];
    return Array.isArray(interests) && interests.length === 0;
  } catch {
    return false;
  }
}
