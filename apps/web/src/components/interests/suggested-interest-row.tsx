"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";

import {
  useConfirmSuggestedInterest,
  useDismissSuggestedInterest,
} from "@/features/interests/use-suggested-interests";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

/**
 * One suggested-interest row: the topic name + Conferma / Ignora. Confirm promotes it to an
 * explicit interest (and widens the feed); Ignora records the rejection. Both actions
 * invalidate the suggestion list, so the acted-on row drops out on success. Shared by the
 * feed nudge and the /me/interests list.
 */
export function SuggestedInterestRow({
  interestId,
  label,
}: {
  interestId: number;
  label: string;
}) {
  const t = useTranslations("Suggested");
  const toast = useToast();
  const confirm = useConfirmSuggestedInterest();
  const dismiss = useDismissSuggestedInterest();
  const busy = confirm.isPending || dismiss.isPending;

  function handleConfirm() {
    confirm.mutate(interestId, {
      onSuccess: () => toast.show({ message: t("confirmed", { topic: label }) }),
      onError: () => toast.show({ message: t("actionError") }),
    });
  }

  function handleIgnore() {
    dismiss.mutate(interestId, {
      onSuccess: () => toast.show({ message: t("ignored", { topic: label }) }),
      onError: () => toast.show({ message: t("actionError") }),
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium">{label}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          disabled={busy}
          onClick={handleConfirm}
          aria-label={t("confirmAria", { topic: label })}
        >
          {confirm.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {t("confirm")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={handleIgnore}
          aria-label={t("ignoreAria", { topic: label })}
        >
          {dismiss.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <X aria-hidden="true" />
          )}
          {t("ignore")}
        </Button>
      </div>
    </div>
  );
}

/** Resolve a suggestion's slug to the human interest name; fall back to the slug. */
export function suggestionLabel(
  interests: { id?: number; slug?: string | null; name?: string | null }[] | undefined,
  interestId: number,
  slug: string | null | undefined,
): string {
  const match = (interests ?? []).find((i) => i.id === interestId);
  return match?.name || slug || `#${interestId}`;
}
