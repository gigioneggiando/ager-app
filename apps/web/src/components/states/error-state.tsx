import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Optional action (e.g. a "retry" Button). */
  action?: ReactNode;
  className?: string;
}

/**
 * Error state — uses the destructive accent sparingly (left rule + icon), not a loud
 * full-red block. Measured tone, consistent with the brand.
 */
export function ErrorState({
  title,
  description,
  icon,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-destructive [&_svg]:size-8" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-lg font-bold text-destructive">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
