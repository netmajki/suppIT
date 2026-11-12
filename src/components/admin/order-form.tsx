"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import type { FormState } from "@/lib/form";
import { ORDER_TYPES, PRIORITIES } from "@/lib/order-meta";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/** Zlecenie z polami zserializowanymi do stringów (Decimal/Date nie przechodzą do komponentu klienta). */
export type OrderFormValues = Partial<Record<keyof Order, string>>;

export function OrderForm({
  action,
  order,
  clients,
  staff,
}: {
  action: Action;
  order?: OrderFormValues;
  clients: { id: string; name: string; companyName: string | null }[];
  staff: { id: string; name: string | null; email: string }[];
}) {
  const t = useTranslations("Orders");
  const te = useTranslations("Errors");
  const tt = useTranslations("OrderType");
  const tp = useTranslations("Priority");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values;
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  const val = (k: keyof Order) => v?.[k] ?? order?.[k] ?? "";

  return (
    <form action={formAction} key={JSON.stringify(v ?? {})} className="space-y-6" noValidate>
      <FormAlert code={state.message} />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-6">
          <FormField label={t("client")} htmlFor="clientId" error={err("clientId")} className="sm:col-span-4">
            <Select id="clientId" name="clientId" defaultValue={val("clientId")} required>
              <option value="">{t("chooseClient")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ""}</option>
              ))}
            </Select>
          </FormField>
          <div className="flex items-end sm:col-span-2">
            <Link href="/admin/clients/new?returnTo=order" className="inline-flex h-10 items-center gap-2 text-sm font-medium text-primary hover:underline">
              <UserPlus className="size-4" />{t("addClient")}
            </Link>
          </div>
          <FormField label={t("type")} htmlFor="type" className="sm:col-span-2">
            <Select id="type" name="type" defaultValue={val("type") || "SERVICE"}>
              {ORDER_TYPES.map((x) => <option key={x} value={x}>{tt(x)}</option>)}
            </Select>
          </FormField>
          <FormField label={t("priority")} htmlFor="priority" className="sm:col-span-2">
            <Select id="priority" name="priority" defaultValue={val("priority") || "NORMAL"}>
              {PRIORITIES.map((x) => <option key={x} value={x}>{tp(x)}</option>)}
            </Select>
          </FormField>
          <FormField label={t("assignee")} htmlFor="assigneeId" className="sm:col-span-2">
            <Select id="assigneeId" name="assigneeId" defaultValue={val("assigneeId")}>
              <option value="">{t("unassigned")}</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.email}</option>)}
            </Select>
          </FormField>
          <FormField label={t("titleField")} htmlFor="title" error={err("title")} className="sm:col-span-6">
            <Input id="title" name="title" defaultValue={val("title")} required />
          </FormField>
          <FormField label={t("description")} htmlFor="description" className="sm:col-span-6">
            <Textarea id="description" name="description" defaultValue={val("description")} rows={5} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("sectionDevice")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("deviceType")} htmlFor="deviceType"><Input id="deviceType" name="deviceType" defaultValue={val("deviceType")} /></FormField>
          <FormField label={t("deviceBrand")} htmlFor="deviceBrand"><Input id="deviceBrand" name="deviceBrand" defaultValue={val("deviceBrand")} /></FormField>
          <FormField label={t("deviceModel")} htmlFor="deviceModel"><Input id="deviceModel" name="deviceModel" defaultValue={val("deviceModel")} /></FormField>
          <FormField label={t("serialNumber")} htmlFor="serialNumber"><Input id="serialNumber" name="serialNumber" defaultValue={val("serialNumber")} /></FormField>
          <FormField label={t("accessories")} htmlFor="accessories" className="sm:col-span-2"><Input id="accessories" name="accessories" defaultValue={val("accessories")} /></FormField>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("sectionCosts")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <FormField label={t("estimatedCost")} htmlFor="estimatedCost" error={err("estimatedCost")}>
              <Input id="estimatedCost" name="estimatedCost" inputMode="decimal" defaultValue={val("estimatedCost")} />
            </FormField>
            <FormField label={t("finalCost")} htmlFor="finalCost" error={err("finalCost")}>
              <Input id="finalCost" name="finalCost" inputMode="decimal" defaultValue={val("finalCost")} />
            </FormField>
            <FormField label={t("promoCode")} htmlFor="promoCode">
              <Input id="promoCode" name="promoCode" className="uppercase" defaultValue={val("promoCode")} />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("sectionDates")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <FormField label={t("scheduledAt")} htmlFor="scheduledAt" error={err("scheduledAt")}>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={val("scheduledAt")} />
            </FormField>
            <FormField label={t("dueAt")} htmlFor="dueAt" error={err("dueAt")}>
              <Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={val("dueAt")} />
            </FormField>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormField label={t("internalNotes")} htmlFor="internalNotes">
            <Textarea id="internalNotes" name="internalNotes" defaultValue={val("internalNotes")} />
          </FormField>
        </CardContent>
      </Card>

      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
