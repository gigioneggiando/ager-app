export type RelativeUnit = "now" | "minutes" | "hours" | "days" | "weeks";

export interface RelativeTime {
  unit: RelativeUnit;
  value: number;
}

/**
 * Compact past-relative time as a unit + value (formatted through i18n by the caller). Pure
 * and Intl-free (Hermes Intl support is uneven). Future timestamps and clock skew clamp to
 * "now"; unparseable input returns null.
 */
export function relativeTime(
  iso: string | null | undefined,
  now: number = Date.now(),
): RelativeTime | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return { unit: "now", value: 0 };
  if (seconds < 3600)
    return { unit: "minutes", value: Math.floor(seconds / 60) };
  if (seconds < 86400)
    return { unit: "hours", value: Math.floor(seconds / 3600) };
  if (seconds < 604800)
    return { unit: "days", value: Math.floor(seconds / 86400) };
  return { unit: "weeks", value: Math.floor(seconds / 604800) };
}
