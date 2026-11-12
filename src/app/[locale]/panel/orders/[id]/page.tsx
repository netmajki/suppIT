import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@prisma/client";
import { CLOSED_STATUSES, formatOrderNumber } from "@/lib/order-meta";
import { getCompanySettings } from "@/lib/settings";
import { getClientSession } from "@/lib/client-session";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { client } = await getClientSession();
  if (!client) notFound();
  // Klient widzi tylko swoje zlecenia i tylko wpisy oznaczone jako widoczne
  const order = await db.order.findFirst({
    where: { id, clientId: client.id },
    include: {
      statusHistory: { where: { visibleToClient: true }, orderBy: { createdAt: "desc" } },
      items: { where: { ownership: "CLIENT" } },
    },
  });
  if (!order) notFound();
  const [t, ts, tt, company] = await Promise.all([getTranslations("Panel"), getTranslations("Status"), getTranslations("OrderType"), getCompanySettings()]);

  // Pasek postępu: główna ścieżka statusów (bez anulowania)
  const path = ["NEW", "DIAGNOSIS", "IN_PROGRESS", "READY", "COMPLETED"] as const;
  const stepOf: Partial<Record<OrderStatus, number>> = { NEW: 0, DIAGNOSIS: 1, AWAITING_APPROVAL: 1, AWAITING_PARTS: 2, IN_PROGRESS: 2, READY: 3, COMPLETED: 4 };
  const idx = stepOf[order.status] ?? 0;
  const device = [order.deviceType, order.deviceBrand, order.deviceModel].filter(Boolean).join(" ");
  const rows: [string, React.ReactNode][] = [
    [t("device"), device || null],
    [t("serial"), order.serialNumber],
    [t("estimated"), order.estimatedCost !== null ? formatMoney(order.estimatedCost, locale, company.currency) : null],
    [t("final"), order.finalCost !== null ? formatMoney(order.finalCost, locale, company.currency) : null],
    [t("scheduled"), order.scheduledAt ? formatDate(order.scheduledAt, locale, true) : null],
    [t("due"), order.dueAt && !CLOSED_STATUSES.includes(order.status) ? formatDate(order.dueAt, locale) : null],
    [t("created"), formatDate(order.createdAt, locale)],
  ];

  return (
    <>
      <Link href="/panel" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />{t("back")}</Link>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-muted-foreground">{formatOrderNumber(order.number)}</span>
          <StatusBadge status={order.status} />
          <span className="text-sm text-muted-foreground">{tt(order.type)}</span>
        </div>
        <h2>{order.title}</h2>
      </div>

      {order.status !== "CANCELLED" && (
        <ol className="grid grid-cols-5 gap-1" aria-label={t("status")}>
          {path.map((s, i) => (
            <li key={s} className="space-y-1.5">
              <div className={cn("h-2 rounded-full", i <= idx ? "bg-primary" : "bg-muted")} />
              <p className={cn("hidden text-xs sm:block", i === idx ? "font-semibold text-foreground" : "text-muted-foreground")}>{i === idx ? ts(order.status) : ts(s)}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("details")}</CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-2 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {order.description && <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm">{order.description}</p>}
            {order.items.length > 0 && (
              <div className="mt-4 border-t pt-4 text-sm">
                <p className="mb-2 font-medium">{t("equipment")}</p>
                <ul className="list-disc space-y-1 pl-5">{order.items.map((i) => <li key={i.id}>{i.name}{i.serialNumber ? ` (S/N ${i.serialNumber})` : ""}</li>)}</ul>
              </div>
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
                    <span className="text-xs text-muted-foreground">{formatDate(h.createdAt, locale, true)}</span>
                  </div>
                  {h.note && <p className="mt-1 whitespace-pre-wrap text-sm">{h.note}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
