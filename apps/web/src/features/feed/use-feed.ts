"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedItem, FeedPage } from "@ager/api-client";

import { fetchFeedPage } from "./api";
import { DEFAULT_FEED_MODE, type FeedMode } from "./modes";

/**
 * The feed (cold-start when anonymous, personalized when authenticated), ranked by the
 * chosen `mode`. Cursor-paginated infinite query. The mode is part of the query key, so
 * switching modes fetches a fresh ranking; all feed caches share the `["feed", …]` prefix
 * (interaction handlers match on it).
 */
export function useFeed(mode: FeedMode = DEFAULT_FEED_MODE) {
  return useInfiniteQuery({
    queryKey: ["feed", mode],
    queryFn: ({ pageParam }) =>
      fetchFeedPage({ cursor: pageParam ?? undefined, mode }),
    initialPageParam: undefined as string | undefined,
    // Stop when the backend returns a null/absent cursor.
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Flatten pages into a single list, deduped by articleId (stable order). */
export function dedupeFeedItems(pages: FeedPage[] | undefined): FeedItem[] {
  if (!pages) return [];
  const seen = new Set<number>();
  const items: FeedItem[] = [];
  for (const page of pages) {
    for (const item of page.items ?? []) {
      const id = item.articleId;
      if (id == null) {
        items.push(item);
        continue;
      }
      if (!seen.has(id)) {
        seen.add(id);
        items.push(item);
      }
    }
  }
  return items;
}

/** Page-level feed metadata (from the most recent page). */
export function feedMeta(pages: FeedPage[] | undefined): {
  feedMode: string | null;
  recommenderVersion: string | null;
} {
  const last = pages?.at(-1);
  return {
    feedMode: last?.feedMode ?? null,
    recommenderVersion: last?.recommenderVersion ?? null,
  };
}
