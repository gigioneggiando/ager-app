import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Admin source detail. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(`/api/admin/sources/${encodeURIComponent(id)}`),
  );
}

/** Patch governance fields: licensing, negotiation, contact, notes, image-hotlinking. → 204. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch(`/api/admin/sources/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
