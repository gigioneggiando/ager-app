import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("web app manifest", () => {
  it("declares brand colors, standalone display, and 192 + 512 icons", () => {
    const m = manifest();

    expect(m.name).toMatch(/Ager/);
    expect(m.short_name).toBe("Ager");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    // Brand tokens: ager-blue theme on editorial-white background.
    expect(m.theme_color).toBe("#0F2A44");
    expect(m.background_color).toBe("#F9FAF7");

    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
  });
});
