import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { SourcesView } from "./sources-view";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
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
    calls.push(String(input));
    return json([
      { sourceId: 1, name: "ANSA", type: "RSS", enabled: true, licensingStatus: "licensed_direct", negotiationStatus: "none", tdmOptoutPresent: false },
      { sourceId: 2, name: "Blog X", type: "RSS", enabled: false, licensingStatus: "opted_out", negotiationStatus: "none", tdmOptoutPresent: true },
    ]);
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("SourcesView", () => {
  it("renders the source list", async () => {
    renderWithProviders(<SourcesView />);
    expect(await screen.findByText("ANSA")).toBeInTheDocument();
    expect(screen.getByText("Blog X")).toBeInTheDocument();
  });

  it("requests expiringIn when the Expiring filter is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesView />);
    await screen.findByText("ANSA");

    await user.click(screen.getByRole("button", { name: "In scadenza" }));

    await waitFor(() => expect(calls.some((u) => u.includes("expiringIn=30"))).toBe(true));
  });

  it("forces ingestion of all sources after confirming", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<SourcesView />);
    await screen.findByText("ANSA");

    await user.click(screen.getByRole("button", { name: "Forza tutte" }));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() =>
      expect(calls.some((u) => u.includes("/api/ingestion/pull-all"))).toBe(true),
    );
  });

  it("does not call the API when the force-all confirm is dismissed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWithProviders(<SourcesView />);
    await screen.findByText("ANSA");

    await user.click(screen.getByRole("button", { name: "Forza tutte" }));

    expect(calls.some((u) => u.includes("/api/ingestion/pull-all"))).toBe(false);
  });

  it("filters by licensing status client-side", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesView />);
    await screen.findByText("Blog X");

    await user.selectOptions(screen.getByRole("combobox"), "licensed_direct");

    expect(screen.getByText("ANSA")).toBeInTheDocument();
    expect(screen.queryByText("Blog X")).not.toBeInTheDocument();
  });
});
