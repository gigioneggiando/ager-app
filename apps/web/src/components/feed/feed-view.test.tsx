import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedPage } from "@ager/api-client";

import { renderWithProviders } from "@/test/test-utils";
import { fetchFeedPage } from "@/features/feed/api";
import { FeedView } from "./feed-view";

vi.mock("@/features/feed/api", () => ({
  FEED_PAGE_LIMIT: 20,
  fetchFeedPage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/it",
}));

const mockFetch = vi.mocked(fetchFeedPage);

const emptyPage: FeedPage = {
  items: [],
  nextCursor: null,
  feedMode: "balanced",
  recommenderVersion: "v1",
};

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(emptyPage);
});

describe("FeedView", () => {
  it("fetches the balanced feed by default", async () => {
    renderWithProviders(<FeedView />);
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "balanced" }),
      ),
    );
  });

  it("re-queries with the chosen mode and persists it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedView />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    await user.selectOptions(
      screen.getByLabelText("Ordina per"),
      "most_recent",
    );

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "most_recent" }),
      ),
    );
    expect(localStorage.getItem("ager:feedMode")).toBe("most_recent");
  });

  it("reads the persisted mode on mount", async () => {
    localStorage.setItem("ager:feedMode", "chronological");
    renderWithProviders(<FeedView />);
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "chronological" }),
      ),
    );
  });

  it("notes that modes personalize once signed in, only for anonymous visitors", async () => {
    const { unmount } = renderWithProviders(<FeedView />, { session: null });
    expect(
      screen.getByText(/Le modalità personalizzano il feed/i),
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(<FeedView />);
    expect(
      screen.queryByText(/Le modalità personalizzano il feed/i),
    ).not.toBeInTheDocument();
  });
});
