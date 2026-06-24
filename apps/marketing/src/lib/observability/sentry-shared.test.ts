import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "./sentry-shared";

describe("scrubSentryEvent (beforeSend PII scrubbing)", () => {
  it("removes cookies and the Authorization header", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://agerculture.com/it",
        cookies: { sid: "secret" },
        headers: {
          Authorization: "Bearer secret",
          "Content-Type": "text/html",
        },
      },
    });
    const req = event.request as Record<string, unknown>;
    expect(req.cookies).toBeUndefined();
    const headers = req.headers as Record<string, unknown>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers["Content-Type"]).toBe("text/html");
  });

  it("redacts tokens, OTP, and passwords anywhere in the payload", () => {
    const event = scrubSentryEvent({
      extra: {
        accessToken: "x",
        password: "y",
        otp: "123456",
        harmless: "keep-me",
      },
    });
    const extra = event.extra as Record<string, unknown>;
    expect(extra.accessToken).toBe("[redacted]");
    expect(extra.password).toBe("[redacted]");
    expect(extra.otp).toBe("[redacted]");
    expect(extra.harmless).toBe("keep-me");
  });
});
