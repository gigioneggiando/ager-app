"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { useCreateList } from "@/features/reading-lists/use-reading-lists";
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

// Visibility ordinals from the contract (Visibility enum): Private=0, Public=2.
const PRIVATE = 0;
const PUBLIC = 2;

export function CreateListDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("ReadingLists");
  const createList = useCreateList();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<number>(PRIVATE);

  function reset() {
    setName("");
    setDescription("");
    setVisibility(PRIVATE);
  }

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createList.mutate(
      { name: trimmed, description: description.trim() || undefined, visibility },
      {
        onSuccess: () => {
          toast.show({ message: t("listCreated", { name: trimmed }) });
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <form onSubmit={confirm} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>{t("createHint")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="list-name" className="text-sm font-medium">
              {t("nameLabel")}
            </label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("newListPlaceholder")}
              maxLength={120}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="list-desc" className="text-sm font-medium">
              {t("descriptionLabel")}
            </label>
            <Input
              id="list-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              maxLength={500}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">{t("visibilityLabel")}</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === PRIVATE}
                  onChange={() => setVisibility(PRIVATE)}
                  className="accent-primary"
                />
                {t("visibility.private")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === PUBLIC}
                  onChange={() => setVisibility(PUBLIC)}
                  className="accent-primary"
                />
                {t("visibility.public")}
              </label>
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim() || createList.isPending}>
              {createList.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
