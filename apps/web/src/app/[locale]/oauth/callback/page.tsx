import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { OAuthCallback } from "@/components/auth/oauth-callback";

export const metadata: Metadata = {
  title: "Google",
  robots: { index: false, follow: false },
};

export default async function OAuthCallbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container size="narrow" className="flex flex-1 items-center py-16">
      <OAuthCallback />
    </Container>
  );
}
