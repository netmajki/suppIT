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
import { Select } from "@/components/ui/select";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function UserForm({ action, initial, isNew }: { action: Action; initial?: Record<string, string>; isNew: boolean }) {
  const t = useTranslations("Settings");
  const tr = useTranslations("Roles");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values ?? initial ?? { role: "EMPLOYEE", locale: "pl", active: "on" };
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  return (
    <form action={formAction} key={JSON.stringify(state.values ?? {})} className="space-y-6" noValidate>
      <FormAlert code={state.message} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField label={t("userName")} htmlFor="name" error={err("name")}><Input id="name" name="name" defaultValue={v.name ?? ""} /></FormField>
          <FormField label={t("userEmail")} htmlFor="email" error={err("email")}><Input id="email" name="email" type="email" defaultValue={v.email ?? ""} /></FormField>
          <FormField label={t("role")} htmlFor="role">
            <Select id="role" name="role" defaultValue={v.role}>
              <option value="EMPLOYEE">{tr("EMPLOYEE")}</option>
              <option value="ADMIN">{tr("ADMIN")}</option>
            </Select>
          </FormField>
          <FormField label={t("language")} htmlFor="locale">
            <Select id="locale" name="locale" defaultValue={v.locale}>
              <option value="pl">Polski</option>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </Select>
          </FormField>
          <FormField label={isNew ? t("passwordOptional") : t("password")} htmlFor="password" error={err("password")} hint={isNew ? t("passwordHintNew") : t("passwordHintEdit")}>
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </FormField>
          <div className="space-y-3 self-end pb-2">
            <Label className="flex items-center gap-2"><Checkbox name="active" defaultChecked={v.active === "on"} /> {t("active")}</Label>
            <Label className="flex items-center gap-2 font-normal"><Checkbox name="sendInvite" defaultChecked={v.sendInvite === "on"} /> {t("sendInvite")}</Label>
          </div>
        </CardContent>
      </Card>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
