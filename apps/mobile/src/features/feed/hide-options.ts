import type { MutableTopic } from "@/features/interests/use-interests";

/**
 * Optional §11.2 DISCARD reasons (skippable). `code` is the wire value sent as `reason`; the
 * backend normalises + routes the penalty: clickbait / unwanted_source → source,
 * read_elsewhere → cluster, not_interesting (and "no reason") → topic. Ported from the web
 * feed-card-actions — keep in sync.
 */
export const DISCARD_REASONS = [
  { code: "clickbait", labelKey: "reasonClickbait" },
  { code: "unwanted_source", labelKey: "reasonUnwantedSource" },
  { code: "not_interesting", labelKey: "reasonNotInteresting" },
  { code: "read_elsewhere", labelKey: "reasonReadElsewhere" },
] as const;

/** A choice offered in the Hide sheet: escalate to a feed-wide mute, or tag the DISCARD. */
export type HideOption =
  | { kind: "mute-topic"; interestId: number; topic: string }
  | { kind: "mute-source"; sourceId: number; source: string }
  | { kind: "reason"; code: string; labelKey: string };

/**
 * Build the Hide sheet's options (mirrors the web's chip order + de-duplication): mutable
 * topics first, then the source mute, then the generic reasons — minus any reason a
 * topic/source mute already expresses (no redundant pair).
 */
export function buildHideOptions(input: {
  mutableTopics: MutableTopic[];
  sourceId?: number | null;
  sourceName?: string | null;
}): HideOption[] {
  const { mutableTopics, sourceId, sourceName } = input;
  const hasTopicMute = mutableTopics.length > 0;
  const hasSourceMute = sourceId != null;

  return [
    ...mutableTopics.map(
      (tp): HideOption => ({
        kind: "mute-topic",
        interestId: tp.interestId,
        topic: tp.label,
      }),
    ),
    ...(hasSourceMute
      ? [
          {
            kind: "mute-source",
            sourceId,
            source: sourceName?.trim() ?? "",
          } satisfies HideOption,
        ]
      : []),
    ...DISCARD_REASONS.filter(
      (r) =>
        !(hasSourceMute && r.code === "unwanted_source") &&
        !(hasTopicMute && r.code === "not_interesting"),
    ).map(
      (r): HideOption => ({
        kind: "reason",
        code: r.code,
        labelKey: r.labelKey,
      }),
    ),
  ];
}

/** What to commit when the user resolves the Hide sheet (null = dismissed → plain DISCARD). */
export type HideCommit =
  | { type: "discard"; reason?: string }
  | { type: "mute-interest"; interestId: number }
  | { type: "mute-source"; sourceId: number };

export function commitForOption(option: HideOption | null): HideCommit {
  if (!option || option.kind === "reason") {
    return { type: "discard", reason: option?.code };
  }
  if (option.kind === "mute-topic") {
    return { type: "mute-interest", interestId: option.interestId };
  }
  return { type: "mute-source", sourceId: option.sourceId };
}
