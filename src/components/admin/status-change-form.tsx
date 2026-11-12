"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "@prisma/client";
import { changeOrderStatus } from "@/lib/actions/orders";
import { ORDER_STATUSES } from "@/lib/order-meta";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function StatusChangeForm({
  orderId,
  current,
  channels,
}: {
  orderId: string;
  current: OrderStatus;
  channels: string[];
}) {
  const t = useTranslations("Orders");
  const ts = useTranslations("Status");
  const [state, action] = useActionState(changeOrderStatus.bind(null, orderId), {});
  const [visible, setVisible] = useState(true);
  const nextIdx = Math.min(ORDER_STATUSES.indexOf(current) + 1, ORDER_STATUSES.length - 2);

  return (
    // key: po udanej zmianie formularz wraca do stanu początkowego z nowym "bieżącym" statusem
    <form action={action} key={current} className="space-y-4">
      <FormField label={t("newStatus")} htmlFor="status">
        <Select id="status" name="status" defaultValue={ORDER_STATUSES[nextIdx]}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ts(s)}{s === current ? " ✓" : ""}</option>
          ))}
        </Select>
      </FormField>
      <FormField label={t("statusNote")} htmlFor="note">
        <Textarea id="note" name="note" rows={3} />
      </FormField>
      <div className="space-y-2 text-sm">
        <Label className="flex items-center gap-2">
          <Checkbox name="visibleToClient" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          {t("visibleToClient")}
        </Label>
        <Label className="flex items-center gap-2">
          <Checkbox name="notify" defaultChecked={channels.length > 0} disabled={!visible || channels.length === 0} />
          {t("notifyClient")}
        </Label>
        <p className="pl-6 text-xs text-muted-foreground">
          {channels.length ? t("notifyChannels", { channels: channels.join(", ") }) : t("noChannels")}
        </p>
      </div>
      <FormAlert code={state.message} ok={state.ok} ns="Orders" />
      <SubmitButton className="w-full">{t("changeStatus")}</SubmitButton>
    </form>
  );
}
