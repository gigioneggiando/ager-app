// Pure helpers
export {
  base64UrlDecode,
  base64UrlToBytes,
  utf8BytesToString,
} from "./base64url";
export {
  decodeJwtPayload,
  accessTokenExpiryMs,
  isExpiredOrExpiring,
  userFromToken,
  type JwtPayload,
  type AuthUser,
} from "./jwt";

// Token storage
export {
  TokenStore,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  type SecureStorage,
  type TokenPair,
} from "./token-store";
export { expoSecureStorage } from "./expo-storage";

// Errors
export { AuthError, type AuthErrorKind } from "./errors";

// Session core + api-client wiring
export {
  SessionController,
  type SessionControllerDeps,
  type SessionState,
  type SessionStatus,
} from "./session-controller";
export { createAuthMiddleware } from "./api-middleware";

// React binding
export {
  SessionProvider,
  useSession,
  type SessionContextValue,
} from "./session-context";
