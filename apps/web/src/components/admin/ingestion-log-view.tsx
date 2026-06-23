"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ChevronRight } from "lucide-react";
import type { IngestionLogStats } from "@ager/api-client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatAbsoluteDate } from "@/lib/format";
import {
  INGESTION_PAGE_SIZE,
  useIngestionList,
  useIngestionStats,
  type IngestionFilter,
} from "@/features/admin/use-ingestion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

const FILTERS: IngestionFilter[] = ["all", "errors"];

export function IngestionLogView() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [filter, setFilter] = useState<IngestionFilter>("all");
  const [page, setPage] = useState(1);

  const stats = useIngestionStats(14);
  const { data, isPending, isError } = useIngestionList(filter, page);

  const rows = data ?? [];
  const hasNext = rows.length === INGESTION_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("ingestion.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("ingestion.subtitle")}
        </p>
      </div>

      {stats.data ? <StatsChart stats={stats.data} /> : null}

      <div
        className="inline-flex w-fit rounded-md border border-border p-0.5"
        role="group"
        aria-label={t("ingestion.filterLabel")}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {t(`ingestion.filters.${f}`)}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("ingestion.loadError")}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title={t("ingestion.emptyTitle")}
          description={t("ingestion.emptyDescription")}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {rows.map((r) => {
              const hasErrors = Boolean(r.errors && r.errors.trim());
              return (
                <li key={r.logId}>
                  <Card className="p-0 transition-colors hover:border-primary/30">
                    <Link
                      href={`/admin/ingestion-log/${r.logId}`}
                      className="flex items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {r.sourceName ?? `#${r.sourceId}`}
                          </span>
                          {hasErrors ? (
                            <Badge variant="error">
                              <AlertTriangle className="size-3" aria-hidden="true" />
                              {t("ingestion.errorsBadge")}
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.fetchedAt ? formatAbsoluteDate(r.fetchedAt, locale) : "—"}
                          {" · "}
                          {t("ingestion.counts", {
                            ingested: r.articlesIngested ?? 0,
                            skipped: r.articlesSkipped ?? 0,
                          })}
                        </span>
                      </div>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ul>

          <nav
            className="flex items-center justify-between gap-4 pt-2"
            aria-label={t("ingestion.pagination")}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("ingestion.previous")}
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {t("ingestion.pageN", { page })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("ingestion.next")}
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}

/** Compact per-day bar chart of ingested articles over the stats window. */
function StatsChart({ stats }: { stats: IngestionLogStats }) {
  const t = useTranslations("Admin");
  const locale = useLocale();

  const days = useMemo(() => buildDays(stats), [stats]);
  const max = Math.max(1, ...days.map((d) => d.ingested));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t("ingestion.chartTitle", { days: stats.windowDays ?? days.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-28 items-end gap-1"
          role="img"
          aria-label={t("ingestion.chartAria", {
            total: days.reduce((s, d) => s + d.ingested, 0),
            days: days.length,
          })}
        >
          {days.map((d) => (
            <div
              key={d.day}
              className="flex flex-1 items-end"
              title={`${formatAbsoluteDate(d.day, locale)} · ${d.ingested} / ${d.skipped}`}
            >
              <div
                className={cn(
                  "w-full rounded-t bg-primary/70",
                  d.errors > 0 && "bg-warning/70",
                )}
                style={{ height: `${Math.round((d.ingested / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DayBucket {
  day: string;
  ingested: number;
  skipped: number;
  errors: number;
}

/** Collapse per-(day, source) points into one bucket per day across the [from..to] range. */
function buildDays(stats: IngestionLogStats): DayBucket[] {
  const byDay = new Map<string, DayBucket>();
  for (const p of stats.points ?? []) {
    if (!p.day) continue;
    const b = byDay.get(p.day) ?? { day: p.day, ingested: 0, skipped: 0, errors: 0 };
    b.ingested += p.articlesIngested ?? 0;
    b.skipped += p.articlesSkipped ?? 0;
    b.errors += p.runsWithErrors ?? 0;
    byDay.set(p.day, b);
  }

  // Fill the full window so the X-axis is continuous even on quiet days.
  const out: DayBucket[] = [];
  if (stats.from && stats.to) {
    const cursor = new Date(`${stats.from}T00:00:00Z`);
    const end = new Date(`${stats.to}T00:00:00Z`);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      out.push(byDay.get(key) ?? { day: key, ingested: 0, skipped: 0, errors: 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}
