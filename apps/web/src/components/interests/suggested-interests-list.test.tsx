import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { SuggestedInterestsList } from "./suggested-interests-list";

const realFetch = global.fetch;
let calls: { url: string; method: string }[] = [];
let suggestionsResponse: () => Response;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  const acted = new Set<number>();
  suggestionsResponse = () =>
    json(
      [{ interestId: 7, slug: "clima", signalCount: 6, cumulativeWeight: 8.2 }].filter(
        (s) => !acted.has(s.interestId),
      ),
    );
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method });
    const action = url.match(/\/api\/me\/suggested-interests\/(\d+)\/(confirm|dismiss)$/);
    if (action && method === "POST") {
      acted.add(Number(action[1]));
      return new Response(null, { status: 204 });
    }
    if (url.includes("/api/me/suggested-interests")) return suggestionsResponse();
    if (url.includes("/api/interests")) {
      return json([{ id: 7, slug: "clima", name: "Clima" }]);
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("SuggestedInterestsList", () => {
  it("lists suggestions by name and confirms one", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SuggestedInterestsList />);

    expect(await screen.findByText("Argomenti suggeriti")).toBeInTheDocument();
    expect(screen.getByText("Clima")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Conferma «Clima»/i }));

    await waitFor(() => expect(screen.queryByText("Clima")).not.toBeInTheDocument());
    expect(
      calls.find(
        (c) =>
          c.method === "POST" &&
          c.url.endsWith("/api/me/suggested-interests/7/confirm"),
      ),
    ).toBeTruthy();
  });

  it("renders nothing when there are no suggestions", async () => {
    suggestionsResponse = () => json([]);
    renderWithProviders(<SuggestedInterestsList />);

    await waitFor(() =>
      expect(
        calls.some((c) => c.url.includes("/api/me/suggested-interests")),
      ).toBe(true),
    );
    expect(screen.queryByText("Argomenti suggeriti")).not.toBeInTheDocument();
  });
});
