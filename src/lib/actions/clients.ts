"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { emptyToUndef, formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireAdmin, requireStaff } from "@/lib/guards";
import { normalizePhone } from "@/lib/phone";
import { getCompanySettings } from "@/lib/settings";

const optStr = z.preprocess(emptyToUndef, z.string().trim().max(500).optional());
const phoneField = (cc: string) => z.preprocess(
  emptyToUndef,
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return undefined;
      const n = normalizePhone(v, cc);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "invalidPhone" });
        return z.NEVER;
      }
      return n;
    }),
);

const clientSchema = (cc: string) => z
  .object({
    name: z.string({ error: "required" }).trim().min(1, "required").max(200),
    companyName: optStr,
    email: z.preprocess(emptyToUndef, z.string().trim().toLowerCase().email("invalidEmail").optional()),
    phone: phoneField(cc),
    whatsapp: phoneField(cc),
    notifyEmail: z.preprocess((v) => v === "on", z.boolean()),
    notifyWhatsapp: z.preprocess((v) => v === "on", z.boolean()),
    locale: z.enum(["pl", "de", "en"]).default("de"),
    street: optStr,
    postalCode: optStr,
    city: optStr,
    country: optStr,
    taxId: optStr,
    notes: z.preprocess(emptyToUndef, z.string().max(5000).optional()),
    password: z.preprocess(emptyToUndef, z.string().min(8, "passwordTooShort").max(200).optional()),
  })
  .superRefine((d, ctx) => {
    if (d.notifyWhatsapp && !d.whatsapp) ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "whatsappRequired" });
    if (d.notifyEmail && !d.email) ctx.addIssue({ code: "custom", path: ["email"], message: "emailRequiredForNotify" });
    if (d.password && !d.email) ctx.addIssue({ code: "custom", path: ["email"], message: "emailRequiredForAccount" });
  });

type ClientInput = z.infer<ReturnType<typeof clientSchema>>;

function clientData({ password: _pw, ...d }: ClientInput) {
  return {
    ...d,
    companyName: d.companyName ?? null,
    email: d.email ?? null,
    phone: d.phone ?? null,
    whatsapp: d.whatsapp ?? null,
    street: d.street ?? null,
    postalCode: d.postalCode ?? null,
    city: d.city ?? null,
    country: d.country ?? null,
    taxId: d.taxId ?? null,
    notes: d.notes ?? null,
  };
}

/** Tworzy/aktualizuje konto CLIENT powiązane z kartoteką klienta. */
async function syncClientAccount(clientId: string, d: ClientInput): Promise<string | null> {
  const existing = await db.user.findUnique({ where: { clientId } });
  if (!existing && !d.password) return null;
  if (!d.email) return existing ? null : "emailRequiredForAccount";

  const taken = await db.user.findUnique({ where: { email: d.email } });
  if (taken && taken.id !== existing?.id) return "emailTaken";

  const passwordHash = d.password ? await bcrypt.hash(d.password, 12) : undefined;
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { email: d.email, name: d.name, locale: d.locale, ...(passwordHash ? { passwordHash } : {}) },
    });
  } else if (passwordHash) {
    await db.user.create({
      data: { email: d.email, name: d.name, role: "CLIENT", locale: d.locale, passwordHash, clientId },
    });
  }
  return null;
}

function handleError(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ForbiddenError) return { message: "forbidden", values };
  console.error(e);
  return { message: "generic", values };
}

export async function createClient(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  let id: string;
  try {
    await requireStaff();
    const parsed = clientSchema((await getCompanySettings()).phoneCountryCode).safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };

    if (parsed.data.password && parsed.data.email) {
      const taken = await db.user.findUnique({ where: { email: parsed.data.email } });
      if (taken) return { errors: { email: "emailTaken" }, values };
    }
    const client = await db.client.create({ data: clientData(parsed.data) });
    await syncClientAccount(client.id, parsed.data);
    id = client.id;
  } catch (e) {
    return handleError(e, values);
  }
  revalidatePath("/[locale]/admin/clients", "page");
  // Powrót do formularza zlecenia, jeśli klient był dodawany z niego
  const returnTo = values.returnTo === "order" ? `/admin/orders/new?clientId=${id}` : `/admin/clients/${id}`;
  redirect({ href: returnTo, locale: await getLocale() });
  return {};
}

export async function updateClient(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = clientSchema((await getCompanySettings()).phoneCountryCode).safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };

    const accountError = await syncClientAccount(id, parsed.data);
    if (accountError) return { errors: { email: accountError }, values };
    await db.client.update({ where: { id }, data: clientData(parsed.data) });
  } catch (e) {
    return handleError(e, values);
  }
  revalidatePath("/[locale]/admin/clients", "layout");
  redirect({ href: `/admin/clients/${id}`, locale: await getLocale() });
  return {};
}

export async function deleteClient(id: string, _prev: FormState): Promise<FormState> {
  try {
    await requireAdmin();
    const orders = await db.order.count({ where: { clientId: id } });
    if (orders > 0) return { message: "clientHasOrders" };
    await db.$transaction([db.user.deleteMany({ where: { clientId: id } }), db.client.delete({ where: { id } })]);
  } catch (e) {
    return handleError(e, {});
  }
  revalidatePath("/[locale]/admin/clients", "page");
  redirect({ href: "/admin/clients", locale: await getLocale() });
  return {};
}
