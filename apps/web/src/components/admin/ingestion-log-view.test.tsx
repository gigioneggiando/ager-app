import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { IngestionLogView } from "./ingestion-log-view";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
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
    if (url.includes("/ingestion-log/stats")) {
      return json({
        windowDays: 14,
        from: "2026-06-10",
        to: "2026-06-11",
        points: [
          { day: "2026-06-10", sourceId: 1, sourceName: "ANSA", articlesIngested: 10, articlesSkipped: 2, runsWithErrors: 0 },
        ],
      });
    }
    return json([
      { logId: 1, sourceId: 1, sourceName: "ANSA", fetchedAt: "2026-06-11T10:00:00Z", articlesIngested: 10, articlesSkipped: 2, errors: null },
    ]);
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("IngestionLogView", () => {
  it("renders the stats chart and the log rows", async () => {
    renderWithProviders(<IngestionLogView />);
    expect(await screen.findByText("ANSA")).toBeInTheDocument();
    // The 14-day chart renders as an aria-labelled image.
    expect(await screen.findByRole("img", { name: /articoli acquisiti/i })).toBeInTheDocument();
  });

  it("requests errorsOnly when the Errors filter is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<IngestionLogView />);
    await screen.findByText("ANSA");

    await user.click(screen.getByRole("button", { name: "Solo con errori" }));

    await waitFor(() =>
      expect(
        calls.some((u) => u.includes("/ingestion-log?") && u.includes("errorsOnly=true")),
      ).toBe(true),
    );
  });
});
