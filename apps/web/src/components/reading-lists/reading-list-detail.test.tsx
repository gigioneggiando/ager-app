import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { ReadingListDetail } from "./reading-list-detail";

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

const realFetch = global.fetch;
let calls: { url: string; method: string }[] = [];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  // Stateful: a removed item stays gone across the post-mutation refetch.
  const removed = new Set<number>();
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method });

    if (url.endsWith("/api/me/reading-lists") && method === "GET") {
      return json({
        items: [
          {
            id: 3,
            name: "Lavoro",
            isDefault: false,
            createdAt: "2026-01-01T10:00:00Z",
          },
        ],
        nextCursor: null,
      });
    }
    const deleteMatch = url.match(/\/items\/(\d+)$/);
    if (deleteMatch && method === "DELETE") {
      removed.add(Number(deleteMatch[1]));
      return new Response(null, { status: 204 });
    }
    if (url.includes("/items") && method === "GET") {
      const items = [
        {
          articleId: 10,
          title: "Articolo Uno",
          url: "https://e.com/a",
          note: "nota mia",
          sourceName: "Fonte",
          publishedAt: "2026-01-02T10:00:00Z",
        },
      ].filter((i) => !removed.has(i.articleId));
      return json({ items, nextCursor: null });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("ReadingListDetail", () => {
  it("renders the item with its note and removes it optimistically", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReadingListDetail listId={3} />);

    expect(await screen.findByText("Articolo Uno")).toBeInTheDocument();
    expect(screen.getByText("nota mia")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Rimuovi/i }));

    await waitFor(() =>
      expect(screen.queryByText("Articolo Uno")).not.toBeInTheDocument(),
    );
    expect(
      calls.find((c) => c.method === "DELETE" && c.url.includes("/items/10")),
    ).toBeTruthy();
  });
});
