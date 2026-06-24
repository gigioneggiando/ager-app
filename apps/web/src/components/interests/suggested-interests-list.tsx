"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import { useInterests } from "@/features/interests/use-interests";
import { useSuggestedInterests } from "@/features/interests/use-suggested-interests";
import { Card } from "@/components/ui/card";
import {
  SuggestedInterestRow,
  suggestionLabel,
} from "@/components/interests/suggested-interest-row";

/**
 * The suggested-interests surface inside /me/interests. Same candidates as the feed nudge,
 * but always shown here (no weekly throttle — this is the place you go to manage interests).
 * Renders nothing when there are no candidates, so it never clutters the editor.
 */
export function SuggestedInterestsList() {
  const t = useTranslations("Suggested");
  const { data: suggestions } = useSuggestedInterests();
  const { data: interests } = useInterests();

  const items = (suggestions ?? []).filter(
    (s): s is typeof s & { interestId: number } => s.interestId != null,
  );

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t("listTitle")}>
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-4 text-accent" aria-hidden="true" />
          {t("listTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("listSubtitle")}</p>
      </div>

      <Card className="flex flex-col divide-y divide-border p-4">
        {items.map((s) => (
          <div key={s.interestId} className="py-2 first:pt-0 last:pb-0">
            <SuggestedInterestRow
              interestId={s.interestId}
              label={suggestionLabel(interests, s.interestId, s.slug)}
            />
          </div>
        ))}
      </Card>
    </section>
  );
}
