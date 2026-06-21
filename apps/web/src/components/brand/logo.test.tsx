import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "./logo";

describe("Logo", () => {
  it("renders the Merriweather wordmark in the full variant", () => {
    render(<Logo />);
    const logo = screen.getByRole("img", { name: "Ager" });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("Ager");
  });

  it("omits the wordmark in the symbol variant", () => {
    render(<Logo variant="symbol" />);
    const logo = screen.getByRole("img", { name: "Ager" });
    expect(logo).not.toHaveTextContent("Ager");
  });

  it("applies clear-space padding when requested", () => {
    render(<Logo height={100} clearSpace />);
    const logo = screen.getByRole("img", { name: "Ager" });
    // 14% of 100px = 14px on every side.
    expect(logo).toHaveStyle({ padding: "14px" });
  });
});
