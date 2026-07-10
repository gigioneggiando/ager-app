import { relativeTime } from "./relative-time";

const NOW = new Date("2026-07-10T12:00:00Z").getTime();
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("relativeTime", () => {
  it("buckets by unit", () => {
    expect(relativeTime(ago(30), NOW)).toEqual({ unit: "now", value: 0 });
    expect(relativeTime(ago(5 * 60), NOW)).toEqual({
      unit: "minutes",
      value: 5,
    });
    expect(relativeTime(ago(3 * 3600), NOW)).toEqual({
      unit: "hours",
      value: 3,
    });
    expect(relativeTime(ago(2 * 86400), NOW)).toEqual({
      unit: "days",
      value: 2,
    });
    expect(relativeTime(ago(3 * 604800), NOW)).toEqual({
      unit: "weeks",
      value: 3,
    });
  });

  it("clamps future timestamps to now", () => {
    expect(relativeTime(new Date(NOW + 10_000).toISOString(), NOW)).toEqual({
      unit: "now",
      value: 0,
    });
  });

  it("returns null for missing or unparseable input", () => {
    expect(relativeTime(null, NOW)).toBeNull();
    expect(relativeTime(undefined, NOW)).toBeNull();
    expect(relativeTime("not-a-date", NOW)).toBeNull();
  });
});
