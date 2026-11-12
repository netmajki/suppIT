import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin");
  const session = await auth();

  const [open, clients, ready] = await Promise.all([
    db.order.count({ where: { archived: false, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    db.client.count(),
    db.order.count({ where: { archived: false, status: "READY" } }),
  ]);

  const stats = [
    { label: t("statOpenOrders"), value: open },
    { label: t("statReady"), value: ready },
    { label: t("statClients"), value: clients },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2>{t("dashboard")}</h2>
        <p className="text-muted-foreground">{t("welcome", { name: session?.user.name ?? "" })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">{s.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}
