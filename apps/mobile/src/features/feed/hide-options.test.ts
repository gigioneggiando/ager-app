import { resolveMutableTopics } from "@/features/interests/use-interests";

import {
  buildHideOptions,
  commitForOption,
  DISCARD_REASONS,
} from "./hide-options";

describe("resolveMutableTopics", () => {
  const interests = [
    { id: 1, slug: "politica", name: "Politica" },
    { id: 2, slug: "economia", name: "Economia" },
  ];

  it("matches topics by slug or name (case-insensitive) → interestId", () => {
    expect(resolveMutableTopics(["Politica", "economia"], interests)).toEqual([
      { label: "Politica", interestId: 1 },
      { label: "economia", interestId: 2 },
    ]);
  });

  it("drops topics with no matching interest", () => {
    expect(resolveMutableTopics(["Sport"], interests)).toEqual([]);
  });

  it("returns [] when the catalog is unavailable", () => {
    expect(resolveMutableTopics(["Politica"], undefined)).toEqual([]);
  });
});

describe("buildHideOptions", () => {
  it("orders topic mutes, then source mute, then non-redundant reasons", () => {
    const options = buildHideOptions({
      mutableTopics: [{ label: "Politica", interestId: 1 }],
      sourceId: 9,
      sourceName: "Il Post",
    });
    expect(options.map((o) => o.kind)).toEqual([
      "mute-topic",
      "mute-source",
      "reason", // clickbait
      "reason", // read_elsewhere (unwanted_source + not_interesting dropped as redundant)
    ]);
    const reasons = options
      .filter((o) => o.kind === "reason")
      .map((o) => (o as { code: string }).code);
    expect(reasons).toEqual(["clickbait", "read_elsewhere"]);
  });

  it("keeps all reasons when no mutes are available", () => {
    const options = buildHideOptions({ mutableTopics: [], sourceId: null });
    expect(options).toHaveLength(DISCARD_REASONS.length);
    expect(options.every((o) => o.kind === "reason")).toBe(true);
  });
});

describe("commitForOption", () => {
  it("maps each option to its backend action", () => {
    expect(commitForOption(null)).toEqual({
      type: "discard",
      reason: undefined,
    });
    expect(
      commitForOption({ kind: "reason", code: "clickbait", labelKey: "x" }),
    ).toEqual({
      type: "discard",
      reason: "clickbait",
    });
    expect(
      commitForOption({ kind: "mute-topic", interestId: 7, topic: "t" }),
    ).toEqual({
      type: "mute-interest",
      interestId: 7,
    });
    expect(
      commitForOption({ kind: "mute-source", sourceId: 3, source: "s" }),
    ).toEqual({
      type: "mute-source",
      sourceId: 3,
    });
  });
});
