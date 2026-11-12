import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Settings");
  return (
    <Card>
      <CardHeader><CardTitle>{t("accountTitle")}</CardTitle></CardHeader>
      <CardContent><ChangePasswordForm /></CardContent>
    </Card>
  );
}
