"use client";

import { useLocale, useTranslations } from "next-intl";

import { routing } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Compact it/en switch. Re-renders the same path under the other locale via the next-intl
 * <Link> (which rewrites the prefix), so the apex landing keeps its position on switch.
 */
export function LocaleSwitch() {
  const t = useTranslations("Header");
  const active = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("language")} className="flex items-center gap-1 text-sm">
      {routing.locales.map((locale) => {
        const isActive = locale === active;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded px-1.5 py-1 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
