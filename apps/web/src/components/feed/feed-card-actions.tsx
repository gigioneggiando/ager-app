"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, EyeOff, FolderPlus, Share2 } from "lucide-react";
import type { FeedPage } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/auth-provider";
import { postInteraction } from "@/features/interactions/use-interaction";
import { useToast } from "@/components/ui/toast";
import { AddToListDialog } from "@/components/reading-lists/add-to-list-dialog";

const UNDO_MS = 3000;

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

function removeFromFeed(
  data: InfiniteData<FeedPage> | undefined,
  articleId: number,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((i) => i.articleId !== articleId),
    })),
  };
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
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  // One-tap save → default "Salvati" list (backend auto-files on SAVE). 3s deferred commit.
  function handleSave() {
    if (!requireAuth()) return;
    setSaved(true);
    toast.show({
      message: t("savedToDefault"),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      onAction: () => setSaved(false),
      onCommit: () => {
        void postInteraction(articleId, "SAVE").then(() =>
          queryClient.invalidateQueries({ queryKey: ["reading-lists"] }),
        );
      },
    });
  }

  // Hide → remove from the feed immediately; 3s deferred DISCARD; Undo restores the snapshot.
  // The feed cache is keyed by mode (["feed", mode]); match every feed query by prefix.
  function handleDiscard() {
    if (!requireAuth()) return;
    const snapshots = queryClient.getQueriesData<InfiniteData<FeedPage>>({
      queryKey: ["feed"],
    });
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      { queryKey: ["feed"] },
      (d) => removeFromFeed(d, articleId),
    );
    toast.show({
      message: t("hidden"),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      onAction: () => {
        for (const [key, data] of snapshots) {
          queryClient.setQueryData(key, data);
        }
      },
      onCommit: () => {
        void postInteraction(articleId, "DISCARD").then(() =>
          queryClient.invalidateQueries({ queryKey: ["feed"] }),
        );
      },
    });
  }

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard?.writeText(url);
      }
    } catch {
      /* dismissed */
    }
    if (isAuthenticated) void postInteraction(articleId, "SHARE");
  }

  function openAddToList() {
    if (!requireAuth()) return;
    setDialogOpen(true);
  }

  return (
    <>
      <ActionButton
        onClick={handleSave}
        label={saved ? t("saved") : t("save")}
        active={saved}
      >
        {saved ? (
          <BookmarkCheck className="size-4" aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" aria-hidden="true" />
        )}
      </ActionButton>
      <ActionButton onClick={openAddToList} label={t("addToList")}>
        <FolderPlus className="size-4" aria-hidden="true" />
      </ActionButton>
      <ActionButton onClick={handleDiscard} label={t("discard")}>
        <EyeOff className="size-4" aria-hidden="true" />
      </ActionButton>
      <ActionButton onClick={handleShare} label={t("share")}>
        <Share2 className="size-4" aria-hidden="true" />
      </ActionButton>

      {dialogOpen ? (
        <AddToListDialog
          articleId={articleId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </>
  );
}
