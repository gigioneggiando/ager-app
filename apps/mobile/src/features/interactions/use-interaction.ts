import { useSession } from "@ager/auth";
import { useCallback } from "react";

import {
  openArticle,
  openInBrowser,
  type OpenableArticle,
} from "@/features/feed/open-at-source";
import { apiClient } from "@/lib/api/client";

import { postInteraction } from "./post-interaction";

export { postInteraction, type InteractionType } from "./post-interaction";

/**
 * Returns `openArticle(item)` — opens the publisher (link-first) and fires OPENED_EXTERNAL
 * for signed-in users. Shared by every surface that links out so the signal fires
 * identically. Anonymous users open the article but record nothing (expected).
 */
export function useOpenArticle(): (item: OpenableArticle) => Promise<boolean> {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return useCallback(
    (item: OpenableArticle) =>
      openArticle(item, {
        isAuthenticated,
        open: openInBrowser,
        track: (articleId) => {
          void postInteraction(articleId, "OPENED_EXTERNAL");
        },
      }),
    [isAuthenticated],
  );
}

/**
 * Open an article by id. Search results carry no publisher URL, so fetch the article detail
 * (which has it) and then open at source. Returns whether it opened.
 */
export function useOpenArticleById(): (articleId: number) => Promise<boolean> {
  const open = useOpenArticle();
  return useCallback(
    async (articleId: number) => {
      const { data } = await apiClient.GET("/api/articles/{id}", {
        params: { path: { id: articleId } },
      });
      if (!data) return false;
      return open({
        articleId,
        url: data.url,
        canonicalUrl: data.canonicalUrl,
        displayMode: data.displayMode,
      });
    },
    [open],
  );
}
