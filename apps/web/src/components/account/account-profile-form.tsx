"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import type { UserProfile } from "@ager/api-client";

import { useUpdateProfile } from "@/features/account/use-account";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LOCALES = ["it", "en"] as const;

export function AccountProfileForm({ profile }: { profile: UserProfile }) {
  const t = useTranslations("Account");
  const toast = useToast();
  const update = useUpdateProfile();

  const [username, setUsername] = useState(profile.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [locale, setLocale] = useState(profile.locale ?? "it");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    update.mutate(
      {
        username: username.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        locale: locale || undefined,
        timezone: timezone.trim() || undefined,
      },
      {
        onSuccess: () => toast.show({ message: t("profileSaved") }),
        onError: (err) => {
          const code = err instanceof Error ? err.message : "";
          if (code === "username_taken") setError(t("errors.usernameTaken"));
          else if (code === "username_too_long") setError(t("errors.usernameTooLong"));
          else setError(t("errors.saveFailed"));
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* Read-only identity */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{profile.email}</span>
            <Badge variant={profile.role === "admin" ? "primary" : "neutral"}>
              {profile.role}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acc-username" className="text-sm font-medium">
                {t("username")}
              </label>
              <Input
                id="acc-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acc-locale" className="text-sm font-medium">
                {t("language")}
              </label>
              <select
                id="acc-locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {t(`languages.${l}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acc-avatar" className="text-sm font-medium">
                {t("avatarUrl")}
              </label>
              <Input
                id="acc-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                maxLength={255}
                placeholder="https://…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acc-tz" className="text-sm font-medium">
                {t("timezone")}
              </label>
              <Input
                id="acc-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                maxLength={50}
                placeholder="Europe/Rome"
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {t("saveProfile")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
