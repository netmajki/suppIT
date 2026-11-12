"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireStaff } from "@/lib/guards";
import { checkbox, optDate, optStr } from "@/lib/zod-helpers";

const eventSchema = z
  .object({
    id: optStr(100),
    title: z.string({ error: "required" }).trim().min(1, "required").max(200),
    description: optStr(5000),
    start: z.coerce.date({ error: "invalidDate" }),
    end: optDate,
    allDay: checkbox,
    orderId: optStr(100),
    userId: optStr(100),
  })
  .superRefine((d, ctx) => {
    if (d.end && d.end < d.start) ctx.addIssue({ code: "custom", path: ["end"], message: "endBeforeStart" });
  });

/** Tworzy lub aktualizuje wydarzenie (pole id w formularzu). */
export async function saveEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = eventSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    const { id, ...d } = parsed.data;
    const data = {
      title: d.title,
      description: d.description ?? null,
      start: d.start,
      end: d.end ?? null,
      allDay: d.allDay,
      orderId: d.orderId ?? null,
      userId: d.userId ?? null,
    };
    if (id) await db.calendarEvent.update({ where: { id }, data });
    else await db.calendarEvent.create({ data });
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: "forbidden", values };
    console.error(e);
    return { message: "generic", values };
  }
  revalidatePath("/[locale]/admin/calendar", "page");
  return { ok: true };
}

export async function deleteEvent(id: string) {
  await requireStaff();
  await db.calendarEvent.delete({ where: { id } });
}

/**
 * Przesunięcie (drag & drop / zmiana długości) w kalendarzu.
 * kind: "event" — wydarzenie; "scheduled" / "due" — termin zlecenia (synchronizacja z Order).
 */
export async function moveCalendarItem(input: { kind: "event" | "scheduled" | "due"; id: string; start: string; end?: string | null; allDay: boolean }) {
  await requireStaff();
  const start = new Date(input.start);
  const end = input.end ? new Date(input.end) : null;
  if (Number.isNaN(start.getTime())) throw new Error("Invalid date");

  if (input.kind === "event") {
    await db.calendarEvent.update({ where: { id: input.id }, data: { start, end, allDay: input.allDay } });
  } else if (input.kind === "scheduled") {
    await db.order.update({ where: { id: input.id }, data: { scheduledAt: start } });
  } else {
    // Termin zakończenia jest pokazywany jako całodniowy — zachowaj pierwotną godzinę
    const order = await db.order.findUniqueOrThrow({ where: { id: input.id }, select: { dueAt: true } });
    const dueAt = new Date(start);
    if (order.dueAt) dueAt.setHours(order.dueAt.getHours(), order.dueAt.getMinutes(), 0, 0);
    await db.order.update({ where: { id: input.id }, data: { dueAt } });
  }
}
