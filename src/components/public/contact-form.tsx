"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitContactMessage } from "@/lib/actions/public";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const t = useTranslations("Contact");
  const te = useTranslations("Errors");
  const [state, action] = useActionState(submitContactMessage, {});
  const v = state.values ?? {};
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  if (state.ok) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <CheckCircle2 className="size-6 shrink-0 text-emerald-500" /> <p>{t("success")}</p>
      </div>
    );
  }
  return (
    <form action={action} key={JSON.stringify(state.values ?? {})} className="space-y-4" noValidate>
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <FormAlert code={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("name")} htmlFor="c-name" error={err("name")} className="sm:col-span-2">
          <Input id="c-name" name="name" autoComplete="name" defaultValue={v.name} />
        </FormField>
        <FormField label={t("email")} htmlFor="c-email" error={err("email")}>
          <Input id="c-email" name="email" type="email" autoComplete="email" defaultValue={v.email} />
        </FormField>
        <FormField label={t("phone")} htmlFor="c-phone">
          <Input id="c-phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} />
        </FormField>
        <FormField label={t("message")} htmlFor="c-message" error={err("message")} className="sm:col-span-2">
          <Textarea id="c-message" name="message" rows={6} defaultValue={v.message} />
        </FormField>
      </div>
      <div className="space-y-1">
        <Label className="flex items-start gap-2 font-normal"><Checkbox name="consent" className="mt-0.5" defaultChecked={v.consent === "on"} /> {t("consent")}</Label>
        {err("consent") && <p className="pl-6 text-xs text-destructive">{err("consent")}</p>}
      </div>
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
