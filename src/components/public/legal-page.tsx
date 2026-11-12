import { getTranslations } from "next-intl/server";
import { getAllSettings } from "@/lib/settings";
import { Markdown } from "@/components/markdown";

/** Strona prawna z treścią z ustawień; brak tłumaczenia → wersja niemiecka. */
export async function LegalPage({ kind, locale, title }: { kind: "impressum" | "privacy"; locale: string; title: string }) {
  const [t, s] = await Promise.all([getTranslations("Legal"), getAllSettings()]);
  const own = s[`legal.${kind}.${locale}` as keyof typeof s];
  const content = own || s[`legal.${kind}.de` as keyof typeof s];
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-brand-graphite dark:text-foreground">{title}</h1>
      {!own && content && locale !== "de" && <p className="text-sm text-muted-foreground">{t("onlyGerman")}</p>}
      {content ? <Markdown>{content}</Markdown> : <p className="rounded-xl border bg-card p-6 text-muted-foreground">{t("missing")}</p>}
    </article>
  );
}
