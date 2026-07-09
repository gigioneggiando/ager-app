import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FeedItem } from "@ager/api-client";

import { renderWithProviders } from "@/test/test-utils";
import { FeedCard, FeedCardSkeleton } from "./feed-card";

const baseItem: FeedItem = {
  articleId: 1,
  title: "La nuova legge sull'acqua",
  url: "https://example.com/articolo",
  excerpt: "Cosa cambia per i comuni e perché conta.",
  imageUrl: "https://picsum.photos/seed/test/640/360",
  publishedAt: "2026-06-19T08:30:00Z",
  sourceName: "ANSA",
  sourceType: "agenzia",
  topics: ["Ambiente", "Politica"],
  estimatedReadingMinutes: 6,
  displayMode: "redirect",
  paywallDetected: false,
  score: 0.8,
  scoreBreakdown: {
    recency: 0.9,
    topicMatch: 0.6,
    sourceDiversity: 0.7,
    topicVariety: 0.5,
    clusterProminence: 0.8,
  },
  rank: 1,
};

describe("FeedCard", () => {
  it("opens the publisher url in a new tab from the headline", () => {
    renderWithProviders(<FeedCard item={baseItem} />);
    const titleLink = screen.getByRole("link", { name: /nuova legge/i });
    expect(titleLink).toHaveAttribute("href", "https://example.com/articolo");
    expect(titleLink).toHaveAttribute("target", "_blank");
    expect(titleLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener"),
    );
  });

  it("renders source, type, topics, excerpt and the why affordance", () => {
    renderWithProviders(<FeedCard item={baseItem} />);
    expect(screen.getByText("ANSA")).toBeInTheDocument();
    expect(screen.getByText(/agenzia/)).toBeInTheDocument();
    expect(screen.getByText("Ambiente")).toBeInTheDocument();
    expect(screen.getByText("Politica")).toBeInTheDocument();
    expect(
      screen.getByText("Cosa cambia per i comuni e perché conta."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Perché lo vedo/i }),
    ).toBeInTheDocument();
  });

  it("does not show a reading-time estimate (link-first: no stored body)", () => {
    renderWithProviders(<FeedCard item={baseItem} />);
    expect(screen.queryByText(/min di lettura/i)).not.toBeInTheDocument();
  });

  it("is link-first: no article body beyond the excerpt (collapsed)", () => {
    renderWithProviders(<FeedCard item={baseItem} />);
    expect(document.querySelectorAll("p")).toHaveLength(1);
  });

  it("falls back to the brand placeholder when imageUrl is null", () => {
    renderWithProviders(
      <FeedCard item={{ ...baseItem, imageUrl: null }} />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // The placeholder renders the inline Ager symbol (decorative svg).
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the title fallback when title is missing", () => {
    renderWithProviders(
      <FeedCard item={{ ...baseItem, title: null }} />,
    );
    expect(screen.getByText("Senza titolo")).toBeInTheDocument();
  });

  it("skeleton renders pulse placeholders", () => {
    const { container } = renderWithProviders(<FeedCardSkeleton />);
    expect(
      container.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  });
});
