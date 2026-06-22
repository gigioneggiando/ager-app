"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import type { Interest } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { useInterests, useSaveInterests } from "@/features/interests/use-interests";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Soft minimum (a hint, not enforced). No hard maximum — pick as many as you like.
// The backend rejects an empty set, so save needs at least 1.
const SUGGESTED_MIN = 5;

interface InterestPickerProps {
  /** Called after a successful save. */
  onSaved?: () => void;
  /** Show a "skip" affordance (onboarding only). */
  onSkip?: () => void;
  /** Pre-selected interest ids (edit mode). */
  initialSelected?: number[];
  saveLabel: string;
}

type Section = { title: string; items: Interest[] };

function buildSections(interests: Interest[]): Section[] {
  const macros = interests.filter((i) => i.parentId == null);
  const childless: Interest[] = [];
  const sections: Section[] = [];

  for (const macro of macros) {
    const children = interests.filter((i) => i.parentId === macro.id);
    if (children.length > 0) {
      sections.push({ title: macro.name ?? "", items: children });
    } else {
      childless.push(macro);
    }
  }
  if (childless.length > 0) {
    sections.unshift({ title: "", items: childless });
  }
  return sections;
}

export function InterestPicker({
  onSaved,
  onSkip,
  initialSelected = [],
  saveLabel,
}: InterestPickerProps) {
  const t = useTranslations("Onboarding");
  const { data: interests, isPending, isError } = useInterests();
  const saveInterests = useSaveInterests();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialSelected),
  );

  const sections = useMemo(
    () => (interests ? buildSections(interests) : []),
    [interests],
  );

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id); // no hard maximum
      return next;
    });
  }

  const count = selected.size;
  const canSave = count >= 1 && !saveInterests.isPending;

  function handleSave() {
    if (!canSave) return;
    saveInterests.mutate([...selected], { onSuccess: () => onSaved?.() });
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (isError || !interests) {
    return <p className="text-sm text-muted-foreground">{t("loadError")}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        {sections.map((section, idx) => (
          <section key={section.title || idx} className="flex flex-col gap-3">
            {section.title ? (
              <h2 className="font-serif text-lg font-bold text-primary">
                {section.title}
              </h2>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {section.items.map((interest) => {
                const isSelected = selected.has(interest.id!);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggle(interest.id!)}
                    aria-pressed={isSelected}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-secondary",
                    )}
                  >
                    {isSelected ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : null}
                    {interest.name}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Sticky action bar with the live count. */}
      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {t("selectedCount", { count })}
          {count < SUGGESTED_MIN
            ? ` · ${t("suggestMin", { min: SUGGESTED_MIN })}`
            : ""}
        </p>
        <div className="flex items-center gap-3">
          {onSkip ? (
            <Button variant="ghost" onClick={onSkip}>
              {t("skip")}
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={!canSave}>
            {saveInterests.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {saveLabel}
          </Button>
        </div>
      </div>
      {saveInterests.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("saveError")}
        </p>
      ) : null}
    </div>
  );
}
