import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceDetail } from "@ager/api-client";

import { getSource, getSources } from "@/features/sources/api";
import SourcesPage from "./page";
import SourceDetailPage from "./[id]/page";

vi.mock("@/features/sources/api", () => ({
  getSources: vi.fn(),
  getSource: vi.fn(),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockGetSources = vi.mocked(getSources);
const mockGetSource = vi.mocked(getSource);

afterEach(() => vi.clearAllMocks());

describe("SourcesPage (list)", () => {
  it("renders source cards linking to the detail page", async () => {
    mockGetSources.mockResolvedValue([
      { sourceId: 1, name: "ANSA", type: "agenzia", publisherGroupId: 3 },
    ] as SourceDetail[]);

    render(await SourcesPage({ params: Promise.resolve({ locale: "it" }) }));

    expect(screen.getByText("ANSA")).toBeInTheDocument();
    expect(screen.getByText("agenzia")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/sources/1");
  });

  it("shows the empty state with no sources", async () => {
    mockGetSources.mockResolvedValue([]);
    render(await SourcesPage({ params: Promise.resolve({ locale: "it" }) }));
    expect(screen.getByText("emptyTitle")).toBeInTheDocument();
  });
});

describe("SourceDetailPage", () => {
  it("renders the source profile with external links", async () => {
    mockGetSource.mockResolvedValue({
      sourceId: 7,
      name: "ANSA",
      type: "agenzia",
      url: "https://ansa.it",
      tosUrl: "https://ansa.it/tos",
      country: "it",
      lang: "it",
      licensingStatus: "licensed",
      tdmOptoutPresent: false,
    } as SourceDetail);

    render(
      await SourceDetailPage({
        params: Promise.resolve({ locale: "it", id: "7" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "ANSA" }),
    ).toBeInTheDocument();
    const homepage = screen.getByRole("link", { name: /visitHomepage/ });
    expect(homepage).toHaveAttribute("href", "https://ansa.it");
    expect(homepage).toHaveAttribute("target", "_blank");
  });

  it("calls notFound() for a missing source", async () => {
    mockGetSource.mockResolvedValue(null);
    await expect(
      SourceDetailPage({ params: Promise.resolve({ locale: "it", id: "999" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
