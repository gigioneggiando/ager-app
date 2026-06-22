"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { ReadingList } from "@ager/api-client";

import {
  useCreateList,
  useReadingListItems,
  useReadingLists,
  useRemoveItem,
} from "@/features/reading-lists/use-reading-lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";

function ReadingListSection({ list }: { list: ReadingList }) {
  const t = useTranslations("ReadingLists");
  const { data, isPending } = useReadingListItems(list.id!);
  const removeItem = useRemoveItem(list.id!);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-serif text-lg font-bold text-primary">{list.name}</h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("emptyList")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {data.items.map((item) => (
            <li
              key={item.articleId}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <a
                  href={item.url || item.canonicalUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary transition-colors hover:text-link"
                >
                  {item.title}
                </a>
                {item.sourceName ? (
                  <span className="text-xs text-muted-foreground">
                    {item.sourceName}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeItem.mutate(item.articleId)}
                aria-label={t("remove")}
                title={t("remove")}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ReadingListsView() {
  const t = useTranslations("ReadingLists");
  const { data, isPending, isError } = useReadingLists();
  const createList = useCreateList();
  const [name, setName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createList.mutate(
      { name: trimmed },
      { onSuccess: () => setName("") },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="list-name" className="text-sm font-medium">
            {t("newListLabel")}
          </label>
          <Input
            id="list-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("newListPlaceholder")}
            maxLength={100}
          />
        </div>
        <Button type="submit" disabled={!name.trim() || createList.isPending}>
          {createList.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
          {t("create")}
        </Button>
      </form>

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="flex flex-col gap-4">
          {data.items.map((list) => (
            <ReadingListSection key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
