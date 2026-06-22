"use client";

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the whole
 * document, so it renders its own <html>/<body> and cannot rely on the i18n provider or
 * global CSS — text is Italian (the default locale) with inline brand styling.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#F9FAF7",
          color: "#1C1C1C",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0, color: "#0F2A44" }}>
          Qualcosa è andato storto
        </h1>
        <p style={{ maxWidth: "28rem", color: "#6B7280" }}>
          Si è verificato un errore imprevisto. Riprova tra poco.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: "none",
            borderRadius: "0.5rem",
            background: "#0F2A44",
            color: "#F9FAF7",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Riprova
        </button>
      </body>
    </html>
  );
}
