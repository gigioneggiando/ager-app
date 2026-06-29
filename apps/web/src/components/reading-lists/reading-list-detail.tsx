"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatAbsoluteDate } from "@/lib/format";
import { safeUrl } from "@/lib/safe-url";
import {
  flattenItems,
  useReadingListItems,
  useReadingLists,
  useRemoveItem,
} from "@/features/reading-lists/use-reading-lists";
import { useOpenExternal } from "@/features/interactions/use-interaction";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { AgerSymbol } from "@/components/brand/ager-symbol";

export function ReadingListDetail({ listId }: { listId: number }) {
  const t = useTranslations("ReadingLists");
  const locale = useLocale();
  const toast = useToast();
  const { data: listsData } = useReadingLists();
  const list = listsData?.items?.find((l) => l.id === listId);

  // Public lists (visibility=2) expose a shareable, anonymous URL.
  const isPublic = list?.visibility === 2 && Boolean(list.ownerUserId && list.slug);
  function copyShareUrl() {
    if (!list?.ownerUserId || !list.slug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${locale}/l/${list.ownerUserId}/${list.slug}`;
    void navigator.clipboard?.writeText(url);
    toast.show({ message: t("shareCopied") });
  }

  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReadingListItems(listId);
  const remove = useRemoveItem(listId);
  // Click-through to the publisher is a positive signal even from a saved list.
  const openExternal = useOpenExternal();
  const items = flattenItems(data);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/me/reading-lists"
          className="inline-flex w-fit items-center gap-1 text-sm text-link transition-colors hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("backToLists")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {list?.name ?? t("listFallback")}
          </h1>
          {isPublic ? (
            <Button variant="outline" size="sm" onClick={copyShareUrl}>
              <Share2 aria-hidden="true" />
              {t("share")}
            </Button>
          ) : null}
        </div>
        {list?.createdAt ? (
          <p className="text-xs text-muted-foreground">
            {t("createdOn", {
              date: formatAbsoluteDate(list.createdAt, locale),
            })}
          </p>
        ) : null}
      </header>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : items.length === 0 ? (
        <EmptyState title={t("emptyList")} description={t("emptyListHint")} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const href = safeUrl(item.url || item.canonicalUrl) ?? "#";
              const imageSrc = safeUrl(item.imageUrl);
              const minutes = item.wordCount
                ? Math.max(1, Math.ceil(item.wordCount / 200))
                : null;
              return (
                <li key={item.articleId}>
                  <Card className="flex gap-3 p-4">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-hidden="true"
                      tabIndex={-1}
                      onClick={() => openExternal(item.articleId)}
                      className="relative size-20 shrink-0 overflow-hidden rounded-image bg-muted"
                    >
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-neutral-beige">
                          <AgerSymbol className="size-6 text-primary/15" />
                        </span>
                      )}
                    </a>

                    <div className="flex flex-1 flex-col gap-1">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => openExternal(item.articleId)}
                        className="font-serif font-bold leading-snug text-primary transition-colors hover:text-link"
                      >
                        {item.title}
                      </a>
                      {item.note ? (
                        <p className="text-sm italic text-muted-foreground">
                          {item.note}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {item.sourceName ? `${item.sourceName} · ` : ""}
                        {item.publishedAt
                          ? formatAbsoluteDate(item.publishedAt, locale)
                          : ""}
                        {minutes ? ` · ${t("readingTime", { minutes })}` : ""}
                      </p>
                    </div>

                    {item.articleId != null ? (
                      <button
                        type="button"
                        onClick={() => remove.mutate(item.articleId!)}
                        aria-label={t("remove")}
                        title={t("remove")}
                        className="h-fit shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>

          {hasNextPage ? (
            <>
              <div ref={sentinelRef} aria-hidden="true" />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {t("loadMore")}
                </Button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
