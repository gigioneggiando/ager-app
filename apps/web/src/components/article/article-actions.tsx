"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Bookmark, BookmarkCheck, FolderPlus, Share2 } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { postInteraction } from "@/features/interactions/use-interaction";
import { useToast } from "@/components/ui/toast";
import { AddToListDialog } from "@/components/reading-lists/add-to-list-dialog";
import { Button } from "@/components/ui/button";

const UNDO_MS = 3000;

export function ArticleActions({
  articleId,
  url,
  title,
  openLabel,
  linkFirstNote,
}: {
  articleId: number;
  url: string;
  title: string;
  openLabel: string;
  linkFirstNote: string;
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

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (isAuthenticated) void postInteraction(articleId, "OPENED_EXTERNAL");
            }}
          >
            {openLabel}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
        <Button variant="outline" onClick={handleSave}>
          {saved ? (
            <BookmarkCheck aria-hidden="true" />
          ) : (
            <Bookmark aria-hidden="true" />
          )}
          {saved ? t("saved") : t("save")}
        </Button>
        <Button variant="ghost" onClick={() => requireAuth() && setDialogOpen(true)}>
          <FolderPlus aria-hidden="true" />
          {t("addToList")}
        </Button>
        <Button variant="ghost" onClick={handleShare}>
          <Share2 aria-hidden="true" />
          {t("share")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{linkFirstNote}</p>

      {dialogOpen ? (
        <AddToListDialog
          articleId={articleId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </div>
  );
}
