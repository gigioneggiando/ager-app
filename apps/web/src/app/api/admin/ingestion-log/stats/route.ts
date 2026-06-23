import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Ingestion stats over a window (default 14 days) → per-(day, source) buckets. */
export async function GET(request: Request) {
  const days = new URL(request.url).searchParams.get("days");
  const qs = days ? `?days=${encodeURIComponent(days)}` : "";
  return relayResponse(
    await authedBackendFetch(`/api/admin/ingestion-log/stats${qs}`),
  );
}
