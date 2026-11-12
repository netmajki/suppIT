import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatOrderNumber } from "@/lib/order-meta";
import { getStaffUsers } from "@/lib/order-queries";
import { CalendarView } from "@/components/admin/calendar-view";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const [t, orders, staff] = await Promise.all([
    getTranslations("Calendar"),
    db.order.findMany({
      where: { archived: false },
      orderBy: { number: "desc" },
      take: 300,
      select: { id: true, number: true, title: true, client: { select: { name: true } } },
    }),
    getStaffUsers(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <CalendarView
        currentUserId={session!.user.id}
        orders={orders.map((o) => ({ id: o.id, label: `${formatOrderNumber(o.number)} ${o.title} · ${o.client.name}` }))}
        staff={staff.map((s) => ({ id: s.id, label: s.name ?? s.email }))}
      />
    </div>
  );
}
