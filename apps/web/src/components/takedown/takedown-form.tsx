"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TargetType = "article" | "source";
const ROLES = ["publisher", "author", "third_party", "anonymous"] as const;

export function TakedownForm() {
  const t = useTranslations("Takedown");
  const [targetType, setTargetType] = useState<TargetType>("article");
  const [targetId, setTargetId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("publisher");
  const [reason, setReason] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const idNum = Number(targetId);
  const canSubmit =
    Number.isInteger(idNum) &&
    idNum > 0 &&
    email.trim() !== "" &&
    reason.trim().length >= 10 &&
    !pending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/takedown", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          [targetType === "article" ? "articleId" : "sourceId"]: idNum,
          requesterEmail: email.trim(),
          requesterRole: role,
          reason: reason.trim(),
          honeypot,
        }),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as {
          requestId?: number;
        } | null;
        setSubmittedId(data?.requestId ?? 0);
        return;
      }
      if (res.status === 429) {
        setError(t("errors.rateLimit"));
      } else if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          body?.error === "article_not_found" || body?.error === "source_not_found"
            ? t("errors.targetNotFound")
            : t("errors.submitFailed"),
        );
      } else {
        setError(t("errors.submitFailed"));
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setPending(false);
    }
  }

  if (submittedId !== null) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{t("sentTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {submittedId > 0 ? t("sentWithId", { id: submittedId }) : t("sentDescription")}
        </p>
        <Button asChild variant="outline">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("targetLabel")}</legend>
          <div className="flex gap-4">
            {(["article", "source"] as TargetType[]).map((tt) => (
              <label key={tt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="target-type"
                  checked={targetType === tt}
                  onChange={() => setTargetType(tt)}
                  className="accent-primary"
                />
                {t(`targetType.${tt}`)}
              </label>
            ))}
          </div>
          <Input
            id="target-id"
            inputMode="numeric"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder={t("targetIdPlaceholder")}
            aria-label={t("targetIdLabel")}
            required
          />
          <p className="text-xs text-muted-foreground">{t("targetHint")}</p>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reporter-email" className="text-sm font-medium">
            {t("emailLabel")}
          </label>
          <Input
            id="reporter-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reporter-role" className="text-sm font-medium">
            {t("roleLabel")}
          </label>
          <select
            id="reporter-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-sm font-medium">
            {t("reasonLabel")}
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            minLength={10}
            maxLength={8192}
            required
            placeholder={t("reasonPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
        </div>

        {/* Honeypot — hidden from humans; bots fill it and get rejected server-side. */}
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

        <Button type="submit" disabled={!canSubmit}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {t("submit")}
        </Button>

        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-destructive">
          {error}
        </p>
      </form>
    </div>
  );
}
