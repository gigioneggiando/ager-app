import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { OAuthCallback } from "./oauth-callback";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const realFetch = global.fetch;
let calls: { url: string; body: unknown }[] = [];
let exchangeResponse: () => Response;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  replace.mockClear();
  refresh.mockClear();
  sessionStorage.clear();
  exchangeResponse = () => json({ userId: "u1", role: "user", needsOnboarding: true });
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (url.includes("/api/auth/oauth/google")) return exchangeResponse();
    if (url.includes("/api/auth/session"))
      return json({ session: { userId: "u1", email: "u@e.com", role: "user" } });
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  window.location.hash = "";
  vi.restoreAllMocks();
});

/** Seed a valid callback fragment + matching stored state. */
function seedCallback(next = "/feed") {
  sessionStorage.setItem(
    "ager_oauth_state",
    JSON.stringify({ state: "s1", next }),
  );
  window.location.hash = "#id_token=ID_TOKEN&state=s1";
}

describe("OAuthCallback", () => {
  it("exchanges the id_token and routes a new user to onboarding", async () => {
    seedCallback("/me");
    renderWithProviders(<OAuthCallback />, { session: null });

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        expect.stringContaining("/it/onboarding"),
      ),
    );
    const exchange = calls.find((c) => c.url.includes("/api/auth/oauth/google"));
    expect(exchange?.body).toMatchObject({ idToken: "ID_TOKEN" });
  });

  it("routes an existing user (no onboarding) to the next path", async () => {
    seedCallback("/me/stats");
    exchangeResponse = () => json({ userId: "u1", role: "user", needsOnboarding: false });
    renderWithProviders(<OAuthCallback />, { session: null });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/me/stats"));
  });

  it("offers the restore path when the account is soft-deleted (403)", async () => {
    seedCallback();
    exchangeResponse = () => json({ errorCode: "account_deleted" }, 403);
    renderWithProviders(<OAuthCallback />, { session: null });

    expect(await screen.findByText("Account eliminato")).toBeInTheDocument();
    const restore = screen.getByRole("link", { name: /Ripristina/i });
    expect(restore).toHaveAttribute("href", expect.stringContaining("/restore"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows an error and never exchanges when state does not match", async () => {
    sessionStorage.setItem("ager_oauth_state", JSON.stringify({ state: "s1" }));
    window.location.hash = "#id_token=ID_TOKEN&state=TAMPERED";
    renderWithProviders(<OAuthCallback />, { session: null });

    expect(await screen.findByText("Accesso non riuscito")).toBeInTheDocument();
    expect(calls.some((c) => c.url.includes("/api/auth/oauth/google"))).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
