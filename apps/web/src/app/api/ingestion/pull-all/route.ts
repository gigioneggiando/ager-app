import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Admin: enqueue an immediate ingestion of all active sources. → 200. */
export async function POST() {
  return relayResponse(
    await authedBackendFetch("/api/ingestion/pull-all", { method: "POST" }),
  );
}
