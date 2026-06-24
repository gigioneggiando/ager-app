import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Un-mute a topic. Idempotent → 204. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ interestId: string }> },
) {
  const { interestId } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/me/muted-interests/${encodeURIComponent(interestId)}`,
      { method: "DELETE" },
    ),
  );
}
