import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Admin source list (filters: expiringIn, tdmOptout, negotiation). Backend enforces admin. */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["expiringIn", "tdmOptout", "negotiation"]) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return relayResponse(
    await authedBackendFetch(`/api/admin/sources${qs ? `?${qs}` : ""}`),
  );
}

/** Create a source. Body: { type, name, url, rssUrl?, country?, lang? } → 201 { id }. */
export async function POST(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/admin/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
