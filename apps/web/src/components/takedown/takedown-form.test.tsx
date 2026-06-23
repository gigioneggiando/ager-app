import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { TakedownForm } from "./takedown-form";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const realFetch = global.fetch;
let calls: { url: string; body: unknown }[] = [];
let response: () => Response;
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  calls = [];
  response = () => json({ requestId: 42 }, 201);
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : null });
    return response();
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("ID del contenuto"), "10");
  await user.type(screen.getByLabelText("La tua email"), "owner@example.com");
  await user.type(
    screen.getByLabelText("Motivazione"),
    "Questo articolo viola il copyright.",
  );
  await user.click(screen.getByRole("button", { name: "Invia la segnalazione" }));
}

describe("TakedownForm", () => {
  it("submits an article takedown and shows the confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TakedownForm />, { session: null });

    await fillAndSubmit(user);

    expect(await screen.findByText("Segnalazione inviata")).toBeInTheDocument();
    expect(screen.getByText(/#42/)).toBeInTheDocument();
    const post = calls.find((c) => c.url.includes("/api/takedown"));
    expect(post?.body).toMatchObject({
      articleId: 10,
      requesterEmail: "owner@example.com",
      requesterRole: "publisher",
      reason: "Questo articolo viola il copyright.",
    });
  });

  it("shows a rate-limit error on 429", async () => {
    response = () => new Response(null, { status: 429 });
    const user = userEvent.setup();
    renderWithProviders(<TakedownForm />, { session: null });

    await fillAndSubmit(user);

    expect(await screen.findByText(/Troppe richieste/i)).toBeInTheDocument();
    expect(screen.queryByText("Segnalazione inviata")).not.toBeInTheDocument();
  });
});
