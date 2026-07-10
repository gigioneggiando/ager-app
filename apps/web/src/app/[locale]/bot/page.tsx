import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Ager-Bot/1.0 (+https://agerculture.com)";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Bot" });
  return { title: t("title"), description: t("intro") };
}

export default async function BotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Bot");

  const sections = [
    { heading: t("respectTitle"), body: t("respectBody") },
    { heading: t("optoutTitle"), body: t("optoutBody") },
  ];

  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="font-serif text-lg font-bold text-primary">{t("uaTitle")}</h2>
          <p className="text-sm leading-relaxed text-foreground/90">{t("uaBody")}</p>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
            {UA}
          </pre>
        </section>

        {sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="font-serif text-lg font-bold text-primary">{s.heading}</h2>
            <p className="text-sm leading-relaxed text-foreground/90">{s.body}</p>
          </section>
        ))}

        <p className="text-sm text-muted-foreground">
          {t("contactLabel")}{" "}
          <a href="mailto:bot@agerculture.com" className="text-link hover:underline">
            bot@agerculture.com
          </a>
        </p>
      </article>
    </Container>
  );
}
