import type { MetadataRoute } from "next";

/**
 * PWA web app manifest (served at /manifest.webmanifest; Next links it automatically).
 * Colors are brand tokens — theme = ager-blue, background = editorial-white. Icons reuse
 * the generated brand tiles (PR1 + the 192 added here); the full-bleed tile keeps the
 * symbol inside the 14% clear space, so it serves as both "any" and "maskable".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ager — notizie civiche",
    short_name: "Ager",
    description:
      "Ager — riduce il rumore, aumenta la comprensione. Notizie civiche italiane, prima il link.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "it",
    dir: "ltr",
    theme_color: "#0F2A44",
    background_color: "#F9FAF7",
    icons: [
      {
        src: "/brand/ager-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/ager-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/ager-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
