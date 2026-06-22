import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory cookie jar backing a mocked next/headers cookies() store.
const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  })),
}));

import { authedBackendFetch } from "./backend";
import { POST as verifyRoute } from "@/app/api/auth/verify/route";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";

function jsonResponse(
  obj: unknown,
  status = 200,
  setCookie?: string,
): Response {
  const headers = new Headers({ "content-type": "application/json" });
  if (setCookie) headers.append("set-cookie", setCookie);
  return new Response(JSON.stringify(obj), { status, headers });
}

const authResult = {
  userId: "11111111-1111-1111-1111-111111111111",
  accessToken: "new-access",
  accessTokenExpiresAt: "2099-01-01T00:00:00Z",
  refreshToken: "new-refresh",
  refreshTokenExpiresAt: "2099-01-14T00:00:00Z",
  role: "user",
};

type FetchArgs = { url: string; init?: RequestInit };
let calls: FetchArgs[] = [];

beforeEach(() => {
  cookieJar.clear();
  calls = [];
  vi.restoreAllMocks();
});

describe("verify route (login)", () => {
  it("sets HttpOnly session cookies and returns session info without tokens", async () => {
    global.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/auth/csrf")) {
        return jsonResponse({ token: "req-token" }, 200, "XSRF-TOKEN=cookie-token; path=/");
      }
      if (url.includes("/api/auth/login")) return jsonResponse(authResult, 200);
      // Server-truth onboarding check: no interests yet → needsOnboarding.
      if (url.includes("/api/me/interests")) return jsonResponse([], 200);
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    const res = await verifyRoute(
      new Request("http://f/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", code: "123456" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      userId: string;
      role: string;
      needsOnboarding: boolean;
    };
    expect(body).toMatchObject({ userId: authResult.userId, role: "user" });
    expect(body.needsOnboarding).toBe(true); // server truth: the user has no interests
    // Tokens land in cookies, never in the response body.
    expect(JSON.stringify(body)).not.toContain("new-access");
    expect(cookieJar.get("ager_at")).toBe("new-access");
    expect(cookieJar.get("ager_rt")).toBe("new-refresh");
  });

  it("relays a 401 for a wrong/expired code", async () => {
    global.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/auth/csrf"))
        return jsonResponse({ token: "t" }, 200, "XSRF-TOKEN=c");
      return jsonResponse({ title: "Unauthorized" }, 401);
    }) as unknown as typeof fetch;

    const res = await verifyRoute(
      new Request("http://f/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", code: "000000" }),
      }),
    );
    expect(res.status).toBe(401);
    expect(cookieJar.has("ager_at")).toBe(false);
  });
});

describe("authedBackendFetch", () => {
  it("attaches the X-CSRF-TOKEN header + XSRF cookie on state-changing calls", async () => {
    cookieJar.set("ager_at", "access-1");
    global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.includes("/api/auth/csrf"))
        return jsonResponse({ token: "req-token" }, 200, "XSRF-TOKEN=cookie-token");
      return jsonResponse({ ok: true }, 200);
    }) as unknown as typeof fetch;

    await authedBackendFetch("/api/interactions", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const write = calls.find((c) => c.url.includes("/api/interactions"));
    const headers = new Headers(write?.init?.headers);
    expect(headers.get("x-csrf-token")).toBe("req-token");
    expect(headers.get("cookie")).toContain("XSRF-TOKEN=cookie-token");
    expect(headers.get("authorization")).toBe("Bearer access-1");
  });

  it("refreshes once on 401 and retries with the new access token", async () => {
    cookieJar.set("ager_at", "old-access");
    cookieJar.set("ager_rt", "old-refresh");
    let meCalls = 0;
    global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.includes("/api/auth/refresh")) return jsonResponse(authResult, 200);
      if (url.includes("/api/me")) {
        meCalls += 1;
        return meCalls === 1
          ? new Response(null, { status: 401 })
          : jsonResponse({ ok: true }, 200);
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    const res = await authedBackendFetch("/api/me");

    expect(res.status).toBe(200);
    expect(meCalls).toBe(2);
    // The session cookie was rotated to the refreshed access token.
    expect(cookieJar.get("ager_at")).toBe("new-access");
    const meRequests = calls.filter((c) => c.url.includes("/api/me"));
    expect(new Headers(meRequests[0]?.init?.headers).get("authorization")).toBe(
      "Bearer old-access",
    );
    expect(new Headers(meRequests[1]?.init?.headers).get("authorization")).toBe(
      "Bearer new-access",
    );
  });

  it("clears the session when refresh also fails", async () => {
    cookieJar.set("ager_at", "old-access");
    cookieJar.set("ager_rt", "bad-refresh");
    global.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/auth/refresh"))
        return new Response(null, { status: 401 });
      return new Response(null, { status: 401 });
    }) as unknown as typeof fetch;

    const res = await authedBackendFetch("/api/me");
    expect(res.status).toBe(401);
    expect(cookieJar.has("ager_at")).toBe(false);
    expect(cookieJar.has("ager_rt")).toBe(false);
  });
});

describe("logout route", () => {
  it("clears the session cookies", async () => {
    cookieJar.set("ager_at", "access");
    cookieJar.set("ager_rt", "refresh");
    global.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/auth/csrf"))
        return jsonResponse({ token: "t" }, 200, "XSRF-TOKEN=c");
      return new Response(null, { status: 204 });
    }) as unknown as typeof fetch;

    const res = await logoutRoute();
    expect(res.status).toBe(204);
    expect(cookieJar.has("ager_at")).toBe(false);
    expect(cookieJar.has("ager_rt")).toBe(false);
  });
});
