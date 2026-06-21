import { NextResponse } from "next/server";

import { getSession } from "@/lib/server/session";

/** Current session snapshot for the client AuthProvider to (re)read after login/logout. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { session },
    { headers: { "Cache-Control": "no-store" } },
  );
}
