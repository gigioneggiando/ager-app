import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/server/session";

const ONBOARDED_COOKIE = "ager_onboarded";

/** Mark the user as onboarded without saving interests (skippable onboarding). */
export async function POST() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  (await cookies()).set(ONBOARDED_COOKIE, session.userId, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return new NextResponse(null, { status: 204 });
}
