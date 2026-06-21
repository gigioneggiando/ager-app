import { apiClient, type FeedPage } from "@ager/api-client";

export const FEED_PAGE_LIMIT = 20;

/**
 * Fetch one page of the public feed (anonymous → backend returns cold-start).
 * No auth header, no mode param (no personalization/mode selector until PR4/PR5).
 * Pagination is the opaque `nextCursor` from the previous page.
 */
export async function fetchFeedPage({
  cursor,
  limit = FEED_PAGE_LIMIT,
}: {
  cursor?: string;
  limit?: number;
}): Promise<FeedPage> {
  const { data, error } = await apiClient.GET("/api/feed", {
    params: { query: { cursor, limit } },
  });

  if (error || !data) {
    throw new Error("Failed to load the feed");
  }
  return data;
}
