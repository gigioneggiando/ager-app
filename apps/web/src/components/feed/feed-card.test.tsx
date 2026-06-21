import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FeedCard,
  FeedCardSkeleton,
  type FeedCardArticle,
} from "./feed-card";

const article: FeedCardArticle = {
  id: "1",
  title: "La nuova legge sull'acqua",
  source: { name: "ANSA" },
  publishedAt: "2026-06-19T08:30:00Z",
  excerpt: "Cosa cambia per i comuni e perché conta.",
  imageUrl: "https://picsum.photos/seed/test/640/360",
  topics: ["Ambiente", "Politica"],
  readingTimeMinutes: 6,
  href: "https://example.com/articolo",
  why: { score: 0.8 },
};

const labels = {
  why: "Perché lo vedo?",
  readingTime: (m: number) => `${m} min di lettura`,
  openExternal: "Apri sull'editore",
};

describe("FeedCard", () => {
  it("renders the headline as a link that opens the publisher in a new tab", () => {
    render(<FeedCard article={article} labels={labels} />);
    const titleLink = screen.getByRole("link", { name: /nuova legge/i });
    expect(titleLink).toHaveAttribute("href", "https://example.com/articolo");
    expect(titleLink).toHaveAttribute("target", "_blank");
    expect(titleLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows source, topics, excerpt, reading time and the why affordance", () => {
    render(<FeedCard article={article} labels={labels} />);
    expect(screen.getByText("ANSA")).toBeInTheDocument();
    expect(screen.getByText("Ambiente")).toBeInTheDocument();
    expect(screen.getByText("Politica")).toBeInTheDocument();
    expect(
      screen.getByText("Cosa cambia per i comuni e perché conta."),
    ).toBeInTheDocument();
    expect(screen.getByText("6 min di lettura")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Perché lo vedo?" }),
    ).toBeInTheDocument();
  });

  it("is link-first: renders no article body beyond the excerpt", () => {
    render(<FeedCard article={article} labels={labels} />);
    // Only the excerpt paragraph should carry article prose.
    const paragraphs = document.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
  });

  it("skeleton renders pulse placeholders", () => {
    const { container } = render(<FeedCardSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });
});
