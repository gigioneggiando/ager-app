import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSession } from "@/lib/server/session";
import { Container } from "@/components/layout/container";
import { ReadingListDetail } from "@/components/reading-lists/reading-list-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ReadingLists" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function ReadingListDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/me/reading-lists/${id}`)}`,
    );
  }

  return (
    <Container size="default" className="py-8 sm:py-12">
      <ReadingListDetail listId={Number(id)} />
    </Container>
  );
}
