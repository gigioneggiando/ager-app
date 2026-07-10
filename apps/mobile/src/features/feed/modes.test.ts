import { DEFAULT_FEED_MODE, FEED_MODES, isFeedMode } from "./modes";

describe("feed modes", () => {
  it("fixes the six modes in order, defaulting to balanced", () => {
    expect(FEED_MODES).toEqual([
      "balanced",
      "most_recent",
      "more_pluralism",
      "most_personalized",
      "less_personalized",
      "chronological",
    ]);
    expect(DEFAULT_FEED_MODE).toBe("balanced");
  });

  it("isFeedMode narrows known modes and rejects others", () => {
    expect(isFeedMode("chronological")).toBe(true);
    expect(isFeedMode("balanced")).toBe(true);
    expect(isFeedMode("nonsense")).toBe(false);
    expect(isFeedMode("")).toBe(false);
  });
});
