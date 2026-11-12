import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { updateOrder } from "@/lib/actions/orders";
import { formatOrderNumber } from "@/lib/order-meta";
import { getClientOptions, getStaffUsers, orderToFormValues } from "@/lib/order-queries";
import { OrderForm } from "@/components/admin/order-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const order = await db.order.findUnique({ where: { id } });
  if (!order) notFound();
  const [clients, staff, t] = await Promise.all([getClientOptions(), getStaffUsers(), getTranslations("Orders")]);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("editTitle")} subtitle={`${formatOrderNumber(order.number)} · ${order.title}`} />
      <OrderForm action={updateOrder.bind(null, id)} order={orderToFormValues(order)} clients={clients} staff={staff} />
    </div>
  );
}
