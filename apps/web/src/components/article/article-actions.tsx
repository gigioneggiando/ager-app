"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Bookmark, BookmarkCheck, Share2 } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { useInteraction } from "@/features/interactions/use-interaction";
import { useSaveArticle } from "@/features/reading-lists/use-reading-lists";
import { Button } from "@/components/ui/button";

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
  const { isAuthenticated } = useSession();
  const interaction = useInteraction();
  const save = useSaveArticle();
  const [saved, setSaved] = useState(false);

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

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard?.writeText(url);
      }
    } catch {
      // dismissed
    }
    if (isAuthenticated) interaction.mutate({ articleId, type: "SHARE" });
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
              if (isAuthenticated) {
                interaction.mutate({ articleId, type: "OPENED_EXTERNAL" });
              }
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
        <Button variant="ghost" onClick={handleShare}>
          <Share2 aria-hidden="true" />
          {t("share")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{linkFirstNote}</p>
    </div>
  );
}
