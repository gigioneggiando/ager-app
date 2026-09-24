import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appendRow } from "./signup-store";

const ROW = ["2026-09-24T09:00:00.000Z", "persona@example.com", "si", "no", "it", "instagram", "onboarding-beta"];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("appendRow", () => {
  beforeEach(() => {
    process.env.BETA_SIGNUP_WEBHOOK_URL = "https://script.google.com/macros/s/test/exec";
    process.env.BETA_SIGNUP_WEBHOOK_SECRET = "a-long-shared-secret";
  });

  afterEach(() => {
    delete process.env.BETA_SIGNUP_WEBHOOK_URL;
    delete process.env.BETA_SIGNUP_WEBHOOK_SECRET;
    vi.unstubAllGlobals();
  });

  it("posts the row with the shared secret and reports success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(appendRow(ROW)).resolves.toBe("appended");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.google.com/macros/s/test/exec");
    expect(JSON.parse(init.body)).toEqual({ secret: "a-long-shared-secret", values: ROW });
  });

  // A spreadsheet would execute these instead of storing them.
  it("neutralises values a spreadsheet would read as a formula", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await appendRow(["=cmd()@example.com", "+1", "-2", "@x", "normale"]);

    const { values } = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(values).toEqual(["'=cmd()@example.com", "'+1", "'-2", "'@x", "normale"]);
  });

  it("reports not-configured when the webhook is missing", async () => {
    delete process.env.BETA_SIGNUP_WEBHOOK_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(appendRow(ROW)).resolves.toBe("not-configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Apps Script answers 200 even when it refuses, so the body has to be checked.
  it("throws when the script refuses the row despite a 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "forbidden" })));

    await expect(appendRow(ROW)).rejects.toThrow(/refused/);
  });

  it("throws on a transport failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    await expect(appendRow(ROW)).rejects.toThrow(/500/);
  });
});
