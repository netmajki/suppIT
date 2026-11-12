import { ChevronRight, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatOrderNumber } from "@/lib/order-meta";
import { isStaff } from "@/lib/roles";
import { getCompanySettings } from "@/lib/settings";
import { getClientSession } from "@/lib/client-session";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ClientPanel({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session, client } = await getClientSession();
  const [t, tt, company] = await Promise.all([getTranslations("Panel"), getTranslations("OrderType"), getCompanySettings()]);

  if (!client) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-muted-foreground">{t("noClient")}</p>
          {isStaff(session.user.role) && <Button asChild><Link href="/admin">{t("goAdmin")}</Link></Button>}
        </CardContent>
      </Card>
    );
  }

  const orders = await db.order.findMany({
    where: { clientId: client.id },
    orderBy: [{ archived: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2>{t("title")}</h2>
          <p className="text-muted-foreground">{t("welcome", { name: client.name })}</p>
        </div>
        <Button asChild variant="outline"><Link href="/repair"><Plus />{t("newRequest")}</Link></Button>
      </div>
      {orders.length === 0 ? (
        <Card><CardContent className="p-6 text-muted-foreground">{t("empty")}</CardContent></Card>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/panel/orders/${o.id}`} className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{formatOrderNumber(o.number)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="truncate font-medium">{o.title}</p>
                    <p className="text-sm text-muted-foreground">{tt(o.type)} · {t("updated")}: {formatDate(o.updatedAt, locale)}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">{t("questions", { email: company.email })}</p>
    </>
  );
}
