import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { TakedownQueue } from "./takedown-queue";

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
      {
        requestId: 1,
        articleId: 10,
        articleTitle: "Articolo segnalato",
        reason: "Diffamazione",
        requesterEmail: "a@b.com",
        receivedAt: "2026-06-20T10:00:00Z",
        actionTaken: "none",
        isPending: true,
      },
    ]);
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("TakedownQueue", () => {
  it("loads the pending queue by default and renders rows", async () => {
    renderWithProviders(<TakedownQueue />);

    expect(await screen.findByText("Articolo segnalato")).toBeInTheDocument();
    expect(screen.getByText(/a@b\.com/)).toBeInTheDocument();
    expect(
      calls.some(
        (u) => u.includes("/api/admin/takedown") && u.includes("pending=true"),
      ),
    ).toBe(true);
  });

  it("switches the filter to Recenti → requests recentDays", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TakedownQueue />);
    await screen.findByText("Articolo segnalato");

    await user.click(screen.getByRole("button", { name: "Recenti" }));

    await waitFor(() =>
      expect(calls.some((u) => u.includes("recentDays=30"))).toBe(true),
    );
  });
});
