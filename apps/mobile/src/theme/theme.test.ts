import {
  buildTheme,
  fontSizeDp,
  lightTheme,
  radiusDp,
  spacingDp,
} from "./theme";

describe("theme built from @ager/shared tokens", () => {
  it("converts spacing tokens to dp", () => {
    expect(spacingDp.xs).toBe(4); // 0.25rem
    expect(spacingDp.md).toBe(16); // 1rem
    expect(spacingDp.xl).toBe(32); // 2rem
  });

  it("converts radius tokens (rem and px) to dp", () => {
    expect(radiusDp.md).toBe(8); // 0.5rem
    expect(radiusDp.image).toBe(16); // 16px
  });

  it("converts the type scale to dp", () => {
    expect(fontSizeDp.body).toBe(16); // 1rem
  });

  it("uses the brand light palette", () => {
    expect(lightTheme.scheme).toBe("light");
    expect(lightTheme.colors.background).toBe("#F9FAF7"); // editorialWhite
    expect(lightTheme.colors.primary).toBe("#0F2A44"); // agerBlue
  });

  it("honours a dark request now that the dark palette is signed off (M5)", () => {
    const theme = buildTheme("dark");
    expect(theme.scheme).toBe("dark");
    expect(theme.colors.background).toBe("#0D1720");
    expect(theme.colors.background).not.toBe(lightTheme.colors.background);
  });
});
