import Link from "next/link";

// Minimal, locale-agnostic 404 (the apex root redirects to a locale via middleware).
export default function NotFound() {
  return (
    <html lang="it">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "ui-serif, Georgia, serif",
          backgroundColor: "#F9FAF7",
          color: "#1C1C1C",
        }}
      >
        <h1 style={{ fontSize: "2rem", color: "#0F2A44" }}>Ager</h1>
        <p>404</p>
        <Link href="/it" style={{ color: "#1A5FB4" }}>
          agerculture.com
        </Link>
      </body>
    </html>
  );
}
