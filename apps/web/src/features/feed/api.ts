import type { FeedPage } from "@ager/api-client";

export const FEED_PAGE_LIMIT = 20;

/**
 * Fetch one page of the public feed via the SAME-ORIGIN Next route handler
 * (`/api/feed`), which proxies the backend server-side (no CORS, backend URL stays
 * server-only). Anonymous → backend returns cold-start. Pagination is the opaque
 * `nextCursor` from the previous page.
 */
export async function fetchFeedPage({
  cursor,
  limit = FEED_PAGE_LIMIT,
}: {
  cursor?: string;
  limit?: number;
}): Promise<FeedPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));

  const res = await fetch(`/api/feed?${params.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to load the feed");
  }
  return (await res.json()) as FeedPage;
}
