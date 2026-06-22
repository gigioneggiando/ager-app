import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** The caller's current interests (server truth for onboarding state + the editor). */
export async function GET() {
  return relayResponse(await authedBackendFetch("/api/me/interests"));
}

/** Replace the caller's interests. Body: { interestIds: number[] }. */
export async function POST(request: Request) {
  const body = await request.text();
  return relayResponse(
    await authedBackendFetch("/api/me/interests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}
