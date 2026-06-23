"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  SEARCH_PAGE_SIZE,
  useArticleSearch,
  useTags,
} from "@/features/search/use-search";
import { SearchResultRow } from "@/components/search/search-result-row";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

export function ExploreView() {
  const t = useTranslations("Explore");
  const [tag, setTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: tags, isPending: tagsPending, isError: tagsError } = useTags();
  const { data, isFetching } = useArticleSearch(
    tag ? { kind: "tag", term: tag } : null,
    page,
  );

  const results = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const activeName =
    (tags ?? []).find((x) => x.slug === tag)?.name ?? tag ?? "";

  function pick(slug: string) {
    setPage(1);
    setTag((prev) => (prev === slug ? null : slug));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {tagsPending ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : tagsError ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(tags ?? [])
            .filter((x) => x.slug)
            .map((x) => (
              <button
                key={x.slug}
                type="button"
                aria-pressed={tag === x.slug}
                onClick={() => pick(x.slug!)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tag === x.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/80 hover:bg-secondary",
                )}
              >
                {x.name || x.slug}
              </button>
            ))}
        </div>
      )}

      {tag == null ? (
        <EmptyState title={t("pickTitle")} description={t("pickDescription")} />
      ) : isFetching && results.length === 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription", { tag: activeName })}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("resultsFor", { tag: activeName, count: total })}
          </p>
          <ul className="flex flex-col gap-3">
            {results.map((item) => (
              <li key={item.articleId}>
                <SearchResultRow item={item} />
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-4 pt-2"
              aria-label={t("pagination")}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {t("pageOf", { page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t("next")}
              </Button>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}
