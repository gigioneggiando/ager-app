import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { ReadingListsView } from "./reading-lists-view";

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

beforeEach(() => {
  calls = [];
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });

    if (url.endsWith("/api/me/reading-lists") && method === "GET") {
      // Default list returned last on purpose: the view must pin it first.
      return json({
        items: [
          { id: 5, name: "Da leggere", isDefault: false, visibility: 0, itemsCount: 2 },
          { id: 1, name: "Salvati", isDefault: true, visibility: 0, itemsCount: 7 },
        ],
        nextCursor: null,
      });
    }
    if (url.endsWith("/api/me/reading-lists") && method === "POST") {
      return json({ id: 9 }, 201);
    }
    if (/\/api\/me\/reading-lists\/\d+$/.test(url) && method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("ReadingListsView", () => {
  it("pins the default list first and badges it", async () => {
    renderWithProviders(<ReadingListsView />);

    const items = await screen.findAllByRole("listitem");
    expect(within(items[0]).getByText("Salvati")).toBeInTheDocument();
    expect(within(items[0]).getByText(/Predefinita/i)).toBeInTheDocument();
    expect(within(items[1]).getByText("Da leggere")).toBeInTheDocument();
  });

  it("does not offer to delete the default list", async () => {
    renderWithProviders(<ReadingListsView />);

    const items = await screen.findAllByRole("listitem");
    expect(
      within(items[0]).queryByRole("button", { name: /Elimina/i }),
    ).toBeNull();
    expect(
      within(items[1]).getByRole("button", { name: /Elimina/i }),
    ).toBeInTheDocument();
  });

  it("creates a list through the dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReadingListsView />);
    await screen.findByText("Salvati");

    await user.click(screen.getByRole("button", { name: /Crea lista/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Nome/i), "Tecnologia");
    await user.click(within(dialog).getByRole("button", { name: /Crea lista/i }));

    await waitFor(() =>
      expect(
        calls.find(
          (c) =>
            c.method === "POST" && c.url.endsWith("/api/me/reading-lists"),
        )?.body,
      ).toMatchObject({ name: "Tecnologia" }),
    );
  });

  it("deletes a non-default list after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<ReadingListsView />);
    await screen.findByText("Da leggere");

    await user.click(screen.getByRole("button", { name: /Elimina/i }));

    await waitFor(() =>
      expect(
        calls.find(
          (c) => c.method === "DELETE" && /\/reading-lists\/5$/.test(c.url),
        ),
      ).toBeTruthy(),
    );
  });
});
