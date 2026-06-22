"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SEARCH_PAGE_SIZE,
  useArticleSearch,
  useTags,
  type SearchQuery,
} from "@/features/search/use-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { SearchResultRow } from "@/components/search/search-result-row";

export function SearchView({ initialQ = "" }: { initialQ?: string }) {
  const t = useTranslations("Search");
  const [input, setInput] = useState(initialQ);
  const [query, setQuery] = useState<SearchQuery | null>(
    initialQ.trim() ? { kind: "text", term: initialQ.trim() } : null,
  );
  const [page, setPage] = useState(1);

  const { data: tags } = useTags();
  const { data, isFetching, isError } = useArticleSearch(query, page);

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    const term = input.trim();
    if (!term) return;
    setQuery({ kind: "text", term });
    setPage(1);
  }

  function toggleTag(slug: string) {
    setPage(1);
    setQuery((prev) =>
      prev?.kind === "tag" && prev.term === slug
        ? null
        : { kind: "tag", term: slug },
    );
  }

  const results = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const activeTag = query?.kind === "tag" ? query.term : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form onSubmit={submitText} className="flex gap-2" role="search">
        <label htmlFor="search-input" className="sr-only">
          {t("inputLabel")}
        </label>
        <Input
          id="search-input"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          autoFocus
        />
        <Button type="submit" disabled={!input.trim()}>
          <Search aria-hidden="true" />
          {t("submit")}
        </Button>
      </form>

      {tags && tags.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("browseByTag")}
          </span>
          <div className="flex flex-wrap gap-2">
            {tags
              .filter((tag) => tag.slug)
              .map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  aria-pressed={activeTag === tag.slug}
                  onClick={() => toggleTag(tag.slug!)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeTag === tag.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground/80 hover:bg-secondary",
                  )}
                >
                  {tag.name || tag.slug}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {query == null ? (
        <EmptyState title={t("idleTitle")} description={t("idleDescription")} />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : isFetching && results.length === 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription", { term: query.term })}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("resultsCount", { count: total })}
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
