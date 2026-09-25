"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { BetaMark } from "./beta-mark";
import { Box, Cta, CtaLink } from "./beta-ui";
import {
  StepDone,
  StepEmail,
  StepHow,
  StepIntro,
  StepNotYet,
  type EmailStepState,
} from "./beta-steps";

/** The beta feed lives on the app subdomain, not on this site. */
const FEED_BASE_URL = "https://app.agerculture.com";

const TOTAL_STEPS = 5;
/** Dots and the footnote only run while the onboarding does. */
const STEPS_WITH_PROGRESS = 4;
const COMPLETED_KEY = "ager.beta.onboarding.completed";
const SWIPE_THRESHOLD_PX = 48;

/** Deliberately permissive: the authoritative check is server side. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The Figma frame, and how far it may be blown up on a large screen. */
const STAGE_WIDTH = 402;
const STAGE_HEIGHT = 874;
const MAX_SCALE = 1.25;

/** Figma coordinates that differ from screen to screen. */
const CTA_TOP = [654, 654, 654, 652, 408];

export function BetaOnboarding() {
  const t = useTranslations("beta");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EmailStepState>({
    email: "",
    updatesConsent: false,
    company: "",
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // How long the visitor spent on the form: bots submit almost instantly.
  const openedAt = useRef<number | null>(null);
  // Which link brought them here — read once, from ?src=.
  const source = useRef<string>("");
  const frameRef = useRef<HTMLDivElement>(null);
  const stageAnchorRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((next: number) => {
    setStep(Math.min(Math.max(next, 0), TOTAL_STEPS - 1));
  }, []);

  const submitSignup = useCallback(async () => {
    if (!EMAIL_RE.test(form.email.trim())) {
      setEmailError(t("email.invalid"));
      return;
    }

    setEmailError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          updatesConsent: form.updatesConsent,
          company: form.company,
          locale,
          source: source.current,
          elapsedMs: Date.now() - (openedAt.current ?? Date.now()),
        }),
      });

      if (!res.ok) {
        setEmailError(t("email.failed"));
        return;
      }

      goTo(4);
    } catch {
      setEmailError(t("email.failed"));
    } finally {
      setSubmitting(false);
    }
  }, [form, locale, goTo, t]);

  const handleNext = useCallback(() => {
    if (step === 3) {
      void submitSignup();
      return;
    }
    goTo(step + 1);
  }, [step, submitSignup, goTo]);

  const handleBack = useCallback(() => goTo(step - 1), [step, goTo]);

  useEffect(() => {
    openedAt.current = Date.now();
    // Read straight off the URL rather than through useSearchParams: this page
    // is statically rendered and that hook would force it dynamic.
    source.current =
      new URLSearchParams(window.location.search).get("src") ?? "";
  }, []);

  // The frame is a fixed 402x874 block: it is scaled to fit rather than
  // reflowed. CSS cannot compute the factor (it cannot divide a length by a
  // length), so it is set here and kept in sync with the viewport.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const applyScale = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const scale = Math.min(
        MAX_SCALE,
        width / STAGE_WIDTH,
        height / STAGE_HEIGHT,
      );
      frame.style.setProperty("--beta-scale", String(scale));
    };

    applyScale();
    window.addEventListener("resize", applyScale);
    window.visualViewport?.addEventListener("resize", applyScale);

    return () => {
      window.removeEventListener("resize", applyScale);
      window.visualViewport?.removeEventListener("resize", applyScale);
    };
  }, []);

  // Arrow keys on desktop.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handleBack();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handleBack]);

  // Move focus to the new screen so screen readers announce it.
  useEffect(() => {
    stageAnchorRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== TOTAL_STEPS - 1) return;
    try {
      window.localStorage.setItem(COMPLETED_KEY, new Date().toISOString());
    } catch {
      // Private browsing or storage disabled: not worth failing the flow.
    }
  }, [step]);

  const isLastStep = step === TOTAL_STEPS - 1;
  const showProgress = step < STEPS_WITH_PROGRESS;
  const ctaLabel = [
    t("intro.cta"),
    t("how.cta"),
    t("notYet.cta"),
    t("email.cta"),
    t("done.cta"),
  ][step];

  return (
    <div
      className="grid min-h-dvh place-items-center overflow-hidden"
      style={{ backgroundColor: "var(--neutral-beige)" }}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? start) - start;
        if (delta <= -SWIPE_THRESHOLD_PX) handleNext();
        if (delta >= SWIPE_THRESHOLD_PX) handleBack();
      }}
    >
      {/* The frame reserves exactly the scaled size; the stage inside it is
          always the full 402x874 of the design. */}
      <div className="beta-frame" ref={frameRef}>
        {/* tabIndex only exists so focus can be moved here between screens */}
        <div
          className="beta-stage outline-none"
          ref={stageAnchorRef}
          tabIndex={-1}
        >
          {/* The mark sits lower and larger on the opening screen */}
          {step === 0 ? (
            <BetaMark size={67} top={213} label={t("markAlt")} />
          ) : (
            <BetaMark size={44} top={69} label={t("markAlt")} />
          )}

          {/* Keyed by step: remounting replays the staggered entrance */}
          <div key={step} className="beta-enter absolute inset-0">
            {step === 0 ? <StepIntro /> : null}
            {step === 1 ? <StepHow /> : null}
            {step === 2 ? <StepNotYet /> : null}
            {step === 3 ? (
              <StepEmail
                state={form}
                onChange={(next) => {
                  setForm((current) => ({ ...current, ...next }));
                  if (next.email !== undefined) setEmailError(null);
                }}
                error={emailError}
              />
            ) : null}
            {step === 4 ? <StepDone /> : null}

            {isLastStep ? (
              <CtaLink top={CTA_TOP[step]} href={`${FEED_BASE_URL}/${locale}`}>
                {ctaLabel}
              </CtaLink>
            ) : (
              <Cta
                top={CTA_TOP[step]}
                onClick={handleNext}
                disabled={submitting}
              >
                {ctaLabel}
              </Cta>
            )}
          </div>

          {showProgress ? (
            <div className="space-y-4">
              <Box left={176} top={720} width={50} height={6}>
                <nav
                  aria-label={t("progressLabel")}
                  className="flex items-center"
                  style={{ gap: 5 }}
                >
                  {Array.from({ length: TOTAL_STEPS }, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={t("goToStep", { step: index + 1 })}
                      aria-current={index === step ? "step" : undefined}
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={
                        {
                          width: 6,
                          height: 6,
                          backgroundColor:
                            index === step
                              ? "var(--ager-blue)"
                              : "rgba(28, 28, 28, 0.35)",
                          "--tw-ring-color": "var(--ager-blue)",
                          "--tw-ring-offset-color": "var(--neutral-beige)",
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </nav>
              </Box>

              <Box left={65} top={734} width={272} height={22}>
                <p
                  className="text-center"
                  style={{
                    fontSize: 9,
                    lineHeight: "11px",
                    color: "var(--ink-gray)",
                  }}
                >
                  {t("footnote")}
                </p>
              </Box>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
