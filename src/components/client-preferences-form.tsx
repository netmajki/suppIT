"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateClientPreferences } from "@/lib/actions/panel";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ClientPreferencesForm({ initial }: { initial: { notifyEmail: boolean; notifyWhatsapp: boolean; whatsapp: string; locale: string } }) {
  const t = useTranslations("Panel");
  const tcl = useTranslations("Clients");
  const te = useTranslations("Errors");
  const [state, action] = useActionState(updateClientPreferences, {});
  const v = state.values;
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  return (
    <form action={action} className="max-w-md space-y-4" key={JSON.stringify(v ?? {})}>
      <FormAlert code={state.message} ok={state.ok} ns="Success" />
      <div className="flex flex-wrap gap-6">
        <Label className="flex items-center gap-2"><Checkbox name="notifyEmail" defaultChecked={v ? v.notifyEmail === "on" : initial.notifyEmail} /> {t("notifyEmail")}</Label>
        <Label className="flex items-center gap-2"><Checkbox name="notifyWhatsapp" defaultChecked={v ? v.notifyWhatsapp === "on" : initial.notifyWhatsapp} /> {t("notifyWhatsapp")}</Label>
      </div>
      <FormField label={t("whatsapp")} htmlFor="whatsapp" error={err("whatsapp")} hint={tcl("whatsappHint")}>
        <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={v?.whatsapp ?? initial.whatsapp} />
      </FormField>
      <FormField label={t("language")} htmlFor="locale">
        <Select id="locale" name="locale" defaultValue={v?.locale ?? initial.locale}>
          <option value="de">Deutsch</option>
          <option value="pl">Polski</option>
          <option value="en">English</option>
        </Select>
      </FormField>
      <SubmitButton>{t("save")}</SubmitButton>
    </form>
  );
}
