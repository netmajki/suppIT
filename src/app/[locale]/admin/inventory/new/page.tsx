import { getTranslations, setRequestLocale } from "next-intl/server";
import { createItem } from "@/lib/actions/inventory";
import { getClientSelectOptions, getInventoryCategories, getOrderOptions } from "@/lib/order-queries";
import { InventoryForm } from "@/components/admin/inventory-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function NewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ownership?: string; clientId?: string; orderId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [t, clients, orders, categories] = await Promise.all([
    getTranslations("Inventory"),
    getClientSelectOptions(),
    getOrderOptions(),
    getInventoryCategories(),
  ]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("new")} />
      <InventoryForm
        action={createItem}
        clients={clients}
        orders={orders}
        categories={categories}
        item={{ ownership: sp.ownership === "CLIENT" ? "CLIENT" : "COMPANY", clientId: sp.clientId, orderId: sp.orderId }}
      />
    </div>
  );
}
