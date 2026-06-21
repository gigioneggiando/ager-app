import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { FeedList } from "@/components/feed/feed-list";

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Feed");

  return (
    <Container size="wide" className="py-8 sm:py-10">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("subheading")}
        </p>
      </header>
      <FeedList />
    </Container>
  );
}
