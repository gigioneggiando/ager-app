"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "details" | "code";

/** Sanitize the post-signup redirect: only allow same-origin app paths. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function RegisterForm() {
  const t = useTranslations("Register");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { refresh } = useSession();

  const next = safeNext(searchParams.get("next"));
  const [step, setStep] = useState<Step>("details");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  // Anti-bot honeypot — hidden from humans; a non-empty value gets the request rejected.
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // hCaptcha is config-gated server-side (currently disabled → any/empty token passes). When
  // the owner enables it, render the widget and set this from its token (also needs CSP
  // exceptions for the hCaptcha script/frame). Plumbed through the proxy already.
  const captchaToken: string | undefined = undefined;

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAlreadyRegistered(false);
    setPending(true);
    try {
      const res = await fetch("/api/auth/register/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, honeypot, captchaToken }),
      });
      if (res.ok) {
        setStep("code");
      } else if (res.status === 409) {
        setAlreadyRegistered(true);
        setError(t("errors.alreadyRegistered"));
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

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, code }),
      });
      if (res.ok) {
        await refresh();
        // Brand-new account → straight to interest onboarding.
        router.replace(`/${locale}/onboarding?next=${encodeURIComponent(next)}`);
        router.refresh();
        return;
      }
      if (res.status === 409) {
        setAlreadyRegistered(true);
        setError(t("errors.alreadyRegistered"));
      } else if (res.status === 400 || res.status === 401) {
        setError(t("errors.invalidCode"));
      } else if (res.status === 429) {
        setError(t("errors.rateLimit"));
      } else {
        setError(t("errors.verifyFailed"));
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {step === "details" ? t("subtitle") : t("codeSubtitle", { email })}
        </p>
      </div>

      {step === "details" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              {t("usernameLabel")}
            </label>
            <Input
              id="username"
              autoComplete="username"
              required
              autoFocus
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("usernamePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t("emailLabel")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>

          {/* Honeypot — visually hidden, off the a11y tree + tab order. Bots fill it; humans don't. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={pending || !username || !email}>
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {t("requestCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-4" noValidate>
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
            {t("verify")}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setCode("");
              setError(null);
            }}
            className="inline-flex items-center justify-center gap-1 text-sm text-link transition-colors hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("changeDetails")}
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
        {alreadyRegistered ? (
          <Link href="/login" className="font-medium text-link hover:underline">
            {t("goToLogin")}
          </Link>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-medium text-link hover:underline">
              {t("signIn")}
            </Link>
          </>
        )}
      </p>

      <p className="text-center text-xs text-muted-foreground">{t("privacyNote")}</p>
    </div>
  );
}
