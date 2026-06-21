import { ImageResponse } from "next/og";

import { AGER_SYMBOL_PATH } from "@/components/brand/symbol-path";

/** Standard Open Graph dimensions. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

const AGER_BLUE = "#0F2A44";
const EDITORIAL_WHITE = "#F9FAF7";

export interface OgFonts {
  bold: ArrayBuffer;
  regular: ArrayBuffer;
}

/**
 * Branded Open Graph card: Ager Blue field, Editorial White Merriweather title, the Ager
 * logo (symbol + wordmark) and a source eyebrow. Used by the article + site OG routes.
 */
export function renderOgImage({
  title,
  eyebrow,
  fonts,
}: {
  title: string;
  eyebrow: string;
  fonts: OgFonts;
}): ImageResponse {
  const safeTitle = title.length > 120 ? `${title.slice(0, 117)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: AGER_BLUE,
          color: EDITORIAL_WHITE,
          padding: "80px",
          fontFamily: "Merriweather",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="64" height="64" viewBox="0 0 372 372">
            <path d={AGER_SYMBOL_PATH} fill={EDITORIAL_WHITE} />
          </svg>
          <div style={{ fontSize: 48, fontWeight: 700 }}>Ager</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: "rgba(249, 250, 247, 0.7)",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {safeTitle}
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: "rgba(249, 250, 247, 0.6)",
          }}
        >
          agerculture.com
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Merriweather", data: fonts.bold, weight: 700, style: "normal" },
        {
          name: "Merriweather",
          data: fonts.regular,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
