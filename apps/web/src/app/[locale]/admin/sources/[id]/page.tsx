import { setRequestLocale } from "next-intl/server";

import { SourceDetail } from "@/components/admin/source-detail";

export default async function AdminSourceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <SourceDetail id={Number(id)} />;
}
