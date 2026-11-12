"use server";

import { z } from "zod";
import type { PartOrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireStaff } from "@/lib/guards";
import { checkbox, intField, money, optDate, optStr } from "@/lib/zod-helpers";
import { PART_ORDER_STATUSES } from "@/lib/part-meta";



const partSchema = z.object({
  partName: z.string({ error: "required" }).trim().min(1, "required").max(200),
  supplier: optStr(200),
  supplierUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().url("invalidUrl").max(1000).optional(),
  ),
  quantity: intField(1),
  unitPrice: money,
  status: z.enum(["REQUESTED", "ORDERED", "SHIPPED", "RECEIVED", "CANCELLED"]),
  trackingNumber: optStr(200),
  orderedAt: optDate,
  expectedAt: optDate,
  notes: optStr(5000),
  orderId: optStr(100),
  addToStock: checkbox,
});

type PartInput = z.infer<typeof partSchema>;

const partData = (d: PartInput) => ({
  partName: d.partName,
  supplier: d.supplier ?? null,
  supplierUrl: d.supplierUrl ?? null,
  quantity: Math.max(1, d.quantity),
  unitPrice: d.unitPrice ?? null,
  status: d.status,
  trackingNumber: d.trackingNumber ?? null,
  orderedAt: d.orderedAt ?? (d.status !== "REQUESTED" && d.status !== "CANCELLED" ? new Date() : null),
  expectedAt: d.expectedAt ?? null,
  notes: d.notes ?? null,
  orderId: d.orderId ?? null,
});

/**
 * Wspólna logika przejścia statusu: ustawia daty i — przy pierwszym odebraniu
 * z zaznaczonym "dodaj do magazynu" — tworzy pozycję w magazynie firmy.
 */
async function applyReceived(
  tx: Prisma.TransactionClient,
  part: { id: string; partName: string; quantity: number; unitPrice: Prisma.Decimal | null; orderId: string | null; receivedAt: Date | null },
  addToStock: boolean,
) {
  if (part.receivedAt) return; // już odebrane wcześniej — nie dubluj stanu
  await tx.partOrder.update({ where: { id: part.id }, data: { receivedAt: new Date() } });
  if (addToStock) {
    await tx.inventoryItem.create({
      data: {
        name: part.partName,
        ownership: "COMPANY",
        quantity: part.quantity,
        purchasePrice: part.unitPrice,
        orderId: part.orderId,
        notes: `PartOrder ${part.id}`,
      },
    });
  }
}

function fail(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ForbiddenError) return { message: "forbidden", values };
  console.error(e);
  return { message: "generic", values };
}

async function back(values: Record<string, string>) {
  const locale = await getLocale();
  redirect({ href: values.returnTo === "order" && values.orderId ? `/admin/orders/${values.orderId}` : "/admin/part-orders", locale });
}

export async function createPartOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = partSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    await db.$transaction(async (tx) => {
      const part = await tx.partOrder.create({ data: partData(parsed.data) });
      if (part.status === "RECEIVED") await applyReceived(tx, part, parsed.data.addToStock);
    });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePath("/[locale]/admin", "layout");
  await back(values);
  return {};
}

export async function updatePartOrder(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = partSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    await db.$transaction(async (tx) => {
      const prev = await tx.partOrder.findUniqueOrThrow({ where: { id } });
      const data = partData(parsed.data);
      const part = await tx.partOrder.update({
        where: { id },
        data: { ...data, orderedAt: parsed.data.orderedAt ?? prev.orderedAt ?? data.orderedAt },
      });
      if (part.status === "RECEIVED") await applyReceived(tx, part, parsed.data.addToStock);
    });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePath("/[locale]/admin", "layout");
  await back(values);
  return {};
}

/** Szybka zmiana statusu z listy. Przy odebraniu część trafia do magazynu. */
export async function setPartOrderStatus(id: string, fd: FormData) {
  await requireStaff();
  const status = String(fd.get("status")) as PartOrderStatus;
  if (!PART_ORDER_STATUSES.includes(status)) return;
  await db.$transaction(async (tx) => {
    const prev = await tx.partOrder.findUniqueOrThrow({ where: { id } });
    const part = await tx.partOrder.update({
      where: { id },
      data: { status, orderedAt: prev.orderedAt ?? (status === "ORDERED" || status === "SHIPPED" ? new Date() : null) },
    });
    if (status === "RECEIVED") await applyReceived(tx, part, true);
  });
  revalidatePath("/[locale]/admin", "layout");
}

export async function deletePartOrder(id: string) {
  await requireStaff();
  await db.partOrder.delete({ where: { id } });
  revalidatePath("/[locale]/admin", "layout");
  redirect({ href: "/admin/part-orders", locale: await getLocale() });
}
