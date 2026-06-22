import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { AddToListDialog } from "./add-to-list-dialog";

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
  localStorage.clear();
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });

    if (url.endsWith("/api/me/reading-lists") && method === "GET") {
      return json({
        items: [
          { id: 1, name: "Salvati", isDefault: true, itemsCount: 3 },
          { id: 7, name: "Lavoro", isDefault: false, itemsCount: 1 },
        ],
        nextCursor: null,
      });
    }
    return new Response(null, { status: 201 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("AddToListDialog", () => {
  it("preselects the default list, posts the item with a note, and remembers the list", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AddToListDialog articleId={99} open onOpenChange={onOpenChange} />,
    );

    await screen.findByText("Salvati");
    expect(screen.getByRole("radio", { name: /Salvati/i })).toBeChecked();

    await user.type(screen.getByLabelText(/Nota/i), "Da rivedere");
    await user.click(screen.getByRole("button", { name: /^Salva$/i }));

    await waitFor(() =>
      expect(
        calls.find(
          (c) =>
            c.method === "POST" &&
            c.url.includes("/api/me/reading-lists/1/items"),
        )?.body,
      ).toMatchObject({ articleId: 99, note: "Da rivedere" }),
    );
    // The chosen list is remembered for next time, and the dialog closes.
    expect(localStorage.getItem("ager:lastListId")).toBe("1");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("preselects the last-used list from localStorage", async () => {
    localStorage.setItem("ager:lastListId", "7");
    renderWithProviders(
      <AddToListDialog articleId={99} open onOpenChange={vi.fn()} />,
    );

    await screen.findByText("Lavoro");
    expect(screen.getByRole("radio", { name: /Lavoro/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Salvati/i })).not.toBeChecked();
  });
});
