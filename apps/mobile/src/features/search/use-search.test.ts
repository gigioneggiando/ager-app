import { hasMoreResults, searchQueryKey, type SearchQuery } from "./use-search";

// use-search imports apiClient; stub it (the pure helpers don't touch it).
jest.mock("@/lib/api/client", () => ({ apiClient: { GET: jest.fn() } }));

describe("searchQueryKey", () => {
  it("keys by kind + term", () => {
    const text: SearchQuery = { kind: "text", term: "clima" };
    const tag: SearchQuery = { kind: "tag", term: "politica" };
    expect(searchQueryKey(text)).toEqual(["article-search", "text", "clima"]);
    expect(searchQueryKey(tag)).toEqual(["article-search", "tag", "politica"]);
  });
});

describe("hasMoreResults", () => {
  it("is true while fewer than total are loaded", () => {
    expect(hasMoreResults(20, 55)).toBe(true);
    expect(hasMoreResults(55, 55)).toBe(false);
    expect(hasMoreResults(0, undefined)).toBe(false);
  });
});
