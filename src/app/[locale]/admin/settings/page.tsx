import { getTranslations, setRequestLocale } from "next-intl/server";
import { adminOnlyPage } from "@/lib/admin-only";
import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await adminOnlyPage();
  const [t, s] = await Promise.all([getTranslations("Settings"), getAllSettings()]);
  return (
    <SettingsForm
      values={s}
      groups={[
        {
          fields: [
            { key: "company.name", label: t("companyName") },
            { key: "company.email", label: t("companyEmail"), type: "email" },
            { key: "company.phone", label: t("companyPhone") },
            { key: "company.phoneCountryCode", label: t("phoneCountryCode"), hint: t("phoneCountryCodeHint") },
            { key: "company.address", label: t("companyAddress"), type: "textarea" },
            {
              key: "company.currency",
              label: t("currency"),
              type: "select",
              options: ["EUR", "PLN", "CHF"].map((c) => ({ value: c, label: c })),
            },
            {
              key: "theme.default",
              label: t("theme"),
              type: "select",
              options: [
                { value: "system", label: t("themeSystem") },
                { value: "light", label: t("themeLight") },
                { value: "dark", label: t("themeDark") },
              ],
            },
            { key: "company.logoUrl", label: t("logo"), type: "image", hint: t("logoHint") },
          ],
        },
      ]}
    />
  );
}
