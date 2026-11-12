import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { updateClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/admin/client-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const client = await db.client.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  if (!client) notFound();
  const t = await getTranslations("Clients");
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("editTitle")} subtitle={client.name} />
      <ClientForm action={updateClient.bind(null, id)} client={client} accountEmail={client.user?.email} />
    </div>
  );
}
