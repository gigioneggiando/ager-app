"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, EyeOff, Share2 } from "lucide-react";
import type { FeedPage } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/auth-provider";
import { useInteraction } from "@/features/interactions/use-interaction";
import { useSaveArticle } from "@/features/reading-lists/use-reading-lists";

function ActionButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-accent",
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function FeedCardActions({
  articleId,
  url,
  title,
}: {
  articleId: number;
  url: string;
  title: string;
}) {
  const t = useTranslations("Actions");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const interaction = useInteraction();
  const save = useSaveArticle();
  const [saved, setSaved] = useState(false);

  /** Returns true if the action may proceed; otherwise routes anon users to login. */
  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  function handleSave() {
    if (!requireAuth()) return;
    setSaved(true);
    save.mutate(
      { articleId, defaultListName: t("savedListName") },
      { onError: () => setSaved(false) },
    );
  }

  function handleDiscard() {
    if (!requireAuth()) return;
    // Optimistically drop the card from the feed cache.
    queryClient.setQueryData<InfiniteData<FeedPage>>(["feed"], (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: (page.items ?? []).filter(
                (i) => i.articleId !== articleId,
              ),
            })),
          }
        : old,
    );
    interaction.mutate(
      { articleId, type: "DISCARD" },
      {
        onSettled: () =>
          void queryClient.invalidateQueries({ queryKey: ["feed"] }),
      },
    );
  }

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard?.writeText(url);
      }
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
    if (isAuthenticated) interaction.mutate({ articleId, type: "SHARE" });
  }

  return (
    <>
      <ActionButton onClick={handleSave} label={saved ? t("saved") : t("save")} active={saved}>
        {saved ? (
          <BookmarkCheck className="size-4" aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" aria-hidden="true" />
        )}
      </ActionButton>
      <ActionButton onClick={handleDiscard} label={t("discard")}>
        <EyeOff className="size-4" aria-hidden="true" />
      </ActionButton>
      <ActionButton onClick={handleShare} label={t("share")}>
        <Share2 className="size-4" aria-hidden="true" />
      </ActionButton>
    </>
  );
}
