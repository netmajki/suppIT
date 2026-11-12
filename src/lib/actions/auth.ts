"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { homeForRole } from "@/lib/roles";
import { routing } from "@/i18n/routing";

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
