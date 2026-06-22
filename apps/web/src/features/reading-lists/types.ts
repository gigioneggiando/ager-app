/**
 * Reading-list item (article projection). The backend's ArticleInListDto is not in the
 * OpenAPI contract (the items endpoint returns an anonymous { items, nextCursor }), so we
 * type it here. Keep in sync with src/Ager.Application/DTOs/ReadingLists/ArticleInListDto.
 */
export interface ReadingListItem {
  readingListId: number;
  articleId: number;
  addedAt: string;
  note?: string | null;
  title: string;
  url: string;
  canonicalUrl?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  topics?: string[] | null;
  sourceName?: string | null;
  displayMode?: string | null;
}

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}
