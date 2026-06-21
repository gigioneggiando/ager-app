/** Locale-aware relative time, e.g. "2 ore fa" / "2 hours ago". */
export function formatRelativeTime(iso: string, locale: string): string {
  const date = new Date(iso);
  const ms = date.getTime();
  if (Number.isNaN(ms)) return "";

  const diffSeconds = Math.round((ms - Date.now()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ];

  let value = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(value) < division.amount) {
      return rtf.format(Math.round(value), division.unit);
    }
    value /= division.amount;
  }
  // Fallback (unreachable in practice).
  return rtf.format(Math.round(value), "year");
}

/** Absolute date for the `datetime`/`title` attribute, e.g. "19 giu 2026". */
export function formatAbsoluteDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** A 0–1 score as a whole percentage (clamped). */
export function toPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}
