import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { BetaOnboarding } from "@/features/beta/components/beta-onboarding";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = locale === "en" ? "en" : "it";
  const isIt = normalizedLocale === "it";

  return {
    title: isIt ? "Entra nella beta" : "Join the beta",
    description: isIt
      ? "Notizie di qualità, da fonti scelte una per una."
      : "Quality news, from sources picked one by one.",
    // The funnel is an invite flow, not a landing page: keep it out of search.
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${normalizedLocale}/beta`,
      languages: { it: "/it/beta", en: "/en/beta" },
    },
  };
}

export default async function BetaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BetaOnboarding />;
}
