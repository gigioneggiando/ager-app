"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { FEED_MODES, type FeedMode } from "@/features/feed/modes";

/**
 * Ranking-mode control for the feed. A native <select> (most accessible, least code) over
 * the six recommender modes. The label/options are i18n-resolved (`Feed.modes.<id>`).
 */
export function FeedModeSelector({
  value,
  onChange,
}: {
  value: FeedMode;
  onChange: (mode: FeedMode) => void;
}) {
  const t = useTranslations("Feed");

  return (
    <div className="flex items-center gap-2">
      <SlidersHorizontal
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <label htmlFor="feed-mode" className="text-sm font-medium text-foreground">
        {t("modeLabel")}
      </label>
      <div className="relative">
        <select
          id="feed-mode"
          value={value}
          onChange={(e) => onChange(e.target.value as FeedMode)}
          className="appearance-none rounded-md border border-border bg-background py-1.5 pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {FEED_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {t(`modes.${mode}.label`)}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
