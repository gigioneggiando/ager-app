"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";

import { usePersistentState } from "@/lib/use-persistent-state";
import { useInterests } from "@/features/interests/use-interests";
import { useSuggestedInterests } from "@/features/interests/use-suggested-interests";
import { Card } from "@/components/ui/card";
import {
  SuggestedInterestRow,
  suggestionLabel,
} from "@/components/interests/suggested-interest-row";

/** Suppress the nudge for a week after it is skipped (the §13.3 "max once/week" throttle). */
const SNOOZE_KEY = "ager:suggested-interests:snoozed-until";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Keep the surface light — show at most a handful at a time. */
const MAX_SHOWN = 3;

/**
 * The proactive "vuoi allargare il feed?" nudge above the feed (Recommender §13.3). Shows the
 * implicit-learning candidates as a DISMISSIBLE banner with per-suggestion Conferma / Ignora.
 * Non-paternalistic and never forced: anonymous visitors and users with no candidates see
 * nothing, and "Non ora" snoozes the whole surface for a week (localStorage client throttle).
 *
 * The query itself is authed-gated in useSuggestedInterests, so this renders null for anon.
 */
export function SuggestedInterestsNudge() {
  const t = useTranslations("Suggested");
  const { data: suggestions } = useSuggestedInterests();
  const { data: interests } = useInterests();
  const [snoozedUntil, setSnoozedUntil] = usePersistentState(SNOOZE_KEY, "0");
  // Capture the mount time once (lazy init) — reading Date.now() during render is impure.
  const [mountedAt] = useState(() => Date.now());

  const items = (suggestions ?? []).filter(
    (s): s is typeof s & { interestId: number } => s.interestId != null,
  );

  // Nothing to nudge, or the user snoozed the surface within the last week.
  if (items.length === 0) return null;
  if (Number(snoozedUntil) > mountedAt) return null;

  const shown = items.slice(0, MAX_SHOWN);

  return (
    <Card
      className="flex flex-col gap-4 border-accent/30 bg-accent/5 p-5"
      role="region"
      aria-label={t("title")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Sparkles className="size-4 text-accent" aria-hidden="true" />
            {t("title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setSnoozedUntil(String(Date.now() + WEEK_MS))}
          aria-label={t("skip")}
          title={t("skip")}
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {shown.map((s) => (
          <li key={s.interestId} className="py-2 first:pt-0 last:pb-0">
            <SuggestedInterestRow
              interestId={s.interestId}
              label={suggestionLabel(interests, s.interestId, s.slug)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
