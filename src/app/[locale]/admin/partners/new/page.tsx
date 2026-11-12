import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPartner } from "@/lib/actions/content";
import { PartnerForm } from "@/components/admin/partner-form";
import { PageHeader } from "@/components/admin/page-header";

export default async function NewPartnerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminPartners");
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("new")} />
      <PartnerForm action={createPartner} />
    </div>
  );
}
