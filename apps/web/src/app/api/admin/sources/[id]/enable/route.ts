import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Re-enable a source for ingestion. → 204. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/admin/sources/${encodeURIComponent(id)}/enable`,
      { method: "POST" },
    ),
  );
}
