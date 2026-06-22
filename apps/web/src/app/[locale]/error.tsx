"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary. Renders inside the locale layout (header/footer + i18n
 * provider stay mounted), offering a calm retry. `reset()` re-renders the segment.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Error");
  return (
    <Container
      size="narrow"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center"
    >
      <span
        className="flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning"
        aria-hidden="true"
      >
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("description")}</p>
      <Button onClick={() => reset()}>{t("retry")}</Button>
    </Container>
  );
}
