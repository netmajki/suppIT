import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/password-forms";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("forgotTitle")} description={t("forgotText")}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
