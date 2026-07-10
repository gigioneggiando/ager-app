"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";

const OPTIONS = [
  { value: "system", labelKey: "system", Icon: Monitor },
  { value: "light", labelKey: "light", Icon: Sun },
  { value: "dark", labelKey: "dark", Icon: Moon },
] as const;

/**
 * Compact light / dark / system control. A single-choice segmented control (radiogroup):
 * each segment is an icon button that names itself for assistive tech. `useIsClient` gates
 * the pressed/selected state so SSR and first paint match (next-themes only knows the real
 * theme on the client) — before mount every segment renders unselected, no hydration flash.
 */
export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const active = isClient ? (theme ?? "system") : null;

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
    >
      {OPTIONS.map(({ value, labelKey, Icon }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "bg-secondary text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
