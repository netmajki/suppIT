import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPartOrder } from "@/lib/actions/part-orders";
import { getOrderOptions } from "@/lib/order-queries";
import { PartOrderForm } from "@/components/admin/part-order-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function NewPartOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { orderId } = await searchParams;
  const [t, orders] = await Promise.all([getTranslations("PartOrders"), getOrderOptions()]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("new")} />
      <PartOrderForm action={createPartOrder} orders={orders} part={{ orderId }} returnTo={orderId ? "order" : undefined} />
    </div>
  );
}
