import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/admin/client-form";
import { PageHeader } from "@/components/admin/page-header";

export default async function NewClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { returnTo } = await searchParams;
  const t = await getTranslations("Clients");
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("new")} />
      <ClientForm action={createClient} returnTo={returnTo === "order" ? "order" : undefined} />
    </div>
  );
}
