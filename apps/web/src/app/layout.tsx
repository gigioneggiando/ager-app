import type { ReactNode } from "react";

// Root layout. The `<html>`/`<body>` tags live in `[locale]/layout.tsx` because the
// `lang` attribute and i18n provider depend on the active locale segment.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
