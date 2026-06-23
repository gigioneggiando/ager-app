"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, RefreshCw } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LICENSING_STATUSES,
  useSourceList,
  type SourceServerFilter,
} from "@/features/admin/use-sources";
import { usePullAllSources } from "@/features/admin/use-source-ingest";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { CreateSourceDialog } from "@/components/admin/create-source-dialog";

const SERVER_FILTERS: SourceServerFilter[] = [
  "all",
  "expiring",
  "tdmOptout",
  "negotiating",
];

export function SourcesView() {
  const t = useTranslations("Admin");
  const [filter, setFilter] = useState<SourceServerFilter>("all");
  const [licensing, setLicensing] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const toast = useToast();
  const pullAll = usePullAllSources();
  const { data, isPending, isError } = useSourceList(filter);

  function forceIngestAll() {
    if (!window.confirm(t("sources.confirmPullAll"))) return;
    pullAll.mutate(undefined, {
      onSuccess: () => toast.show({ message: t("sources.pullAllQueued") }),
      onError: () => toast.show({ message: t("sources.pullError") }),
    });
  }

  const rows = (data ?? []).filter(
    (s) => licensing === "all" || s.licensingStatus === licensing,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("sources.title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("sources.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={forceIngestAll}
            disabled={pullAll.isPending}
          >
            <RefreshCw aria-hidden="true" />
            {t("sources.pullAll")}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            {t("sources.create")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-md border border-border p-0.5"
          role="group"
          aria-label={t("sources.filterLabel")}
        >
          {SERVER_FILTERS.map((f) => (
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
              {t(`sources.filters.${f}`)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("sources.licensingLabel")}</span>
          <select
            value={licensing}
            onChange={(e) => setLicensing(e.target.value)}
            className="rounded-md border border-border bg-background py-1.5 pl-2 pr-7 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">{t("sources.licensing.all")}</option>
            {LICENSING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`sources.licensing.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("sources.loadError")}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title={t("sources.emptyTitle")}
          description={t("sources.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <li key={s.sourceId}>
              <Card className="p-0 transition-colors hover:border-primary/30">
                <Link
                  href={`/admin/sources/${s.sourceId}`}
                  className="flex items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-primary">{s.name}</span>
                      {s.type ? <Badge variant="neutral">{s.type}</Badge> : null}
                      {s.enabled ? null : (
                        <Badge variant="warning">{t("sources.disabled")}</Badge>
                      )}
                      {s.tdmOptoutPresent ? (
                        <Badge variant="error">{t("sources.tdmOptout")}</Badge>
                      ) : null}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {s.licensingStatus ? (
                        <span>{t(`sources.licensing.${s.licensingStatus}`)}</span>
                      ) : null}
                      {s.negotiationStatus && s.negotiationStatus !== "none" ? (
                        <span>· {t(`sources.negotiation.${s.negotiationStatus}`)}</span>
                      ) : null}
                      {s.licenseExpiresAt ? (
                        <span>· {t("sources.expiresOn", { date: s.licenseExpiresAt })}</span>
                      ) : null}
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

      <CreateSourceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
