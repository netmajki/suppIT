"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendTestNotification } from "@/lib/actions/settings";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Input } from "@/components/ui/input";

export function TestNotificationForm({ channel, label, defaultTo }: { channel: "email" | "whatsapp"; label: string; defaultTo?: string }) {
  const t = useTranslations("Settings");
  const te = useTranslations("Errors");
  const [state, action] = useActionState(sendTestNotification, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="channel" value={channel} />
      <label className="text-sm font-medium" htmlFor={`test-${channel}`}>{label}</label>
      <div className="flex gap-2">
        <Input id={`test-${channel}`} name="to" defaultValue={state.values?.to ?? defaultTo} />
        <SubmitButton variant="outline"><Send />{t("sendTest")}</SubmitButton>
      </div>
      {state.errors?.to && <p className="text-xs text-destructive">{te(state.errors.to as never)}</p>}
      <FormAlert code={state.message} ok={state.ok} ns="Success" />
    </form>
  );
}
