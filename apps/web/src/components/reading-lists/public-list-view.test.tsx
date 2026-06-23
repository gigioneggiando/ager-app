import { screen } from "@testing-library/react";
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

describe("PublicListView", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/public/users/")) {
        return json({ id: 42, name: "Letture sul clima", description: "Una selezione" });
      }
      if (url.includes("/public/42/items")) {
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
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;
  });

  it("renders the public list metadata and its items", async () => {
    renderWithProviders(<PublicListView owner="user-7" slug="clima" />);

    expect(await screen.findByText("Letture sul clima")).toBeInTheDocument();
    expect(screen.getByText("Una selezione")).toBeInTheDocument();
    expect(await screen.findByText("Articolo Pubblico")).toBeInTheDocument();
  });

  it("shows a not-found state when the list is missing", async () => {
    global.fetch = vi.fn(async () => new Response(null, { status: 404 })) as unknown as typeof fetch;

    renderWithProviders(<PublicListView owner="user-7" slug="missing" />);

    expect(await screen.findByText("Lista non trovata")).toBeInTheDocument();
  });
});
