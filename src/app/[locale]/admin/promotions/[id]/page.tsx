import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { deletePromotion, updatePromotion } from "@/lib/actions/content";
import { toDateInput } from "@/lib/format";
import { PromotionForm } from "@/components/admin/promotion-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function EditPromotionPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const p = await db.promotion.findUnique({ where: { id }, include: { translations: true } });
  if (!p) notFound();
  const [t, tc] = await Promise.all([getTranslations("AdminPromotions"), getTranslations("Common")]);
  const initial: Record<string, string> = {
    code: p.code ?? "",
    discountType: p.discountType,
    value: String(p.value),
    validFrom: toDateInput(p.validFrom),
    validTo: toDateInput(p.validTo),
    maxUses: p.maxUses?.toString() ?? "",
    active: p.active ? "on" : "",
  };
  for (const tr of p.translations) {
    initial[`title_${tr.locale}`] = tr.title;
    initial[`description_${tr.locale}`] = tr.description ?? "";
  }
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t("editTitle")}
        subtitle={`${t("usedCount")}: ${p.usedCount}`}
        actions={
          <form action={deletePromotion.bind(null, id)}>
            <ConfirmSubmit message={tc("confirmDelete")} variant="outline" className="text-destructive"><Trash2 />{tc("delete")}</ConfirmSubmit>
          </form>
        }
      />
      <PromotionForm action={updatePromotion.bind(null, id)} initial={initial} />
    </div>
  );
}
