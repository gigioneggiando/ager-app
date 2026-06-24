import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { MutedManager } from "./muted-manager";

const realFetch = global.fetch;
let calls: { url: string; method: string }[] = [];
let mutedResponse: () => Response;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let sourcesResponse: () => Response;

beforeEach(() => {
  calls = [];
  // Stateful: a removed topic / source stays gone across the post-delete refetch.
  const removed = new Set<number>();
  const removedSources = new Set<number>();
  mutedResponse = () =>
    json(
      [
        { interestId: 7, slug: "clima", createdAt: "2026-01-01T10:00:00Z" },
        { interestId: 9, slug: "cronaca", createdAt: "2026-01-02T10:00:00Z" },
      ].filter((m) => !removed.has(m.interestId)),
    );
  sourcesResponse = () =>
    json(
      [
        { sourceId: 3, name: "Il Post" },
        { sourceId: 4, name: "ANSA" },
      ].filter((s) => !removedSources.has(s.sourceId)),
    );
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method });
    const delSource = url.match(/\/api\/me\/muted-sources\/(\d+)$/);
    if (delSource && method === "DELETE") {
      removedSources.add(Number(delSource[1]));
      return new Response(null, { status: 204 });
    }
    if (url.includes("/api/me/muted-sources")) return sourcesResponse();
    const del = url.match(/\/api\/me\/muted-interests\/(\d+)$/);
    if (del && method === "DELETE") {
      removed.add(Number(del[1]));
      return new Response(null, { status: 204 });
    }
    if (url.includes("/api/me/muted-interests")) return mutedResponse();
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
  vi.restoreAllMocks();
});

describe("MutedManager", () => {
  it("lists muted topics by their human names and un-mutes one", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MutedManager />, { session: null });

    // Names resolved from the interest taxonomy, not raw slugs.
    expect(await screen.findByText("Clima")).toBeInTheDocument();
    expect(screen.getByText("Cronaca")).toBeInTheDocument();

    const climaRow = screen.getByText("Clima").closest("li")!;
    await user.click(
      within(climaRow).getByRole("button", { name: /Ripristina/i }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Clima")).not.toBeInTheDocument(),
    );
    expect(
      calls.find(
        (c) => c.method === "DELETE" && c.url.endsWith("/api/me/muted-interests/7"),
      ),
    ).toBeTruthy();
    // The other topic stays.
    expect(screen.getByText("Cronaca")).toBeInTheDocument();
  });

  it("shows an empty state when nothing is muted", async () => {
    mutedResponse = () => json([]);
    sourcesResponse = () => json([]);
    renderWithProviders(<MutedManager />, { session: null });

    expect(await screen.findByText("Nessun argomento nascosto")).toBeInTheDocument();
    expect(screen.getByText("Nessuna fonte nascosta")).toBeInTheDocument();
  });

  it("lists muted sources by name and un-mutes one", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MutedManager />, { session: null });

    expect(await screen.findByText("Il Post")).toBeInTheDocument();
    expect(screen.getByText("ANSA")).toBeInTheDocument();

    const postRow = screen.getByText("Il Post").closest("li")!;
    await user.click(
      within(postRow).getByRole("button", { name: /Ripristina/i }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Il Post")).not.toBeInTheDocument(),
    );
    expect(
      calls.find(
        (c) => c.method === "DELETE" && c.url.endsWith("/api/me/muted-sources/3"),
      ),
    ).toBeTruthy();
    // The other source stays.
    expect(screen.getByText("ANSA")).toBeInTheDocument();
  });
});
