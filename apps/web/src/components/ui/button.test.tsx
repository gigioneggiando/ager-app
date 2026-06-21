import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Scopri di più</Button>);
    expect(
      screen.getByRole("button", { name: "Scopri di più" }),
    ).toBeInTheDocument();
  });

  it("applies variant + size classes via cva", () => {
    render(
      <Button variant="outline" size="lg">
        Outline
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Outline" });
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("h-10");
  });

  it("renders as a child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="https://api.agerculture.com">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://api.agerculture.com");
  });
});
