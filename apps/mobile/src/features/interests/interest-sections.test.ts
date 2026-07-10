import type { Interest } from "@ager/api-client";

import {
  buildSections,
  needsOnboarding,
  selectedInterestIds,
  toggleInterest,
} from "./interest-sections";

const catalog: Interest[] = [
  { id: 1, name: "Politica" }, // macro with children
  { id: 2, name: "Interni", parentId: 1 },
  { id: 3, name: "Esteri", parentId: 1 },
  { id: 4, name: "Meteo" }, // childless macro
];

describe("buildSections", () => {
  it("titles macros with children; groups childless macros first (untitled)", () => {
    const sections = buildSections(catalog);
    expect(sections.map((s) => s.title)).toEqual(["", "Politica"]);
    expect(sections[0]?.items.map((i) => i.id)).toEqual([4]);
    expect(sections[1]?.items.map((i) => i.id)).toEqual([2, 3]);
  });
});

describe("needsOnboarding", () => {
  it("is true only when there are no interests", () => {
    expect(needsOnboarding([])).toBe(true);
    expect(needsOnboarding(undefined)).toBe(true);
    expect(needsOnboarding([{ interestId: 1 }])).toBe(false);
  });
});

describe("toggleInterest", () => {
  it("adds then removes without mutating the input", () => {
    const a = new Set<number>([1]);
    const b = toggleInterest(a, 2);
    expect([...b].sort()).toEqual([1, 2]);
    expect([...a]).toEqual([1]); // input untouched
    expect([...toggleInterest(b, 1)]).toEqual([2]);
  });
});

describe("selectedInterestIds", () => {
  it("extracts ids, dropping nullish", () => {
    expect(
      selectedInterestIds([
        { interestId: 1 },
        { slug: "x" },
        { interestId: 3 },
      ]),
    ).toEqual([1, 3]);
    expect(selectedInterestIds(undefined)).toEqual([]);
  });
});
