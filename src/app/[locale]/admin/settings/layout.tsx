import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-tabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const t = await getTranslations("Settings");
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("title")} />
      <SettingsTabs isAdmin={session?.user.role === "ADMIN"} />
      {children}
    </div>
  );
}
