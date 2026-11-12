"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { Client } from "@prisma/client";
import type { FormState } from "@/lib/form";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function ClientForm({
  action,
  client,
  accountEmail,
  returnTo,
}: {
  action: Action;
  client?: Client;
  accountEmail?: string | null;
  returnTo?: string;
}) {
  const t = useTranslations("Clients");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values;
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  // Wartość: najpierw to, co użytkownik wpisał (po błędzie), potem dane z bazy
  const val = (k: keyof Client) => v?.[k] ?? ((client?.[k] as string | null | undefined) ?? "");
  const checked = (k: "notifyEmail" | "notifyWhatsapp", def: boolean) => (v ? v[k] === "on" : (client?.[k] ?? def));
  // key wymusza ponowne zamontowanie pól po odpowiedzi serwera (React 19 resetuje formularz)
  const formKey = JSON.stringify(v ?? {});

  return (
    <form action={formAction} key={formKey} className="space-y-6" noValidate>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <FormAlert code={state.message} />

      <Card>
        <CardHeader><CardTitle>{t("sectionContact")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("name")} htmlFor="name" error={err("name")} className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={val("name")} required autoFocus={!client} />
          </FormField>
          <FormField label={t("companyName")} htmlFor="companyName" error={err("companyName")}>
            <Input id="companyName" name="companyName" defaultValue={val("companyName")} />
          </FormField>
          <FormField label={t("taxId")} htmlFor="taxId" error={err("taxId")}>
            <Input id="taxId" name="taxId" defaultValue={val("taxId")} />
          </FormField>
          <FormField label={t("email")} htmlFor="email" error={err("email")}>
            <Input id="email" name="email" type="email" defaultValue={val("email")} />
          </FormField>
          <FormField label={t("phone")} htmlFor="phone" error={err("phone")}>
            <Input id="phone" name="phone" type="tel" defaultValue={val("phone")} />
          </FormField>
          <FormField label={t("whatsapp")} htmlFor="whatsapp" error={err("whatsapp")} hint={t("whatsappHint")}>
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={val("whatsapp")} placeholder="+48…" />
          </FormField>
          <FormField label={t("locale")} htmlFor="locale">
            <Select id="locale" name="locale" defaultValue={val("locale") || "pl"}>
              <option value="pl">Polski</option>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("sectionNotify")}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <Label className="flex items-center gap-2">
            <Checkbox name="notifyEmail" defaultChecked={checked("notifyEmail", true)} /> {t("notifyEmail")}
          </Label>
          <Label className="flex items-center gap-2">
            <Checkbox name="notifyWhatsapp" defaultChecked={checked("notifyWhatsapp", false)} /> {t("notifyWhatsapp")}
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("sectionAddress")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-6">
          <FormField label={t("street")} htmlFor="street" className="sm:col-span-6">
            <Input id="street" name="street" defaultValue={val("street")} />
          </FormField>
          <FormField label={t("postalCode")} htmlFor="postalCode" className="sm:col-span-2">
            <Input id="postalCode" name="postalCode" defaultValue={val("postalCode")} />
          </FormField>
          <FormField label={t("city")} htmlFor="city" className="sm:col-span-2">
            <Input id="city" name="city" defaultValue={val("city")} />
          </FormField>
          <FormField label={t("country")} htmlFor="country" className="sm:col-span-2">
            <Input id="country" name="country" defaultValue={val("country") || "PL"} />
          </FormField>
          <FormField label={t("notes")} htmlFor="notes" className="sm:col-span-6">
            <Textarea id="notes" name="notes" defaultValue={val("notes")} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sectionAccount")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {accountEmail ? t("accountActive", { email: accountEmail }) : t("accountHint")}
          </p>
        </CardHeader>
        <CardContent className="max-w-sm">
          <FormField
            label={accountEmail ? t("accountPasswordReset") : t("accountPassword")}
            htmlFor="password"
            error={err("password")}
          >
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <SubmitButton>{tc("save")}</SubmitButton>
      </div>
    </form>
  );
}
