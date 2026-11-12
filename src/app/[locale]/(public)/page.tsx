import type { Locale } from "@prisma/client";
import { ArrowRight, Wrench, Cpu, Globe, BellRing } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getPublishedArticles } from "@/lib/articles";
import { getPublicPromotions } from "@/lib/public-promos";
import { getCompanySettings } from "@/lib/settings";
import { ArticleCard } from "@/components/public/article-card";
import { PromoCard } from "@/components/public/promo-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, ta, company, promos, articles, partners] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Articles"),
    getCompanySettings(),
    getPublicPromotions(locale as Locale).catch(() => []),
    getPublishedArticles(locale as Locale, { take: 3 }).catch(() => []),
    db.partner.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 12 }).catch(() => []),
  ]);

  const features = [
    { icon: Wrench, title: t("f1Title"), text: t("f1Text") },
    { icon: Cpu, title: t("f2Title"), text: t("f2Text") },
    { icon: Globe, title: t("f3Title"), text: t("f3Text") },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-brand-graphite dark:text-foreground">{t("heroTitle")}</h1>
            <p className="text-muted-foreground">{t("heroText")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/repair">{t("ctaRepair")}<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/contact">{t("ctaContact")}</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2>{t("featuresTitle")}</h2>
            <Link href="/services" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{t("allServices")}<ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" /></span>
                  <CardTitle className="pt-2">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{text}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-6 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><BellRing className="size-7" /></span>
          <div className="space-y-1">
            <h3>{t("trackTitle")}</h3>
            <p className="text-muted-foreground">{t("trackText")}</p>
          </div>
        </div>
      </section>

      {promos.length > 0 && (
        <section className="mx-auto max-w-6xl space-y-8 px-4 pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2>{t("promosTitle")}</h2>
            <Link href="/promotions" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{t("allPromos")}<ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promos.slice(0, 3).map((p) => <PromoCard key={p.id} p={p} locale={locale} currency={company.currency} />)}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2>{ta("latest")}</h2>
              <Link href="/articles" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{ta("title")}<ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => <ArticleCard key={a.id} a={a} locale={locale} readMore={ta("readMore")} />)}
            </div>
          </div>
        </section>
      )}

      {partners.length > 0 && (
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-14">
          <h3 className="text-center text-muted-foreground">{t("partnersTitle")}</h3>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {partners.map((p) => {
              const inner = p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt={p.name} className="h-10 w-auto max-w-36 object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" loading="lazy" />
              ) : (
                <span className="font-heading text-lg font-bold text-muted-foreground">{p.name}</span>
              );
              return p.url ? <a key={p.id} href={p.url} target="_blank" rel="noreferrer">{inner}</a> : <span key={p.id}>{inner}</span>;
            })}
          </div>
        </section>
      )}
    </>
  );
}
