import type { ArticleSearchResultsPage } from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

import { removeFromSearch, searchResultToFeedItem } from "./search-result";

function page(ids: number[]): ArticleSearchResultsPage {
  return { items: ids.map((articleId) => ({ articleId, title: `a${articleId}` })) };
}

describe("searchResultToFeedItem", () => {
  it("maps the lean search fields onto a FeedItem", () => {
    const item = searchResultToFeedItem({
      articleId: 7,
      title: "hello",
      excerpt: "x",
      sourceName: "src",
    });
    expect(item.articleId).toBe(7);
    expect(item.title).toBe("hello");
    // Search results carry no publisher URL — stays undefined (opening resolves it later).
    expect(item.url).toBeUndefined();
  });
});

describe("removeFromSearch (optimistic removal)", () => {
  const data: InfiniteData<ArticleSearchResultsPage> = {
    pages: [page([1, 2]), page([3, 2])],
    pageParams: [1, 2],
  };

  it("removes the article from every page, preserving structure", () => {
    const next = removeFromSearch(data, 2);
    expect(next?.pages.map((p) => p.items?.map((i) => i.articleId))).toEqual([
      [1],
      [3],
    ]);
    expect(next?.pageParams).toEqual([1, 2]);
  });

  it("is a no-op for undefined", () => {
    expect(removeFromSearch(undefined, 1)).toBeUndefined();
  });
});
