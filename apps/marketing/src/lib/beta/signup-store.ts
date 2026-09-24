/**
 * Where beta signups are stored. Server only.
 *
 * **This is a bridge, not the destination.** The recorded decision is an
 * in-house endpoint writing to our own Postgres; that endpoint does not exist
 * yet, and Google blocks service-account keys on our organisation, so the row
 * is handed to an Apps Script bound to the spreadsheet and published as a web
 * app. This app holds no Google credentials — only a shared secret that never
 * reaches the browser. See `docs/beta-signup.gs`.
 *
 * There is no read path on purpose: the site can append a row, never list them.
 */

export type SignupStoreResult = "appended" | "not-configured";

/**
 * A spreadsheet reads a cell starting with = + - @ as a formula, so an address
 * like `=cmd()@example.com` would execute instead of being stored. Prefixing
 * with an apostrophe forces Sheets to treat the value as text; the apostrophe
 * itself is not part of the stored string.
 */
function asPlainText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export async function appendRow(values: string[]): Promise<SignupStoreResult> {
  const url = process.env.BETA_SIGNUP_WEBHOOK_URL?.trim();
  const secret = process.env.BETA_SIGNUP_WEBHOOK_SECRET?.trim();

  if (!url || !secret) return "not-configured";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, values: values.map(asPlainText) }),
    // Apps Script answers /exec with a redirect to its content host.
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Signup webhook failed with ${res.status}`);
  }

  // Apps Script replies 200 even when it refuses, so the body is the real answer.
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!data?.ok) {
    throw new Error(`Signup webhook refused the row: ${data?.error ?? "unknown"}`);
  }

  return "appended";
}
