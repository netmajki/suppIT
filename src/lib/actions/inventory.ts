"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireStaff } from "@/lib/guards";
import { intField, money, optStr } from "@/lib/zod-helpers";

const itemSchema = z
  .object({
    name: z.string({ error: "required" }).trim().min(1, "required").max(200),
    sku: optStr(100),
    category: optStr(100),
    ownership: z.enum(["COMPANY", "CLIENT"]),
    quantity: intField(1),
    minQuantity: intField(0),
    location: optStr(200),
    serialNumber: optStr(200),
    purchasePrice: money,
    salePrice: money,
    notes: optStr(5000),
    clientId: optStr(100),
    orderId: optStr(100),
  })
  .superRefine((d, ctx) => {
    if (d.ownership === "CLIENT" && !d.clientId) ctx.addIssue({ code: "custom", path: ["clientId"], message: "clientRequired" });
  });

type ItemInput = z.infer<typeof itemSchema>;

const itemData = (d: ItemInput) => ({
  name: d.name,
  ownership: d.ownership,
  quantity: d.quantity,
  minQuantity: d.ownership === "COMPANY" ? d.minQuantity : 0,
  sku: d.sku ?? null,
  category: d.category ?? null,
  location: d.location ?? null,
  serialNumber: d.serialNumber ?? null,
  purchasePrice: d.purchasePrice ?? null,
  salePrice: d.salePrice ?? null,
  notes: d.notes ?? null,
  clientId: d.ownership === "CLIENT" ? (d.clientId ?? null) : null,
  orderId: d.orderId ?? null,
});

function fail(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ForbiddenError) return { message: "forbidden", values };
  console.error(e);
  return { message: "generic", values };
}

const listHref = (ownership: string) => (ownership === "CLIENT" ? "/admin/inventory?tab=client" : "/admin/inventory");

export async function createItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = itemSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    await db.inventoryItem.create({ data: itemData(parsed.data) });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePath("/[locale]/admin", "layout");
  redirect({ href: listHref(values.ownership), locale: await getLocale() });
  return {};
}

export async function updateItem(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = itemSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    await db.inventoryItem.update({ where: { id }, data: itemData(parsed.data) });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePath("/[locale]/admin", "layout");
  redirect({ href: listHref(values.ownership), locale: await getLocale() });
  return {};
}

export async function deleteItem(id: string) {
  await requireStaff();
  const item = await db.inventoryItem.delete({ where: { id } });
  revalidatePath("/[locale]/admin", "layout");
  redirect({ href: listHref(item.ownership), locale: await getLocale() });
}

/** Szybka korekta ilości (+1 / −1) z listy magazynu. */
export async function adjustQuantity(id: string, delta: number) {
  await requireStaff();
  const item = await db.inventoryItem.findUniqueOrThrow({ where: { id }, select: { quantity: true } });
  await db.inventoryItem.update({ where: { id }, data: { quantity: Math.max(0, item.quantity + Math.sign(delta)) } });
  revalidatePath("/[locale]/admin/inventory", "page");
}
