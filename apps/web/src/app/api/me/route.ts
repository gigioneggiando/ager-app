import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Authenticated proxy: GET the caller's profile (Bearer from cookie, refresh on 401). */
export async function GET() {
  const res = await authedBackendFetch("/api/me");
  return relayResponse(res);
}
