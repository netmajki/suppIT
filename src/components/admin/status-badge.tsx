import type { OrderStatus, Priority } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { priorityTone, statusTone } from "@/lib/order-meta";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("Status");
  return <Badge tone={statusTone[status]}>{t(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTranslations("Priority");
  return <Badge tone={priorityTone[priority]}>{t(priority)}</Badge>;
}
