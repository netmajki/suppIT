"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formToObject, type FormState } from "@/lib/form";
import { normalizePhone } from "@/lib/phone";
import { getCompanySettings } from "@/lib/settings";

/** Klient zmienia swoje preferencje powiadomień i język. */
export async function updateClientPreferences(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  const session = await auth();
  if (!session?.user.id) return { message: "forbidden" };
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { clientId: true } });
  if (!user?.clientId) return { message: "forbidden" };

  const notifyEmail = values.notifyEmail === "on";
  const notifyWhatsapp = values.notifyWhatsapp === "on";
  const locale = (["pl", "de", "en"] as const).find((l) => l === values.locale) ?? "de";
  let whatsapp: string | null = null;
  if (values.whatsapp?.trim()) {
    whatsapp = normalizePhone(values.whatsapp, (await getCompanySettings()).phoneCountryCode);
    if (!whatsapp) return { errors: { whatsapp: "invalidPhone" }, values };
  }
  if (notifyWhatsapp && !whatsapp) return { errors: { whatsapp: "whatsappRequired" }, values };

  await db.$transaction([
    db.client.update({ where: { id: user.clientId }, data: { notifyEmail, notifyWhatsapp, whatsapp, locale } }),
    db.user.update({ where: { id: session.user.id }, data: { locale } }),
  ]);
  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, message: "saved" };
}
