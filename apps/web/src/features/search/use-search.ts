"use client";

import { useQuery } from "@tanstack/react-query";
import type { ArticleSearchResultsPage, ArticleTag } from "@ager/api-client";

export const SEARCH_PAGE_SIZE = 20;

/** A search request: free-text (`q`) or by tag slug. */
export type SearchQuery =
  | { kind: "text"; term: string }
  | { kind: "tag"; term: string };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

/** The tag taxonomy (for the browse-by-tag chips). */
export function useTags() {
  return useQuery({
    queryKey: ["article-tags"],
    queryFn: () => getJson<ArticleTag[]>("/api/articles/tags"),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Run a search (full-text or by tag), offset-paginated. Disabled until there's a term, so
 * an empty search box issues no request. `lang` is optional.
 */
export function useArticleSearch(
  query: SearchQuery | null,
  page: number,
  lang?: string,
) {
  return useQuery({
    queryKey: ["article-search", query?.kind, query?.term, page, lang ?? null],
    enabled: Boolean(query && query.term),
    placeholderData: (prev) => prev,
    queryFn: () => {
      if (!query) throw new Error("no_query");
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(SEARCH_PAGE_SIZE),
      });
      if (lang) params.set("lang", lang);
      const url =
        query.kind === "text"
          ? `/api/articles/search?q=${encodeURIComponent(query.term)}&${params}`
          : `/api/articles/tags/${encodeURIComponent(query.term)}/search?${params}`;
      return getJson<ArticleSearchResultsPage>(url);
    },
  });
}
