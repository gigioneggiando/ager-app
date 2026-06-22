"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatAbsoluteDate } from "@/lib/format";
import {
  useTakedownList,
  type TakedownFilter,
} from "@/features/admin/use-takedown";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";

const FILTERS: TakedownFilter[] = ["pending", "recent", "all"];

export function TakedownQueue() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [filter, setFilter] = useState<TakedownFilter>("pending");
  const { data, isPending, isError } = useTakedownList(filter);

  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("takedown.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("takedown.subtitle")}
        </p>
      </div>

      <div
        className="inline-flex w-fit rounded-md border border-border p-0.5"
        role="group"
        aria-label={t("takedown.filterLabel")}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {t(`takedown.filters.${f}`)}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("takedown.loadError")}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title={t("takedown.emptyTitle")}
          description={t("takedown.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.requestId}>
              <Card className="p-0 transition-colors hover:border-primary/30">
                <Link
                  href={`/admin/takedown/${r.requestId}`}
                  className="flex items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-primary">
                        {r.articleTitle?.trim() ||
                          r.sourceName?.trim() ||
                          t("takedown.unknownTarget")}
                      </span>
                      {r.isPending ? (
                        <Badge variant="warning">{t("takedown.status.pending")}</Badge>
                      ) : (
                        <Badge variant="neutral">
                          {t("takedown.status.resolved")}
                          {r.actionTaken && r.actionTaken !== "none"
                            ? ` · ${t(`takedown.actions.${r.actionTaken}`)}`
                            : ""}
                        </Badge>
                      )}
                    </span>
                    {r.reason ? (
                      <span className="line-clamp-1 text-sm text-muted-foreground">
                        {r.reason}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {r.requesterEmail}
                      {r.receivedAt
                        ? ` · ${formatAbsoluteDate(r.receivedAt, locale)}`
                        : ""}
                    </span>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
