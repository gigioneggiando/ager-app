import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "./sentry-shared";

describe("scrubSentryEvent (beforeSend PII scrubbing)", () => {
  it("removes cookies and the Authorization header", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://app.agerculture.com/api/feed",
        cookies: { ager_at: "secret-access", ager_rt: "secret-refresh" },
        headers: {
          Authorization: "Bearer secret-access",
          authorization: "Bearer secret-access",
          "X-CSRF-Token": "csrf-123",
          "Content-Type": "application/json",
        },
      },
    });

    const req = event.request as Record<string, unknown>;
    expect(req.cookies).toBeUndefined();
    const headers = req.headers as Record<string, unknown>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers.authorization).toBeUndefined();
    // Non-secret headers survive.
    expect(headers["Content-Type"]).toBe("application/json");
    // A CSRF header that slips through is redacted, not dropped.
    expect(headers["X-CSRF-Token"]).toBe("[redacted]");
  });

  it("redacts access/refresh tokens, OTP, and passwords anywhere in the payload", () => {
    const event = scrubSentryEvent({
      extra: {
        accessToken: "secret-access",
        refreshToken: "secret-refresh",
        otp: "123456",
        password: "hunter2",
        nested: { authToken: "x", harmless: "keep-me" },
      },
      contexts: { state: { otpCode: "999999" } },
    });

    const extra = event.extra as Record<string, unknown>;
    expect(extra.accessToken).toBe("[redacted]");
    expect(extra.refreshToken).toBe("[redacted]");
    expect(extra.otp).toBe("[redacted]");
    expect(extra.password).toBe("[redacted]");
    const nested = extra.nested as Record<string, unknown>;
    expect(nested.authToken).toBe("[redacted]");
    expect(nested.harmless).toBe("keep-me");
    const ctx = (event.contexts as Record<string, Record<string, unknown>>).state;
    expect(ctx.otpCode).toBe("[redacted]");
  });

  it("drops the request body of auth/OTP routes entirely", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://app.agerculture.com/api/auth/verify",
        data: { email: "a@b.com", otp: "123456" },
      },
    });
    expect((event.request as Record<string, unknown>).data).toBeUndefined();
  });

  it("keeps non-auth request bodies but redacts secret-like fields within them", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://app.agerculture.com/api/interactions",
        data: { articleId: 42, type: "DISCARD", sessionToken: "leak" },
      },
    });
    const data = (event.request as Record<string, unknown>).data as Record<string, unknown>;
    expect(data.articleId).toBe(42);
    expect(data.type).toBe("DISCARD");
    expect(data.sessionToken).toBe("[redacted]");
  });
});
