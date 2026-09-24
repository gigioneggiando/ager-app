"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";

import { Container } from "@/components/layout/container";

/**
 * Route-segment error boundary for the landing. Renders inside the locale layout
 * (header/footer + i18n provider stay mounted), offering a calm retry. `reset()` re-renders
 * the segment. Errors are reported to Sentry (no-op without a DSN; beforeSend scrubs PII).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Container
      size="narrow"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center"
    >
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("description")}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {t("retry")}
      </button>
    </Container>
  );
}
