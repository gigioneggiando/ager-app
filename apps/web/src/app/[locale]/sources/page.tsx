import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSources } from "@/features/sources/api";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sources" });
  return { title: t("heading"), description: t("subheading") };
}

function monogram(name: string | null | undefined): string {
  return (name?.trim()?.[0] ?? "·").toUpperCase();
}

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Sources");

  const sources = await getSources();

  return (
    <Container size="wide" className="py-8 sm:py-10">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("subheading")}
        </p>
      </header>

      {sources.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source, index) => (
            <li key={source.sourceId ?? `source-${index}`}>
              <Link
                href={`/sources/${source.sourceId}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:border-primary/30">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-beige font-serif text-lg font-bold text-primary"
                  >
                    {monogram(source.name)}
                  </span>
                  <span className="flex flex-col gap-1.5">
                    <span className="font-serif font-bold leading-snug text-primary">
                      {source.name ?? t("unknownName")}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {source.type ? (
                        <Badge variant="neutral">{source.type}</Badge>
                      ) : null}
                      {source.publisherGroupId != null ? (
                        <Badge variant="neutral">
                          {t("group", { id: source.publisherGroupId })}
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
