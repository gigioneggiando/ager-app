"use client";

import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [{ key: "takedown", href: "/admin/takedown" }] as const;

/** Admin section header + nav. Rendered inside the role-gated admin layout. */
export function AdminNav() {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <ShieldAlert className="size-4" aria-hidden="true" />
        {t("section")}
      </span>
      <nav className="flex flex-wrap gap-2" aria-label={t("section")}>
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground",
              )}
            >
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
