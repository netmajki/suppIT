import { getTranslations, setRequestLocale } from "next-intl/server";
import { createOrder } from "@/lib/actions/orders";
import { getClientOptions, getStaffUsers } from "@/lib/order-queries";
import { OrderForm } from "@/components/admin/order-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { clientId } = await searchParams;
  const [clients, staff, t] = await Promise.all([getClientOptions(), getStaffUsers(), getTranslations("Orders")]);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("new")} />
      <OrderForm action={createOrder} clients={clients} staff={staff} order={clientId ? { clientId } : undefined} />
    </div>
  );
}
