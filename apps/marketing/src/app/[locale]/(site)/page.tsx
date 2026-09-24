import { setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/landing/hero";
import { Values } from "@/components/landing/values";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaSection } from "@/components/landing/cta-section";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Values />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
