import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { TakedownDetail } from "./takedown-detail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const realFetch = global.fetch;
let calls: { url: string; method: string; body: unknown }[] = [];

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });

    if (url.includes("/api/admin/takedown/5") && method === "GET") {
      return json({
        requestId: 5,
        articleId: 10,
        articleTitle: "Articolo da rimuovere",
        articleUrl: "https://publisher.example/a/10",
        articleTakedownStatus: "active",
        requesterEmail: "claimant@example.com",
        requesterRole: "owner",
        reason: "Violazione del copyright",
        receivedAt: "2026-06-20T10:00:00Z",
        actionTaken: "none",
        isPending: true,
      });
    }
    if (url.includes("/api/admin/takedown/5") && method === "PATCH") {
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("TakedownDetail", () => {
  it("renders the request and resolves it as Removed with notes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TakedownDetail id={5} />);

    expect(await screen.findByText("Articolo da rimuovere")).toBeInTheDocument();
    expect(screen.getByText("Violazione del copyright")).toBeInTheDocument();

    // Choosing "Rimosso" surfaces the destructive warning.
    await user.click(screen.getByRole("radio", { name: "Rimosso" }));
    expect(screen.getByText(/takedown_done/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Note/i), "Confermato dal titolare");
    await user.click(screen.getByRole("button", { name: "Applica" }));

    await waitFor(() => {
      const patch = calls.find(
        (c) => c.method === "PATCH" && c.url.includes("/api/admin/takedown/5"),
      );
      expect(patch?.body).toMatchObject({
        actionTaken: "removed",
        responseNotes: "Confermato dal titolare",
      });
    });
  });

  it("disables Apply until an action is chosen", async () => {
    renderWithProviders(<TakedownDetail id={5} />);
    await screen.findByText("Articolo da rimuovere");

    expect(screen.getByRole("button", { name: "Applica" })).toBeDisabled();
  });
});
