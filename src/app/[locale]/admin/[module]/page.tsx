import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Construction } from "lucide-react";
import { adminModules } from "@/lib/admin-nav";
import { Card, CardContent } from "@/components/ui/card";

// Tymczasowa strona dla modułów z kolejnych etapów.
export default async function AdminModulePlaceholder({
  params,
}: {
  params: Promise<{ locale: string; module: string }>;
}) {
  const { locale, module } = await params;
  setRequestLocale(locale);
  const mod = adminModules.find((m) => m.slug === module && m.slug !== "");
  if (!mod) notFound();
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-6">
      <h2>{t(mod.key)}</h2>
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <Construction className="size-5" /> {t("soon")}
        </CardContent>
      </Card>
    </div>
  );
}
