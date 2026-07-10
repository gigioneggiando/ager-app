import type { FeedPage } from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

import { dedupeFeedItems, feedMeta, removeFromFeed } from "./feed-cache";

function page(items: number[], extra?: Partial<FeedPage>): FeedPage {
  return {
    items: items.map((articleId) => ({ articleId, title: `a${articleId}` })),
    ...extra,
  };
}

describe("dedupeFeedItems", () => {
  it("flattens pages and dedupes by articleId", () => {
    const result = dedupeFeedItems([page([1, 2]), page([2, 3])]);
    expect(result.map((i) => i.articleId)).toEqual([1, 2, 3]);
  });

  it("keeps items without an articleId", () => {
    const result = dedupeFeedItems([
      { items: [{ title: "no-id" }, { title: "x" }] },
    ]);
    expect(result).toHaveLength(2);
  });

  it("returns [] for undefined", () => {
    expect(dedupeFeedItems(undefined)).toEqual([]);
  });
});

describe("feedMeta", () => {
  it("reads mode + version from the most recent page", () => {
    const meta = feedMeta([
      page([1], { feedMode: "balanced", recommenderVersion: "v1" }),
      page([2], { feedMode: "chronological", recommenderVersion: "v2" }),
    ]);
    expect(meta).toEqual({
      feedMode: "chronological",
      recommenderVersion: "v2",
    });
  });

  it("defaults to nulls", () => {
    expect(feedMeta(undefined)).toEqual({
      feedMode: null,
      recommenderVersion: null,
    });
  });
});

describe("removeFromFeed (optimistic removal)", () => {
  const data: InfiniteData<FeedPage> = {
    pages: [page([1, 2]), page([3, 2])],
    pageParams: [undefined, "cursor-1"],
  };

  it("removes the article from every page, preserving structure", () => {
    const next = removeFromFeed(data, 2);
    expect(next?.pages.map((p) => p.items?.map((i) => i.articleId))).toEqual([
      [1],
      [3],
    ]);
    expect(next?.pageParams).toEqual([undefined, "cursor-1"]);
  });

  it("is a no-op for undefined", () => {
    expect(removeFromFeed(undefined, 1)).toBeUndefined();
  });
});
