"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

import { usePersistentState } from "@/lib/use-persistent-state";
import { useSession } from "@/components/auth/auth-provider";
import {
  DEFAULT_FEED_MODE,
  FEED_MODE_STORAGE_KEY,
  isFeedMode,
  type FeedMode,
} from "@/features/feed/modes";
import { FeedModeSelector } from "@/components/feed/feed-mode-selector";
import { FeedList } from "@/components/feed/feed-list";

/**
 * Client feed surface: the ranking-mode selector (persisted in localStorage) + the feed.
 * Anonymous visitors still get a cold-start feed; a note explains that modes personalize
 * once signed in. The chosen mode flows into the feed query key, so switching re-ranks.
 */
export function FeedView() {
  const t = useTranslations("Feed");
  const { isAuthenticated } = useSession();
  const [stored, setStored] = usePersistentState(
    FEED_MODE_STORAGE_KEY,
    DEFAULT_FEED_MODE,
  );
  const mode: FeedMode = isFeedMode(stored) ? stored : DEFAULT_FEED_MODE;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <FeedModeSelector value={mode} onChange={setStored} />
        <p className="text-xs text-muted-foreground">{t(`modes.${mode}.help`)}</p>
      </div>

      {!isAuthenticated ? (
        <p className="flex items-start gap-2 rounded-md bg-neutral-beige px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{t("modeAnonNote")}</span>
        </p>
      ) : null}

      <FeedList mode={mode} />
    </div>
  );
}
