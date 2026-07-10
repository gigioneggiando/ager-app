import { exportFileName } from "@/features/account/use-account";

import {
  DEFAULT_STATS_WINDOW,
  isStatsWindow,
  STATS_WINDOWS,
  toPercent,
} from "./use-stats";

// jest hoists jest.mock above imports, so these are stubbed before load.
jest.mock("@/lib/api/client", () => ({ apiClient: { GET: jest.fn() } }));
jest.mock("expo-file-system/legacy", () => ({ cacheDirectory: "" }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: async () => false }));

describe("stats windows", () => {
  it("offers 7d/14d/30d, defaulting to 30d", () => {
    expect(STATS_WINDOWS).toEqual(["7d", "14d", "30d"]);
    expect(DEFAULT_STATS_WINDOW).toBe("30d");
  });

  it("isStatsWindow narrows valid windows", () => {
    expect(isStatsWindow("7d")).toBe(true);
    expect(isStatsWindow("90d")).toBe(false);
  });

  it("toPercent clamps a 0–1 ratio to 0–100", () => {
    expect(toPercent(0.42)).toBe(42);
    expect(toPercent(undefined)).toBe(0);
    expect(toPercent(1.5)).toBe(100);
  });
});

describe("exportFileName", () => {
  it("is a dated .json name", () => {
    expect(exportFileName("2026-07-10T12:00:00.000Z")).toBe(
      "ager-export-2026-07-10.json",
    );
  });
});
