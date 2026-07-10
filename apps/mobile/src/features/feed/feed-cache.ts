import type { FeedItem, FeedPage } from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

/**
 * Pure feed-cache helpers (ported from the web `use-feed.ts` + `feed-card-actions.ts` —
 * keep in sync). Framework-agnostic so they unit-test without a component or query client.
 */

/** Flatten infinite-query pages into one list, deduped by articleId (stable order). */
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

/**
 * Optimistic removal: drop an article from every page of the infinite feed cache. Used by
 * Hide/Discard (M3b) to remove a card immediately, before the backend DISCARD commits.
 */
export function removeFromFeed(
  data: InfiniteData<FeedPage> | undefined,
  articleId: number,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((item) => item.articleId !== articleId),
    })),
  };
}
