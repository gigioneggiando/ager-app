import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {t("badge")}
        </span>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          {t("title")}
        </h1>

        <p className="text-xl font-medium text-foreground/90">{t("tagline")}</p>

        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
          {t("description")}
        </p>

        <Button size="lg" disabled>
          {t("cta")}
          <ArrowUpRight aria-hidden="true" />
        </Button>

        <p className="text-xs text-muted-foreground">{t("scaffoldNote")}</p>
      </section>
    </main>
  );
}
