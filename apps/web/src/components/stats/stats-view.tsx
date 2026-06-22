"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { toPercent } from "@/lib/format";
import {
  DEFAULT_STATS_WINDOW,
  STATS_WINDOWS,
  useStats,
  type StatsWindow,
} from "@/features/stats/use-stats";
import { usePersistentState } from "@/lib/use-persistent-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";

const WINDOW_KEY = "ager:statsWindow";

function isWindow(value: string): value is StatsWindow {
  return (STATS_WINDOWS as readonly string[]).includes(value);
}

/** A labeled metric with a 0–100% progress bar. */
function RatioCard({
  title,
  hint,
  percent,
}: {
  title: string;
  hint: string;
  percent: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <span className="font-serif text-3xl font-bold text-primary tabular-nums">
          {percent}%
        </span>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={title}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

/** A horizontal bar list (interaction counts, topic distribution). */
function BarList({
  rows,
}: {
  rows: { key: string; label: string; value: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{row.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
              {row.value}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${Math.round((row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StatsView() {
  const t = useTranslations("Stats");
  const [storedWindow, setStoredWindow] = usePersistentState(
    WINDOW_KEY,
    DEFAULT_STATS_WINDOW,
  );
  const window: StatsWindow = isWindow(storedWindow)
    ? storedWindow
    : DEFAULT_STATS_WINDOW;

  const { data, isPending, isError } = useStats(window);

  const byType = Object.entries(data?.byType ?? {})
    .map(([key, value]) => ({
      key,
      label: t.has(`types.${key}`) ? t(`types.${key}`) : key,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const topics = Object.entries(data?.topicDistribution ?? {})
    .map(([key, value]) => ({ key, label: key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div
        className="inline-flex w-fit rounded-md border border-border p-0.5"
        role="group"
        aria-label={t("windowLabel")}
      >
        {STATS_WINDOWS.map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={window === w}
            onClick={() => setStoredWindow(w)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              window === w
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {t(`windows.${w}`)}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : data.total === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <RatioCard
              title={t("distinctSources")}
              hint={t("distinctSourcesHint")}
              percent={toPercent(data.distinctSourceRatio ?? 0)}
            />
            <RatioCard
              title={t("topTopicShare")}
              hint={t("topTopicShareHint")}
              percent={toPercent(data.topTopicShare ?? 0)}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("totalInteractions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <span className="font-serif text-3xl font-bold text-primary tabular-nums">
                  {data.total}
                </span>
                <p className="text-xs text-muted-foreground">
                  {t("totalInteractionsHint")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("byType")}</CardTitle>
              </CardHeader>
              <CardContent>
                {byType.length > 0 ? (
                  <BarList rows={byType} />
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noData")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("topics")}</CardTitle>
              </CardHeader>
              <CardContent>
                {topics.length > 0 ? (
                  <BarList rows={topics} />
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noData")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
