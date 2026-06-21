import { afterEach, describe, expect, it, vi } from "vitest";

import { getSession } from "@/lib/server/session";
import MePage from "./page";

vi.mock("@/lib/server/session", () => ({ getSession: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const mockGetSession = vi.mocked(getSession);

afterEach(() => vi.clearAllMocks());

describe("MePage (protected route)", () => {
  it("redirects to /login (preserving next) when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(
      MePage({ params: Promise.resolve({ locale: "it" }) }),
    ).rejects.toThrow("REDIRECT:/it/login?next=%2Fit%2Fme");
  });

  it("renders when a session exists", async () => {
    mockGetSession.mockResolvedValue({
      userId: "u1",
      email: "a@b.com",
      role: "user",
    });
    await expect(
      MePage({ params: Promise.resolve({ locale: "it" }) }),
    ).resolves.toBeTruthy();
  });
});
