import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { CLOSED_STATUSES, formatOrderNumber } from "@/lib/order-meta";
import { StatusBadge } from "@/components/admin/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin");
  const session = await auth();

  const to = await getTranslations("Orders");
  const tx = await getTranslations("AdminExtra");
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [open, clients, ready, recent, lowStock, partsPending, upcoming] = await Promise.all([
    db.order.count({ where: { archived: false, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    db.client.count(),
    db.order.count({ where: { archived: false, status: "READY" } }),
    db.order.findMany({
      where: { archived: false, status: { notIn: CLOSED_STATUSES } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { client: { select: { name: true } } },
    }),
    db.inventoryItem.count({ where: { ownership: "COMPANY", minQuantity: { gt: 0 }, quantity: { lte: db.inventoryItem.fields.minQuantity } } }),
    db.partOrder.count({ where: { status: { in: ["ORDERED", "SHIPPED"] } } }),
    db.order.findMany({
      where: {
        archived: false,
        status: { notIn: CLOSED_STATUSES },
        OR: [{ scheduledAt: { gte: new Date(), lte: weekAhead } }, { dueAt: { lte: weekAhead } }],
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
      take: 8,
      select: { id: true, number: true, title: true, scheduledAt: true, dueAt: true },
    }),
  ]);

  const stats = [
    { label: t("statOpenOrders"), value: open, href: "/admin/orders?status=open" },
    { label: t("statReady"), value: ready, href: "/admin/orders?status=READY" },
    { label: t("statClients"), value: clients, href: "/admin/clients" },
    { label: tx("statLowStock"), value: lowStock, href: "/admin/inventory?low=1" },
    { label: tx("statPartsPending"), value: partsPending, href: "/admin/part-orders" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2>{t("dashboard")}</h2>
        <p className="text-muted-foreground">{t("welcome", { name: session?.user.name ?? "" })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl transition-shadow hover:shadow-md">
            <Card className="h-full">
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl font-bold">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      {upcoming.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{tx("upcoming")}</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {upcoming.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="hover:text-primary">
                    <span className="font-mono text-xs text-muted-foreground">{formatOrderNumber(o.number)}</span> {o.title}
                  </Link>
                  <span className="flex gap-4 text-muted-foreground">
                    {o.scheduledAt && <span>📅 {formatDate(o.scheduledAt, locale, true)}</span>}
                    {o.dueAt && <span className={o.dueAt < new Date() ? "font-semibold text-destructive" : undefined}>⏰ {formatDate(o.dueAt, locale)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {recent.length > 0 && (
        <div className="space-y-3">
          <h3>{t("statOpenOrders")}</h3>
          <Table>
            <THead>
              <tr><TH>{to("number")}</TH><TH>{to("titleField")}</TH><TH>{to("client")}</TH><TH>{to("status")}</TH><TH>{to("dueAt")}</TH></tr>
            </THead>
            <TBody>
              {recent.map((o) => (
                <TR key={o.id}>
                  <TD className="font-mono text-xs"><Link href={`/admin/orders/${o.id}`} className="hover:text-primary">{formatOrderNumber(o.number)}</Link></TD>
                  <TD><Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary">{o.title}</Link></TD>
                  <TD>{o.client.name}</TD>
                  <TD><StatusBadge status={o.status} /></TD>
                  <TD className="whitespace-nowrap">{formatDate(o.dueAt, locale)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
