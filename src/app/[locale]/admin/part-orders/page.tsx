import { ExternalLink, Plus, Search } from "lucide-react";
import type { PartOrderStatus, Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-meta";
import { ACTIVE_PART_STATUSES, PART_ORDER_STATUSES } from "@/lib/part-meta";
import { getCompanySettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { PAGE_SIZE, Pagination, parsePage } from "@/components/admin/pagination";
import { PartStatusSelect } from "@/components/admin/part-status-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; page?: string };

export default async function PartOrdersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = (sp.q ?? "").trim();
  // Domyślnie pokazujemy aktywne zamówienia
  const statusParam = sp.status ?? "active";
  const [t, ts, tc, company] = await Promise.all([
    getTranslations("PartOrders"),
    getTranslations("PartOrderStatus"),
    getTranslations("Common"),
    getCompanySettings(),
  ]);

  const where: Prisma.PartOrderWhereInput = {
    ...(statusParam === "active"
      ? { status: { in: ACTIVE_PART_STATUSES } }
      : PART_ORDER_STATUSES.includes(statusParam as PartOrderStatus)
        ? { status: statusParam as PartOrderStatus }
        : {}),
    ...(q
      ? {
          OR: [
            { partName: { contains: q, mode: "insensitive" } },
            { supplier: { contains: q, mode: "insensitive" } },
            { trackingNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [parts, total] = await Promise.all([
    db.partOrder.findMany({
      where,
      orderBy: [{ expectedAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { order: { select: { id: true, number: true, client: { select: { name: true } } } } },
    }),
    db.partOrder.count({ where }),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<Button asChild><Link href="/admin/part-orders/new"><Plus />{t("new")}</Link></Button>} />

      <form className="flex flex-wrap items-center gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} aria-label={tc("search")} className="max-w-sm" />
        <div className="w-52">
          <Select name="status" defaultValue={statusParam} aria-label={t("status")}>
            <option value="active">{t("activeOnly")}</option>
            <option value="all">{t("allStatuses")}</option>
            {PART_ORDER_STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="outline"><Search />{tc("filter")}</Button>
      </form>

      {parts.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{t("partName")}</TH>
              <TH>{t("order")}</TH>
              <TH>{t("supplier")}</TH>
              <TH className="text-right">{t("quantity")}</TH>
              <TH className="text-right">{t("total")}</TH>
              <TH>{t("expectedAt")}</TH>
              <TH>{t("status")}</TH>
            </tr>
          </THead>
          <TBody>
            {parts.map((p) => {
              const late = p.expectedAt && p.expectedAt < today && ACTIVE_PART_STATUSES.includes(p.status);
              return (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/admin/part-orders/${p.id}`} className="font-medium hover:text-primary">{p.partName}</Link>
                    {p.trackingNumber && <div className="font-mono text-xs text-muted-foreground">{p.trackingNumber}</div>}
                  </TD>
                  <TD>
                    {p.order ? (
                      <Link href={`/admin/orders/${p.order.id}`} className="hover:text-primary">
                        <span className="font-mono text-xs">{formatOrderNumber(p.order.number)}</span> {p.order.client.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{t("noOrder")}</span>
                    )}
                  </TD>
                  <TD>
                    {p.supplierUrl ? (
                      <a href={p.supplierUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                        {p.supplier ?? new URL(p.supplierUrl).hostname}<ExternalLink className="size-3" />
                      </a>
                    ) : (p.supplier ?? "—")}
                  </TD>
                  <TD className="text-right tabular-nums">{p.quantity}</TD>
                  <TD className="text-right whitespace-nowrap">
                    {p.unitPrice !== null ? formatMoney(Number(p.unitPrice) * p.quantity, locale, company.currency) : "—"}
                  </TD>
                  <TD className={late ? "whitespace-nowrap font-semibold text-destructive" : "whitespace-nowrap"}>
                    {formatDate(p.expectedAt, locale)}
                    {late && <span className="ml-1 text-xs">({t("late")})</span>}
                  </TD>
                  <TD><PartStatusSelect id={p.id} status={p.status} /></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
      <Pagination page={page} total={total} basePath="/admin/part-orders" params={{ q: q || undefined, status: sp.status }} />
    </div>
  );
}
