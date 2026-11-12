import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/page-hero";
import { RepairForm } from "@/components/public/repair-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Repair" });
  return { title: t("title"), description: t("intro") };
}

export default async function RepairPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { code } = await searchParams;
  const t = await getTranslations("Repair");
  return (
    <>
      <PageHero title={t("title")} intro={t("intro")} />
      <section className="mx-auto max-w-3xl px-4 py-12">
        <RepairForm defaultPromo={code?.slice(0, 40)} />
      </section>
    </>
  );
}
