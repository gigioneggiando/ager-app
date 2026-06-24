import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { SuggestedInterestsNudge } from "./suggested-interests-nudge";

const SNOOZE_KEY = "ager:suggested-interests:snoozed-until";
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
  localStorage.clear();
  // Stateful: a confirmed/dismissed suggestion stays gone across the post-action refetch.
  const acted = new Set<number>();
  suggestionsResponse = () =>
    json(
      [
        { interestId: 7, slug: "clima", signalCount: 6, cumulativeWeight: 8.2 },
        { interestId: 9, slug: "cronaca", signalCount: 5, cumulativeWeight: 7.4 },
      ].filter((s) => !acted.has(s.interestId)),
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
      return json([
        { id: 7, slug: "clima", name: "Clima" },
        { id: 9, slug: "cronaca", name: "Cronaca" },
      ]);
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("SuggestedInterestsNudge", () => {
  it("surfaces candidates by name and confirms one, which drops out of the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SuggestedInterestsNudge />);

    expect(await screen.findByText("Clima")).toBeInTheDocument();
    expect(screen.getByText("Vuoi allargare il feed?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Conferma «Clima»/i }));

    await waitFor(() => expect(screen.queryByText("Clima")).not.toBeInTheDocument());
    expect(
      calls.find(
        (c) =>
          c.method === "POST" &&
          c.url.endsWith("/api/me/suggested-interests/7/confirm"),
      ),
    ).toBeTruthy();
    // The other candidate stays.
    expect(screen.getByText("Cronaca")).toBeInTheDocument();
  });

  it("dismisses a candidate via Ignora", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SuggestedInterestsNudge />);

    expect(await screen.findByText("Cronaca")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ignora «Cronaca»/i }));

    await waitFor(() => expect(screen.queryByText("Cronaca")).not.toBeInTheDocument());
    expect(
      calls.find(
        (c) =>
          c.method === "POST" &&
          c.url.endsWith("/api/me/suggested-interests/9/dismiss"),
      ),
    ).toBeTruthy();
  });

  it("snoozes the whole surface for a week when skipped", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SuggestedInterestsNudge />);

    expect(await screen.findByText("Clima")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Non ora" }));

    await waitFor(() =>
      expect(screen.queryByText("Vuoi allargare il feed?")).not.toBeInTheDocument(),
    );
    expect(Number(localStorage.getItem(SNOOZE_KEY))).toBeGreaterThan(Date.now());
  });

  it("stays hidden while snoozed", async () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 60_000));
    renderWithProviders(<SuggestedInterestsNudge />);

    await waitFor(() =>
      expect(
        calls.some((c) => c.url.includes("/api/me/suggested-interests")),
      ).toBe(true),
    );
    expect(screen.queryByText("Vuoi allargare il feed?")).not.toBeInTheDocument();
  });

  it("renders nothing when there are no candidates", async () => {
    suggestionsResponse = () => json([]);
    renderWithProviders(<SuggestedInterestsNudge />);

    await waitFor(() =>
      expect(
        calls.some((c) => c.url.includes("/api/me/suggested-interests")),
      ).toBe(true),
    );
    expect(screen.queryByText("Vuoi allargare il feed?")).not.toBeInTheDocument();
  });

  it("does not query or render for anonymous visitors", async () => {
    renderWithProviders(<SuggestedInterestsNudge />, { session: null });

    expect(screen.queryByText("Vuoi allargare il feed?")).not.toBeInTheDocument();
    expect(
      calls.find((c) => c.url.includes("/api/me/suggested-interests")),
    ).toBeFalsy();
  });
});
