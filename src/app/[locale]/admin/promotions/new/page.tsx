import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPromotion } from "@/lib/actions/content";
import { PromotionForm } from "@/components/admin/promotion-form";
import { PageHeader } from "@/components/admin/page-header";

export default async function NewPromotionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminPromotions");
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("new")} />
      <PromotionForm action={createPromotion} />
    </div>
  );
}
