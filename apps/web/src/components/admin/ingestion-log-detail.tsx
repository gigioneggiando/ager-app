"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatAbsoluteDate } from "@/lib/format";
import { useIngestionDetail } from "@/features/admin/use-ingestion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function IngestionLogDetail({ id }: { id: number }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const { data, isPending, isError } = useIngestionDetail(id);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-sm text-muted-foreground">{t("ingestion.loadError")}</p>;
  }

  const hasErrors = Boolean(data.errors && data.errors.trim());

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/ingestion-log"
        className="inline-flex w-fit items-center gap-1 text-sm text-link transition-colors hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {t("ingestion.backToList")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {data.sourceName ?? `#${data.sourceId}`}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("ingestion.runTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label={t("ingestion.fetchedAt")}>
            {data.fetchedAt ? formatAbsoluteDate(data.fetchedAt, locale) : "—"}
          </Row>
          <Row label={t("ingestion.ingested")}>{data.articlesIngested ?? 0}</Row>
          <Row label={t("ingestion.skipped")}>{data.articlesSkipped ?? 0}</Row>
          <Row label={t("ingestion.sourceId")}>{data.sourceId}</Row>
        </CardContent>
      </Card>

      {/* Forensic policy-file snapshot (DSA / AI-Act audit trail). */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ingestion.policySnapshot")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <HashRow label="robots.txt" hash={data.robotsTxtHash} present={Boolean(data.robotsTxtHash)} t={t} />
          <HashRow
            label="tdmrep.json"
            hash={data.tdmrepJsonHash}
            present={data.tdmrepJsonPresent ?? false}
            t={t}
          />
          <HashRow
            label="ai.txt"
            hash={data.aiTxtHash}
            present={data.aiTxtPresent ?? false}
            t={t}
          />
        </CardContent>
      </Card>

      {hasErrors ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">{t("ingestion.errorsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground/90">
              {data.errors}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function HashRow({
  label,
  hash,
  present,
  t,
}: {
  label: string;
  hash: string | null | undefined;
  present: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs">{label}</span>
        <Badge variant={present ? "verified" : "neutral"}>
          {present ? t("ingestion.present") : t("ingestion.absent")}
        </Badge>
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {hash ? hash.slice(0, 16) + "…" : "—"}
      </span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
