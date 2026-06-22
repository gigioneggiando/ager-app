import { setRequestLocale } from "next-intl/server";

import { TakedownQueue } from "@/components/admin/takedown-queue";

export default async function AdminTakedownPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TakedownQueue />;
}
