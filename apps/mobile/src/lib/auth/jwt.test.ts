import {
  accessTokenExpiryMs,
  base64UrlDecode,
  decodeJwtPayload,
  isExpiredOrExpiring,
  userFromToken,
} from "@ager/auth";

// jest hoists jest.mock above the imports, so the native module is stubbed before load.
jest.mock("expo-secure-store", () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

const ROLE_CLAIM_URI =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.sig`;
}

describe("base64UrlDecode", () => {
  it("round-trips UTF-8 text", () => {
    const encoded = Buffer.from("Caffè ☕ — sìntesi", "utf8").toString(
      "base64url",
    );
    expect(base64UrlDecode(encoded)).toBe("Caffè ☕ — sìntesi");
  });
});

describe("jwt decode", () => {
  const exp = 2_000_000_000; // seconds
  const expMs = exp * 1000;
  const token = makeJwt({
    sub: "user-1",
    email: "user@ager.it",
    exp,
    [ROLE_CLAIM_URI]: "admin",
  });

  it("decodes the payload", () => {
    expect(decodeJwtPayload(token)?.sub).toBe("user-1");
  });

  it("reads exp as epoch milliseconds", () => {
    expect(accessTokenExpiryMs(token)).toBe(expMs);
    expect(accessTokenExpiryMs(null)).toBeNull();
  });

  it("isExpiredOrExpiring across the skew window", () => {
    expect(isExpiredOrExpiring(token, 60, expMs - 5 * 60_000)).toBe(false); // fresh
    expect(isExpiredOrExpiring(token, 60, expMs - 30_000)).toBe(true); // within skew
    expect(isExpiredOrExpiring(token, 60, expMs + 1_000)).toBe(true); // expired
  });

  it("treats a token with no readable exp as not-expiring (reactive path covers it)", () => {
    expect(isExpiredOrExpiring(makeJwt({ sub: "x" }))).toBe(false);
  });

  it("reconstructs the user from claims (sub / email / .NET role)", () => {
    expect(userFromToken(token)).toEqual({
      userId: "user-1",
      email: "user@ager.it",
      role: "admin",
    });
  });

  it("falls back to role 'user' and null email when absent", () => {
    expect(userFromToken(makeJwt({ sub: "u2" }))).toEqual({
      userId: "u2",
      email: null,
      role: "user",
    });
  });

  it("returns null for malformed tokens", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
    expect(userFromToken("nope")).toBeNull();
  });
});
