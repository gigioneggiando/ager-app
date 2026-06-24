import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("marketing robots", () => {
  it("allows the whole site and advertises an absolute sitemap", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules!;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toBeUndefined();
    expect(String(r.sitemap)).toMatch(/^https?:\/\/.+\/sitemap\.xml$/);
  });
});
