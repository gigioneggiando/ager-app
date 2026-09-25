import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Primitives for the `/beta` funnel, expressed in the coordinates of the
 * 402x874 Figma frame. The whole frame is scaled as one (see `.beta-stage` in
 * globals.css), so every value here is the design value, unmodified.
 */

/** Absolute box inside the stage. Omit `left` to centre it. */
export function Box({
  left,
  top,
  width,
  height,
  className,
  style,
  children,
}: {
  left?: number;
  top: number;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const centred = left === undefined;

  return (
    <div
      className={cn("absolute", className)}
      style={{
        top,
        // Centred with auto margins, never with a transform: the entrance
        // animation animates transform and would cancel the centring.
        ...(centred
          ? { left: 0, right: 0, marginInline: "auto", width: width ?? "fit-content" }
          : { left, width }),
        height,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 20/24 bold — the screen title. */
export function Title({
  children,
  color = "var(--ager-blue)",
  top,
  size = 20,
}: {
  children: React.ReactNode;
  color?: string;
  top: number;
  /** The closing screen sets its own, larger size. */
  size?: number;
}) {
  return (
    <Box left={30} top={top} width={342}>
      <h1
        className="text-center font-bold"
        style={{ fontSize: size, lineHeight: `${Math.round(size * 1.2)}px`, color }}
      >
        {children}
      </h1>
    </Box>
  );
}

const ctaClasses = cn(
  "inline-flex items-center justify-center rounded-[35px] transition-opacity",
  "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-40"
);

const ctaStyle = {
  padding: "17px 52px",
  backgroundColor: "var(--ager-blue)",
  color: "var(--editorial-white)",
  fontSize: 20,
  lineHeight: "24px",
  whiteSpace: "nowrap",
  "--tw-ring-color": "var(--ager-blue)",
  "--tw-ring-offset-color": "var(--neutral-beige)",
} as React.CSSProperties;

/** The pill button. Its width comes from the label, exactly as in the design. */
export function Cta({
  top,
  children,
  onClick,
  disabled,
}: {
  top: number;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Box top={top}>
      <button type="button" onClick={onClick} disabled={disabled} className={ctaClasses} style={ctaStyle}>
        {children}
      </button>
    </Box>
  );
}

/** Same pill as a link — the last screen leaves the site. */
export function CtaLink({
  top,
  href,
  children,
}: {
  top: number;
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = /^https?:\/\//.test(href);

  return (
    <Box top={top}>
      {isExternal ? (
        <a href={href} rel="noopener" className={ctaClasses} style={ctaStyle}>
          {children}
        </a>
      ) : (
        <Link href={href} className={ctaClasses} style={ctaStyle}>
          {children}
        </Link>
      )}
    </Box>
  );
}
