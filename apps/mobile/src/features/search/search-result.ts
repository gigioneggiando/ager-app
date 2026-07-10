import type { ArticleSearchResult, FeedItem } from "@ager/api-client";

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
