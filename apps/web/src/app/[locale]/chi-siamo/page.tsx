import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/brand/logo";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: t("title"), description: t("intro") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  const sections = [
    { key: "mission", title: t("missionTitle"), body: t("missionBody") },
    { key: "vision", title: t("visionTitle"), body: t("visionBody") },
    { key: "method", title: t("methodTitle"), body: t("methodBody") },
  ];

  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <article className="flex flex-col gap-10">
        <header className="flex flex-col gap-4">
          <Logo variant="full" height={44} />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {sections.map((s) => (
            <section key={s.key} className="flex flex-col gap-2">
              <h2 className="font-serif text-xl font-bold text-primary">
                {s.title}
              </h2>
              <p className="leading-relaxed text-foreground/90">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">{t("closing")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm text-link hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </article>
    </Container>
  );
}
