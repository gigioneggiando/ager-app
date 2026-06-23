import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { TakedownForm } from "@/components/takedown/takedown-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Takedown" });
  return { title: t("title"), description: t("subtitle") };
}

/** Public DSA Art. 16 takedown notice form — no auth required. */
export default async function TakedownPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <TakedownForm />
    </Container>
  );
}
