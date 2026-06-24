import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** The sources the caller has muted (id + name) for the mute manager. */
export async function GET() {
  return relayResponse(await authedBackendFetch("/api/me/muted-sources"));
}
