"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { emptyToUndef, formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireStaff } from "@/lib/guards";
import { notifyStatusChange } from "@/lib/notifications";
import { ORDER_STATUSES } from "@/lib/order-meta";

const optStr = (max = 500) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const money = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(",", ".").replace(/\s/g, "")) : v),
  z.coerce.number({ error: "invalidNumber" }).min(0, "invalidNumber").max(10_000_000, "invalidNumber").optional(),
);
const dateTime = z.preprocess(
  emptyToUndef,
  z.coerce.date({ error: "invalidDate" }).optional(),
);

const orderSchema = z.object({
  clientId: z.string({ error: "required" }).min(1, "required"),
  type: z.enum(["SERVICE", "PURCHASE", "WEBSITE"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  title: z.string({ error: "required" }).trim().min(1, "required").max(200),
  description: optStr(10_000),
  deviceType: optStr(),
  deviceBrand: optStr(),
  deviceModel: optStr(),
  serialNumber: optStr(),
  accessories: optStr(),
  estimatedCost: money,
  finalCost: money,
  promoCode: optStr(50),
  scheduledAt: dateTime,
  dueAt: dateTime,
  assigneeId: optStr(),
  internalNotes: optStr(10_000),
});

type OrderInput = z.infer<typeof orderSchema>;

const orderData = (d: OrderInput) => ({
  ...d,
  description: d.description ?? null,
  deviceType: d.deviceType ?? null,
  deviceBrand: d.deviceBrand ?? null,
  deviceModel: d.deviceModel ?? null,
  serialNumber: d.serialNumber ?? null,
  accessories: d.accessories ?? null,
  estimatedCost: d.estimatedCost ?? null,
  finalCost: d.finalCost ?? null,
  promoCode: d.promoCode?.toUpperCase() ?? null,
  scheduledAt: d.scheduledAt ?? null,
  dueAt: d.dueAt ?? null,
  assigneeId: d.assigneeId ?? null,
  internalNotes: d.internalNotes ?? null,
});

function handleError(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ForbiddenError) return { message: "forbidden", values };
  console.error(e);
  return { message: "generic", values };
}

export async function createOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  let id: string;
  try {
    const user = await requireStaff();
    const parsed = orderSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };

    const order = await db.order.create({
      data: {
        ...orderData(parsed.data),
        source: "ADMIN",
        statusHistory: { create: { toStatus: "NEW", changedById: user.id, visibleToClient: true } },
      },
    });
    id = order.id;
  } catch (e) {
    return handleError(e, values);
  }
  revalidatePath("/[locale]/admin", "layout");
  redirect({ href: `/admin/orders/${id}`, locale: await getLocale() });
  return {};
}

export async function updateOrder(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = orderSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    await db.order.update({ where: { id }, data: orderData(parsed.data) });
  } catch (e) {
    return handleError(e, values);
  }
  revalidatePath("/[locale]/admin", "layout");
  redirect({ href: `/admin/orders/${id}`, locale: await getLocale() });
  return {};
}

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
  note: optStr(2000),
  visibleToClient: z.preprocess((v) => v === "on", z.boolean()),
  notify: z.preprocess((v) => v === "on", z.boolean()),
});

export async function changeOrderStatus(orderId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    const user = await requireStaff();
    const parsed = statusSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    const { status, note, visibleToClient, notify } = parsed.data;
    const toStatus = status as (typeof ORDER_STATUSES)[number];

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, select: { status: true } });
    if (order.status === toStatus && !note) return { ok: true };

    const change = await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          completedAt: toStatus === "COMPLETED" ? new Date() : toStatus === order.status ? undefined : null,
        },
      });
      return tx.orderStatusChange.create({
        data: { orderId, fromStatus: order.status, toStatus, note: note ?? null, visibleToClient, changedById: user.id },
      });
    });

    // Powiadomienia wysyłane po odpowiedzi — nie blokują interfejsu
    if (notify && visibleToClient) after(() => notifyStatusChange(change.id));
  } catch (e) {
    return handleError(e, values);
  }
  revalidatePath(`/[locale]/admin/orders/${orderId}`, "page");
  return { ok: true, message: "statusChanged" };
}

export async function setOrderArchived(orderId: string, archived: boolean) {
  await requireStaff();
  await db.order.update({ where: { id: orderId }, data: { archived } });
  revalidatePath("/[locale]/admin", "layout");
}
