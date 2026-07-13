import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: t("title"), description: t("intro") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  const sections = [
    { heading: t("controllerTitle"), body: t("controllerBody") },
    { heading: t("dataTitle"), body: t("dataBody") },
    { heading: t("purposesTitle"), body: t("purposesBody") },
    { heading: t("retentionTitle"), body: t("retentionBody") },
    { heading: t("rightsTitle"), body: t("rightsBody") },
  ];

  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>
          <p className="text-xs text-muted-foreground">{t("lastUpdated")}</p>
        </header>

        <p className="rounded-lg border border-border bg-muted p-4 text-sm font-medium text-foreground/90">
          {t("draftNotice")}
        </p>

        {sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="font-serif text-lg font-bold text-primary">{s.heading}</h2>
            <p className="text-sm leading-relaxed text-foreground/90">{s.body}</p>
          </section>
        ))}

        <section className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-4">
          <h2 className="font-serif text-lg font-bold text-primary">{t("contactTitle")}</h2>
          <p className="text-sm text-foreground/90">{t("contactBody")}</p>
          <p className="text-sm">
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-link hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </article>
    </Container>
  );
}
