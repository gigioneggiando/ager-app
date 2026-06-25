import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedItem, FeedPage } from "@ager/api-client";

import { renderWithProviders } from "@/test/test-utils";
import { fetchFeedPage } from "@/features/feed/api";
import { FeedList } from "./feed-list";

vi.mock("@/features/feed/api", () => ({
  FEED_PAGE_LIMIT: 20,
  fetchFeedPage: vi.fn(),
}));

// FeedCardActions (rendered per card) uses the App Router navigation hooks.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/it",
}));

const mockFetch = vi.mocked(fetchFeedPage);

function makeItem(id: number, title: string): FeedItem {
  return {
    articleId: id,
    title,
    url: `https://example.com/${id}`,
    excerpt: "Excerpt.",
    imageUrl: null,
    publishedAt: "2026-06-19T08:30:00Z",
    sourceName: "ANSA",
    sourceType: "agenzia",
    topics: [],
    estimatedReadingMinutes: 3,
    displayMode: "redirect",
    paywallDetected: false,
    score: 0.5,
    scoreBreakdown: {
      recency: 0.5,
      topicMatch: 0.5,
      sourceDiversity: 0.5,
      topicVariety: 0.5,
      clusterProminence: 0.5,
    },
    rank: id,
  };
}

const page1: FeedPage = {
  items: [makeItem(1, "Prima notizia"), makeItem(2, "Seconda notizia")],
  nextCursor: "cursor-2",
  feedMode: "cold_start",
  recommenderVersion: "v1.0.0",
};
const page2: FeedPage = {
  items: [makeItem(3, "Terza notizia")],
  nextCursor: null,
  feedMode: "cold_start",
  recommenderVersion: "v1.0.0",
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("FeedList", () => {
  it("renders page 1, appends page 2 with the threaded cursor, then shows caught-up", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(async ({ cursor }) =>
      cursor === "cursor-2" ? page2 : page1,
    );

    renderWithProviders(<FeedList />);

    await waitFor(() =>
      expect(screen.getByText("Prima notizia")).toBeInTheDocument(),
    );
    expect(screen.getByText("Seconda notizia")).toBeInTheDocument();
    expect(screen.queryByText("Terza notizia")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Carica altro" }));

    await waitFor(() =>
      expect(screen.getByText("Terza notizia")).toBeInTheDocument(),
    );

    // Cursor threaded: page 2 requested with the nextCursor from page 1.
    // (mode defaults to "balanced" when FeedList is rendered without a mode prop.)
    expect(mockFetch).toHaveBeenCalledWith({ cursor: undefined, mode: "balanced" });
    expect(mockFetch).toHaveBeenCalledWith({ cursor: "cursor-2", mode: "balanced" });

    // End of feed → calm caught-up state, no more "load more".
    expect(screen.getByText("Sei in pari")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Carica altro" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no items", async () => {
    mockFetch.mockResolvedValue({
      items: [],
      nextCursor: null,
      feedMode: "cold_start",
      recommenderVersion: "v1.0.0",
    });

    renderWithProviders(<FeedList />);

    await waitFor(() =>
      expect(screen.getByText("Nessun contenuto")).toBeInTheDocument(),
    );
  });

  it("shows a friendly error with retry when the request fails", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));

    renderWithProviders(<FeedList />);

    await waitFor(() =>
      expect(
        screen.getByText("Non siamo riusciti a caricare il feed"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Riprova" })).toBeInTheDocument();
  });

  it("shows skeletons while the first page is loading", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<FeedList />);
    expect(
      container.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  });

  it("records OPENED_EXTERNAL once when a signed-in user opens a card's publisher link", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(page1);

    const realFetch = global.fetch;
    const calls: { url: string; body: unknown }[] = [];
    global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
      // The actions row resolves the interests taxonomy on mount; keep it quiet.
      if (url.includes("/api/interests")) {
        return new Response("[]", {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(null, { status: 204 });
    }) as unknown as typeof fetch;

    try {
      renderWithProviders(<FeedList />);
      await user.click(await screen.findByRole("link", { name: /Prima notizia/i }));

      await waitFor(() =>
        expect(
          calls.filter(
            (c) =>
              c.url.includes("/api/interactions") &&
              (c.body as { type?: string })?.type === "OPENED_EXTERNAL",
          ),
        ).toHaveLength(1),
      );
      expect(
        calls.find((c) => c.url.includes("/api/interactions"))?.body,
      ).toMatchObject({ articleId: 1, type: "OPENED_EXTERNAL" });
    } finally {
      global.fetch = realFetch;
    }
  });
});
