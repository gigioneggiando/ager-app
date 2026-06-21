import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { FeedScoreBreakdown } from "@ager/api-client";

import { renderWithProviders } from "@/test/test-utils";
import { WhyShown } from "./why-shown";

const breakdown: FeedScoreBreakdown = {
  recency: 0.9,
  topicMatch: 0.6,
  sourceDiversity: 0.7,
  topicVariety: 0.5,
  clusterProminence: 0.8,
};

describe("WhyShown", () => {
  it("is collapsed by default and expands on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <WhyShown
        score={0.82}
        breakdown={breakdown}
        feedMode="cold_start"
        recommenderVersion="v1.0.0"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Perché lo vedo/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Attualità")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // All five breakdown dimensions are explained.
    expect(screen.getByText("Attualità")).toBeInTheDocument();
    expect(screen.getByText("Affinità tematica")).toBeInTheDocument();
    expect(screen.getByText("Diversità delle fonti")).toBeInTheDocument();
    expect(screen.getByText("Varietà dei temi")).toBeInTheDocument();
    expect(screen.getByText("Rilevanza della notizia")).toBeInTheDocument();
    // Values shown readably as percentages + feed mode + version.
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("cold_start")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });
});
