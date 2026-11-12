import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { adminOnlyPage } from "@/lib/admin-only";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await adminOnlyPage();
  const [t, tr] = await Promise.all([getTranslations("Settings"), getTranslations("Roles")]);
  const users = await db.user.findMany({ where: { role: { in: ["ADMIN", "EMPLOYEE"] } }, orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button asChild><Link href="/admin/settings/users/new"><Plus />{t("newUser")}</Link></Button></div>
      <Table>
        <THead><tr><TH>{t("userName")}</TH><TH>{t("userEmail")}</TH><TH>{t("role")}</TH><TH>{t("language")}</TH><TH /></tr></THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id} className={u.active ? undefined : "opacity-60"}>
              <TD>
                <Link href={`/admin/settings/users/${u.id}`} className="font-medium hover:text-primary">{u.name ?? "—"}</Link>
                {u.id === session.user.id && <Badge tone="blue" className="ml-2">{t("you")}</Badge>}
              </TD>
              <TD className="break-all">{u.email}</TD>
              <TD><Badge tone={u.role === "ADMIN" ? "violet" : "gray"}>{tr(u.role)}</Badge></TD>
              <TD className="uppercase">{u.locale}</TD>
              <TD>{!u.active && <Badge>{t("inactive")}</Badge>}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
