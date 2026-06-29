import { describe, expect, it } from "vitest";

import { safeUrl } from "./safe-url";

describe("safeUrl", () => {
  it("passes through http and https URLs unchanged", () => {
    expect(safeUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(safeUrl("http://example.com/x")).toBe("http://example.com/x");
  });

  it("strips javascript: URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    // Scheme matching is case-insensitive at the URL-parser level.
    expect(safeUrl("JavaScript:alert(1)")).toBeUndefined();
  });

  it("strips data: URLs", () => {
    expect(
      safeUrl("data:text/html,<script>alert(1)</script>"),
    ).toBeUndefined();
    expect(safeUrl("data:image/png;base64,AAAA")).toBeUndefined();
  });

  it("strips other non-http(s) schemes", () => {
    expect(safeUrl("file:///etc/passwd")).toBeUndefined();
    expect(safeUrl("ftp://example.com/x")).toBeUndefined();
    expect(safeUrl("vbscript:msgbox(1)")).toBeUndefined();
  });

  it("returns undefined for empty, nullish, or unparseable values", () => {
    expect(safeUrl(undefined)).toBeUndefined();
    expect(safeUrl(null)).toBeUndefined();
    expect(safeUrl("")).toBeUndefined();
    // Relative paths are not absolute URLs and must not be trusted as src/href.
    expect(safeUrl("/relative/path")).toBeUndefined();
    expect(safeUrl("not a url")).toBeUndefined();
  });
});
