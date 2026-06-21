import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlertTriangle, BadgeCheck, Inbox } from "lucide-react";
import { brand, state } from "@ager/shared";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import {
  FeedCard,
  FeedCardSkeleton,
  type FeedCardArticle,
} from "@/components/feed/feed-card";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

type Swatch = {
  name: string;
  hex: string;
  role: string;
  usage?: string;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-border py-12 first:border-t-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SwatchCard({ swatch }: { swatch: Swatch }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="h-24 w-full" style={{ backgroundColor: swatch.hex }} />
      <div className="flex flex-col gap-0.5 p-3">
        <span className="text-sm font-semibold text-foreground">
          {swatch.name}
        </span>
        <span className="font-mono text-xs uppercase text-muted-foreground">
          {swatch.hex}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">{swatch.role}</span>
        {swatch.usage ? (
          <span className="text-xs font-medium text-foreground/70">
            {swatch.usage}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const MOCK_ARTICLES: FeedCardArticle[] = [
  {
    id: "1",
    title:
      "La nuova legge sull'acqua: cosa cambia per i comuni e perché conta",
    source: { name: "Il Sole 24 Ore" },
    publishedAt: "2026-06-19T08:30:00Z",
    excerpt:
      "Il provvedimento ridisegna la governance delle risorse idriche locali. Abbiamo letto il testo e isolato i tre punti che incidono davvero sulla gestione comunale.",
    imageUrl: "https://picsum.photos/seed/ager-acqua/640/360",
    topics: ["Ambiente", "Politica"],
    readingTimeMinutes: 6,
    href: "https://example.com/articolo-acqua",
    why: { score: 0.82 },
  },
  {
    id: "2",
    title: "Inflazione in calo: i dati ISTAT letti senza allarmismi",
    source: { name: "ANSA" },
    publishedAt: "2026-06-18T15:10:00Z",
    excerpt:
      "Il dato mensile scende, ma la lettura richiede contesto. Cosa misura l'indice, cosa no, e perché il carrello della spesa racconta una storia diversa.",
    imageUrl: "https://picsum.photos/seed/ager-istat/640/360",
    topics: ["Economia"],
    readingTimeMinutes: 4,
    href: "https://example.com/articolo-inflazione",
    why: { score: 0.74 },
  },
  {
    id: "3",
    title: "Scuola e intelligenza artificiale: le linee guida del ministero",
    source: { name: "Corriere della Sera" },
    publishedAt: "2026-06-17T07:00:00Z",
    excerpt:
      "Arrivano le indicazioni per l'uso dell'IA in classe. Distinguiamo ciò che è vincolante da ciò che resta una raccomandazione, con esempi concreti.",
    topics: ["Scuola", "Tecnologia", "Società"],
    readingTimeMinutes: 8,
    href: "https://example.com/articolo-scuola-ia",
    why: { score: 0.91 },
  },
];

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Styleguide");

  const coreSwatches: Swatch[] = [
    {
      name: "Ager Blue",
      hex: brand.agerBlue,
      role: t("palette.agerBlue"),
      usage: "~25%",
    },
    {
      name: "Editorial White",
      hex: brand.editorialWhite,
      role: t("palette.editorialWhite"),
      usage: "~60%",
    },
    {
      name: "Neutral Beige",
      hex: brand.neutralBeige,
      role: t("palette.neutralBeige"),
    },
    { name: "Ink Gray", hex: brand.inkGray, role: t("palette.inkGray") },
    { name: "Muted Gray", hex: brand.mutedGray, role: t("palette.mutedGray") },
    {
      name: "Ethical Green",
      hex: brand.ethicalGreen,
      role: t("palette.ethicalGreen"),
      usage: "≤10%",
    },
  ];

  const stateSwatches: Swatch[] = [
    { name: "Link", hex: state.link, role: t("palette.link") },
    { name: "Success", hex: state.success, role: t("palette.success") },
    { name: "Warning", hex: state.warning, role: t("palette.warning") },
    { name: "Error", hex: state.error, role: t("palette.error") },
  ];

  const feedLabels = {
    why: t("feed.why"),
    readingTime: (m: number) => t("feed.readingTime", { minutes: m }),
    openExternal: t("feed.openExternal"),
  };

  return (
    <Container size="wide" className="py-10">
      <header className="flex flex-col gap-2 pb-4">
        <Badge variant="primary" className="w-fit">
          {t("badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("intro")}
        </p>
      </header>

      {/* PALETTE */}
      <Section title={t("sections.palette")} description={t("palette.note")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {coreSwatches.map((s) => (
            <SwatchCard key={s.name} swatch={s} />
          ))}
        </div>
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("palette.functional")}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stateSwatches.map((s) => (
            <SwatchCard key={s.name} swatch={s} />
          ))}
        </div>
      </Section>

      {/* TYPOGRAPHY */}
      <Section title={t("sections.typography")} description={t("type.note")}>
        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Merriweather · {t("type.synthesis")}
            </span>
            <p className="font-serif text-5xl font-black tracking-tight text-primary">
              {t("type.sampleHeading")}
            </p>
          </div>
          <h1 className="font-serif text-4xl font-bold">H1 · {t("type.h1")}</h1>
          <h2 className="font-serif text-3xl font-bold">H2 · {t("type.h2")}</h2>
          <h3 className="font-serif text-2xl font-bold">H3 · {t("type.h3")}</h3>
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Inter · {t("type.depth")}
            </span>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/90">
              {t("type.sampleBody")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("type.small")} · 14px · {t("type.metadata")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("type.caption")} · 12px
          </p>
        </div>
      </Section>

      {/* LOGO */}
      <Section title={t("sections.logo")} description={t("logo.note")}>
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col items-start gap-2">
            <Logo height={48} />
            <span className="text-xs text-muted-foreground">
              {t("logo.full")} · ≥120px
            </span>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Logo variant="symbol" height={48} />
            <span className="text-xs text-muted-foreground">
              {t("logo.symbol")} · ≥32px
            </span>
          </div>
          <div className="flex flex-col items-start gap-2 rounded-lg bg-primary p-5">
            <Logo height={40} className="text-editorial-white" />
            <span className="text-xs text-editorial-white/70">
              {t("logo.onBlue")}
            </span>
          </div>
        </div>
        <p className="max-w-2xl text-xs text-muted-foreground">
          {t("logo.forbidden")}
        </p>
      </Section>

      {/* BUTTONS */}
      <Section title={t("sections.buttons")} description={t("buttons.note")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button>{t("buttons.primary")}</Button>
          <Button variant="secondary">{t("buttons.secondary")}</Button>
          <Button variant="outline">{t("buttons.outline")}</Button>
          <Button variant="ghost">{t("buttons.ghost")}</Button>
          <Button variant="link">{t("buttons.link")}</Button>
          <Button variant="destructive">{t("buttons.destructive")}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      {/* BADGES */}
      <Section title={t("sections.badges")} description={t("badges.note")}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="verified">
            <BadgeCheck /> {t("badges.verified")}
          </Badge>
          <Badge variant="context">{t("badges.context")}</Badge>
          <Badge variant="context">{t("badges.sources")}</Badge>
          <Badge variant="warning">{t("badges.warning")}</Badge>
          <Badge variant="error">{t("badges.error")}</Badge>
          <Badge variant="neutral">{t("badges.topic")}</Badge>
        </div>
      </Section>

      {/* CARD + STATES */}
      <Section title={t("sections.surfaces")} description={t("surfaces.note")}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("surfaces.cardTitle")}</CardTitle>
              <CardDescription>{t("surfaces.cardDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Inbox />}
            title={t("surfaces.emptyTitle")}
            description={t("surfaces.emptyDescription")}
            action={
              <Button variant="outline" size="sm">
                {t("surfaces.emptyAction")}
              </Button>
            }
          />

          <ErrorState
            icon={<AlertTriangle />}
            title={t("surfaces.errorTitle")}
            description={t("surfaces.errorDescription")}
            action={
              <Button variant="outline" size="sm">
                {t("surfaces.errorAction")}
              </Button>
            }
          />
        </div>
      </Section>

      {/* FEEDCARD */}
      <Section title={t("sections.feed")} description={t("feed.note")}>
        {/* Flag for owner review — brand 80px image radius at thumbnail size. */}
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground/90">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p>{t("feed.radiusFlag")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_ARTICLES.map((article) => (
            <FeedCard
              key={article.id}
              article={article}
              locale={locale}
              labels={feedLabels}
            />
          ))}
          <FeedCardSkeleton />
        </div>
      </Section>
    </Container>
  );
}
