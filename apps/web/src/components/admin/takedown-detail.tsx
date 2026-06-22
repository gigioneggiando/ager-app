"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatAbsoluteDate } from "@/lib/format";
import {
  TAKEDOWN_ACTIONS,
  useResolveTakedown,
  useTakedownDetail,
  type TakedownActionValue,
} from "@/features/admin/use-takedown";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function TakedownDetail({ id }: { id: number }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const toast = useToast();
  const { data, isPending, isError } = useTakedownDetail(id);
  const resolve = useResolveTakedown(id);

  // Selection derived from state, seeded from the loaded request (no destructive default).
  const [picked, setPicked] = useState<TakedownActionValue | null>(null);
  const [noteInput, setNoteInput] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-sm text-muted-foreground">{t("takedown.loadError")}</p>;
  }

  // Seed the selection from an already-resolved request, but never pre-arm an action for a
  // still-pending one (actionTaken defaults to "none") — the admin must choose explicitly.
  const current =
    data.actionTaken &&
    data.actionTaken !== "none" &&
    (TAKEDOWN_ACTIONS as readonly string[]).includes(data.actionTaken)
      ? (data.actionTaken as TakedownActionValue)
      : null;
  const action = picked ?? current;
  const notes = noteInput ?? data.responseNotes ?? "";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!action) return;
    resolve.mutate(
      { actionTaken: action, responseNotes: notes },
      {
        onSuccess: () =>
          toast.show({ message: t("takedown.resolved", { action: t(`takedown.actions.${action}`) }) }),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/takedown"
        className="inline-flex w-fit items-center gap-1 text-sm text-link transition-colors hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {t("takedown.backToQueue")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("takedown.requestTitle", { id: data.requestId ?? id })}
        </h1>
        {data.isPending ? (
          <Badge variant="warning">{t("takedown.status.pending")}</Badge>
        ) : (
          <Badge variant="neutral">{t("takedown.status.resolved")}</Badge>
        )}
      </div>

      {/* Target */}
      <Card>
        <CardHeader>
          <CardTitle>{t("takedown.target")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {data.articleId != null ? (
            <>
              <Row label={t("takedown.article")} value={data.articleTitle ?? `#${data.articleId}`} />
              {data.articleUrl ? (
                <a
                  href={data.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1 text-link transition-colors hover:underline"
                >
                  {data.articleUrl}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
              {data.articleTakedownStatus ? (
                <Row
                  label={t("takedown.articleStatus")}
                  value={data.articleTakedownStatus}
                />
              ) : null}
            </>
          ) : null}
          {data.sourceName ? (
            <Row label={t("takedown.source")} value={data.sourceName} />
          ) : null}
        </CardContent>
      </Card>

      {/* Requester + reason */}
      <Card>
        <CardHeader>
          <CardTitle>{t("takedown.requester")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label={t("takedown.email")} value={data.requesterEmail ?? "—"} />
          {data.requesterRole ? (
            <Row label={t("takedown.role")} value={data.requesterRole} />
          ) : null}
          <Row
            label={t("takedown.received")}
            value={data.receivedAt ? formatAbsoluteDate(data.receivedAt, locale) : "—"}
          />
          {data.reason ? (
            <div className="mt-1 flex flex-col gap-1">
              <span className="text-muted-foreground">{t("takedown.reasonLabel")}</span>
              <blockquote className="border-l-2 border-border pl-3 italic text-foreground/90">
                {data.reason}
              </blockquote>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Resolve */}
      <Card>
        <CardHeader>
          <CardTitle>{t("takedown.resolveTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">{t("takedown.actionLabel")}</legend>
              {TAKEDOWN_ACTIONS.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="takedown-action"
                    value={a}
                    checked={action === a}
                    onChange={() => setPicked(a)}
                    className="accent-primary"
                  />
                  {t(`takedown.actions.${a}`)}
                </label>
              ))}
            </fieldset>

            {action === "removed" ? (
              <p className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>{t("takedown.removedWarning")}</span>
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="response-notes" className="text-sm font-medium">
                {t("takedown.notesLabel")}
              </label>
              <textarea
                id="response-notes"
                value={notes}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={3}
                maxLength={2048}
                placeholder={t("takedown.notesPlaceholder")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!action || resolve.isPending}>
                {resolve.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                {t("takedown.apply")}
              </Button>
              {resolve.isError ? (
                <span className="text-sm text-destructive">{t("takedown.resolveError")}</span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
