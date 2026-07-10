/** Auth failure kinds — the UI maps these to localized messages. */
export type AuthErrorKind =
  | "rate_limit" // 429 — too many attempts
  | "invalid_code" // 401 on verify — wrong/expired OTP
  | "network" // transport failure
  | "request_failed" // unexpected non-2xx
  | "unknown";

export class AuthError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind, message?: string) {
    super(message ?? kind);
    this.name = "AuthError";
    this.kind = kind;
  }
}
