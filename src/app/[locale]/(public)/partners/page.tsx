import { ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "PartnersPage" });
  return { title: t("title") };
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PartnersPage");
  const partners = await db.partner.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} />
      <section className="mx-auto max-w-6xl px-4 py-12">
        {partners.length === 0 ? (
          <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex h-full flex-col items-center justify-between gap-4 pt-6 text-center">
                  <div className="grid h-20 w-full place-items-center">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt={p.name} className="max-h-20 max-w-full object-contain" loading="lazy" />
                    ) : (
                      <span className="font-heading text-xl font-bold">{p.name}</span>
                    )}
                  </div>
                  <p className="font-medium">{p.name}</p>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      {t("visit")}<ExternalLink className="size-3.5" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
