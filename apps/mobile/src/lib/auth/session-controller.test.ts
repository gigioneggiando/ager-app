import type { AgerClient } from "@ager/api-client";
import { SessionController, TokenStore, type SecureStorage } from "@ager/auth";

// jest hoists jest.mock above the imports, so the native module is stubbed before load.
jest.mock("expo-secure-store", () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

function memoryStorage(): SecureStorage {
  const data = new Map<string, string>();
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

function accessToken(claims: Record<string, unknown>): string {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;

describe("SessionController", () => {
  const post = jest.fn();
  const authClient = { POST: post } as unknown as AgerClient;
  let store: TokenStore;
  let controller: SessionController;

  beforeEach(() => {
    post.mockReset();
    store = new TokenStore(memoryStorage());
    controller = new SessionController({ authClient, tokenStore: store });
  });

  function mockAuthResult() {
    post.mockResolvedValue({
      data: {
        accessToken: accessToken({
          sub: "u1",
          email: "u@ager.it",
          exp: FUTURE_EXP,
        }),
        refreshToken: "refresh-1",
      },
      error: undefined,
      response: { ok: true, status: 200 },
    });
  }

  it("verifyOtp persists the pair and reports authenticated with the decoded user", async () => {
    mockAuthResult();

    await controller.verifyOtp("u@ager.it", "123456");

    expect(controller.getSnapshot().status).toBe("authenticated");
    expect(controller.getSnapshot().user).toEqual({
      userId: "u1",
      email: "u@ager.it",
      role: "user",
    });
    expect(await store.getRefreshToken()).toBe("refresh-1");
  });

  it("requestOtp surfaces a rate-limit (429)", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { title: "rate limited" },
      response: { ok: false, status: 429 },
    });

    await expect(controller.requestOtp("u@ager.it")).rejects.toHaveProperty(
      "kind",
      "rate_limit",
    );
  });

  it("verifyOtp surfaces a wrong code (401)", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { title: "unauthorized" },
      response: { ok: false, status: 401 },
    });

    await expect(
      controller.verifyOtp("u@ager.it", "000000"),
    ).rejects.toHaveProperty("kind", "invalid_code");
  });

  it("a rejected refresh (401 = reuse-detected/invalid) forces a sign-out", async () => {
    mockAuthResult();
    await controller.verifyOtp("u@ager.it", "123456");

    post.mockResolvedValue({
      data: undefined,
      error: { title: "unauthorized" },
      response: { ok: false, status: 401 },
    });

    const result = await controller.refresh();

    expect(result).toBeNull();
    expect(controller.getSnapshot().status).toBe("anonymous");
    expect(await store.getAccessToken()).toBeNull();
    expect(await store.getRefreshToken()).toBeNull();
  });

  it("a transient refresh failure (network) keeps the session", async () => {
    mockAuthResult();
    await controller.verifyOtp("u@ager.it", "123456");

    post.mockRejectedValue(new Error("network down"));

    const result = await controller.refresh();

    expect(result).toBeNull();
    expect(controller.getSnapshot().status).toBe("authenticated");
    expect(await store.getRefreshToken()).toBe("refresh-1"); // NOT cleared
  });

  it("signOut clears the store and returns to anonymous", async () => {
    mockAuthResult();
    await controller.verifyOtp("u@ager.it", "123456");

    post.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { ok: true, status: 200 },
    });
    await controller.signOut();

    expect(controller.getSnapshot().status).toBe("anonymous");
    expect(controller.getSnapshot().user).toBeNull();
    expect(await store.getAccessToken()).toBeNull();
  });
});
