import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  })),
}));

import { GET } from "./route";

const realFetch = global.fetch;
let calls: { url: string; init?: RequestInit }[] = [];

function feedPage() {
  return new Response(
    JSON.stringify({ items: [{ articleId: 1 }], nextCursor: "c2" }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

beforeEach(() => {
  cookieJar.clear();
  calls = [];
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("GET /api/feed (auth-aware proxy)", () => {
  it("anonymous: forwards params, no Bearer, cacheable", async () => {
    global.fetch = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return feedPage();
      },
    ) as unknown as typeof fetch;

    const res = await GET(
      new Request("http://localhost:3000/api/feed?cursor=c1&limit=20"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    const call = calls.find((c) => c.url.includes("/api/feed"))!;
    const url = new URL(call.url);
    expect(url.searchParams.get("cursor")).toBe("c1");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(new Headers(call.init?.headers).get("authorization")).toBeNull();
  });

  it("authenticated: attaches Bearer and marks the response private", async () => {
    cookieJar.set("ager_at", "the-access-token");
    global.fetch = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return feedPage();
      },
    ) as unknown as typeof fetch;

    const res = await GET(new Request("http://localhost:3000/api/feed"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("private");
    const call = calls.find((c) => c.url.includes("/api/feed"))!;
    expect(new Headers(call.init?.headers).get("authorization")).toBe(
      "Bearer the-access-token",
    );
  });
});
