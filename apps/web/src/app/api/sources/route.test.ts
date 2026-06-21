import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/sources (proxy)", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("proxies the source list and returns JSON with cache headers", async () => {
    const list = [{ sourceId: 1, name: "ANSA", type: "agenzia" }];
    const fetchMock = vi
      .fn<
        (input: string | URL | Request, init?: RequestInit) => Promise<Response>
      >()
      .mockResolvedValue(
        new Response(JSON.stringify(list), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    const calledUrl = new URL(fetchMock.mock.calls[0]![0] as string | URL);
    expect(calledUrl.pathname).toBe("/api/sources");
    const body = (await res.json()) as Array<{ name: string }>;
    expect(body[0]!.name).toBe("ANSA");
  });

  it("returns 502 when the backend fails", async () => {
    global.fetch = vi.fn(
      async () => new Response("x", { status: 503 }),
    ) as unknown as typeof fetch;
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
