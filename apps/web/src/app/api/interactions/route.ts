import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * Record a user interaction (authed + CSRF via the proxy). Body:
 * { articleId, type: "OPENED_EXTERNAL" | "SAVE" | "DISCARD" | "SHARE", reason? }.
 * The backend binds `type` by NAME.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const res = await authedBackendFetch("/api/interactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return relayResponse(res);
}
