import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/sources/[id] (proxy)", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("threads the id to the backend source endpoint", async () => {
    const fetchMock = vi
      .fn<
        (input: string | URL | Request, init?: RequestInit) => Promise<Response>
      >()
      .mockResolvedValue(
        new Response(JSON.stringify({ sourceId: 7, name: "ANSA" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await GET(new Request("http://localhost:3000/api/sources/7"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(res.status).toBe(200);
    const calledUrl = new URL(fetchMock.mock.calls[0]![0] as string | URL);
    expect(calledUrl.pathname).toBe("/api/sources/7");
  });

  it("passes through a 404", async () => {
    global.fetch = vi.fn(
      async () => new Response("nope", { status: 404 }),
    ) as unknown as typeof fetch;
    const res = await GET(new Request("http://localhost:3000/api/sources/999"), {
      params: Promise.resolve({ id: "999" }),
    });
    expect(res.status).toBe(404);
  });
});
