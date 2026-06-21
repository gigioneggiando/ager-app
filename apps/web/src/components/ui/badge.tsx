import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Soft, low-saturation badges (brand: no high saturation). Green family signals
 * trust/context (verified, contesto, fonti); orange = evolving/sensitive; red = error.
 * `neutral` is the default chip style (topics, categories).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-sans leading-none transition-colors [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-border bg-secondary text-muted-foreground",
        verified: "border-success/30 bg-success/10 text-success",
        context: "border-accent/30 bg-accent/10 text-accent",
        warning: "border-warning/30 bg-warning/10 text-warning",
        error: "border-destructive/30 bg-destructive/10 text-destructive",
        primary: "border-primary/20 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
