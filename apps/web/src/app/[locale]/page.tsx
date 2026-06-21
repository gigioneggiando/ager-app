import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  return (
    <Container size="default" className="flex flex-1 flex-col justify-center py-20">
      <div className="flex max-w-2xl flex-col gap-6">
        <Badge variant="context" className="w-fit">
          {t("badge")}
        </Badge>

        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t("title")}
        </h1>

        <p className="text-lg leading-relaxed text-foreground/90">
          {t("description")}
        </p>

        <p className="text-sm italic text-muted-foreground">{t("claim")}</p>

        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/styleguide">
              {t("cta")}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t("scaffoldNote")}</p>
      </div>
    </Container>
  );
}
