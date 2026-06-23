import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Admin ingestion-log list (filters: sourceId, from, to, errorsOnly, page, pageSize). */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["sourceId", "from", "to", "errorsOnly", "page", "pageSize"]) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return relayResponse(
    await authedBackendFetch(`/api/admin/ingestion-log${qs ? `?${qs}` : ""}`),
  );
}
