import { notFound } from "next/navigation";
import { Pencil, Plus, Mail, Phone, MessageCircle, MapPin, Bell, UserCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-meta";
import { whatsappLink } from "@/lib/phone";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import { InviteClientButton } from "@/components/admin/invite-client-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const client = await db.client.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      orders: { orderBy: { createdAt: "desc" }, take: 100 },
      equipment: { orderBy: { createdAt: "desc" }, take: 100, include: { order: { select: { id: true, number: true } } } },
    },
  });
  if (!client) notFound();
  const session = await auth();
  const t = await getTranslations("Clients");
  const to = await getTranslations("Orders");
  const tt = await getTranslations("OrderType");
  const tc = await getTranslations("Common");
  const ti = await getTranslations("Inventory");

  const address = [client.street, [client.postalCode, client.city].filter(Boolean).join(" "), client.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        subtitle={client.companyName}
        actions={
          <>
            <Button asChild variant="outline"><Link href={`/admin/clients/${id}/edit`}><Pencil />{tc("edit")}</Link></Button>
            <Button asChild><Link href={`/admin/orders/new?clientId=${id}`}><Plus />{t("newOrder")}</Link></Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle>{t("sectionContact")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="size-4 text-muted-foreground" />{client.phone}</a>
            )}
            {client.whatsapp && (
              <a href={whatsappLink(client.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
                <MessageCircle className="size-4 text-emerald-600" />{client.whatsapp}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 break-all hover:text-primary"><Mail className="size-4 shrink-0 text-muted-foreground" />{client.email}</a>
            )}
            {address && <p className="flex items-start gap-2"><MapPin className="mt-1 size-4 shrink-0 text-muted-foreground" />{address}</p>}
            {client.taxId && <p className="text-muted-foreground">{t("taxId")}: {client.taxId}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Bell className="size-4 text-muted-foreground" />
              {client.notifyEmail && <Badge tone="blue">E-mail</Badge>}
              {client.notifyWhatsapp && <Badge tone="green">WhatsApp</Badge>}
              {!client.notifyEmail && !client.notifyWhatsapp && <span className="text-muted-foreground">{tc("none")}</span>}
              <Badge className="uppercase">{client.locale}</Badge>
            </div>
            {client.user && (
              <p className="flex items-center gap-2 text-muted-foreground"><UserCheck className="size-4" />{t("accountActive", { email: client.user.email })}</p>
            )}
            {client.email && (
              <div className="pt-1"><InviteClientButton clientId={id} hasAccount={!!client.user} /></div>
            )}
            {client.notes && <p className="whitespace-pre-wrap border-t pt-3 text-muted-foreground">{client.notes}</p>}
            {session?.user.role === "ADMIN" && client.orders.length === 0 && (
              <div className="border-t pt-3"><DeleteClientButton id={id} /></div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3>{t("orders")}</h3>
          {client.orders.length === 0 ? (
            <p className="rounded-xl border bg-card p-6 text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <Table>
              <THead>
                <tr><TH>{to("number")}</TH><TH>{to("titleField")}</TH><TH>{to("type")}</TH><TH>{to("status")}</TH><TH>{to("createdAt")}</TH></tr>
              </THead>
              <TBody>
                {client.orders.map((o) => (
                  <TR key={o.id} className={o.archived ? "opacity-60" : undefined}>
                    <TD className="font-mono text-xs"><Link href={`/admin/orders/${o.id}`} className="hover:text-primary">{formatOrderNumber(o.number)}</Link></TD>
                    <TD><Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary">{o.title}</Link></TD>
                    <TD>{tt(o.type)}</TD>
                    <TD><StatusBadge status={o.status} /></TD>
                    <TD className="whitespace-nowrap">{formatDate(o.createdAt, locale)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <h3>{ti("equipment")}</h3>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/inventory/new?ownership=CLIENT&clientId=${id}`}><Plus />{ti("new")}</Link>
            </Button>
          </div>
          {client.equipment.length === 0 ? (
            <p className="rounded-xl border bg-card p-6 text-muted-foreground">{tc("none")}</p>
          ) : (
            <Table>
              <THead>
                <tr><TH>{ti("name")}</TH><TH>{ti("serialNumber")}</TH><TH>{ti("location")}</TH><TH>{ti("order")}</TH></tr>
              </THead>
              <TBody>
                {client.equipment.map((i) => (
                  <TR key={i.id}>
                    <TD><Link href={`/admin/inventory/${i.id}`} className="font-medium hover:text-primary">{i.name}</Link></TD>
                    <TD className="font-mono text-xs">{i.serialNumber ?? "—"}</TD>
                    <TD>{i.location ?? "—"}</TD>
                    <TD className="font-mono text-xs">
                      {i.order ? <Link href={`/admin/orders/${i.order.id}`} className="hover:text-primary">{formatOrderNumber(i.order.number)}</Link> : "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
