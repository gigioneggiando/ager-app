import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Mute a source (hard exclusion from the feed). Path-keyed, no body. Idempotent → 204. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const { sourceId } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/me/muted-sources/${encodeURIComponent(sourceId)}`,
      { method: "POST" },
    ),
  );
}

/** Un-mute a source. Idempotent → 204. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const { sourceId } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/me/muted-sources/${encodeURIComponent(sourceId)}`,
      { method: "DELETE" },
    ),
  );
}
