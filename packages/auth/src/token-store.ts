/**
 * Token persistence. The store is defined against a tiny `SecureStorage` interface so the
 * core is testable with an in-memory fake — the expo-secure-store implementation lives in
 * ./expo-storage.ts and is injected by the app. Never log token values.
 */

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** SecureStore keys. Namespaced to avoid collisions with any other stored value. */
export const ACCESS_TOKEN_KEY = "ager.auth.accessToken";
export const REFRESH_TOKEN_KEY = "ager.auth.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenStore {
  constructor(private readonly storage: SecureStorage) {}

  getAccessToken(): Promise<string | null> {
    return this.storage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): Promise<string | null> {
    return this.storage.getItem(REFRESH_TOKEN_KEY);
  }

  async setTokens(pair: TokenPair): Promise<void> {
    await Promise.all([
      this.storage.setItem(ACCESS_TOKEN_KEY, pair.accessToken),
      this.storage.setItem(REFRESH_TOKEN_KEY, pair.refreshToken),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.storage.removeItem(ACCESS_TOKEN_KEY),
      this.storage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  }
}
