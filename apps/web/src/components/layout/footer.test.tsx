import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { Footer } from "./footer";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("links to the DSA contact and AgerBot legal pages", () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole("link", { name: "Contatto DSA" })).toHaveAttribute(
      "href",
      "/dsa-contact",
    );
    expect(screen.getByRole("link", { name: "AgerBot" })).toHaveAttribute(
      "href",
      "/bot",
    );
  });
});
