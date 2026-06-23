import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  decodeIdTokenEmail,
  readGoogleCallback,
  startGoogleLogin,
} from "./google-oauth";

const realFetch = global.fetch;
const realLocation = window.location;
let assign: ReturnType<typeof vi.fn>;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  sessionStorage.clear();
  // jsdom's Location.assign is non-configurable, so replace the whole location object.
  assign = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "https://app.test", hash: "", assign },
  });
});
afterEach(() => {
  global.fetch = realFetch;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: realLocation,
  });
  vi.restoreAllMocks();
});

describe("startGoogleLogin", () => {
  it("fetches a nonce, stores anti-CSRF state, and redirects to Google", async () => {
    global.fetch = vi.fn(async () => json({ nonce: "NONCE123" })) as unknown as typeof fetch;

    await startGoogleLogin({ locale: "it", next: "/me/stats" });

    expect(assign).toHaveBeenCalledTimes(1);
    const url = new URL(assign.mock.calls[0]![0] as string);
    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(url.searchParams.get("response_type")).toBe("id_token");
    expect(url.searchParams.get("nonce")).toBe("NONCE123");
    expect(url.searchParams.get("redirect_uri")).toContain("/it/oauth/callback");
    const state = url.searchParams.get("state");
    expect(state).toBeTruthy();

    const stored = JSON.parse(sessionStorage.getItem("ager_oauth_state")!);
    expect(stored.state).toBe(state);
    expect(stored.next).toBe("/me/stats");
  });

  it("throws (and does not redirect) when begin fails", async () => {
    global.fetch = vi.fn(async () => new Response(null, { status: 502 })) as unknown as typeof fetch;

    await expect(startGoogleLogin({ locale: "en", next: "/" })).rejects.toThrow();
    expect(assign).not.toHaveBeenCalled();
  });
});

describe("readGoogleCallback", () => {
  it("returns the id_token and validates a matching state", () => {
    sessionStorage.setItem(
      "ager_oauth_state",
      JSON.stringify({ state: "abc", next: "/feed" }),
    );
    window.location.hash = "#id_token=TOKEN&state=abc";

    const cb = readGoogleCallback();
    expect(cb.idToken).toBe("TOKEN");
    expect(cb.stateValid).toBe(true);
    expect(cb.next).toBe("/feed");
    // single-use: the stored state is cleared after reading
    expect(sessionStorage.getItem("ager_oauth_state")).toBeNull();
  });

  it("flags a state mismatch", () => {
    sessionStorage.setItem("ager_oauth_state", JSON.stringify({ state: "abc" }));
    window.location.hash = "#id_token=TOKEN&state=evil";

    expect(readGoogleCallback().stateValid).toBe(false);
  });

  it("surfaces a provider error and defaults next to '/'", () => {
    window.location.hash = "#error=access_denied";
    const cb = readGoogleCallback();
    expect(cb.error).toBe("access_denied");
    expect(cb.idToken).toBeNull();
    expect(cb.next).toBe("/");
  });
});

describe("decodeIdTokenEmail", () => {
  it("reads the email claim from a JWT payload", () => {
    const payload = btoa(JSON.stringify({ email: "user@example.com" }));
    expect(decodeIdTokenEmail(`header.${payload}.sig`)).toBe("user@example.com");
  });

  it("returns null on a malformed token", () => {
    expect(decodeIdTokenEmail("not-a-jwt")).toBeNull();
  });
});
