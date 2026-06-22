import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article } from "@ager/api-client";

import { renderWithProviders } from "@/test/test-utils";
import { getArticle } from "@/features/articles/api";
import ArticlePage from "./page";

vi.mock("@/features/articles/api", () => ({ getArticle: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  usePathname: () => "/it/article/1",
}));

const mockGetArticle = vi.mocked(getArticle);

const fullArticle: Article = {
  articleId: 1,
  title: "La nuova legge sull'acqua",
  url: "https://publisher.example/acqua",
  canonicalUrl: "https://publisher.example/acqua",
  excerpt: "Cosa cambia per i comuni.",
  imageUrl: "https://picsum.photos/seed/a/640/360",
  author: "Mario Rossi",
  publishedAt: "2026-06-19T08:30:00Z",
  sourceName: "ANSA",
  sourceType: "agenzia",
  topics: ["Politica"],
  estimatedReadingMinutes: 5,
  licenseType: "CC-BY",
  paywallDetected: true,
  score: 0.8,
  rank: 1,
};

function params(id = "1") {
  return { params: Promise.resolve({ locale: "it", id }) };
}

afterEach(() => vi.clearAllMocks());

describe("ArticlePage", () => {
  it("renders metadata and a link-first CTA to the publisher", async () => {
    mockGetArticle.mockResolvedValue(fullArticle);
    renderWithProviders(await ArticlePage(params()));

    expect(
      screen.getByRole("heading", { name: "La nuova legge sull'acqua" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ANSA")).toBeInTheDocument();
    expect(screen.getByText("Politica")).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /readOnPublisher/ });
    expect(cta).toHaveAttribute("href", "https://publisher.example/acqua");
    expect(cta).toHaveAttribute("target", "_blank");
  });

  it("renders defensively with null fields (placeholder, no image, untitled)", async () => {
    mockGetArticle.mockResolvedValue({
      articleId: 2,
      title: null,
      url: null,
      excerpt: null,
      imageUrl: null,
      sourceName: null,
      topics: null,
      paywallDetected: false,
    } as Article);

    renderWithProviders(await ArticlePage(params("2")));

    expect(screen.getByRole("heading", { name: "untitled" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("calls notFound() for a missing article", async () => {
    mockGetArticle.mockResolvedValue(null);
    await expect(ArticlePage(params("999"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
