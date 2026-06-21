import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional icon (lucide); rendered in muted gray. */
  icon?: ReactNode;
  /** Optional action (e.g. a Button). */
  action?: ReactNode;
  className?: string;
}

/** Calm, measured empty state — no emoji, no alarm. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground [&_svg]:size-8" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-lg font-bold text-primary">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
