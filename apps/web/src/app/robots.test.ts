import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
  const r = robots();
  const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules!;
  const disallow = (rule.disallow ?? []) as string[];

  it("allows the public crawl and advertises an absolute sitemap", () => {
    expect(rule.allow).toBe("/");
    expect(String(r.sitemap)).toMatch(/^https?:\/\/.+\/sitemap\.xml$/);
  });

  it("disallows the API and every private section in both locales", () => {
    expect(disallow).toContain("/api");
    for (const locale of ["it", "en"]) {
      for (const path of [
        "/me",
        "/admin",
        "/login",
        "/register",
        "/oauth",
        "/onboarding",
        "/restore",
      ]) {
        expect(disallow).toContain(`/${locale}${path}`);
      }
    }
  });
});
