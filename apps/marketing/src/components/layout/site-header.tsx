import { useLocale, useTranslations } from "next-intl";

import { appUrl } from "@/lib/site";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { CtaLink } from "@/components/ui/cta-link";
import { LocaleSwitch } from "@/components/layout/locale-switch";

/** Sober editorial header: logo, in-page nav, locale switch, and the "Apri Ager" CTA. */
export function SiteHeader() {
  const t = useTranslations("Header");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <Container
        size="wide"
        className="flex h-16 items-center justify-between gap-4"
      >
        <a
          href="#top"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Ager"
        >
          <Logo height={28} />
        </a>

        <nav
          aria-label={t("nav")}
          className="hidden items-center gap-8 text-sm text-foreground/80 md:flex"
        >
          <a href="#valori" className="transition-colors hover:text-link">
            {t("values")}
          </a>
          <a href="#come-funziona" className="transition-colors hover:text-link">
            {t("how")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitch />
          <CtaLink href={appUrl(locale)}>{t("openApp")}</CtaLink>
        </div>
      </Container>
    </header>
  );
}
