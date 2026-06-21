"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { LocaleSwitch } from "@/components/layout/locale-switch";
import { UserMenu } from "@/components/layout/user-menu";

type NavItem = { key: string; href: string; soon?: boolean };

const NAV_ITEMS: NavItem[] = [
  { key: "feed", href: "/" },
  { key: "sources", href: "/sources" },
  { key: "insights", href: "/", soon: true },
  { key: "styleguide", href: "/styleguide" },
];

export function Header() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container size="wide" className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Ager — home"
        >
          <Logo height={30} />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label={t("primary")}
        >
          {NAV_ITEMS.map((item) =>
            item.soon ? (
              <span
                key={item.key}
                aria-disabled="true"
                className="inline-flex cursor-default items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/70"
              >
                {t(item.key)}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("soon")}
                </span>
              </span>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(item.key)}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />
          <LocaleSwitch />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label={t("primary")}
          className="border-t border-border bg-background md:hidden"
        >
          <Container size="wide" className="flex flex-col py-2">
            {NAV_ITEMS.map((item) =>
              item.soon ? (
                <span
                  key={item.key}
                  aria-disabled="true"
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground/70"
                >
                  {t(item.key)}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t("soon")}
                  </span>
                </span>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-1 py-3 text-sm font-medium text-foreground/90 transition-colors hover:text-link",
                  )}
                >
                  {t(item.key)}
                </Link>
              ),
            )}
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
