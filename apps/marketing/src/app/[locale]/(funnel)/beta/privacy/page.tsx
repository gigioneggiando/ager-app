import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { betaPrivacyContent } from "@/features/beta/privacy-content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = locale === "en" ? "en" : "it";
  const content = betaPrivacyContent(normalizedLocale);

  return {
    title: content.title,
    description: content.intro,
    alternates: {
      canonical: `/${normalizedLocale}/beta/privacy`,
      languages: { it: "/it/beta/privacy", en: "/en/beta/privacy" },
    },
  };
}

export default async function BetaPrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const normalizedLocale = locale === "en" ? "en" : "it";
  const content = betaPrivacyContent(normalizedLocale);

  return (
    <div className="min-h-dvh" style={{ backgroundColor: "var(--neutral-beige)" }}>
      <div className="mx-auto w-full max-w-2xl px-6 py-16" style={{ color: "var(--ink-gray)" }}>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--ager-blue)" }}>
          {content.title}
        </h1>
        <p className="mt-2 text-xs opacity-70">{content.updatedAt}</p>
        <p className="mt-6 text-sm leading-relaxed sm:text-base">{content.intro}</p>

        {content.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--ager-blue)" }}>
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed sm:text-base">
                {paragraph}
              </p>
            ))}

            {section.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed sm:text-base">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className="mt-12">
          <Link
            href={`/${normalizedLocale}/beta`}
            className="text-sm underline underline-offset-4"
            style={{ color: "var(--ager-blue)" }}
          >
            {content.backToOnboarding}
          </Link>
        </p>
      </div>
    </div>
  );
}
