import { useLocale, useTranslations } from "next-intl";

import { appUrl } from "@/lib/site";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";

/**
 * Footer for the apex landing. The about / DSA-contact / bot links point to the app's
 * public pages on app.agerculture.com (top-level navigations, so plain anchors).
 */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const locale = useLocale();
  const year = 2026;

  const links = [
    { href: appUrl(locale, "/chi-siamo"), label: t("about") },
    { href: appUrl(locale, "/dsa-contact"), label: t("dsaContact") },
    { href: appUrl(locale, "/bot"), label: t("botPolicy") },
    { href: appUrl(locale), label: t("openApp") },
  ];

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
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground/80 transition-colors hover:text-link"
              >
                {link.label}
              </a>
            ))}
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
