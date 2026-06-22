"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, List, LogOut, User } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/auth-provider";
import { SavedListLink } from "@/components/layout/saved-list-link";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const t = useTranslations("Account");
  const router = useRouter();
  const { session, isAuthenticated, logout } = useSession();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">{t("signIn")}</Link>
      </Button>
    );
  }

  const label = session?.email || t("account");

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.refresh();
    router.push("/");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-2 pr-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <User className="size-4" aria-hidden="true" />
        <span className="hidden max-w-[12ch] truncate sm:inline">{label}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-md"
          >
            {session?.email ? (
              <p className="truncate border-b border-border px-3 py-2 text-xs text-muted-foreground">
                {session.email}
              </p>
            ) : null}
            <Link
              href="/me"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <User className="size-4" aria-hidden="true" />
              {t("myAccount")}
            </Link>
            <SavedListLink onNavigate={() => setOpen(false)} />
            <Link
              href="/me/reading-lists"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <List className="size-4" aria-hidden="true" />
              {t("readingLists")}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t("signOut")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
