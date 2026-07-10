import type { Notification } from "@ager/api-client";

/**
 * Deep-link routing for notifications (pure). Currently the only push type is the
 * SuggestedInterest nudge → the interests editor (where the suggestions live). Unknown
 * types return null (open the app / inbox, no navigation). Kept loose so the exact backend
 * enum casing doesn't matter.
 */

function isInterestSignal(
  type?: string | null,
  entityType?: string | null,
): boolean {
  const t = (type ?? "").toLowerCase();
  const e = (entityType ?? "").toLowerCase();
  return (
    t.includes("suggest") || t.includes("interest") || e.includes("interest")
  );
}

/** Route for an inbox notification tap, or null if it isn't a navigable type. */
export function routeForNotification(
  notification: Pick<Notification, "type" | "entityType" | "entityId">,
): string | null {
  return isInterestSignal(notification.type, notification.entityType)
    ? "/interests"
    : null;
}

/** Route for a received push's opaque `data` payload ({ type, interestId, … }), or null. */
export function routeForPushData(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const type = typeof data.type === "string" ? data.type : null;
  if (isInterestSignal(type) || data.interestId != null) {
    return "/interests";
  }
  return null;
}
