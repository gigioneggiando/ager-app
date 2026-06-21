import { NextResponse } from "next/server";

import { refreshSession } from "@/lib/server/backend";

/** Silent refresh: swap the HttpOnly refresh cookie for a fresh token pair. */
export async function POST() {
  const access = await refreshSession();
  if (!access) {
    return NextResponse.json({ error: "refresh_failed" }, { status: 401 });
  }
  return new NextResponse(null, { status: 204 });
}
