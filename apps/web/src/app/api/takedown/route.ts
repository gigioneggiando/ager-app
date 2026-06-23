import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * Public DSA Art. 16 takedown notice. Anonymous + rate-limited server-side (3/min/IP). Goes
 * through the same-origin proxy (no CORS); authedBackendFetch performs the CSRF handshake and
 * attaches a Bearer only if a session cookie happens to exist. Body:
 * { articleId? | sourceId?, requesterEmail, requesterRole, reason, honeypot? } → 201 { requestId }.
 */
export async function POST(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/takedown", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
