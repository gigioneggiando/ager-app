import type { FeedPage } from "@ager/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { DEFAULT_FEED_MODE, type FeedMode } from "./modes";

export const FEED_PAGE_LIMIT = 20;
/** All feed caches share this key prefix; interaction handlers match on it (M3b). */
export const FEED_QUERY_KEY = "feed";

async function fetchFeedPage(
  mode: FeedMode,
  cursor?: string,
): Promise<FeedPage> {
  const { data, error } = await apiClient.GET("/api/feed", {
    params: { query: { mode, cursor, limit: FEED_PAGE_LIMIT } },
  });
  if (error || !data) throw new Error("feed_fetch_failed");
  return data;
}

/**
 * The feed (cold-start when anonymous, personalized when authenticated), ranked by `mode`.
 * Cursor-paginated infinite query — `mode` is part of the key, so switching re-ranks. The
 * Bearer middleware attaches auth; anonymous callers still get a cold-start feed.
 */
export function useFeed(mode: FeedMode = DEFAULT_FEED_MODE) {
  return useInfiniteQuery({
    queryKey: [FEED_QUERY_KEY, mode],
    queryFn: ({ pageParam }) => fetchFeedPage(mode, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
  });
}
