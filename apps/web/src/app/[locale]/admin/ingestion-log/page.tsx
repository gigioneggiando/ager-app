import { setRequestLocale } from "next-intl/server";

import { IngestionLogView } from "@/components/admin/ingestion-log-view";

export default async function AdminIngestionLogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <IngestionLogView />;
}
