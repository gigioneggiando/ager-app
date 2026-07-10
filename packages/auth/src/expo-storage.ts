import * as SecureStore from "expo-secure-store";

import type { SecureStorage } from "./token-store";

/**
 * expo-secure-store implementation of `SecureStorage` (Keychain on iOS, Keystore-backed
 * encrypted prefs on Android). Kept in its own module so the pure token-store logic can be
 * tested without pulling in the native module.
 */
export const expoSecureStorage: SecureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
