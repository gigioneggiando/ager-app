import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSession } from "@/lib/server/session";
import { Container } from "@/components/layout/container";
import { RestoreForm } from "@/components/auth/restore-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Restore" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function RestorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Already signed in → nothing to restore.
  const session = await getSession();
  if (session) {
    redirect(`/${locale}`);
  }

  return (
    <Container size="narrow" className="flex flex-1 items-center py-16">
      <RestoreForm />
    </Container>
  );
}
