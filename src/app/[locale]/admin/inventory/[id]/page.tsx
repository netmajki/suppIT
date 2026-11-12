import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { formatOrderNumber } from "@/lib/order-meta";
import { deleteItem, updateItem } from "@/lib/actions/inventory";
import { getClientSelectOptions, getInventoryCategories, getOrderOptions } from "@/lib/order-queries";
import { InventoryForm } from "@/components/admin/inventory-form";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const item = await db.inventoryItem.findUnique({ where: { id } });
  if (!item) notFound();
  const [t, tc, clients, orders, categories] = await Promise.all([
    getTranslations("Inventory"),
    getTranslations("Common"),
    getClientSelectOptions(),
    getOrderOptions(),
    getInventoryCategories(),
  ]);
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  // Zlecenie powiązane może być już zarchiwizowane — dołącz je do listy
  if (item.orderId && !orders.some((o) => o.id === item.orderId)) {
    const o = await db.order.findUnique({ where: { id: item.orderId }, select: { number: true, title: true } });
    if (o) orders.unshift({ id: item.orderId, label: `${formatOrderNumber(o.number)} ${o.title}` });
  }
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t("editTitle")}
        subtitle={item.name}
        actions={
          <form action={deleteItem.bind(null, id)}>
            <ConfirmSubmit message={tc("confirmDelete")} variant="outline" className="text-destructive"><Trash2 />{tc("delete")}</ConfirmSubmit>
          </form>
        }
      />
      <InventoryForm
        action={updateItem.bind(null, id)}
        clients={clients}
        orders={orders}
        categories={categories}
        item={{
          name: item.name,
          sku: s(item.sku),
          category: s(item.category),
          ownership: item.ownership,
          quantity: String(item.quantity),
          minQuantity: String(item.minQuantity),
          location: s(item.location),
          serialNumber: s(item.serialNumber),
          purchasePrice: s(item.purchasePrice),
          salePrice: s(item.salePrice),
          notes: s(item.notes),
          clientId: s(item.clientId),
          orderId: s(item.orderId),
        }}
      />
    </div>
  );
}
