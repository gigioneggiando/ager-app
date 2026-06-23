"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GOOGLE_OAUTH_CONFIGURED, startGoogleLogin } from "@/lib/google-oauth";

/** Multi-color Google "G" mark (inline SVG — no external script/asset, CSP-safe). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** "Continua con Google" — starts the OAuth redirect flow. Renders nothing if unconfigured. */
export function GoogleButton({ next }: { next: string }) {
  const t = useTranslations("OAuth");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  if (!GOOGLE_OAUTH_CONFIGURED) return null;

  async function onClick() {
    setError(false);
    setPending(true);
    try {
      await startGoogleLogin({ locale, next });
      // On success the browser navigates away; we stay "pending".
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={onClick}
      >
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {t("continueWithGoogle")}
      </Button>
      {error ? (
        <p role="alert" aria-live="polite" className="text-center text-sm text-destructive">
          {t("beginError")}
        </p>
      ) : null}
    </div>
  );
}

/** Visual "oppure" separator between OAuth and the OTP form. */
function AuthDivider() {
  const t = useTranslations("OAuth");
  return (
    <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {t("or")}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * The Google sign-in block (button + "or" divider) for the login/register forms. Renders
 * nothing when Google OAuth is not configured, so the divider never appears alone.
 */
export function GoogleAuthSection({ next }: { next: string }) {
  if (!GOOGLE_OAUTH_CONFIGURED) return null;
  return (
    <>
      <GoogleButton next={next} />
      <AuthDivider />
    </>
  );
}
