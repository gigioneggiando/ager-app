import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists the public routes for both locales", () => {
    for (const locale of ["it", "en"]) {
      for (const suffix of ["", "/sources", "/chi-siamo", "/dsa-contact", "/bot"]) {
        expect(urls.some((u) => u.endsWith(`/${locale}${suffix}`))).toBe(true);
      }
    }
    expect(urls.every((u) => /^https?:\/\//.test(u))).toBe(true);
  });

  it("excludes auth, admin, and dynamic-id routes", () => {
    expect(
      urls.some((u) => /\/(me|admin|login|register|article|onboarding)\b/.test(u)),
    ).toBe(false);
  });

  it("gives the home pages top priority with hreflang alternates", () => {
    const home = entries.find((e) => e.url.endsWith("/it"));
    expect(home?.priority).toBe(1);
    expect(Object.keys(home?.alternates?.languages ?? {})).toEqual(["it", "en"]);
  });
});
