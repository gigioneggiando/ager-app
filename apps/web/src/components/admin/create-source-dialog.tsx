"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import {
  SOURCE_TYPES,
  useCreateSource,
  useProbeRss,
} from "@/features/admin/use-sources";
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

export function CreateSourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const locale = useLocale();
  const toast = useToast();
  const create = useCreateSource();
  const probe = useProbeRss();

  const [type, setType] = useState<string>("RSS");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [country, setCountry] = useState("");
  const [lang, setLang] = useState("");
  const [probedUrl, setProbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRss = type === "RSS";
  // The probe result only counts if it matches the current rssUrl.
  const probeValid =
    probe.data?.valid === true && probedUrl === rssUrl.trim() && rssUrl.trim() !== "";
  const canCreate =
    name.trim() !== "" &&
    url.trim() !== "" &&
    (!isRss || probeValid) &&
    !create.isPending;

  function reset() {
    setType("RSS");
    setName("");
    setUrl("");
    setRssUrl("");
    setCountry("");
    setLang("");
    setProbedUrl(null);
    setError(null);
    probe.reset();
  }

  function runProbe() {
    const value = rssUrl.trim();
    if (!value) return;
    setProbedUrl(value);
    probe.mutate(value);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate(
      {
        type,
        name: name.trim(),
        url: url.trim(),
        rssUrl: rssUrl.trim() || undefined,
        country: country.trim() || undefined,
        lang: lang.trim() || undefined,
      },
      {
        onSuccess: ({ id }) => {
          toast.show({ message: t("sources.created", { name: name.trim() }) });
          reset();
          onOpenChange(false);
          router.push(`/${locale}/admin/sources/${id}`);
        },
        onError: (err) => {
          const code = err instanceof Error ? err.message : "";
          if (code === "duplicate_url") setError(t("sources.errors.duplicateUrl"));
          else if (code === "invalid_url") setError(t("sources.errors.invalidUrl"));
          else setError(t("sources.errors.createFailed"));
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
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("sources.createTitle")}</DialogTitle>
            <DialogDescription>{t("sources.createHint")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="src-type" className="text-sm font-medium">
              {t("sources.typeLabel")}
            </label>
            <select
              id="src-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SOURCE_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(`sources.types.${tp}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="src-name" className="text-sm font-medium">
              {t("sources.nameLabel")}
            </label>
            <Input
              id="src-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="src-url" className="text-sm font-medium">
              {t("sources.urlLabel")}
            </label>
            <Input
              id="src-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              required
            />
          </div>

          {isRss ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="src-rss" className="text-sm font-medium">
                {t("sources.rssLabel")}
              </label>
              <div className="flex gap-2">
                <Input
                  id="src-rss"
                  type="url"
                  value={rssUrl}
                  onChange={(e) => {
                    setRssUrl(e.target.value);
                    setProbedUrl(null);
                    probe.reset();
                  }}
                  placeholder="https://…/feed.xml"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={runProbe}
                  disabled={!rssUrl.trim() || probe.isPending}
                >
                  {probe.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {t("sources.probe")}
                </Button>
              </div>
              {probe.data && probedUrl === rssUrl.trim() ? (
                probe.data.valid ? (
                  <p className="flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    {t("sources.probeValid", {
                      root: probe.data.rootElement ?? "feed",
                    })}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <XCircle className="size-3.5" aria-hidden="true" />
                    {t("sources.probeInvalid", {
                      reason: probe.data.reason ?? String(probe.data.statusCode ?? "?"),
                    })}
                  </p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">{t("sources.probeHint")}</p>
              )}
            </div>
          ) : null}

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="src-country" className="text-sm font-medium">
                {t("sources.countryLabel")}
              </label>
              <Input
                id="src-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                maxLength={2}
                placeholder="IT"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="src-lang" className="text-sm font-medium">
                {t("sources.langLabel")}
              </label>
              <Input
                id="src-lang"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                maxLength={10}
                placeholder="it"
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("sources.cancel")}
            </Button>
            <Button type="submit" disabled={!canCreate}>
              {create.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {t("sources.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
