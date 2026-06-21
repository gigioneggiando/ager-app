import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, Clock, Lock } from "lucide-react";

import { getArticle } from "@/features/articles/api";
import { formatAbsoluteDate } from "@/lib/format";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgerSymbol } from "@/components/brand/ager-symbol";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Ager" };

  const title = article.title?.trim() || "Ager";
  const description = article.excerpt ?? undefined;
  const canonical = article.canonicalUrl ?? article.url ?? undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: "Ager",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Article");

  const article = await getArticle(id);
  if (!article) notFound();

  const title = article.title?.trim() || t("untitled");
  const href = article.url || article.canonicalUrl || "#";
  const topics = article.topics ?? [];
  const published = article.publishedAt
    ? formatAbsoluteDate(article.publishedAt, locale)
    : null;

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <article className="flex flex-col gap-6">
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <Badge key={topic} variant="neutral">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}

        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>

        {/* Metadata row — link-first: source, date, author, reading time. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {article.sourceName ? (
            <span className="font-medium text-foreground/80">
              {article.sourceName}
            </span>
          ) : null}
          {article.sourceType ? (
            <span className="lowercase">· {article.sourceType}</span>
          ) : null}
          {published ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>{published}</time>
            </>
          ) : null}
          {article.author ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("by", { author: article.author })}</span>
            </>
          ) : null}
          {typeof article.estimatedReadingMinutes === "number" ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {t("readingTime", {
                  minutes: article.estimatedReadingMinutes,
                })}
              </span>
            </>
          ) : null}
        </div>

        {/* License / paywall badges. */}
        {article.licenseType || article.paywallDetected ? (
          <div className="flex flex-wrap gap-1.5">
            {article.licenseType ? (
              <Badge variant="context">
                {t("license", { license: article.licenseType })}
              </Badge>
            ) : null}
            {article.paywallDetected ? (
              <Badge variant="warning">
                <Lock aria-hidden="true" />
                {t("paywall")}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-image bg-muted">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-neutral-beige">
              <AgerSymbol className="size-16 text-primary/15" />
            </span>
          )}
        </div>

        {article.excerpt ? (
          <p className="text-lg leading-relaxed text-foreground/90">
            {article.excerpt}
          </p>
        ) : null}

        {/* Link-first CTA. displayMode (redirect|webview|reader_optin) all open the
            publisher url on web for now.
            TODO(PR5): fire an OPENED_EXTERNAL interaction on click (needs auth). */}
        <div className="flex flex-col gap-2 border-t border-border pt-6">
          <Button asChild size="lg" className="w-fit">
            <a href={href} target="_blank" rel="noopener noreferrer">
              {t("readOnPublisher")}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">{t("linkFirstNote")}</p>
        </div>
      </article>
    </Container>
  );
}
