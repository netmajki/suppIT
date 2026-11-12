import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/password-forms";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token = "" } = await searchParams;
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("resetTitle")}>
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
