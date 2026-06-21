import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSession } from "@/lib/server/session";
import { Container } from "@/components/layout/container";
import { AccountView } from "@/components/auth/account-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function MePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Protected route: redirect to login, preserving the return path.
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent(`/${locale}/me`);
    redirect(`/${locale}/login?next=${next}`);
  }

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <AccountView />
    </Container>
  );
}
