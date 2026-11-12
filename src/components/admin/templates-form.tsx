"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "@prisma/client";
import { saveTemplates } from "@/lib/actions/settings";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { StatusBadgeClient } from "@/components/admin/status-badge-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type TemplateRow = {
  status: OrderStatus;
  subject: string;
  body: string;
  active: boolean;
  defaultSubject: string;
  defaultBody: string;
};

export function TemplatesForm({ channel, locale, rows }: { channel: "EMAIL" | "WHATSAPP"; locale: "pl" | "de" | "en"; rows: TemplateRow[] }) {
  const t = useTranslations("Settings");
  const tc = useTranslations("Common");
  const [state, action] = useActionState(saveTemplates.bind(null, channel, locale), {});
  return (
    <form action={action} className="space-y-4" key={`${channel}-${locale}`}>
      <FormAlert code={state.message} ok={state.ok} ns="Success" />
      {rows.map((r) => (
        <Card key={r.status}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <StatusBadgeClient status={r.status} />
            <Label className="flex items-center gap-2 text-sm font-normal">
              <Checkbox name={`active_${r.status}`} defaultChecked={r.active} /> {t("templateActive")}
            </Label>
          </CardHeader>
          <CardContent className="grid gap-3">
            {channel === "EMAIL" && (
              <FormField label={t("subject")} htmlFor={`subject_${r.status}`}>
                <Input id={`subject_${r.status}`} name={`subject_${r.status}`} defaultValue={r.subject} placeholder={r.defaultSubject} />
              </FormField>
            )}
            <FormField label={t("body")} htmlFor={`body_${r.status}`}>
              <Textarea id={`body_${r.status}`} name={`body_${r.status}`} rows={channel === "EMAIL" ? 7 : 3} defaultValue={r.body} placeholder={r.defaultBody} className="text-sm" />
            </FormField>
          </CardContent>
        </Card>
      ))}
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
