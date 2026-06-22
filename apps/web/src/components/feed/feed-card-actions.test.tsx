import { act, fireEvent, screen } from "@testing-library/react";
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
  vi.useFakeTimers();
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(null, { status: 204 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  vi.useRealTimers();
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

const interactions = () => calls.filter((c) => c.url.includes("/api/interactions"));

describe("FeedCardActions", () => {
  it("defers the DISCARD interaction and commits it after the undo window", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nascondi/i }));

    // The commit is deferred — nothing posted yet, the undo toast is showing.
    expect(interactions()).toHaveLength(0);
    expect(screen.getByText(/Nascosto/i)).toBeInTheDocument();

    // Let the 3s undo window elapse: the DISCARD commits.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(interactions()[0]?.body).toMatchObject({
      articleId: 42,
      type: "DISCARD",
    });
  });

  it("cancels the deferred commit when the user clicks Annulla", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nascondi/i }));
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));

    // Even after the window elapses, no interaction is posted.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(interactions()).toHaveLength(0);
  });

  it("prompts anonymous users to log in instead of calling the API", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
      { session: null },
    );

    fireEvent.click(screen.getByRole("button", { name: /^Salva/i }));

    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("/it/login?next="),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(interactions()).toHaveLength(0);
  });

  it("opens the add-to-list dialog from the secondary caret (no one-tap save)", () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    // The bookmark is one-tap save; the small caret is the secondary "add to a list" action.
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a lista" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Opening the list picker must not fire a save interaction.
    expect(interactions()).toHaveLength(0);
  });
});
