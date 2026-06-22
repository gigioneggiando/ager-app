import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Merriweather } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/server/session";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "../globals.css";

// Sans — UI + body.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Serif — headings + wordmark.
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const siteDescription =
  "Ager — riduce il rumore, aumenta la comprensione. Notizie civiche italiane, prima il link.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Ager",
  title: {
    default: "Ager",
    template: "%s · Ager",
  },
  description: siteDescription,
  alternates: { canonical: "/" },
  appleWebApp: { capable: true, title: "Ager", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "Ager",
    title: "Ager",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ager",
    description: siteDescription,
  },
};

// Brand theme color (ager-blue) for the browser/PWA chrome.
export const viewport: Viewport = {
  themeColor: "#0F2A44",
  colorScheme: "light",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const session = await getSession();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${merriweather.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <AuthProvider initialSession={session}>
            <Providers>
              <ToastProvider>
                <Header />
                <main className="flex flex-1 flex-col">{children}</main>
                <Footer />
                <ServiceWorkerRegister />
              </ToastProvider>
            </Providers>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
