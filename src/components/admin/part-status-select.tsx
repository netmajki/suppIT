"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { PartOrderStatus } from "@prisma/client";
import { setPartOrderStatus } from "@/lib/actions/part-orders";
import { PART_ORDER_STATUSES } from "@/lib/part-meta";

/** Szybka zmiana statusu zamówienia części (wysyła formularz po wyborze). */
export function PartStatusSelect({ id, status }: { id: string; status: PartOrderStatus }) {
  const t = useTranslations("PartOrderStatus");
  const tp = useTranslations("PartOrders");
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={setPartOrderStatus.bind(null, id)}>
      <select
        name="status"
        defaultValue={status}
        key={status}
        aria-label={tp("setStatus")}
        onChange={() => ref.current?.requestSubmit()}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      >
        {PART_ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
      </select>
    </form>
  );
}
