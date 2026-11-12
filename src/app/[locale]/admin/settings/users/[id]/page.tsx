import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { adminOnlyPage } from "@/lib/admin-only";
import { db } from "@/lib/db";
import { saveStaffUser } from "@/lib/actions/users";
import { UserForm } from "@/components/admin/user-form";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await adminOnlyPage();
  const u = await db.user.findUnique({ where: { id } });
  if (!u || u.role === "CLIENT") notFound();
  return (
    <UserForm
      action={saveStaffUser.bind(null, id)}
      isNew={false}
      initial={{ name: u.name ?? "", email: u.email, role: u.role, locale: u.locale, active: u.active ? "on" : "" }}
    />
  );
}
