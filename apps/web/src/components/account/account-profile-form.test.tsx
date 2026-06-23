import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@ager/api-client";

import { renderWithProviders } from "@/test/test-utils";
import { AccountProfileForm } from "./account-profile-form";

const realFetch = global.fetch;
let calls: { url: string; method: string; body: unknown }[] = [];

const profile: UserProfile = {
  id: "u1",
  username: "old_name",
  email: "me@example.com",
  role: "user",
  status: "active",
  locale: "it",
  timezone: "",
  avatarUrl: "",
} as UserProfile;

beforeEach(() => {
  calls = [];
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify({ ...profile, username: "new_name" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("AccountProfileForm", () => {
  it("edits the username and PATCHes the profile", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountProfileForm profile={profile} />);

    const usernameInput = screen.getByLabelText("Nome utente");
    await user.clear(usernameInput);
    await user.type(usernameInput, "new_name");
    await user.click(screen.getByRole("button", { name: "Salva profilo" }));

    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH" && c.url.endsWith("/api/me"));
      expect(patch?.body).toMatchObject({ username: "new_name", locale: "it" });
    });
  });
});
