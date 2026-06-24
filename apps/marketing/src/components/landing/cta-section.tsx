import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { appUrl } from "@/lib/site";
import { Container } from "@/components/layout/container";
import { CtaLink } from "@/components/ui/cta-link";

/** Closing call-to-action band — the second, prominent "Apri Ager". */
export function CtaSection() {
  const t = useTranslations("Cta");
  const locale = useLocale();

  return (
    <section className="bg-primary text-primary-foreground">
      <Container
        size="default"
        className="flex flex-col items-center gap-6 py-20 text-center sm:py-24"
      >
        <h2 className="font-serif text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          {t("title")}
        </h2>
        <p className="max-w-xl text-base text-primary-foreground/80">
          {t("body")}
        </p>
        <CtaLink
          href={appUrl(locale)}
          variant="secondary"
          size="lg"
          className="border-transparent bg-editorial-white text-primary hover:bg-editorial-white/90"
        >
          {t("button")}
          <ArrowRight aria-hidden="true" />
        </CtaLink>
      </Container>
    </section>
  );
}
