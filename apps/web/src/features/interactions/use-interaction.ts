"use client";

import { useMutation } from "@tanstack/react-query";

/** The interaction names the backend binds (PostInteractionRequest.Type, by NAME). */
export type InteractionType =
  | "OPENED_EXTERNAL"
  | "SAVE"
  | "DISCARD"
  | "SHARE";

export async function postInteraction(
  articleId: number,
  type: InteractionType,
  reason?: string,
): Promise<boolean> {
  const res = await fetch("/api/interactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ articleId, type, reason }),
    // Survive the tab navigating away when opening the publisher.
    keepalive: type === "OPENED_EXTERNAL",
  });
  return res.ok;
}

export function useInteraction() {
  return useMutation({
    mutationFn: (vars: {
      articleId: number;
      type: InteractionType;
      reason?: string;
    }) => postInteraction(vars.articleId, vars.type, vars.reason),
  });
}
