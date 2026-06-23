import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { SourceDetail } from "./source-detail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const realFetch = global.fetch;
let calls: { url: string; method: string; body: unknown }[] = [];
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const source = {
  sourceId: 5,
  name: "ANSA",
  type: "RSS",
  url: "https://ansa.it",
  rssUrl: "https://ansa.it/rss.xml",
  enabled: true,
  licensingStatus: "no_agreement_linking_only",
  negotiationStatus: "none",
  tdmOptoutPresent: false,
  imageHotlinkAllowed: true,
  updatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  calls = [];
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (url.endsWith("/api/admin/sources/5") && method === "GET") return json(source);
    if (url.endsWith("/api/admin/sources/5") && method === "PATCH")
      return new Response(null, { status: 204 });
    if (url.includes("/disable")) return new Response(null, { status: 204 });
    if (url.includes("/refresh-tos")) return json({ previousHash: "a", currentHash: "b", changed: true });
    if (url.includes("/pull")) return new Response(null, { status: 200 });
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("SourceDetail", () => {
  it("edits the licensing status and saves a PATCH", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourceDetail id={5} />);

    expect(await screen.findByRole("heading", { name: "ANSA" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Licenza"), "licensed_direct");
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => {
      const patch = calls.find(
        (c) => c.method === "PATCH" && c.url.endsWith("/api/admin/sources/5"),
      );
      expect(patch?.body).toMatchObject({ licensingStatus: "licensed_direct" });
    });
  });

  it("forces ingestion of the source after confirming", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<SourceDetail id={5} />);
    await screen.findByRole("heading", { name: "ANSA" });

    await user.click(screen.getByRole("button", { name: "Forza ingestion" }));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() =>
      expect(
        calls.some(
          (c) => c.method === "POST" && c.url.includes("/api/ingestion/sources/5/pull"),
        ),
      ).toBe(true),
    );
  });

  it("disables an enabled source", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourceDetail id={5} />);
    await screen.findByRole("heading", { name: "ANSA" });

    await user.click(screen.getByRole("button", { name: "Disabilita" }));

    await waitFor(() =>
      expect(
        calls.some((c) => c.method === "POST" && c.url.includes("/api/admin/sources/5/disable")),
      ).toBe(true),
    );
  });
});
