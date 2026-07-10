/**
 * rem / px → dp adapter.
 *
 * @ager/shared expresses radius, spacing and typography as CSS strings ("1rem", "16px").
 * React Native has no CSS units — every dimension is a unitless density-independent pixel
 * (dp). These pure helpers translate the brand's CSS scale into dp so a single source of
 * truth drives both web and native. 1rem = 16dp (the browser default and the brand's
 * baseline). Kept dependency-free so it is trivially unit-testable.
 */

/** Pixels per rem — the CSS/browser default the brand scale is authored against. */
export const REM_BASE_PX = 16;

/** rem multiplier → dp. e.g. remToDp(1.5) → 24. */
export function remToDp(rem: number): number {
  return rem * REM_BASE_PX;
}

/**
 * Convert a brand token value to dp.
 * - "1.5rem" → 24        (rem × 16)
 * - "16px"   → 16        (px map 1:1 to dp)
 * - 12       → 12        (already unitless — passed through)
 * - "12"     → 12        (bare numeric string — best-effort parse)
 * Unknown/NaN input yields 0 rather than throwing, so a malformed token can't crash a screen.
 */
export function toDp(value: string | number): number {
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed.endsWith("rem")) return remToDp(parseFloat(trimmed));
  if (trimmed.endsWith("px")) return parseFloat(trimmed);
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Map every value of a CSS-string token record to dp, preserving the keys. */
export function mapToDp<K extends string>(
  record: Record<K, string | number>,
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const key of Object.keys(record) as K[]) {
    out[key] = toDp(record[key]);
  }
  return out;
}
