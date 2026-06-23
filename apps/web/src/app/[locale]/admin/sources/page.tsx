import { setRequestLocale } from "next-intl/server";

import { SourcesView } from "@/components/admin/sources-view";

export default async function AdminSourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SourcesView />;
}
