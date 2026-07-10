import { mapToDp, REM_BASE_PX, remToDp, toDp } from "./scale";

describe("rem/px → dp adapter", () => {
  it("uses a 16px rem base", () => {
    expect(REM_BASE_PX).toBe(16);
  });

  it("converts rem strings", () => {
    expect(toDp("1rem")).toBe(16);
    expect(toDp("1.5rem")).toBe(24);
    expect(toDp("0.25rem")).toBe(4);
  });

  it("maps px strings 1:1 to dp", () => {
    expect(toDp("16px")).toBe(16);
    expect(toDp("80px")).toBe(80);
  });

  it("passes numbers and bare numeric strings through", () => {
    expect(toDp(12)).toBe(12);
    expect(toDp("12")).toBe(12);
  });

  it("returns 0 for malformed input instead of NaN", () => {
    expect(toDp("")).toBe(0);
    expect(toDp("not-a-size")).toBe(0);
  });

  it("remToDp multiplies by the rem base", () => {
    expect(remToDp(2)).toBe(32);
  });

  it("maps a whole token record, preserving keys", () => {
    expect(mapToDp({ a: "1rem", b: "8px", c: 2 })).toEqual({
      a: 16,
      b: 8,
      c: 2,
    });
  });
});
