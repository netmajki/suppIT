"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { homeForRole } from "@/lib/roles";
import { routing } from "@/i18n/routing";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Locale } from "@prisma/client";
import { findValidToken, sendPasswordEmail } from "@/lib/password-reset";
import { isRateLimited } from "@/lib/rate-limit";
import type { FormState } from "@/lib/form";

export type LoginState = { error?: boolean; email?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const localeRaw = String(formData.get("locale") ?? routing.defaultLocale);
  const locale = (routing.locales as readonly string[]).includes(localeRaw) ? localeRaw : routing.defaultLocale;
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: true, email };
    throw e;
  }

  // Bezpieczny callbackUrl: tylko ścieżki względne w obrębie aplikacji
  if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) redirect(callbackUrl);

  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  redirect(`/${locale}${homeForRole(user?.role)}`);
}

export async function logoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? routing.defaultLocale);
  await signOut({ redirectTo: `/${locale}` });
}

/** "Nie pamiętam hasła" — zawsze zwraca sukces (nie zdradza, czy konto istnieje). */
export async function requestPasswordReset(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { errors: { email: "invalidEmail" }, values: { email } };
  if (await isRateLimited("pwreset", 5)) return { message: "tooMany", values: { email } };
  const user = await db.user.findUnique({ where: { email } });
  if (user?.active) {
    try {
      await sendPasswordEmail(user, "reset");
    } catch (e) {
      console.error("[password-reset]", e);
    }
  }
  return { ok: true };
}

/** Ustawienie nowego hasła z linku (reset lub zaproszenie). */
export async function resetPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 8) return { errors: { password: "passwordTooShort" } };
  if (password !== confirm) return { errors: { confirm: "passwordMismatch" } };
  const rec = await findValidToken(token);
  if (!rec) return { message: "invalidToken" };
  await db.$transaction([
    db.user.update({ where: { id: rec.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    db.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    db.passwordResetToken.deleteMany({ where: { userId: rec.userId, usedAt: null, id: { not: rec.id } } }),
  ]);
  return { ok: true, values: { locale: rec.user.locale as Locale } };
}
