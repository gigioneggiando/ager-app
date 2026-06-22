import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { SearchView } from "./search-view";

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

    if (url.includes("/api/articles/tags") && !url.includes("/search")) {
      return json([{ slug: "economia", name: "Economia", keywords: [] }]);
    }
    if (url.includes("/api/articles/tags/") && url.includes("/search")) {
      return json({
        items: [{ articleId: 2, title: "Per tema", publishedAt: "2026-01-01T00:00:00Z" }],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    }
    if (url.includes("/api/articles/search")) {
      return json({
        items: [{ articleId: 1, title: "Risultato uno", publishedAt: "2026-01-01T00:00:00Z" }],
        total: 45,
        page: Number(new URL(url, "http://x").searchParams.get("page") ?? 1),
        pageSize: 20,
      });
    }
    return json({});
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("SearchView", () => {
  it("starts idle, runs a text search, and paginates", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchView />);

    expect(screen.getByText(/Inizia una ricerca/i)).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "clima");
    await user.click(screen.getByRole("button", { name: "Cerca" }));

    expect(await screen.findByText("Risultato uno")).toBeInTheDocument();
    expect(screen.getByText("Pagina 1 di 3")).toBeInTheDocument();
    expect(
      calls.some((u) => u.includes("/api/articles/search") && u.includes("q=clima")),
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Successiva" }));
    await waitFor(() =>
      expect(
        calls.some(
          (u) => u.includes("/api/articles/search") && u.includes("page=2"),
        ),
      ).toBe(true),
    );
  });

  it("searches by tag when a tag chip is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchView />);

    const tag = await screen.findByRole("button", { name: "Economia" });
    await user.click(tag);

    expect(await screen.findByText("Per tema")).toBeInTheDocument();
    expect(
      calls.some((u) => u.includes("/api/articles/tags/economia/search")),
    ).toBe(true);
  });
});
