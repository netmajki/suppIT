"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { FormState } from "@/lib/form";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function PromotionForm({ action, initial }: { action: Action; initial?: Record<string, string> }) {
  const t = useTranslations("AdminPromotions");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values ?? initial ?? { active: "on", discountType: "PERCENT" };
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  const filled = Object.fromEntries(["pl", "de", "en"].map((l) => [l, !!v[`title_${l}`]]));

  return (
    <form action={formAction} key={JSON.stringify(state.values ?? {})} className="space-y-6" noValidate>
      <FormAlert code={state.message} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-6">
          <FormField label={t("code")} htmlFor="code" error={err("code")} hint={t("codeHint")} className="sm:col-span-6">
            <Input id="code" name="code" className="font-mono uppercase" defaultValue={v.code ?? ""} />
          </FormField>
          <FormField label={t("discountType")} htmlFor="discountType" className="sm:col-span-3">
            <Select id="discountType" name="discountType" defaultValue={v.discountType ?? "PERCENT"}>
              <option value="PERCENT">{t("PERCENT")}</option>
              <option value="FIXED">{t("FIXED")}</option>
            </Select>
          </FormField>
          <FormField label={t("value")} htmlFor="value" error={err("value")} className="sm:col-span-3">
            <Input id="value" name="value" inputMode="decimal" defaultValue={v.value ?? ""} />
          </FormField>
          <FormField label={t("validFrom")} htmlFor="validFrom" error={err("validFrom")} className="sm:col-span-2">
            <Input id="validFrom" name="validFrom" type="date" defaultValue={v.validFrom ?? ""} />
          </FormField>
          <FormField label={t("validTo")} htmlFor="validTo" error={err("validTo")} className="sm:col-span-2">
            <Input id="validTo" name="validTo" type="date" defaultValue={v.validTo ?? ""} />
          </FormField>
          <FormField label={t("maxUses")} htmlFor="maxUses" error={err("maxUses")} hint={t("maxUsesHint")} className="sm:col-span-2">
            <Input id="maxUses" name="maxUses" type="number" min={1} defaultValue={v.maxUses ?? ""} />
          </FormField>
          <Label className="flex items-center gap-2 sm:col-span-6">
            <Checkbox name="active" defaultChecked={v.active === "on"} /> {t("active")}
          </Label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("languages")}</CardTitle></CardHeader>
        <CardContent>
          <LocaleTabs
            filled={filled}
            render={(l) => (
              <div className="grid gap-4">
                <FormField label={t("promoTitle")} htmlFor={`title_${l}`}>
                  <Input id={`title_${l}`} name={`title_${l}`} defaultValue={v[`title_${l}`] ?? ""} />
                </FormField>
                <FormField label={t("promoDescription")} htmlFor={`description_${l}`}>
                  <Textarea id={`description_${l}`} name={`description_${l}`} rows={3} defaultValue={v[`description_${l}`] ?? ""} />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
