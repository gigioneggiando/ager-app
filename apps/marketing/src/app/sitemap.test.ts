import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("marketing sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists only the landing page per locale (no anchor fragments)", () => {
    for (const locale of ["it", "en"]) {
      expect(urls.some((u) => u.endsWith(`/${locale}`))).toBe(true);
    }
    expect(urls).toHaveLength(2);
    expect(urls.some((u) => u.includes("#"))).toBe(false);
    expect(urls.every((u) => /^https?:\/\//.test(u))).toBe(true);
  });

  it("gives the landing top priority with hreflang alternates", () => {
    const landing = entries.find((e) => e.url.endsWith("/it"));
    expect(landing?.priority).toBe(1);
    expect(Object.keys(landing?.alternates?.languages ?? {})).toEqual(["it", "en"]);
  });
});
