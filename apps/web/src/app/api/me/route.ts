import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Authenticated proxy: GET the caller's profile (Bearer from cookie, refresh on 401). */
export async function GET() {
  const res = await authedBackendFetch("/api/me");
  return relayResponse(res);
}

/** Update the caller's profile. Body: { username?, avatarUrl?, locale?, timezone? } → 200 profile. */
export async function PATCH(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}

/** Soft-delete the caller's account (backend revokes refresh tokens). → 204. */
export async function DELETE() {
  return relayResponse(
    await authedBackendFetch("/api/me", { method: "DELETE" }),
  );
}
