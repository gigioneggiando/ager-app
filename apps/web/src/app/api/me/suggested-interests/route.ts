import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Implicit-interest candidates past the notify threshold (the "allargare il feed?" nudge). */
export async function GET() {
  return relayResponse(await authedBackendFetch("/api/me/suggested-interests"));
}
