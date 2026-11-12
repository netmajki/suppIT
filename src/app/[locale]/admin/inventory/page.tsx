import { AlertTriangle, Minus, Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { adjustQuantity } from "@/lib/actions/inventory";
import { formatMoney } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-meta";
import { getInventoryCategories } from "@/lib/order-queries";
import { getCompanySettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { PAGE_SIZE, Pagination, parsePage } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type SP = { tab?: string; q?: string; category?: string; low?: string; page?: string };

export default async function InventoryPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isClient = sp.tab === "client";
  const page = parsePage(sp.page);
  const q = (sp.q ?? "").trim();
  const low = !isClient && sp.low === "1";
  const [t, tc, categories, company] = await Promise.all([
    getTranslations("Inventory"),
    getTranslations("Common"),
    getInventoryCategories(),
    getCompanySettings(),
  ]);

  const lowStockWhere: Prisma.InventoryItemWhereInput = {
    ownership: "COMPANY",
    minQuantity: { gt: 0 },
    quantity: { lte: db.inventoryItem.fields.minQuantity },
  };
  const where: Prisma.InventoryItemWhereInput = {
    ownership: isClient ? "CLIENT" : "COMPANY",
    ...(sp.category ? { category: sp.category } : {}),
    ...(low ? lowStockWhere : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total, lowCount, valueRows] = await Promise.all([
    db.inventoryItem.findMany({
      where,
      orderBy: isClient ? { createdAt: "desc" } : { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { client: { select: { id: true, name: true } }, order: { select: { id: true, number: true } } },
    }),
    db.inventoryItem.count({ where }),
    db.inventoryItem.count({ where: lowStockWhere }),
    isClient
      ? Promise.resolve([])
      : db.inventoryItem.findMany({ where: { ownership: "COMPANY", purchasePrice: { not: null } }, select: { quantity: true, purchasePrice: true } }),
  ]);
  const stockValue = valueRows.reduce((sum, r) => sum + r.quantity * Number(r.purchasePrice), 0);
  const tabHref = (client: boolean) => (client ? "/admin/inventory?tab=client" : "/admin/inventory");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button asChild>
            <Link href={`/admin/inventory/new${isClient ? "?ownership=CLIENT" : ""}`}><Plus />{t("new")}</Link>
          </Button>
        }
      />

      <div className="flex gap-1 border-b">
        {[false, true].map((c) => (
          <Link
            key={String(c)}
            href={tabHref(c)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
              c === isClient ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {c ? t("tabClient") : t("tabCompany")}
          </Link>
        ))}
      </div>

      {!isClient && (
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <Card>
            <CardHeader>
              <CardDescription>{t("value")}</CardDescription>
              <CardTitle className="text-2xl font-bold">{formatMoney(stockValue, locale, company.currency)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={lowCount ? "border-amber-500/50" : undefined}>
            <CardHeader>
              <CardDescription>{t("lowStock")}</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                {lowCount > 0 && <AlertTriangle className="size-5 text-amber-500" />}
                {lowCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <form className="flex flex-wrap items-center gap-2" role="search">
        {isClient && <input type="hidden" name="tab" value="client" />}
        <Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} aria-label={tc("search")} className="max-w-sm" />
        <div className="w-52">
          <Select name="category" defaultValue={sp.category ?? ""} aria-label={t("category")}>
            <option value="">{t("allCategories")}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        {!isClient && (
          <Label className="flex items-center gap-2 px-2"><Checkbox name="low" value="1" defaultChecked={low} />{t("lowStockOnly")}</Label>
        )}
        <Button type="submit" variant="outline"><Search />{tc("filter")}</Button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{t("name")}</TH>
              {isClient ? <TH>{t("client")}</TH> : <TH>{t("sku")}</TH>}
              <TH>{t("category")}</TH>
              <TH>{t("location")}</TH>
              <TH>{t("order")}</TH>
              {!isClient && <TH className="text-right">{t("salePrice")}</TH>}
              <TH className="text-right">{t("quantity")}</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((i) => {
              const isLow = i.ownership === "COMPANY" && i.minQuantity > 0 && i.quantity <= i.minQuantity;
              return (
                <TR key={i.id}>
                  <TD>
                    <Link href={`/admin/inventory/${i.id}`} className="font-medium hover:text-primary">{i.name}</Link>
                    {i.serialNumber && <div className="font-mono text-xs text-muted-foreground">S/N {i.serialNumber}</div>}
                  </TD>
                  {isClient ? (
                    <TD>{i.client ? <Link href={`/admin/clients/${i.client.id}`} className="hover:text-primary">{i.client.name}</Link> : "—"}</TD>
                  ) : (
                    <TD className="font-mono text-xs">{i.sku ?? "—"}</TD>
                  )}
                  <TD>{i.category ?? "—"}</TD>
                  <TD>{i.location ?? "—"}</TD>
                  <TD className="font-mono text-xs">
                    {i.order ? <Link href={`/admin/orders/${i.order.id}`} className="hover:text-primary">{formatOrderNumber(i.order.number)}</Link> : "—"}
                  </TD>
                  {!isClient && <TD className="text-right whitespace-nowrap">{formatMoney(i.salePrice, locale, company.currency)}</TD>}
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <form action={adjustQuantity.bind(null, i.id, -1)}>
                        <Button type="submit" size="icon" variant="ghost" className="size-7" aria-label={t("decrease")} disabled={i.quantity === 0}><Minus /></Button>
                      </form>
                      <span className="min-w-8 text-center font-semibold tabular-nums">{i.quantity}</span>
                      <form action={adjustQuantity.bind(null, i.id, 1)}>
                        <Button type="submit" size="icon" variant="ghost" className="size-7" aria-label={t("increase")}><Plus /></Button>
                      </form>
                      {isLow && <Badge tone="amber" className="ml-1">{t("lowStock")}</Badge>}
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
      <Pagination
        page={page}
        total={total}
        basePath="/admin/inventory"
        params={{ tab: isClient ? "client" : undefined, q: q || undefined, category: sp.category, low: low ? "1" : undefined }}
      />
    </div>
  );
}
