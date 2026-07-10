import type { ReadingList, ReadingListItemsPage } from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

import {
  flattenListItems,
  removeListItem,
  sortReadingLists,
} from "./reading-lists-cache";

function itemsPage(ids: number[], nextCursor?: string): ReadingListItemsPage {
  return {
    items: ids.map((articleId) => ({ articleId, title: `a${articleId}` })),
    nextCursor,
  };
}

describe("flattenListItems", () => {
  it("flattens pages, keeping order", () => {
    const data: InfiniteData<ReadingListItemsPage> = {
      pages: [itemsPage([1, 2], "c1"), itemsPage([3])],
      pageParams: [undefined, "c1"],
    };
    expect(flattenListItems(data).map((i) => i.articleId)).toEqual([1, 2, 3]);
  });

  it("returns [] for undefined", () => {
    expect(flattenListItems(undefined)).toEqual([]);
  });
});

describe("removeListItem", () => {
  it("removes the item from every page, preserving structure", () => {
    const data: InfiniteData<ReadingListItemsPage> = {
      pages: [itemsPage([1, 2]), itemsPage([2, 3])],
      pageParams: [undefined, "c1"],
    };
    const next = removeListItem(data, 2);
    expect(next?.pages.map((p) => p.items?.map((i) => i.articleId))).toEqual([
      [1],
      [3],
    ]);
  });
});

describe("sortReadingLists", () => {
  it("pins the default list first", () => {
    const lists: ReadingList[] = [
      { id: 1, name: "A" },
      { id: 2, name: "Salvati", isDefault: true },
      { id: 3, name: "B" },
    ];
    expect(sortReadingLists(lists).map((l) => l.id)).toEqual([2, 1, 3]);
  });
});
