"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, TriangleAlert } from "lucide-react";

import { useSession } from "@/components/auth/auth-provider";
import { useDeleteAccount } from "@/features/account/use-account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AccountDangerZone() {
  const t = useTranslations("Account");
  const router = useRouter();
  const locale = useLocale();
  const { logout } = useSession();
  const del = useDeleteAccount();
  const [open, setOpen] = useState(false);

  function confirmDelete() {
    del.mutate(undefined, {
      onSuccess: async () => {
        // Soft-deleted server-side + refresh token revoked; clear cookies + leave.
        await logout();
        setOpen(false);
        router.replace(`/${locale}`);
        router.refresh();
      },
    });
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-5" aria-hidden="true" />
          {t("dangerZone")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("deleteDescription")}</p>
        <div>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            {t("deleteAccount")}
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmBody")}</DialogDescription>
          </DialogHeader>
          {del.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t("errors.deleteFailed")}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={del.isPending}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={del.isPending}
            >
              {del.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {t("deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
