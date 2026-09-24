/**
 * Validation for the `/beta` signup payload.
 *
 * Hand-rolled rather than pulled from a schema library: the shape is five
 * fields, and this app has no validation dependency today — not worth one.
 */

export type BetaSignup = {
  email: string;
  updatesConsent: boolean;
  locale: "it" | "en";
  elapsedMs: number;
  /** Which link brought the visitor here, from `?src=` (never free text). */
  source: string;
};

/** A human needs at least this long to read the screen and type an address. */
export const MIN_ELAPSED_MS = 1500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * `?src=` is a campaign label, not user input: it is clamped to a short slug so
 * nothing arbitrary can be written into the spreadsheet, and anything that does
 * not match is recorded as unknown rather than guessed at.
 */
const SOURCE_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;
export const UNKNOWN_SOURCE = "diretto";

export function normaliseSource(value: unknown): string {
  if (typeof value !== "string") return UNKNOWN_SOURCE;
  const slug = value.trim().toLowerCase();
  return SOURCE_RE.test(slug) ? slug : UNKNOWN_SOURCE;
}
const MAX_EMAIL_LENGTH = 254;
const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000;

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Returns the signup, or null when anything at all is off. */
export function parseBetaSignup(payload: unknown): BetaSignup | null {
  if (typeof payload !== "object" || payload === null) return null;
  const raw = payload as Record<string, unknown>;

  // Honeypot: a real person never sees this field, so it must stay empty.
  if (raw.company !== "") return null;

  if (typeof raw.email !== "string") return null;
  const email = raw.email.trim().toLowerCase();
  if (email.length < 3 || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) return null;

  // Only the mailing list is a consent. Being reachable once for feedback is a
  // condition of the beta, on legitimate interest — there is nothing to tick.
  if (!isBoolean(raw.updatesConsent)) return null;

  if (raw.locale !== "it" && raw.locale !== "en") return null;

  if (
    typeof raw.elapsedMs !== "number" ||
    !Number.isFinite(raw.elapsedMs) ||
    raw.elapsedMs < MIN_ELAPSED_MS ||
    raw.elapsedMs > MAX_ELAPSED_MS
  ) {
    return null;
  }

  return {
    // Stored lower-cased so duplicates are easy to spot in the sheet.
    email,
    source: normaliseSource(raw.source),
    updatesConsent: raw.updatesConsent,
    locale: raw.locale,
    elapsedMs: raw.elapsedMs,
  };
}
