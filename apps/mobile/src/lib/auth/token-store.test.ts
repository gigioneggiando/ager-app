import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TokenStore,
  type SecureStorage,
} from "@ager/auth";

// The @ager/auth index re-exports the expo-secure-store adapter, so stub the native module.
// (jest hoists jest.mock above the imports, so the stub is in place before @ager/auth loads.)
jest.mock("expo-secure-store", () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

function memoryStorage(): SecureStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

describe("TokenStore", () => {
  it("persists the pair under namespaced keys and reads it back", async () => {
    const storage = memoryStorage();
    const store = new TokenStore(storage);

    await store.setTokens({ accessToken: "a1", refreshToken: "r1" });

    expect(storage.data.get(ACCESS_TOKEN_KEY)).toBe("a1");
    expect(storage.data.get(REFRESH_TOKEN_KEY)).toBe("r1");
    expect(await store.getAccessToken()).toBe("a1");
    expect(await store.getRefreshToken()).toBe("r1");
  });

  it("clear() removes both tokens", async () => {
    const storage = memoryStorage();
    const store = new TokenStore(storage);
    await store.setTokens({ accessToken: "a1", refreshToken: "r1" });

    await store.clear();

    expect(await store.getAccessToken()).toBeNull();
    expect(await store.getRefreshToken()).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("returns null when nothing is stored", async () => {
    const store = new TokenStore(memoryStorage());
    expect(await store.getAccessToken()).toBeNull();
    expect(await store.getRefreshToken()).toBeNull();
  });
});
