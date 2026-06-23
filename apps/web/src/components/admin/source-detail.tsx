"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import type { SourceAdmin } from "@ager/api-client";

import { Link } from "@/i18n/navigation";
import { formatAbsoluteDate } from "@/lib/format";
import {
  LICENSING_STATUSES,
  NEGOTIATION_STATUSES,
  useDisableSource,
  useEnableSource,
  useRefreshTos,
  useSourceDetail,
  useUpdateSource,
} from "@/features/admin/use-sources";
import { usePullSource } from "@/features/admin/use-source-ingest";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function SourceDetail({ id }: { id: number }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const toast = useToast();
  const { data, isPending, isError } = useSourceDetail(id);
  const enable = useEnableSource(id);
  const disable = useDisableSource(id);
  const refreshTos = useRefreshTos(id);
  const pull = usePullSource(id);

  function forceIngest() {
    if (!window.confirm(t("sources.confirmPull"))) return;
    pull.mutate(undefined, {
      onSuccess: () => toast.show({ message: t("sources.pullQueued") }),
      onError: () => toast.show({ message: t("sources.pullError") }),
    });
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-sm text-muted-foreground">{t("sources.loadError")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/sources"
        className="inline-flex w-fit items-center gap-1 text-sm text-link transition-colors hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {t("sources.backToList")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.name}</h1>
          {data.type ? <Badge variant="neutral">{data.type}</Badge> : null}
          <Badge variant={data.enabled ? "verified" : "warning"}>
            {data.enabled ? t("sources.enabled") : t("sources.disabled")}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pull.isPending}
            onClick={forceIngest}
          >
            {pull.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            {t("sources.pull")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={enable.isPending || disable.isPending}
            onClick={() =>
              data.enabled
                ? disable.mutate(undefined, {
                    onSuccess: () => toast.show({ message: t("sources.disabledToast") }),
                  })
                : enable.mutate(undefined, {
                    onSuccess: () => toast.show({ message: t("sources.enabledToast") }),
                  })
            }
          >
            {data.enabled ? t("sources.disable") : t("sources.enable")}
          </Button>
        </div>
      </div>

      {/* Read-only attributes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sources.details")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label={t("sources.urlLabel")}>
            <a
              href={data.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-link hover:underline"
            >
              {data.url}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Row>
          {data.rssUrl ? <Row label={t("sources.rssLabel")}>{data.rssUrl}</Row> : null}
          <Row label={t("sources.countryLang")}>
            {[data.country, data.lang].filter(Boolean).join(" · ") || "—"}
          </Row>
          <Row label={t("sources.tdmOptout")}>
            {data.tdmOptoutPresent
              ? `${t("common.yes")}${data.tdmOptoutMechanism ? ` (${data.tdmOptoutMechanism})` : ""}`
              : t("common.no")}
          </Row>
        </CardContent>
      </Card>

      <SourceEditForm key={`${data.sourceId}:${data.updatedAt}`} id={id} source={data} />

      {/* ToS monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sources.tos")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label={t("sources.tosUrl")}>{data.tosUrl ?? "—"}</Row>
          <Row label={t("sources.tosChecked")}>
            {data.tosLastCheckedAt
              ? formatAbsoluteDate(data.tosLastCheckedAt, locale)
              : "—"}
          </Row>
          <Row label={t("sources.tosHash")}>
            <span className="font-mono text-xs">
              {data.tosHashLast ? data.tosHashLast.slice(0, 16) + "…" : "—"}
            </span>
          </Row>
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshTos.isPending}
              onClick={() =>
                refreshTos.mutate(undefined, {
                  onSuccess: (r) =>
                    toast.show({
                      message: r.changed
                        ? t("sources.tosChanged")
                        : t("sources.tosUnchanged"),
                    }),
                })
              }
            >
              {refreshTos.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw aria-hidden="true" />
              )}
              {t("sources.refreshTos")}
            </Button>
            {refreshTos.isError ? (
              <span className="text-sm text-destructive">{t("sources.tosError")}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Governance edit form. Keyed by source updatedAt so it re-seeds after a save/refetch. */
function SourceEditForm({ id, source }: { id: number; source: SourceAdmin }) {
  const t = useTranslations("Admin");
  const toast = useToast();
  const update = useUpdateSource(id);

  const [licensingStatus, setLicensingStatus] = useState(
    source.licensingStatus ?? "no_agreement_linking_only",
  );
  const [negotiationStatus, setNegotiationStatus] = useState(
    source.negotiationStatus ?? "none",
  );
  const [licenseExpiresAt, setLicenseExpiresAt] = useState(source.licenseExpiresAt ?? "");
  const [email, setEmail] = useState(source.publisherContactEmail ?? "");
  const [notes, setNotes] = useState(source.notes ?? "");
  const [imageHotlink, setImageHotlink] = useState(source.imageHotlinkAllowed ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      {
        licensingStatus,
        licenseExpiresAt: licenseExpiresAt || undefined,
        negotiationStatus,
        publisherContactEmail: email.trim() || undefined,
        notes: notes.trim() || undefined,
        imageHotlinkAllowed: imageHotlink,
      },
      { onSuccess: () => toast.show({ message: t("sources.saved") }) },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sources.governance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lic-status" className="text-sm font-medium">
                {t("sources.licensingLabel")}
              </label>
              <select
                id="lic-status"
                value={licensingStatus}
                onChange={(e) => setLicensingStatus(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LICENSING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`sources.licensing.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="neg-status" className="text-sm font-medium">
                {t("sources.negotiationLabel")}
              </label>
              <select
                id="neg-status"
                value={negotiationStatus}
                onChange={(e) => setNegotiationStatus(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {NEGOTIATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`sources.negotiation.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lic-expires" className="text-sm font-medium">
                {t("sources.licenseExpires")}
              </label>
              <Input
                id="lic-expires"
                type="date"
                value={licenseExpiresAt}
                onChange={(e) => setLicenseExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-sm font-medium">
                {t("sources.contactEmail")}
              </label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="src-notes" className="text-sm font-medium">
              {t("sources.notesLabel")}
            </label>
            <textarea
              id="src-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={8192}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={imageHotlink}
              onChange={(e) => setImageHotlink(e.target.checked)}
              className="accent-primary"
            />
            {t("sources.imageHotlink")}
          </label>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {t("sources.save")}
            </Button>
            {update.isError ? (
              <span className="text-sm text-destructive">{t("sources.saveError")}</span>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
