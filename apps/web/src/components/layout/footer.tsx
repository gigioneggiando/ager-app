import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Footer() {
  const t = useTranslations("Footer");
  const year = 2026;

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <Container size="wide" className="flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo height={28} />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("mission")}
            </p>
          </div>

          <nav
            aria-label={t("nav")}
            className="flex flex-wrap gap-x-10 gap-y-4 text-sm"
          >
            <Link
              href="/styleguide"
              className="text-foreground/80 transition-colors hover:text-link"
            >
              {t("styleguide")}
            </Link>
            <Link
              href="/dsa-contact"
              className="text-foreground/80 transition-colors hover:text-link"
            >
              {t("dsaContact")}
            </Link>
            <Link
              href="/bot"
              className="text-foreground/80 transition-colors hover:text-link"
            >
              {t("botPolicy")}
            </Link>
            <span className="text-muted-foreground/70">{t("sourcesSoon")}</span>
            <Link
              href="/chi-siamo"
              className="text-foreground/80 transition-colors hover:text-link"
            >
              {t("about")}
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
            <p>
              © {year} Ager · {t("rights")}
            </p>
            <p className="italic">{t("claim")}</p>
          </div>
          <ThemeToggle />
        </div>
      </Container>
    </footer>
  );
}
