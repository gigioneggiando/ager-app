import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Admin: trigger an immediate pull of a single source. → 200. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/ingestion/sources/${encodeURIComponent(id)}/pull`,
      { method: "POST" },
    ),
  );
}
