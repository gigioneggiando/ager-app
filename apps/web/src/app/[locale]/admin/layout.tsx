import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getSession } from "@/lib/server/session";
import { Container } from "@/components/layout/container";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin section gate. Server-side: only `role=admin` sessions may see any /admin route;
 * everyone else gets a 404 (no hint the area exists). The backend independently enforces
 * the admin role on every /api/admin/* call, so this is the UI gate, not the security
 * boundary.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session || session.role !== "admin") {
    notFound();
  }

  return (
    <Container size="default" className="py-8 sm:py-12">
      <div className="flex flex-col gap-6">
        <AdminNav />
        {children}
      </div>
    </Container>
  );
}
