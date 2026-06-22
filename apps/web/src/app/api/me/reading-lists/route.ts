import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** List the caller's reading lists. */
export async function GET() {
  return relayResponse(await authedBackendFetch("/api/me/reading-lists"));
}

/** Create a reading list. Body: { name, description?, visibility?, allowCollaboration? }. */
export async function POST(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/me/reading-lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
