import "server-only";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";

/** Strony ustawień tylko dla administratora — pracownik trafia do "Moje konto". */
export async function adminOnlyPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect({ href: "/admin/settings/account", locale: await getLocale() });
  return session!;
}
