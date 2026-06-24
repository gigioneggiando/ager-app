"use client";

import { useTranslations } from "next-intl";
import { Loader2, Undo2 } from "lucide-react";

import { useInterests } from "@/features/interests/use-interests";
import {
  useMutedInterests,
  useMutedSources,
  useUnmuteInterest,
  useUnmuteSource,
} from "@/features/mutes/use-muted";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";

/**
 * /me/muted — manage the negative-interest lists. Two sections: the topics the user has
 * hidden ("non mi interessa questo argomento") and the sources they've hidden ("nascondi
 * fonte"). Each row un-mutes server-side and widens the feed again.
 */
export function MutedManager() {
  const t = useTranslations("Muted");
  const toast = useToast();

  const { data: muted, isPending, isError } = useMutedInterests();
  const { data: interests } = useInterests();
  const unmute = useUnmuteInterest();

  const {
    data: mutedSources,
    isPending: sourcesPending,
    isError: sourcesError,
  } = useMutedSources();
  const unmuteSource = useUnmuteSource();

  /** Prefer the human interest name; fall back to the slug the API returns. */
  function labelFor(interestId: number, slug: string | null | undefined): string {
    const match = (interests ?? []).find((i) => i.id === interestId);
    return match?.name || slug || `#${interestId}`;
  }

  function handleUnmute(interestId: number, label: string) {
    unmute.mutate(interestId, {
      onSuccess: () => toast.show({ message: t("unmuted", { topic: label }) }),
      onError: () => toast.show({ message: t("unmuteError") }),
    });
  }

  function handleUnmuteSource(sourceId: number, label: string) {
    unmuteSource.mutate(sourceId, {
      onSuccess: () => toast.show({ message: t("sourceUnmuted", { source: label }) }),
      onError: () => toast.show({ message: t("sourceUnmuteError") }),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* ───────────────────────── topics ───────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("topicsHeading")}
        </h2>

        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        ) : (muted ?? []).length === 0 ? (
          <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {(muted ?? []).map((m) => {
              const id = m.interestId;
              if (id == null) return null;
              const label = labelFor(id, m.slug);
              return (
                <li key={id}>
                  <Card className="flex items-center justify-between gap-3 p-3 pl-4">
                    <span className="font-medium">{label}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={unmute.isPending}
                      onClick={() => handleUnmute(id, label)}
                    >
                      {unmute.isPending && unmute.variables === id ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Undo2 aria-hidden="true" />
                      )}
                      {t("unmute")}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ───────────────────────── sources ───────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sourcesHeading")}
        </h2>

        {sourcesPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : sourcesError ? (
          <p className="text-sm text-muted-foreground">{t("sourcesLoadError")}</p>
        ) : (mutedSources ?? []).length === 0 ? (
          <EmptyState
            title={t("sourcesEmptyTitle")}
            description={t("sourcesEmptyDescription")}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {(mutedSources ?? []).map((s) => {
              const id = s.sourceId;
              if (id == null) return null;
              const label = s.name || `#${id}`;
              return (
                <li key={id}>
                  <Card className="flex items-center justify-between gap-3 p-3 pl-4">
                    <span className="font-medium">{label}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={unmuteSource.isPending}
                      onClick={() => handleUnmuteSource(id, label)}
                    >
                      {unmuteSource.isPending && unmuteSource.variables === id ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Undo2 aria-hidden="true" />
                      )}
                      {t("unmute")}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
