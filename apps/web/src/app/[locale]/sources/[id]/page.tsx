import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, Rss } from "lucide-react";

import { getSource } from "@/features/sources/api";
import { formatAbsoluteDate } from "@/lib/format";
import { safeUrl } from "@/lib/safe-url";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const source = await getSource(id);
  const t = await getTranslations({ locale, namespace: "SourceDetail" });
  return { title: source?.name ?? t("fallbackTitle") };
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground sm:text-right">{children}</dd>
    </div>
  );
}

export default async function SourceDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("SourceDetail");

  const source = await getSource(id);
  if (!source) notFound();

  const name = source.name ?? t("fallbackTitle");
  const homepageUrl = safeUrl(source.url);
  const termsUrl = safeUrl(source.tosUrl);
  const rssUrl = safeUrl(source.rssUrl);

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <Link
        href="/sources"
        className="text-sm text-link transition-colors hover:underline"
      >
        ← {t("backToList")}
      </Link>

      <header className="mt-4 flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted font-serif text-2xl font-bold text-primary"
        >
          {(name[0] ?? "·").toUpperCase()}
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {name}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            {source.type ? <Badge variant="neutral">{source.type}</Badge> : null}
            {source.publisherGroupId != null ? (
              <Badge variant="neutral">
                {t("group", { id: source.publisherGroupId })}
              </Badge>
            ) : null}
            {source.tdmOptoutPresent ? (
              <Badge variant="warning">{t("tdmOptout")}</Badge>
            ) : null}
          </div>
        </div>
      </header>

      <dl className="mt-8">
        {source.country ? (
          <Row label={t("country")}>{source.country.toUpperCase()}</Row>
        ) : null}
        {source.lang ? (
          <Row label={t("language")}>{source.lang.toUpperCase()}</Row>
        ) : null}
        {source.licensingStatus ? (
          <Row label={t("license")}>{source.licensingStatus}</Row>
        ) : null}
        {source.licenseExpiresAt ? (
          <Row label={t("licenseExpires")}>
            {formatAbsoluteDate(source.licenseExpiresAt, locale)}
          </Row>
        ) : null}
        <Row label={t("tdm")}>
          {source.tdmOptoutPresent ? t("yes") : t("no")}
        </Row>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {homepageUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={homepageUrl} target="_blank" rel="noopener noreferrer">
              {t("visitHomepage")}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        ) : null}
        {termsUrl ? (
          <Button asChild variant="ghost" size="sm">
            <a href={termsUrl} target="_blank" rel="noopener noreferrer">
              {t("viewTerms")}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        ) : null}
        {rssUrl ? (
          <Button asChild variant="ghost" size="sm">
            <a href={rssUrl} target="_blank" rel="noopener noreferrer">
              <Rss aria-hidden="true" />
              {t("rss")}
            </a>
          </Button>
        ) : null}
      </div>
    </Container>
  );
}
