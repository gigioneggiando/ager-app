import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/**
 * Admin DSA-takedown queue (list). Same-origin authed proxy — the backend enforces the
 * admin role, so a non-admin Bearer gets 403 relayed through. Forwards the queue filters.
 */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["pending", "sourceId", "recentDays", "page", "pageSize"]) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();

  return relayResponse(
    await authedBackendFetch(`/api/admin/takedown${qs ? `?${qs}` : ""}`),
  );
}
