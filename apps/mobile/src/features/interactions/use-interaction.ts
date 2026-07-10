import { useSession } from "@ager/auth";
import { useCallback } from "react";

import {
  openArticle,
  openInBrowser,
  type OpenableArticle,
} from "@/features/feed/open-at-source";

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
