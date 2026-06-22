/**
 * The six recommender feed modes the backend accepts via `?mode=`. `balanced` is the
 * default (sending no mode is equivalent). The labels/help are resolved through i18n
 * (`Feed.modes.<id>`); this list just fixes the set and order.
 */
export const FEED_MODES = [
  "balanced",
  "most_recent",
  "more_pluralism",
  "most_personalized",
  "less_personalized",
  "chronological",
] as const;

export type FeedMode = (typeof FEED_MODES)[number];

export const DEFAULT_FEED_MODE: FeedMode = "balanced";

export const FEED_MODE_STORAGE_KEY = "ager:feedMode";

export function isFeedMode(value: string): value is FeedMode {
  return (FEED_MODES as readonly string[]).includes(value);
}
