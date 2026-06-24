import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { appUrl } from "@/lib/site";
import { Container } from "@/components/layout/container";
import { AgerSymbol } from "@/components/brand/ager-symbol";
import { CtaLink } from "@/components/ui/cta-link";

/**
 * Hero: the mission as the headline and the claim as a strong sub-line, with the primary
 * "Apri Ager" CTA. The large brand panel uses the brand's 80px corner radius
 * (rounded-image-lg) — reserved for big/hero imagery.
 */
export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();

  return (
    <section id="top" className="border-b border-border">
      <Container
        size="wide"
        className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="flex flex-col items-start gap-6">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-xl font-medium text-foreground/90 sm:text-2xl">
            {t("claim")}
          </p>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("body")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <CtaLink href={appUrl(locale)} size="lg">
              {t("ctaPrimary")}
              <ArrowRight aria-hidden="true" />
            </CtaLink>
            <CtaLink href="#come-funziona" variant="secondary" size="lg">
              {t("ctaSecondary")}
            </CtaLink>
          </div>
        </div>

        {/* Large brand panel — decorative; the 80px radius is the brand value for hero imagery. */}
        <div
          aria-hidden="true"
          className="relative hidden aspect-[4/3] overflow-hidden rounded-image-lg bg-primary lg:flex"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <AgerSymbol className="h-2/3 w-2/3 text-editorial-white/10" />
          </div>
          <div className="absolute bottom-8 left-8 right-8">
            <AgerSymbol className="size-12 text-editorial-white" />
            <p className="mt-4 font-serif text-2xl font-bold text-editorial-white">
              {t("panel")}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
