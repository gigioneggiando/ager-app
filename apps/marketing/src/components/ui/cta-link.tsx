import type { AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";
type Size = "default" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  // Primary CTA — ager-blue.
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  // Quiet outline on the warm surfaces.
  secondary:
    "border border-input bg-background text-foreground hover:bg-secondary hover:text-secondary-foreground",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 text-sm",
  lg: "h-12 px-7 text-base",
};

/**
 * A branded call-to-action anchor. Used for cross-site links (the app on
 * app.agerculture.com) and same-page anchors; for locale navigation use the next-intl
 * <Link> instead.
 */
export function CtaLink({
  variant = "primary",
  size = "default",
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </a>
  );
}
