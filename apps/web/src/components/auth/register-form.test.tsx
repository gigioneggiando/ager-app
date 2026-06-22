import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { RegisterForm } from "./register-form";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

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
// Per-test overridable responders.
let requestCodeResponse: () => Response;
let registerResponse: () => Response;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  replace.mockClear();
  refresh.mockClear();
  requestCodeResponse = () => new Response(null, { status: 204 });
  registerResponse = () => json({ userId: "u1", role: "user", needsOnboarding: true });
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
    if (url.includes("/api/auth/register/request-code")) return requestCodeResponse();
    if (url.endsWith("/api/auth/register")) return registerResponse();
    if (url.includes("/api/auth/session"))
      return json({ session: { userId: "u1", email: "new@example.com", role: "user" } });
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

async function fillDetailsAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome utente"), "newuser");
  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.click(screen.getByRole("button", { name: "Invia il codice" }));
}

describe("RegisterForm", () => {
  it("request-code → verify → session set → redirects to onboarding", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { session: null });

    await fillDetailsAndSubmit(user);

    // Step 2 appears once the code is sent.
    const codeInput = await screen.findByLabelText("Codice di verifica");
    await user.type(codeInput, "123456");
    await user.click(screen.getByRole("button", { name: "Crea account" }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        expect.stringContaining("/it/onboarding"),
      ),
    );
    // request-code carried username + email + an (empty) honeypot.
    const reqCode = calls.find((c) => c.url.includes("/register/request-code"));
    expect(reqCode?.body).toMatchObject({ username: "newuser", email: "new@example.com" });
    // create call sent the OTP as `code`.
    const create = calls.find(
      (c) => c.method === "POST" && c.url.endsWith("/api/auth/register"),
    );
    expect(create?.body).toMatchObject({ username: "newuser", email: "new@example.com", code: "123456" });
  });

  it("existing email → 409 → shows the already-registered error and a link to sign in", async () => {
    requestCodeResponse = () =>
      json({ code: "email_already_registered" }, 409);
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { session: null });

    await fillDetailsAndSubmit(user);

    expect(
      await screen.findByText(/account con questa email o nome utente/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vai all'accesso/i })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("bad/expired code → 401 → shows invalid-code error, no redirect", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { session: null });
    await fillDetailsAndSubmit(user);

    registerResponse = () => json({ code: "otp_invalid" }, 401);
    const codeInput = await screen.findByLabelText("Codice di verifica");
    await user.type(codeInput, "000000");
    await user.click(screen.getByRole("button", { name: "Crea account" }));

    expect(await screen.findByText(/Codice errato o scaduto/i)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
