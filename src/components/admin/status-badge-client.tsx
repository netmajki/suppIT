"use client";

import type { OrderStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/lib/order-meta";

export function StatusBadgeClient({ status }: { status: OrderStatus }) {
  const t = useTranslations("Status");
  return <Badge tone={statusTone[status]}>{t(status)}</Badge>;
}
