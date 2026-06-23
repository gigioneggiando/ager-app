"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { formatAbsoluteDate } from "@/lib/format";
import {
  flattenItems,
  usePublicReadingList,
  usePublicReadingListItems,
} from "@/features/reading-lists/use-public-reading-list";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { AgerSymbol } from "@/components/brand/ager-symbol";

export function PublicListView({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}) {
  const t = useTranslations("PublicList");
  const locale = useLocale();
  const { data: list, isPending, isError } = usePublicReadingList(owner, slug);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending: itemsPending,
  } = usePublicReadingListItems(list?.id ?? undefined);
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

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (isError || !list) {
    return (
      <EmptyState
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("publicList")}
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{list.name}</h1>
        {list.description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{list.description}</p>
        ) : null}
      </header>

      {itemsPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const href = item.url || item.canonicalUrl || "#";
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
                      className="relative size-20 shrink-0 overflow-hidden rounded-image bg-muted"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
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
                        className="font-serif font-bold leading-snug text-primary transition-colors hover:text-link"
                      >
                        {item.title}
                      </a>
                      {item.note ? (
                        <p className="text-sm italic text-muted-foreground">{item.note}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {item.sourceName ? `${item.sourceName} · ` : ""}
                        {item.publishedAt
                          ? formatAbsoluteDate(item.publishedAt, locale)
                          : ""}
                        {minutes ? ` · ${t("readingTime", { minutes })}` : ""}
                      </p>
                    </div>
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
