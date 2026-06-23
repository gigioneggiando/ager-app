"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/auth/auth-provider";
import { decodeIdTokenEmail, readGoogleCallback } from "@/lib/google-oauth";
import { Button } from "@/components/ui/button";

type Phase = "working" | "error" | "deleted";

/**
 * Handles the Google redirect landing. Reads the id_token from the URL fragment, validates
 * the anti-CSRF `state`, exchanges it for a session via our proxy, then routes onward
 * (onboarding when the account has no interests). A soft-deleted account (403
 * `account_deleted`) is routed to the restore flow instead.
 */
export function OAuthCallback() {
  const t = useTranslations("OAuth");
  const router = useRouter();
  const locale = useLocale();
  const { refresh } = useSession();
  const [phase, setPhase] = useState<Phase>("working");
  const [deletedEmail, setDeletedEmail] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard against StrictMode double-invoke
    started.current = true;

    void (async () => {
      const cb = readGoogleCallback();
      if (cb.error || !cb.idToken || !cb.stateValid) {
        setPhase("error");
        return;
      }

      try {
        const res = await fetch("/api/auth/oauth/google", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken: cb.idToken }),
        });

        if (res.ok) {
          const data = (await res.json().catch(() => null)) as {
            needsOnboarding?: boolean;
          } | null;
          await refresh();
          if (data?.needsOnboarding) {
            router.replace(
              `/${locale}/onboarding?next=${encodeURIComponent(cb.next)}`,
            );
          } else {
            router.replace(cb.next);
          }
          router.refresh();
          return;
        }

        if (res.status === 403) {
          const body = (await res.json().catch(() => null)) as {
            errorCode?: string;
          } | null;
          if (body?.errorCode === "account_deleted") {
            setDeletedEmail(decodeIdTokenEmail(cb.idToken));
            setPhase("deleted");
            return;
          }
        }
        setPhase("error");
      } catch {
        setPhase("error");
      }
    })();
  }, [locale, router, refresh]);

  if (phase === "working") {
    return (
      <div
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 text-center"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t("signingIn")}</p>
      </div>
    );
  }

  if (phase === "deleted") {
    const restoreHref = deletedEmail
      ? `/restore?email=${encodeURIComponent(deletedEmail)}`
      : "/restore";
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t("deletedTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("deletedBody")}</p>
        <Button asChild>
          <Link href={restoreHref}>{t("restoreCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{t("errorTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("errorBody")}</p>
      <Button asChild variant="outline">
        <Link href="/login">{t("backToLogin")}</Link>
      </Button>
    </div>
  );
}
