import "server-only";
import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { getCompanySettings } from "@/lib/settings";
import { getNotificationConfig } from "@/lib/notifications/config";
import { sendEmail } from "@/lib/notifications/email";
import { emailHtml } from "@/lib/notifications/templates";

export type PasswordMailKind = "reset" | "invite";

/** Tworzy jednorazowy token (w bazie tylko hash) i zwraca link do ustawienia hasła. */
export async function createPasswordLink(userId: string, locale: Locale, ttlHours: number) {
  const token = randomToken();
  await db.passwordResetToken.create({
    data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlHours * 3600_000) },
  });
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/${locale}/reset-password?token=${token}`;
}

const mails: Record<Locale, Record<PasswordMailKind, { subject: string; body: string }>> = {
  de: {
    reset: { subject: "Passwort zurücksetzen", body: "Guten Tag {name},\n\nüber den folgenden Link können Sie ein neues Passwort festlegen (gültig 2 Stunden):\n{link}\n\nWenn Sie das nicht angefordert haben, ignorieren Sie diese E-Mail.\n\n{company}" },
    invite: { subject: "Ihr Kundenkonto bei {company}", body: "Guten Tag {name},\n\nfür Sie wurde ein Kundenkonto eingerichtet. Dort sehen Sie den Status Ihrer Aufträge.\nLegen Sie hier Ihr Passwort fest (Link gültig 7 Tage):\n{link}\n\nIhr Login ist Ihre E-Mail-Adresse.\n\n{company}" },
  },
  pl: {
    reset: { subject: "Reset hasła", body: "Dzień dobry {name},\n\npod poniższym linkiem ustawisz nowe hasło (ważny 2 godziny):\n{link}\n\nJeśli to nie Ty, zignoruj tę wiadomość.\n\n{company}" },
    invite: { subject: "Twoje konto klienta w {company}", body: "Dzień dobry {name},\n\nzałożyliśmy dla Ciebie konto klienta — zobaczysz w nim status swoich zleceń.\nUstaw hasło pod tym linkiem (ważny 7 dni):\n{link}\n\nLoginem jest Twój adres e-mail.\n\n{company}" },
  },
  en: {
    reset: { subject: "Reset your password", body: "Hello {name},\n\nuse the link below to set a new password (valid for 2 hours):\n{link}\n\nIf you did not request this, please ignore this e-mail.\n\n{company}" },
    invite: { subject: "Your customer account at {company}", body: "Hello {name},\n\nwe have created a customer account for you where you can follow the status of your orders.\nSet your password here (link valid for 7 days):\n{link}\n\nYour login is your e-mail address.\n\n{company}" },
  },
};

/** Wysyła e-mail z linkiem do ustawienia hasła. Rzuca wyjątek, jeśli e-mail nie jest skonfigurowany. */
export async function sendPasswordEmail(user: { id: string; email: string; name: string | null; locale: Locale }, kind: PasswordMailKind) {
  const link = await createPasswordLink(user.id, user.locale, kind === "reset" ? 2 : 24 * 7);
  const [config, company] = await Promise.all([getNotificationConfig(), getCompanySettings()]);
  const tpl = mails[user.locale][kind];
  const fill = (s: string) => s.replace(/\{name\}/g, user.name ?? "").replace(/\{link\}/g, link).replace(/\{company\}/g, company.name);
  const text = fill(tpl.body);
  await sendEmail(config.email, { to: user.email, subject: fill(tpl.subject), text, html: emailHtml(text, company.name) });
  return link;
}

/** Sprawdza token; zwraca rekord lub null (nieistniejący, użyty, wygasły). */
export async function findValidToken(token: string) {
  if (!token) return null;
  const rec = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date() || !rec.user.active) return null;
  return rec;
}
