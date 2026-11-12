"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { randomToken } from "@/lib/crypto";
import { db } from "@/lib/db";
import { formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireAdmin, requireStaff } from "@/lib/guards";
import { sendPasswordEmail } from "@/lib/password-reset";
import { checkbox } from "@/lib/zod-helpers";

const userSchema = z.object({
  name: z.string({ error: "required" }).trim().min(1, "required").max(200),
  email: z.string({ error: "required" }).trim().toLowerCase().email("invalidEmail").max(200),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  locale: z.enum(["pl", "de", "en"]),
  active: checkbox,
  password: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(8, "passwordTooShort").max(200).optional()),
  sendInvite: checkbox,
});

function fail(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ForbiddenError) return { message: "forbidden", values };
  console.error(e);
  return { message: "generic", values };
}

export async function saveStaffUser(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    const me = await requireAdmin();
    const parsed = userSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    const d = parsed.data;
    const taken = await db.user.findUnique({ where: { email: d.email } });
    if (taken && taken.id !== id) return { errors: { email: "emailTaken" }, values };

    if (id) {
      const existing = await db.user.findUniqueOrThrow({ where: { id } });
      // Nie pozwól odebrać sobie uprawnień ani usunąć ostatniego administratora
      if (existing.role === "ADMIN" && (d.role !== "ADMIN" || !d.active)) {
        if (id === me.id) return { message: "cannotDemoteSelf", values };
        const admins = await db.user.count({ where: { role: "ADMIN", active: true } });
        if (admins <= 1) return { message: "lastAdmin", values };
      }
      await db.user.update({
        where: { id },
        data: {
          name: d.name,
          email: d.email,
          role: d.role,
          locale: d.locale,
          active: d.active,
          ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 12) } : {}),
        },
      });
      if (d.sendInvite) await sendPasswordEmail({ ...existing, email: d.email, name: d.name, locale: d.locale }, "reset");
    } else {
      const user = await db.user.create({
        data: {
          name: d.name,
          email: d.email,
          role: d.role,
          locale: d.locale,
          active: d.active,
          // bez hasła → losowe, nieznane nikomu; użytkownik ustawia je z linku
          passwordHash: await bcrypt.hash(d.password ?? randomToken(), 12),
        },
      });
      if (d.sendInvite || !d.password) await sendPasswordEmail(user, "invite");
    }
  } catch (e) {
    return fail(e, values);
  }
  revalidatePath("/[locale]/admin/settings/users", "page");
  redirect({ href: "/admin/settings/users", locale: await getLocale() });
  return {};
}

/** Zaproszenie klienta do panelu: zakłada konto (jeśli brak) i wysyła link do ustawienia hasła. */
export async function inviteClient(clientId: string, _prev: FormState): Promise<FormState> {
  try {
    await requireStaff();
    const client = await db.client.findUniqueOrThrow({ where: { id: clientId }, include: { user: true } });
    if (!client.email) return { message: "emailRequiredForAccount" };
    let user = client.user;
    if (!user) {
      const taken = await db.user.findUnique({ where: { email: client.email.toLowerCase() } });
      if (taken) return { message: "emailTaken" };
      user = await db.user.create({
        data: {
          email: client.email.toLowerCase(),
          name: client.name,
          role: "CLIENT",
          locale: client.locale,
          clientId,
          passwordHash: await bcrypt.hash(randomToken(), 12),
        },
      });
    }
    await sendPasswordEmail(user, "invite");
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: "forbidden" };
    console.error(e);
    return { message: e instanceof Error && /skonfigurowany/.test(e.message) ? "emailNotConfigured" : "generic" };
  }
  revalidatePath(`/[locale]/admin/clients/${clientId}`, "page");
  return { ok: true, message: "inviteSent" };
}

/** Zmiana własnego hasła (każdy zalogowany użytkownik). */
export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await auth();
  if (!session) return { message: "forbidden" };
  const current = String(fd.get("current") ?? "");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 8) return { errors: { password: "passwordTooShort" } };
  if (password !== confirm) return { errors: { confirm: "passwordMismatch" } };
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { errors: { current: "wrongPassword" } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  return { ok: true, message: "passwordChanged" };
}
