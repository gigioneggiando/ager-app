"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ArticleSearchResult } from "@ager/api-client";

import { Link } from "@/i18n/navigation";
import { formatAbsoluteDate } from "@/lib/format";
import { safeUrl } from "@/lib/safe-url";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgerSymbol } from "@/components/brand/ager-symbol";

/**
 * One search result, rendered as an article row. Search results carry no publisher URL, so
 * the row links to the internal article page (`/article/{id}`) — which is itself link-first
 * and exposes the "open on publisher" CTA. Keeps the link-first invariant intact.
 */
export function SearchResultRow({ item }: { item: ArticleSearchResult }) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const title = item.title?.trim() || t("untitled");
  const date = item.publishedAt ? formatAbsoluteDate(item.publishedAt, locale) : "";
  const imageSrc = safeUrl(item.imageUrl);

  if (item.articleId == null) return null;

  return (
    <Card className="flex gap-4 p-4 transition-colors hover:border-primary/30">
      <Link
        href={`/article/${item.articleId}`}
        aria-hidden="true"
        tabIndex={-1}
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
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/article/${item.articleId}`}
          className="font-serif font-bold leading-snug text-primary transition-colors hover:text-link focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {title}
        </Link>
        {item.excerpt ? (
          <p className="line-clamp-2 text-sm text-foreground/90">{item.excerpt}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {item.sourceName ? (
            <span className="font-medium text-foreground/80">{item.sourceName}</span>
          ) : null}
          {date ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={item.publishedAt}>{date}</time>
            </>
          ) : null}
          {item.paywallDetected ? (
            <Badge variant="warning">{t("paywall")}</Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
