import { describe, expect, it } from "vitest";

import { MIN_ELAPSED_MS, UNKNOWN_SOURCE, normaliseSource, parseBetaSignup } from "./signup-schema";

const VALID = {
  email: "Persona@Example.com",
  updatesConsent: false,
  locale: "it",
  elapsedMs: 9000,
  company: "",
  source: "instagram",
};

describe("normaliseSource", () => {
  it("keeps a plain campaign slug, lower-cased", () => {
    expect(normaliseSource("instagram")).toBe("instagram");
    expect(normaliseSource("TikTok")).toBe("tiktok");
    expect(normaliseSource("linkedin-bio")).toBe("linkedin-bio");
    expect(normaliseSource("  Instagram  ")).toBe("instagram");
  });

  it("falls back to unknown rather than storing arbitrary text", () => {
    expect(normaliseSource("<script>alert(1)</script>")).toBe(UNKNOWN_SOURCE);
    expect(normaliseSource("a".repeat(200))).toBe(UNKNOWN_SOURCE);
    expect(normaliseSource("due parole")).toBe(UNKNOWN_SOURCE);
    expect(normaliseSource("=SUM(A1:A9)")).toBe(UNKNOWN_SOURCE);
    expect(normaliseSource("")).toBe(UNKNOWN_SOURCE);
    expect(normaliseSource(undefined)).toBe(UNKNOWN_SOURCE);
    expect(normaliseSource(42)).toBe(UNKNOWN_SOURCE);
  });
});

describe("parseBetaSignup", () => {
  it("accepts a valid signup and lower-cases the address", () => {
    const parsed = parseBetaSignup(VALID);
    expect(parsed).toMatchObject({
      email: "persona@example.com",
      updatesConsent: false,
      locale: "it",
      source: "instagram",
    });
  });

  it("records an absent ?src= as unknown", () => {
    expect(parseBetaSignup({ ...VALID, source: "" })?.source).toBe(UNKNOWN_SOURCE);
    expect(parseBetaSignup({ ...VALID, source: undefined })?.source).toBe(UNKNOWN_SOURCE);
  });

  it("never lets a hostile ?src= through to the spreadsheet", () => {
    expect(parseBetaSignup({ ...VALID, source: "<script>x</script>" })?.source).toBe(UNKNOWN_SOURCE);
    // A leading "=" would be read as a formula by a spreadsheet.
    expect(parseBetaSignup({ ...VALID, source: "=1+1" })?.source).toBe(UNKNOWN_SOURCE);
  });

  it("refuses a filled honeypot", () => {
    expect(parseBetaSignup({ ...VALID, company: "Acme Ltd" })).toBeNull();
  });

  it("refuses a malformed address", () => {
    expect(parseBetaSignup({ ...VALID, email: "non-una-email" })).toBeNull();
    expect(parseBetaSignup({ ...VALID, email: "a".repeat(300) + "@x.it" })).toBeNull();
  });

  it("refuses a submission too fast to be human", () => {
    expect(parseBetaSignup({ ...VALID, elapsedMs: MIN_ELAPSED_MS - 1 })).toBeNull();
  });

  it("refuses an unknown locale and a non-boolean consent", () => {
    expect(parseBetaSignup({ ...VALID, locale: "fr" })).toBeNull();
    expect(parseBetaSignup({ ...VALID, updatesConsent: "si" })).toBeNull();
  });

  // Being reachable for feedback is a condition, not a consent: there is no
  // field for it, and sending one must not change anything.
  it("ignores a contactConsent field if a client sends one", () => {
    const parsed = parseBetaSignup({ ...VALID, contactConsent: false });
    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty("contactConsent");
  });

  it("refuses anything that is not an object", () => {
    expect(parseBetaSignup(null)).toBeNull();
    expect(parseBetaSignup("ciao")).toBeNull();
  });
});
