/**
 * The six recommender feed modes the backend accepts via `?mode=` (ported from the web
 * `features/feed/modes.ts` — keep in sync). `balanced` is the default (sending no mode is
 * equivalent). Labels/help resolve through i18n (`Feed.modes.<id>`); this list fixes the
 * set + order.
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

export function isFeedMode(value: string): value is FeedMode {
  return (FEED_MODES as readonly string[]).includes(value);
}
