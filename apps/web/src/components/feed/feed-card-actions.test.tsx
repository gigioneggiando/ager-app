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
  it("hides in one tap and commits DISCARD with no reason after the undo window", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    // ONE TAP hides immediately; nothing posted yet, the undo toast is showing.
    fireEvent.click(screen.getByRole("button", { name: /Nascondi/i }));
    expect(interactions()).toHaveLength(0);
    expect(screen.getByText(/Nascosto/i)).toBeInTheDocument();

    // Let the 5s undo window elapse: the DISCARD commits, with no reason.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(interactions()[0]?.body).toMatchObject({
      articleId: 42,
      type: "DISCARD",
    });
    expect(interactions()[0]?.body).not.toHaveProperty("reason");
  });

  it("keeps the undo toast and the pending DISCARD alive across a scroll", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nascondi/i }));
    expect(screen.getByText(/Nascosto/i)).toBeInTheDocument();

    // Scrolling the feed must not dismiss the (viewport-fixed) toast...
    fireEvent.scroll(window);
    fireEvent.scroll(document);
    expect(screen.getByText(/Nascosto/i)).toBeInTheDocument();
    expect(interactions()).toHaveLength(0);

    // ...nor cancel the deferred commit — it still fires when the window elapses.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(interactions()[0]?.body).toMatchObject({
      articleId: 42,
      type: "DISCARD",
    });
  });

  it("attaches the §11.2 reason when a chip in the undo toast is tapped", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nascondi/i }));

    // The four skippable reason chips appear INSIDE the undo toast (as buttons).
    for (const chip of [
      "Clickbait",
      "Fonte sgradita",
      "Non interessante",
      "Già letto altrove",
    ]) {
      expect(screen.getByRole("button", { name: chip })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: "Fonte sgradita" }));

    // Tapping a chip keeps the window open; the reason rides the deferred DISCARD.
    expect(interactions()).toHaveLength(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(interactions()[0]?.body).toMatchObject({
      articleId: 42,
      type: "DISCARD",
      reason: "unwanted_source",
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
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(interactions()).toHaveLength(0);
  });

  it("cancels the deferred DISCARD on Escape", async () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nascondi/i }));
    expect(screen.getByText(/Nascosto/i)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    // The toast is dismissed and nothing commits.
    expect(screen.queryByText(/Nascosto/i)).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
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
      await vi.advanceTimersByTimeAsync(5000);
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

const mutes = () => calls.filter((c) => c.url.includes("/api/me/muted-interests"));

describe("FeedCardActions — topic mute (Non mi interessa)", () => {
  beforeEach(() => {
    // Resolve the topic taxonomy so a label maps to an interest id; everything else → 204.
    global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
      if (url.includes("/api/interests")) {
        return new Response(
          JSON.stringify([{ id: 7, slug: "clima", name: "Clima" }]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(null, { status: 204 });
    }) as unknown as typeof fetch;
  });

  async function flushInterests() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
  }

  it("offers only resolvable topics and mutes the chosen one after the undo window", async () => {
    renderWithProviders(
      <FeedCardActions
        articleId={42}
        url="https://e.com/x"
        title="X"
        topics={["Clima", "Politica"]}
      />,
    );
    await flushInterests();

    fireEvent.click(screen.getByRole("button", { name: /Non mi interessa/i }));

    // "Politica" is not in the taxonomy → not offered; "Clima" is.
    expect(screen.getByRole("menuitem", { name: /Nascondi «Clima»/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Politica/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /Nascondi «Clima»/i }));

    // Deferred: nothing posted yet, undo toast showing.
    expect(mutes()).toHaveLength(0);
    expect(screen.getByText(/Argomento «Clima» nascosto/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    const post = mutes().find((c) => c.body);
    expect(post?.body).toMatchObject({ interestId: 7 });
  });

  it("portals the menu onto <body> so the card cannot clip it, and its item is clickable", async () => {
    renderWithProviders(
      <FeedCardActions
        articleId={42}
        url="https://e.com/x"
        title="X"
        topics={["Clima"]}
      />,
    );
    await flushInterests();

    fireEvent.click(screen.getByRole("button", { name: /Non mi interessa/i }));

    // The menu escapes the (overflow-hidden) card by rendering directly under <body>.
    const menu = screen.getByRole("menu");
    expect(menu.parentElement).toBe(document.body);

    // The item genuinely registers a click (the outside-click handler must not swallow it).
    fireEvent.click(screen.getByRole("menuitem", { name: /Nascondi «Clima»/i }));
    expect(screen.getByText(/Argomento «Clima» nascosto/i)).toBeInTheDocument();
  });

  it("cancels the mute when Annulla is clicked", async () => {
    renderWithProviders(
      <FeedCardActions
        articleId={42}
        url="https://e.com/x"
        title="X"
        topics={["Clima"]}
      />,
    );
    await flushInterests();

    fireEvent.click(screen.getByRole("button", { name: /Non mi interessa/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Nascondi «Clima»/i }));
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mutes().filter((c) => c.body)).toHaveLength(0);
  });

  it("does not render the action when no topic resolves to an interest", async () => {
    renderWithProviders(
      <FeedCardActions
        articleId={42}
        url="https://e.com/x"
        title="X"
        topics={["Sport"]}
      />,
    );
    await flushInterests();

    expect(
      screen.queryByRole("button", { name: /Non mi interessa/i }),
    ).not.toBeInTheDocument();
  });
});

const sourceMutes = () =>
  calls.filter((c) => c.url.includes("/api/me/muted-sources"));

describe("FeedCardActions — source mute (Nascondi fonte)", () => {
  it("offers Nascondi fonte and mutes the source after the undo window", async () => {
    renderWithProviders(
      <FeedCardActions
        articleId={42}
        url="https://e.com/x"
        title="X"
        sourceId={5}
        sourceName="Il Post"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Non mi interessa/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Nascondi «Il Post»/i }));

    // Deferred: nothing posted yet, undo toast showing.
    expect(sourceMutes()).toHaveLength(0);
    expect(screen.getByText(/Fonte «Il Post» nascosta/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(
      sourceMutes().find((c) => c.url.endsWith("/api/me/muted-sources/5")),
    ).toBeTruthy();
  });

  it("cancels the source mute when Annulla is clicked", async () => {
    renderWithProviders(
      <FeedCardActions
        articleId={42}
        url="https://e.com/x"
        title="X"
        sourceId={5}
        sourceName="Il Post"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Non mi interessa/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Nascondi «Il Post»/i }));
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(sourceMutes()).toHaveLength(0);
  });

  it("does not render the menu when neither a topic nor a source is mutable", () => {
    renderWithProviders(
      <FeedCardActions articleId={42} url="https://e.com/x" title="X" />,
    );

    expect(
      screen.queryByRole("button", { name: /Non mi interessa/i }),
    ).not.toBeInTheDocument();
  });
});
