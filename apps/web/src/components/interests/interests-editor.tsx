"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { InterestPicker } from "@/components/interests/interest-picker";

/** Edit-mode wrapper for /me/interests: shows a confirmation after saving. */
export function InterestsEditor() {
  const t = useTranslations("Onboarding");
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("editTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("editSubtitle")}
        </p>
      </header>

      {saved ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t("saved")}
        </p>
      ) : null}

      <InterestPicker
        onSaved={() => setSaved(true)}
        saveLabel={t("save")}
      />
    </div>
  );
}
