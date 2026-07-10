import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { ThemeToggle } from "./theme-toggle";

const setTheme = vi.fn();
let currentTheme = "system";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: currentTheme, setTheme }),
}));

beforeEach(() => {
  setTheme.mockClear();
  currentTheme = "system";
});

describe("ThemeToggle", () => {
  it("exposes a labelled radiogroup with light / dark / system options", () => {
    renderWithProviders(<ThemeToggle />);

    expect(
      screen.getByRole("radiogroup", { name: /tema/i }),
    ).toBeInTheDocument();
    for (const name of [/sistema/i, /chiaro/i, /scuro/i]) {
      expect(screen.getByRole("radio", { name })).toBeInTheDocument();
    }
  });

  it("sets the chosen theme on click", () => {
    renderWithProviders(<ThemeToggle />);

    fireEvent.click(screen.getByRole("radio", { name: /scuro/i }));
    expect(setTheme).toHaveBeenCalledWith("dark");

    fireEvent.click(screen.getByRole("radio", { name: /chiaro/i }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("marks the active theme as checked", () => {
    currentTheme = "dark";
    renderWithProviders(<ThemeToggle />);

    expect(screen.getByRole("radio", { name: /scuro/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /chiaro/i })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /sistema/i })).not.toBeChecked();
  });
});
