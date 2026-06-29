import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_URL"] as const;

/** Reload site.ts after mutating env, since APP_URL/SITE_URL are resolved at import time. */
async function loadSite(env: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, env);
  vi.resetModules();
  return import("./site");
}

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.resetModules();
});

describe("appUrl env fallback", () => {
  it("falls back to the canonical app origin when NEXT_PUBLIC_APP_URL is empty", async () => {
    const { appUrl } = await loadSite({ NEXT_PUBLIC_APP_URL: "" });
    expect(appUrl("it")).toBe("https://app.agerculture.com/it");
  });

  it("treats a whitespace-only NEXT_PUBLIC_APP_URL as unset", async () => {
    const { appUrl } = await loadSite({ NEXT_PUBLIC_APP_URL: "   " });
    expect(appUrl("it")).toBe("https://app.agerculture.com/it");
  });

  it("uses a real NEXT_PUBLIC_APP_URL value (trimmed) when set", async () => {
    const { appUrl } = await loadSite({ NEXT_PUBLIC_APP_URL: "  https://app.example.com  " });
    expect(appUrl("it")).toBe("https://app.example.com/it");
    expect(appUrl("en", "/feed")).toBe("https://app.example.com/en/feed");
  });
});

describe("SITE_URL env fallback", () => {
  it("falls back to the apex when NEXT_PUBLIC_SITE_URL is empty and no VERCEL_URL", async () => {
    const { SITE_URL } = await loadSite({ NEXT_PUBLIC_SITE_URL: "" });
    expect(SITE_URL).toBe("https://agerculture.com");
  });

  it("uses VERCEL_URL when NEXT_PUBLIC_SITE_URL is empty", async () => {
    const { SITE_URL } = await loadSite({
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_URL: "preview.vercel.app",
    });
    expect(SITE_URL).toBe("https://preview.vercel.app");
  });

  it("prefers an explicit NEXT_PUBLIC_SITE_URL", async () => {
    const { SITE_URL } = await loadSite({ NEXT_PUBLIC_SITE_URL: "https://agerculture.com" });
    expect(SITE_URL).toBe("https://agerculture.com");
  });
});
