"use client";

import { useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { useReadingLists } from "@/features/reading-lists/use-reading-lists";

/**
 * Account-menu entry to the default "Salvati" list. Resolves the isDefault list's id
 * (falls back to the lists index until it's known). Mounted only inside the open menu,
 * so the lists query isn't fetched eagerly on every page.
 */
export function SavedListLink({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("Account");
  const { data } = useReadingLists();
  const defaultList = data?.items?.find((l) => l.isDefault);
  const href =
    defaultList?.id != null
      ? `/me/reading-lists/${defaultList.id}`
      : "/me/reading-lists";

  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
    >
      <Bookmark className="size-4" aria-hidden="true" />
      {t("saved")}
    </Link>
  );
}
