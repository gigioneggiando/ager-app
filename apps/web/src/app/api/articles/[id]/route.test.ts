import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function mockFetchOnce(response: Response) {
  const fetchMock = vi
    .fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>()
    .mockResolvedValue(response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("GET /api/articles/[id] (proxy)", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("threads the id to the backend and returns the JSON with cache headers", async () => {
    const fetchMock = mockFetchOnce(
      new Response(JSON.stringify({ articleId: 42, title: "Hello" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const res = await GET(new Request("http://localhost:3000/api/articles/42"), {
      params: Promise.resolve({ id: "42" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    const calledUrl = new URL(fetchMock.mock.calls[0]![0] as string | URL);
    expect(calledUrl.pathname).toBe("/api/articles/42");
  });

  it("passes through a 404 from the backend", async () => {
    mockFetchOnce(new Response("nope", { status: 404 }));
    const res = await GET(new Request("http://localhost:3000/api/articles/999"), {
      params: Promise.resolve({ id: "999" }),
    });
    expect(res.status).toBe(404);
  });

  it("collapses other upstream errors to 502", async () => {
    mockFetchOnce(new Response("boom", { status: 500 }));
    const res = await GET(new Request("http://localhost:3000/api/articles/1"), {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(502);
  });
});
