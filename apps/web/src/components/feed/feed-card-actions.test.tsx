import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { FeedCardActions } from "./feed-card-actions";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/it",
}));

const realFetch = global.fetch;
let calls: { url: string; body: unknown }[] = [];

beforeEach(() => {
  calls = [];
  push.mockClear();
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(null, { status: 204 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("FeedCardActions", () => {
  it("posts a DISCARD interaction when a signed-in user hides a card", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    await user.click(screen.getByRole("button", { name: /Nascondi/i }));

    await waitFor(() => {
      const discard = calls.find((c) => c.url.includes("/api/interactions"));
      expect(discard?.body).toMatchObject({ articleId: 42, type: "DISCARD" });
    });
  });

  it("prompts anonymous users to log in instead of calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
      { session: null },
    );

    await user.click(screen.getByRole("button", { name: /Salva/i }));

    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("/it/login?next="),
    );
    expect(calls.find((c) => c.url.includes("/api/interactions"))).toBeUndefined();
  });
});
