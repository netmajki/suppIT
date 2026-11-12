import { notFound } from "next/navigation";
import { Pencil, Plus, Truck, Mail, MessageCircle, EyeOff, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-meta";
import { partStatusTone } from "@/lib/part-meta";
import { getCompanySettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { PriorityBadge, StatusBadge } from "@/components/admin/status-badge";
import { StatusChangeForm } from "@/components/admin/status-change-form";
import { ArchiveButton } from "@/components/admin/archive-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid grid-cols-[150px_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const order = await db.order.findUnique({
    where: { id },
    include: {
      client: true,
      assignee: { select: { name: true, email: true } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true, email: true } } } },
      notifications: { orderBy: { createdAt: "desc" }, take: 30 },
      items: { orderBy: { createdAt: "asc" } },
      partOrders: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const [t, tt, tsrc, tc, ti, tp, tps, tow, company] = await Promise.all([
    getTranslations("Orders"),
    getTranslations("OrderType"),
    getTranslations("OrderSource"),
    getTranslations("Common"),
    getTranslations("Inventory"),
    getTranslations("PartOrders"),
    getTranslations("PartOrderStatus"),
    getTranslations("Ownership"),
    getCompanySettings(),
  ]);
  const currency = company.currency ?? "EUR";
  const c = order.client;
  const channels = [
    ...(c.notifyEmail && c.email ? ["E-mail"] : []),
    ...(c.notifyWhatsapp && c.whatsapp ? ["WhatsApp"] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-2xl text-muted-foreground">{formatOrderNumber(order.number)}</span>
            {order.title}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
            <Badge>{tt(order.type)}</Badge>
            {order.archived && <Badge tone="gray">{t("archived")}</Badge>}
          </span>
        }
        actions={
          <>
            <ArchiveButton orderId={order.id} archived={order.archived} />
            <Button asChild><Link href={`/admin/orders/${order.id}/edit`}><Pencil />{tc("edit")}</Link></Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{tc("details")}</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label={t("client")}>
                  <Link href={`/admin/clients/${c.id}`} className="font-medium text-primary hover:underline">{c.name}</Link>
                  {c.phone && <span className="text-muted-foreground"> · {c.phone}</span>}
                </Row>
                <Row label={t("assignee")}>{order.assignee ? (order.assignee.name ?? order.assignee.email) : t("unassigned")}</Row>
                <Row label={t("description")}>{order.description && <span className="whitespace-pre-wrap">{order.description}</span>}</Row>
                <Row label={t("deviceType")}>{order.deviceType}</Row>
                <Row label={`${t("deviceBrand")} / ${t("deviceModel")}`}>{[order.deviceBrand, order.deviceModel].filter(Boolean).join(" ")}</Row>
                <Row label={t("serialNumber")}>{order.serialNumber && <span className="font-mono">{order.serialNumber}</span>}</Row>
                <Row label={t("accessories")}>{order.accessories}</Row>
                <Row label={t("estimatedCost")}>{order.estimatedCost !== null ? formatMoney(order.estimatedCost, locale, currency) : null}</Row>
                <Row label={t("finalCost")}>{order.finalCost !== null ? formatMoney(order.finalCost, locale, currency) : null}</Row>
                <Row label={t("promoCode")}>{order.promoCode}</Row>
                <Row label={t("scheduledAt")}>{order.scheduledAt ? formatDate(order.scheduledAt, locale, true) : null}</Row>
                <Row label={t("dueAt")}>{order.dueAt ? formatDate(order.dueAt, locale, true) : null}</Row>
                <Row label={t("createdAt")}>{formatDate(order.createdAt, locale, true)}</Row>
                <Row label={t("source")}>{tsrc(order.source)}</Row>
              </dl>
              {order.internalNotes && (
                <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold"><EyeOff className="size-4" />{t("internalNotes")}</p>
                  <p className="whitespace-pre-wrap">{order.internalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>{ti("items")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/inventory/new?ownership=CLIENT&clientId=${c.id}&orderId=${order.id}`}><Plus />{tow("CLIENT")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/part-orders/new?orderId=${order.id}`}><Truck />{tp("orderPart")}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {order.items.length === 0 && order.partOrders.length === 0 && <p className="text-muted-foreground">{tc("none")}</p>}
              {order.items.length > 0 && (
                <ul className="divide-y rounded-md border">
                  {order.items.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <Link href={`/admin/inventory/${i.id}`} className="font-medium hover:text-primary">
                        {i.name}
                        {i.serialNumber && <span className="ml-2 font-mono text-xs text-muted-foreground">S/N {i.serialNumber}</span>}
                      </Link>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Badge tone={i.ownership === "CLIENT" ? "cyan" : "gray"}>{tow(i.ownership)}</Badge>×{i.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {order.partOrders.length > 0 && (
                <ul className="divide-y rounded-md border">
                  {order.partOrders.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <Link href={`/admin/part-orders/${p.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                        <Truck className="size-4 text-muted-foreground" />{p.partName} ×{p.quantity}
                      </Link>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {p.expectedAt && p.status !== "RECEIVED" && <span className="text-xs">{formatDate(p.expectedAt, locale)}</span>}
                        <Badge tone={partStatusTone[p.status]}>{tps(p.status)}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("timeline")}</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l pl-6">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={h.toStatus} />
                      {!h.visibleToClient && <Badge tone="gray"><EyeOff className="size-3" />{t("internal")}</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(h.createdAt, locale, true)} · {t("by", { name: h.changedBy ? (h.changedBy.name ?? h.changedBy.email) : t("system") })}
                      </span>
                    </div>
                    {h.note && <p className="mt-1 whitespace-pre-wrap text-sm">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("changeStatus")}</CardTitle></CardHeader>
            <CardContent>
              <StatusChangeForm orderId={order.id} current={order.status} channels={channels} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("notifications")}</CardTitle></CardHeader>
            <CardContent>
              {order.notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noNotifications")}</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {order.notifications.map((n) => (
                    <li key={n.id} className="flex gap-2">
                      {n.channel === "EMAIL" ? <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <MessageCircle className="mt-0.5 size-4 shrink-0 text-emerald-600" />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="break-all">{n.recipient}</span>
                          {n.state === "SENT" && <CheckCircle2 className="size-4 text-emerald-600" aria-label={t("notifSENT")} />}
                          {n.state === "FAILED" && <XCircle className="size-4 text-destructive" aria-label={t("notifFAILED")} />}
                          {n.state === "PENDING" && <Clock className="size-4 text-muted-foreground" aria-label={t("notifPENDING")} />}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(n.createdAt, locale, true)} · {t(`notif${n.state}`)}</div>
                        {n.error && <div className="mt-0.5 text-xs break-words text-destructive">{n.error}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
