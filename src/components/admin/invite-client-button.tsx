"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { inviteClient } from "@/lib/actions/users";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";

export function InviteClientButton({ clientId, hasAccount }: { clientId: string; hasAccount: boolean }) {
  const t = useTranslations("Clients");
  const [state, action] = useActionState(inviteClient.bind(null, clientId), {});
  return (
    <form action={action} className="space-y-2">
      <SubmitButton size="sm" variant="outline"><Send />{hasAccount ? t("inviteResend") : t("invite")}</SubmitButton>
      <FormAlert code={state.message} ok={state.ok} ns="Success" />
    </form>
  );
}
