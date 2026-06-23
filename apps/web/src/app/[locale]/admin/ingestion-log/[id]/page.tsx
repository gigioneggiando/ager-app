import { setRequestLocale } from "next-intl/server";

import { IngestionLogDetail } from "@/components/admin/ingestion-log-detail";

export default async function AdminIngestionLogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <IngestionLogDetail id={Number(id)} />;
}
