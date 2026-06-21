import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its children with the default neutral variant", () => {
    render(<Badge>Economia</Badge>);
    const badge = screen.getByText("Economia");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-muted-foreground");
  });

  it("maps verified/context to the green family and error to destructive", () => {
    const { rerender } = render(<Badge variant="verified">Verificato</Badge>);
    expect(screen.getByText("Verificato")).toHaveClass("text-success");

    rerender(<Badge variant="error">Smentito</Badge>);
    expect(screen.getByText("Smentito")).toHaveClass("text-destructive");
  });
});
