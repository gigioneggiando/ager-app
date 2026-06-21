import { cn } from "@/lib/utils";
import { AgerSymbol } from "./ager-symbol";

type LogoVariant = "full" | "symbol";

interface LogoProps {
  /** "full" = symbol + Merriweather wordmark; "symbol" = mark only. */
  variant?: LogoVariant;
  /** Symbol height in px. Brand minimums: full lockup >= 120px wide, icon >= 32px. */
  height?: number;
  /**
   * Render the brand clear-space (14% of the symbol) as padding around the logo.
   * Off by default — layout usually owns spacing.
   */
  clearSpace?: boolean;
  className?: string;
  /** Accessible label for the logo link/region. */
  title?: string;
}

const CLEAR_SPACE_RATIO = 0.14;

/**
 * AGER logo. Inherits `currentColor` (set text-primary for ager-blue on light
 * surfaces, text-editorial-white on blue surfaces). The wordmark is ALWAYS
 * Merriweather — never substitute the font, recolor outside the palette, rotate,
 * deform, or add shadows/effects.
 */
export function Logo({
  variant = "full",
  height = variant === "symbol" ? 32 : 36,
  clearSpace = false,
  className,
  title = "Ager",
}: LogoProps) {
  const pad = clearSpace ? Math.round(height * CLEAR_SPACE_RATIO) : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center text-primary",
        variant === "full" && "gap-2.5",
        className,
      )}
      style={{ padding: pad }}
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
