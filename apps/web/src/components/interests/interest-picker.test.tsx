import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { InterestPicker } from "./interest-picker";

const realFetch = global.fetch;
let saveBody: unknown = null;

const taxonomy = [
  { id: 1, name: "Macro", parentId: null, slug: "m", description: null },
  ...Array.from({ length: 14 }, (_, i) => ({
    id: i + 2,
    name: `Topic ${i + 1}`,
    parentId: 1,
    slug: `t${i + 1}`,
    description: null,
  })),
];

beforeEach(() => {
  saveBody = null;
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/interests")) {
      return new Response(JSON.stringify(taxonomy), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/api/me/interests")) {
      saveBody = init?.body ? JSON.parse(String(init.body)) : null;
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("InterestPicker", () => {
  it("has a soft minimum (no hard 5-gate) and no hard maximum", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithProviders(<InterestPicker onSaved={onSaved} saveLabel="Salva" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Topic 1" })).toBeInTheDocument(),
    );

    const save = screen.getByRole("button", { name: "Salva" });
    expect(save).toBeDisabled(); // nothing selected → backend rejects empty

    // A single selection already enables save (soft minimum, not a hard gate).
    await user.click(screen.getByRole("button", { name: "Topic 1" }));
    expect(save).toBeEnabled();

    // No hard maximum: select 12 (> the old 10 cap) and they all stay selectable.
    for (let i = 2; i <= 12; i++) {
      await user.click(screen.getByRole("button", { name: `Topic ${i}` }));
    }
    await user.click(save);

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect((saveBody as { interestIds: number[] }).interestIds).toHaveLength(12);
  });
});
