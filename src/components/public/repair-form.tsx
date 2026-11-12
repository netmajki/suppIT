"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { submitRepairRequest } from "@/lib/actions/public";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function RepairForm({ defaultPromo }: { defaultPromo?: string }) {
  const t = useTranslations("Repair");
  const te = useTranslations("Errors");
  const tl = useTranslations("Legal");
  const locale = useLocale();
  const [state, action] = useActionState(submitRepairRequest, {});
  const v = state.values ?? {};
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);

  if (state.ok) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
          <h3>{t("successTitle")}</h3>
          <p className="text-muted-foreground">{t("successText", { number: state.message ?? "" })}</p>
          {v.promo && <p className="font-medium text-primary">{t("promoApplied", { discount: v.promo })}</p>}
          <Button variant="outline" onClick={() => window.location.reload()}>{t("another")}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={action} key={JSON.stringify(state.values ?? {})} className="space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {/* pole-pułapka dla botów */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <FormAlert code={state.message} />

      <Card>
        <CardHeader><CardTitle>{t("sectionYou")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("name")} htmlFor="name" error={err("name")} className="sm:col-span-2">
            <Input id="name" name="name" autoComplete="name" defaultValue={v.name} required />
          </FormField>
          <FormField label={t("email")} htmlFor="email" error={err("email")}>
            <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} required />
          </FormField>
          <FormField label={t("phone")} htmlFor="phone" error={err("phone")}>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} required />
          </FormField>
          <Label className="flex items-start gap-2 font-normal sm:col-span-2">
            <Checkbox name="whatsappOptIn" className="mt-0.5" defaultChecked={v.whatsappOptIn === "on"} /> {t("whatsappOptIn")}
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("sectionDevice")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FormField label={t("type")} htmlFor="type" className="sm:col-span-3">
            <Select id="type" name="type" defaultValue={v.type ?? "SERVICE"}>
              <option value="SERVICE">{t("typeSERVICE")}</option>
              <option value="PURCHASE">{t("typePURCHASE")}</option>
              <option value="WEBSITE">{t("typeWEBSITE")}</option>
            </Select>
          </FormField>
          <FormField label={t("deviceType")} htmlFor="deviceType">
            <Input id="deviceType" name="deviceType" placeholder={t("deviceTypePlaceholder")} defaultValue={v.deviceType} />
          </FormField>
          <FormField label={t("deviceBrand")} htmlFor="deviceBrand">
            <Input id="deviceBrand" name="deviceBrand" defaultValue={v.deviceBrand} />
          </FormField>
          <FormField label={t("deviceModel")} htmlFor="deviceModel">
            <Input id="deviceModel" name="deviceModel" defaultValue={v.deviceModel} />
          </FormField>
          <FormField label={t("description")} htmlFor="description" error={err("description")} className="sm:col-span-3">
            <Textarea id="description" name="description" rows={5} placeholder={t("descriptionPlaceholder")} defaultValue={v.description} required />
          </FormField>
          <FormField label={t("promoCode")} htmlFor="promoCode" error={err("promoCode")}>
            <Input id="promoCode" name="promoCode" className="font-mono uppercase" defaultValue={v.promoCode ?? defaultPromo} />
          </FormField>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <Label className="flex items-start gap-2 font-normal">
          <Checkbox name="consent" className="mt-0.5" defaultChecked={v.consent === "on"} /> {t("consent")}
        </Label>
        <p className="pl-6 text-xs"><Link href="/datenschutz" target="_blank" className="text-primary hover:underline">{tl("readPrivacy")}</Link></p>
        {err("consent") && <p className="pl-6 text-xs text-destructive">{err("consent")}</p>}
      </div>
      <SubmitButton size="lg">{t("submit")}</SubmitButton>
    </form>
  );
}
