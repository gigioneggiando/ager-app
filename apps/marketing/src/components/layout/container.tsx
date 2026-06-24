import { cn } from "@/lib/utils";

/**
 * Centered content container with the responsive horizontal gutter used across the site.
 * Default max width suits an editorial measure; pass `size` to widen or narrow.
 */
export function Container({
  className,
  size = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "default" | "wide" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-2xl",
        size === "default" && "max-w-5xl",
        size === "wide" && "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}
