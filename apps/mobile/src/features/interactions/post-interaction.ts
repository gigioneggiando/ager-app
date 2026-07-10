import { apiClient } from "@/lib/api/client";

/** The interaction names the backend binds (PostInteractionRequest.type, by NAME). */
export type InteractionType = "OPENED_EXTERNAL" | "SAVE" | "DISCARD" | "SHARE";

/**
 * Record a user interaction with an article. Returns whether the backend accepted it.
 * Anonymous callers get a 401 (the Bearer middleware attaches nothing) — expected, so
 * callers gate on auth. Never logs PII.
 */
export async function postInteraction(
  articleId: number,
  type: InteractionType,
  reason?: string,
): Promise<boolean> {
  const { response } = await apiClient.POST("/api/interactions", {
    body: { articleId, type, reason },
  });
  return response.ok;
}
