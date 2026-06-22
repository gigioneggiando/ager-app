"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { BarChart3, Bookmark, ChevronRight, LogOut, Sparkles } from "lucide-react";
import type { UserProfile } from "@ager/api-client";

import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/me", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("profile_unavailable");
  return (await res.json()) as UserProfile;
}

export function AccountView() {
  const t = useTranslations("Account");
  const router = useRouter();
  const { logout } = useSession();

  const { data, isPending, isError } = useQuery({
    queryKey: ["me"],
    queryFn: fetchProfile,
  });

  async function handleLogout() {
    await logout();
    router.refresh();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut aria-hidden="true" />
          {t("signOut")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : isError || !data ? (
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          ) : (
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("username")}</dt>
                <dd className="font-medium">{data.username}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("email")}</dt>
                <dd className="font-medium">{data.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("role")}</dt>
                <dd>
                  <Badge variant={data.role === "admin" ? "primary" : "neutral"}>
                    {data.role}
                  </Badge>
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label={t("manage")}>
        <Link
          href="/me/interests"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-3">
            <Sparkles className="size-5 text-accent" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-medium">{t("interests")}</span>
              <span className="text-xs text-muted-foreground">
                {t("interestsHint")}
              </span>
            </span>
          </span>
          <ChevronRight
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/me/reading-lists"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-3">
            <Bookmark className="size-5 text-accent" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-medium">{t("readingLists")}</span>
              <span className="text-xs text-muted-foreground">
                {t("readingListsHint")}
              </span>
            </span>
          </span>
          <ChevronRight
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/me/stats"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-3">
            <BarChart3 className="size-5 text-accent" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-medium">{t("stats")}</span>
              <span className="text-xs text-muted-foreground">
                {t("statsHint")}
              </span>
            </span>
          </span>
          <ChevronRight
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>
      </nav>
    </div>
  );
}
