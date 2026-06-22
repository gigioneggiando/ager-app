import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Admin takedown-request detail. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(`/api/admin/takedown/${encodeURIComponent(id)}`),
  );
}

/**
 * Resolve a takedown request. Body: { actionTaken: "removed"|"disputed"|"referred"|"none",
 * responseNotes? }. The backend cascades "removed"/"disputed" to the target article's takedown
 * status in the same transaction, so no separate article call is needed.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch(`/api/admin/takedown/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
