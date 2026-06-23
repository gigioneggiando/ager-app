import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { PublicListView } from "@/components/reading-lists/public-list-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PublicList" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PublicReadingListPage({
  params,
}: {
  params: Promise<{ locale: string; owner: string; slug: string }>;
}) {
  const { locale, owner, slug } = await params;
  setRequestLocale(locale);

  return (
    <Container size="default" className="py-8 sm:py-12">
      <PublicListView owner={owner} slug={slug} />
    </Container>
  );
}
