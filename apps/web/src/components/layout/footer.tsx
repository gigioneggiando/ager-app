import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";

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
            <span className="text-muted-foreground/70">{t("sourcesSoon")}</span>
            <span className="text-muted-foreground/70">{t("aboutSoon")}</span>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Ager · {t("rights")}
          </p>
          <p className="italic">{t("claim")}</p>
        </div>
      </Container>
    </footer>
  );
}
