"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Inbox } from "lucide-react";

import { useFeed, dedupeFeedItems, feedMeta } from "@/features/feed/use-feed";
import { DEFAULT_FEED_MODE, type FeedMode } from "@/features/feed/modes";
import { useOpenExternal } from "@/features/interactions/use-interaction";
import { FeedCard, FeedCardSkeleton } from "@/components/feed/feed-card";
import { FeedCardActions } from "@/components/feed/feed-card-actions";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

const GRID = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
const INITIAL_SKELETONS = 6;
const NEXT_SKELETONS = 3;

function CaughtUp() {
  const t = useTranslations("Feed.list");
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span
        className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success"
        aria-hidden="true"
      >
        <Check className="size-5" />
      </span>
      <h2 className="font-serif text-lg font-bold text-primary">
        {t("caughtUpTitle")}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("caughtUpDescription")}
      </p>
    </div>
  );
}

export function FeedList({ mode = DEFAULT_FEED_MODE }: { mode?: FeedMode }) {
  const t = useTranslations("Feed.list");
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(mode);

  const items = dedupeFeedItems(data?.pages);
  const { feedMode, recommenderVersion } = feedMeta(data?.pages);

  // Record OPENED_EXTERNAL when a signed-in user opens the publisher (keepalive fetch).
  const openExternal = useOpenExternal();

  // Infinite scroll: load the next page when the sentinel approaches the viewport.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <ul className={GRID} aria-busy="true" aria-label={t("loading")}>
        {Array.from({ length: INITIAL_SKELETONS }).map((_, i) => (
          <li key={i}>
            <FeedCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <ErrorState
        icon={<AlertTriangle />}
        title={t("errorTitle")}
        description={t("errorDescription")}
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t("retry")}
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className={GRID}>
        {items.map((item, index) => (
          <li key={item.articleId ?? `item-${index}`}>
            <FeedCard
              item={item}
              feedMode={feedMode}
              recommenderVersion={recommenderVersion}
              onOpen={() => openExternal(item.articleId)}
              actions={
                item.articleId != null ? (
                  <FeedCardActions
                    articleId={item.articleId}
                    url={item.url || item.canonicalUrl || "#"}
                    title={item.title ?? ""}
                    topics={item.topics ?? []}
                    sourceId={item.sourceId}
                    sourceName={item.sourceName}
                  />
                ) : undefined
              }
            />
          </li>
        ))}
        {isFetchingNextPage
          ? Array.from({ length: NEXT_SKELETONS }).map((_, i) => (
              <li key={`next-${i}`} aria-hidden="true">
                <FeedCardSkeleton />
              </li>
            ))
          : null}
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
              {isFetchingNextPage ? t("loading") : t("loadMore")}
            </Button>
          </div>
        </>
      ) : (
        <CaughtUp />
      )}
    </div>
  );
}
