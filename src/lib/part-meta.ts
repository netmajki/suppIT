import type { PartOrderStatus } from "@prisma/client";
import type { BadgeTone } from "@/components/ui/badge";

export const PART_ORDER_STATUSES: PartOrderStatus[] = ["REQUESTED", "ORDERED", "SHIPPED", "RECEIVED", "CANCELLED"];
export const ACTIVE_PART_STATUSES: PartOrderStatus[] = ["REQUESTED", "ORDERED", "SHIPPED"];

export const partStatusTone: Record<PartOrderStatus, BadgeTone> = {
  REQUESTED: "amber",
  ORDERED: "blue",
  SHIPPED: "violet",
  RECEIVED: "green",
  CANCELLED: "red",
};
