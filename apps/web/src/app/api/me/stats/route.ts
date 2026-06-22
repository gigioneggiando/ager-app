import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Reading-variety stats for the caller over a window (e.g. 7d / 14d / 30d). */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const window = incoming.get("window");
  if (window) query.set("window", window);
  const qs = query.toString();

  return relayResponse(
    await authedBackendFetch(`/api/me/stats${qs ? `?${qs}` : ""}`),
  );
}
