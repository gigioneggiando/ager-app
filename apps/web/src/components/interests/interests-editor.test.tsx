import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { InterestsEditor } from "./interests-editor";

const realFetch = global.fetch;

const taxonomy = [
  { id: 1, name: "Macro", parentId: null, slug: "m", description: null },
  { id: 2, name: "Topic 1", parentId: 1, slug: "t1", description: null },
  { id: 3, name: "Topic 2", parentId: 1, slug: "t2", description: null },
];

beforeEach(() => {
  global.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/api/me/interests")) {
      // The user currently follows Topic 1 (id 2).
      return new Response(
        JSON.stringify([{ interestId: 2, slug: "t1", weight: 3, source: "Explicit" }]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("/api/interests")) {
      return new Response(JSON.stringify(taxonomy), {
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

describe("InterestsEditor", () => {
  it("pre-selects the user's current interests from the server", async () => {
    renderWithProviders(<InterestsEditor />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Topic 1" })).toBeInTheDocument(),
    );

    // Topic 1 (current) is selected; Topic 2 is not.
    expect(screen.getByRole("button", { name: "Topic 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Topic 2" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
