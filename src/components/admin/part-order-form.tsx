"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { FormState } from "@/lib/form";
import { PART_ORDER_STATUSES } from "@/lib/part-meta";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
export type PartFormValues = Partial<Record<
  "partName" | "supplier" | "supplierUrl" | "quantity" | "unitPrice" | "status" | "trackingNumber" | "orderedAt" | "expectedAt" | "notes" | "orderId",
  string
>>;

export function PartOrderForm({
  action,
  part,
  orders,
  returnTo,
  alreadyReceived,
}: {
  action: Action;
  part?: PartFormValues;
  orders: { id: string; label: string }[];
  returnTo?: string;
  alreadyReceived?: boolean;
}) {
  const t = useTranslations("PartOrders");
  const ts = useTranslations("PartOrderStatus");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values;
  const val = (k: keyof PartFormValues) => v?.[k] ?? part?.[k] ?? "";
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  const [status, setStatus] = useState(val("status") || "REQUESTED");

  return (
    <form action={formAction} key={JSON.stringify(v ?? {})} className="space-y-6" noValidate>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <FormAlert code={state.message} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-6">
          <FormField label={t("partName")} htmlFor="partName" error={err("partName")} className="sm:col-span-6">
            <Input id="partName" name="partName" defaultValue={val("partName")} required />
          </FormField>
          <FormField label={t("order")} htmlFor="orderId" className="sm:col-span-6">
            <Select id="orderId" name="orderId" defaultValue={val("orderId")}>
              <option value="">{t("noOrder")}</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </FormField>
          <FormField label={t("supplier")} htmlFor="supplier" className="sm:col-span-3">
            <Input id="supplier" name="supplier" defaultValue={val("supplier")} />
          </FormField>
          <FormField label={t("supplierUrl")} htmlFor="supplierUrl" error={err("supplierUrl")} className="sm:col-span-3">
            <Input id="supplierUrl" name="supplierUrl" type="url" placeholder="https://" defaultValue={val("supplierUrl")} />
          </FormField>
          <FormField label={t("quantity")} htmlFor="quantity" error={err("quantity")} className="sm:col-span-2">
            <Input id="quantity" name="quantity" type="number" min={1} defaultValue={val("quantity") || "1"} />
          </FormField>
          <FormField label={t("unitPrice")} htmlFor="unitPrice" error={err("unitPrice")} className="sm:col-span-2">
            <Input id="unitPrice" name="unitPrice" inputMode="decimal" defaultValue={val("unitPrice")} />
          </FormField>
          <FormField label={t("status")} htmlFor="status" className="sm:col-span-2">
            <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {PART_ORDER_STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
            </Select>
          </FormField>
          <FormField label={t("orderedAt")} htmlFor="orderedAt" error={err("orderedAt")} className="sm:col-span-2">
            <Input id="orderedAt" name="orderedAt" type="date" defaultValue={val("orderedAt")} />
          </FormField>
          <FormField label={t("expectedAt")} htmlFor="expectedAt" error={err("expectedAt")} className="sm:col-span-2">
            <Input id="expectedAt" name="expectedAt" type="date" defaultValue={val("expectedAt")} />
          </FormField>
          <FormField label={t("trackingNumber")} htmlFor="trackingNumber" className="sm:col-span-2">
            <Input id="trackingNumber" name="trackingNumber" defaultValue={val("trackingNumber")} />
          </FormField>
          {status === "RECEIVED" && !alreadyReceived && (
            <Label className="flex items-center gap-2 sm:col-span-6">
              <Checkbox name="addToStock" defaultChecked /> {t("addToStock")}
            </Label>
          )}
          <FormField label={t("notes")} htmlFor="notes" className="sm:col-span-6">
            <Textarea id="notes" name="notes" defaultValue={val("notes")} />
          </FormField>
        </CardContent>
      </Card>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
