"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { FormState } from "@/lib/form";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
type Option = { id: string; label: string };
export type ItemFormValues = Partial<Record<
  "name" | "sku" | "category" | "ownership" | "quantity" | "minQuantity" | "location" | "serialNumber" | "purchasePrice" | "salePrice" | "notes" | "clientId" | "orderId",
  string
>>;

export function InventoryForm({
  action,
  item,
  clients,
  orders,
  categories,
}: {
  action: Action;
  item?: ItemFormValues;
  clients: Option[];
  orders: Option[];
  categories: string[];
}) {
  const t = useTranslations("Inventory");
  const to = useTranslations("Ownership");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values;
  const val = (k: keyof ItemFormValues) => v?.[k] ?? item?.[k] ?? "";
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  const [ownership, setOwnership] = useState(val("ownership") || "COMPANY");

  return (
    <form action={formAction} key={JSON.stringify(v ?? {})} className="space-y-6" noValidate>
      <FormAlert code={state.message} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-6">
          <FormField label={t("ownership")} htmlFor="ownership" className="sm:col-span-2">
            <Select id="ownership" name="ownership" value={ownership} onChange={(e) => setOwnership(e.target.value)}>
              <option value="COMPANY">{to("COMPANY")}</option>
              <option value="CLIENT">{to("CLIENT")}</option>
            </Select>
          </FormField>
          {ownership === "CLIENT" && (
            <FormField label={t("client")} htmlFor="clientId" error={err("clientId")} className="sm:col-span-4">
              <Select id="clientId" name="clientId" defaultValue={val("clientId")}>
                <option value="">{t("noClient")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </FormField>
          )}
          <FormField label={t("name")} htmlFor="name" error={err("name")} className="sm:col-span-6">
            <Input id="name" name="name" defaultValue={val("name")} required />
          </FormField>
          <FormField label={t("sku")} htmlFor="sku" className="sm:col-span-2">
            <Input id="sku" name="sku" defaultValue={val("sku")} />
          </FormField>
          <FormField label={t("category")} htmlFor="category" className="sm:col-span-2">
            <Input id="category" name="category" list="categories" defaultValue={val("category")} />
            <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </FormField>
          <FormField label={t("serialNumber")} htmlFor="serialNumber" className="sm:col-span-2">
            <Input id="serialNumber" name="serialNumber" defaultValue={val("serialNumber")} />
          </FormField>
          <FormField label={t("quantity")} htmlFor="quantity" error={err("quantity")} className="sm:col-span-2">
            <Input id="quantity" name="quantity" type="number" min={0} defaultValue={val("quantity") || "1"} />
          </FormField>
          {ownership === "COMPANY" && (
            <FormField label={t("minQuantity")} htmlFor="minQuantity" error={err("minQuantity")} className="sm:col-span-2">
              <Input id="minQuantity" name="minQuantity" type="number" min={0} defaultValue={val("minQuantity") || "0"} />
            </FormField>
          )}
          <FormField label={t("location")} htmlFor="location" className="sm:col-span-2">
            <Input id="location" name="location" defaultValue={val("location")} />
          </FormField>
          {ownership === "COMPANY" && (
            <>
              <FormField label={t("purchasePrice")} htmlFor="purchasePrice" error={err("purchasePrice")} className="sm:col-span-3">
                <Input id="purchasePrice" name="purchasePrice" inputMode="decimal" defaultValue={val("purchasePrice")} />
              </FormField>
              <FormField label={t("salePrice")} htmlFor="salePrice" error={err("salePrice")} className="sm:col-span-3">
                <Input id="salePrice" name="salePrice" inputMode="decimal" defaultValue={val("salePrice")} />
              </FormField>
            </>
          )}
          <FormField label={t("order")} htmlFor="orderId" className="sm:col-span-6">
            <Select id="orderId" name="orderId" defaultValue={val("orderId")}>
              <option value="">{t("noOrder")}</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </FormField>
          <FormField label={t("notes")} htmlFor="notes" className="sm:col-span-6">
            <Textarea id="notes" name="notes" defaultValue={val("notes")} />
          </FormField>
        </CardContent>
      </Card>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
