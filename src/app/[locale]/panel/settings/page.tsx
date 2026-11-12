import { getTranslations, setRequestLocale } from "next-intl/server";
import { getClientSession } from "@/lib/client-session";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ClientPreferencesForm } from "@/components/client-preferences-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { client } = await getClientSession();
  const [t, ts] = await Promise.all([getTranslations("Panel"), getTranslations("Settings")]);
  return (
    <>
      <h2>{t("settings")}</h2>
      {client && (
        <Card>
          <CardHeader>
            <CardTitle>{t("notifyTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("notifyText")}</p>
          </CardHeader>
          <CardContent>
            <ClientPreferencesForm
              initial={{ notifyEmail: client.notifyEmail, notifyWhatsapp: client.notifyWhatsapp, whatsapp: client.whatsapp ?? client.phone ?? "", locale: client.locale }}
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>{ts("accountTitle")}</CardTitle></CardHeader>
        <CardContent><ChangePasswordForm /></CardContent>
      </Card>
    </>
  );
}
