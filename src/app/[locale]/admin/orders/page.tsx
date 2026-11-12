import { Archive, ClipboardList, Plus, Search } from "lucide-react";
import type { OrderStatus, OrderType, Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { CLOSED_STATUSES, ORDER_STATUSES, ORDER_TYPES, formatOrderNumber } from "@/lib/order-meta";
import { getStaffUsers } from "@/lib/order-queries";
import { PageHeader } from "@/components/admin/page-header";
import { PAGE_SIZE, Pagination, parsePage } from "@/components/admin/pagination";
import { PriorityBadge, StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; type?: string; assignee?: string; archive?: string; page?: string };

export default async function OrdersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const archive = sp.archive === "1";
  const t = await getTranslations("Orders");
  const ts = await getTranslations("Status");
  const tt = await getTranslations("OrderType");
  const tc = await getTranslations("Common");

  const q = (sp.q ?? "").trim();
  const num = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const type = ORDER_TYPES.includes(sp.type as OrderType) ? (sp.type as OrderType) : undefined;

  const where: Prisma.OrderWhereInput = {
    archived: archive,
    ...(sp.status === "open" ? { status: { notIn: CLOSED_STATUSES } } : status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(sp.assignee === "none" ? { assigneeId: null } : sp.assignee ? { assigneeId: sp.assignee } : {}),
    ...(q
      ? {
          OR: [
            ...(num !== null && num <= 2_147_483_647 ? [{ number: num }] : []),
            { title: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
            { client: { companyName: { contains: q, mode: "insensitive" } } },
            { deviceModel: { contains: q, mode: "insensitive" } },
            { deviceBrand: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total, staff] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { client: { select: { id: true, name: true } }, assignee: { select: { name: true, email: true } } },
    }),
    db.order.count({ where }),
    getStaffUsers(),
  ]);
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={archive ? t("archiveTitle") : t("title")}
        actions={
          <>
            <Button asChild variant="outline">
              {archive ? (
                <Link href="/admin/orders"><ClipboardList />{t("showActive")}</Link>
              ) : (
                <Link href="/admin/orders?archive=1"><Archive />{t("showArchive")}</Link>
              )}
            </Button>
            <Button asChild><Link href="/admin/orders/new"><Plus />{t("new")}</Link></Button>
          </>
        }
      />

      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]" role="search">
        {archive && <input type="hidden" name="archive" value="1" />}
        <Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} aria-label={tc("search")} />
        <Select name="status" defaultValue={sp.status ?? ""} aria-label={t("status")}>
          <option value="">{t("allStatuses")}</option>
          <option value="open">{t("openOnly")}</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
        </Select>
        <Select name="type" defaultValue={sp.type ?? ""} aria-label={t("type")}>
          <option value="">{t("allTypes")}</option>
          {ORDER_TYPES.map((x) => <option key={x} value={x}>{tt(x)}</option>)}
        </Select>
        <Select name="assignee" defaultValue={sp.assignee ?? ""} aria-label={t("assignee")}>
          <option value="">{t("allAssignees")}</option>
          <option value="none">{t("unassigned")}</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.email}</option>)}
        </Select>
        <div className="flex gap-2">
          <Button type="submit" variant="outline"><Search />{tc("filter")}</Button>
          <Button asChild variant="ghost"><Link href={archive ? "/admin/orders?archive=1" : "/admin/orders"}>{tc("clear")}</Link></Button>
        </div>
      </form>

      {orders.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{t("number")}</TH>
              <TH>{t("titleField")}</TH>
              <TH>{t("client")}</TH>
              <TH>{t("type")}</TH>
              <TH>{t("status")}</TH>
              <TH>{t("priority")}</TH>
              <TH>{t("assignee")}</TH>
              <TH>{t("dueAt")}</TH>
            </tr>
          </THead>
          <TBody>
            {orders.map((o) => {
              const overdue = o.dueAt && o.dueAt < now && !CLOSED_STATUSES.includes(o.status);
              return (
                <TR key={o.id}>
                  <TD className="font-mono text-xs"><Link href={`/admin/orders/${o.id}`} className="hover:text-primary">{formatOrderNumber(o.number)}</Link></TD>
                  <TD className="max-w-xs">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary">{o.title}</Link>
                    {(o.deviceBrand || o.deviceModel) && (
                      <div className="truncate text-xs text-muted-foreground">{[o.deviceBrand, o.deviceModel].filter(Boolean).join(" ")}</div>
                    )}
                  </TD>
                  <TD><Link href={`/admin/clients/${o.client.id}`} className="hover:text-primary">{o.client.name}</Link></TD>
                  <TD className="whitespace-nowrap">{tt(o.type)}</TD>
                  <TD><StatusBadge status={o.status} /></TD>
                  <TD><PriorityBadge priority={o.priority} /></TD>
                  <TD className="whitespace-nowrap text-muted-foreground">{o.assignee ? (o.assignee.name ?? o.assignee.email) : "—"}</TD>
                  <TD className={overdue ? "whitespace-nowrap font-semibold text-destructive" : "whitespace-nowrap"}>
                    {formatDate(o.dueAt, locale)}
                    {overdue && <span className="sr-only"> ({t("overdue")})</span>}
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
        basePath="/admin/orders"
        params={{ q: q || undefined, status: sp.status, type: sp.type, assignee: sp.assignee, archive: archive ? "1" : undefined }}
      />
    </div>
  );
}
