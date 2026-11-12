"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { saveSettings } from "@/lib/actions/settings";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "email" | "textarea" | "markdown" | "select" | "secret" | "image";
  options?: { value: string; label: string }[];
  hint?: string;
  /** dla sekretów: czy wartość jest już zapisana */
  isSet?: boolean;
  /** pokaż pole tylko, gdy inne pole ma wskazaną wartość */
  showIf?: { key: string; in: string[] };
  wide?: boolean;
};
export type FieldGroup = { title?: string; fields: FieldDef[] };

export function SettingsForm({ groups, values }: { groups: FieldGroup[]; values: Record<string, string> }) {
  const t = useTranslations("Settings");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, action] = useActionState(saveSettings, {});
  // wartości pól sterujących (np. wybrany dostawca) — do warunkowego pokazywania pól
  const [watch, setWatch] = useState<Record<string, string>>(values);
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  const v = (k: string) => state.values?.[k] ?? values[k] ?? "";

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormAlert code={state.message} ok={state.ok} ns="Success" />
      {groups.map((g, gi) => (
        <Card key={gi}>
          {g.title && <CardHeader><CardTitle>{g.title}</CardTitle></CardHeader>}
          <CardContent className={`grid gap-4 sm:grid-cols-2 ${g.title ? "" : "pt-6"}`}>
            {g.fields.map((f) => {
              const hidden = f.showIf && !f.showIf.in.includes(watch[f.showIf.key] ?? "");
              if (hidden) return null;
              const wide = f.wide || f.type === "textarea" || f.type === "markdown" || f.type === "image";
              return (
                <FormField key={f.key} label={f.label} htmlFor={f.key} error={err(f.key)} hint={f.type === "secret" && f.isSet ? t("secretSet") : f.hint} className={wide ? "sm:col-span-2" : undefined}>
                  {f.type === "select" ? (
                    <Select id={f.key} name={f.key} defaultValue={v(f.key)} onChange={(e) => setWatch((w) => ({ ...w, [f.key]: e.target.value }))}>
                      {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : f.type === "textarea" ? (
                    <Textarea id={f.key} name={f.key} rows={3} defaultValue={v(f.key)} />
                  ) : f.type === "markdown" ? (
                    <Textarea id={f.key} name={f.key} rows={18} className="font-mono text-sm" defaultValue={v(f.key)} />
                  ) : f.type === "image" ? (
                    <ImageUploadField id={f.key} name={f.key} defaultValue={v(f.key)} />
                  ) : f.type === "secret" ? (
                    <div className="space-y-2">
                      <Input id={f.key} name={f.key} type="password" autoComplete="new-password" placeholder={f.isSet ? "••••••••" : ""} />
                      {f.isSet && (
                        <Label className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                          <Checkbox name={`clear__${f.key}`} /> {t("secretClear")}
                        </Label>
                      )}
                    </div>
                  ) : (
                    <Input id={f.key} name={f.key} type={f.type === "email" ? "email" : "text"} defaultValue={v(f.key)} />
                  )}
                </FormField>
              );
            })}
          </CardContent>
        </Card>
      ))}
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
