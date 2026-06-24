"use client";

import { useTranslations } from "next-intl";
import { Loader2, Undo2 } from "lucide-react";

import { useInterests } from "@/features/interests/use-interests";
import { useMutedInterests, useUnmuteInterest } from "@/features/mutes/use-muted";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";

/**
 * /me/muted — manage muted topics (the negative-interest list). Lists the topics the user
 * has hidden ("non mi interessa") and lets them un-mute.
 *
 * NOTE: source-mute is intentionally not listed here — the backend exposes mute/un-mute for
 * sources (POST/DELETE /api/me/muted-sources/{id}) but no list endpoint, so there is nothing
 * to enumerate yet. Tracked as a backend follow-up.
 */
export function MutedManager() {
  const t = useTranslations("Muted");
  const toast = useToast();
  const { data: muted, isPending, isError } = useMutedInterests();
  const { data: interests } = useInterests();
  const unmute = useUnmuteInterest();

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

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
    </div>
  );
}
