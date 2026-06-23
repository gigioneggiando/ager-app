import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * GDPR data export (Art. 15). Relays the backend's JSON payload (200) or the 429 cooldown
 * (1 export / 24h). The client turns the 200 body into a file download; relayResponse
 * preserves the JSON content-type and status.
 */
export async function GET() {
  return relayResponse(await authedBackendFetch("/api/me/export"));
}
