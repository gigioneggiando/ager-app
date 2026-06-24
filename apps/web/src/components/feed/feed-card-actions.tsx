"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  Ban,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  EyeOff,
  Share2,
} from "lucide-react";
import type { FeedPage } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/auth-provider";
import { useInterests } from "@/features/interests/use-interests";
import { muteInterest, muteSource } from "@/features/mutes/use-muted";
import { postInteraction } from "@/features/interactions/use-interaction";
import { useToast } from "@/components/ui/toast";
import { AddToListDialog } from "@/components/reading-lists/add-to-list-dialog";

const UNDO_MS = 3000;

/**
 * Optional §11.2 DISCARD reasons (skippable). The `code` is the wire value sent as
 * `reason`; the backend normalises + routes the penalty: clickbait / unwanted_source →
 * source, read_elsewhere → cluster, not_interesting (and "no reason") → topic.
 */
const DISCARD_REASONS = [
  { code: "clickbait", labelKey: "reasonClickbait" },
  { code: "unwanted_source", labelKey: "reasonUnwantedSource" },
  { code: "not_interesting", labelKey: "reasonNotInteresting" },
  { code: "read_elsewhere", labelKey: "reasonReadElsewhere" },
] as const;

function ActionButton({
  onClick,
  label,
  active,
  children,
  ...rest
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-accent",
      )}
      {...rest}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/**
 * The "Nascondi" (DISCARD) control with an OPTIONAL reason prompt (§11.2). Clicking it opens
 * a small menu of skippable reason chips plus a plain "hide, no reason" item; choosing any of
 * them calls `onDiscard(reason?)`. Mirrors the topic-mute menu's outside-click / Escape close.
 */
function DiscardReasonMenu({
  onDiscard,
}: {
  onDiscard: (reason?: string) => void;
}) {
  const t = useTranslations("Actions");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(reason?: string) {
    setOpen(false);
    onDiscard(reason);
  }

  return (
    <div className="relative" ref={ref}>
      <ActionButton
        onClick={() => setOpen((v) => !v)}
        label={t("discard")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <EyeOff className="size-4" aria-hidden="true" />
      </ActionButton>
      {open ? (
        <div
          role="menu"
          aria-label={t("discardReasonHeading")}
          className="absolute right-0 z-20 mt-1 min-w-60 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
        >
          <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {t("discardReasonHeading")}
          </p>
          <div className="flex flex-wrap gap-1.5 px-3 pb-2 pt-1">
            {DISCARD_REASONS.map((r) => (
              <button
                key={r.code}
                type="button"
                role="menuitem"
                onClick={() => choose(r.code)}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(r.labelKey)}
              </button>
            ))}
          </div>
          <div className="border-t border-border">
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(undefined)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
            >
              <EyeOff className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              {t("discardNoReason")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function removeFromFeed(
  data: InfiniteData<FeedPage> | undefined,
  articleId: number,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((i) => i.articleId !== articleId),
    })),
  };
}

/** Drop every feed item carrying the muted topic label (topic-mute is a feed-wide hide). */
function removeTopicFromFeed(
  data: InfiniteData<FeedPage> | undefined,
  topic: string,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((i) => !(i.topics ?? []).includes(topic)),
    })),
  };
}

/** Drop every feed item published by the muted source (source-mute is a feed-wide hide). */
function removeSourceFromFeed(
  data: InfiniteData<FeedPage> | undefined,
  sourceId: number,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items ?? []).filter((i) => i.sourceId !== sourceId),
    })),
  };
}

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function FeedCardActions({
  articleId,
  url,
  title,
  topics = [],
  sourceId,
  sourceName,
}: {
  articleId: number;
  url: string;
  title: string;
  /** The article's topic labels — used to offer "Nascondi argomento". */
  topics?: string[];
  /** The publishing source id — used to offer "Nascondi fonte". */
  sourceId?: number | null;
  /** The publishing source name — shown in the "Nascondi fonte" label. */
  sourceName?: string | null;
}) {
  const t = useTranslations("Actions");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const toast = useToast();
  const { data: interests } = useInterests();
  const [saved, setSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Resolve the article's topic labels to interest ids (the mute API is keyed by interestId).
  // Match against both interest slug and name; keep only topics we can actually mute.
  const mutableTopics = topics
    .map((label) => {
      const match = (interests ?? []).find(
        (i) => norm(i.slug) === norm(label) || norm(i.name) === norm(label),
      );
      return match?.id != null ? { label, interestId: match.id } : null;
    })
    .filter((x): x is { label: string; interestId: number } => x !== null);

  // Close the topic menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  // Mute a topic: optimistically drop every feed card carrying it, 3s deferred commit, Undo
  // restores the snapshot. Distinct from per-article DISCARD — this is a feed-wide topic hide.
  function handleMuteTopic(label: string, interestId: number) {
    setMenuOpen(false);
    if (!requireAuth()) return;
    const snapshots = queryClient.getQueriesData<InfiniteData<FeedPage>>({
      queryKey: ["feed"],
    });
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      { queryKey: ["feed"] },
      (d) => removeTopicFromFeed(d, label),
    );
    toast.show({
      message: t("topicHidden", { topic: label }),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      onAction: () => {
        for (const [key, data] of snapshots) {
          queryClient.setQueryData(key, data);
        }
      },
      onCommit: () => {
        void muteInterest(interestId).then(() => {
          void queryClient.invalidateQueries({ queryKey: ["feed"] });
          void queryClient.invalidateQueries({ queryKey: ["muted-interests"] });
        });
      },
    });
  }

  // Mute a source: optimistically drop every feed card from it, 3s deferred commit, Undo
  // restores the snapshot. Feed-wide hide, keyed by the article's sourceId.
  function handleMuteSource(id: number, name: string) {
    setMenuOpen(false);
    if (!requireAuth()) return;
    const snapshots = queryClient.getQueriesData<InfiniteData<FeedPage>>({
      queryKey: ["feed"],
    });
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      { queryKey: ["feed"] },
      (d) => removeSourceFromFeed(d, id),
    );
    toast.show({
      message: t("sourceHidden", { source: name }),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      onAction: () => {
        for (const [key, data] of snapshots) {
          queryClient.setQueryData(key, data);
        }
      },
      onCommit: () => {
        void muteSource(id).then(() => {
          void queryClient.invalidateQueries({ queryKey: ["feed"] });
          void queryClient.invalidateQueries({ queryKey: ["muted-sources"] });
        });
      },
    });
  }

  // One-tap save → default "Salvati" list (backend auto-files on SAVE). 3s deferred commit.
  function handleSave() {
    if (!requireAuth()) return;
    setSaved(true);
    toast.show({
      message: t("savedToDefault"),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      onAction: () => setSaved(false),
      onCommit: () => {
        void postInteraction(articleId, "SAVE").then(() =>
          queryClient.invalidateQueries({ queryKey: ["reading-lists"] }),
        );
      },
    });
  }

  // Hide → remove from the feed immediately; 3s deferred DISCARD; Undo restores the snapshot.
  // An OPTIONAL §11.2 reason (skippable) rides along on the deferred DISCARD; the backend
  // routes the penalty (source/cluster/topic). The feed cache is keyed by mode (["feed",
  // mode]); match every feed query by prefix.
  function handleDiscard(reason?: string) {
    if (!requireAuth()) return;
    const snapshots = queryClient.getQueriesData<InfiniteData<FeedPage>>({
      queryKey: ["feed"],
    });
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      { queryKey: ["feed"] },
      (d) => removeFromFeed(d, articleId),
    );
    toast.show({
      message: t("hidden"),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      onAction: () => {
        for (const [key, data] of snapshots) {
          queryClient.setQueryData(key, data);
        }
      },
      onCommit: () => {
        void postInteraction(articleId, "DISCARD", reason).then(() =>
          queryClient.invalidateQueries({ queryKey: ["feed"] }),
        );
      },
    });
  }

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard?.writeText(url);
      }
    } catch {
      /* dismissed */
    }
    if (isAuthenticated) void postInteraction(articleId, "SHARE");
  }

  function openAddToList() {
    if (!requireAuth()) return;
    setDialogOpen(true);
  }

  return (
    <>
      {/* Save is one-tap → default "Salvati" list; the small caret is the secondary action,
          opening the add-to-list dialog (choose a list + note). Grouped so the bookmark stays a
          compact icon button consistent with hide/share, and nothing dominates the row. */}
      <div className="inline-flex items-center">
        <ActionButton
          onClick={handleSave}
          label={saved ? t("saved") : t("save")}
          active={saved}
        >
          {saved ? (
            <BookmarkCheck className="size-4" aria-hidden="true" />
          ) : (
            <Bookmark className="size-4" aria-hidden="true" />
          )}
        </ActionButton>
        <button
          type="button"
          onClick={openAddToList}
          aria-label={t("addToList")}
          title={t("addToList")}
          className="-ml-1 rounded-md px-1 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <DiscardReasonMenu onDiscard={handleDiscard} />

      {/* "Non mi interessa" → hide the article's topics and/or its source feed-wide. Shown when
          at least one topic resolves to a mutable interest OR the article has a source id.
          Distinct from the per-article DISCARD above. */}
      {mutableTopics.length > 0 || sourceId != null ? (
        <div className="relative" ref={menuRef}>
          <ActionButton
            onClick={() => setMenuOpen((v) => !v)}
            label={t("notInterested")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Ban className="size-4" aria-hidden="true" />
          </ActionButton>
          {menuOpen ? (
            <div
              role="menu"
              aria-label={t("notInterested")}
              className="absolute right-0 z-20 mt-1 min-w-52 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
            >
              {mutableTopics.length > 0 ? (
                <>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {t("hideTopicHeading")}
                  </p>
                  {mutableTopics.map((tp) => (
                    <button
                      key={tp.interestId}
                      type="button"
                      role="menuitem"
                      onClick={() => handleMuteTopic(tp.label, tp.interestId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                    >
                      <EyeOff className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{t("hideTopic", { topic: tp.label })}</span>
                    </button>
                  ))}
                </>
              ) : null}

              {sourceId != null ? (
                <>
                  {mutableTopics.length > 0 ? (
                    <div className="my-1 border-t border-border" role="separator" />
                  ) : null}
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {t("hideSourceHeading")}
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      handleMuteSource(sourceId, sourceName?.trim() || t("thisSource"))
                    }
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                  >
                    <Ban className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">
                      {t("hideSource", { source: sourceName?.trim() || t("thisSource") })}
                    </span>
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <ActionButton onClick={handleShare} label={t("share")}>
        <Share2 className="size-4" aria-hidden="true" />
      </ActionButton>

      {dialogOpen ? (
        <AddToListDialog
          articleId={articleId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </>
  );
}
