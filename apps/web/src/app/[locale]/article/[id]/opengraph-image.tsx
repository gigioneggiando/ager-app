import { getArticle } from "@/features/articles/api";
import { OG_SIZE, renderOgImage } from "@/lib/og";

// Edge runtime: required for `fetch(new URL(..., import.meta.url))` font loading to work
// (the Node runtime can't fetch file: URLs).
export const runtime = "edge";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Ager";

async function loadFonts() {
  const [bold, regular] = await Promise.all([
    fetch(
      new URL(
        "../../../../assets/fonts/merriweather-700.woff",
        import.meta.url,
      ),
    ).then((r) => r.arrayBuffer()),
    fetch(
      new URL(
        "../../../../assets/fonts/merriweather-400.woff",
        import.meta.url,
      ),
    ).then((r) => r.arrayBuffer()),
  ]);
  return { bold, regular };
}

export default async function ArticleOgImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  const fonts = await loadFonts();

  return renderOgImage({
    title: article?.title?.trim() || "Ager",
    eyebrow: article?.sourceName ?? "Ager",
    fonts,
  });
}
