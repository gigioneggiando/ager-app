import type {
  ArticleInList,
  FeedItem,
  ReadingList,
  ReadingListItemsPage,
} from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

/** Pure reading-list cache helpers (framework-agnostic → unit-testable). */

/** Adapt a list item (rich — has url + topics) to the FeedItem shape the card renders. */
export function listItemToFeedItem(item: ArticleInList): FeedItem {
  return {
    articleId: item.articleId,
    title: item.title,
    url: item.url,
    canonicalUrl: item.canonicalUrl,
    imageUrl: item.imageUrl,
    topics: item.topics,
    sourceName: item.sourceName,
    publishedAt: item.publishedAt ?? undefined,
    displayMode: item.displayMode,
  };
}

/** Flatten infinite-query item pages into one list. */
export function flattenListItems(
  data: InfiniteData<ReadingListItemsPage> | undefined,
): ArticleInList[] {
  return data?.pages.flatMap((page) => page.items ?? []) ?? [];
}

/** Optimistic removal of an item (by articleId) from every page of a list. */
export function removeListItem(
  data: InfiniteData<ReadingListItemsPage> | undefined,
  articleId: number,
): InfiniteData<ReadingListItemsPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((item) => item.articleId !== articleId),
    })),
  };
}

/** Pin the default "Salvati" list first, otherwise preserve order. */
export function sortReadingLists(lists: ReadingList[]): ReadingList[] {
  return [...lists].sort(
    (a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)),
  );
}
