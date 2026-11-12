import "server-only";
import type { Order } from "@prisma/client";
import { db } from "@/lib/db";
import { toDateTimeLocal } from "@/lib/format";
import type { OrderFormValues } from "@/components/admin/order-form";

export const getStaffUsers = () =>
  db.user.findMany({
    where: { role: { in: ["ADMIN", "EMPLOYEE"] }, active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

export const getClientOptions = () =>
  db.client.findMany({ select: { id: true, name: true, companyName: true }, orderBy: { name: "asc" } });

/** Zlecenie → wartości formularza (stringi). */
export function orderToFormValues(o: Order): OrderFormValues {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    clientId: o.clientId,
    type: o.type,
    priority: o.priority,
    assigneeId: s(o.assigneeId),
    title: o.title,
    description: s(o.description),
    deviceType: s(o.deviceType),
    deviceBrand: s(o.deviceBrand),
    deviceModel: s(o.deviceModel),
    serialNumber: s(o.serialNumber),
    accessories: s(o.accessories),
    estimatedCost: s(o.estimatedCost),
    finalCost: s(o.finalCost),
    promoCode: s(o.promoCode),
    scheduledAt: toDateTimeLocal(o.scheduledAt),
    dueAt: toDateTimeLocal(o.dueAt),
    internalNotes: s(o.internalNotes),
  };
}
