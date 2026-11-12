"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changeOwnPassword } from "@/lib/actions/users";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const t = useTranslations("Settings");
  const te = useTranslations("Errors");
  const [state, action] = useActionState(changeOwnPassword, {});
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  return (
    <form action={action} className="max-w-sm space-y-4" key={state.ok ? "done" : "form"}>
      <FormAlert code={state.message} ok={state.ok} ns="Success" />
      <FormField label={t("currentPassword")} htmlFor="current" error={err("current")}>
        <Input id="current" name="current" type="password" autoComplete="current-password" />
      </FormField>
      <FormField label={t("newPassword")} htmlFor="password" error={err("password")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" />
      </FormField>
      <FormField label={t("confirmPassword")} htmlFor="confirm" error={err("confirm")}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
      </FormField>
      <SubmitButton>{t("changePassword")}</SubmitButton>
    </form>
  );
}
