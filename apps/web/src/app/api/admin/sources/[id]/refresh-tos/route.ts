import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Re-fetch + hash the source's ToS. → 200 { previousHash, currentHash, changed }. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/admin/sources/${encodeURIComponent(id)}/refresh-tos`,
      { method: "POST" },
    ),
  );
}
