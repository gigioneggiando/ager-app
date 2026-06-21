import Image from "next/image";
import { ArrowUpRight, Clock, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface FeedCardSource {
  name: string;
  /** Optional source favicon/logo (hotlinked). */
  iconUrl?: string;
}

/** Transparency placeholder — populated with real score/breakdown in PR2. */
export interface FeedCardWhy {
  score?: number;
}

export interface FeedCardArticle {
  id: string;
  title: string;
  source: FeedCardSource;
  /** ISO timestamp. */
  publishedAt: string;
  excerpt: string;
  /** Hotlinked publisher image. */
  imageUrl?: string;
  topics: string[];
  readingTimeMinutes: number;
  /** Publisher URL — link-first primary action. */
  href: string;
  why?: FeedCardWhy;
}

export interface FeedCardLabels {
  /** "Perché lo vedo?" */
  why: string;
  /** Reading time, e.g. (5) => "5 min di lettura". */
  readingTime: (minutes: number) => string;
  /** Accessible label for the external-link action, e.g. "Apri sull'editore". */
  openExternal: string;
}

const DEFAULT_LABELS: FeedCardLabels = {
  why: "Perché lo vedo?",
  readingTime: (m) => `${m} min di lettura`,
  openExternal: "Apri sull'editore",
};

function formatTimestamp(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

interface FeedCardProps {
  article: FeedCardArticle;
  locale?: string;
  labels?: Partial<FeedCardLabels>;
  className?: string;
}

/**
 * The reusable feed card. LINK-FIRST: it never renders an article body — only title,
 * excerpt, source, image (hotlinked), topics and reading time. The primary action opens
 * the publisher. Real data + the "Perché lo vedo?" popover land in PR2.
 *
 * NOTE(brand): the image uses the brand 80px corner radius (--radius-image). At small
 * thumbnail sizes this reads as nearly circular corners — flagged for owner review on
 * the styleguide preview (see /styleguide). Likely wants a smaller effective radius for
 * thumbnails.
 */
export function FeedCard({
  article,
  locale = "it",
  labels: labelOverrides,
  className,
}: FeedCardProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const timestamp = formatTimestamp(article.publishedAt, locale);

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden transition-colors hover:border-primary/30",
        className,
      )}
    >
      {article.imageUrl ? (
        <a
          href={article.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.openExternal}
          className="relative m-3 mb-0 block aspect-[16/9] overflow-hidden rounded-image bg-muted"
        >
          <Image
            src={article.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover"
          />
        </a>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        {article.topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {article.topics.map((topic) => (
              <Badge key={topic} variant="neutral">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}

        <h3 className="font-serif text-lg font-bold leading-snug tracking-tight">
          <a
            href={article.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary transition-colors hover:text-link focus-visible:underline focus-visible:outline-none"
          >
            {article.title}
            <ArrowUpRight
              className="ml-1 inline size-4 align-text-top text-muted-foreground transition-colors group-hover:text-link"
              aria-hidden="true"
            />
          </a>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">
          {article.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {article.source.name}
          </span>
          {timestamp ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>{timestamp}</time>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {labels.readingTime(article.readingTimeMinutes)}
          </span>
        </div>

        {/* "Perché lo vedo?" — transparency affordance placeholder (wired in PR2). */}
        <button
          type="button"
          className="inline-flex w-fit items-center gap-1 rounded text-xs font-medium text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-disabled="true"
        >
          <HelpCircle className="size-3.5" aria-hidden="true" />
          {labels.why}
        </button>
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
