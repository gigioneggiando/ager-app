import { apiClient } from "@/lib/api/client";

/** Mute a topic feed-wide by interest id (body-keyed). Idempotent server-side. */
export async function muteInterest(interestId: number): Promise<boolean> {
  const { response } = await apiClient.POST("/api/me/muted-interests", {
    body: { interestId },
  });
  return response.ok;
}

/** Mute a source feed-wide by id (path-keyed, no body). Idempotent server-side. */
export async function muteSource(sourceId: number): Promise<boolean> {
  const { response } = await apiClient.POST(
    "/api/me/muted-sources/{sourceId}",
    {
      params: { path: { sourceId } },
    },
  );
  return response.ok;
}
