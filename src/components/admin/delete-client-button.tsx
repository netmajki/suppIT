"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteClient } from "@/lib/actions/clients";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";

export function DeleteClientButton({ id }: { id: string }) {
  const t = useTranslations("Common");
  const [state, action] = useActionState(deleteClient.bind(null, id), {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t("confirmDelete"))) e.preventDefault();
      }}
      className="space-y-2"
    >
      <SubmitButton variant="outline" className="text-destructive"><Trash2 />{t("delete")}</SubmitButton>
      <FormAlert code={state.message} />
    </form>
  );
}
