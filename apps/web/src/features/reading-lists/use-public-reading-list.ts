"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ReadingList, ReadingListItemsPage } from "@ager/api-client";

import { flattenItems } from "@/features/reading-lists/use-reading-lists";

export { flattenItems };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

/** Public reading-list metadata by owner + slug (no auth). */
export function usePublicReadingList(ownerUserId: string, slug: string) {
  return useQuery({
    queryKey: ["public-reading-list", ownerUserId, slug],
    queryFn: () =>
      getJson<ReadingList>(
        `/api/reading-lists/public/users/${encodeURIComponent(ownerUserId)}/${encodeURIComponent(slug)}`,
      ),
  });
}

/**
 * Public/Unlisted reading-list items (infinite scroll by cursor), addressed by owner + slug.
 * Unlisted lists 404 on the numeric-id route (backend PR #86), so the share view must use
 * this unguessable owner+slug route for every shared-link view.
 */
export function usePublicReadingListItems(ownerUserId: string, slug: string) {
  return useInfiniteQuery({
    queryKey: ["public-reading-list-items", ownerUserId, slug],
    enabled: Boolean(ownerUserId && slug),
    queryFn: ({ pageParam }) =>
      getJson<ReadingListItemsPage>(
        `/api/reading-lists/public/users/${encodeURIComponent(ownerUserId)}/${encodeURIComponent(slug)}/items${
          pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""
        }`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
