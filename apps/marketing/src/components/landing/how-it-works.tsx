import { useTranslations } from "next-intl";
import { HelpCircle, Link2, Quote, type LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";

type StepKey = "linkFirst" | "sources" | "whyShown";

const STEPS: { key: StepKey; Icon: LucideIcon }[] = [
  { key: "linkFirst", Icon: Link2 },
  { key: "sources", Icon: Quote },
  { key: "whyShown", Icon: HelpCircle },
];

/** How it works: link-first, visible sources, "perché lo vedo". */
export function HowItWorks() {
  const t = useTranslations("How");

  return (
    <section id="come-funziona" className="border-b border-border">
      <Container size="wide" className="flex flex-col gap-12 py-20 sm:py-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map(({ key, Icon }, index) => (
            <li key={key} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 items-center justify-center rounded-image-lg bg-primary text-primary-foreground"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold">{t(`${key}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`${key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
