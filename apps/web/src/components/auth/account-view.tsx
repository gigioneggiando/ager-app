"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import type { UserProfile } from "@ager/api-client";

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
    </div>
  );
}
