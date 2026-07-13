import type {
  ArticleSearchResult,
  ArticleSearchResultsPage,
  FeedItem,
} from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

/**
 * Adapt a (lean) search result to the FeedItem shape the feed card renders. Search results
 * carry no publisher URL / topics / score — those fields stay undefined, so the card shows
 * no "why shown" panel, and opening resolves the URL by fetching the article detail.
 */
export function searchResultToFeedItem(result: ArticleSearchResult): FeedItem {
  return {
    articleId: result.articleId,
    title: result.title,
    excerpt: result.excerpt,
    imageUrl: result.imageUrl,
    sourceName: result.sourceName,
    publishedAt: result.publishedAt,
    displayMode: result.displayMode,
  };
}

/**
 * Optimistic removal: drop an article from every page of a search-results cache. Hide/Discard
 * fires on the feed AND on search, so it must clear the card from whichever surface it's on
 * (the backend already excludes DISCARDs from future results).
 */
export function removeFromSearch(
  data: InfiniteData<ArticleSearchResultsPage> | undefined,
  articleId: number,
): InfiniteData<ArticleSearchResultsPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((item) => item.articleId !== articleId),
    })),
  };
}
