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
  const [open, clients, ready, recent] = await Promise.all([
    db.order.count({ where: { archived: false, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    db.client.count(),
    db.order.count({ where: { archived: false, status: "READY" } }),
    db.order.findMany({
      where: { archived: false, status: { notIn: CLOSED_STATUSES } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { client: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: t("statOpenOrders"), value: open },
    { label: t("statReady"), value: ready },
    { label: t("statClients"), value: clients },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2>{t("dashboard")}</h2>
        <p className="text-muted-foreground">{t("welcome", { name: session?.user.name ?? "" })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">{s.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
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
