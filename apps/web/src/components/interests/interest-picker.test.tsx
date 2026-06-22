import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { InterestPicker } from "./interest-picker";

const realFetch = global.fetch;
let saveBody: unknown = null;

const taxonomy = [
  { id: 1, name: "Macro", parentId: null, slug: "m", description: null },
  ...Array.from({ length: 7 }, (_, i) => ({
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
  it("requires >=5 selections then saves the chosen interest ids", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithProviders(
      <InterestPicker onSaved={onSaved} saveLabel="Salva" />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Topic 1" })).toBeInTheDocument(),
    );

    const save = screen.getByRole("button", { name: "Salva" });
    expect(save).toBeDisabled(); // fewer than 5 selected

    for (let i = 1; i <= 5; i++) {
      await user.click(screen.getByRole("button", { name: `Topic ${i}` }));
    }
    expect(save).toBeEnabled();

    await user.click(save);

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(saveBody).toEqual({ interestIds: [2, 3, 4, 5, 6] });
  });
});
