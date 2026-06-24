"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { useMyInterests } from "@/features/interests/use-interests";
import { InterestPicker } from "@/components/interests/interest-picker";
import { SuggestedInterestsList } from "@/components/interests/suggested-interests-list";
import { Skeleton } from "@/components/ui/skeleton";

/** Edit-mode for /me/interests: pre-selects the user's current interests, saves changes. */
export function InterestsEditor() {
  const t = useTranslations("Onboarding");
  const { data, isPending, isError } = useMyInterests();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("editTitle")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("editSubtitle")}
        </p>
      </header>

      {/* Implicit-learning candidates — self-hides when there are none. */}
      <SuggestedInterestsList />

      {saved ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t("savedHint")}
        </p>
      ) : null}

      {isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : (
        (() => {
          const selectedIds = data
            .map((i) => i.interestId)
            .filter((id): id is number => id != null);
          return (
            <InterestPicker
              // Re-init the picker's selection when the current set loads/changes.
              key={selectedIds.join(",")}
              initialSelected={selectedIds}
              onSaved={() => setSaved(true)}
              saveLabel={t("save")}
            />
          );
        })()
      )}
    </div>
  );
}
