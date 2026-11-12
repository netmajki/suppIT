"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset, resetPassword } from "@/lib/actions/auth";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const te = useTranslations("Errors");
  const [state, action] = useActionState(requestPasswordReset, {});
  if (state.ok) {
    return (
      <div className="space-y-4">
        <p role="status" className="flex gap-2 text-sm"><CheckCircle2 className="size-5 shrink-0 text-emerald-500" />{t("forgotSent")}</p>
        <Button asChild variant="outline" className="w-full"><Link href="/login">{t("toLogin")}</Link></Button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert code={state.message} />
      <FormField label="E-mail" htmlFor="email" error={state.errors?.email ? te(state.errors.email as never) : undefined}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
      </FormField>
      <SubmitButton className="w-full">{t("forgotSubmit")}</SubmitButton>
      <p className="text-center text-sm"><Link href="/login" className="text-muted-foreground hover:text-primary">{t("toLogin")}</Link></p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const te = useTranslations("Errors");
  const [state, action] = useActionState(resetPassword, {});
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  if (state.ok) {
    return (
      <div className="space-y-4">
        <p role="status" className="flex gap-2 text-sm"><CheckCircle2 className="size-5 shrink-0 text-emerald-500" />{t("resetDone")}</p>
        <Button asChild className="w-full"><Link href="/login">{t("toLogin")}</Link></Button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormAlert code={state.message} />
      {state.message === "invalidToken" && (
        <p className="text-center text-sm"><Link href="/forgot-password" className="text-primary hover:underline">{t("forgot")}</Link></p>
      )}
      <FormField label={t("newPassword")} htmlFor="password" error={err("password")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </FormField>
      <FormField label={t("confirmPassword")} htmlFor="confirm" error={err("confirm")}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </FormField>
      <SubmitButton className="w-full">{t("resetSubmit")}</SubmitButton>
    </form>
  );
}
