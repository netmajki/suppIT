import "server-only";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";

/** Zalogowany użytkownik + powiązany klient (null, jeśli konto nie jest kontem klienta). */
export async function getClientSession() {
  const session = await auth();
  if (!session) redirect({ href: "/login", locale: await getLocale() });
  const user = await db.user.findUnique({ where: { id: session!.user.id }, include: { client: true } });
  return { session: session!, user, client: user?.client ?? null };
}
