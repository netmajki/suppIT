"use server";

import { revalidatePath } from "next/cache";
import { encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { formToObject, type FormState } from "@/lib/form";
import { ForbiddenError, requireAdmin } from "@/lib/guards";
import { SETTINGS, isSettingKey, type SettingKey } from "@/lib/settings-registry";
import { getNotificationConfig } from "@/lib/notifications/config";
import { sendEmail } from "@/lib/notifications/email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { emailHtml } from "@/lib/notifications/templates";
import { normalizePhone } from "@/lib/phone";

/** Walidacje wybranych pól (kod błędu z Errors.*). */
function validate(key: SettingKey, v: string): string | null {
  if (!v) return null;
  if (key === "company.email" || key === "notifications.adminEmail") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "invalidEmail";
  if (key === "company.phoneCountryCode") return /^[1-9]\d{0,3}$/.test(v) ? null : "invalidNumber";
  if (key === "email.smtpPort") return /^\d{2,5}$/.test(v) ? null : "invalidNumber";
  if (key === "company.logoUrl") return /^(https?:\/\/|\/)/.test(v) ? null : "invalidUrl";
  return null;
}

/**
 * Zapisuje ustawienia z formularza. Zapisywane są tylko klucze obecne w formularzu.
 * Puste pole sekretu = bez zmian; zaznaczony checkbox "clear__<klucz>" = usuń sekret.
 */
export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireAdmin();
    const errors: Record<string, string> = {};
    const updates: { key: SettingKey; value: string }[] = [];
    for (const [k, raw] of Object.entries(values)) {
      if (!isSettingKey(k)) continue;
      const v = raw.trim();
      const def = SETTINGS[k] as { secret?: boolean };
      if (def.secret) {
        if (values[`clear__${k}`] === "on") updates.push({ key: k, value: "" });
        else if (v) updates.push({ key: k, value: encryptSecret(v) });
        continue;
      }
      const err = validate(k, v);
      if (err) errors[k] = err;
      else updates.push({ key: k, value: k.startsWith("legal.") ? raw : v });
    }
    if (Object.keys(errors).length) return { errors, values };
    await db.$transaction(
      updates.map((u) => db.setting.upsert({ where: { key: u.key }, create: { key: u.key, value: u.value }, update: { value: u.value } })),
    );
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: "forbidden", values };
    console.error(e);
    return { message: "generic", values };
  }
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "saved" };
}

/** Wysyła testowy e-mail lub WhatsApp z aktualną konfiguracją. */
export async function sendTestNotification(_prev: FormState, fd: FormData): Promise<FormState> {
  const channel = String(fd.get("channel"));
  const to = String(fd.get("to") ?? "").trim();
  try {
    await requireAdmin();
    const config = await getNotificationConfig();
    const text = "suppIT.me — test ✓";
    if (channel === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { errors: { to: "invalidEmail" }, values: { to, channel } };
      await sendEmail(config.email, { to, subject: text, text, html: emailHtml(text, "suppIT.me") });
    } else {
      const phone = normalizePhone(to);
      if (!phone) return { errors: { to: "invalidPhone" }, values: { to, channel } };
      await sendWhatsApp(config.whatsapp, { to: phone, text, templateParams: ["Test", "#00000", "Test", "-"], language: "de" });
    }
    return { ok: true, message: "testSent", values: { to, channel } };
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: "forbidden" };
    return { message: e instanceof Error ? e.message.slice(0, 500) : String(e), values: { to, channel } };
  }
}

/** Zapis szablonów powiadomień dla jednego kanału i języka (8 statusów). */
export async function saveTemplates(channel: "EMAIL" | "WHATSAPP", locale: "pl" | "de" | "en", _prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireAdmin();
    const { ORDER_STATUSES } = await import("@/lib/order-meta");
    const ops = [];
    for (const status of ORDER_STATUSES) {
      const body = (values[`body_${status}`] ?? "").trim();
      const subject = (values[`subject_${status}`] ?? "").trim() || null;
      const active = values[`active_${status}`] === "on";
      const where = { status_channel_locale: { status, channel, locale } };
      if (!body && active && !subject) {
        // brak własnej treści i włączone → używaj szablonu domyślnego
        ops.push(db.notificationTemplate.deleteMany({ where: { status, channel, locale } }));
      } else {
        const { defaultTemplate } = await import("@/lib/notifications/templates");
        const def = defaultTemplate(status, channel, locale);
        const data = { body: body || def.body, subject: channel === "EMAIL" ? subject ?? def.subject : null, active };
        ops.push(db.notificationTemplate.upsert({ where, create: { status, channel, locale, ...data }, update: data }));
      }
    }
    await db.$transaction(ops);
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: "forbidden", values };
    console.error(e);
    return { message: "generic", values };
  }
  revalidatePath("/[locale]/admin/settings/templates", "page");
  return { ok: true, message: "saved" };
}
