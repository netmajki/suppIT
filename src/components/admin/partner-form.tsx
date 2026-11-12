"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { FormState } from "@/lib/form";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function PartnerForm({ action, initial }: { action: Action; initial?: Record<string, string> }) {
  const t = useTranslations("AdminPartners");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values ?? initial ?? { active: "on" };
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  return (
    <form action={formAction} key={JSON.stringify(state.values ?? {})} className="space-y-6" noValidate>
      <FormAlert code={state.message} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField label={t("name")} htmlFor="name" error={err("name")} className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={v.name ?? ""} />
          </FormField>
          <FormField label={t("url")} htmlFor="url" error={err("url")}>
            <Input id="url" name="url" type="url" placeholder="https://" defaultValue={v.url ?? ""} />
          </FormField>
          <FormField label={t("logoUrl")} htmlFor="logoUrl" error={err("logoUrl")}>
            <Input id="logoUrl" name="logoUrl" type="url" placeholder="https://" defaultValue={v.logoUrl ?? ""} />
          </FormField>
          <FormField label={t("sortOrder")} htmlFor="sortOrder" error={err("sortOrder")}>
            <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={v.sortOrder ?? "0"} />
          </FormField>
          <Label className="flex items-center gap-2 self-end pb-2">
            <Checkbox name="active" defaultChecked={v.active === "on"} /> {t("active")}
          </Label>
        </CardContent>
      </Card>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
