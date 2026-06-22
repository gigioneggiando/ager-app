"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { InterestPicker } from "@/components/interests/interest-picker";

function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function OnboardingFlow() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  function finish() {
    router.replace(next);
    router.refresh();
  }

  async function skip() {
    await fetch("/api/me/onboarding/skip", { method: "POST" });
    finish();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>
      <InterestPicker onSaved={finish} onSkip={skip} saveLabel={t("save")} />
    </div>
  );
}
