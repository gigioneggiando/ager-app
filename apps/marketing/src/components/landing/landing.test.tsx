import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/test-utils";
import { Hero } from "./hero";
import { Values } from "./values";
import { HowItWorks } from "./how-it-works";
import { CtaSection } from "./cta-section";
import { SiteFooter } from "@/components/layout/site-footer";

const APP_URL = "https://app.agerculture.com";

describe("Hero", () => {
  it("leads with the mission headline and the claim, and links to the app", () => {
    renderWithIntl(<Hero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Riportare la qualità al centro dell'informazione/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Riduce il rumore, aumenta la comprensione/i),
    ).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /Apri Ager/i });
    expect(cta).toHaveAttribute("href", `${APP_URL}/it`);
  });

  it("renders the app link for the active locale", () => {
    renderWithIntl(<Hero />, { locale: "en" });
    expect(screen.getByRole("link", { name: /Apri Ager/i })).toHaveAttribute(
      "href",
      `${APP_URL}/en`,
    );
  });
});

describe("Values", () => {
  it("lists the four brand values", () => {
    renderWithIntl(<Values />);
    for (const v of ["Trasparenza", "Autorevolezza", "Chiarezza", "Curiosità"]) {
      expect(screen.getByRole("heading", { name: v })).toBeInTheDocument();
    }
  });
});

describe("HowItWorks", () => {
  it("explains link-first, visible sources and the why-shown transparency", () => {
    renderWithIntl(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /Prima il link/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Fonti visibili/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Perché lo vedo/i })).toBeInTheDocument();
  });
});

describe("CtaSection", () => {
  it("offers a closing Apri Ager link", () => {
    renderWithIntl(<CtaSection />);
    expect(screen.getByRole("link", { name: /Apri Ager/i })).toHaveAttribute(
      "href",
      `${APP_URL}/it`,
    );
  });
});

describe("SiteFooter", () => {
  it("links DSA-contact, bot policy and about on the app domain", () => {
    renderWithIntl(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: /Collegamenti/i });

    expect(within(nav).getByRole("link", { name: /Chi siamo/i })).toHaveAttribute(
      "href",
      `${APP_URL}/it/chi-siamo`,
    );
    expect(within(nav).getByRole("link", { name: /Contatto DSA/i })).toHaveAttribute(
      "href",
      `${APP_URL}/it/dsa-contact`,
    );
    expect(within(nav).getByRole("link", { name: /AgerBot/i })).toHaveAttribute(
      "href",
      `${APP_URL}/it/bot`,
    );
  });
});
