import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { StatsView } from "./stats-view";

const realFetch = global.fetch;
let windows: string[] = [];

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  windows = [];
  localStorage.clear();
  global.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const window = new URL(url, "http://x").searchParams.get("window") ?? "";
    windows.push(window);
    return json({
      window,
      total: 12,
      byType: { OPENED_EXTERNAL: 8, SAVE: 4 },
      distinctSourceRatio: 0.75,
      topTopicShare: 0.4,
      topicDistribution: { Economia: 5, Politica: 3 },
    });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("StatsView", () => {
  it("loads the default 30d window and renders variety indices", async () => {
    renderWithProviders(<StatsView />);

    expect(await screen.findByText("75%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    // Interaction-type labels are localized.
    expect(screen.getByText("Aperture sull'editore")).toBeInTheDocument();
    expect(screen.getByText("Salvataggi")).toBeInTheDocument();
    // Topic distribution.
    expect(screen.getByText("Economia")).toBeInTheDocument();
    expect(windows[0]).toBe("30d");
  });

  it("refetches when the window changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StatsView />);
    await screen.findByText("75%");

    await user.click(screen.getByRole("button", { name: "7 giorni" }));

    await waitFor(() => expect(windows).toContain("7d"));
    expect(localStorage.getItem("ager:statsWindow")).toBe("7d");
  });
});
