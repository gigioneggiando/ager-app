import { OG_SIZE, renderOgImage } from "@/lib/og";

// Edge runtime: required for `fetch(new URL(..., import.meta.url))` font loading.
export const runtime = "edge";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Ager — riduce il rumore, aumenta la comprensione";

async function loadFonts() {
  const [bold, regular] = await Promise.all([
    fetch(
      new URL("../../assets/fonts/merriweather-700.woff", import.meta.url),
    ).then((r) => r.arrayBuffer()),
    fetch(
      new URL("../../assets/fonts/merriweather-400.woff", import.meta.url),
    ).then((r) => r.arrayBuffer()),
  ]);
  return { bold, regular };
}

export default async function SiteOgImage() {
  const fonts = await loadFonts();
  return renderOgImage({
    title: "Notizie civiche, prima il link.",
    eyebrow: "Ager",
    fonts,
  });
}
