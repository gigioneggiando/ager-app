import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { ExploreView } from "./explore-view";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const realFetch = global.fetch;
let calls: string[] = [];

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  global.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/api/articles/tags/")) {
      // tag search
      return json({
        items: [
          { articleId: 1, title: "Crisi idrica", publishedAt: "2026-01-02T10:00:00Z" },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    }
    if (url.endsWith("/api/articles/tags")) {
      return json([
        { slug: "agricoltura", name: "Agricoltura" },
        { slug: "clima", name: "Clima" },
      ]);
    }
    return json({ items: [], total: 0 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("ExploreView", () => {
  it("renders the tag grid and shows results after picking a tag", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExploreView />);

    const tagButton = await screen.findByRole("button", { name: "Agricoltura" });
    expect(screen.getByRole("button", { name: "Clima" })).toBeInTheDocument();

    await user.click(tagButton);

    expect(await screen.findByText("Crisi idrica")).toBeInTheDocument();
    expect(tagButton).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(
        calls.some((u) => u.includes("/api/articles/tags/agricoltura/search")),
      ).toBe(true),
    );
  });
});
