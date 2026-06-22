import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Remove an article from a reading list. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> },
) {
  const { id, articleId } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/me/reading-lists/${encodeURIComponent(id)}/items/${encodeURIComponent(articleId)}`,
      { method: "DELETE" },
    ),
  );
}
