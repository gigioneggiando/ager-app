import { setRequestLocale } from "next-intl/server";

import { TakedownDetail } from "@/components/admin/takedown-detail";

export default async function AdminTakedownDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TakedownDetail id={Number(id)} />;
}
