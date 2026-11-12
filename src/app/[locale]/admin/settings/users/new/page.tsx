import { setRequestLocale } from "next-intl/server";
import { adminOnlyPage } from "@/lib/admin-only";
import { saveStaffUser } from "@/lib/actions/users";
import { UserForm } from "@/components/admin/user-form";

export default async function NewUserPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await adminOnlyPage();
  return <UserForm action={saveStaffUser.bind(null, null)} isNew />;
}
