import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { PublicListView } from "./public-list-view";

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
let calls: { url: string; method: string; body: unknown }[] = [];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

const interactions = () =>
  calls.filter((c) => c.url.includes("/api/interactions") && c.method === "POST");

describe("PublicListView", () => {
  beforeEach(() => {
    calls = [];
    global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
      if (url.includes("/api/interactions") && method === "POST") {
        return new Response(null, { status: 204 });
      }
      // Items are addressed by the owner+slug route (AUTHZ-001). The legacy numeric-id
      // route 404s for Unlisted lists, so the share view must never call it.
      if (url.includes("/public/users/user-7/clima/items")) {
        return json({
          items: [
            {
              articleId: 5,
              title: "Articolo Pubblico",
              url: "https://e.com/x",
              sourceName: "Fonte",
              publishedAt: "2026-01-02T10:00:00Z",
            },
          ],
          nextCursor: null,
        });
      }
      if (url.includes("/public/users/")) {
        return json({ id: 42, name: "Letture sul clima", description: "Una selezione" });
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;
  });

  it("renders the public list metadata and its items", async () => {
    renderWithProviders(<PublicListView owner="user-7" slug="clima" />);

    expect(await screen.findByText("Letture sul clima")).toBeInTheDocument();
    expect(screen.getByText("Una selezione")).toBeInTheDocument();
    expect(await screen.findByText("Articolo Pubblico")).toBeInTheDocument();
  });

  it("loads items via the owner+slug route, never the numeric-id route (AUTHZ-001)", async () => {
    renderWithProviders(<PublicListView owner="user-7" slug="clima" />);

    // The Unlisted list renders its items without a 404 on the share view.
    expect(await screen.findByText("Articolo Pubblico")).toBeInTheDocument();

    const itemCalls = calls.filter((c) => c.url.includes("/items"));
    expect(itemCalls.length).toBeGreaterThan(0);
    expect(itemCalls.every((c) => c.url.includes("/public/users/user-7/clima/items"))).toBe(true);
    // No call to the legacy numeric-id items route (e.g. /public/42/items).
    expect(calls.some((c) => /\/public\/\d+\/items/.test(c.url))).toBe(false);
  });

  it("shows a not-found state when the list is missing", async () => {
    global.fetch = vi.fn(async () => new Response(null, { status: 404 })) as unknown as typeof fetch;

    renderWithProviders(<PublicListView owner="user-7" slug="missing" />);

    expect(await screen.findByText("Lista non trovata")).toBeInTheDocument();
  });

  it("records OPENED_EXTERNAL once when a signed-in visitor opens an item", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicListView owner="user-7" slug="clima" />);

    await user.click(await screen.findByText("Articolo Pubblico"));

    await waitFor(() => expect(interactions()).toHaveLength(1));
    expect(interactions()[0]?.body).toMatchObject({
      articleId: 5,
      type: "OPENED_EXTERNAL",
    });
  });

  it("does not record an interaction for an anonymous visitor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicListView owner="user-7" slug="clima" />, {
      session: null,
    });

    await user.click(await screen.findByText("Articolo Pubblico"));

    // Give any erroneous mutation a chance to fire before asserting none did.
    await waitFor(() => expect(screen.getByText("Articolo Pubblico")).toBeInTheDocument());
    expect(interactions()).toHaveLength(0);
  });
});
