import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { CreateSourceDialog } from "./create-source-dialog";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const realFetch = global.fetch;
let calls: { url: string; method: string; body: unknown }[] = [];
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Probe responds valid; create returns the new id.
let probeResponse: () => Response;

beforeEach(() => {
  calls = [];
  push.mockClear();
  probeResponse = () => json({ valid: true, rootElement: "rss" });
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (url.includes("/probe-rss")) return probeResponse();
    if (url.endsWith("/api/admin/sources")) return json({ id: 7 }, 201);
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("CreateSourceDialog", () => {
  it("gates create behind a successful RSS probe, then creates and navigates to detail", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateSourceDialog open onOpenChange={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("Nome"), "ANSA");
    await user.type(screen.getByLabelText("URL"), "https://ansa.it");
    await user.type(screen.getByLabelText("Feed RSS"), "https://ansa.it/rss.xml");

    // Create is disabled until the feed is validated.
    const createBtn = screen.getByRole("button", { name: "Crea fonte" });
    expect(createBtn).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Verifica feed" }));
    expect(await screen.findByText(/Feed valido/)).toBeInTheDocument();
    expect(createBtn).toBeEnabled();

    await user.click(createBtn);

    await waitFor(() => {
      const create = calls.find(
        (c) => c.method === "POST" && c.url.endsWith("/api/admin/sources"),
      );
      expect(create?.body).toMatchObject({
        type: "RSS",
        name: "ANSA",
        url: "https://ansa.it",
        rssUrl: "https://ansa.it/rss.xml",
      });
    });
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/it/admin/sources/7"),
    );
  });

  it("keeps create disabled when the probe is invalid", async () => {
    probeResponse = () => json({ valid: false, reason: "not_xml", statusCode: 200 });
    const user = userEvent.setup();
    renderWithProviders(<CreateSourceDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "Bad");
    await user.type(screen.getByLabelText("URL"), "https://bad.example");
    await user.type(screen.getByLabelText("Feed RSS"), "https://bad.example/x");
    await user.click(screen.getByRole("button", { name: "Verifica feed" }));

    expect(await screen.findByText(/Feed non valido/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crea fonte" })).toBeDisabled();
  });
});
