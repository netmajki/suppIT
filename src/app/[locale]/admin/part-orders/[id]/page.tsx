import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { deletePartOrder, updatePartOrder } from "@/lib/actions/part-orders";
import { formatDate } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-meta";
import { getOrderOptions } from "@/lib/order-queries";
import { PartOrderForm } from "@/components/admin/part-order-form";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";

const dateOnly = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");

export default async function EditPartOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const part = await db.partOrder.findUnique({ where: { id }, include: { order: { select: { number: true, title: true } } } });
  if (!part) notFound();
  const [t, tc, orders] = await Promise.all([getTranslations("PartOrders"), getTranslations("Common"), getOrderOptions()]);
  if (part.orderId && part.order && !orders.some((o) => o.id === part.orderId)) {
    orders.unshift({ id: part.orderId, label: `${formatOrderNumber(part.order.number)} ${part.order.title}` });
  }
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t("editTitle")}
        subtitle={part.receivedAt ? `${part.partName} · ${t("receivedAt")}: ${formatDate(part.receivedAt, locale)}` : part.partName}
        actions={
          <form action={deletePartOrder.bind(null, id)}>
            <ConfirmSubmit message={tc("confirmDelete")} variant="outline" className="text-destructive"><Trash2 />{tc("delete")}</ConfirmSubmit>
          </form>
        }
      />
      <PartOrderForm
        action={updatePartOrder.bind(null, id)}
        orders={orders}
        alreadyReceived={!!part.receivedAt}
        part={{
          partName: part.partName,
          supplier: s(part.supplier),
          supplierUrl: s(part.supplierUrl),
          quantity: String(part.quantity),
          unitPrice: s(part.unitPrice),
          status: part.status,
          trackingNumber: s(part.trackingNumber),
          orderedAt: dateOnly(part.orderedAt),
          expectedAt: dateOnly(part.expectedAt),
          notes: s(part.notes),
          orderId: s(part.orderId),
        }}
      />
    </div>
  );
}
