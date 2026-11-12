import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import { CLOSED_STATUSES, formatOrderNumber } from "@/lib/order-meta";

export const dynamic = "force-dynamic";

const COLORS = { scheduled: "#1E63D6", due: "#D97706", overdue: "#DC2626", event: "#667180", done: "#8792A2" };

/** Zdarzenia dla FullCalendar: terminy zleceń (zsynchronizowane z Order) + własne wydarzenia. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const start = new Date(sp.get("start") ?? "");
  const end = new Date(sp.get("end") ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return NextResponse.json({ error: "Bad range" }, { status: 400 });
  const mine = sp.get("mine") === "1" ? session.user.id : undefined;

  const [scheduled, due, events] = await Promise.all([
    db.order.findMany({
      where: { archived: false, status: { not: "CANCELLED" }, scheduledAt: { gte: start, lt: end }, ...(mine ? { assigneeId: mine } : {}) },
      select: { id: true, number: true, title: true, status: true, scheduledAt: true, client: { select: { name: true } } },
    }),
    db.order.findMany({
      where: { archived: false, status: { notIn: CLOSED_STATUSES }, dueAt: { gte: start, lt: end }, ...(mine ? { assigneeId: mine } : {}) },
      select: { id: true, number: true, title: true, dueAt: true },
    }),
    db.calendarEvent.findMany({
      where: {
        start: { lt: end },
        OR: [{ end: { gte: start } }, { end: null, start: { gte: start } }],
        ...(mine ? { userId: mine } : {}),
      },
      include: { order: { select: { number: true } } },
    }),
  ]);

  const now = new Date();
  const out = [
    ...scheduled.map((o) => ({
      id: `scheduled:${o.id}`,
      title: `${formatOrderNumber(o.number)} ${o.title} · ${o.client.name}`,
      start: o.scheduledAt!.toISOString(),
      end: new Date(o.scheduledAt!.getTime() + 60 * 60 * 1000).toISOString(),
      color: CLOSED_STATUSES.includes(o.status) ? COLORS.done : COLORS.scheduled,
      durationEditable: false,
      extendedProps: { kind: "scheduled", orderId: o.id },
    })),
    ...due.map((o) => ({
      id: `due:${o.id}`,
      title: `⏰ ${formatOrderNumber(o.number)} ${o.title}`,
      start: o.dueAt!.toISOString(),
      allDay: true,
      color: o.dueAt! < now ? COLORS.overdue : COLORS.due,
      durationEditable: false,
      extendedProps: { kind: "due", orderId: o.id },
    })),
    ...events.map((e) => ({
      id: `event:${e.id}`,
      title: e.order ? `${e.title} (${formatOrderNumber(e.order.number)})` : e.title,
      start: e.start.toISOString(),
      end: e.end?.toISOString(),
      allDay: e.allDay,
      color: COLORS.event,
      extendedProps: {
        kind: "event",
        eventId: e.id,
        rawTitle: e.title,
        description: e.description ?? "",
        orderId: e.orderId ?? "",
        userId: e.userId ?? "",
      },
    })),
  ];
  return NextResponse.json(out);
}
