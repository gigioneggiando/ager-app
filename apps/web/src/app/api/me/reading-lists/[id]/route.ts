import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Delete a reading list. The default "Salvati" list is protected by the backend. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(`/api/me/reading-lists/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}
