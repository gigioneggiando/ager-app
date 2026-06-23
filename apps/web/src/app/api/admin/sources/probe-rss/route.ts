import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Validate an RSS feed URL before creating a source. Body: { rssUrl } → 200 RssProbeResponse. */
export async function POST(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/admin/sources/probe-rss", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
