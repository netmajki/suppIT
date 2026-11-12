import type { OrderStatus, OrderType, Priority } from "@prisma/client";
import type { BadgeTone } from "@/components/ui/badge";

/** Kolejność statusów w procesie (używana w selektorach i na osi czasu). */
export const ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "DIAGNOSIS",
  "AWAITING_APPROVAL",
  "AWAITING_PARTS",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

export const CLOSED_STATUSES: OrderStatus[] = ["COMPLETED", "CANCELLED"];

export const ORDER_TYPES: OrderType[] = ["SERVICE", "PURCHASE", "WEBSITE"];
export const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export const statusTone: Record<OrderStatus, BadgeTone> = {
  NEW: "blue",
  DIAGNOSIS: "cyan",
  AWAITING_APPROVAL: "amber",
  AWAITING_PARTS: "amber",
  IN_PROGRESS: "violet",
  READY: "green",
  COMPLETED: "gray",
  CANCELLED: "red",
};

export const priorityTone: Record<Priority, BadgeTone> = {
  LOW: "gray",
  NORMAL: "blue",
  HIGH: "amber",
  URGENT: "red",
};

export const formatOrderNumber = (n: number) => `#${String(n).padStart(5, "0")}`;
