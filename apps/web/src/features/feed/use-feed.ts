"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedItem, FeedPage } from "@ager/api-client";

import { fetchFeedPage } from "./api";

/** Cold-start public feed (anonymous). Cursor-paginated infinite query. */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) =>
      fetchFeedPage({ cursor: pageParam ?? undefined }),
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
