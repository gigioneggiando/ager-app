"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "email" | "code" | "done";

/**
 * Account restore within the 30-day grace window. email → restore OTP → restore. The
 * backend revokes all sessions on restore and returns no tokens, so we end on a "now sign
 * in" step rather than an authenticated session.
 */
export function RestoreForm() {
  const t = useTranslations("Restore");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/restore/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (res.ok) {
        setStep("code");
      } else if (res.status === 429) {
        setError(t("errors.rateLimit"));
      } else {
        setError(t("errors.requestFailed"));
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setPending(false);
    }
  }

  async function restore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        setStep("done");
        return;
      }
      if (res.status === 401) setError(t("errors.invalidCode"));
      else if (res.status === 429) setError(t("errors.rateLimit"));
      else setError(t("errors.restoreFailed"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setPending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight">{t("doneTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("doneBody")}</p>
        <Button asChild className="w-full">
          <Link href={`/login?email=${encodeURIComponent(email)}`}>
            {t("goToLogin")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {step === "email" ? t("subtitle") : t("codeSubtitle", { email })}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t("emailLabel")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>
          <Button type="submit" disabled={pending || !email}>
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {t("requestCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={restore} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium">
              {t("codeLabel")}
            </label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("codePlaceholder")}
            />
          </div>
          <Button type="submit" disabled={pending || !code}>
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {t("restore")}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="inline-flex items-center justify-center gap-1 text-sm text-link transition-colors hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("changeEmail")}
          </button>
        </form>
      )}

      <p
        role="alert"
        aria-live="polite"
        className="min-h-5 text-center text-sm text-destructive"
      >
        {error}
      </p>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-link hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
