import { useTranslations } from "next-intl";
import { BadgeCheck, Compass, Eye, Layers, type LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";

type ValueKey = "transparency" | "authority" | "clarity" | "curiosity";

const VALUES: { key: ValueKey; Icon: LucideIcon }[] = [
  { key: "transparency", Icon: Eye },
  { key: "authority", Icon: BadgeCheck },
  { key: "clarity", Icon: Layers },
  { key: "curiosity", Icon: Compass },
];

/** Brand values: trasparenza, autorevolezza, chiarezza, curiosità. */
export function Values() {
  const t = useTranslations("Values");

  return (
    <section id="valori" className="border-b border-border bg-secondary/40">
      <Container size="wide" className="flex flex-col gap-12 py-20 sm:py-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ key, Icon }) => (
            <li
              key={key}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6"
            >
              <span
                className="flex size-10 items-center justify-center rounded-md bg-accent/10 text-accent"
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <h3 className="font-serif text-lg font-bold">
                {t(`${key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
