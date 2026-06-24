import { cn } from "@/lib/utils";
import { AgerSymbol } from "./ager-symbol";

type LogoVariant = "full" | "symbol";

interface LogoProps {
  /** "full" = symbol + Merriweather wordmark; "symbol" = mark only. */
  variant?: LogoVariant;
  /** Symbol height in px. Brand minimums: full lockup >= 120px wide, icon >= 32px. */
  height?: number;
  className?: string;
  /** Accessible label for the logo link/region. */
  title?: string;
}

/**
 * AGER logo. Inherits `currentColor` (set text-primary for ager-blue on light surfaces,
 * text-editorial-white on blue surfaces). The wordmark is ALWAYS Merriweather — never
 * substitute the font, recolor outside the palette, rotate, deform, or add effects.
 */
export function Logo({
  variant = "full",
  height = variant === "symbol" ? 32 : 36,
  className,
  title = "Ager",
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-primary",
        variant === "full" && "gap-2.5",
        className,
      )}
      role="img"
      aria-label={title}
    >
      <AgerSymbol style={{ height, width: height }} className="shrink-0" />
      {variant === "full" ? (
        <span
          className="font-serif font-bold leading-none tracking-tight"
          style={{ fontSize: Math.round(height * 0.98) }}
        >
          Ager
        </span>
      ) : null}
    </span>
  );
}
