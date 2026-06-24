import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Promote a suggested interest to an explicit interest. Idempotent → 204. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ interestId: string }> },
) {
  const { interestId } = await params;
  return relayResponse(
    await authedBackendFetch(
      `/api/me/suggested-interests/${encodeURIComponent(interestId)}/confirm`,
      { method: "POST" },
    ),
  );
}
