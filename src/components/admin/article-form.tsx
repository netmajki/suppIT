"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { FormState } from "@/lib/form";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function ArticleForm({ action, initial, categories }: { action: Action; initial?: Record<string, string>; categories: string[] }) {
  const t = useTranslations("AdminArticles");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const [state, formAction] = useActionState(action, {});
  const v = state.values ?? initial ?? {};
  const err = (k: string) => (state.errors?.[k] ? te(state.errors[k] as never) : undefined);
  const filled = Object.fromEntries(["pl", "de", "en"].map((l) => [l, !!(v[`title_${l}`] || v[`content_${l}`])]));
  const errored = Object.fromEntries(["pl", "de", "en"].map((l) => [l, Object.keys(state.errors ?? {}).some((k) => k.endsWith(`_${l}`))]));

  return (
    <form action={formAction} key={JSON.stringify(state.values ?? {})} className="space-y-6" noValidate>
      <FormAlert code={state.message} />
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField label={t("category")} htmlFor="category">
            <Input id="category" name="category" list="article-categories" defaultValue={v.category ?? ""} />
            <datalist id="article-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </FormField>
          <FormField label={t("coverImage")} htmlFor="coverImage" error={err("coverImage")}>
            <Input id="coverImage" name="coverImage" type="url" placeholder="https://" defaultValue={v.coverImage ?? ""} />
          </FormField>
          <Label className="flex items-center gap-2">
            <Checkbox name="published" defaultChecked={v.published === "on"} /> {t("published")}
          </Label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("languages")}</CardTitle></CardHeader>
        <CardContent>
          <LocaleTabs
            filled={filled}
            errored={errored}
            render={(l) => (
              <div className="grid gap-4">
                <FormField label={t("articleTitle")} htmlFor={`title_${l}`} error={err(`title_${l}`)}>
                  <Input id={`title_${l}`} name={`title_${l}`} defaultValue={v[`title_${l}`] ?? ""} />
                </FormField>
                <FormField label={t("slug")} htmlFor={`slug_${l}`} error={err(`slug_${l}`)} hint={t("slugHint")}>
                  <Input id={`slug_${l}`} name={`slug_${l}`} defaultValue={v[`slug_${l}`] ?? ""} className="font-mono text-sm" />
                </FormField>
                <FormField label={t("excerpt")} htmlFor={`excerpt_${l}`}>
                  <Textarea id={`excerpt_${l}`} name={`excerpt_${l}`} rows={2} defaultValue={v[`excerpt_${l}`] ?? ""} />
                </FormField>
                <FormField label={t("content")} htmlFor={`content_${l}`} error={err(`content_${l}`)} hint={t("markdownHint")}>
                  <Textarea id={`content_${l}`} name={`content_${l}`} rows={16} className="font-mono text-sm" defaultValue={v[`content_${l}`] ?? ""} />
                </FormField>
              </div>
            )}
          />
        </CardContent>
      </Card>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
