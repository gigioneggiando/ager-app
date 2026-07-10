"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { FeedItem } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { formatAbsoluteDate, formatRelativeTime } from "@/lib/format";
import { safeUrl } from "@/lib/safe-url";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgerSymbol } from "@/components/brand/ager-symbol";
import { WhyShown } from "@/components/feed/why-shown";

interface FeedCardProps {
  item: FeedItem;
  feedMode?: string | null;
  recommenderVersion?: string | null;
  className?: string;
  /** Side-effect fired when the user opens the publisher (e.g. OPENED_EXTERNAL). */
  onOpen?: () => void;
  /** Optional actions row (Save / Discard / Share), rendered in the footer. */
  actions?: ReactNode;
}

/**
 * The reusable feed card, populated from the generated FeedItemDto. LINK-FIRST: it never
 * renders an article body — only title, excerpt, source, hotlinked image, topics and
 * reading time. The primary action opens the publisher (`url`) in a new tab.
 *
 * `displayMode` (redirect | webview | reader_optin) all resolve to "open url in a new
 * tab" on web for now. `onOpen` fires the OPENED_EXTERNAL interaction (wired by the feed),
 * and `actions` injects the Save / Discard / Share row.
 */
export function FeedCard({
  item,
  feedMode,
  recommenderVersion,
  className,
  onOpen,
  actions,
}: FeedCardProps) {
  const t = useTranslations("Feed");
  const locale = useLocale();

  // Every FeedItemDto field is optional in the contract — stay defensive.
  const title = item.title?.trim() || t("card.untitled");
  const href = safeUrl(item.url || item.canonicalUrl) ?? "#";
  const imageSrc = safeUrl(item.imageUrl);
  const topics = item.topics ?? [];
  const relative = item.publishedAt
    ? formatRelativeTime(item.publishedAt, locale)
    : "";
  const absolute = item.publishedAt
    ? formatAbsoluteDate(item.publishedAt, locale)
    : "";

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden transition-colors hover:border-primary/30",
        className,
      )}
    >
      {/* Image (hotlinked) or brand placeholder. Decorative — the headline link below
          carries the accessible name, so the image link is hidden from AT + tab order. */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onOpen}
        className="relative m-3 mb-0 block aspect-[16/9] overflow-hidden rounded-image bg-muted"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted">
            <AgerSymbol className="size-10 text-primary/15" />
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <Badge key={topic} variant="neutral">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}

        <h3 className="font-serif text-lg font-bold leading-snug tracking-tight">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpen}
            className="text-primary transition-colors hover:text-link focus-visible:rounded focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {title}
            <ArrowUpRight
              className="ml-1 inline size-4 align-text-top text-muted-foreground transition-colors group-hover:text-link"
              aria-hidden="true"
            />
            <span className="sr-only"> — {t("card.openExternal")}</span>
          </a>
        </h3>

        {item.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">
            {item.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {item.sourceName ? (
            <span className="font-medium text-foreground/80">
              {item.sourceName}
            </span>
          ) : null}
          {item.sourceType ? (
            <span className="lowercase">· {item.sourceType}</span>
          ) : null}
          {relative ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={item.publishedAt} title={absolute}>
                {relative}
              </time>
            </>
          ) : null}
          {/* No reading time: Ager is link-first and does not store the article body,
              so any per-article estimate would be unreliable. */}
        </div>

        <WhyShown
          score={item.score}
          breakdown={item.scoreBreakdown}
          feedMode={feedMode}
          recommenderVersion={recommenderVersion}
        />

        {actions ? (
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-border pt-3">
            {actions}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/** Loading placeholder mirroring the FeedCard layout. */
export function FeedCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <Skeleton className="m-3 mb-0 aspect-[16/9] rounded-image" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}
