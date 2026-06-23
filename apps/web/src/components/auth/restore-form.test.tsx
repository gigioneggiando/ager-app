import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { RestoreForm } from "./restore-form";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const realFetch = global.fetch;
let calls: { url: string; body: unknown }[] = [];
let requestCodeResponse: () => Response;
let restoreResponse: () => Response;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  requestCodeResponse = () => new Response(null, { status: 204 });
  restoreResponse = () => new Response(null, { status: 204 });
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (url.includes("/api/auth/restore/request-code")) return requestCodeResponse();
    if (url.endsWith("/api/auth/restore")) return restoreResponse();
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("RestoreForm", () => {
  it("email → code → restore → 'now sign in' step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RestoreForm />, { session: null });

    await user.type(screen.getByLabelText("Email"), "del@example.com");
    await user.click(screen.getByRole("button", { name: "Invia il codice" }));

    const codeInput = await screen.findByLabelText("Codice di ripristino");
    await user.type(codeInput, "123456");
    await user.click(screen.getByRole("button", { name: "Ripristina l'account" }));

    expect(await screen.findByText("Account ripristinato")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Vai all'accesso" }),
    ).toHaveAttribute("href", expect.stringContaining("/login"));

    const restore = calls.find((c) => c.url.endsWith("/api/auth/restore"));
    expect(restore?.body).toMatchObject({ email: "del@example.com", code: "123456" });
  });

  it("shows an invalid-code error on 401 and stays on the code step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RestoreForm />, { session: null });

    await user.type(screen.getByLabelText("Email"), "del@example.com");
    await user.click(screen.getByRole("button", { name: "Invia il codice" }));

    restoreResponse = () => json({ errorCode: "invalid_code" }, 401);
    await user.type(await screen.findByLabelText("Codice di ripristino"), "000000");
    await user.click(screen.getByRole("button", { name: "Ripristina l'account" }));

    expect(await screen.findByText(/Codice errato o scaduto/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText("Codice di ripristino")).toBeInTheDocument(),
    );
  });
});
