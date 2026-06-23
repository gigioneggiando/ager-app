import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { AccountDangerZone } from "./account-danger-zone";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

const realFetch = global.fetch;
let calls: { url: string; method: string }[] = [];

beforeEach(() => {
  calls = [];
  replace.mockClear();
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method });
    return new Response(null, { status: 204 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("AccountDangerZone", () => {
  it("confirms, deletes the account, logs out, and redirects", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountDangerZone />);

    await user.click(screen.getByRole("button", { name: "Elimina account" }));
    // Confirmation dialog.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sì, elimina" }));

    await waitFor(() =>
      expect(
        calls.some((c) => c.method === "DELETE" && c.url.endsWith("/api/me")),
      ).toBe(true),
    );
    // Logs out (clears cookies) and leaves the account area.
    await waitFor(() => {
      expect(
        calls.some((c) => c.method === "POST" && c.url.includes("/api/auth/logout")),
      ).toBe(true);
      expect(replace).toHaveBeenCalledWith("/it");
    });
  });
});
