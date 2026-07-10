import type { ArticleSearchResultsPage, ArticleTag } from "@ager/api-client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export const SEARCH_PAGE_SIZE = 20;

/** A search request: free-text (`q`) or by tag slug. */
export type SearchQuery =
  | { kind: "text"; term: string }
  | { kind: "tag"; term: string };

/** Stable react-query key for a search (kind + term). */
export function searchQueryKey(query: SearchQuery) {
  return ["article-search", query.kind, query.term] as const;
}

/** Page-based pagination: is there another page after `loaded` of `total`? */
export function hasMoreResults(
  loaded: number,
  total: number | undefined,
): boolean {
  return loaded < (total ?? 0);
}

async function fetchSearchPage(
  query: SearchQuery,
  page: number,
): Promise<ArticleSearchResultsPage> {
  if (query.kind === "text") {
    const { data, error } = await apiClient.GET("/api/articles/search", {
      params: { query: { q: query.term, page, pageSize: SEARCH_PAGE_SIZE } },
    });
    if (error || !data) throw new Error("search_failed");
    return data;
  }
  const { data, error } = await apiClient.GET(
    "/api/articles/tags/{tag}/search",
    {
      params: {
        path: { tag: query.term },
        query: { page, pageSize: SEARCH_PAGE_SIZE },
      },
    },
  );
  if (error || !data) throw new Error("search_failed");
  return data;
}

/** The tag taxonomy (browse-by-tag chips). */
export function useTags() {
  return useQuery({
    queryKey: ["article-tags"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ArticleTag[]> => {
      const { data, error } = await apiClient.GET("/api/articles/tags");
      if (error || !data) throw new Error("tags_unavailable");
      return data;
    },
  });
}

/**
 * Run a search (full-text or by tag), page-paginated as an infinite query. Disabled until
 * there's a term, so an empty search box issues no request.
 */
export function useArticleSearch(query: SearchQuery | null) {
  return useInfiniteQuery({
    queryKey: query ? searchQueryKey(query) : ["article-search", "none"],
    enabled: Boolean(query && query.term.length > 0),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchSearchPage(query!, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + (p.items?.length ?? 0), 0);
      return hasMoreResults(loaded, lastPage.total)
        ? (lastPage.page ?? allPages.length) + 1
        : undefined;
    },
  });
}
