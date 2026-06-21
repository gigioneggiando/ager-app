import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/feed (server-side proxy)", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("forwards cursor + limit to the backend and returns the JSON with cache headers", async () => {
    const page = {
      items: [{ articleId: 1 }],
      nextCursor: "c2",
      feedMode: "cold_start",
      recommenderVersion: "v1",
    };
    const fetchMock = vi
      .fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(
        new Response(JSON.stringify(page), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await GET(
      new Request("http://localhost:3000/api/feed?cursor=c1&limit=20"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    const body = (await res.json()) as { nextCursor: string };
    expect(body.nextCursor).toBe("c2");

    // Upstream hit on the backend's /api/feed with the forwarded query params.
    const calledUrl = new URL(
      fetchMock.mock.calls[0]![0] as string | URL,
    );
    expect(calledUrl.pathname).toBe("/api/feed");
    expect(calledUrl.searchParams.get("cursor")).toBe("c1");
    expect(calledUrl.searchParams.get("limit")).toBe("20");
  });

  it("returns 502 when the backend responds with an error", async () => {
    global.fetch = vi.fn(
      async () => new Response("nope", { status: 500 }),
    ) as unknown as typeof fetch;

    const res = await GET(new Request("http://localhost:3000/api/feed"));
    expect(res.status).toBe(502);
  });

  it("returns 502 when the upstream fetch throws", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;

    const res = await GET(new Request("http://localhost:3000/api/feed"));
    expect(res.status).toBe(502);
  });
});
