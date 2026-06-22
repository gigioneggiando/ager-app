"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, ChevronRight, List, Plus, Trash2 } from "lucide-react";
import type { ReadingList } from "@ager/api-client";

import { Link } from "@/i18n/navigation";
import {
  useDeleteList,
  useReadingLists,
} from "@/features/reading-lists/use-reading-lists";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { CreateListDialog } from "@/components/reading-lists/create-list-dialog";

function useVisibilityLabel() {
  const t = useTranslations("ReadingLists");
  return (v: number | undefined) =>
    v === 2
      ? t("visibility.public")
      : v === 1
        ? t("visibility.unlisted")
        : t("visibility.private");
}

export function ReadingListsView() {
  const t = useTranslations("ReadingLists");
  const { data, isPending, isError } = useReadingLists();
  const deleteList = useDeleteList();
  const visibilityLabel = useVisibilityLabel();
  const [createOpen, setCreateOpen] = useState(false);

  // Pin the default "Salvati" list first.
  const lists = [...(data?.items ?? [])].sort(
    (a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0),
  );

  function handleDelete(l: ReadingList) {
    if (l.isDefault || l.id == null) return;
    if (!window.confirm(t("confirmDelete", { name: l.name ?? "" }))) return;
    deleteList.mutate(l.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" />
          {t("create")}
        </Button>
      </header>

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : lists.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {lists.map((l) => (
            <li key={l.id}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary/30">
                <Link
                  href={`/me/reading-lists/${l.id}`}
                  className="flex flex-1 items-center gap-3 focus-visible:outline-none"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-beige text-primary"
                  >
                    {l.isDefault ? (
                      <Bookmark className="size-5" />
                    ) : (
                      <List className="size-5" />
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 font-serif font-bold text-primary">
                      {l.name}
                      {l.isDefault ? (
                        <Badge variant="context">{t("defaultBadge")}</Badge>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {visibilityLabel(l.visibility)} ·{" "}
                      {t("itemCount", { count: l.itemsCount ?? 0 })}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
                {!l.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(l)}
                    aria-label={t("delete")}
                    title={t("delete")}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateListDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
