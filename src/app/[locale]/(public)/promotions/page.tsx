import type { Locale } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicPromotions } from "@/lib/public-promos";
import { getCompanySettings } from "@/lib/settings";
import { PageHero } from "@/components/page-hero";
import { PromoCard } from "@/components/public/promo-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "PromotionsPage" });
  return { title: t("title"), description: t("intro") };
}

export default async function PromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, promos, company] = await Promise.all([getTranslations("PromotionsPage"), getPublicPromotions(locale as Locale), getCompanySettings()]);
  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} />
      <section className="mx-auto max-w-6xl px-4 py-12">
        {promos.length === 0 ? (
          <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => <PromoCard key={p.id} p={p} locale={locale} currency={company.currency} />)}
          </div>
        )}
      </section>
    </>
  );
}
