"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, ChevronDown, EyeOff, Share2 } from "lucide-react";
import type { FeedPage } from "@ager/api-client";

import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/auth-provider";
import { useInterests } from "@/features/interests/use-interests";
import { muteInterest, muteSource } from "@/features/mutes/use-muted";
import { postInteraction } from "@/features/interactions/use-interaction";
import { useToast, type ToastChip } from "@/components/ui/toast";
import { AddToListDialog } from "@/components/reading-lists/add-to-list-dialog";

// Undo window for the deferred SAVE / DISCARD / mute commits. Comfortable enough to read the
// toast and reach "Annulla" without rushing; the toast is viewport-fixed so scrolling neither
// dismisses it nor cancels the pending commit.
const UNDO_MS = 5000;

/**
 * Optional §11.2 DISCARD reasons (skippable), shown as chips in the Hide undo toast. `code` is
 * the wire value sent as `reason`; the backend normalises + routes the penalty: clickbait /
 * unwanted_source → source, read_elsewhere → cluster, not_interesting (and "no reason") → topic.
 */
const DISCARD_REASONS = [
  { code: "clickbait", labelKey: "reasonClickbait" },
  { code: "unwanted_source", labelKey: "reasonUnwantedSource" },
  { code: "not_interesting", labelKey: "reasonNotInteresting" },
  { code: "read_elsewhere", labelKey: "reasonReadElsewhere" },
] as const;

// Chip-value prefixes that escalate a one-off Hide into a feed-wide mute (decoded in onCommit).
const MUTE_TOPIC = "topic:";
const MUTE_SOURCE = "source:";

function ActionButton({
  onClick,
  label,
  active,
  iconOnly,
  children,
  ...rest
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  /** Render the icon alone (no visible text) — the label still names the button for AT. */
  iconOnly?: boolean;
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
      {iconOnly ? null : <span className="hidden sm:inline">{label}</span>}
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
  /** The article's topic labels — used to offer "Nascondi «argomento»". */
  topics?: string[];
  /** The publishing source id — used to offer "Nascondi «fonte»". */
  sourceId?: number | null;
  /** The publishing source name — shown in the "Nascondi «fonte»" chip. */
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

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
    return false;
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

  // Hide is ONE action that also covers "not interested": one tap removes THIS article from the
  // feed immediately (5s deferred DISCARD, Undo restores the snapshot). The undo toast asks
  // "cosa non ti interessa?" with skippable chips — a plain reason chip tags the DISCARD; a
  // "Nascondi «argomento/fonte»" chip escalates to a feed-wide mute instead. The feed cache is
  // keyed by mode (["feed", mode]); match every feed query by prefix.
  function handleDiscard() {
    if (!requireAuth()) return;
    const snapshots = queryClient.getQueriesData<InfiniteData<FeedPage>>({
      queryKey: ["feed"],
    });
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      { queryKey: ["feed"] },
      (d) => removeFromFeed(d, articleId),
    );

    const hasTopicMute = mutableTopics.length > 0;
    const hasSourceMute = sourceId != null;
    const chips: ToastChip[] = [
      // Direct "what aren't you interested in" answers first: escalate to a feed-wide mute.
      ...mutableTopics.map((tp) => ({
        label: t("hideTopic", { topic: tp.label }),
        value: `${MUTE_TOPIC}${tp.interestId}`,
      })),
      ...(hasSourceMute
        ? [
            {
              label: t("hideSource", {
                source: sourceName?.trim() || t("thisSource"),
              }),
              value: `${MUTE_SOURCE}${sourceId}`,
            },
          ]
        : []),
      // Generic reasons, minus any a topic/source mute already expresses (no redundant pair).
      ...DISCARD_REASONS.filter(
        (r) =>
          !(hasSourceMute && r.code === "unwanted_source") &&
          !(hasTopicMute && r.code === "not_interesting"),
      ).map((r) => ({ label: t(r.labelKey), value: r.code })),
    ];

    toast.show({
      message: t("hidden"),
      actionLabel: t("undo"),
      durationMs: UNDO_MS,
      chips,
      chipsLabel: t("discardReasonHeading"),
      onAction: () => {
        for (const [key, data] of snapshots) {
          queryClient.setQueryData(key, data);
        }
      },
      onCommit: (value) => {
        if (value?.startsWith(MUTE_TOPIC)) {
          const interestId = Number(value.slice(MUTE_TOPIC.length));
          void muteInterest(interestId).then(() => {
            void queryClient.invalidateQueries({ queryKey: ["feed"] });
            void queryClient.invalidateQueries({ queryKey: ["muted-interests"] });
          });
        } else if (value?.startsWith(MUTE_SOURCE)) {
          const id = Number(value.slice(MUTE_SOURCE.length));
          void muteSource(id).then(() => {
            void queryClient.invalidateQueries({ queryKey: ["feed"] });
            void queryClient.invalidateQueries({ queryKey: ["muted-sources"] });
          });
        } else {
          void postInteraction(articleId, "DISCARD", value).then(() =>
            queryClient.invalidateQueries({ queryKey: ["feed"] }),
          );
        }
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
      {/* Save is one-tap → default "Salvati" list; icon-only (the bookmark is universally
          recognised). The small caret is the secondary action: open the add-to-list dialog. */}
      <div className="inline-flex items-center">
        <ActionButton
          onClick={handleSave}
          label={saved ? t("saved") : t("save")}
          active={saved}
          iconOnly
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

      {/* Hide = the single "not interested / hide" action (the undo toast asks what/why). */}
      <ActionButton onClick={handleDiscard} label={t("discard")}>
        <EyeOff className="size-4" aria-hidden="true" />
      </ActionButton>

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
