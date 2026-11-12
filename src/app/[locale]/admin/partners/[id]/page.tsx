import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { deletePartner, updatePartner } from "@/lib/actions/content";
import { PartnerForm } from "@/components/admin/partner-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function EditPartnerPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const p = await db.partner.findUnique({ where: { id } });
  if (!p) notFound();
  const [t, tc] = await Promise.all([getTranslations("AdminPartners"), getTranslations("Common")]);
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={t("editTitle")}
        subtitle={p.name}
        actions={
          <form action={deletePartner.bind(null, id)}>
            <ConfirmSubmit message={tc("confirmDelete")} variant="outline" className="text-destructive"><Trash2 />{tc("delete")}</ConfirmSubmit>
          </form>
        }
      />
      <PartnerForm
        action={updatePartner.bind(null, id)}
        initial={{ name: p.name, url: p.url ?? "", logoUrl: p.logoUrl ?? "", sortOrder: String(p.sortOrder), active: p.active ? "on" : "" }}
      />
    </div>
  );
}
