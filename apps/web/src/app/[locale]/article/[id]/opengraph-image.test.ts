import { describe, expect, it } from "vitest";

import ArticleOgImage, { alt, contentType, size } from "./opengraph-image";

describe("article opengraph-image route", () => {
  it("declares a PNG OG image with standard dimensions", () => {
    expect(contentType).toBe("image/png");
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(alt).toBeTruthy();
    expect(typeof ArticleOgImage).toBe("function");
  });
});
