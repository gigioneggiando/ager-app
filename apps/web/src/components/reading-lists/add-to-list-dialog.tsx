"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { useAddToList, useReadingLists } from "@/features/reading-lists/use-reading-lists";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const LAST_LIST_KEY = "ager:lastListId";

export function AddToListDialog({
  articleId,
  open,
  onOpenChange,
}: {
  articleId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("ReadingLists");
  const { data, isPending } = useReadingLists();
  const addToList = useAddToList();
  const toast = useToast();
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const lists = useMemo(() => data?.items ?? [], [data]);

  // Preselect: last-used list (localStorage) → default "Salvati" → first.
  // Derived (not effect-driven); the user's explicit pick takes precedence.
  const preselectedId = useMemo(() => {
    if (lists.length === 0) return null;
    let last = NaN;
    try {
      last = Number(localStorage.getItem(LAST_LIST_KEY));
    } catch {
      /* ignore */
    }
    const chosen =
      lists.find((l) => l.id === last) ??
      lists.find((l) => l.isDefault) ??
      lists[0];
    return chosen?.id ?? null;
  }, [lists]);

  const listId = picked ?? preselectedId;

  function confirm() {
    if (listId == null) return;
    const target = lists.find((l) => l.id === listId);
    addToList.mutate(
      { listId, articleId, note },
      {
        onSuccess: () => {
          try {
            localStorage.setItem(LAST_LIST_KEY, String(listId));
          } catch {
            /* ignore */
          }
          toast.show({ message: t("savedTo", { name: target?.name ?? "" }) });
          setNote("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addToList")}</DialogTitle>
          <DialogDescription>{t("addToListHint")}</DialogDescription>
        </DialogHeader>

        {isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <fieldset className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            <legend className="sr-only">{t("chooseList")}</legend>
            {lists.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:bg-secondary"
              >
                <input
                  type="radio"
                  name="target-list"
                  checked={listId === l.id}
                  onChange={() => setPicked(l.id ?? null)}
                  className="accent-primary"
                />
                <span className="flex-1 text-sm font-medium">
                  {l.name}
                  {l.isDefault ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      · {t("defaultBadge")}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {l.itemsCount}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="add-note" className="text-sm font-medium">
            {t("note")}
          </label>
          <Input
            id="add-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("notePlaceholder")}
            maxLength={280}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={confirm}
            disabled={listId == null || addToList.isPending}
          >
            {addToList.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
