"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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

// Undo window for deferred SAVE / DISCARD / mute commits. Comfortable enough to read the
// toast and reach "Annulla" without rushing; the toast is viewport-fixed so scrolling
// neither dismisses it nor cancels the pending commit.
const UNDO_MS = 5000;

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
  // The "Non mi interessa" menu is portaled to <body> so it escapes the card's
  // `overflow-hidden` (which otherwise clips it) and never renders under the next card.
  // It is fixed-positioned against the trigger's viewport rect.
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Anchor the portaled menu below the trigger, right-aligned to it.
  const placeMenu = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

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

  // Close the topic menu only on a genuine outside click (neither the trigger nor the
  // portaled menu) or Escape — never on the selecting click itself. Keep it glued to the
  // trigger while open by re-placing it on scroll/resize.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", placeMenu, true);
    window.addEventListener("resize", placeMenu);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", placeMenu, true);
      window.removeEventListener("resize", placeMenu);
    };
  }, [menuOpen, placeMenu]);

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  // Mute a topic: optimistically drop every feed card carrying it, 5s deferred commit, Undo
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

  // Mute a source: optimistically drop every feed card from it, 5s deferred commit, Undo
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

  // One-tap save → default "Salvati" list (backend auto-files on SAVE). 5s deferred commit.
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

  // Hide → ONE TAP: remove from the feed immediately; 5s deferred DISCARD; Undo restores the
  // snapshot. The undo toast carries OPTIONAL §11.2 reason chips (skippable): tapping one rides
  // its code along on the deferred DISCARD as `reason`; no tap → plain DISCARD, no reason. The
  // feed cache is keyed by mode (["feed", mode]); match every feed query by prefix.
  function handleDiscard() {
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
      chips: DISCARD_REASONS.map((r) => ({ label: t(r.labelKey), value: r.code })),
      chipsLabel: t("discardReasonHeading"),
      onAction: () => {
        for (const [key, data] of snapshots) {
          queryClient.setQueryData(key, data);
        }
      },
      onCommit: (reason) => {
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
      <ActionButton onClick={handleDiscard} label={t("discard")}>
        <EyeOff className="size-4" aria-hidden="true" />
      </ActionButton>

      {/* "Non mi interessa" → hide the article's topics and/or its source feed-wide. Shown when
          at least one topic resolves to a mutable interest OR the article has a source id.
          Distinct from the per-article DISCARD above. */}
      {mutableTopics.length > 0 || sourceId != null ? (
        <div className="inline-flex" ref={triggerRef}>
          <ActionButton
            onClick={() => {
              if (menuOpen) {
                setMenuOpen(false);
              } else {
                placeMenu();
                setMenuOpen(true);
              }
            }}
            label={t("notInterested")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Ban className="size-4" aria-hidden="true" />
          </ActionButton>
          {menuOpen && menuPos
            ? createPortal(
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label={t("notInterested")}
                  style={{ top: menuPos.top, right: menuPos.right }}
                  className="fixed z-50 min-w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
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
                </div>,
                document.body,
              )
            : null}
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
