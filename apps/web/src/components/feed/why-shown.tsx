"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FeedScoreBreakdown } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { toPercent } from "@/lib/format";

const DIMENSIONS = [
  "recency",
  "topicMatch",
  "sourceDiversity",
  "topicVariety",
  "clusterProminence",
] as const;

type Dimension = (typeof DIMENSIONS)[number];

interface WhyShownProps {
  score?: number;
  breakdown?: FeedScoreBreakdown;
  feedMode?: string | null;
  recommenderVersion?: string | null;
}

/**
 * Transparency affordance ("Perché lo vedo?"). Expands to explain, in plain language,
 * why an item is ranked: the score breakdown (0–1 → bars) plus feed mode and recommender
 * version. Read-only — no personalization controls (that's PR4/PR5).
 */
export function WhyShown({
  score,
  breakdown,
  feedMode,
  recommenderVersion,
}: WhyShownProps) {
  const t = useTranslations("Feed.why");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 rounded font-medium text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
        {t("trigger")}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="mt-2 flex flex-col gap-3 rounded-md border border-border bg-muted/50 p-3"
        >
          <p className="text-muted-foreground">{t("intro")}</p>

          {breakdown ? (
            <ul className="flex flex-col gap-2">
              {DIMENSIONS.map((dim: Dimension) => {
                const pct = toPercent(breakdown[dim] ?? 0);
                return (
                  <li key={dim} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {t(`dimensions.${dim}.label`)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                      role="meter"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t(`dimensions.${dim}.label`)}
                    >
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">
                      {t(`dimensions.${dim}.help`)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <dl className="flex flex-col gap-1 border-t border-border pt-2 text-muted-foreground">
            {typeof score === "number" ? (
              <div className="flex justify-between gap-2">
                <dt>{t("score")}</dt>
                <dd className="tabular-nums text-foreground">
                  {toPercent(score)}%
                </dd>
              </div>
            ) : null}
            {feedMode ? (
              <div className="flex justify-between gap-2">
                <dt>{t("feedMode")}</dt>
                <dd className="text-foreground">{feedMode}</dd>
              </div>
            ) : null}
            {recommenderVersion ? (
              <div className="flex justify-between gap-2">
                <dt>{t("version")}</dt>
                <dd className="font-mono text-foreground">
                  {recommenderVersion}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
