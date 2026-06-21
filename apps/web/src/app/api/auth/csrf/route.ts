import { NextResponse } from "next/server";

import { backendUrl } from "@/lib/server/backend";

/**
 * Seed a double-submit CSRF token. Fetches the backend antiforgery token and exposes it to
 * the browser (XSRF-TOKEN cookie readable by JS + token in the body). Note: the frontend's
 * own mutating route handlers are primarily protected by SameSite cookies; this endpoint
 * exists for completeness and any browser double-submit flow.
 */
export async function GET() {
  const res = await fetch(backendUrl("/api/auth/csrf"), {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "csrf_unavailable" }, { status: 502 });
  }

  const body = (await res.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token ?? "";

  const response = NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store" } },
  );
  // Readable by JS (double-submit primitive). Pairs with the backend antiforgery cookie.
  response.cookies.set("XSRF-TOKEN", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
