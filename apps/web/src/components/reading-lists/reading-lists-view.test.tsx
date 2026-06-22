import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { ReadingListsView } from "./reading-lists-view";

const realFetch = global.fetch;
let calls: { url: string; method: string; body: unknown }[] = [];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  // Stateful: a deleted item stays gone across the post-mutation refetch.
  const removed = new Set<number>();
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });

    if (url.endsWith("/api/me/reading-lists") && method === "GET") {
      return json({ items: [{ id: 1, name: "Salvati" }], nextCursor: null });
    }
    if (url.endsWith("/api/me/reading-lists") && method === "POST") {
      return json({ id: 2 }, 201);
    }
    const deleteMatch = url.match(/\/items\/(\d+)$/);
    if (deleteMatch && method === "DELETE") {
      removed.add(Number(deleteMatch[1]));
      return new Response(null, { status: 204 });
    }
    if (url.includes("/items") && method === "GET") {
      const items = [
        { articleId: 10, title: "Articolo", url: "https://e.com/a" },
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

describe("ReadingListsView", () => {
  it("renders lists with their items and removes an item optimistically", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReadingListsView />);

    await waitFor(() =>
      expect(screen.getByText("Salvati")).toBeInTheDocument(),
    );
    expect(await screen.findByText("Articolo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Rimuovi/i }));

    // Optimistic removal from the list.
    await waitFor(() =>
      expect(screen.queryByText("Articolo")).not.toBeInTheDocument(),
    );
    expect(
      calls.find(
        (c) => c.method === "DELETE" && c.url.includes("/items/10"),
      ),
    ).toBeTruthy();
  });

  it("creates a new list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReadingListsView />);

    await screen.findByText("Salvati");

    await user.type(
      screen.getByLabelText(/Nuova lista/i),
      "Da leggere",
    );
    await user.click(screen.getByRole("button", { name: /Crea/i }));

    await waitFor(() =>
      expect(
        calls.find(
          (c) =>
            c.method === "POST" && c.url.endsWith("/api/me/reading-lists"),
        )?.body,
      ).toMatchObject({ name: "Da leggere" }),
    );
  });
});
