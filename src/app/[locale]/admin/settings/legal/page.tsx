import { Scale } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { adminOnlyPage } from "@/lib/admin-only";
import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function LegalSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await adminOnlyPage();
  const [t, s] = await Promise.all([getTranslations("Settings"), getAllSettings()]);
  const langs = [["de", "Deutsch"], ["pl", "Polski"], ["en", "English"]] as const;
  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
        <Scale className="mt-0.5 size-4 shrink-0" />{t("legalIntro")}
      </p>
      <SettingsForm
        values={s}
        groups={[
          { title: t("impressum"), fields: langs.map(([l, name]) => ({ key: `legal.impressum.${l}`, label: name, type: "markdown" as const })) },
          { title: t("privacy"), fields: langs.map(([l, name]) => ({ key: `legal.privacy.${l}`, label: name, type: "markdown" as const })) },
        ]}
      />
    </div>
  );
}
