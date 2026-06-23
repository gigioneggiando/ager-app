import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { IngestionLogDetail } from "./ingestion-log-detail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const realFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async () =>
    new Response(
      JSON.stringify({
        logId: 5,
        sourceId: 1,
        sourceName: "ANSA",
        fetchedAt: "2026-06-11T10:00:00Z",
        articlesIngested: 10,
        articlesSkipped: 2,
        robotsTxtHash: "abc123def456abc123def456",
        tdmrepJsonPresent: true,
        tdmrepJsonHash: "ffeeddccbbaa00112233",
        aiTxtPresent: false,
        aiTxtHash: null,
        errors: "Connection timeout",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  ) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("IngestionLogDetail", () => {
  it("renders the run, the forensic policy hashes, and errors", async () => {
    renderWithProviders(<IngestionLogDetail id={5} />);

    expect(await screen.findByRole("heading", { name: "ANSA" })).toBeInTheDocument();
    expect(screen.getByText("robots.txt")).toBeInTheDocument();
    expect(screen.getByText("tdmrep.json")).toBeInTheDocument();
    expect(screen.getByText("ai.txt")).toBeInTheDocument();
    // robots + tdmrep present, ai.txt absent.
    expect(screen.getAllByText("Presente")).toHaveLength(2);
    expect(screen.getByText("Assente")).toBeInTheDocument();
    expect(screen.getByText("Connection timeout")).toBeInTheDocument();
  });
});
