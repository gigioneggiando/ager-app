"use client";

import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";

import { useExportData } from "@/features/account/use-account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccountDataExport() {
  const t = useTranslations("Account");
  const exportData = useExportData();
  const rateLimited =
    exportData.isError &&
    exportData.error instanceof Error &&
    exportData.error.message === "rate_limited";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dataTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("dataDescription")}</p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => exportData.mutate()}
            disabled={exportData.isPending}
          >
            {exportData.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            {t("exportData")}
          </Button>
          <span className="text-xs text-muted-foreground">{t("exportLimit")}</span>
        </div>
        {rateLimited ? (
          <p role="alert" className="text-sm text-warning">
            {t("errors.exportRateLimited")}
          </p>
        ) : exportData.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {t("errors.exportFailed")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
