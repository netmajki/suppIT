import { Lock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { adminOnlyPage } from "@/lib/admin-only";
import { getAllSettings } from "@/lib/settings";
import { SETTINGS, type SettingDef, type SettingKey } from "@/lib/settings-registry";
import { SettingsForm } from "@/components/admin/settings-form";
import { TestNotificationForm } from "@/components/admin/test-notification-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await adminOnlyPage();
  const [t, all] = await Promise.all([getTranslations("Settings"), getAllSettings()]);
  // Sekrety nie trafiają do przeglądarki — tylko informacja, czy są ustawione
  const values: Record<string, string> = {};
  const isSet: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(all)) {
    if ((SETTINGS[k as SettingKey] as SettingDef).secret) isSet[k] = !!v;
    else values[k] = v;
  }
  const smtp = { key: "email.provider", in: ["smtp"] };
  const resend = { key: "email.provider", in: ["resend"] };
  const meta = { key: "whatsapp.provider", in: ["meta"] };
  const twilio = { key: "whatsapp.provider", in: ["twilio"] };
  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="size-4" />{t("secretsNote")}</p>
      <SettingsForm
        values={values}
        groups={[
          { fields: [{ key: "notifications.adminEmail", label: t("adminEmail"), type: "email", hint: t("adminEmailHint") }] },
          {
            title: t("emailSection"),
            fields: [
              {
                key: "email.provider",
                label: t("emailProvider"),
                type: "select",
                options: [
                  { value: "", label: t("providerAuto") },
                  { value: "smtp", label: "SMTP" },
                  { value: "resend", label: "Resend" },
                  { value: "none", label: t("providerNone") },
                ],
              },
              { key: "email.from", label: t("emailFrom") },
              { key: "email.smtpHost", label: t("smtpHost"), showIf: smtp },
              { key: "email.smtpPort", label: t("smtpPort"), showIf: smtp },
              { key: "email.smtpUser", label: t("smtpUser"), showIf: smtp },
              { key: "email.smtpPass", label: t("smtpPass"), type: "secret", isSet: isSet["email.smtpPass"], showIf: smtp },
              { key: "email.resendApiKey", label: t("resendApiKey"), type: "secret", isSet: isSet["email.resendApiKey"], showIf: resend, wide: true },
            ],
          },
          {
            title: t("whatsappSection"),
            fields: [
              {
                key: "whatsapp.provider",
                label: t("whatsappProvider"),
                type: "select",
                options: [
                  { value: "meta", label: t("providerMeta") },
                  { value: "twilio", label: t("providerTwilio") },
                  { value: "none", label: t("providerNone") },
                ],
              },
              { key: "whatsapp.metaPhoneNumberId", label: t("metaPhoneNumberId"), showIf: meta },
              { key: "whatsapp.metaAccessToken", label: t("metaAccessToken"), type: "secret", isSet: isSet["whatsapp.metaAccessToken"], showIf: meta },
              { key: "whatsapp.metaApiVersion", label: t("metaApiVersion"), showIf: meta },
              { key: "whatsapp.metaTemplateName", label: t("metaTemplateName"), hint: t("metaTemplateHint"), showIf: meta, wide: true },
              { key: "whatsapp.twilioAccountSid", label: t("twilioAccountSid"), showIf: twilio },
              { key: "whatsapp.twilioAuthToken", label: t("twilioAuthToken"), type: "secret", isSet: isSet["whatsapp.twilioAuthToken"], showIf: twilio },
              { key: "whatsapp.twilioFrom", label: t("twilioFrom"), showIf: twilio },
              { key: "whatsapp.twilioContentSid", label: t("twilioContentSid"), showIf: twilio },
            ],
          },
        ]}
      />
      <Card>
        <CardHeader><CardTitle>{t("testTitle")}</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <TestNotificationForm channel="email" label={t("testEmailTo")} defaultTo={session.user.email ?? ""} />
          <TestNotificationForm channel="whatsapp" label={t("testWhatsappTo")} />
        </CardContent>
      </Card>
    </div>
  );
}
