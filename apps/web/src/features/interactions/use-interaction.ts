"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { useSession } from "@/components/auth/auth-provider";

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

/**
 * Returns a click handler that records OPENED_EXTERNAL — the primary positive engagement
 * signal in this link-first product — whenever a signed-in user opens an article on the
 * publisher. Shared by every surface that links out (feed card, reading-list items, the
 * public list view) so the signal fires identically everywhere. Anonymous users can't
 * interact, so it is a no-op for them (expected); `keepalive` (in `postInteraction`) lets
 * the POST survive the tab opening the publisher. The link itself still opens regardless.
 */
export function useOpenExternal() {
  const { isAuthenticated } = useSession();
  const { mutate } = useInteraction();
  return useCallback(
    (articleId: number | null | undefined) => {
      if (isAuthenticated && articleId != null) {
        mutate({ articleId, type: "OPENED_EXTERNAL" });
      }
    },
    [isAuthenticated, mutate],
  );
}
