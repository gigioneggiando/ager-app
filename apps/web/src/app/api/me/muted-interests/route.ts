import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** The topics the caller has muted ("non mi interessa questo argomento"). */
export async function GET() {
  return relayResponse(await authedBackendFetch("/api/me/muted-interests"));
}

/** Mute a topic (hard exclusion from the feed). Body: { interestId: number }. Idempotent. */
export async function POST(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/me/muted-interests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
