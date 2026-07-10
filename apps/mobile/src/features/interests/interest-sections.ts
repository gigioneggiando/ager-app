import type { Interest, MyInterest } from "@ager/api-client";

export interface InterestSection {
  title: string;
  items: Interest[];
}

/**
 * Group the taxonomy for the picker (ported from the web): each macro topic (no parent)
 * with children becomes a titled section of its children; childless macros go into a single
 * untitled section first. Pure.
 */
export function buildSections(interests: Interest[]): InterestSection[] {
  const macros = interests.filter((i) => i.parentId == null);
  const childless: Interest[] = [];
  const sections: InterestSection[] = [];

  for (const macro of macros) {
    const children = interests.filter((i) => i.parentId === macro.id);
    if (children.length > 0) {
      sections.push({ title: macro.name ?? "", items: children });
    } else {
      childless.push(macro);
    }
  }
  if (childless.length > 0) {
    sections.unshift({ title: "", items: childless });
  }
  return sections;
}

/** The M2 onboarding gate: a signed-in user with no interests is a new user → onboard. */
export function needsOnboarding(
  interests: MyInterest[] | undefined | null,
): boolean {
  return !interests || interests.length === 0;
}

/** Toggle an id in a selection set (returns a new Set) — the picker's optimistic add/remove. */
export function toggleInterest(
  selected: ReadonlySet<number>,
  id: number,
): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** The user's current interest ids, for pre-selecting the editor. */
export function selectedInterestIds(mine: MyInterest[] | undefined): number[] {
  return (mine ?? [])
    .map((i) => i.interestId)
    .filter((id): id is number => id != null);
}
